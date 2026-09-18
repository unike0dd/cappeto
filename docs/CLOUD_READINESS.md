# Cappeto cloud readiness

The existing HTML application remains the live prototype. Cloudflare, Flutter, Firebase, Google Cloud, and Terraform work stays isolated until reviewed and activated.

## Boundaries

- This repository owns business administration, inventory, authoritative pricing, and publication.
- Browser and Flutter clients never receive Cloudflare tokens, service-account credentials, Terraform state, payment secrets, or unpublished business records.
- Google Cloud has exactly two targets: Cappeto Non-Specific and PRODUCTION.
- Billing is connected later at the activation gate, after local builds and security validation.

## GitHub to Cloudflare activation

1. Merge the reviewed readiness pull request and protect main.
2. Create GitHub environments named cloudflare-non_specific and cloudflare-production.
3. Store a least-privilege CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in those protected environments.
4. Run the Cloudflare Worker deployment workflow manually for non_specific.
5. The workflow builds only allowlisted public files, creates SHA-384 integrity metadata, deploys the exact build, and verifies the remote manifest and security headers.
6. Add an approved custom-domain route only after the domain, DNS, and launch gates are confirmed.
7. Keep production environment approval required; do not enable automatic production deployment.

## Later Google activation

Prepare Terraform and application code without applying billable resources. At the later billing gate, connect billing first to Cappeto Non-Specific, review the Terraform plan, test the complete integration, then connect and approve PRODUCTION.
