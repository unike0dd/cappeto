import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp' };
const server = createServer((request, response) => {
  const requested = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, '');
  const file = join(root, safePath);
  if (!existsSync(file)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(response);
});

server.listen(4173, '0.0.0.0', () => console.log('Order station preview ready'));
