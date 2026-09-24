// Excel .xlsx import and export. Uses the "universal" builds of read-excel-file and
// write-excel-file, which take ArrayBuffer/Blob and run in the browser and in node alike. They are
// loaded on demand so the main bundle stays small.

import type { Dataset, MeasureLevel, MissingSpec, ValueLabel, Variable } from '../../core/types';
import { codebookRows } from './codebook';
import { isoForFormat } from './csv';
import { tableToDataset, type ImportColumnInfo, type RawCell } from './infer';
import { valueLabelFor } from '../../core/data';

const MAX_ROWS = 1048576;
const MAX_COLS = 16384;

interface SheetLike {
  sheet: string;
  data: RawCell[][];
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function readAllSheets(bytes: Uint8Array): Promise<SheetLike[]> {
  const mod = await import('read-excel-file/universal');
  try {
    // trim: false keeps text exactly as stored (" 3" stays " 3"); numbers and names are trimmed when parsed.
    const sheets = await (mod.default as unknown as (b: ArrayBuffer, o: { trim: boolean }) => Promise<unknown>)(toArrayBuffer(bytes), { trim: false });
    return sheets as unknown as SheetLike[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`This Excel file could not be read. It may be damaged, password-protected, or not a real .xlsx file. (${msg})`);
  }
}

/** Names of the worksheets in an .xlsx file, in workbook order. */
export async function listXlsxSheets(bytes: Uint8Array): Promise<string[]> {
  return (await readAllSheets(bytes)).map((s) => s.sheet);
}

export interface XlsxImportOptions {
  /** Sheet name, or 0-based sheet index. Default: the first sheet. */
  sheet?: string | number;
  header?: boolean;
  /** 0-based columns to keep as text exactly as written. */
  textColumns?: readonly number[];
}

export async function readXlsx(fileName: string, bytes: Uint8Array, opts: XlsxImportOptions = {}): Promise<{ dataset: Dataset; warnings: string[]; columns: ImportColumnInfo[] }> {
  const warnings: string[] = [];
  const sheets = await readAllSheets(bytes);
  if (!sheets.length) throw new Error('This Excel file has no worksheets.');
  let sheet: SheetLike | undefined;
  if (typeof opts.sheet === 'number') {
    sheet = sheets[opts.sheet];
    if (!sheet) throw new Error(`This Excel file has ${sheets.length} sheet(s); sheet number ${opts.sheet + 1} does not exist.`);
  } else if (typeof opts.sheet === 'string') {
    sheet = sheets.find((s) => s.sheet === opts.sheet) ?? sheets.find((s) => s.sheet.toLowerCase() === String(opts.sheet).toLowerCase());
    if (!sheet) throw new Error(`This Excel file has no sheet named "${opts.sheet}". Its sheets are: ${sheets.map((s) => s.sheet).join(', ')}.`);
  } else {
    sheet = sheets[0];
    if (sheets.length > 1) {
      warnings.push(`This workbook has ${sheets.length} sheets; the first one ("${sheet.sheet}") was imported. Choose a different sheet when importing to load another.`);
    }
  }
  const data = sheet.data ?? [];
  const firstNonEmpty = data.findIndex((r) => r.some((c) => c !== null && c !== undefined && c !== ''));
  if (firstNonEmpty < 0) throw new Error(`The sheet "${sheet.sheet}" is empty.`);
  const rows = data.slice(firstNonEmpty);
  const header = opts.header !== false;
  const base = fileName.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '') || 'Untitled';
  // A workbook Socius (or a codebook-minded colleague) wrote: its "Variables" sheet is the dictionary,
  // and it is authoritative. Columns it calls String stay text (so "1", "2", "NA" are not turned into
  // numbers), and its value labels and missing values are restored whatever the data holds.
  const dictSheet = header ? sheets.find((s) => s !== sheet && s.sheet.toLowerCase() === 'variables') : undefined;
  const dict = dictSheet ? readDictionarySheet(dictSheet.data ?? []) : null;
  const textColumns = new Set(opts.textColumns ?? []);
  if (dict && header) rows[0].forEach((h, j) => dict.get(cellStr(h).toLowerCase())?.type === 'string' && textColumns.add(j));
  const result = tableToDataset({
    name: sheets.length > 1 && opts.sheet !== undefined ? `${base} - ${sheet.sheet}` : base,
    header: header ? rows[0] : null,
    rows: header ? rows.slice(1) : rows,
    source: { kind: 'xlsx', fileName },
    textColumns,
  });
  // Columns the dictionary (not the user) kept as text offer no "Keep as text" choice.
  const asked = new Set(opts.textColumns ?? []);
  for (const c of result.columns) if (c.keptAsText && !asked.has(c.index)) c.keptAsText = false;
  if (dict && dictSheet) {
    const { n, notes } = applyDictionary(result.dataset, dict);
    if (n) warnings.push(`Variable labels, value labels, missing values and measurement levels for ${n} variable${n === 1 ? ' were' : 's were'} restored from the "${dictSheet.sheet}" sheet.`);
    warnings.push(...notes);
  }
  return { dataset: result.dataset, warnings: [...warnings, ...result.warnings], columns: result.columns };
}

