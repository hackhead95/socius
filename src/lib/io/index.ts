// File import/export entry points. Other modules code against these signatures.
// Nothing here touches DOM-only globals at import time; everything runs in the browser and in node.
import type { Dataset } from '../../core/types';
import { codebookRows as buildCodebookRows } from './codebook';
import { readDelimited, writeDelimited } from './csv';
import { readSav } from './sav-reader';
import { writeSav } from './sav-writer';
import { listXlsxSheets as listSheets, readXlsx, writeXlsx } from './xlsx';

export interface ImportResult {
  dataset: Dataset;
  /** Non-fatal issues to show the user (e.g. "3 value labels truncated", "encoding guessed as windows-1252"). */
  warnings: string[];
}

export type ImportOptions = {
  /** CSV/TSV: delimiter override; auto-detected otherwise. "\t" or "tab" for tab. */
  delimiter?: string;
  /** CSV/XLSX: first row holds variable names (default true). */
  header?: boolean;
  /** Text encoding override for .sav without an encoding record, and for CSV. */
  encoding?: string;
  /** XLSX: sheet name, or 0-based sheet index (default: the first sheet). */
  sheet?: string | number;
};

type Kind = 'sav' | 'xlsx' | 'delimited';

const TEXT_EXTENSIONS = new Set(['csv', 'tsv', 'tab', 'txt', 'dat', 'psv', 'text']);

const UNSUPPORTED: Record<string, string> = {
  por: 'SPSS portable files (.por) cannot be opened directly. Open the file in SPSS or PSPP and save it as .sav, or export CSV, then open that file.',
  sas7bdat: 'SAS data files (.sas7bdat) cannot be opened directly. Export CSV from SAS (PROC EXPORT) or save as .sav, then open that file.',
  xpt: 'SAS transport files (.xpt) cannot be opened directly. Export CSV from SAS or save as .sav, then open that file.',
  dta: 'Stata files (.dta) cannot be opened directly. In Stata, export CSV (export delimited) or Excel (export excel), or save as .sav, then open that file.',
  rds: 'R data files cannot be opened directly. In R, save as .sav with haven::write_sav() or as CSV with write.csv(), then open that file.',
  rdata: 'R data files cannot be opened directly. In R, save as .sav with haven::write_sav() or as CSV with write.csv(), then open that file.',
  rda: 'R data files cannot be opened directly. In R, save as .sav with haven::write_sav() or as CSV with write.csv(), then open that file.',
  xls: 'Old Excel files (.xls) cannot be opened. In Excel, use File > Save As and choose Excel Workbook (.xlsx) or CSV, then open that file.',
  ods: 'OpenDocument spreadsheets (.ods) cannot be opened directly. Save the sheet as .xlsx or CSV, then open that file.',
  numbers: 'Apple Numbers files cannot be opened directly. In Numbers, use File > Export To > Excel or CSV, then open that file.',
  sps: 'This is an SPSS syntax file, not a data file. Open the .sav data file instead.',
  spv: 'This is an SPSS output file, not a data file. Open the .sav data file instead.',
};

function extensionOf(name: string): string {
  const base = name.replace(/^.*[\\/]/, '');
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
}

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return false;
  return true;
}

function looksLikeText(bytes: Uint8Array): boolean {
  const n = Math.min(bytes.length, 8192);
  // UTF-16 text has NUL bytes but starts with a BOM.
  if (startsWith(bytes, [0xff, 0xfe]) || startsWith(bytes, [0xfe, 0xff])) return true;
  for (let i = 0; i < n; i++) if (bytes[i] === 0) return false;
  return true;
}

