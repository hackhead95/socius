// Shared data-access semantics. Statistics procedures, transforms, the grid and exporters
// must all use these so missing values, filters and weights behave identically everywhere.

import type { Column, Dataset, MissingSpec, Variable } from './types';

export function getVariable(ds: Dataset, idOrName: string): Variable | undefined {
  return (
    ds.variables.find((v) => v.id === idOrName) ??
    ds.variables.find((v) => v.name.toLowerCase() === idOrName.toLowerCase())
  );
}

export function requireVariable(ds: Dataset, idOrName: string): Variable {
  const v = getVariable(ds, idOrName);
  if (!v) throw new Error(`Variable not found: ${idOrName}`);
  return v;
}

export function getColumn(ds: Dataset, varId: string): Column {
  const c = ds.columns[varId];
  if (!c) throw new Error(`Column not found for variable id ${varId}`);
  return c;
}

export function numericColumn(ds: Dataset, varId: string): Float64Array {
  const c = getColumn(ds, varId);
  if (!(c instanceof Float64Array)) throw new Error(`Variable ${varName(ds, varId)} is not numeric`);
  return c;
}

export function stringColumn(ds: Dataset, varId: string): string[] {
  const c = getColumn(ds, varId);
  if (c instanceof Float64Array) throw new Error(`Variable ${varName(ds, varId)} is not a string variable`);
  return c;
}

function varName(ds: Dataset, varId: string) {
  return ds.variables.find((v) => v.id === varId)?.name ?? varId;
}

/** True if a raw value is user-missing under the spec (does not check system-missing). */
export function isUserMissing(spec: MissingSpec, value: number | string): boolean {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return false;
    for (const d of spec.discrete) if (typeof d === 'number' && d === value) return true;
    if (spec.range && value >= spec.range.lo && value <= spec.range.hi) return true;
    return false;
  }
  const trimmed = value.trimEnd();
  for (const d of spec.discrete) if (typeof d === 'string' && d.trimEnd() === trimmed) return true;
  return false;
}

/** True if value is system-missing (numeric NaN) or user-missing. Empty strings are NOT missing unless declared. */
export function isMissingValue(v: Variable, value: number | string): boolean {
  if (typeof value === 'number' && Number.isNaN(value)) return true;
  return isUserMissing(v.missing, value);
}

/** Label for a value, or undefined. String comparison ignores trailing spaces (SPSS pads strings). */
export function valueLabelFor(v: Variable, value: number | string): string | undefined {
  if (typeof value === 'number') {
    for (const vl of v.valueLabels) if (typeof vl.value === 'number' && vl.value === value) return vl.label;
    return undefined;
  }
  const t = value.trimEnd();
  for (const vl of v.valueLabels) if (typeof vl.value === 'string' && vl.value.trimEnd() === t) return vl.label;
  return undefined;
}

/**
 * Cases that are "in play" for analysis: passes the dataset filter (filterVarId: value non-zero and
 * not missing). Returns a Uint8Array mask of length nCases (1 = include).
 */
export function activeCaseMask(ds: Dataset): Uint8Array {
  const mask = new Uint8Array(ds.nCases).fill(1);
  if (ds.filterVarId) {
    const fv = ds.variables.find((v) => v.id === ds.filterVarId);
    const col = ds.columns[ds.filterVarId];
    if (fv && col instanceof Float64Array) {
      for (let i = 0; i < ds.nCases; i++) {
        const x = col[i];
        if (Number.isNaN(x) || x === 0 || isUserMissing(fv.missing, x)) mask[i] = 0;
      }
    }
  }
  return mask;
}

/**
 * Case weights (length nCases). All 1 when no weight variable is set. Like SPSS, cases with
 * missing, zero or negative weight get weight 0 (excluded). Fractional weights are kept as-is.
 */
export function caseWeights(ds: Dataset): Float64Array {
  const w = new Float64Array(ds.nCases).fill(1);
  if (ds.weightVarId) {
    const wv = ds.variables.find((v) => v.id === ds.weightVarId);
    const col = ds.columns[ds.weightVarId];
    if (wv && col instanceof Float64Array) {
      for (let i = 0; i < ds.nCases; i++) {
        const x = col[i];
        w[i] = Number.isNaN(x) || x <= 0 || isUserMissing(wv.missing, x) ? 0 : x;
      }
    }
  }
  return w;
}

