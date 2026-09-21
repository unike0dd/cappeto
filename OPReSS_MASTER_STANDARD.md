# OPReSS

## OPS Cyber Resilience Security Standard

**Document status:** Proposed master standard — not yet operative  
**Version:** 1.0  
**Effective date:** 2026-09-21  
**Proposed authority:** OPS CySec Governance  
**Applies to:** OPS repositories, applications, infrastructure, data, identities, personnel, contractors, automated agents, integrations, releases, and service providers

---

## 1. Authority and purpose

OPReSS is proposed as the single authoritative security and resilience standard for OPS. It defines the mandatory outcomes, control requirements, evidence, approvals, and exit gates for Foundations Zero through Seven.

After formal approval, all human operators, software agents, repositories, deployment workflows, cloud resources, and infrastructure definitions shall follow this document. Platform-specific files may implement these requirements but shall not redefine, weaken, or contradict them.

Upon approval, the control chain is:

> OPS CySec Governance → OPReSS → Foundations Zero–Seven → Controls → Evidence → Approval

Until the Approval record in Section 24 is completed, this document is non-binding and its MUST/SHALL language describes the controls proposed for adoption.

Documentation is not proof of implementation. A requirement is complete only when its prescribed evidence exists and its approval gate has passed.

## 2. Normative language

- **MUST / SHALL:** mandatory.
- **MUST NOT / SHALL NOT:** prohibited.
- **SHOULD:** expected unless a documented, approved exception exists.
- **MAY:** optional.
- **Evidence:** an independently reviewable artifact proving implementation or operation.
- **Approval:** recorded authorization by the designated control owner or approver.

## 3. Precedence

When requirements conflict, the following order applies:

1. Applicable law and binding regulatory obligations.
2. Binding bank, payment-provider, processor, and contractual requirements.
3. OPReSS mandatory requirements.
4. Approved architecture decisions and control specifications.
5. Platform-specific implementation instructions.

The stricter applicable requirement prevails. Exceptions may not override law, prohibited-data rules, tenant isolation, or payment-data prohibitions.

## 4. Core principles

1. Deny by default.
2. Verify explicitly; never trust location, client code, or network origin alone.
3. Apply least privilege and separation of duties.
4. Treat browsers, mobile applications, user input, external events, and AI-generated output as untrusted.
5. Enforce authorization and business rules in the trusted backend.
6. Minimize data collection, access, retention, disclosure, and duplication.
7. Never place secrets or prohibited data in source code, logs, analytics, URLs, issues, screenshots, test fixtures, build artifacts, or client storage.
8. Make changes reviewable, reproducible, reversible, and attributable.
9. Prefer short-lived identity over persistent credentials.
10. Require evidence before declaring a control or Foundation complete.
11. Fail closed when identity, authorization, configuration, dependency, or verification is uncertain.
12. Preserve usability, accessibility, bilingual behavior, and legitimate customer workflows while enforcing security.

## 5. Scope and architecture boundaries

### 5.1 Governed systems

OPReSS governs, when present:

- Git repositories, branches, pull requests, Actions, releases, and artifacts.
- Web, mobile, staff, business, logistics, support, and owner applications.
- Identity, sessions, authorization, tenant isolation, and privileged access.
- Cloud edge, DNS, WAF, caching, routing, and security headers.
- Application hosting, trusted APIs, jobs, queues, databases, storage, secrets, keys, logging, monitoring, and backups.
- Infrastructure as code and state.
- AI and automated-agent access, data use, tools, prompts, actions, and output validation.
- Payment-provider integrations and payment-status processing.
- Vendors, contractors, couriers, support personnel, and other third parties.

### 5.2 Single infrastructure control plane

Shared production infrastructure SHALL have one authoritative infrastructure owner and one reviewed infrastructure-as-code control plane. Application repositories SHALL NOT independently create overlapping production identity, network, database, logging, DNS, payment, or shared cloud resources.

### 5.3 Client boundary

Web and mobile clients SHALL be treated as untrusted presentation layers. They SHALL NOT be authoritative for identity, authorization, pricing, taxes, discounts, inventory, order totals, payment state, refunds, tenant membership, or audit records.

## 6. Data classification

