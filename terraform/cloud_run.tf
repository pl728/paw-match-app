resource "google_service_account" "cloud_run" {
  account_id   = "paw-match-run"
  display_name = "Paw Match Cloud Run"
}

# Allow Cloud Run to connect to Cloud SQL
resource "google_project_iam_member" "cloud_run_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_cloud_run_v2_service" "backend" {
  name     = "paw-match-backend"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    # Mount the Cloud SQL socket into the container
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = var.image

      env {
        name  = "DATABASE_URL"
        value = "mysql://pawmatch:${var.db_password}@localhost/paw_match"
      }
      env {
        name  = "CLOUD_SQL_CONNECTION_NAME"
        value = google_sql_database_instance.main.connection_name
      }
      env {
        name  = "JWT_SECRET"
        value = var.jwt_secret
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }

  depends_on = [google_project_iam_member.cloud_run_sql]
}

# Make the backend publicly reachable
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = google_cloud_run_v2_service.backend.project
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
