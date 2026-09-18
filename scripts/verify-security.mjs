import {readFile} from 'node:fs/promises';

const htmlFiles=process.argv.slice(2);
if(!htmlFiles.length)throw new Error('Provide at least one HTML file.');
const requiredMeta=[
  /<meta charset=/i,
  /name="viewport"/i,
  /http-equiv="Content-Security-Policy"/i,
  /name="description"/i,
  /name="referrer"/i,
  /name="robots"/i,
  /rel="canonical"/i,
  /property="og:title"/i,
  /property="og:description"/i
];
for(const file of htmlFiles){
  const html=await readFile(file,'utf8');
  for(const pattern of requiredMeta)if(!pattern.test(html))throw new Error(`${file} is missing ${pattern}`);
  const csp=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1]||'';
  if(!csp.includes("default-src 'self'"))throw new Error(`${file} CSP lacks a self default`);
  if(csp.includes("'unsafe-inline'")||csp.includes("'unsafe-eval'"))throw new Error(`${file} CSP permits unsafe script execution`);
  if(/\son[a-z]+\s*=/i.test(html))throw new Error(`${file} contains an inline event handler`);
}
const headers=await readFile('_headers','utf8');
for(const name of ['Content-Security-Policy','Strict-Transport-Security','X-Content-Type-Options','X-Frame-Options','Referrer-Policy','Permissions-Policy']){
  if(!headers.includes(name+':'))throw new Error(`_headers is missing ${name}`);
}
const combined=(await Promise.all(['app.js','login.js','server.mjs'].map(async file=>readFile(file,'utf8').catch(()=>'')))).join('\n');
for(const forbidden of ['consumer@cappeto.demo','static-preview','sk_live_','BEGIN PRIVATE KEY']){
  if(combined.includes(forbidden))throw new Error(`Forbidden credential or demo-auth marker found: ${forbidden}`);
}
console.log('Security and metadata checks passed.');