| Class | Examples | Minimum handling |
|---|---|---|
| Public | Approved product descriptions and public business information | Integrity protection and approved publication |
| Internal | Procedures and non-sensitive operating records | Authenticated workforce access |
| Confidential Personal | Name, email, address, telephone, delivery instructions, invoices | Encryption, purpose limitation, tenant isolation, retention and deletion controls |
| Restricted | Credentials, authentication factors, tokens, privileged actions, security logs, key material | Strongest access controls, enhanced monitoring, no routine exposure |
| Prohibited | Full card number, CVV/CVC, PIN, magnetic-stripe data, payment authentication secrets | Must never enter OPS custody or systems |

Every non-public data element MUST have a purpose, lawful basis where applicable, system of record, owner, authorized roles, retention period, deletion or anonymization method, logging restrictions, and third-party disclosure record.

## 7. Permanent payment-data prohibition

OPS SHALL NOT collect, receive, store, process, display, transmit, log, analyze, or back up full payment-card numbers, CVV/CVC values, PINs, magnetic-stripe data, or payment authentication secrets.

Payment integrations MUST use provider-hosted card entry or an approved external redirect. OPS may retain only the minimum non-sensitive transaction reference, order reference, amount, currency, status, timestamps, refund or dispute status, and reconciliation evidence required for legitimate operations.

The trusted backend MUST verify signed provider events, validate event origin and integrity, enforce idempotency, recalculate authoritative amounts, and prevent the client from declaring an order paid.

PCI scope SHALL be validated with the acquiring bank, provider, or qualified assessor. Absence of stored card data SHALL NOT be treated as automatic proof that every OPS system is outside PCI scope.

## 8. Identity and session baseline

- Password minimum: 15 characters where passwords are used.
- Privileged and sensitive roles: MFA required; phishing-resistant methods SHOULD be used.
- Authorization: deny by default, least privilege, active membership, server-side enforcement.
- End Consumer session: 30 minutes idle; 4 hours absolute.
- Business, staff, and IT session: 2 minutes idle; 8 hours absolute.
- Emergency access: 5 minutes idle; 1 hour absolute.
- Sensitive payment-related action: reauthentication within 5 minutes.
- Revocation MUST take effect promptly and be verified by the trusted service.
- Shared accounts are prohibited.
- Privileged identities SHALL be separated from ordinary identities.
- Critical authorization, release, refund, payout-detail, and production changes SHALL require independent approval.

## 9. Foundation Zero — Governance and readiness

**Outcome:** OPS knows what it owns, what it protects, who is accountable, and what evidence is required.

### Mandatory controls

- Approved scope, architecture, trust boundaries, and system inventory.
- Named business, security, data, infrastructure, and service owners.
- Environment separation: development, test, staging, production, and security functions.
- Data inventory, classification, flow, retention, deletion, and third-party transfer records.
- Threat model and risk register.
- Access-control matrix and separation-of-duties matrix.
- Change, incident, backup, recovery, vulnerability, exception, and third-party policies.
- Prohibited-data register containing the permanent payment-data rule.
- Control register mapping every OPReSS control to owner, implementation, evidence, frequency, status, and approval.

### Evidence

Approved inventories, diagrams, matrices, risk records, policies, control register, and recorded owners.

### Exit gate

Foundation Zero closes only when scope, owners, classifications, risks, controls, evidence expectations, and exceptions are approved.

## 10. Foundation One — Repository and software supply chain

**Outcome:** Every source change and release is attributable, reviewed, tested, and recoverable.

### Mandatory controls

- Protected default branch; no routine direct changes.
- Pull requests, resolved review conversations, required checks, and current branches before merge.
- Force-push and branch deletion blocked.
- CODEOWNERS for security-sensitive and infrastructure paths.
- Third-party Actions pinned to immutable full commit identifiers.
- Least-privilege workflow permissions and no persisted checkout credential unless explicitly required.
- Secret, dependency, source, contract, and infrastructure scanning.
- Signed or otherwise verifiable release provenance where supported.
- Immutable release artifact tied to the approved source commit.
- Emergency change path with reason, approver, evidence, and retrospective review.
- Rollback or forward-fix instructions for every production release.

### Deployment-efficiency rule