export interface CaseSelection {
  /** Row indices of the cases used. */
  rows: number[];
  /** Weight per used case (aligned with rows). */
  weights: Float64Array;
  /** Number of cases excluded by the filter. */
  nFiltered: number;
  /** Number of cases excluded because of missing values in the listed variables (listwise). */
  nMissing: number;
}

/**
 * Listwise case selection: active (filtered-in) cases with a positive weight and no missing value in
 * ANY of the given variables. The standard entry point for procedures.
 */
export function selectCases(ds: Dataset, varIds: string[], opts: { includeUserMissing?: boolean } = {}): CaseSelection {
  const mask = activeCaseMask(ds);
  const w = caseWeights(ds);
  const vars = varIds.map((id) => ds.variables.find((v) => v.id === id)!);
  const cols = varIds.map((id) => ds.columns[id]);
  const rows: number[] = [];
  const ws: number[] = [];
  let nFiltered = 0;
  let nMissing = 0;
  for (let i = 0; i < ds.nCases; i++) {
    if (!mask[i] || w[i] <= 0) {
      nFiltered++;
      continue;
    }
    let ok = true;
    for (let k = 0; k < cols.length; k++) {
      const x = cols[k][i];
      if (typeof x === 'number') {
        if (Number.isNaN(x) || (!opts.includeUserMissing && isUserMissing(vars[k].missing, x))) {
          ok = false;
          break;
        }
      } else if (!opts.includeUserMissing && isUserMissing(vars[k].missing, x)) {
        ok = false;
        break;
      }
    }
    if (!ok) {
      nMissing++;
      continue;
    }
    rows.push(i);
    ws.push(w[i]);
  }
  return { rows, weights: Float64Array.from(ws), nFiltered, nMissing };
}

/** Numeric values for the given rows (convenience for procedures). */
export function valuesAt(col: Column, rows: number[]): Float64Array {
  if (!(col instanceof Float64Array)) throw new Error('valuesAt expects a numeric column');
  const out = new Float64Array(rows.length);
  for (let i = 0; i < rows.length; i++) out[i] = col[rows[i]];
  return out;
}

/** True when the dataset has a weight variable in effect. */
export function isWeighted(ds: Dataset): boolean {
  return !!ds.weightVarId;
}

// ---------- Display formatting ----------

const SPSS_EPOCH_MS = Date.UTC(1582, 9, 14); // 1582-10-14

export function isDateFormat(format: string): boolean {
  return /^(DATE|ADATE|EDATE|JDATE|SDATE|QYR|MOYR|WKYR|DATETIME|YMDHMS|TIME|DTIME|WKDAY|MONTH)/i.test(format);
}

export function spssSecondsToDate(sec: number): Date {
  return new Date(SPSS_EPOCH_MS + sec * 1000);
}

