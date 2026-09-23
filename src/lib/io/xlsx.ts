// Excel .xlsx import and export. Uses the "universal" builds of read-excel-file and
// write-excel-file, which take ArrayBuffer/Blob and run in the browser and in node alike. They are
// loaded on demand so the main bundle stays small.

import type { Dataset } from '../../core/types';
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
  return { dataset: result.dataset, warnings: [...warnings, ...result.warnings] };
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