Required checks SHALL avoid materially duplicating the same build or scan without a documented reason. Pull-request validation and post-merge deployment SHALL be separated. Only one workflow SHALL own publication to each deployment target. Newer approved commits MAY cancel superseded non-production publication runs; production cancellation behavior must be explicitly approved.

### Evidence

Ruleset export or screenshots, pull-request history, check results, scan results, release manifest, source commit, deployment record, and rollback evidence.

### Exit gate

A release cannot proceed unless required checks pass and the exact approved commit is identified.

## 11. Foundation Two — Trusted infrastructure

**Outcome:** Infrastructure is isolated, reproducible, least-privileged, and recoverable.

### Mandatory controls

- Reviewed infrastructure as code is authoritative for production resources.
- State is encrypted, access-restricted, versioned or recoverable, and separated by environment.
- Workload identity federation or equivalent short-lived identity; no routine service-account key files.
- Separate projects/accounts and identities for environment and privilege boundaries.
- Central secrets and key management; rotation and access logging.
- Restricted service ingress and egress consistent with documented data flows.
- Central security logging, monitoring, alert routing, retention, and time synchronization.
- Tested backups and isolated recovery capability.
- Production data SHALL NOT be copied into development without approved de-identification.
- Provider consoles SHALL not become an undocumented source of truth; emergency console changes must be reconciled into code.

### Platform application

| Platform | OPReSS role |
|---|---|
| Terraform | Authoritative provisioning, IAM, policy, environment separation, logging, and recovery declarations |
| Google Cloud | Project, IAM, networking, keys, secrets, logs, monitoring, storage, and managed-service boundaries |
| Cloud Run | Trusted service execution with restricted ingress, dedicated identity, resource limits, health checks, and immutable revision evidence |
| Firebase | Bounded identity/client services and explicitly governed data rules; never a substitute for server authorization |
| Cloudflare | Edge protection, DNS, WAF, rate controls, safe caching, routing, and headers; never the authorization authority |
| Vertex AI | Approved model/service use, restricted identities, controlled data access, output validation, safety evaluation, logging, and human approval for high-impact actions |

### Evidence

Plans, reviewed applies, state protections, IAM exports, key and secret policies, network tests, log/alert tests, backup records, and restoration results.

### Exit gate

Infrastructure is not production-ready until identity, network, state, secrets, monitoring, and recovery controls are proven.

## 12. Foundation Three — Trusted identity and authorization

**Outcome:** Every user, workforce member, workload, tenant, and privileged action is explicitly authenticated and authorized.

### Mandatory controls

- Central identity lifecycle: creation, verification, activation, suspension, revocation, deletion, and recovery.
- MFA and step-up authentication according to risk.
- Server-side tenant membership and object-level authorization.
- RBAC or ABAC with deny-by-default behavior.
- Owner approval for sensitive staff access and promotion.
- Quarterly privileged and workforce access review.
- Login, denial, elevation, recovery, and revocation events centrally logged.
- Rate limits and abuse controls for authentication and recovery paths.
- Automated proof that Tenant A cannot access Tenant B and revoked users lose access.

### Evidence

Role matrix, identity configuration, authorization tests, tenant-isolation tests, session tests, revocation tests, access review, and audit events.

### Exit gate

Identity closes only after positive and negative authorization tests pass at the trusted service boundary.

## 13. Foundation Four — Trusted commerce and service APIs

**Outcome:** Business and transaction integrity is enforced by trusted services rather than clients.

### Mandatory controls

- Server authority for catalog writes, pricing, inventory, taxes, discounts, totals, orders, delivery assignment, refunds, and payment state.
- Strict request schemas, size limits, type validation, content validation, and safe error handling.
- Object-level and tenant-level authorization on every protected operation.
- Idempotency for order, payment-event, refund, inventory, and other retryable critical operations.
- Rate limiting and abuse monitoring.
- Safe upload validation, storage isolation, generated names, content limits, and malware controls where appropriate.
- Versioned API contracts and compatibility validation.
- No secrets, tokens, prohibited payment data, or unnecessary personal bodies in logs.
- Reconciliation for money, orders, refunds, inventory, and provider events.

### Evidence

Contract tests, authorization tests, abuse tests, idempotency tests, reconciliation results, negative tests, logs, and release evidence.

### Exit gate

Commerce functionality cannot enter production while a client can authoritatively change protected business state.

