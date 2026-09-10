import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!script) throw new Error('Inline application script not found');
new Function(script);
for (const asset of ['sparkling-cola.webp', 'orange-soda.webp', 'cafe-latte.webp', 'double-espresso.webp', 'fresh-milk.webp']) {
  if (!existsSync(`assets/products/${asset}`)) throw new Error(`Missing product asset: ${asset}`);
}
for (const marker of ['z-index:1000', 'z-index:2500', 'marxia:order-submitted', 'Review order']) {
  if (!html.includes(marker)) throw new Error(`Missing required marker: ${marker}`);
}
console.log('Order station verification passed');