const cellStr = (c: RawCell): string => (c === null || c === undefined ? '' : c instanceof Date ? c.toISOString() : String(c)).trim();

/**
 * Read a quoted value ('it''s', or with double quotes) that starts at `i`: the value and the index
 * after its closing quote, or null when `text[i]` does not open a properly closed quoted value.
 */
function readQuoted(text: string, i: number): { value: string; end: number } | null {
  const qch = text[i];
  if (qch !== "'" && qch !== '"') return null;
  let out = '';
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] !== qch) {
      out += text[j];
      continue;
    }
    if (text[j + 1] === qch) {
      out += qch;
      j++;
      continue;
    }
    return { value: out, end: j + 1 };
  }
  return null;
}

/** A numeric code at the start of a value-labels part: "12 = ", "-9 = ", "1.5e3 = ". */
const NUM_LABEL_START = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)? = /;

/**
 * "1 = Male; 2 = Female" or "'KOL' = Kolkata; '' = No answer" (as written by codebookRows) back
 * into value labels. A label may itself contain "; " (it runs until the next "code = "). Unquoted
 * string codes, as older workbooks wrote them, are still read.
 */
export function parseValueLabelsText(text: string, type: 'numeric' | 'string'): ValueLabel[] {
  const out: ValueLabel[] = [];
  // Text written by this version quotes every string code; then only a quoted code starts a new part.
  const quoted = type === 'string' && readQuoted(text, 0) !== null;
  const startsPart = (rest: string): boolean => {
    if (type === 'numeric') return NUM_LABEL_START.test(rest);
    const qv = readQuoted(rest, 0);
    if (qv) return rest.startsWith(' = ', qv.end);
    return !quoted && /^[^=']*? = /.test(rest);
  };
  const parts: string[] = [];
  let from = 0;
  for (let k = text.indexOf('; '); k >= 0; k = text.indexOf('; ', k + 2)) {
    if (!startsPart(text.slice(k + 2))) continue; // "; " inside a label
    parts.push(text.slice(from, k));
    from = k + 2;
  }
  parts.push(text.slice(from));
  for (const p of parts) {
    let raw: string;
    let label: string;
    const qv = type === 'string' ? readQuoted(p, 0) : null;
    if (qv && p.startsWith(' = ', qv.end)) {
      raw = qv.value;
      label = p.slice(qv.end + 3).trim();
    } else {
      const i = p.indexOf(' = ');
      if (i < 0) continue;
      raw = p.slice(0, i).trim();
      label = p.slice(i + 3).trim();
    }
    if (type === 'numeric') {
      const x = Number(raw);
      if (raw !== '' && Number.isFinite(x)) out.push({ value: x, label });
    } else out.push({ value: raw, label });
  }
  return out;
}

/** "'DK', '', 'a, b'" back into (at most three) string missing values; null if a quote is not closed. */
function parseStringMissing(text: string): string[] | null {
  const t = text.trim();
  if (t[0] !== "'" && t[0] !== '"') return t.split(/\s*,\s*/).slice(0, 3); // unquoted, as older workbooks wrote them
  const vals: string[] = [];
  let i = 0;
  for (;;) {
    const qv = readQuoted(t, i);
    if (!qv) return null;
    vals.push(qv.value);
    i = qv.end;
    const sep = /^\s*,\s*/.exec(t.slice(i));
    if (!sep) break;
    i += sep[0].length;
  }
  return i === t.length ? vals.slice(0, 3) : null;
}

/** "LO THRU 0, -1" or "'DK', ''" (as written by codebookRows) back into a missing-value spec; null if not understood. */
export function parseMissingText(text: string, type: 'numeric' | 'string'): MissingSpec | null {
  const spec: MissingSpec = { discrete: [] };
  if (!text.trim()) return spec;
  if (type === 'string') {
    const vals = parseStringMissing(text);
    if (!vals) return null;
    spec.discrete = vals;
    return spec;
  }
  for (const part of text.split(/,\s*/)) {
    const m = /^(\S+) THRU (\S+)$/i.exec(part.trim());
    const num = (t: string) => (/^(LO|LOWEST)$/i.test(t) ? -Infinity : /^(HI|HIGHEST)$/i.test(t) ? Infinity : Number(t));
    if (m) {
      const lo = num(m[1]), hi = num(m[2]);
      if (Number.isNaN(lo) || Number.isNaN(hi)) return null;
      spec.range = { lo, hi };
    } else {
      const x = Number(part.trim());
      if (part.trim() === '' || !Number.isFinite(x)) return null;
      spec.discrete.push(x);
    }
  }
  return spec;
}

const MEASURES: Record<string, MeasureLevel> = { nominal: 'nominal', ordinal: 'ordinal', scale: 'scale' };

/** One row of a codebook ("Variables") sheet. */
interface DictRow {
  label: string;
  /** From the Type column: 'string' for String, 'numeric' for any other type, null when absent. */
  type: 'numeric' | 'string' | null;
  width: number | null;
  measure: string;
  valueLabels: string;
  missing: string;
  format: string;
}

/**
 * Read a codebook sheet (header row with Name, Label and optionally Type, Width, Measure, Value
 * labels, Missing values, Format), keyed by lower-case variable name; null when it is not one.
 */
function readDictionarySheet(data: RawCell[][]): Map<string, DictRow> | null {
  if (data.length < 2) return null;
  const head = data[0].map((c) => cellStr(c).toLowerCase());
  const iName = head.indexOf('name');
  if (iName < 0 || head.indexOf('label') < 0) return null;
  const out = new Map<string, DictRow>();
  for (const row of data.slice(1)) {
    const name = cellStr(row[iName]);
    if (!name) continue;
    const get = (k: string) => (head.indexOf(k) >= 0 ? cellStr(row[head.indexOf(k)]) : '');
    const typeText = get('type').toLowerCase();
    const width = Number(get('width'));
    out.set(name.toLowerCase(), {
      label: get('label'),
      type: !typeText ? null : typeText === 'string' ? 'string' : 'numeric',
      width: Number.isInteger(width) && width >= 1 ? width : null,
      measure: get('measure'),
      valueLabels: get('value labels'),
      missing: get('missing values'),
      format: get('format').toUpperCase(),
    });
  }
  return out;
}

/**
 * A numeric variable that came back as text because the workbook was written with value labels
 * instead of codes ("Excel with value labels"): turn the label texts back into their codes. Null
 * when some cell is neither empty, a label nor a number (then the column stays text).
 */
function codesFromLabels(col: string[], labels: ValueLabel[]): Float64Array | null {
  const byLabel = new Map<string, number>();
  for (const l of labels) if (typeof l.value === 'number' && !byLabel.has(l.label)) byLabel.set(l.label, l.value);
  const out = new Float64Array(col.length);
  for (let i = 0; i < col.length; i++) {
    const t = col[i].trim();
    if (t === '') out[i] = NaN;
    else if (byLabel.has(t)) out[i] = byLabel.get(t)!;
    else if (Number.isFinite(Number(t))) out[i] = Number(t);
    else return null;
  }
  return out;
}

/**
 * Apply the dictionary to the imported variables (in place: the dataset was just created). The sheet
 * is authoritative: its value labels and missing values are restored even when no case holds a
 * labelled value. Returns how many variables matched, and notes for the user.
 */
function applyDictionary(ds: Dataset, dict: Map<string, DictRow>): { n: number; notes: string[] } {
  const notes: string[] = [];
  let n = 0;
  ds.variables.forEach((old, idx) => {
    const d = dict.get(old.name.toLowerCase());
    if (!d) return;
    const v: Variable = { ...old };
    if (d.label) v.label = d.label;
    const numLabels = d.valueLabels ? parseValueLabelsText(d.valueLabels, 'numeric') : [];
    if (d.type === 'numeric' && v.type === 'string') {
      // Written with labels instead of codes: read the codes back.
      const codes = codesFromLabels(ds.columns[v.id] as string[], numLabels);
      if (codes) {
        ds.columns[v.id] = codes;
        v.type = 'numeric';
        v.width = 8;
        v.decimals = 0;
        for (const x of codes) if (!Number.isNaN(x) && !Number.isInteger(x)) v.decimals = 2;
        v.format = `F8.${v.decimals}`;
        v.align = 'right';
      } else notes.push(`${v.name} is numeric in the "Variables" sheet but holds text that is not one of its value labels, so it was kept as text.`);
    }
    if (d.type === 'string' && v.type === 'string' && d.width && d.width > v.width && d.width <= 32767) {
      v.width = d.width;
      v.format = `A${d.width}`;
    }
    const measure = MEASURES[d.measure.toLowerCase()];
    if (measure && !(measure === 'scale' && v.type === 'string')) v.measure = measure;
    if (d.valueLabels) v.valueLabels = v.type === 'numeric' ? numLabels : parseValueLabelsText(d.valueLabels, 'string');
    const spec = d.missing ? parseMissingText(d.missing, v.type) : null;
    if (spec) v.missing = spec;
    const fm = /^([A-Z]+)(\d+)(?:\.(\d+))?$/.exec(d.format);
    if (fm && v.type === 'numeric' && fm[1] !== 'A') {
      const w = Number(fm[2]), dec = Number(fm[3] ?? 0);
      if (w >= 1 && w <= 40 && dec < w) {
        v.format = d.format;
        v.width = w;
        v.decimals = dec;
      }
    }
    ds.variables[idx] = v;
    n++;
  });
  return { n, notes };
}

// ---------------------------------------------------------------------------------------------
// Export

type OutCell = null | string | number | Date | { value: string | number | Date; format?: string; fontWeight?: 'bold'; type?: unknown };

const SPSS_EPOCH_MS = Date.UTC(1582, 9, 14);

function dataCell(format: string, x: number): OutCell {
  const f = format.toUpperCase();
  if (/^(TIME|DTIME|MTIME)/.test(f)) return { value: x / 86400, type: Number, format: '[h]:mm:ss' };
  if (/^(DATETIME|YMDHMS)/.test(f)) return { value: new Date(SPSS_EPOCH_MS + Math.round(x * 1000)), type: Date, format: 'yyyy-mm-dd hh:mm:ss' };
  if (isoForFormat(f, x) !== null) return { value: new Date(SPSS_EPOCH_MS + Math.round(x * 1000)), type: Date, format: 'yyyy-mm-dd' };
  return x;
}

export async function writeXlsx(ds: Dataset, opts: { values?: 'codes' | 'labels' } = {}): Promise<Blob> {
  if (ds.nCases + 1 > MAX_ROWS) throw new Error(`Excel sheets hold at most ${MAX_ROWS - 1} data rows; this dataset has ${ds.nCases} cases. Export CSV or .sav instead.`);
  if (ds.variables.length > MAX_COLS) throw new Error(`Excel sheets hold at most ${MAX_COLS} columns; this dataset has ${ds.variables.length} variables. Export CSV or .sav instead.`);
  const useLabels = opts.values === 'labels';
  const header: OutCell[] = ds.variables.map((v) => ({ value: v.name, fontWeight: 'bold' }));
  const rows: OutCell[][] = [header];
  const cols = ds.variables.map((v) => ds.columns[v.id]);
  for (let i = 0; i < ds.nCases; i++) {
    const r: OutCell[] = new Array(ds.variables.length);
    for (let j = 0; j < ds.variables.length; j++) {
      const v = ds.variables[j];
      const x = cols[j][i];
      if (typeof x === 'number') {
        if (Number.isNaN(x)) r[j] = null;
        else {
          const l = useLabels ? valueLabelFor(v, x) : undefined;
          r[j] = l !== undefined ? l : dataCell(v.format, x);
        }
      } else {
        const l = useLabels ? valueLabelFor(v, x) : undefined;
        const s = l !== undefined ? l : x;
        r[j] = s === '' ? null : s;
      }
    }
    rows.push(r);
  }
  const book = codebookRows(ds);
  const keys = ['Position', 'Name', 'Label', 'Type', 'Width', 'Decimals', 'Measure', 'Value labels', 'Missing values', 'Format'];
  const vrows: OutCell[][] = [keys.map((k) => ({ value: k, fontWeight: 'bold' }))];
  for (const b of book) vrows.push(keys.map((k) => (k === 'Position' || k === 'Width' || k === 'Decimals' ? Number(b[k]) : b[k] || null)));

  const mod = await import('write-excel-file/universal');
  const writeXlsxFile = mod.default as unknown as (sheets: unknown[]) => { toBlob: () => Promise<Blob> };
  const colWidths = ds.variables.map((v) => ({ width: Math.max(8, Math.min(40, Math.max(v.columns, v.name.length + 2))) }));
  return writeXlsxFile([
    { sheet: 'Data', data: rows, columns: colWidths, stickyRowsCount: 1 },
    {
      sheet: 'Variables',
      data: vrows,
      columns: [{ width: 9 }, { width: 18 }, { width: 40 }, { width: 10 }, { width: 7 }, { width: 9 }, { width: 9 }, { width: 50 }, { width: 24 }, { width: 11 }],
      stickyRowsCount: 1,
    },
  ]).toBlob();
}
