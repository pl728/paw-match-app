output "backend_url" {
  description = "Cloud Run service URL — point your frontend at this"
  value       = google_cloud_run_v2_service.backend.uri
}

output "cloud_sql_connection_name" {
  description = "Used to init schema: gcloud sql connect paw-match-db --user=pawmatch"
  value       = google_sql_database_instance.main.connection_name
}

output "image_base" {
  description = "Base image path for docker push (append :tag)"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/paw-match/backend"
}

output "frontend_url" {
  description = "Cloud Run frontend URL"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "pet_photo_bucket_name" {
  description = "GCS bucket used for uploaded and placeholder pet photos"
  value       = google_storage_bucket.pet_photos.name
}
