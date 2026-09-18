# Security control readiness matrix

This source tree is prepared for secure deployment; it is not a certification, PCI attestation, or production authorization. Live effectiveness must be verified after Cloudflare and Google Cloud activation.

## Evidence in this repository

| Framework or reference | Source controls | Deployment evidence still required |
|---|---|---|
| NIST CSF 2.0 | Governed changes, asset allowlist, least-data boundary, verification scripts, incident-report endpoint design | IAM review, risk register, monitoring, recovery exercise, supplier review |
| CISA Secure by Design | Secure defaults, disabled prototype authentication, no committed credentials, least privilege deployment workflow, protective logging | MFA enforcement, production WAF/rate limits, vulnerability disclosure operations, patch SLAs |
| OWASP ASVS | CSP, output encoding checks, fetch-metadata rejection, server-authoritative commerce design, deny-by-default data rules | Auth/session implementation, authorization tests, DAST, abuse tests, penetration testing |
| OWASP MASVS | Flutter shell contains no secrets and is separated from trusted backend decisions | Device storage, transport, platform integrity and release testing |
| PCI DSS 4.x scope reduction | Payment secrets and card entry stay outside the browser and repository; checkout and webhooks are server-controlled contracts | Provider integration, signed webhook evidence, access logs, quarterly scans and applicable validation |
| MDN HTTP Observatory | CSP, HSTS, anti-clickjacking, nosniff, referrer, permissions, opener and resource headers | Scan the final Cloudflare domains after deployment |
| Website Security Specification | Required transport/header controls represented; security.txt; reporting endpoint; fetch metadata; obsolete X-XSS-Protection prohibited | TLS/redirect validation, CAA/DNSSEC, cookies, CORS, COEP compatibility, Trusted Types migration |

## Deliberate compatibility gates

- Cross-Origin-Embedder-Policy is deferred until all public catalog and payment resources are served with compatible CORP/CORS headers.
- Trusted Types enforcement is deferred until remaining dynamic HTML rendering is refactored and tested.
- SRI is required for any future third-party script or stylesheet. Current application scripts and styles are self-hosted; the deployment build instead publishes a SHA-384 manifest for every allowlisted asset.
- Cookies are not issued by this static prototype. The trusted identity backend must use Secure, HttpOnly, explicit SameSite, and __Host- naming where applicable.
- API CORS is closed because the trusted backend is not connected. Production must use an exact origin allowlist and must never combine wildcard origins with credentials.

## Repository boundary

Only an authenticated, authorized backend may expose unpublished inventory, cost, supplier, accounting, staff, or tenant-administration data.

The Cloudflare Worker returns 503 for all /api routes until the trusted backend is explicitly connected. This prevents the static prototype from being mistaken for a production transaction service.
