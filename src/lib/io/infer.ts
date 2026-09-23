// Turn a table of raw cells (from CSV or Excel) into a typed Dataset: detect numeric, date and
// string columns, choose formats and measurement levels, and make valid SPSS variable names.

import { uniqueVarName, validateVarName } from '../../core/data';
import { makeDataset, makeVariable } from '../../core/types';
import type { Column, Dataset, MeasureLevel, ValueLabel, Variable } from '../../core/types';
import { truncateUtf8, utf8ByteLength } from './encoding';

export type RawCell = string | number | boolean | Date | null | undefined;

export interface TableInput {
  /** Dataset display name. */
  name: string;
  /** Header cells, or null to generate VAR00001, VAR00002, ... */
  header: RawCell[] | null;
  rows: RawCell[][];
  /** Accept "1,5" as 1.5 (for files whose delimiter is not a comma). */
  decimalComma?: boolean;
  source: Dataset['source'];
}

const MISSING_TOKENS = new Set(['', 'na', 'n/a', '.', 'nan', 'null']);
const NUM_DOT = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const NUM_COMMA = /^[+-]?(?:\d+,?\d*|,\d+)(?:[eE][+-]?\d+)?$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?(?:Z|[+-]00:?00)?$/;
const CLOCK_TIME = /^(\d{1,3}):([0-5]\d)(?::([0-5]\d(?:\.\d+)?))?$/;
const MAX_DECIMALS = 6;
const SECONDS_PER_DAY = 86400;

/** Days from 1970-01-01 to the given proleptic Gregorian date (Howard Hinnant's algorithm). */
function daysFromCivil(y: number, m: number, d: number): number {
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

const SPSS_EPOCH_DAYS = daysFromCivil(1582, 10, 14);

/** SPSS date value (seconds since 1582-10-14) for a calendar date, or null if the date is invalid. */
export function spssDateSeconds(y: number, m: number, d: number): number | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const days = daysFromCivil(y, m, d);
  // Reject 2023-02-30 and similar by converting back.
  const check = new Date(days * SECONDS_PER_DAY * 1000);
  if (y >= 0 && y <= 9999 && (check.getUTCFullYear() !== y || check.getUTCMonth() + 1 !== m || check.getUTCDate() !== d)) return null;
  return (days - SPSS_EPOCH_DAYS) * SECONDS_PER_DAY;
}

/** SPSS seconds for a JS Date (read as UTC, rounded to the millisecond). */
export function spssSecondsFromDate(dt: Date): number {
  return snapSeconds(Math.round(dt.getTime() - SPSS_EPOCH_DAYS * SECONDS_PER_DAY * 1000) / 1000);
}

/** Excel stores times as fractions of a day, so 23:59:59 can come back as 23:59:58.999. */
function snapSeconds(x: number): number {
  const r = Math.round(x);
  return Math.abs(x - r) < 0.0015 ? r : x;
}

type Kind = 'missing' | 'number' | 'bool' | 'date' | 'datetime' | 'time' | 'text';

interface Parsed {
  kind: Kind;
  value: number;
  /** Decimal places the source text showed (numbers only). */
  decimals: number;
}

function decimalsOfText(t: string): number {
  const m = /^[+-]?\d*(?:[.,](\d*))?(?:[eE]([+-]?\d+))?$/.exec(t);
  if (!m) return 0;
  const frac = m[1]?.length ?? 0;
  const exp = m[2] ? Number(m[2]) : 0;
  return Math.max(0, Math.min(MAX_DECIMALS, frac - exp));
}

function decimalsOfNumber(x: number): number {
  if (Number.isInteger(x)) return 0;
  return decimalsOfText(String(x));
}

function isExcelTimeOnly(d: Date): boolean {
  // Excel stores a time without a date as a fraction of day 0 (1899-12-30 in the 1900 system).
  return d.getUTCFullYear() === 1899 && d.getUTCMonth() === 11 && (d.getUTCDate() === 30 || d.getUTCDate() === 31);
}

