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
for(const marker of ['authForm','productImage','subtotal','vat','total','previousProduct','nextProduct','carouselPosition'])if(!html.includes(marker))throw new Error(`Missing UI marker: ${marker}`);
const css=readFileSync('styles.css','utf8');
for(const marker of ['html{scroll-behavior:smooth;overflow-x:hidden}','grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)','@media(max-width:760px)','@media(max-width:560px)','flex-basis:100%','overflow-wrap:anywhere'])if(!css.includes(marker))throw new Error(`Missing 250% zoom safeguard: ${marker}`);
console.log('Cappeto verification passed');
