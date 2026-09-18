variable "environment" {
  description = "Deployment environment: dev, staging, or production."
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment must be dev, staging, or production."
  }
}

variable "project_id" {
  description = "Dedicated Google Cloud project ID for this environment."
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
  description = "Cloudflare account ID for the selected environment."
  type        = string
  default     = null
  nullable    = true
}