## 14. Foundation Five — Personal data lifecycle

**Outcome:** Personal data is collected and used only for a defined purpose, protected throughout its lifecycle, and removed or blocked when no longer legitimately required.

### Mandatory controls

- Privacy and data protection by design and by default.
- Minimum collection for delivery, invoicing, support, identity, and lawful operations.
- Clear purpose and authorized use for address, phone, email, invoices, and delivery instructions.
- Encryption in transit and at rest.
- Field, record, tenant, role, and purpose-limited access as applicable.
- Masked displays where full values are unnecessary.
- No personal data in URLs, analytics, public logs, repositories, screenshots, or unmanaged exports.
- Courier access begins only after assignment, is limited to the delivery, is logged, and expires after the approved operational window.
- Data-subject request, correction, restriction, portability where applicable, and deletion processes.
- Retention schedules distinguish active delivery data, optional address-book data, invoices, disputes, support records, audit evidence, and backups.
- Third-party and international transfer requirements are recorded and approved.

### Evidence

Data-flow records, field inventory, access tests, masking tests, retention jobs, deletion or blocking tests, transfer register, and request-handling records.

### Exit gate

Personal data processing cannot launch until purpose, access, retention, deletion, and incident handling are demonstrated.

## 15. Foundation Six — Detection, response, and recovery

**Outcome:** OPS can detect harmful activity, contain it, communicate appropriately, and restore critical services.

### Mandatory controls

- Central, tamper-resistant security and administrative audit logs.
- Alerts for privilege change, repeated denial, abnormal sign-in, cross-tenant attempts, mass access/export, critical configuration change, payment anomaly, and monitoring failure.
- Named responders, severity levels, escalation paths, decision authority, and communication plans.
- Personal-data and security-incident assessment and notification procedure.
- Defined service-level recovery time and recovery point objectives.
- Isolated and tested backups.
- At least annual incident and disaster-recovery exercises; more frequently for critical services.
- Post-incident review and verified remediation.

### Evidence

Alert tests, incident records, exercise results, recovery measurements, restored-data validation, communication records, and remediation closure.

### Exit gate

Critical production services cannot launch without working detection, assigned responders, and a successful restoration test.

## 16. Foundation Seven — Assurance and continuous improvement

**Outcome:** OPS independently verifies that controls operate effectively over time.

### Mandatory controls

- Continuous automated control verification where practical.
- Regular vulnerability scanning and risk-based remediation deadlines.
- Independent penetration testing before production and after material architecture changes.
- Annual risk and control review.
- Quarterly privileged-access certification.
- Supplier and dependency reassessment.
- Findings tracked through verified closure.
- Exceptions identify scope, risk, compensating control, owner, approver, creation date, expiration date, and review date.
- Compliance statements SHALL distinguish design, implementation, verified operation, and external certification.

### Evidence

Assessment reports, scan results, penetration-test results, access certifications, supplier reviews, exception register, remediation records, and executive approval.

### Exit gate

No Foundation or system is described as compliant solely because policies exist. Assurance requires current evidence of operating effectiveness.

## 17. Release and deployment control

Every deployment MUST identify:

1. Repository and approved source commit.
2. Environment and target service.
3. Trigger and authorized actor.
4. Required checks and their results.
5. Exact immutable artifact or deterministic build input.
6. Deployment start and completion time.
7. Deployed revision or provider identifier.
8. Post-deployment integrity, availability, and security verification.
9. Approval record when the environment requires it.
10. Rollback or forward-fix path.

A deployment is delayed when it is queued, waiting for an environment approval, waiting for a concurrency lock, rebuilding or rescanning unnecessarily, waiting for a provider, missing a secret or permission, failing a required check, or publishing a different artifact/source state than expected. These states MUST be distinguishable in evidence.

## 18. AI and automated-agent controls

- Agents may read this document as policy context but SHALL NOT be treated as enforcement mechanisms.
- Agent permissions MUST be least-privileged, scoped, time-limited where possible, and logged.
- Agents SHALL NOT expose secrets, personal data, restricted topology, or prohibited payment data.
- Agent-generated code, configuration, infrastructure, or security decisions require the same review and tests as human-generated work.
- High-impact actions require explicit human approval and verified targets.
- Model prompts and outputs SHALL be treated as untrusted when they can influence tools, data access, authorization, deployment, or transactions.
- Retrieval sources, tool actions, approvals, and final changes SHOULD be attributable.
- Vertex AI or another model service SHALL receive only approved, minimized data and SHALL not train on or retain governed data beyond approved terms and configuration.

