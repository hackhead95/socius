// Delimited text (CSV, TSV, semicolon, pipe): RFC 4180 parsing with delimiter detection, and export.

import { formatCell, valueLabelFor } from '../../core/data';
import type { Dataset, Variable } from '../../core/types';
import { decodeText } from './encoding';
import { tableToDataset } from './infer';

export interface ParseResult {
  rows: string[][];
  /** True when the text ended inside a quoted field. */
  unterminatedQuote: boolean;
}

const CANDIDATES = [',', ';', '\t', '|'];

/**
 * RFC 4180 parser: fields may be quoted with ", quotes inside are doubled, quoted fields may hold
 * delimiters and line breaks. Accepts \r\n, \n and \r line endings. Lines that are completely
 * empty are skipped. Stops after `maxRows` records when given.
 */
export function parseDelimited(text: string, delimiter: string, maxRows = Infinity): ParseResult {
  if (delimiter.length !== 1) throw new Error('The delimiter must be a single character.');
  const rows: string[][] = [];
  const n = text.length;
  const D = delimiter.charCodeAt(0);
  const Q = 34;
  let i = 0;
  let row: string[] = [];
  let unterminatedQuote = false;
  while (i < n && rows.length < maxRows) {
    const c = text.charCodeAt(i);
    // Skip completely empty lines.
    if (row.length === 0 && (c === 10 || c === 13)) {
      i += c === 13 && text.charCodeAt(i + 1) === 10 ? 2 : 1;
      continue;
    }
    // Read one field.
    let field: string;
    if (c === Q) {
      let buf = '';
      let start = i + 1;
      let j = start;
      for (;;) {
        const q = text.indexOf('"', j);
        if (q < 0) {
          buf += text.slice(start);
          i = n;
          unterminatedQuote = true;
          break;
        }
        if (text.charCodeAt(q + 1) === Q) {
          buf += text.slice(start, q + 1);
          start = j = q + 2;
          continue;
        }
        buf += text.slice(start, q);
        i = q + 1;
        break;
      }
      // Lenient: text between the closing quote and the delimiter is kept.
      let k = i;
      while (k < n) {
        const ch = text.charCodeAt(k);
        if (ch === D || ch === 10 || ch === 13) break;
        k++;
      }
      if (k > i) buf += text.slice(i, k);
      i = k;
      field = buf;
    } else {
      let k = i;
      while (k < n) {
        const ch = text.charCodeAt(k);
        if (ch === D || ch === 10 || ch === 13) break;
        k++;
      }
      field = text.slice(i, k);
      i = k;
    }
    row.push(field);
    if (i >= n) break;
    const e = text.charCodeAt(i);
    if (e === D) {
      i++;
      if (i >= n) row.push('');
    } else {
      i += e === 13 && text.charCodeAt(i + 1) === 10 ? 2 : 1;
      rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);
  return { rows, unterminatedQuote };
}

/** Pick the delimiter that splits the first lines into the most consistent number of fields. */
export function detectDelimiter(text: string, preferTab = false): string {
  const sample = text.slice(0, 65536);
  let best = preferTab ? '\t' : ',';
  let bestScore = -1;
  for (const d of CANDIDATES) {
    const { rows } = parseDelimited(sample, d, 50);
    // The last sampled row may be cut off by the sample boundary.
    const use = rows.length > 2 && sample.length < text.length ? rows.slice(0, -1) : rows;
    if (!use.length) continue;
    const ref = use[0].length;
    if (ref < 2) continue;
    const consistent = use.filter((r) => r.length === ref).length / use.length;
    const score = consistent * 1000 + Math.min(ref, 999) / 1000 + (d === '\t' && preferTab ? 0.5 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

export interface CsvImportOptions {
  delimiter?: string;
  header?: boolean;
  encoding?: string;
}

export function readDelimited(fileName: string, bytes: Uint8Array, opts: CsvImportOptions = {}): { dataset: Dataset; warnings: string[] } {
  const warnings: string[] = [];
  const decoded = decodeText(bytes, opts.encoding);
  if (decoded.warning) warnings.push(decoded.warning);
  const text = decoded.text;
  if (!text.trim()) throw new Error(`"${fileName}" contains no data.`);
  const ext = (fileName.split('.').pop() ?? '').toLowerCase();
  let delimiter = opts.delimiter;
  if (delimiter === '\\t' || delimiter?.toLowerCase() === 'tab') delimiter = '\t';
  if (!delimiter) delimiter = detectDelimiter(text, ext === 'tsv' || ext === 'tab');
  const { rows, unterminatedQuote } = parseDelimited(text, delimiter);
  if (unterminatedQuote) warnings.push('A quoted field was never closed, so the rest of the file was read into one cell. Check the file for a stray " character.');
  const header = opts.header !== false;
  if (!rows.length) throw new Error(`"${fileName}" contains no data.`);
  const base = fileName.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '') || 'Untitled';
  const result = tableToDataset({
    name: base,
    header: header ? rows[0] : null,
    rows: header ? rows.slice(1) : rows,
    // "1,5" means 1.5 in semicolon-separated files (European spreadsheets); elsewhere a comma in a
    // number is more likely a thousands separator, so such columns stay text.
    decimalComma: delimiter === ';',
    source: { kind: 'csv', fileName, encoding: decoded.encoding },
  });
  return { dataset: result.dataset, warnings: [...warnings, ...result.warnings] };
}

// ---------------------------------------------------------------------------------------------
// Export

const pad2 = (n: number) => String(n).padStart(2, '0');

function secondsPart(sec: number): string {
  const whole = Math.floor(sec);
  const frac = Math.round((sec - whole) * 1000);
  return pad2(whole) + (frac ? '.' + String(frac).padStart(3, '0').replace(/0+$/, '') : '');
}

/** ISO text for SPSS date/time values; null when the format is not a calendar/clock format. */
export function isoForFormat(format: string, x: number): string | null {
  const f = format.toUpperCase();
  if (/^(WKDAY|MONTH)/.test(f)) return null; // these hold plain numbers (1-7, 1-12)
  if (/^(TIME|DTIME|MTIME)/.test(f)) {
    const neg = x < 0;
    let t = Math.abs(x);
    t = Math.round(t * 1000) / 1000;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t - h * 3600 - m * 60;
    return `${neg ? '-' : ''}${pad2(h)}:${pad2(m)}:${secondsPart(s)}`;
  }
  if (!/^(DATE|ADATE|EDATE|JDATE|SDATE|QYR|MOYR|WKYR|DATETIME|YMDHMS)/.test(f)) return null;
  const ms = Math.round(x * 1000);
  const dayMs = 86400000;
  const epoch = Date.UTC(1582, 9, 14);
  const d = new Date(epoch + ms);
  const y = d.getUTCFullYear();
  const date = `${String(y).padStart(4, '0')}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  if (/^(DATETIME|YMDHMS)/.test(f)) {
    const rem = (((ms % dayMs) + dayMs) % dayMs) / 1000;
    const h = Math.floor(rem / 3600);
    const m = Math.floor((rem % 3600) / 60);
    return `${date} ${pad2(h)}:${pad2(m)}:${secondsPart(rem - h * 3600 - m * 60)}`;
  }
  return date;
}

function needsQuote(s: string, delimiter: string): boolean {
  if (!s) return false;
  if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) return true;
  return s.charCodeAt(0) === 32 || s.charCodeAt(s.length - 1) === 32;
}

export function cellForExport(v: Variable, x: number | string, useLabels: boolean): string {
  if (typeof x === 'number') {
    if (Number.isNaN(x)) return '';
    if (useLabels) {
      const l = valueLabelFor(v, x);
      if (l !== undefined) return l;
    }
    return isoForFormat(v.format, x) ?? String(x);
  }
  return useLabels ? formatCell(v, x, true) : x;
}

export interface CsvExportOptions {
  values?: 'codes' | 'labels';
  delimiter?: string;
  /** Start with a UTF-8 byte order mark so Excel detects UTF-8 (default false). */
  bom?: boolean;
}

export function writeDelimited(ds: Dataset, opts: CsvExportOptions = {}): string {
  const delimiter = opts.delimiter ?? ',';
  if (delimiter.length !== 1 || delimiter === '"' || delimiter === '\n' || delimiter === '\r') {
    throw new Error('The delimiter must be a single character other than a quote or a line break.');
  }
  const useLabels = opts.values === 'labels';
  const q = (s: string) => (needsQuote(s, delimiter) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines: string[] = [ds.variables.map((v) => q(v.name)).join(delimiter)];
  const cols = ds.variables.map((v) => ds.columns[v.id]);
  const cells = new Array<string>(ds.variables.length);
  for (let i = 0; i < ds.nCases; i++) {
    for (let j = 0; j < ds.variables.length; j++) cells[j] = q(cellForExport(ds.variables[j], cols[j][i], useLabels));
    lines.push(cells.join(delimiter));
  }
  return (opts.bom ? '﻿' : '') + lines.join('\r\n') + '\r\n';
}
