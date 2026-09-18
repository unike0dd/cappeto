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
  if (contentType.includes("text/html") || path.endsWith("/login.html")) {
    headers.set("Cache-Control", "no-store");
  } else if (path === "/.well-known/asset-manifest.json" || path === "/.well-known/security.txt") {
    headers.set("Cache-Control", "no-store");
  } else {
    headers.set("Cache-Control", "public, max-age=3600");
  }
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
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
      const length = Number(request.headers.get("Content-Length") || 0);
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
    if (url.pathname.startsWith("/api/")) {
      return secure(Response.json({error: "trusted_backend_not_connected"}, {status: 503}), request);
    }
    if (!["GET", "HEAD"].includes(method)) {
      return secure(new Response("Method Not Allowed", {status: 405}), request);
    }
    return secure(await env.ASSETS.fetch(request), request);
  }
};
