# Security assurance status

This repository is source-ready for the GitHub-to-Cloudflare phase; it is not certified, attested, or production-authorized.

## Implemented in source

- Allowlisted Cloudflare static build; repository internals are excluded from deployment.
- SHA-384 asset manifest tied to the GitHub commit and checked after deployment.
- Worker-enforced CSP, HSTS, anti-clickjacking, nosniff, referrer, permissions, opener, resource, reporting, cache, and fetch-metadata controls.
- API routes fail closed until the trusted Google backend is connected.
- Responsible disclosure, deny-by-default Firebase rules, server-authoritative commerce contracts, and no raw card handling.
- Exact two-target model: Cappeto Non-Specific and PRODUCTION; billing is deferred.
- Third-party GitHub Actions are pinned to reviewed commit SHAs.

## Deployment verification still required

- Connect protected GitHub environments to a least-privilege Cloudflare token.
- Verify TLS 1.2/1.3, HTTPS redirects, headers, CAA, DNSSEC, WAF, rate limits, Turnstile, logs, and alerts on the final domains.
- Run MDN HTTP Observatory against every final public hostname.
- Complete identity, session, authorization, CORS, App Check, IAM, Secret Manager, backup, payment, PCI scope, DAST, accessibility, abuse, AI, recovery, and incident-response testing.

See SECURITY_CONTROL_MATRIX.md for the current NIST, CISA, OWASP, PCI DSS, MDN Observatory, and Website Security Specification mapping.
