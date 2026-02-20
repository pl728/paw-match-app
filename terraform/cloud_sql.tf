resource "google_sql_database_instance" "main" {
  name             = "paw-match-db"
  database_version = "MYSQL_8_0"
  region           = var.region

  settings {
    tier = "db-f1-micro" # Cheapest option (~$7/mo)

    backup_configuration {
      enabled = false
    }
  }

  deletion_protection = false # Set to true for production

  depends_on = [google_project_service.apis]
}

resource "google_sql_database" "paw_match" {
  name     = "paw_match"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "app" {
  name     = "pawmatch"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}
