// Source importers: .docx text extraction, CSV parsing, plain-text normalisation.

import { unzipSync, strFromU8 } from 'fflate';

function decodeXmlEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, e: string) => {
    if (e === 'amp') return '&';
    if (e === 'lt') return '<';
    if (e === 'gt') return '>';
    if (e === 'quot') return '"';
    if (e === 'apos') return "'";
    const code = e.startsWith('#x') ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : '';
  });
}

/**
 * Extract plain text from a .docx: one line per paragraph (w:p), tabs and line breaks kept,
 * each table cell paragraph on its own line. Tracked deletions, footnotes, headers and comments are ignored.
 */
export function extractDocxText(bytes: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: (f) => f.name === 'word/document.xml' });
  } catch {
    throw new Error('This file is not a valid .docx (it could not be unzipped).');
  }
  const docXml = files['word/document.xml'];
  if (!docXml) throw new Error('This .docx has no main document part (word/document.xml).');
  const xml = strFromU8(docXml);
  const body = /<w:body[^>]*>([\s\S]*)<\/w:body>/.exec(xml)?.[1] ?? xml;
  const paragraphs: string[] = [];
  const pRe = /<w:p[\s>][\s\S]*?<\/w:p>|<w:p\/>/g;
  for (const pm of body.matchAll(pRe)) {
    const p = pm[0];
    let out = '';
    const tokRe = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br(?:\s[^>]*)?\/>|<w:cr\/>|<w:noBreakHyphen\/>|<w:delText[\s\S]*?<\/w:delText>/g;
    for (const tm of p.matchAll(tokRe)) {
      const t = tm[0];
      if (t.startsWith('<w:delText')) continue; // tracked deletion
      if (t.startsWith('<w:tab')) out += '\t';
      else if (t.startsWith('<w:br') || t.startsWith('<w:cr')) out += '\n';
      else if (t.startsWith('<w:noBreakHyphen')) out += '-';
      else out += decodeXmlEntities(tm[1] ?? '');
    }
    paragraphs.push(out.replace(/[ \t]+$/g, ''));
  }
  // Collapse runs of more than one empty paragraph.
  const lines: string[] = [];
  for (const p of paragraphs) {
    if (p === '' && (lines.length === 0 || lines[lines.length - 1] === '')) continue;
    lines.push(p);
  }
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}

/** Normalise line endings and strip a BOM and trailing whitespace. */
export function normaliseText(s: string): string {
  return s.replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Decode bytes as UTF-8, falling back to windows-1252 when the bytes are not valid UTF-8. */
export function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/** Detect the delimiter from the first lines (comma, semicolon, tab). */
export function detectDelimiter(text: string): string {
  const head = text.split('\n').slice(0, 5).join('\n');
  let best = ',', bestN = -1;
  for (const d of [',', ';', '\t', '|']) {
    let n = 0, inQ = false;
    for (const ch of head) {
      if (ch === '"') inQ = !inQ;
      else if (!inQ && ch === d) n++;
    }
    if (n > bestN) {
      best = d;
      bestN = n;
    }
  }
  return best;
}

/** RFC 4180 CSV parser (quoted fields, doubled quotes, embedded newlines). */
export function parseCsv(text: string, delimiter?: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const d = delimiter ?? detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQ = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === '') inQ = true;
    else if (ch === d) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Serialise rows as CSV (quotes where needed). Prefixed with a BOM so Excel reads UTF-8. */
export function toCsv(rows: Array<Array<string | number | null | undefined>>, bom = true): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return (bom ? '﻿' : '') + rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n';
}
