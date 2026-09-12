# Cappeto café catalog

A small, responsive café catalog with a public customer menu and a protected staff product manager.

## Run locally

1. Copy `.env.example` to `.env` and export its values in your runtime.
2. Run `npm run dev`.
3. Open `http://localhost:4173`.

The static prototype includes owner-provided demonstration access without displaying credentials in the interface or documentation. Production startup fails closed unless the email, password, and session secret are supplied privately.

## What is included

- Public responsive catalog with five sample café products
- Server-validated sign-in with an HttpOnly, signed session cookie and CSRF token
- Staff upload manager capped at 20 products
- JPG/PNG/WebP input converted by the browser to optimized WebP
- Server validation of WebP signatures and a 2.5 MB stored-image limit
- Server-authoritative price, VAT, stock, quote, and order calculations
- JSON persistence suitable for the small prototype
- Responsive carousel and navigation designed to remain usable through 250% browser zoom

## Scale-up boundary

The HTTP/API contract separates the interface from storage so JSON can later be replaced with PostgreSQL and object storage without redesigning the catalog. Before multi-instance production deployment, move sessions to a shared session store, product records to a transactional database, uploads to object storage, and orders to an idempotent transaction service.
