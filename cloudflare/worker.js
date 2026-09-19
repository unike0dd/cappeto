const CSP = "default-src 'self'; img-src 'self' data: blob:; connect-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; frame-src 'none'; upgrade-insecure-requests; report-to csp-endpoint";

const SECURITY_HEADERS = {
  "Content-Security-Policy": CSP,
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
  "Permissions-Policy": "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Permitted-Cross-Domain-Policies": "none"
};

function secure(response, request) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  headers.set("Reporting-Endpoints", 'csp-endpoint="/__security/reports"');
  headers.delete("X-XSS-Protection");
  const path = new URL(request.url).pathname;
  const contentType = headers.get("Content-Type") || "";
  if (response.status >= 400 || path.startsWith("/api/") || path === "/__security/reports" ||
      contentType.includes("text/html") || path.endsWith("/login.html") ||
      path === "/.well-known/asset-manifest.json" || path === "/.well-known/security.txt") {
    headers.set("Cache-Control", "no-store");
  } else {
    headers.set("Cache-Control", "public, max-age=3600");
  }
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
}

async function publicCatalog(request, env) {
  const assetUrl = new URL("/data/products.json", request.url);
  const source = await env.ASSETS.fetch(new Request(assetUrl, {method: "GET"}));
  if (!source.ok) return Response.json({error: "catalog_unavailable"}, {status: 503});
  const catalog = await source.json();
  const products = Array.isArray(catalog.products) ? catalog.products.map(product => {
    const {procurementCostCents, purchaseTaxRate, purchaseDeliveryCents, procurementQuantity, returned, damaged, sold, purchaseDate, ...published} = product;
    return published;
  }) : [];
  return Response.json({...catalog, products});
}

async function previewQuote(request, env) {
  const lengthHeader = request.headers.get("Content-Length");
  if (!lengthHeader || !/^\d+$/.test(lengthHeader)) return Response.json({error: "length_required"}, {status: 411});
  const length = Number(lengthHeader);
  if (length > 16384) return Response.json({error: "payload_too_large"}, {status: 413});
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items)) return Response.json({error: "invalid_request"}, {status: 400});
  const catalogResponse = await publicCatalog(request, env);
  if (!catalogResponse.ok) return catalogResponse;
  const catalog = await catalogResponse.json();
  const products = Array.isArray(catalog.products) ? catalog.products : [];
  const lines = body.items.map(item => ({
    product: products.find(product => product.id === item.productId),
    quantity: Number(item.quantity)
  })).filter(line => line.product && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99);
  if (lines.length !== body.items.length) return Response.json({error: "invalid_items"}, {status: 400});
  const subtotalCents = lines.reduce((sum, line) => sum + Number(line.product.priceCents) * line.quantity, 0);
  const vatCents = lines.reduce((sum, line) => sum + Math.round(Number(line.product.priceCents) * line.quantity * Number(line.product.vatRate ?? catalog.vatRate ?? 0) / 100), 0);
  return Response.json({subtotalCents, vatCents, totalCents: subtotalCents + vatCents, vatRate: Number(catalog.vatRate ?? 0), previewOnly: true});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);
    if (request.headers.get("Sec-Fetch-Site") === "cross-site" && unsafe) {
      return secure(new Response("Forbidden", {status: 403}), request);
    }
    if (url.pathname === "/__security/reports") {
      if (method !== "POST") return secure(new Response("Method Not Allowed", {status: 405}), request);
      const lengthHeader = request.headers.get("Content-Length");
      if (!lengthHeader || !/^\d+$/.test(lengthHeader)) return secure(new Response("Length Required", {status: 411}), request);
      const length = Number(lengthHeader);
      if (length > 32768) return secure(new Response("Payload Too Large", {status: 413}), request);
      const type = request.headers.get("Content-Type") || "";
      if (!type.includes("application/reports+json") && !type.includes("application/csp-report")) {
        return secure(new Response("Unsupported Media Type", {status: 415}), request);
      }
      const reports = await request.json().catch(() => []);
      const list = Array.isArray(reports) ? reports : [reports];
      console.log(JSON.stringify({event: "browser-security-report", count: Math.min(list.length, 50), types: list.slice(0, 50).map(item => item?.type || "csp")}));
      return secure(new Response(null, {status: 204}), request);
    }

    if (url.pathname === "/api/products" && method === "GET") {
      return secure(await publicCatalog(request, env), request);
    }
    if (url.pathname === "/api/orders/quote" && method === "POST") {
      return secure(await previewQuote(request, env), request);
    }

    if (url.pathname.startsWith("/api/")) {
      return secure(Response.json({error: "trusted_backend_not_connected"}, {status: 503}), request);
    }
    if (!["GET", "HEAD"].includes(method)) {
      return secure(new Response("Method Not Allowed", {status: 405}), request);
    }
    return secure(await env.ASSETS.fetch(request), request);
  }
};
