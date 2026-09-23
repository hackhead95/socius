// Turns the single-file build (dist-artifact/index.html) into the page body the claude.ai Artifact
// tool expects: no doctype/html/head/body wrappers (the host adds its own skeleton), <title> first.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync('dist-artifact/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
const body = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? '';
const title = head.match(/<title>[\s\S]*?<\/title>/i)?.[0] ?? '<title>Socius</title>';
const links = [...head.matchAll(/<link[^>]+rel="stylesheet"[^>]+fonts\.googleapis\.com[^>]*>/gi)].map((m) => m[0]);
const preconnects = [...head.matchAll(/<link[^>]+rel="preconnect"[^>]*>/gi)].map((m) => m[0]);
const styles = [...head.matchAll(/<style[\s\S]*?<\/style>/gi)].map((m) => m[0]);
const scripts = [...head.matchAll(/<script[\s\S]*?<\/script>/gi)].map((m) => m[0]);
const out = [title, ...preconnects, ...links, ...styles, body.trim(), ...scripts].join('\n');
mkdirSync('dist-artifact', { recursive: true });
writeFileSync('dist-artifact/socius.html', out);
console.log(`dist-artifact/socius.html written (${(out.length / 1024 / 1024).toFixed(2)} MB)`);
