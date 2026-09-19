# Access-Control Matrix

| Actor | Repository | Public catalog | Own records | Business records | Security administration |
|---|---|---|---|---|---|
| Visitor | None | Read published projection | None | None | None |
| Consumer | None | Read | Own only | None | None |
| Staff | None by default | Read | Assigned operations | Explicit least privilege | None |
| Business owner | Reviewed contribution only | Read/write through backend | Business scope | Business scope | No platform administration |
| Maintainer | Reviewed repository changes | No runtime privilege implied | None implied | None implied | Repository controls only |
| Security auditor | Read evidence | None implied | Read approved evidence | Read approved evidence | No mutation |
| Platform administrator | Infrastructure repository only | None implied | No routine data access | No routine data access | Approved, logged, time-bound |

GitHub membership never grants application or customer-data access.
