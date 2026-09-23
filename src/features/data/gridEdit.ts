// Parsing typed/pasted cell text and TSV clipboard data for the Data View.

import type { Variable } from '../../core/types';
import { dateToSpssSeconds, formatRawValue, isDateFormat } from '../../core/data';

export type ParseResult = { ok: true; value: number | string } | { ok: false; error: string };

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function mkDate(y: number, m: number, d: number, hh = 0, mm = 0, ss = 0): number | null {
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const dt = new Date(0);
  dt.setUTCFullYear(y, m - 1, d);
  dt.setUTCHours(hh, mm, ss, 0);
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dateToSpssSeconds(dt);
}

function fullYear(y: number): number {
  return y < 100 ? (y < 50 ? 2000 + y : 1900 + y) : y;
}

/** Parse date/time text for a date-formatted variable. Returns SPSS seconds or null. */
export function parseDateText(text: string, format: string): number | null {
  const t = text.trim();
  const f = format.toUpperCase();
  if (/^(TIME|DTIME)/.test(f)) {
    const m = /^(-)?(\d+):(\d{1,2})(?::(\d{1,2}(?:\.\d+)?))?$/.exec(t);
    if (!m) return null;
    const s = Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4] ?? 0);
    return m[1] ? -s : s;
  }
  let time = [0, 0, 0];
  let datePart = t;
  const tm = /^(.*?)[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t);
  if (tm) {
    datePart = tm[1];
    time = [Number(tm[2]), Number(tm[3]), Number(tm[4] ?? 0)];
  }
  let m: RegExpExecArray | null;
  if ((m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(datePart))) return mkDate(+m[1], +m[2], +m[3], ...time);
  if ((m = /^(\d{1,2})[- ]([A-Za-z]{3})[A-Za-z]*[- ](\d{2,4})$/.exec(datePart))) {
    const mo = MONTHS[m[2].toLowerCase()];
    return mo ? mkDate(fullYear(+m[3]), mo, +m[1], ...time) : null;
  }
  if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(datePart))) {
    // ADATE is month/day/year; other formats read day/month/year.
    return f.startsWith('ADATE') ? mkDate(fullYear(+m[3]), +m[1], +m[2], ...time) : mkDate(fullYear(+m[3]), +m[2], +m[1], ...time);
  }
  if ((m = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/.exec(datePart))) return mkDate(fullYear(+m[3]), +m[2], +m[1], ...time);
  return null;
}

function dateHint(format: string): string {
  const f = format.toUpperCase();
  if (f.startsWith('ADATE')) return 'mm/dd/yyyy';
  if (f.startsWith('EDATE')) return 'dd.mm.yyyy';
  if (f.startsWith('SDATE')) return 'yyyy/mm/dd';
  if (/^(TIME|DTIME)/.test(f)) return 'hh:mm:ss';
  if (f.startsWith('DATETIME')) return 'dd-mmm-yyyy hh:mm';
  return 'dd-mmm-yyyy or yyyy-mm-dd';
}

/** Parse what the user typed into a cell. Accepts value labels for labelled variables. */
export function parseCellInput(v: Variable, text: string): ParseResult {
  if (v.type === 'string') return { ok: true, value: text.slice(0, Math.max(v.width, 1)) };
  const t = text.trim();
  if (t === '' || t === '.') return { ok: true, value: NaN };
  const lower = t.toLowerCase();
  const byLabel = v.valueLabels.find((l) => l.label.toLowerCase() === lower);
  if (byLabel && typeof byLabel.value === 'number') return { ok: true, value: byLabel.value };
  if (isDateFormat(v.format)) {
    const d = parseDateText(t, v.format);
    if (d !== null) return { ok: true, value: d };
    if (/^-?\d+(\.\d+)?$/.test(t)) return { ok: true, value: Number(t) };
    return { ok: false, error: `Type a date like ${dateHint(v.format)}.` };
  }
  let s = t.replace(/^\$/, '');
  if (/^-?[\d,]+(\.\d*)?$/.test(s) && s.includes(',')) s = s.replace(/,/g, '');
  if (s.endsWith('%')) s = s.slice(0, -1);
  const n = Number(s);
  if (s !== '' && Number.isFinite(n)) return { ok: true, value: n };
  return { ok: false, error: v.valueLabels.length ? 'Type a number or one of the value labels.' : 'Type a number (leave empty for missing).' };
}

/** Text shown in the editor when editing an existing value. Keeps full precision. */
export function editText(v: Variable, value: number | string): string {
  if (typeof value === 'string') return value;
  if (Number.isNaN(value)) return '';
  if (isDateFormat(v.format)) return formatRawValue(v, value);
  return String(value);
}

/** Parse tab-separated clipboard text (Excel/Sheets style, with quoted fields). */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let quoted = false;
  const src = text.replace(/\r\n?/g, '\n');
  while (i < src.length) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"' && field === '') {
      quoted = true;
      i++;
      continue;
    }
    if (c === '\t') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function toTsv(rows: string[][]): string {
  const q = (s: string) => (/[\t\n"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return rows.map((r) => r.map(q).join('\t')).join('\n');
}
