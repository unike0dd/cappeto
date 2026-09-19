# ADR-001: Application Repositories Do Not Own Shared Infrastructure

**Status:** Accepted for the GitHub Foundation.

## Decision

This repository owns application source, public contracts, tests, documentation, and safe deployment-source preparation. Shared Firebase, Firestore, Google Cloud, Cloud Run, IAM, secrets, load balancing, production logging, backups, and Terraform state will be owned by one separately controlled infrastructure plane.

## Reason

A shared resource must have one authoritative Terraform state and one accountable owner. Duplicating shared infrastructure across application repositories risks destructive plans, inconsistent policy, excessive credentials, and unreviewable drift.

## Consequences

- Terraform and Firebase provisioning files are intentionally absent here.
- Cloud activation is blocked until the dedicated control plane exists.
- Application contracts may describe future integrations but cannot activate them.
- Each environment will later receive isolated state, identity, data, secrets, and approval gates.
