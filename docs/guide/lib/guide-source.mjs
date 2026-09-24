// Reads docs/guide/guide.md (a small Markdown dialect) into a simple document tree that both the
// HTML/PDF builder and the Word builder render. No dependencies.
//
// Block types:
//   { type: 'h1' | 'h2' | 'h3', text, id, number?, appendix? }
//   { type: 'p', inl }
//   { type: 'ul' | 'ol', items: [{ inl, sub?: { type, items } }] }
//   { type: 'table', head: [inl...], rows: [[inl...]...] }
//   { type: 'img', src, caption: inl, width? (percent of the text column) }
//   { type: 'callout', kind, title, blocks }
// Inline nodes (inl is an array):
//   { t: 'text', v } { t: 'strong', v, menu } { t: 'em', v } { t: 'code', v } { t: 'kbd', v }
//   { t: 'link', v, href } { t: 'token', v: 'APP_URL' | 'SITE_URL' | 'GUIDE_URL' | 'FEEDBACK_URL' }

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const GUIDE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_DIR = join(GUIDE_DIR, '..', '..');
export const PUBLIC_GUIDE_DIR = join(REPO_DIR, 'public', 'guide');

/** Web addresses used in the PDF and Word files (the web page links to the app relatively). */
export function resolveUrls(argv = process.argv.slice(2), env = process.env) {
  const arg = (k) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  let site = arg('--site-url') || env.SITE_URL || 'https://hackhead95.github.io/socius/';
  if (!site.endsWith('/')) site += '/';
  const feedback = arg('--feedback-url') || env.FEEDBACK_URL || deriveFeedback(site);
  return { SITE_URL: site, APP_URL: site, GUIDE_URL: `${site}guide/`, FEEDBACK_URL: feedback };
}

/** https://owner.github.io/repo/ -> https://github.com/owner/repo/issues/new/choose */
function deriveFeedback(site) {
  const m = /^https?:\/\/([a-z0-9-]+)\.github\.io\/([^/]+)\/?/i.exec(site);
  if (m) return `https://github.com/${m[1]}/${m[2]}/issues/new/choose`;
  return 'https://github.com/hackhead95/socius/issues/new/choose';
}

export function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ------------------------------------------------------------------ inline
const INLINE = /(\*\*([^*]+)\*\*)|(\*([^*\s][^*]*)\*)|(`([^`]+)`)|(\[\[([^\]]+)\]\])|(\[([^\]]+)\]\(([^)\s]+)\))|(\{\{([A-Z_]+)\}\})/g;

export function inline(src) {
  const out = [];
  let last = 0;
  for (const m of src.matchAll(INLINE)) {
    if (m.index > last) out.push({ t: 'text', v: src.slice(last, m.index) });
    if (m[1]) out.push({ t: 'strong', v: m[2], menu: / > /.test(m[2]) });
    else if (m[3]) out.push({ t: 'em', v: m[4] });
    else if (m[5]) out.push({ t: 'code', v: m[6] });
    else if (m[7]) out.push({ t: 'kbd', v: m[8] });
    else if (m[9]) out.push({ t: 'link', v: m[10], href: m[11] });
    else if (m[12]) out.push({ t: 'token', v: m[13] });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ t: 'text', v: src.slice(last) });
  return out;
}

/** Plain text of inline nodes (tokens rendered with the given urls). */
export function plain(inl, urls = {}) {
  return inl.map((n) => (n.t === 'token' ? urls[n.v] ?? '' : n.v)).join('');
}

// ------------------------------------------------------------------ blocks
function parseBlocks(lines) {
  const blocks = [];
  let i = 0;
  const isBlank = (l) => !l || !l.trim();
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line) || /^<!--/.test(line.trim())) {
      if (/^<!--/.test(line.trim())) {
        while (i < lines.length && !lines[i].includes('-->')) i++;
      }
      i++;
      continue;
    }
    let m;
    if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) {
      blocks.push({ type: `h${m[1].length}`, text: m[2].trim() });
      i++;
      continue;
    }
    if ((m = /^:::(\w+)\s*(.*)$/.exec(line))) {
      const inner = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') inner.push(lines[i++]);
      i++;
      blocks.push({ type: 'callout', kind: m[1], title: m[2].trim(), blocks: parseBlocks(inner) });
      continue;
    }
    if ((m = /^!\[([^\]]*)\]\(([^)]+)\)(\{([^}]*)\})?\s*$/.exec(line))) {
      const attrs = m[4] || '';
      const w = /width=(\d+)/.exec(attrs);
      blocks.push({ type: 'img', caption: inline(m[1]), src: m[2], width: w ? Number(w[1]) : undefined, big: /(^|\s)\.big\b/.test(attrs) });
      i++;
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|\s*$/g, '').split('|').map((c) => inline(c.trim()));
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      blocks.push({ type: 'table', head, rows: body });
      continue;
    }
    if (/^(\s*)([-*]|\d+\.)\s+/.test(line)) {
      const { list, next } = parseList(lines, i, 0);
      blocks.push(list);
      i = next;
      continue;
    }
    // paragraph: consecutive lines that are not another block
    const para = [];
    while (i < lines.length && !isBlank(lines[i]) && !/^(#{1,3}\s|:::|!\[|\||\s*([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++].trim());
    if (para.length) blocks.push({ type: 'p', inl: inline(para.join(' ')) });
    else i++;
  }
  return blocks;
}

function parseList(lines, i, indent) {
  const first = /^(\s*)([-*]|\d+\.)\s+/.exec(lines[i]);
  const type = /\d/.test(first[2]) ? 'ol' : 'ul';
  const items = [];
  while (i < lines.length) {
    const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
    if (!m) break;
    const ind = m[1].length;
    if (ind < indent) break;
    if (ind > indent) {
      const { list, next } = parseList(lines, i, ind);
      if (items.length) items[items.length - 1].sub = list;
      i = next;
      continue;
    }
    items.push({ inl: inline(m[3].trim()) });
    i++;
  }
  return { list: { type, items }, next: i };
}

/** Parse the guide. Returns { meta, blocks, toc } with chapter numbers and heading ids. */
export function loadGuide(path = join(GUIDE_DIR, 'guide.md')) {
  let text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const meta = {};
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (fm) {
    for (const l of fm[1].split('\n')) {
      const m = /^(\w+):\s*(.*)$/.exec(l);
      if (m) meta[m[1]] = m[2].trim();
    }
    text = text.slice(fm[0].length);
  }
  const blocks = parseBlocks(text.split('\n'));
  let n = 0;
  const toc = [];
  const used = new Set();
  let chapter = null;
  for (const b of blocks) {
    if (!/^h[123]$/.test(b.type)) continue;
    let id = slug(b.text.replace(/^Appendix [A-Z]:\s*/, ''));
    while (used.has(id)) id += '-x';
    used.add(id);
    b.id = id;
    if (b.type === 'h1') {
      const app = /^Appendix ([A-Z]):\s*(.*)$/.exec(b.text);
      if (app) {
        b.appendix = app[1];
        b.label = `Appendix ${app[1]}`;
        b.title = app[2];
      } else {
        b.number = ++n;
        b.label = String(n);
        b.title = b.text;
      }
      chapter = { id, label: b.label, title: b.title, appendix: !!app, sections: [] };
      toc.push(chapter);
    } else if (b.type === 'h2' && chapter) {
      b.title = b.text;
      chapter.sections.push({ id, title: b.text });
    } else {
      b.title = b.text;
    }
  }
  return { meta, blocks, toc };
}
