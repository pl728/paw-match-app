variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "MySQL password for the paw_match app user"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret for the backend"
  type        = string
  sensitive   = true
}

variable "image" {
  description = "Full Docker image URL to deploy (e.g. us-central1-docker.pkg.dev/PROJECT/paw-match/backend:latest)"
  type        = string
}

variable "frontend_image" {
  description = "Full Docker image URL for the frontend (e.g. us-central1-docker.pkg.dev/PROJECT/paw-match/frontend:latest)"
  type        = string
}

variable "pet_photo_bucket_name" {
  description = "Optional GCS bucket name for pet photos. Leave null to use a project-based default."
  type        = string
  default     = null
}
