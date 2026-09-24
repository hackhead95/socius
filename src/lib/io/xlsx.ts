// Excel .xlsx import and export. Uses the "universal" builds of read-excel-file and
// write-excel-file, which take ArrayBuffer/Blob and run in the browser and in node alike. They are
// loaded on demand so the main bundle stays small.

import type { Dataset, MeasureLevel, MissingSpec, ValueLabel, Variable } from '../../core/types';
import { codebookRows } from './codebook';
import { isoForFormat } from './csv';
import { tableToDataset, type RawCell } from './infer';
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
    const sheets = await mod.default(toArrayBuffer(bytes));
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
}

export async function readXlsx(fileName: string, bytes: Uint8Array, opts: XlsxImportOptions = {}): Promise<{ dataset: Dataset; warnings: string[] }> {
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
  const result = tableToDataset({
    name: sheets.length > 1 && opts.sheet !== undefined ? `${base} - ${sheet.sheet}` : base,
    header: header ? rows[0] : null,
    rows: header ? rows.slice(1) : rows,
    source: { kind: 'xlsx', fileName },
  });
  // A workbook Socius (or a codebook-minded colleague) wrote: restore the dictionary from its "Variables" sheet.
  const dict = header ? sheets.find((s) => s !== sheet && s.sheet.toLowerCase() === 'variables') : undefined;
  if (dict) {
    const n = applyDictionarySheet(result.dataset, dict.data ?? []);
    if (n) warnings.push(`Variable labels, value labels, missing values and measurement levels for ${n} variable${n === 1 ? ' were' : 's were'} restored from the "${dict.sheet}" sheet.`);
  }
  return { dataset: result.dataset, warnings: [...warnings, ...result.warnings] };
}

const cellStr = (c: RawCell): string => (c === null || c === undefined ? '' : c instanceof Date ? c.toISOString() : String(c)).trim();

/** "1 = Male; 2 = Female" (as written by codebookRows) back into value labels. */
export function parseValueLabelsText(text: string, type: 'numeric' | 'string'): ValueLabel[] {
  const out: ValueLabel[] = [];
  const parts: string[] = [];
  for (const p of text.split('; ')) {
    if (parts.length && !/^[^=]*? = /.test(p)) parts[parts.length - 1] += '; ' + p; // a label containing "; "
    else parts.push(p);
  }
  for (const p of parts) {
    const i = p.indexOf(' = ');
    if (i < 0) continue;
    const raw = p.slice(0, i).trim();
    const label = p.slice(i + 3).trim();
    if (type === 'numeric') {
      const x = Number(raw);
      if (raw !== '' && Number.isFinite(x)) out.push({ value: x, label });
    } else out.push({ value: raw, label });
  }
  return out;
}

/** "LO THRU 0, -1" (as written by codebookRows) back into a missing-value spec; null if not understood. */
export function parseMissingText(text: string, type: 'numeric' | 'string'): MissingSpec | null {
  const spec: MissingSpec = { discrete: [] };
  if (!text.trim()) return spec;
  if (type === 'string') {
    spec.discrete = text.split(', ').slice(0, 3);
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

/** Apply a codebook sheet (header row with Name, Label, Measure, Value labels, Missing values, Format). Returns how many variables matched. */
function applyDictionarySheet(ds: Dataset, data: RawCell[][]): number {
  if (data.length < 2) return 0;
  const head = data[0].map((c) => cellStr(c).toLowerCase());
  const col = (name: string) => head.indexOf(name);
  const iName = col('name');
  if (iName < 0 || col('label') < 0) return 0;
  const byName = new Map(ds.variables.map((v, i) => [v.name.toLowerCase(), i] as const));
  let n = 0;
  for (const row of data.slice(1)) {
    const name = cellStr(row[iName]);
    const idx = byName.get(name.toLowerCase());
    if (idx === undefined) continue;
    const v: Variable = { ...ds.variables[idx] };
    const get = (k: string) => (col(k) >= 0 ? cellStr(row[col(k)]) : '');
    const label = get('label');
    if (label) v.label = label;
    const measure = MEASURES[get('measure').toLowerCase()];
    if (measure && !(measure === 'scale' && v.type === 'string')) v.measure = measure;
    const vl = get('value labels');
    const labels = vl ? parseValueLabelsText(vl, v.type) : [];
    // With "Excel with value labels" the data holds label text, so codes would not match: skip them then.
    const col0 = ds.columns[v.id];
    const matches = labels.length && labels.some((l) => (Array.isArray(col0) ? col0.includes(l.value as string) : (col0 as Float64Array).includes(l.value as number)));
    if (labels.length && matches) v.valueLabels = labels;
    const miss = get('missing values');
    const spec = miss ? parseMissingText(miss, v.type) : null;
    if (spec) v.missing = spec;
    const fmt = get('format').toUpperCase();
    const fm = /^([A-Z]+)(\d+)(?:\.(\d+))?$/.exec(fmt);
    if (fm && v.type === 'numeric' && fm[1] !== 'A') {
      const w = Number(fm[2]), d = Number(fm[3] ?? 0);
      if (w >= 1 && w <= 40 && d < w) {
        v.format = fmt;
        v.width = w;
        v.decimals = d;
      }
    }
    ds.variables[idx] = v;
    n++;
  }
  return n;
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
