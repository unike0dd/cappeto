variable "environment" {
  description = "Deployment target: non_specific or production."
  type        = string
  validation {
    condition     = contains(["non_specific", "production"], var.environment)
    error_message = "environment must be non_specific or production."
  }
}

variable "project_id" {
  description = "Dedicated Google Cloud project ID for the selected target."
  type        = string
}

variable "region" {
  description = "Primary Google Cloud region."
  type        = string
  default     = "us-central1"
}

variable "cloudflare_api_token" {
  description = "Cloudflare token supplied at runtime; never commit it."
  type        = string
  sensitive   = true
  default     = null
  nullable    = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID supplied at activation time."
  type        = string
  default     = null
  nullable    = true
}
