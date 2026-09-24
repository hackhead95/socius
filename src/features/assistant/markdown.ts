// A small Markdown parser for assistant answers: headings, paragraphs, bold/italic, inline code,
// links (http, https and mailto only), bullet and numbered lists (nested), code blocks, tables,
// block quotes and rules. It builds a tree that the React renderer turns into elements, so no model
// text is ever inserted as HTML. Tolerates half-finished input while an answer streams in.

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'strong'; c: Inline[] }
  | { t: 'em'; c: Inline[] }
  | { t: 'code'; v: string }
  | { t: 'link'; href: string; c: Inline[] }
  | { t: 'br' };

export type Block =
  | { t: 'h'; level: number; c: Inline[] }
  | { t: 'p'; c: Inline[] }
  | { t: 'list'; ordered: boolean; start: number; items: Block[][] }
  | { t: 'code'; lang: string; v: string }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][]; align: Array<'left' | 'right' | 'center' | null> }
  | { t: 'quote'; c: Block[] }
  | { t: 'hr' };

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

export function safeHref(href: string): string | null {
  const h = href.trim();
  return SAFE_URL.test(h) ? h : null;
}

// ---------- inline ----------

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = '';
  const flush = () => {
    if (buf) out.push({ t: 'text', v: buf });
    buf = '';
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    // Escapes
    if (ch === '\\' && i + 1 < src.length && /[\\`*_[\]()#+\-.!|>~]/.test(src[i + 1])) {
      buf += src[i + 1];
      i += 2;
      continue;
    }
    // Hard line break (two spaces or backslash before newline) and soft breaks
    if (ch === '\n') {
      if (/ {2,}$/.test(buf)) {
        buf = buf.replace(/ +$/, '');
        flush();
        out.push({ t: 'br' });
      } else buf += ' ';
      i++;
      continue;
    }
    // Inline code
    if (ch === '`') {
      const run = /^`+/.exec(src.slice(i))![0];
      const end = src.indexOf(run, i + run.length);
      if (end > 0) {
        flush();
        out.push({ t: 'code', v: src.slice(i + run.length, end).replace(/^ (.*) $/, '$1') });
        i = end + run.length;
        continue;
      }
    }
    // Bold ** or __
    if ((ch === '*' || ch === '_') && src[i + 1] === ch) {
      const mark = ch + ch;
      const end = src.indexOf(mark, i + 2);
      const leftOk = ch === '*' || i === 0 || !/\w/.test(src[i - 1]);
      if (end > i + 2 && leftOk && src[i + 2] !== ' ') {
        flush();
        out.push({ t: 'strong', c: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    // Italic * or _ (underscores only at word boundaries, so trust3_r stays as it is)
    if ((ch === '*' || ch === '_') && src[i + 1] !== ch && src[i + 1] !== ' ' && src[i + 1] !== undefined) {
      const leftOk = ch === '*' ? true : i === 0 || !/[\p{L}\p{N}]/u.test(src[i - 1]);
      if (leftOk) {
        let end = -1;
        for (let j = i + 1; j < src.length; j++) {
          if (src[j] === '\n' && src[j + 1] === '\n') break;
          if (src[j] === ch && src[j - 1] !== ' ' && src[j + 1] !== ch && (ch === '*' || j + 1 >= src.length || !/[\p{L}\p{N}]/u.test(src[j + 1]))) {
            end = j;
            break;
          }
        }
        if (end > i + 1) {
          flush();
          out.push({ t: 'em', c: parseInline(src.slice(i + 1, end)) });
          i = end + 1;
          continue;
        }
      }
    }
    // Links [text](url)
    if (ch === '[') {
      const close = findClosing(src, i, '[', ']');
      if (close > 0 && src[close + 1] === '(') {
        const pend = src.indexOf(')', close + 2);
        if (pend > 0) {
          const text = src.slice(i + 1, close);
          const href = src.slice(close + 2, pend).trim().split(/\s+/)[0] ?? '';
          flush();
          const safe = safeHref(href);
          if (safe) out.push({ t: 'link', href: safe, c: parseInline(text) });
          else out.push(...parseInline(text));
          i = pend + 1;
          continue;
        }
      }
    }
    // Bare URLs
    if ((ch === 'h' || ch === 'H') && /^https?:\/\//i.test(src.slice(i, i + 8)) && (i === 0 || /[\s(]/.test(src[i - 1]))) {
      const m = /^https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/i.exec(src.slice(i));
      if (m) {
        flush();
        out.push({ t: 'link', href: m[0], c: [{ t: 'text', v: m[0] }] });
        i += m[0].length;
        continue;
      }
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

function findClosing(s: string, from: number, open: string, close: string): number {
  let depth = 0;
  for (let i = from; i < s.length; i++) {
    if (s[i] === '\\') {
      i++;
      continue;
    }
    if (s[i] === open) depth++;
    else if (s[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// ---------- blocks ----------

const RE_FENCE = /^\s{0,3}(```+|~~~+)\s*([\w+-]*)\s*$/;
const RE_HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const RE_HR = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const RE_LIST = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const RE_QUOTE = /^\s{0,3}>\s?(.*)$/;
const RE_TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const cells: string[] = [];
  let cur = '';
  let inCode = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '\\' && t[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (c === '`') {
      inCode = !inCode;
      cur += c;
    } else if (c === '|' && !inCode) {
      cells.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

function startsBlock(line: string, next?: string): boolean {
  return RE_FENCE.test(line) || RE_HEADING.test(line) || RE_HR.test(line) || RE_LIST.test(line) || RE_QUOTE.test(line) || (line.includes('|') && next !== undefined && RE_TABLE_SEP.test(next));
}

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  return parseLines(lines, 0);
}

function parseLines(lines: string[], depth: number): Block[] {
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    // Code fence (an unfinished one runs to the end while streaming)
    const fence = RE_FENCE.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !new RegExp(`^\\s{0,3}${fence[1][0]}{${fence[1].length},}\\s*$`).test(lines[i])) body.push(lines[i++]);
      i++;
      out.push({ t: 'code', lang: fence[2] ?? '', v: body.join('\n') });
      continue;
    }
    const h = RE_HEADING.exec(line);
    if (h) {
      out.push({ t: 'h', level: h[1].length, c: parseInline(h[2]) });
      i++;
      continue;
    }
    if (RE_HR.test(line) && !RE_LIST.test(line.replace(/^\s*[-*]\s+[-*]/, ''))) {
      out.push({ t: 'hr' });
      i++;
      continue;
    }
    // Table: header row, separator row, body rows
    if (line.includes('|') && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1])) {
      const head = splitRow(line);
      const align = splitRow(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-+:$/.test(c) ? 'right' : /^:-+/.test(c) ? 'left' : null)) as Array<'left' | 'right' | 'center' | null>;
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        const cells = splitRow(lines[i]);
        rows.push(head.map((_, k) => parseInline(cells[k] ?? '')));
        i++;
      }
      out.push({ t: 'table', head: head.map(parseInline), rows, align: head.map((_, k) => align[k] ?? null) });
      continue;
    }
    if (RE_QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && RE_QUOTE.test(lines[i])) body.push(RE_QUOTE.exec(lines[i++])![1]);
      out.push({ t: 'quote', c: depth < 4 ? parseLines(body, depth + 1) : [{ t: 'p', c: parseInline(body.join('\n')) }] });
      continue;
    }
    const li = RE_LIST.exec(line);
    if (li) {
      const baseIndent = li[1].length;
      const ordered = /\d/.test(li[2]);
      const start = ordered ? parseInt(li[2], 10) : 1;
      const items: string[][] = [];
      let cur: string[] | null = null;
      while (i < lines.length) {
        const l = lines[i];
        const m = RE_LIST.exec(l);
        if (m && m[1].length <= baseIndent + 1 && /\d/.test(m[2]) === ordered) {
          cur = [m[3]];
          items.push(cur);
          i++;
          continue;
        }
        if (m && m[1].length <= baseIndent + 1) break; // a different kind of list at the same level
        if (!l.trim()) {
          // A blank line ends the list unless the next line continues it (indented or another item).
          const next = lines[i + 1];
          const nm = next !== undefined ? RE_LIST.exec(next) : null;
          if (next !== undefined && ((nm && nm[1].length <= baseIndent + 1 && /\d/.test(nm[2]) === ordered) || /^\s{2,}\S/.test(next))) {
            cur?.push('');
            i++;
            continue;
          }
          break;
        }
        const indent = /^\s*/.exec(l)![0].length;
        if (indent > baseIndent || (!startsBlock(l) && cur)) {
          cur?.push(l.slice(Math.min(indent, baseIndent + 2)));
          i++;
          continue;
        }
        break;
      }
      out.push({ t: 'list', ordered, start, items: items.map((it) => (depth < 6 ? parseLines(it, depth + 1) : [{ t: 'p', c: parseInline(it.join('\n')) }])) });
      continue;
    }
    // Paragraph
    const para: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      if (para.length && startsBlock(lines[i], lines[i + 1])) break;
      para.push(lines[i]);
      i++;
    }
    out.push({ t: 'p', c: parseInline(para.join('\n').trim()) });
  }
  return out;
}

/** Plain text of an answer (for "Copy answer" as text and for tests). */
export function inlineText(c: Inline[]): string {
  return c.map((x) => (x.t === 'text' ? x.v : x.t === 'code' ? x.v : x.t === 'br' ? '\n' : inlineText(x.c))).join('');
}
