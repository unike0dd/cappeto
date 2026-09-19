# OPS CySec GitHub Governance

## Scope

This repository owns the business catalog, inventory, order, and reporting interface. It does not own shared Firebase, Google Cloud, Cloud Run, IAM, secrets, production data stores, or authoritative Terraform state.

## Mandatory controls

- Changes enter `main` only through reviewed pull requests.
- Security-sensitive paths require owner review.
- Workflow actions are pinned to complete commit SHAs.
- Workflow permissions are deny-by-default and explicitly granted.
- Secrets, production data, Terraform state, credentials, and private incident evidence are prohibited.
- Public clients are untrusted. Prices, taxes, inventory, authorization, orders, and payment state become authoritative only in the future trusted backend.
- Production deployment requires a protected environment, human approval, immutable source evidence, and post-deployment verification.
- Vulnerabilities are reported privately under `SECURITY.md`.

## Release gates

1. Security and governance checks pass.
2. All review threads are resolved.
3. No credential or customer-data material is present.
4. The release is tied to an reviewed commit.
5. Rollback evidence and an accountable approver are recorded.
6. External cloud activation remains separately authorized.

## OPS functions

| Function | Repository evidence |
|---|---|
| Govern | CODEOWNERS, pull-request template, governance and decision records |
| Identify | Threat model, data classification, asset and trust boundaries |
| Protect | Least-privilege workflows, pinned actions, fail-closed mutations |
| Detect | CodeQL, validation checks, private vulnerability reporting |
| Respond | SECURITY.md and documented escalation boundary |
| Recover | Reversible branches, immutable commits, release evidence and rollback reference |

Configuration alone is not compliance. A control is complete only when its evidence is visible and successfully tested.
