// Immutable dataset helpers shared by all transformations. Each returns a NEW Dataset (version + 1)
// that shares unchanged columns with the input, so undo stays cheap.

import type { Column, Dataset, Variable } from '../../core/types';
import { makeVariable } from '../../core/types';

export interface TransformResult {
  dataset: Dataset;
  /** Short title for the output log, e.g. "Compute Variable". */
  title: string;
  /** Equivalent SPSS syntax. */
  syntax: string;
  /** One-line plain-language summary. */
  summary: string;
  warnings: string[];
}

export function bump(ds: Dataset, patch: Partial<Dataset>): Dataset {
  return { ...ds, ...patch, version: ds.version + 1 };
}

export function withColumns(ds: Dataset, cols: Record<string, Column>): Dataset {
  return bump(ds, { columns: { ...ds.columns, ...cols } });
}

/** Add a variable (with data) at `index` (default end). */
export function addVariable(ds: Dataset, v: Variable, col: Column, index?: number): Dataset {
  const variables = ds.variables.slice();
  variables.splice(index ?? variables.length, 0, v);
  return bump(ds, { variables, columns: { ...ds.columns, [v.id]: col } });
}

/** Replace a variable's definition (same id) and optionally its column. */
export function replaceVariable(ds: Dataset, v: Variable, col?: Column): Dataset {
  const variables = ds.variables.map((x) => (x.id === v.id ? v : x));
  return bump(ds, { variables, columns: col ? { ...ds.columns, [v.id]: col } : ds.columns });
}

/** Reorder (or subset) all cases: new row i = old row order[i]. */
export function takeRows(ds: Dataset, order: ArrayLike<number>): Dataset {
  const n = order.length;
  const columns: Record<string, Column> = {};
  for (const v of ds.variables) {
    const col = ds.columns[v.id];
    if (col instanceof Float64Array) {
      const c = new Float64Array(n);
      for (let i = 0; i < n; i++) c[i] = col[order[i]];
      columns[v.id] = c;
    } else {
      const c = new Array<string>(n);
      for (let i = 0; i < n; i++) c[i] = col[order[i]];
      columns[v.id] = c;
    }
  }
  return bump(ds, { columns, nCases: n });
}

/** Numeric format string for a width/decimals pair. */
export function numFormat(width: number, decimals: number): string {
  return `F${width}.${decimals}`;
}

/** A new numeric variable definition with SPSS-like defaults. */
export function newNumericVar(name: string, opts: Partial<Variable> = {}): Variable {
  const decimals = opts.decimals ?? 2;
  const width = opts.width ?? 8;
  return makeVariable({ ...opts, name, type: 'numeric', width, decimals, format: opts.format ?? numFormat(width, decimals) });
}

export function newStringVar(name: string, width: number, opts: Partial<Variable> = {}): Variable {
  const w = Math.max(1, Math.min(32767, Math.round(width)));
  return makeVariable({ ...opts, name, type: 'string', width: w, decimals: 0, format: `A${w}`, columns: Math.max(8, Math.min(24, w)) });
}

/** True if every non-NaN value is an integer (used to pick 0 decimals for new variables). */
export function allIntegers(col: Float64Array): boolean {
  for (let i = 0; i < col.length; i++) {
    const x = col[i];
    if (!Number.isNaN(x) && !Number.isInteger(x)) return false;
  }
  return true;
}

/** Suggest a sensible number of decimals for a computed column (0 for integers, else 2). */
export function suggestDecimals(col: Float64Array): number {
  return allIntegers(col) ? 0 : 2;
}

export function countSysmis(col: Column): number {
  let k = 0;
  if (col instanceof Float64Array) {
    for (let i = 0; i < col.length; i++) if (Number.isNaN(col[i])) k++;
  }
  return k;
}

/** Filter mask helper: indexes of cases in play, optional. */
export function rowsWhere(mask: Uint8Array): number[] {
  const out: number[] = [];
  for (let i = 0; i < mask.length; i++) if (mask[i]) out.push(i);
  return out;
}

/**
 * Smallest / largest number in a list (Infinity / -Infinity when empty). Use these instead of
 * Math.min(...values): spreading a data-sized list as call arguments overflows the call stack
 * (about 120,000 values in V8).
 */
export function minOf(values: Iterable<number>): number {
  let m = Infinity;
  for (const x of values) if (x < m) m = x;
  return m;
}
export function maxOf(values: Iterable<number>): number {
  let m = -Infinity;
  for (const x of values) if (x > m) m = x;
  return m;
}

export const fmtN = (n: number) => n.toLocaleString('en-US');
export const plural = (n: number, one: string, many = one + 's') => `${fmtN(n)} ${n === 1 ? one : many}`;
