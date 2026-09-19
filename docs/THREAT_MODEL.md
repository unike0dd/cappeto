# Threat Model

## Protected outcome

Preserve trustworthy business catalog, inventory, order, and reporting interface while the repository remains a public prototype and before a trusted backend is activated.

## Trust boundaries

1. Browser and future Flutter clients are untrusted.
2. Public static assets contain no secrets or privileged decisions.
3. GitHub Actions receive minimum permissions and no credentials on untrusted pull requests.
4. Cloud provider accounts, shared infrastructure, production data, and payment systems are outside this repository.
5. Future trusted operations must pass through authenticated backend services.

## Primary threats and controls

| Threat | Required control |
|---|---|
| Embedded credentials | Push protection, secret scanning, CI marker checks, immediate rotation |
| Browser-forged identity | No demonstration authentication; privileged actions fail closed |
| Cross-tenant access | Backend authorization and tenant tests before activation |
| Price or inventory tampering | Server-authoritative calculation in the future commerce API |
| Dependency compromise | Pinned Actions, dependency review, lockfiles when application dependencies are introduced |
| Workflow privilege escalation | Minimal permissions, no `pull_request_target`, protected environments |
| Malicious content or malformed catalog data | Allowlisted origins, per-item validation, output encoding |
| Request-body abuse | Explicit content type and bounded request sizes |
| Sensitive caching | `no-store` for HTML, API, errors, identity, and reports |
| Payment fraud | Provider-hosted collection and verified idempotent webhooks in a later foundation |

## Deferred tests before production

Authorization matrix tests, DAST, tenant-isolation tests, payment replay tests, restoration tests, incident exercise, and independent penetration testing.