## 19. Evidence register schema

Each control record SHALL contain:

| Field | Requirement |
|---|---|
| Control ID | Stable OPReSS identifier |
| Foundation | Zero through Seven |
| Requirement | Exact mandatory outcome |
| Scope | Repository, service, environment, data, or supplier |
| Owner | Accountable role or person |
| Implementation | Enforcing configuration, code, procedure, or contract |
| Evidence | Artifact proving design and operation |
| Frequency | Per change, continuous, monthly, quarterly, annual, or event-driven |
| Status | Not started, in progress, implemented, verified, failed, exception, or retired |
| Approver | Authorized independent reviewer |
| Last verified | Timestamp |
| Next review | Timestamp or trigger |
| Exception | Reference and expiration, when applicable |

## 20. Approval model

- **Control owner:** implements and maintains the control.
- **Evidence reviewer:** verifies evidence and records pass or fail.
- **Approver:** accepts the control result or risk; shall be independent for critical controls.
- **System owner:** authorizes service operation within approved scope.
- **Security authority:** may stop release or operation when a mandatory control fails.

Approval SHALL identify the exact version, scope, evidence, conditions, and date. Silence or the absence of a reported failure is not approval.

## 21. Exception model

An exception MUST be narrow, time-limited, risk-assessed, approved, and accompanied by compensating controls. It MUST NOT authorize prohibited payment data, cross-tenant access, hidden production credentials, unreviewed privileged access, fabricated evidence, or violation of law.

Expired exceptions automatically become failed controls until renewed or remediated.

## 22. Minimum control identifiers

| ID | Mandatory outcome |
|---|---|
| OPR-GOV-001 | OPReSS scope, owners, and control register approved |
| OPR-DAT-001 | Data classified and lifecycle-defined |
| OPR-PAY-001 | Prohibited payment data never enters OPS systems |
| OPR-SCM-001 | Protected, reviewed, scanned source changes |
| OPR-REL-001 | Exact approved source maps to exact deployed artifact |
| OPR-IAM-001 | Deny-by-default identity and server authorization |
| OPR-TNT-001 | Tenant isolation proven by negative tests |
| OPR-INF-001 | Infrastructure managed through authoritative reviewed code |
| OPR-SEC-001 | Secrets and keys centrally controlled and logged |
| OPR-API-001 | Trusted service enforces protected business state |
| OPR-PRV-001 | Personal data minimized, protected, retained, and deleted correctly |
| OPR-LOG-001 | Protected centralized audit evidence available |
| OPR-IR-001 | Incident detection and response tested |
| OPR-REC-001 | Backup restoration meets approved objectives |
| OPR-AI-001 | Automated agents and models operate within approved boundaries |
| OPR-ASR-001 | Independent assurance and remediation operate continuously |

## 23. Tool-reading instruction

When an authorized tool or agent uses OPReSS, it SHALL:

1. Identify the affected Foundation and control IDs.
2. Read the relevant implementation and current evidence.
3. Separate verified facts from assumptions.
4. Refuse or stop actions that violate a MUST NOT requirement.
5. Propose the smallest compliant change.
6. Preserve unrelated work and existing evidence.
7. Validate the result against the stated exit gate.
8. Request the required approval before crossing an approval boundary.
9. Never mark a control complete without evidence.

## 24. Adoption and review

This document becomes authoritative when approved by OPS CySec Governance. It SHALL be version-controlled, reviewed at least annually and after material legal, architectural, threat, provider, or business changes.

Platform-specific runbooks, Terraform modules, IAM policies, workflow files, tests, dashboards, and evidence registers are subordinate implementations of this master standard.

---

## Approval record

| Field | Value |
|---|---|
| Document | OPReSS — OPS Cyber Resilience Security Standard |
| Version | 1.0 |
| Status | Proposed for approval |
| Owner | OPS CySec Governance |
| Approver | Pending |
| Approval date | Pending |
| Next review | One year after approval or upon material change |

