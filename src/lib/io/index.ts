// STUB — owned by the IO agent. Signatures are the contract other modules code against.
import type { Dataset } from '../../core/types';

export interface ImportResult {
  dataset: Dataset;
  /** Non-fatal issues to show the user (e.g. "3 value labels truncated", "encoding guessed as windows-1252"). */
  warnings: string[];
}

export type ImportOptions = {
  /** CSV/TSV: delimiter override; auto-detected otherwise. */
  delimiter?: string;
  /** CSV/XLSX: first row holds variable names (default true). */
  header?: boolean;
  /** Text encoding override for .sav without an encoding record, and for CSV. */
  encoding?: string;
  /** XLSX: sheet name or index. */
  sheet?: string | number;
};

/** Import .sav, .zsav, .csv, .tsv, .txt (delimited), .xlsx. Detects type by extension and magic bytes. */
export async function importFile(name: string, bytes: Uint8Array, opts: ImportOptions = {}): Promise<ImportResult> {
  throw new Error('importFile not implemented yet');
}

/** Write an SPSS .sav file (bytecode-compressed by default; `zsav` for zlib-compressed). */
export function exportSav(ds: Dataset, opts: { compression?: 'none' | 'bytecode' | 'zsav' } = {}): Uint8Array {
  throw new Error('exportSav not implemented yet');
}

/** CSV text. `values`: 'codes' writes raw values, 'labels' writes value labels where defined. */
export function exportCsv(ds: Dataset, opts: { values?: 'codes' | 'labels'; delimiter?: string } = {}): string {
  throw new Error('exportCsv not implemented yet');
}

/** Excel workbook: sheet "Data" plus sheet "Variables" (the codebook). */
export async function exportXlsx(ds: Dataset, opts: { values?: 'codes' | 'labels' } = {}): Promise<Blob> {
  throw new Error('exportXlsx not implemented yet');
}

/** A codebook (variable list with labels, value labels, missing values) as rows for display/export. */
export function codebookRows(ds: Dataset): Array<Record<string, string>> {
  throw new Error('codebookRows not implemented yet');
}
