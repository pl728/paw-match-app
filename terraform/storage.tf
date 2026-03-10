locals {
  pet_photo_bucket_name = coalesce(var.pet_photo_bucket_name, "${var.project_id}-paw-match-pet-photos")
}

resource "google_storage_bucket" "pet_photos" {
  name                        = local.pet_photo_bucket_name
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true

  depends_on = [google_project_service.apis]
}

resource "google_storage_bucket_object" "default_cat_photo" {
  name         = "placeholders/cat.png"
  bucket       = google_storage_bucket.pet_photos.name
  source       = "${path.module}/../frontend/public/cat.png"
  content_type = "image/png"
}

resource "google_storage_bucket_object" "default_dog_photo" {
  name         = "placeholders/dog.png"
  bucket       = google_storage_bucket.pet_photos.name
  source       = "${path.module}/../frontend/public/dog.png"
  content_type = "image/png"
}

resource "google_storage_bucket_object" "default_animal_photo" {
  name         = "placeholders/animal.png"
  bucket       = google_storage_bucket.pet_photos.name
  source       = "${path.module}/../frontend/public/animal.png"
  content_type = "image/png"
}
