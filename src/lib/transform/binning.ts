// Visual Binning: turn a scale variable into ordered groups (equal width, equal count, custom cutpoints).
// Group labels read "18 to 29" (never "18-29", which is ambiguous for negative numbers: "-20--10").

import type { Dataset, ValueLabel, Variable } from '../../core/types';
import { activeCaseMask, isMissingValue, validateVarName } from '../../core/data';
import { addVariable, fmtN, newNumericVar, type TransformResult } from './dsops';
import { lines, valueLabelsSyntax, variableLabelSyntax } from './syntax';

export type BinMethod =
  | { kind: 'width'; intervals: number }
  | { kind: 'widthFrom'; first: number; width: number }
  | { kind: 'count'; groups: number }
  | { kind: 'custom'; cuts: number[] };

export interface BinSpec {
  sourceId: string;
  name: string;
  label?: string;
  method: BinMethod;
  /** true: a bin includes its upper cutpoint (SPSS default "<="); false: upper cutpoint excluded ("<"). */
  upperIncluded?: boolean;
}

export class BinError extends Error {}

interface Stats {
  values: number[]; // sorted valid values among active cases
  min: number;
  max: number;
  integer: boolean;
}

function validStats(ds: Dataset, v: Variable): Stats {
  if (v.type !== 'numeric') throw new BinError(`${v.name} is a string variable; binning needs numbers.`);
  const mask = activeCaseMask(ds);
  const col = ds.columns[v.id] as Float64Array;
  const values: number[] = [];
  let integer = true;
  for (let i = 0; i < ds.nCases; i++) {
    if (!mask[i]) continue;
    const x = col[i];
    if (isMissingValue(v, x)) continue;
    values.push(x);
    if (!Number.isInteger(x)) integer = false;
  }
  if (!values.length) throw new BinError(`${v.name} has no valid values.`);
  values.sort((a, b) => a - b);
  return { values, min: values[0], max: values[values.length - 1], integer };
}

function niceRound(x: number, integer: boolean): number {
  if (integer) return Math.round(x);
  return Number(x.toPrecision(6));
}

/** Interior cutpoints (sorted, unique). k cutpoints make k+1 bins. */
export function computeCutpoints(ds: Dataset, v: Variable, method: BinMethod): number[] {
  const st = validStats(ds, v);
  let cuts: number[] = [];
  switch (method.kind) {
    case 'width': {
      const k = Math.round(method.intervals);
      if (!(k >= 2 && k <= 100)) throw new BinError('Choose between 2 and 100 intervals.');
      const w = (st.max - st.min) / k;
      if (!(w > 0)) throw new BinError(`${v.name} has only one value, so it cannot be split into intervals.`);
      for (let j = 1; j < k; j++) cuts.push(niceRound(st.min + w * j, st.integer && w >= 1));
      break;
    }
    case 'widthFrom': {
      if (!Number.isFinite(method.first)) throw new BinError('Enter the first cutpoint as a number.');
      if (!(method.width > 0 && Number.isFinite(method.width))) throw new BinError('The interval width must be a number greater than zero.');
      // Every case would land in one group: no cutpoint falls below the largest value.
      if (method.first >= st.max)
        throw new BinError(`The first cutpoint (${fmtCut(method.first)}) is not below the largest value of ${v.name} (${fmtCut(st.max)}), so every case would fall into one group. Choose a first cutpoint below ${fmtCut(st.max)}.`);
      for (let c = method.first; c < st.max && cuts.length < 200; c += method.width) cuts.push(Number(c.toPrecision(10)));
      if (cuts.length >= 200) throw new BinError('That would make more than 200 groups. Use a wider interval.');
      break;
    }
    case 'count': {
      const k = Math.round(method.groups);
      if (!(k >= 2 && k <= 100)) throw new BinError('Choose between 2 and 100 groups.');
      const n = st.values.length;
      for (let j = 1; j < k; j++) cuts.push(st.values[Math.max(0, Math.ceil((j * n) / k) - 1)]);
      break;
    }
    case 'custom':
      if (method.cuts.some((c) => !Number.isFinite(c))) throw new BinError('Cutpoints must be numbers separated by commas, for example 29, 44, 64.');
      cuts = method.cuts.slice();
      if (!cuts.length) throw new BinError('Enter at least one cutpoint.');
      break;
  }
  cuts = [...new Set(cuts)].sort((a, b) => a - b);
  return cuts;
}

/** 1-based bin number for x (NaN stays NaN). */
export function binOf(x: number, cuts: number[], upperIncluded = true): number {
  if (Number.isNaN(x)) return NaN;
  let lo = 0, hi = cuts.length;
  // first cut index where x belongs below/at the cut
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const inBin = upperIncluded ? x <= cuts[mid] : x < cuts[mid];
    if (inBin) hi = mid;
    else lo = mid + 1;
  }
  return lo + 1;
}

function fmtCut(x: number, digits = 6): string {
  return Number.isInteger(x) ? String(x) : String(Number(x.toPrecision(digits)));
}