function detectKind(name: string, bytes: Uint8Array): Kind {
  const ext = extensionOf(name);
  // Magic bytes first.
  if (startsWith(bytes, [0x24, 0x46, 0x4c, 0x32]) || startsWith(bytes, [0x24, 0x46, 0x4c, 0x33])) return 'sav'; // $FL2 / $FL3
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    if (ext === 'ods' || ext === 'numbers') throw new Error(UNSUPPORTED[ext]);
    if (ext && ext !== 'xlsx' && ext !== 'xlsm' && ext !== 'zip') {
      throw new Error(`"${name}" is a compressed (zip) file, not a spreadsheet Socius can read. Supported files: .sav, .zsav, .csv, .tsv, .txt and .xlsx.`);
    }
    return 'xlsx';
  }
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0])) throw new Error(UNSUPPORTED.xls);
  if (startsWith(bytes, [0x1f, 0x8b])) throw new Error(`"${name}" is gzip-compressed. Unzip it first, then open the file inside.`);
  if (startsWith(bytes, Array.from('<stata_dta>', (c) => c.charCodeAt(0)))) throw new Error(UNSUPPORTED.dta);
  // Then the extension.
  if (UNSUPPORTED[ext]) throw new Error(UNSUPPORTED[ext]);
  if (ext === 'sav' || ext === 'zsav') {
    throw new Error(`"${name}" is not a valid SPSS data file: it does not start with the SPSS signature. It may be damaged, or be a different kind of file renamed to .${ext}.`);
  }
  if (ext === 'xlsx' || ext === 'xlsm') throw new Error(`"${name}" is not a valid Excel workbook. It may be damaged or be a different kind of file renamed to .${ext}.`);
  if (TEXT_EXTENSIONS.has(ext)) return 'delimited';
  if (looksLikeText(bytes)) return 'delimited';
  throw new Error(`Socius cannot open "${name}": the file type is not recognised. Supported files: .sav, .zsav, .csv, .tsv, .txt and .xlsx.`);
}

/** Import .sav, .zsav, .csv, .tsv, .txt (delimited), .xlsx. Detects type by magic bytes, then extension. */
export async function importFile(name: string, bytes: Uint8Array, opts: ImportOptions = {}): Promise<ImportResult> {
  if (!bytes || bytes.length === 0) throw new Error(`"${name}" is empty (0 bytes).`);
  const kind = detectKind(name, bytes);
  if (kind === 'sav') return readSav(bytes, { fileName: name, encoding: opts.encoding });
  if (kind === 'xlsx') return readXlsx(name, bytes, { sheet: opts.sheet, header: opts.header });
  return readDelimited(name, bytes, { delimiter: opts.delimiter, header: opts.header, encoding: opts.encoding });
}

/** Write an SPSS .sav file (bytecode-compressed by default; `zsav` for zlib-compressed). */
export function exportSav(ds: Dataset, opts: { compression?: 'none' | 'bytecode' | 'zsav' } = {}): Uint8Array {
  return writeSav(ds, opts).bytes;
}

/**
 * Like exportSav, plus plain-language notes about anything SPSS could not store exactly (strings
 * widened, more than 3 missing values, labels cut to SPSS limits, names changed).
 */
export function exportSavWithReport(ds: Dataset, opts: { compression?: 'none' | 'bytecode' | 'zsav' } = {}): { bytes: Uint8Array; warnings: string[] } {
  return writeSav(ds, opts);
}

/** CSV text. `values`: 'codes' writes raw values, 'labels' writes value labels where defined. */
export function exportCsv(ds: Dataset, opts: { values?: 'codes' | 'labels'; delimiter?: string; bom?: boolean } = {}): string {
  return writeDelimited(ds, opts);
}

/** Excel workbook: sheet "Data" plus sheet "Variables" (the codebook). */
export async function exportXlsx(ds: Dataset, opts: { values?: 'codes' | 'labels' } = {}): Promise<Blob> {
  return writeXlsx(ds, opts);
}

/** A codebook (variable list with labels, value labels, missing values) as rows for display/export. */
export function codebookRows(ds: Dataset): Array<Record<string, string>> {
  return buildCodebookRows(ds);
}

/** Worksheet names of an .xlsx file (for a sheet picker before importing). */
export async function listXlsxSheets(bytes: Uint8Array): Promise<string[]> {
  return listSheets(bytes);
}
