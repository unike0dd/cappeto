# Security assurance status

This repository is prepared for verification; it is not certified or attested compliant.

## Implemented in source

- Restrictive Content Security Policy without unsafe-inline or unsafe-eval.
- HTTPS upgrade directive plus Cloudflare-ready HSTS, anti-clickjacking, MIME-sniffing, referrer, permissions, opener, and resource policies.
- No browser-side demonstration password authentication.
- Deny-by-default Firebase rules and least-data public catalog boundary.
- Server-authoritative price, tax, cart, checkout, payment, inventory, and order design.
- Explicit confirmation for agent cart and checkout actions.
- No raw payment-card handling.
- Responsible-disclosure file and automated security checks.
- DEV, STAGING, and PRODUCTION separation.

## Deployment verification still required

- TLS 1.2/1.3, redirects, HSTS and headers observed on every production response.
- Exact CORS allowlist on the API; no wildcard with credentials.
- Firebase App Check, identity configuration, MFA policy, tenant claims, and emulator tests.
- Cloudflare WAF, rate limits, bot controls, logging, alerting, DNS CAA, and DNSSEC where supported.
- Google Cloud IAM, workload identity, Secret Manager, audit logging, backup/restore, and incident-response exercises.
- Stripe-hosted payment entry, signed webhooks, idempotency, reconciliation, and formal PCI DSS scope/validation.
- SAST, DAST, dependency, secret, accessibility, abuse-case, prompt-injection, tool-authorization, data-leakage, and adversarial AI testing.
- Evidence review against OWASP ASVS, OWASP MASVS for Flutter mobile releases, CISA Secure by Design, NIST CSF 2.0, NIST AI RMF, and applicable PCI DSS requirements.

## AI controls

Treat every prompt, retrieved document, catalog field, tool result, URL, and model response as untrusted. The model cannot authorize itself, widen permissions, change policy, set authoritative totals, access unpublished data, handle payment credentials, or complete irreversible actions without server validation and explicit user approval. Log tool decisions without storing unnecessary conversation or payment data.