function parseCell(c: RawCell, decimalComma: boolean): Parsed {
  if (c === null || c === undefined) return { kind: 'missing', value: NaN, decimals: 0 };
  if (typeof c === 'number') {
    if (!Number.isFinite(c)) return { kind: 'missing', value: NaN, decimals: 0 };
    return { kind: 'number', value: c, decimals: decimalsOfNumber(c) };
  }
  if (typeof c === 'boolean') return { kind: 'bool', value: c ? 1 : 0, decimals: 0 };
  if (c instanceof Date) {
    const t = c.getTime();
    if (Number.isNaN(t)) return { kind: 'missing', value: NaN, decimals: 0 };
    if (isExcelTimeOnly(c)) {
      const secs = snapSeconds(Math.round((c.getUTCHours() * 3600 + c.getUTCMinutes() * 60 + c.getUTCSeconds()) * 1000 + c.getUTCMilliseconds()) / 1000 + (c.getUTCDate() === 31 ? SECONDS_PER_DAY : 0));
      return { kind: 'time', value: secs, decimals: 0 };
    }
    const hasTime = c.getUTCHours() || c.getUTCMinutes() || c.getUTCSeconds() || c.getUTCMilliseconds();
    return { kind: hasTime ? 'datetime' : 'date', value: spssSecondsFromDate(c), decimals: 0 };
  }
  const t = String(c).trim();
  if (MISSING_TOKENS.has(t.toLowerCase())) return { kind: 'missing', value: NaN, decimals: 0 };
  if (NUM_DOT.test(t)) return { kind: 'number', value: Number(t), decimals: decimalsOfText(t) };
  let m = ISO_DATE.exec(t);
  if (m) {
    const v = spssDateSeconds(Number(m[1]), Number(m[2]), Number(m[3]));
    if (v !== null) return { kind: 'date', value: v, decimals: 0 };
  }
  m = ISO_DATETIME.exec(t);
  if (m) {
    const v = spssDateSeconds(Number(m[1]), Number(m[2]), Number(m[3]));
    const hh = Number(m[4]);
    const mi = Number(m[5]);
    const ss = m[6] ? Number(m[6]) : 0;
    if (v !== null && hh < 24 && mi < 60 && ss < 60) return { kind: 'datetime', value: v + hh * 3600 + mi * 60 + ss, decimals: 0 };
  }
  m = CLOCK_TIME.exec(t);
  if (m) return { kind: 'time', value: Number(m[1]) * 3600 + Number(m[2]) * 60 + (m[3] ? Number(m[3]) : 0), decimals: 0 };
  if (decimalComma && NUM_COMMA.test(t)) return { kind: 'number', value: Number(t.replace(',', '.')), decimals: decimalsOfText(t) };
  return { kind: 'text', value: NaN, decimals: 0 };
}

function cellText(c: RawCell): string {
  if (c === null || c === undefined) return '';
  if (typeof c === 'string') return c.replace(/\s+$/, '');
  if (typeof c === 'boolean') return c ? 'TRUE' : 'FALSE';
  if (typeof c === 'number') return Number.isFinite(c) ? String(c) : '';
  if (c instanceof Date) {
    if (Number.isNaN(c.getTime())) return '';
    const iso = c.toISOString();
    if (isExcelTimeOnly(c)) return iso.slice(11, 19);
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso.slice(0, 19).replace('T', ' ');
  }
  return String(c);
}

function numericWidth(values: Float64Array, decimals: number): number {
  let w = 1;
  for (let i = 0; i < values.length; i++) {
    const x = values[i];
    if (Number.isNaN(x)) continue;
    const a = Math.abs(x);
    const intDigits = a < 1 ? 1 : a >= 1e21 ? 22 : Math.floor(Math.log10(a)) + 1;
    const len = intDigits + (x < 0 ? 1 : 0) + (decimals > 0 ? decimals + 1 : 0);
    if (len > w) w = len;
  }
  return Math.max(8, Math.min(40, w));
}

function guessMeasure(values: Float64Array): MeasureLevel {
  const distinct = new Set<number>();
  let n = 0;
  for (let i = 0; i < values.length; i++) {
    const x = values[i];
    if (Number.isNaN(x)) continue;
    if (!Number.isInteger(x)) return 'scale';
    n++;
    distinct.add(x);
    if (distinct.size > 10) return 'scale';
  }
  const k = distinct.size;
  if (k === 0 || n < 2 * k) return 'scale';
  const sorted = [...distinct].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[k - 1];
  if (k >= 4 && k <= 7 && (min === 0 || min === 1) && max - min + 1 === k) return 'ordinal';
  return 'nominal';
}

/**
 * A valid, unused SPSS name for a column header. Keeps letters from any script (Bengali, Hindi,
 * accented Latin), turns runs of other characters into one underscore, and falls back to
 * uniqueVarName from core/data when nothing usable is left.
 */
