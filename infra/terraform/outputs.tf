output "project_id" {
  value = var.project_id
}

output "product_media_bucket" {
  value = google_storage_bucket.product_media.name
}
