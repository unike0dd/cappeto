# Data Classification

| Class | Examples | Repository rule |
|---|---|---|
| Public | Approved UI, public product projection, accessibility copy | May be committed |
| Internal | General architecture, non-sensitive procedures | Private repository preferred; sanitize before publication |
| Confidential | Customer profiles, orders, staff records, audit events | Never commit; future protected services only |
| Restricted | Credentials, signing keys, tokens, payment secrets, recovery material | Secret manager or specialized provider only |

Production data, real customer records, unredacted logs, credentials, Terraform state, backups, vulnerability details, and incident evidence are prohibited from this public repository.
