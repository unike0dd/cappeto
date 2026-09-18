# Cappeto Business Menu and Inventory

Cappeto is a bilingual web application for small and medium restaurants, cafés, food stalls, home-based food businesses, and other independent sellers. It combines a customer-facing menu and ordering experience with a separate workspace for products, inventory, sales, returns, damaged goods, taxes, and summary reports.

The interface is designed to be usable across desktop, tablet, and mobile screens, including by people who navigate with a keyboard, use a screen reader, enlarge browser content, prefer reduced motion, or use high-contrast settings.

## Main features

- Browse products by category and search the menu.
- Review product descriptions, availability, and prices.
- Add products to an order, adjust quantities, and review totals.
- Maintain a catalog of up to 20 products from the staff workspace.
- Add, edit, and remove products and record inventory changes.
- Upload product pictures that are converted to WebP in the browser.
- Switch between English and Spanish throughout the interface.
- Choose a dark or light visual theme.
- Review daily and 10-day reports and download them as CSV files.

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

## Inclusive interface

Language and theme selections are remembered in the browser. The responsive interface includes semantic headings and labels, visible keyboard focus, keyboard-operable controls, text alternatives for meaningful images, status announcements, reduced-motion support, high-contrast adjustments, and layouts that reflow for smaller screens and enlarged browser views.
