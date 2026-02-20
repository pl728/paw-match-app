# Cloud Deployment with Terraform

This explains how we deployed the backend and database to Google Cloud Platform (GCP) using Terraform. If you've never heard of Terraform or cloud infrastructure, start here.

## What Problem Does Terraform Solve?

Imagine you need to set up a database, a server, and wire them together on GCP. You could click through the GCP console manually — but then:
- Nobody else on your team knows exactly what you clicked
- You can't reproduce it reliably
- You can't easily tear it down and rebuild it

**Terraform** solves this by letting you describe your infrastructure as code (`.tf` files). You write *what* you want, and Terraform figures out *how* to create it, in the right order, using GCP's APIs. This is called **Infrastructure as Code (IaC)**.

The mental model: **Terraform is to cloud infrastructure what `docker-compose.yml` is to containers** — a declarative description of what should exist.

## How Terraform Works (The Core Loop)

```
You write .tf files          terraform plan            terraform apply
describing what you want  →  shows what will change →  actually does it
                                                             ↓
                                                    terraform.tfstate
                                                    (remembers what exists)
```

Terraform keeps a **state file** (`terraform.tfstate`) that tracks everything it has created. This is how `terraform destroy` knows what to delete — it reads the state, then deletes each resource in reverse order.

**Key commands:**
| Command | What it does |
|---|---|
| `terraform init` | Downloads the GCP provider plugin |
| `terraform plan` | Preview changes without doing anything |
| `terraform apply` | Create/update infrastructure |
| `terraform destroy` | Delete everything in the state file |

## What We Deployed and Why

```
Internet
    │
    ├── Cloud Run: paw-match-frontend   (serves the React app via nginx)
    │       │
    │       └── calls →
    │
    ├── Cloud Run: paw-match-backend    (runs the Express.js API)
    │       │
    │       └── connects via Unix socket →
    │
    ├── Cloud SQL: paw-match-db         (managed MySQL 8.0 database)
    │
    └── Artifact Registry: paw-match    (stores Docker images for both services)
```

**Why Cloud Run?**
Cloud Run is a serverless container platform — you give it a Docker image and it runs it. It scales to zero when nobody is using the app (you pay nothing) and scales up automatically under load. No servers to manage.

**Why Cloud SQL instead of running MySQL ourselves?**
Cloud SQL is GCP's managed MySQL. GCP handles backups, security patches, and uptime. The alternative — running MySQL on a VM — means you're responsible for all of that yourself.

**Why Artifact Registry?**
Docker images have to live somewhere before Cloud Run can pull them. Artifact Registry is GCP's private Docker registry (like Docker Hub, but private and inside GCP).

## How the Backend Connects to the Database

Locally, the backend connects to MySQL over TCP (a normal network connection). On GCP, Cloud Run uses a **Unix socket** instead — a file-based connection at `/cloudsql/PROJECT:REGION:INSTANCE`. GCP mounts this socket automatically when you configure it.

This is why `backend/db/pool.js` was updated: when `CLOUD_SQL_CONNECTION_NAME` is set (only on Cloud Run), it connects via socket. Otherwise it uses `DATABASE_URL` over TCP as normal. **Local development is completely unchanged.**

## The Files

```
terraform/
├── main.tf                   # GCP provider config + enable APIs
├── variables.tf              # Input variables (project ID, passwords, etc.)
├── cloud_sql.tf              # MySQL instance, database, and user
├── artifact_registry.tf      # Docker image registry
├── cloud_run.tf              # Backend Cloud Run service + IAM
├── cloud_run_frontend.tf     # Frontend Cloud Run service + IAM
├── outputs.tf                # Prints useful URLs after apply
└── terraform.tfvars.example  # Template for your actual values (never commit .tfvars)

backend/
├── Dockerfile                # Packages the Express app into a container
└── db/pool.js                # Updated to support Cloud SQL Unix socket

frontend/
├── Dockerfile                # Multi-stage: builds Vite app, serves with nginx
└── nginx.conf                # Routes all URLs to index.html (for React Router)
```

## Step-by-Step: How to Deploy

### Prerequisites
- GCP project with billing enabled
- `gcloud` CLI installed and authenticated
- `terraform` installed (`sudo snap install terraform --classic`)
- `docker` installed

### 1. Authenticate

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default login       # lets Terraform use your credentials
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 2. Configure Variables

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Fill in: project_id, db_password, jwt_secret, image, frontend_image
# Generate strong passwords with: openssl rand -base64 24
```

> **Never commit `terraform.tfvars`** — it contains secrets. It's in `.gitignore`.

### 3. Provision Infrastructure

```bash
cd terraform
terraform init      # download GCP provider
terraform apply     # creates all GCP resources (~10 min, mostly waiting for Cloud SQL)
```

Terraform will print a plan showing exactly what it will create before doing anything. Type `yes` to confirm.

### 4. Build and Push Docker Images

```bash
# Backend
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT/paw-match/backend:latest ./backend
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/paw-match/backend:latest

# Frontend (VITE_API_BASE_URL must be the backend Cloud Run URL from terraform output)
docker build \
  --build-arg VITE_API_BASE_URL=https://YOUR_BACKEND_URL.run.app \
  -t us-central1-docker.pkg.dev/YOUR_PROJECT/paw-match/frontend:latest \
  ./frontend
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/paw-match/frontend:latest
```

> **Why pass the backend URL at build time?** Vite bakes environment variables into the JavaScript bundle when it builds. Unlike the backend (which reads env vars at runtime), the frontend can't read them after the fact. So the backend URL must be known before `docker build`.

### 5. Deploy the Images

```bash
terraform apply   # Cloud Run picks up the new images

# If Cloud Run doesn't detect the new image (same :latest tag), force it:
gcloud run deploy paw-match-backend --region=us-central1 \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT/paw-match/backend:latest
```

### 6. Initialize the Database (One-Time)

Terraform creates the database infrastructure, but not your tables. Run the schema manually:

```bash
gcloud sql connect paw-match-db --user=pawmatch
```

Then inside the MySQL prompt:
```sql
USE paw_match;
SOURCE /path/to/backend/db/schema.sql;
exit
```

### 7. Verify

```bash
curl https://YOUR_BACKEND_URL.run.app/pets   # should return []
```

### 8. Tear Down (When Done)

```bash
cd terraform && terraform destroy
```

This deletes all GCP resources and stops all billing. Your code and `terraform.tfvars` remain locally — run `terraform apply` again anytime to bring everything back up.

## Cost

| Resource | ~Cost |
|---|---|
| Cloud SQL `db-f1-micro` | ~$7/mo |
| Cloud Run | Free at low traffic (pay per request) |
| Artifact Registry | ~$0.10/GB/mo |

**Cloud SQL is the only meaningful cost.** Run `terraform destroy` when not actively using the deployment.
