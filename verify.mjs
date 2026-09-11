import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const required=['index.html','styles.css','app.js','server.mjs','data/products.json','.env.example'];
for(const file of required)if(!existsSync(file))throw new Error(`Missing ${file}`);
for(const file of ['app.js','server.mjs']){
  const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(check.status!==0)throw new Error(check.stderr);
}
const products=JSON.parse(readFileSync('data/products.json','utf8'));
if(products.products.length>20)throw new Error('Catalog exceeds 20 products');
for(const product of products.products){if(!Number.isInteger(product.priceCents)||product.priceCents<1)throw new Error(`Invalid price: ${product.id}`);if(!existsSync(product.imageUrl.replace(/^\//,'')))throw new Error(`Missing image: ${product.imageUrl}`)}
const html=readFileSync('index.html','utf8');
for(const marker of ['authForm','productImage','subtotal','vat','total'])if(!html.includes(marker))throw new Error(`Missing UI marker: ${marker}`);
console.log('Cappeto verification passed');
