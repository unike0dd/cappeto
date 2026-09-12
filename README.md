# Cappeto Café Catalog

Cappeto is a compact web application for presenting a café menu, preparing customer orders, and maintaining a small product inventory. It combines a customer-facing catalog with a separate staff workspace in a responsive interface designed for desktop and mobile browsers.

## Main features

- Browse products by category and search the menu.
- Review product descriptions, availability, and prices.
- Add products to an order, adjust quantities, and review totals.
- Maintain a catalog of up to 20 products from the staff workspace.
- Add, edit, and remove products and record inventory changes.
- Upload product pictures that are converted to WebP in the browser.
- Switch between English and Spanish on the sign-in screen.
- Choose a dark or light visual theme.

## Repository layout

- `index.html` contains the application structure and user-interface views.
- `styles.css` defines the responsive layout, components, and color themes.
- `app.js` manages interface state, catalog rendering, orders, product management, and user preferences.
- `server.mjs` provides the local web server and application endpoints.
- `data/products.json` contains the initial catalog data.
- `assets/products/` stores the bundled product images.
- `uploads/` is reserved for product images added while the application is running.

## Run locally

The project requires a recent Node.js version and does not require a dependency-install step.

```bash
npm run dev
```

The application is then available at `http://localhost:4173` by default.

## Product data

Each catalog item includes a name, category, short description, price, available quantity, and product-image path. The bundled catalog can be updated in `data/products.json`, while changes made through the running application are stored separately from the starter data.

## Interface preferences

Language and theme selections are remembered in the browser. The responsive layout supports wide screens, tablets, mobile devices, keyboard navigation, and enlarged browser zoom levels.
