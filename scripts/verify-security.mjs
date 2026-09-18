import {readFile} from "node:fs/promises";

const htmlFiles = process.argv.slice(2);
if (!htmlFiles.length) throw new Error("Provide at least one HTML file.");
const requiredMeta = [
  /<meta charset=/i, /name="viewport"/i, /http-equiv="Content-Security-Policy"/i,
  /name="description"/i, /name="referrer"/i, /name="robots"/i,
  /rel="canonical"/i, /property="og:title"/i, /property="og:description"/i
];
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const pattern of requiredMeta) if (!pattern.test(html)) throw new Error(`${file} is missing ${pattern}`);
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1] || "";
  for (const directive of ["default-src 'self'", "script-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "upgrade-insecure-requests"]) {
    if (!csp.includes(directive)) throw new Error(`${file} CSP lacks ${directive}`);
  }
  if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) throw new Error(`${file} CSP permits unsafe execution`);
  if (/\son[a-z]+\s*=/i.test(html)) throw new Error(`${file} contains an inline event handler`);
}
const headersText = await readFile("_headers", "utf8");
for (const name of ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Cross-Origin-Opener-Policy", "Cross-Origin-Resource-Policy", "Reporting-Endpoints"]) {
  if (!headersText.includes(name + ":")) throw new Error(`_headers is missing ${name}`);
}
if (/X-XSS-Protection:/i.test(headersText)) throw new Error("_headers contains obsolete X-XSS-Protection.");
const securityTxt = await readFile(".well-known/security.txt", "utf8");
for (const field of ["Contact:", "Expires:", "Canonical:"]) if (!securityTxt.includes(field)) throw new Error(`security.txt is missing ${field}`);
const workerText = await readFile("cloudflare/worker.js", "utf8");
for (const control of ["Sec-Fetch-Site", "Reporting-Endpoints", "trusted_backend_not_connected", "X-Content-Type-Options"]) {
  if (!workerText.includes(control)) throw new Error(`Cloudflare Worker lacks ${control}`);
}
const wranglerText = await readFile("wrangler.toml", "utf8");
for (const control of ["[env.non_specific]", "[env.production]", 'binding = "ASSETS"', "run_worker_first = true"]) {
  if (!wranglerText.includes(control)) throw new Error(`wrangler.toml lacks ${control}`);
}
const combined = (await Promise.all(["app.js", "login.js", "server.mjs", "cloudflare/worker.js"].map(async file => readFile(file, "utf8").catch(() => "")))).join("\n");
for (const forbidden of ["consumer@cappeto.demo", "static-preview", "sk_live_", "BEGIN PRIVATE KEY"]) {
  if (combined.includes(forbidden)) throw new Error(`Forbidden credential or demo-auth marker found: ${forbidden}`);
}
for (const workflow of [".github/workflows/security.yml", ".github/workflows/cloud-validate.yml", ".github/workflows/cloudflare-deploy.yml"]) {
  const yaml = await readFile(workflow, "utf8");
  if (/pull_request_target:/i.test(yaml)) throw new Error(`${workflow} uses pull_request_target`);
  for (const match of yaml.matchAll(/uses:\s*[^\s@]+@([^\s#]+)/g)) {
    if (!/^[0-9a-f]{40}$/.test(match[1])) throw new Error(`${workflow} has an unpinned action: ${match[0]}`);
  }
}
console.log("Security, metadata, Cloudflare, and supply-chain checks passed.");