/**
 * Significant digits that tell every cutpoint apart (6 usually; more when cutpoints lie very close
 * together, so two groups never get the same label).
 */
function cutDigits(cuts: number[]): number {
  for (let d = 6; d < 17; d++) if (new Set(cuts.map((c) => fmtCut(c, d))).size === new Set(cuts).size) return d;
  return 17;
}

/** Readable labels: "18 to 29", "30 to 44", "65+" for whole numbers; "<= 2.5", "2.5 to 5", "> 5" otherwise. */
export function binLabels(cuts: number[], dataMin: number, integerData: boolean, upperIncluded = true): string[] {
  // No cutpoint: one group holding every value (never read cuts[0] of an empty list).
  if (!cuts.length) return [Number.isFinite(dataMin) ? `${fmtCut(dataMin)}+` : 'All values'];
  const digits = cutDigits(cuts);
  const f = (x: number) => fmtCut(x, digits);
  /** "lo to hi": unambiguous for negative numbers too ("-20 to -10", never "-20--10"). */
  const span = (lo: number, hi: number) => `${f(lo)} to ${f(hi)}`;
  const k = cuts.length + 1;
  const labels: string[] = [];
  const ints = integerData && cuts.every(Number.isInteger);
  for (let j = 0; j < k; j++) {
    const first = j === 0, last = j === k - 1;
    if (ints) {
      const lo = first ? dataMin : upperIncluded ? cuts[j - 1] + 1 : cuts[j - 1];
      const hi = last ? Infinity : upperIncluded ? cuts[j] : cuts[j] - 1;
      if (last) labels.push(`${f(lo)}+`);
      else if (first && dataMin > hi) labels.push(`Up to ${f(hi)}`);
      else labels.push(lo === hi ? f(lo) : span(lo, hi));
    } else if (upperIncluded) {
      labels.push(first ? `<= ${f(cuts[0])}` : last ? `> ${f(cuts[j - 1])}` : span(cuts[j - 1], cuts[j]));
    } else {
      labels.push(first ? `< ${f(cuts[0])}` : last ? `>= ${f(cuts[j - 1])}` : span(cuts[j - 1], cuts[j]));
    }
  }
  return labels;
}

export interface BinPreview {
  cuts: number[];
  bins: Array<{ code: number; label: string; count: number }>;
  min: number;
  max: number;
  n: number;
}

export function previewBins(ds: Dataset, spec: Pick<BinSpec, 'sourceId' | 'method' | 'upperIncluded'>): BinPreview {
  const v = ds.variables.find((x) => x.id === spec.sourceId);
  if (!v) throw new BinError('Choose a variable to bin.');
  const st = validStats(ds, v);
  const cuts = computeCutpoints(ds, v, spec.method);
  const up = spec.upperIncluded ?? true;
  const labels = binLabels(cuts, st.min, st.integer, up);
  const counts = new Array(cuts.length + 1).fill(0);
  for (const x of st.values) counts[binOf(x, cuts, up) - 1]++;
  return { cuts, bins: labels.map((label, j) => ({ code: j + 1, label, count: counts[j] })), min: st.min, max: st.max, n: st.values.length };
}

export function visualBin(ds: Dataset, spec: BinSpec): TransformResult {
  const v = ds.variables.find((x) => x.id === spec.sourceId);
  if (!v) throw new BinError('Choose a variable to bin.');
  const name = spec.name.trim();
  const err = validateVarName(ds, name);
  if (err) throw new BinError(err);
  const up = spec.upperIncluded ?? true;
  const pv = previewBins(ds, spec);
  const col = ds.columns[v.id] as Float64Array;
  const out = new Float64Array(ds.nCases);
  for (let i = 0; i < ds.nCases; i++) out[i] = isMissingValue(v, col[i]) ? NaN : binOf(col[i], pv.cuts, up);
  const labels: ValueLabel[] = pv.bins.map((b) => ({ value: b.code, label: b.label }));
  const label = spec.label ?? `${v.label || v.name} (binned)`;
  const nv = newNumericVar(name, { label, decimals: 0, width: 5, valueLabels: labels, measure: 'ordinal' });
  const idx = ds.variables.findIndex((x) => x.id === v.id);
  const next = addVariable(ds, nv, out, idx + 1);
  const op = up ? '>' : '>=';
  const sum = pv.cuts.map((c) => `(${v.name} ${op} ${c})`).join(' + ');
  const syntax = lines(
    `IF (NOT MISSING(${v.name})) ${name}=1 + ${sum}.`,
    `FORMATS ${name} (F5.0).`,
    variableLabelSyntax(name, label),
    valueLabelsSyntax(name, labels),
    'EXECUTE.',
  );
  return {
    dataset: next,
    title: 'Visual Binning',
    syntax,
    summary: `Created ${name} with ${pv.bins.length} groups from ${v.name}: ${pv.bins.map((b) => `${b.label} (${fmtN(b.count)})`).join(', ')}.`,
    warnings: [],
  };
}
