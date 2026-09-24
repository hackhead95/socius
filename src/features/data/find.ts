// Find in the Data View: matches values and value labels without formatting every cell.

import type { Dataset } from '../../core/types';
import { activeCaseMask, caseWeights, isMissingValue, valueLabelFor } from '../../core/data';

export interface FindOptions {
  text: string;
  /** Restrict to one variable index, or search all. */
  colIndex: number | null;
  /** Also match value labels. */
  labels: boolean;
  /** Whole cell must match (otherwise "contains" for text and labels). */
  whole: boolean;
}

type Matcher = (row: number) => boolean;

function matcherFor(ds: Dataset, c: number, o: FindOptions): Matcher | null {
  const v = ds.variables[c];
  const col = ds.columns[v.id];
  const needle = o.text.trim().toLowerCase();
  if (!needle) return null;
  const textMatch = (s: string) => (o.whole ? s.trim().toLowerCase() === needle : s.toLowerCase().includes(needle));
  if (col instanceof Float64Array) {
    const num = Number(needle.replace(/,/g, ''));
    const hasNum = needle !== '' && Number.isFinite(num);
    const labelCodes = new Set<number>();
    if (o.labels) for (const l of v.valueLabels) if (typeof l.value === 'number' && textMatch(l.label)) labelCodes.add(l.value);
    if (!hasNum && !labelCodes.size) return null;
    return (r) => {
      const x = col[r];
      return (hasNum && x === num) || labelCodes.has(x);
    };
  }
  return (r) => {
    const s = col[r];
    if (textMatch(s)) return true;
    if (o.labels && v.valueLabels.length) {
      const l = valueLabelFor(v, s);
      return l !== undefined && textMatch(l);
    }
    return false;
  };
}

/** Next match after (row, col) in reading order (row by row), wrapping around. dir -1 searches backwards. */
export function findNext(ds: Dataset, from: { row: number; col: number }, o: FindOptions, dir: 1 | -1 = 1): { row: number; col: number } | null {
  const nv = ds.variables.length;
  const n = ds.nCases;
  if (!n || !nv) return null;
  const cols = o.colIndex !== null ? [o.colIndex] : Array.from({ length: nv }, (_, i) => i);
  const matchers = cols.map((c) => matcherFor(ds, c, o));
  if (matchers.every((m) => !m)) return null;
  const total = n * cols.length;
  const colPos = Math.max(0, cols.indexOf(from.col));
  let pos = Math.min(Math.max(from.row, 0), n - 1) * cols.length + (o.colIndex !== null ? 0 : colPos);
  for (let k = 0; k < total; k++) {
    pos = (pos + dir + total) % total;
    const r = Math.floor(pos / cols.length);
    const ci = pos % cols.length;
    const m = matchers[ci];
    if (m && m(r)) return { row: r, col: cols[ci] };
  }
  return null;
}

export interface ColumnSummary {
  kind: 'numeric' | 'categorical';
  n: number;
  weightedN: number;
  missing: number;
  filtered: number;
  mean?: number;
  sd?: number;
  min?: number;
  max?: number;
  median?: number;
  categories?: Array<{ label: string; count: number; pct: number }>;
  distinct?: number;
  weighted: boolean;
}

/** Quick column summary respecting the filter and weight (like SPSS's statistics on a column). */
export function summarizeColumn(ds: Dataset, varIndex: number): ColumnSummary {
  const v = ds.variables[varIndex];
  const col = ds.columns[v.id];
  const mask = activeCaseMask(ds);
  const w = caseWeights(ds);
  let n = 0, wn = 0, missing = 0, filtered = 0;
  const weighted = !!ds.weightVarId;
  const categorical = v.type === 'string' || v.measure !== 'scale' || (v.valueLabels.length > 0 && v.measure !== 'scale');
  if (!categorical && col instanceof Float64Array) {
    let sw = 0, sx = 0, min = Infinity, max = -Infinity;
    const vals: number[] = [];
    for (let i = 0; i < ds.nCases; i++) {
      if (!mask[i] || w[i] <= 0) { filtered++; continue; }
      const x = col[i];
      if (isMissingValue(v, x)) { missing++; continue; }
      n++; sw += w[i]; sx += w[i] * x;
      if (x < min) min = x;
      if (x > max) max = x;
      vals.push(x);
    }
    const mean = sx / sw;
    let ss = 0;
    for (let i = 0; i < ds.nCases; i++) {
      if (!mask[i] || w[i] <= 0) continue;
      const x = col[i];
      if (isMissingValue(v, x)) continue;
      ss += w[i] * (x - mean) ** 2;
    }
    vals.sort((a, b) => a - b);
    const median = vals.length ? (vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2) : NaN;
    return { kind: 'numeric', n, weightedN: sw, missing, filtered, mean: n ? mean : NaN, sd: sw > 1 ? Math.sqrt(ss / (sw - 1)) : NaN, min: n ? min : NaN, max: n ? max : NaN, median: weighted ? undefined : median, weighted };
  }
  const counts = new Map<number | string, number>();
  for (let i = 0; i < ds.nCases; i++) {
    if (!mask[i] || w[i] <= 0) { filtered++; continue; }
    const x = col[i];
    if (isMissingValue(v, x) || (typeof x === 'string' && x.trim() === '')) { missing++; continue; }
    const key = typeof x === 'string' ? x.trimEnd() : x;
    counts.set(key, (counts.get(key) ?? 0) + w[i]);
    n++;
    wn += w[i];
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const categories = sorted.slice(0, 8).map(([val, c]) => ({
    label: valueLabelFor(v, val) ?? (typeof val === 'number' ? String(val) : val),
    count: c,
    pct: wn ? (c / wn) * 100 : 0,
  }));
  return { kind: 'categorical', n, weightedN: wn, missing, filtered, categories, distinct: counts.size, weighted };
}
