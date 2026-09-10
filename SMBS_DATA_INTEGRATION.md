# SMB Order-Taker Data Integration Specification

**Status:** Architecture and integration contract  
**Source application:** [X-Magno-Maximus/smbs](https://github.com/X-Magno-Maximus/smbs)  
**Staff order application:** [X-Magno-Maximus/smbs-ordertakers](https://github.com/X-Magno-Maximus/smbs-ordertakers)

## 1. Purpose

The `smbs-ordertakers` application is the staff-facing order-entry interface. It must receive its authorized business data from the main `smbs` application and return completed sales to the same controlled business system.

The main `smbs` system is the authoritative source of truth for:

- Products and product status
- Product pictures
- Selling prices, tax rules, and currency
- Inventory availability
- Customer/client records
- Staff identity, authorization, and role permissions
- Orders, sales, and inventory movements

The order-taker must not maintain an independent permanent copy of these records. Local browser data may be used only as short-lived display cache or an unsent-order draft.

> The GitHub repositories contain application code and static assets. Production business records must be exchanged through an authenticated backend/API or controlled data service—not by reading or writing GitHub files at runtime.

## 2. Ownership and Direction of Data

| Information | Authoritative owner | Order-taker access | Update direction |
|---|---|---|---|
| Product identity and description | `smbs` | Read | `smbs` → order-taker |
| Product picture and thumbnail | `smbs` | Read | `smbs` → order-taker |
| Price, currency, discounts, tax | `smbs` | Read | `smbs` → order-taker |
| Inventory quantity and availability | `smbs` | Read | `smbs` → order-taker |
| Customer/client profile | `smbs` | Authorized read/create/update | Bidirectional through API |
| Staff identity and RBAC permissions | `smbs` | Read after authentication | `smbs` → order-taker |
| Order draft | Order-taker session | Create/update until submission | Local draft only |
| Submitted order and sale | `smbs` | Create | order-taker → `smbs` |
| Inventory reduction | `smbs` backend | No direct client write | Atomic server transaction |
| Audit events | `smbs` audit service | Create | order-taker → `smbs` |

## 3. Required Context Parameters

Every authorized data request and order submission must include or derive these parameters:

| Parameter | Type | Required | Rule |
|---|---|---:|---|
| `tenantId` | string/UUID | Yes | Identifies the SMB; never accepted from an untrusted URL without authorization validation |
| `businessId` | string/UUID | Yes | Identifies the legal/operating business |
| `locationId` | string/UUID | Yes | Identifies the branch, store, or service location |
| `staffUserId` | string/UUID | Yes | Taken from the authenticated session |
| `staffRole` | enum | Yes | Evaluated by server-side RBAC |
| `sessionId` | string/UUID | Yes | Short-lived authorized staff session |
| `deviceId` | string/UUID | Conditional | Registered or approved device reference |
| `currency` | ISO 4217 string | Yes | Example: `USD`; provided by business configuration |
| `locale` | BCP 47 string | Yes | Example: `en-US` or `es-EC` |
| `correlationId` | string/UUID | Yes | Connects UI action, order, inventory transaction, and audit event |
| `idempotencyKey` | string/UUID | Required for writes | Prevents duplicate customer/order submissions |
| `clientTimestamp` | ISO 8601 UTC | Yes | Informational; server timestamp remains authoritative |
| `dataVersion` | integer/string | Yes | Used to detect stale product, price, customer, or inventory data |

## 4. Product Contract

Minimum product data supplied by `smbs`:

| Field | Type | Required | Validation |
|---|---|---:|---|
| `productId` | string/UUID | Yes | Stable and unique within tenant |
| `sku` | string | Yes | Unique within tenant or location |
| `name` | string | Yes | 1–120 characters |
| `description` | string | No | Sanitized plain text |
| `categoryId` | string/UUID | Yes | Must reference an active category |
| `categoryName` | string | Yes | Display label |
| `imageUrl` | HTTPS URL | Yes | Approved storage origin; no inline secrets |
| `thumbnailUrl` | HTTPS URL | Recommended | Optimized carousel asset |
| `imageAlt` | string | Yes | Accessible product description |
| `unitPrice` | decimal/string | Yes | Non-negative; server-authoritative |
| `currency` | ISO 4217 string | Yes | Must match supported business currency |
| `taxCode` | string | Conditional | References the SMB tax configuration |
| `taxRate` | decimal | Conditional | Server-authoritative |
| `availableQuantity` | integer/decimal | Yes | Location-specific availability |
| `unitOfMeasure` | enum | Yes | Example: `each`, `kg`, `liter` |
| `isActive` | boolean | Yes | Inactive products cannot be ordered |
| `isOrderable` | boolean | Yes | Server controls staff availability |
| `version` | integer/string | Yes | Required for stale-data checks |
| `updatedAt` | ISO 8601 UTC | Yes | Server-generated |

Product images must display fully from top to bottom, use responsive containment, preserve aspect ratio, and remain usable at browser zoom levels from 100% through 250%.

## 5. Customer/Client Contract

Only the minimum data required for the current order should be exposed to authorized staff.

| Field | Type | Required | Rule |
|---|---|---:|---|
| `customerId` | string/UUID | For existing customer | Generated by the authoritative service |
| `customerNumber` | string | For existing customer | Tenant-specific display number |
| `firstName` | string | Conditional | Collect only when operationally required |
| `lastName` | string | Conditional | Collect only when operationally required |
| `email` | email | No | Normalize and validate before storage |
| `whatsappPhone` | E.164 string | No | Store normalized international number |
| `marketingConsent` | boolean | No | Separate from transactional contact permission |
| `contactConsentAt` | ISO 1 UTC | Conditional | Required when consent is collected |
| `status` | enum | Yes | `active`, `inactive`, `restricted`, or `deleted` |
| `version` | integer/string | Yes | Optimistic concurrency control |

Customer search responses should be minimal and tenant-scoped. Sensitive notes, payment credentials, authentication secrets, and unrelated personal information must never be sent to the order-taker.

## 6. Order Submission Contract

An order submission must contain:

- `orderId` or server request reference
- `tenantId`, `businessId`, and `locationId`
- Authenticated `staffUserId` and `sessionId`
- Optional authorized `customerId` or validated new-customer data
- Line items containing `productId`, quantity, displayed unit price, tax reference, and product version
- `currency`
- `correlationId`
- `idempotencyKey`
- Client timestamp and authoritative server timestamp
- Order source: `staff-order-taker`
- Status: `draft`, `submitted`, `accepted`, `rejected`, `cancelled`, or `refunded`

The client may display calculated totals, but the server must recalculate prices, discounts, taxes, stock availability, and final totals before accepting the order.

## 7. Controlled Order Transaction

A submitted order must be processed as one server-controlled transaction:

1. Authenticate the staff session.
2. Confirm tenant, business, location, and RBAC scope.
3. Validate the idempotency key.
4. Reload current products, prices, tax rules, and inventory.
5. Reject inactive products, price mismatches, and insufficient stock.
6. Calculate the authoritative subtotal, tax, discounts, and total.
7. Create the order and sale records.
8. Reduce or reserve inventory for every accepted line.
9. Create inventory movement records.
10. Update sales/accounting summaries.
11. Record the complete audit event.
12. Return the accepted order, updated inventory values, and receipt reference.

Order creation and inventory reduction must succeed or fail together. A partially completed sale is not permitted.

## 8. Suggested Service Operations

Implementation names may change, but equivalent controlled operations are required:

| Method | Operation | Permission |
|---|---|---|
| `GET` | `/staff/session` | Authenticated staff |
| `GET` | `/tenants/{tenantId}/locations/{locationId}/catalog` | `orders.read` |
| `GET` | `/products/{productId}/availability` | `inventory.read` |
| `GET` | `/customers?query=...` | `customers.read` |
| `POST` | `/customers` | `customers.create` |
| `PATCH` | `/customers/{customerId}` | `customers.update` |
| `POST` | `/orders` | `orders.create` |
| `GET` | `/orders/{orderId}` | Tenant-scoped `orders.read` |
| `POST` | `/orders/{orderId}/cancel` | `orders.cancel` or approval role |
| `POST` | `/audit/events` | Trusted service or controlled client endpoint |

## 9. Synchronization and Refresh Rules

- Load the current catalog after staff authentication and location selection.
- Refresh inventory before showing final order confirmation.
- Revalidate all product and price versions during submission.
- Prefer server events/realtime updates for stock and price changes.
- If realtime updates are unavailable, refresh active product availability at a defined short interval and on window focus.
- Cache catalog display data only for the authorized tenant/location.
- Clear sensitive customer data and staff session data when the session is locked or expires.
- Never treat browser `localStorage` as the authoritative order, inventory, price, customer, or audit database.
- An offline draft may be retained only if encrypted and explicitly approved; it must never reduce inventory until accepted by the server.
- Display a visible stale/offline warning and prevent final submission when authoritative validation is unavailable.

## 10. Authentication, Authorization, and Consent

Production access must be deny-by-default and granted only after SMB-owner-authorized staff authentication.

Minimum controls:

- Server-side session validation
- Tenant and location isolation
- RBAC permissions checked on every operation
- Short staff inactivity timeout according to platform policy
- Reauthentication for sensitive customer or order-management actions
- Owner-controlled activation, suspension, and removal of staff access
- No shared staff passwords or permanent authorization codes
- No secrets embedded in HTML, JavaScript, GitHub Pages, URLs, or browser storage
- Customer contact information available only to roles with a business need
- Separate operational contact permission from marketing consent

The current static login and sample products are visual MVP behavior only and are not production authentication or authoritative business data.

## 11. Audit Requirements

Record at least:

- Staff login success, failure, logout, lock, and expiry
- Catalog access and location selection
- Customer search, creation, update, and restricted-data access
- Product added to or removed from an order
- Price or inventory validation failure
- Order review, submission, acceptance, rejection, cancellation, and refund
- Inventory reservation, reduction, release, and correction
- Permission denial and suspicious repeated attempts
- Administrative changes to staff roles or access

Each audit record should include `eventId`, `eventType`, `tenantId`, `locationId`, `staffUserId`, `sessionId`, `correlationId`, server timestamp, outcome, affected record IDs, and safe metadata. Passwords, authorization codes, full payment data, and unnecessary customer PII must never be logged.

## 12. Failure and Conflict Handling

| Condition | Required behavior |
|---|---|
| Product deactivated | Remove or disable it and explain that it is unavailable |
| Price changed | Show the new price and require staff reconfirmation |
| Insufficient inventory | Prevent submission and show the available quantity |
| Product/customer version conflict | Reload the latest record before retry |
| Session expired | Lock the station and require authentication |
| Permission removed | Stop the operation immediately and log the denial |
| Network unavailable | Preserve only an approved draft; do not report a completed sale |
| Duplicate submission | Return the original result using the idempotency key |
| Partial backend failure | Roll back the entire order transaction |
| Image unavailable | Show an accessible placeholder without blocking authorized ordering |

## 13. Security and Governance Baseline

The integration should align with the platform's NIST, CISA, OWASP, and PCI DSS governance objectives:

- Least privilege and separation of duties
- Strong authentication and session management
- Tenant isolation and server-side authorization
- Input validation and output encoding
- TLS for all data in transit
- Encryption and controlled access for stored PII
- Secret management outside source code
- Dependency and change-control review
- Central audit logging, monitoring, and incident response
- Data minimization, retention, correction, and deletion controls
- Payment data handled only by an approved payment service; the order-taker must not store sensitive card data

## 14. Acceptance Criteria

Integration is ready only when:

- Products, images, prices, and stock shown by the order-taker come from the authorized `smbs` data service.
- Customer access is tenant-scoped, minimal, and RBAC-controlled.
- The server recalculates every submitted order.
- Order creation and inventory reduction are atomic.
- Duplicate submissions cannot create duplicate sales.
- Price and stock conflicts are clearly handled.
- Staff authentication and authorization are server-enforced.
- Every material action creates an audit event.
- No production secret or sensitive PII exists in the public repository.
- Mobile, tablet, laptop, desktop, and 100%–250% browser zoom remain supported.
- Automated integration, authorization, transaction, accessibility, and responsive-layout tests pass.

## 15. Implementation Sequence

1. Approve this data contract and map it to the current `smbs` data model.
2. Implement authenticated staff sessions and RBAC.
3. Implement tenant/location-scoped catalog reads.
4. Replace the hard-coded demo products with catalog service responses.
5. Implement controlled customer search/create/update.
6. Implement atomic order, sale, inventory, accounting, and audit processing.
7. Add realtime or version-based synchronization.
8. Test security, tenant isolation, conflicts, responsive behavior, and accessibility.
9. Complete penetration testing and owner approval before production use.