export function variableNameFor(ds: Dataset, header: string): string {
  if (validateVarName(ds, header) === null) return header;
  let base = header
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}_.@#$]+/gu, '_')
    .replace(/^[^\p{L}@#$]+/u, '')
    .replace(/[._]+$/, '');
  base = truncateUtf8(base, 64).replace(/[._]+$/, '');
  if (base && validateVarName(ds, base) === null) return base;
  if (base && /^[A-Za-z@#$\u00C0-\uFFFF][A-Za-z0-9_.@#$\u00C0-\uFFFF]*$/.test(base)) {
    const stem = truncateUtf8(base, 58).replace(/[._]+$/, '');
    for (let i = 1; i < 100000; i++) {
      const cand = `${stem}_${i}`;
      if (validateVarName(ds, cand) === null) return cand;
    }
  }
  return uniqueVarName(ds, header);
}

function isEmptyRow(r: RawCell[]): boolean {
  for (const c of r) if (c !== null && c !== undefined && !(typeof c === 'string' && c.trim() === '')) return false;
  return true;
}

export function tableToDataset(t: TableInput): { dataset: Dataset; warnings: string[] } {
  const warnings: string[] = [];
  const rows = t.rows.slice();
  while (rows.length && isEmptyRow(rows[rows.length - 1])) rows.pop();
  let nCols = t.header ? t.header.length : 0;
  let ragged = 0;
  for (const r of rows) {
    if (r.length !== nCols && t.header) ragged++;
    if (r.length > nCols) nCols = r.length;
  }
  // Drop trailing columns with no header and no data (common in spreadsheets).
  while (nCols > 0) {
    const j = nCols - 1;
    const h = t.header ? cellText(t.header[j]).trim() : '';
    if (h) break;
    if (rows.some((r) => j < r.length && !isEmptyRow([r[j]]))) break;
    nCols--;
  }
  if (ragged) warnings.push(`${ragged} row(s) had a different number of fields than the header; missing fields were left empty.`);
  if (nCols === 0) throw new Error('The file has no columns of data to import.');

  const variables: Variable[] = [];
  const columns: Record<string, Column> = {};
  const nameDs = makeDataset({ name: t.name, variables });
  let renamed = 0;

  for (let j = 0; j < nCols; j++) {
    const headerText = t.header ? cellText(t.header[j]).trim() : '';
    const name = headerText ? variableNameFor(nameDs, headerText) : uniqueVarName(nameDs, `VAR${String(j + 1).padStart(5, '0')}`);
    let label = '';
    if (headerText && name !== headerText) {
      label = headerText;
      renamed++;
    }

    const parsed: Parsed[] = new Array(rows.length);
    const counts: Record<Kind, number> = { missing: 0, number: 0, bool: 0, date: 0, datetime: 0, time: 0, text: 0 };
    for (let i = 0; i < rows.length; i++) {
      const p = parseCell(j < rows[i].length ? rows[i][j] : null, !!t.decimalComma);
      parsed[i] = p;
      counts[p.kind]++;
    }
    const nonMissing = rows.length - counts.missing;
    let v: Variable;
    let col: Column;
    const numericKinds = counts.number + counts.bool;
    const dateKinds = counts.date + counts.datetime;
    if (nonMissing === 0 || numericKinds === nonMissing) {
      const values = new Float64Array(rows.length);
      let dec = 0;
      for (let i = 0; i < rows.length; i++) {
        values[i] = parsed[i].value;
        if (parsed[i].decimals > dec) dec = parsed[i].decimals;
      }
      const onlyBool = counts.bool > 0 && counts.number === 0;
      const valueLabels: ValueLabel[] = onlyBool ? [{ value: 0, label: 'FALSE' }, { value: 1, label: 'TRUE' }] : [];
      const decimals = nonMissing === 0 ? 2 : dec;
      const width = numericWidth(values, decimals);
      v = makeVariable({
        name, label, type: 'numeric', width, decimals, format: `F${width}.${decimals}`,
        measure: onlyBool ? 'nominal' : guessMeasure(values), valueLabels,
      });
      col = values;
    } else if (dateKinds === nonMissing || counts.time === nonMissing) {
      const values = new Float64Array(rows.length);
      for (let i = 0; i < rows.length; i++) values[i] = parsed[i].value;
      const fmt = counts.time ? { f: 'TIME8', w: 8 } : counts.datetime ? { f: 'DATETIME20', w: 20 } : { f: 'DATE11', w: 11 };
      v = makeVariable({ name, label, type: 'numeric', width: fmt.w, decimals: 0, format: fmt.f, measure: 'scale', columns: fmt.w });
      col = values;
    } else {
      const values = new Array<string>(rows.length);
      let width = 1;
      for (let i = 0; i < rows.length; i++) {
        const s = cellText(j < rows[i].length ? rows[i][j] : null);
        values[i] = s;
        if (s.length * 3 > width) {
          const b = utf8ByteLength(s);
          if (b > width) width = b;
        }
      }
      if (width > 32767) {
        warnings.push(`Column ${name} has text longer than 32767 bytes; it was cut to that length.`);
        width = 32767;
        for (let i = 0; i < values.length; i++) values[i] = truncateUtf8(values[i], 32767);
      }
      v = makeVariable({ name, label, type: 'string', width, decimals: 0, format: `A${width}`, measure: 'nominal' });
      col = values;
    }
    variables.push(v);
    columns[v.id] = col;
  }
  if (renamed) warnings.push(`${renamed} column name(s) were not valid SPSS variable names and were changed; the original names were kept as variable labels.`);

  const dataset = makeDataset({ name: t.name, variables, columns, nCases: rows.length, source: t.source });
  return { dataset, warnings };
}
