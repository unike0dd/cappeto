# Cappeto design and engineering review

## Study

The original repository was a one-file staff order prototype with a strong forest-and-gold visual identity, five café WebP samples, cart calculations, and a consent-oriented login screen. The committed HTML referenced non-existent `assets/products/` paths, while package scripts referenced a non-existent `scripts/` directory. Authentication was browser-only and accepted any password with six characters, so it did not protect owner functions.

## Analyze

The product presentation was dramatic but optimized for one item at a time. A consumer comparing up to 20 products needs a scannable catalog, while an owner needs a separate, protected management surface. GitHub Pages can host a static catalog but cannot provide secure sign-in, uploads, persistence, or authoritative totals.

## Determine

The appropriate small-but-scalable boundary is a responsive catalog plus a compact HTTP API:

- Public catalog: search, categories, picture cards, price, stock, and cart.
- Protected owner surface: server sign-in and a maximum of 20 product uploads.
- Image flow: JPG, PNG, or WebP input; browser resize and WebP conversion; server signature and size validation.
- Commerce flow: server reloads current prices and stock and calculates subtotal, 15% VAT, and total.
- Persistence: JSON and local WebP files for the prototype; database, object storage, and shared sessions are explicit production replacements.

## Visual direction

The redesign keeps the café character through deep forest, cream, and copper. Product photography is given a consistent 4:3 stage, editorial serif headings provide warmth, and restrained controls keep the interface quiet. The catalog uses a responsive carousel showing one large product on phones, two on tablets, and three on laptop/desktop screens, while the order remains available in a focused side drawer.

## Verification

- Static JavaScript syntax and required-file checks pass.
- The five WebP sample paths resolve.
- Catalog API returns five products and a 15% VAT rate.
- A two-latte quote returns subtotal $7.50, VAT $1.13, and total $8.63.
- Invalid credentials return HTTP 401.
- Browser QA confirms the catalog, category controls, five product cards, cart drawer, and $4.31 one-latte total.
- Carousel QA confirms previous/next navigation, touch/trackpad scrolling, keyboard arrows, responsive card widths, and live position status.
- No application console errors were observed; browser-extension metadata warnings were unrelated to Cappeto.