export function dateToSpssSeconds(d: Date): number {
  return (d.getTime() - SPSS_EPOCH_MS) / 1000;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** Format a raw cell value for display (no value labels). System-missing numeric shows as ''. */
export function formatRawValue(v: Variable, value: number | string): string {
  if (typeof value === 'string') return value;
  if (Number.isNaN(value)) return '';
  const f = v.format.toUpperCase();
  if (isDateFormat(f)) {
    const d = spssSecondsToDate(value);
    const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
    const hh = d.getUTCHours(), mm = d.getUTCMinutes(), ss = d.getUTCSeconds();
    if (f.startsWith('DATETIME') || f.startsWith('YMDHMS')) return `${pad(day)}-${MONTHS[m]}-${y} ${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    if (f.startsWith('ADATE')) return `${pad(m + 1)}/${pad(day)}/${y}`;
    if (f.startsWith('EDATE')) return `${pad(day)}.${pad(m + 1)}.${y}`;
    if (f.startsWith('SDATE')) return `${y}/${pad(m + 1)}/${pad(day)}`;
    if (f.startsWith('TIME') || f.startsWith('DTIME')) {
      const t = Math.abs(value);
      return `${value < 0 ? '-' : ''}${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(Math.floor(t % 60))}`;
    }
    if (f.startsWith('MOYR')) return `${MONTHS[m]} ${y}`;
    return `${pad(day)}-${MONTHS[m]}-${y}`;
  }
  const dec = v.decimals;
  if (f.startsWith('DOLLAR')) return '$' + value.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  if (f.startsWith('COMMA')) return value.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  if (f.startsWith('PCT')) return value.toFixed(dec) + '%';
  return value.toFixed(dec);
}

/** Display text for a cell: value label when `useLabels` and one exists, else formatted raw value. */
export function formatCell(v: Variable, value: number | string, useLabels: boolean): string {
  if (useLabels) {
    const l = valueLabelFor(v, value);
    if (l !== undefined) return l;
  }
  return formatRawValue(v, value);
}

/** "Label (name)" or "name" — how variables are referred to in output tables. */
export function varDisplayName(v: Variable, mode: 'label' | 'name' | 'both' = 'label'): string {
  if (mode === 'name' || !v.label) return v.name;
  if (mode === 'both') return `${v.label} [${v.name}]`;
  return v.label;
}

/** Display text for a category value in output tables: its label, else the formatted value. */
export function categoryLabel(v: Variable, value: number | string): string {
  const l = valueLabelFor(v, value);
  if (l !== undefined) return l;
  if (typeof value === 'string') return value.trimEnd();
  if (isDateFormat(v.format)) return formatRawValue(v, value);
  return Number.isInteger(value) ? String(value) : value.toFixed(Math.max(v.decimals, 1));
}

// ---------- Names ----------

const RESERVED = new Set(['ALL', 'AND', 'BY', 'EQ', 'GE', 'GT', 'LE', 'LT', 'NE', 'NOT', 'OR', 'TO', 'WITH']);

/** Returns an error message, or null if `name` is a valid, unused SPSS variable name. */
export function validateVarName(ds: Dataset, name: string, exceptId?: string): string | null {
  if (!name) return 'Name cannot be empty.';
  if (!/^[A-Za-z@#$À-￿][A-Za-z0-9_.@#$À-￿]*$/.test(name)) return 'Start with a letter; use only letters, digits, _ . @ # $.';
  if (name.endsWith('.') || name.endsWith('_')) return 'Name cannot end with . or _';
  if (new TextEncoder().encode(name).length > 64) return 'Name is longer than 64 bytes.';
  if (RESERVED.has(name.toUpperCase())) return `${name} is a reserved word.`;
  if (ds.variables.some((v) => v.id !== exceptId && v.name.toLowerCase() === name.toLowerCase())) return `A variable named ${name} already exists.`;
  return null;
}

/** Make `base` into a valid unused name by sanitising and appending _1, _2, ... */
export function uniqueVarName(ds: Dataset, base: string): string {
  let clean = base.replace(/[^A-Za-z0-9_.@#$]/g, '_').replace(/^[^A-Za-z@#$]+/, '');
  clean = clean.replace(/[._]+$/, '') || 'var';
  clean = clean.slice(0, 60);
  if (RESERVED.has(clean.toUpperCase())) clean = clean + '_v';
  const taken = new Set(ds.variables.map((v) => v.name.toLowerCase()));
  if (!taken.has(clean.toLowerCase())) return clean;
  for (let i = 1; ; i++) {
    const cand = `${clean}_${i}`;
    if (!taken.has(cand.toLowerCase())) return cand;
  }
}

/** Distinct non-missing values of a variable among the given rows, sorted (numbers ascending, strings alpha). */
export function distinctValues(ds: Dataset, v: Variable, rows?: number[]): Array<number | string> {
  const col = ds.columns[v.id];
  const set = new Set<number | string>();
  const it = rows ?? Array.from({ length: ds.nCases }, (_, i) => i);
  for (const i of it) {
    const x = col[i];
    if (!isMissingValue(v, x)) set.add(typeof x === 'string' ? x.trimEnd() : x);
  }
  const arr = [...set];
  if (v.type === 'numeric') (arr as number[]).sort((a, b) => a - b);
  else (arr as string[]).sort((a, b) => a.localeCompare(b));
  return arr;
}
