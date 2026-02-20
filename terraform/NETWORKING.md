# Networking Deep Dive

This document explains how the three pieces of Paw Match communicate, why each channel works the way it does, and the security implications of each design decision.

---

## The Big Picture

There are two completely different kinds of communication in this deployment:

```
[ User's Browser ]
        │
        │  HTTPS (public internet)
        ▼
[ Cloud Run: Frontend ]          ← serves static HTML/JS/CSS
        │
        │  HTTPS (public internet) ← this happens IN THE BROWSER, not on a server
        ▼
[ Cloud Run: Backend ]           ← Express.js API
        │
        │  Unix socket (private, inside GCP)
        ▼
[ Cloud SQL: MySQL ]             ← database, never exposed publicly
```

The top half is public. The bottom connection is completely private. Understanding why is the core of this document.

---

## Part 1: The Public Internet Path (Browser → Backend)

### What Actually Happens

When a user opens the frontend and the page loads, their **browser** (not the frontend server) makes API calls directly to the backend URL. The frontend server's job is done once it delivers the HTML and JavaScript — after that it's out of the picture.

```
1. Browser requests: GET paw-match-frontend.run.app
2. Cloud Run serves: index.html + bundle.js (contains hardcoded backend URL)
3. Browser executes bundle.js
4. bundle.js runs: fetch("https://paw-match-backend.run.app/pets")
5. Browser sends that request directly — Cloud Run frontend is not involved
```

This is what "static site" means. There is no frontend server proxying requests. The backend URL is baked into the JavaScript at build time (via `VITE_API_BASE_URL`) and the browser uses it directly.

### Why the Backend URL Is "Public"

Because the JavaScript runs in the browser, anyone can open DevTools → Network tab and see every request the app makes, including the full backend URL. This is unavoidable for any client-side app (React, Vue, Angular, etc.).

This is fine when your API is designed to be public anyway. It would be a problem if your backend URL was supposed to be secret — but secrets should never live in a frontend bundle regardless.

---

## Part 2: CORS — The Browser's Security Model

### What CORS Is

Browsers enforce a rule called the **Same-Origin Policy**: JavaScript on `site-a.com` cannot read responses from `site-b.com` by default. This exists to prevent malicious websites from silently reading your bank account data using your cookies.

**Origin** = protocol + domain + port. Two URLs are the same origin only if all three match exactly.

Our frontend (`paw-match-frontend.run.app`) calling our backend (`paw-match-backend.run.app`) is a **cross-origin** request — different domains. The browser blocks it by default.

### How CORS Works (The Preflight)

For certain requests (especially ones with custom headers like `Authorization`), the browser first sends a **preflight** — an `OPTIONS` request asking the server "are you okay with requests from this origin?"

```
Browser → Backend:   OPTIONS /pets
                     Origin: https://paw-match-frontend.run.app

Backend → Browser:   200 OK
                     Access-Control-Allow-Origin: https://paw-match-frontend.run.app
                     Access-Control-Allow-Headers: Authorization, Content-Type

Browser → Backend:   GET /pets  (now allowed)
                     Authorization: Bearer eyJ...
```

If the backend doesn't respond with the right headers, the browser refuses to read the response — even if the server returned 200 OK. This is enforced entirely by the browser; `curl` bypasses it completely (no browser, no policy).

### The `*` vs Credentials Problem

We hit this exact error during deployment:

```
Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'
```

`Access-Control-Allow-Origin: *` means "any website can read this response." But browsers have a rule: **you cannot send credentials (auth headers, cookies) to a wildcard origin**. It's an intentional security restriction — wildcard origins are for truly public data.

Our fix in `backend/main.js`:

```js
// Before (broken with credentials):
app.use(cors());                                    // sets origin: *

// After (works with credentials):
app.use(cors({ origin: true, credentials: true })); // echoes back the request origin
```

`origin: true` tells the cors middleware to reflect whatever origin made the request back in the response header. The browser sees a specific origin (not `*`) and allows the credentialed request through.

**Production note:** `origin: true` allows any domain to make credentialed requests to your API. In production you'd whitelist:
```js
app.use(cors({
  origin: 'https://paw-match-frontend.run.app',
  credentials: true
}));
```

---

## Part 3: The Private Channel (Backend → Cloud SQL)

