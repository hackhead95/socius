// Turns the single-file build (dist-artifact/index.html) into the page body the claude.ai Artifact
// tool expects: no doctype/html/head/body wrappers (the host adds its own skeleton), <title> first.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync('dist-artifact/index.html', 'utf8');
// Inlined JS may contain literal "</head>" or "<body>" strings, so locate the real document
// boundaries from the end: the body holds only the root element and comes last.
const headStart = html.indexOf('<head>') + '<head>'.length;
const headEnd = html.lastIndexOf('</head>');
const bodyStart = html.lastIndexOf('<body>') + '<body>'.length;
const bodyEnd = html.lastIndexOf('</body>');
if (headStart < 6 || headEnd < headStart || bodyStart < headEnd || bodyEnd < bodyStart) throw new Error('Unexpected build output layout');
const head = html.slice(headStart, headEnd);
const body = html.slice(bodyStart, bodyEnd);
// Tags written by index.html come before the inlined <script>/<style> blocks; don't scan inside JS.
const firstInline = Math.min(...['<script', '<style'].map((t) => { const i = head.indexOf(t); return i < 0 ? head.length : i; }));
const meta = head.slice(0, firstInline);
const title = meta.match(/<title>[\s\S]*?<\/title>/i)?.[0] ?? '<title>Socius</title>';
const links = [...meta.matchAll(/<link[^>]+rel="stylesheet"[^>]+fonts\.googleapis\.com[^>]*>/gi)].map((m) => m[0]);
const preconnects = [...meta.matchAll(/<link[^>]+rel="preconnect"[^>]*>/gi)].map((m) => m[0]);
// Walk the head's top-level <style>/<script> blocks in order. Raw JS/CSS cannot contain their own
// closing tags, so the first closing tag after an opening tag ends the block.
const styles = [];
const scripts = [];
for (let i = firstInline; i < head.length; ) {
  const next = head.slice(i).search(/<(script|style)\b/i);
  if (next < 0) break;
  const at = i + next;
  const kind = head.slice(at + 1, at + 7).toLowerCase().startsWith('script') ? 'script' : 'style';
  const close = head.indexOf(`</${kind}>`, at);
  if (close < 0) throw new Error(`Unclosed <${kind}> in build output`);
  const block = head.slice(at, close + kind.length + 3);
  (kind === 'script' ? scripts : styles).push(block);
  i = close + kind.length + 3;
}
const out = [title, ...new Set(preconnects.map((l) => l.replace(/\s*\/?>$/, " />"))), ...links, ...styles, body.trim(), ...scripts].join('\n');
mkdirSync('dist-artifact', { recursive: true });
writeFileSync('dist-artifact/socius.html', out);
console.log(`dist-artifact/socius.html written (${(out.length / 1024 / 1024).toFixed(2)} MB)`);
