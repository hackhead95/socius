// Tiny static server for the crawler: serves a built Socius under a sub-path (default /socius/), like
// GitHub Pages does, so relative asset paths and the guide/ link are exercised the same way.
// Usage: node scripts/crawl/serve.mjs --dir /tmp/crawl/dist --port 4391 [--base /socius/]
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]?.startsWith('--') ? 'true' : all[i + 1] ?? 'true']] : acc), []),
);
const dir = args.dir ?? '/tmp/crawl/dist';
const port = Number(args.port ?? 4391);
const base = (args.base ?? '/socius/').replace(/\/?$/, '/');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.sav': 'application/octet-stream', '.txt': 'text/plain',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json', '.map': 'application/json',
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  let path = decodeURIComponent(url.pathname);
  if (path === base.slice(0, -1)) {
    res.writeHead(301, { Location: base });
    return res.end();
  }
  if (!path.startsWith(base)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('not found (the app lives under ' + base + ')');
  }
  let file = normalize(join(dir, path.slice(base.length)));
  if (!file.startsWith(normalize(dir))) {
    res.writeHead(403);
    return res.end();
  }
  if (existsSync(file) && statSync(file).isDirectory()) {
    // Like GitHub Pages: a directory without its trailing slash redirects to it.
    if (!path.endsWith('/')) {
      res.writeHead(301, { Location: path + '/' + url.search });
      return res.end();
    }
    file = join(file, 'index.html');
  }
  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`crawl server: http://127.0.0.1:${port}${base} -> ${dir}`));