### Why Not TCP?

The most obvious way to connect to a database is TCP — open a socket to `hostname:3306`. Cloud SQL supports this, but it means your database has a public IP address exposed to the internet, which requires careful firewall rules and SSL configuration.

For Cloud Run, GCP offers a better option: **Unix domain sockets**.

### What Is a Unix Socket?

A Unix socket is a file on the filesystem that acts like a network connection — but only within the same machine (or in this case, the same GCP-managed environment). There is no IP address, no port, no network packet. It's just a file path:

```
/cloudsql/paw-match-1:us-central1:paw-match-db
```

Two processes communicate by reading and writing to this file path. It is physically impossible to reach from the public internet — there is no IP to connect to.

### How GCP Wires It Up

When you configure Cloud Run to connect to a Cloud SQL instance (via the `volumes` block in Terraform), GCP automatically runs a **Cloud SQL Auth Proxy** sidecar alongside your container. This proxy:

1. Authenticates to Cloud SQL using the service account's identity (no passwords over the wire)
2. Establishes an encrypted tunnel to Cloud SQL internally
3. Exposes that tunnel as a Unix socket at `/cloudsql/CONNECTION_NAME`

Your app just connects to the socket path. The proxy handles authentication and encryption transparently.

```
Your container                    GCP internal network
─────────────────                 ──────────────────────
mysql.createPool({           →    Cloud SQL Auth Proxy
  socketPath:                     (sidecar, auto-managed)
    "/cloudsql/paw-match-1:         │
     us-central1:paw-match-db"      │ encrypted tunnel
})                                  ▼
                                  Cloud SQL instance
                                  (no public IP needed)
```

### Why This Is More Secure Than TCP

| | Public TCP | Unix Socket via Proxy |
|---|---|---|
| Exposed to internet | Yes (needs firewall rules) | No (no IP address) |
| Authentication | Password over SSL | Service account identity |
| Who can connect | Anyone who knows the IP | Only processes in the same Cloud Run environment |
| Setup complexity | High (SSL certs, firewall, IP allowlists) | Zero (GCP handles it) |

### The Code Change This Required

`mysql2` can connect via socket, but only when you pass a config object — not a URL string. The URL format has no way to express a socket path. So `backend/db/pool.js` was updated to detect the Cloud SQL environment and switch connection methods:

```js
if (process.env.CLOUD_SQL_CONNECTION_NAME) {
    // Cloud Run: parse the URL for credentials, connect via socket
    const url = new URL(process.env.DATABASE_URL);
    pool = mysql.createPool({
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.slice(1),
        socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
    });
} else {
    // Local dev: plain TCP via DATABASE_URL string (unchanged)
    pool = mysql.createPool(process.env.DATABASE_URL);
}
```

`CLOUD_SQL_CONNECTION_NAME` is only set on Cloud Run (via Terraform), so local development uses the old TCP path without any changes to your workflow.

---

## Part 4: IAM — How Cloud Run Is Allowed to Touch Cloud SQL

The Unix socket doesn't use a password to authenticate to Cloud SQL. Instead, it uses **GCP Identity and Access Management (IAM)**.

Every Cloud Run service runs as a **service account** — a GCP identity (like a user account, but for software). We created one in Terraform:

```hcl
resource "google_service_account" "cloud_run" {
  account_id = "paw-match-run"
}

resource "google_project_iam_member" "cloud_run_sql" {
  role   = "roles/cloudsql.client"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}
```

The `roles/cloudsql.client` role grants permission to connect to Cloud SQL instances. The Auth Proxy checks this permission at connection time — if the service account doesn't have it, the connection is refused regardless of what password you provide.

This is the "no passwords over the wire" claim — your DB password is only used inside GCP's internal systems, never transmitted across a network connection your app code controls.

---

## Summary

| Connection | Protocol | Public? | Auth method |
|---|---|---|---|
| Browser → Frontend | HTTPS | Yes | None (static files) |
| Browser → Backend | HTTPS | Yes | JWT in Authorization header |
| Backend → Cloud SQL | Unix socket | No | GCP service account (IAM) |

The database is the only resource that is never exposed publicly. Everything above it is reachable from the internet by design — protected by application-level auth (JWT), not network-level restrictions.
