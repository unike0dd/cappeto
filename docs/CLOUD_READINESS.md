# Cappeto cloud readiness

The existing HTML storefront remains the live prototype. New cloud and Flutter work is isolated under `apps/` and `infra/`.

## Boundaries

- This repository owns business administration, inventory, pricing, and publishing.
- End consumers must receive only explicitly published catalog fields through a server-controlled public projection.
- Browser and Flutter clients never receive service-account keys, Cloudflare API tokens, Terraform state, purchase costs, supplier data, stock adjustments, or internal accounting data.
- Development, staging, and production use separate Firebase/Google Cloud projects and separate Terraform state.

## Activation order

1. Create the Google Cloud projects and billing accounts.
2. Create a remote Terraform state bucket outside this configuration.
3. Copy `infra/terraform/terraform.tfvars.example` to an untracked environment-specific file.
4. Authenticate Terraform with short-lived operator credentials or workload identity.
5. Run `terraform fmt -check`, `terraform init -backend=false`, and `terraform validate`.
6. Review `terraform plan` for the selected environment; apply only after approval.
7. Generate Flutter platform folders and Firebase options with the official Flutter and Firebase CLIs.
8. Configure Cloudflare DNS/Pages after the deployment target and domain are confirmed.

No real identifiers or credentials belong in Git.
