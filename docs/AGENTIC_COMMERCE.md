# Agentic commerce readiness

Status: integration foundation only. No agent, payment flow, or production catalog is deployed by this change.

## Intended experience

A shopper can describe a need in English or Spanish, refine it through conversation, review grounded product results, add items to a cart, and explicitly approve checkout. The interface must remain usable without conversation through ordinary search, categories, cart, and checkout controls.

Google AI Commerce Search uses the conversational endpoint for dialogue and a separate search request for product results. The application therefore treats conversational text and catalog results as separate responses tied together by a conversation ID.

## System boundary

```text
Consumer UI -> Cappeto commerce API -> public catalog/search
                               |-> conversational commerce adapter
                               |-> cart and price authority
                               |-> Stripe checkout adapter
                               |-> order and webhook processor
```

Only the Cappeto commerce API may call cloud commerce services or Stripe with privileged credentials. The model may propose tools; the server validates every argument and decides whether the action is permitted.

## Allowed agent capabilities

- Search and filter published products.
- Answer questions grounded in published catalog fields and approved business information.
- Suggest pairings and alternatives without inventing availability, price, ingredients, or dietary claims.
- Create or modify a temporary cart after showing the intended change.
- Create a server-side checkout session only after explicit shopper confirmation.
- Retrieve an order status only for an authenticated or possession-verified shopper.
- Transfer to a person or ordinary checkout whenever the agent cannot safely proceed.

## Prohibited capabilities

- Reading purchase cost, supplier data, inventory movements, margins, returns, damage, accounting, staff, tenant administration, or unpublished products.
- Writing product, price, tax, stock, refund, or accounting records.
- Accepting or storing raw card details.
- Completing a purchase, changing quantities, substituting products, or issuing refunds without the required user confirmation.
- Treating model-generated totals as authoritative.

## Transaction rules

1. Product discovery reads the public catalog projection defined in `contracts/public-catalog-item.schema.json`.
2. The server rechecks product state, price, tax, delivery, and availability for every cart mutation.
3. Checkout uses an idempotency key and a short-lived server-created session.
4. The buyer reviews an itemized final total and performs the payment authorization.
5. Signed webhooks, not the conversational response, advance payment and order state.
6. The order record stores consent, selected items, totals, fulfillment choice, and provider references; it never stores raw payment credentials.

## Protocol posture

The API contract follows the UCP commerce lifecycle: discovery, cart, checkout, and order. Stripe agentic-commerce support is feature-gated because agent-side functionality is documented as private preview. Initial rollout should use Stripe-hosted checkout or an approved embedded checkout while keeping Cappeto as Merchant of Record.

## Activation gates

- Confirm Google Cloud product availability, region, quotas, pricing, and data residency.
- Import and validate a DEV-only public catalog.
- Configure bilingual grounding, brand instructions, restricted categories, and fallback behavior.
- Complete Stripe account review and select UCP or ACP only when generally available and contractually approved.
- Establish webhook verification, idempotency, audit events, human escalation, accessibility testing, and abuse limits.
- Run test purchases in isolated test mode before STAGING or PRODUCTION.
