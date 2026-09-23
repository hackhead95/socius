// Derived variables: reverse-coding, scale scores, z-scores, counts, ranks.

import type { Column, Dataset, ValueLabel, Variable } from '../../core/types';
import { newId } from '../../core/types';
import { activeCaseMask, caseWeights, isMissingValue, isUserMissing, uniqueVarName, validateVarName } from '../../core/data';
import { addVariable, fmtN, newNumericVar, replaceVariable, suggestDecimals, type TransformResult } from './dsops';
import { matchesFrom, type RecodeFrom } from './recode';
import { lines, sv, valueLabelsSyntax, variableLabelSyntax, varList } from './syntax';

export class DeriveError extends Error {}

function findVar(ds: Dataset, id: string): Variable {
  const v = ds.variables.find((x) => x.id === id);
  if (!v) throw new DeriveError('A selected variable no longer exists.');
  return v;
}

// ---------- Reverse-code ----------

export interface ScaleRange {
  min: number;
  max: number;
  source: 'labels' | 'data';
}

/** Scale end points: from value labels (ignoring user-missing codes) when there are at least 2, else from the data. */
export function detectScaleRange(ds: Dataset, v: Variable): ScaleRange | null {
  if (v.type !== 'numeric') return null;
  const labelled = v.valueLabels
    .map((l) => l.value)
    .filter((x): x is number => typeof x === 'number' && !isUserMissing(v.missing, x));
  if (labelled.length >= 2) return { min: Math.min(...labelled), max: Math.max(...labelled), source: 'labels' };
  const col = ds.columns[v.id] as Float64Array;
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < col.length; i++) {
    const x = col[i];
    if (isMissingValue(v, x)) continue;
    if (x < min) min = x;
    if (x > max) max = x;
  }
  return Number.isFinite(min) ? { min, max, source: 'data' } : null;
}

export interface ReverseSpec {
  varIds: string[];
  /** 'new' creates <name><suffix>; 'replace' overwrites the items. */
  mode: 'new' | 'replace';
  suffix?: string;
  /** Override detected end points (applies to all items). */
  range?: { min: number; max: number };
}

export function reverseCode(ds: Dataset, spec: ReverseSpec): TransformResult {
  if (!spec.varIds.length) throw new DeriveError('Choose the items to reverse.');
  const suffix = spec.suffix ?? '_r';
  let next = ds;
  const syn: string[] = [];
  const done: string[] = [];
  for (const id of spec.varIds) {
    const v = findVar(ds, id);
    if (v.type !== 'numeric') throw new DeriveError(`${v.name} is a string variable and cannot be reversed.`);
    const r = spec.range ?? detectScaleRange(ds, v);
    if (!r) throw new DeriveError(`${v.name} has no valid values, so its scale range is unknown.`);
    const total = r.min + r.max;
    const src = ds.columns[v.id] as Float64Array;
    const out = new Float64Array(src.length);
    for (let i = 0; i < src.length; i++) {
      const x = src[i];
      out[i] = isMissingValue(v, x) ? x : total - x;
    }
    const labels: ValueLabel[] = v.valueLabels
      .map((l) =>
        typeof l.value === 'number' && !isUserMissing(v.missing, l.value) ? { value: total - l.value, label: l.label } : l,
      )
      .sort((a, b) => (a.value as number) - (b.value as number));
    const small = Number.isInteger(r.min) && Number.isInteger(r.max) && r.max - r.min <= 20;
    const recodePairs = small
      ? Array.from({ length: r.max - r.min + 1 }, (_, k) => `(${r.min + k}=${total - (r.min + k)})`).join(' ')
      : '';
    if (spec.mode === 'replace') {
      next = replaceVariable(next, { ...v, valueLabels: labels }, out);
      syn.push(small ? `RECODE ${v.name} ${recodePairs}.` : `COMPUTE ${v.name}=${total}-${v.name}.`);
      syn.push(valueLabelsSyntax(v.name, labels));
      done.push(v.name);
    } else {
      const name = uniqueVarName(next, v.name + suffix);
      const label = v.label ? `${v.label} (reversed)` : `${v.name} reversed`;
      const nv: Variable = { ...v, id: newId('v'), name, label, valueLabels: labels };
      const idx = next.variables.findIndex((x) => x.id === v.id);
      next = addVariable(next, nv, out, idx + 1);
      syn.push(small ? `RECODE ${v.name} ${recodePairs} (ELSE=COPY) INTO ${name}.` : `COMPUTE ${name}=${total}-${v.name}.`);
      syn.push(variableLabelSyntax(name, label));
      syn.push(valueLabelsSyntax(name, labels));
      done.push(`${v.name} to ${name}`);
    }
  }
  return {
    dataset: next,
    title: 'Reverse-code Items',
    syntax: lines(...syn, 'EXECUTE.'),
    summary: `Reversed ${done.join(', ')}.`,
    warnings: [],
  };
}

// ---------- Scale / index ----------

export interface ScaleSpec {
  itemIds: string[];
  method: 'mean' | 'sum';
  /** Minimum number of valid items for a score; otherwise system-missing. */
  minValid: number;
  name: string;
  label?: string;
}

export function createScale(ds: Dataset, spec: ScaleSpec): TransformResult {
  const k = spec.itemIds.length;
  if (k < 2) throw new DeriveError('A scale needs at least two items.');
  const err = validateVarName(ds, spec.name.trim());
  if (err) throw new DeriveError(err);
  const minValid = Math.max(1, Math.min(k, Math.round(spec.minValid)));
  const items = spec.itemIds.map((id) => findVar(ds, id));
  for (const v of items) if (v.type !== 'numeric') throw new DeriveError(`${v.name} is a string variable; scale items must be numeric.`);
  const cols = items.map((v) => ds.columns[v.id] as Float64Array);
  const out = new Float64Array(ds.nCases);
  let nScored = 0;
  for (let i = 0; i < ds.nCases; i++) {
    let s = 0, c = 0;
    for (let j = 0; j < k; j++) {
      const x = cols[j][i];
      if (!isMissingValue(items[j], x)) {
        s += x;
        c++;
      }
    }
    if (c >= minValid) {
      out[i] = spec.method === 'mean' ? s / c : s;
      nScored++;
    } else out[i] = NaN;
  }
  const name = spec.name.trim();
  const fn = spec.method === 'mean' ? 'MEAN' : 'SUM';
  const nv = newNumericVar(name, { label: spec.label ?? '', decimals: spec.method === 'mean' ? 2 : suggestDecimals(out), measure: 'scale' });
  const next = addVariable(ds, nv, out);
  const syntax = lines(`COMPUTE ${name}=${fn}.${minValid}(${items.map((v) => v.name).join(', ')}).`, spec.label ? variableLabelSyntax(name, spec.label) : '', 'EXECUTE.');
  const summary = `Created ${name} as the ${spec.method} of ${k} items (at least ${minValid} answered): ${fmtN(nScored)} of ${fmtN(ds.nCases)} cases have a score.`;
  return { dataset: next, title: 'Create Scale', syntax, summary, warnings: [] };
}

// ---------- Standardize (DESCRIPTIVES /SAVE) ----------

export function standardize(ds: Dataset, varIds: string[]): TransformResult {
  if (!varIds.length) throw new DeriveError('Choose at least one variable.');
  const mask = activeCaseMask(ds);
  const w = caseWeights(ds);
  let next = ds;
  const made: string[] = [];
  const warnings: string[] = [];
  for (const id of varIds) {
    const v = findVar(ds, id);
    if (v.type !== 'numeric') throw new DeriveError(`${v.name} is a string variable.`);
    const col = ds.columns[v.id] as Float64Array;
    let sw = 0, sx = 0;
    for (let i = 0; i < ds.nCases; i++) {
      if (!mask[i] || w[i] <= 0 || isMissingValue(v, col[i])) continue;
      sw += w[i];
      sx += w[i] * col[i];
    }
    const mean = sx / sw;
    let ss = 0;
    for (let i = 0; i < ds.nCases; i++) {
      if (!mask[i] || w[i] <= 0 || isMissingValue(v, col[i])) continue;
      ss += w[i] * (col[i] - mean) ** 2;
    }
    const sd = Math.sqrt(ss / (sw - 1));
    if (!(sw > 1) || !(sd > 0)) {
      warnings.push(`${v.name}: no variation (or fewer than 2 cases), so no z-scores were saved.`);
      continue;
    }
    const out = new Float64Array(ds.nCases);
    for (let i = 0; i < ds.nCases; i++) out[i] = !mask[i] || isMissingValue(v, col[i]) ? NaN : (col[i] - mean) / sd;
    const name = uniqueVarName(next, 'Z' + v.name);
    next = addVariable(next, newNumericVar(name, { label: `Zscore: ${v.label || v.name}`, decimals: 5, width: 11, measure: 'scale' }), out);
    made.push(name);
  }
  if (!made.length) throw new DeriveError(warnings.join(' '));
  const names = varIds.map((id) => findVar(ds, id).name);
  return {
    dataset: next,
    title: 'Standardize (z-scores)',
    syntax: `DESCRIPTIVES VARIABLES=${varList(names)}\n  /SAVE.`,
    summary: `Saved z-scores ${made.join(', ')}${ds.weightVarId ? ' (weighted mean and SD)' : ''}.`,
    warnings,
  };
}

// ---------- Count values within cases ----------

export interface CountSpec {
  varIds: string[];
  values: RecodeFrom[];
  name: string;
  label?: string;
}

export function countValues(ds: Dataset, spec: CountSpec): TransformResult {
  if (!spec.varIds.length) throw new DeriveError('Choose the variables to look at.');
  if (!spec.values.length) throw new DeriveError('Add at least one value to count.');
  const name = spec.name.trim();
  const err = validateVarName(ds, name);
  if (err) throw new DeriveError(err);
  const vars = spec.varIds.map((id) => findVar(ds, id));
  const types = new Set(vars.map((v) => v.type));
  if (types.size > 1) throw new DeriveError('Count numeric and string variables separately.');
  const cols = vars.map((v) => ds.columns[v.id]);
  const out = new Float64Array(ds.nCases);
  for (let i = 0; i < ds.nCases; i++) {
    let k = 0;
    for (let j = 0; j < vars.length; j++) {
      const x = cols[j][i];
      if (spec.values.some((f) => matchesFrom(vars[j], x, f))) k++;
    }
    out[i] = k;
  }
  const valSyn = spec.values
    .map((f) =>
      f.kind === 'value' ? sv(f.value) : f.kind === 'range' ? `${f.lo} THRU ${f.hi}` : f.kind === 'lowest' ? `LOWEST THRU ${f.hi}` : f.kind === 'highest' ? `${f.lo} THRU HIGHEST` : f.kind === 'sysmis' ? 'SYSMIS' : 'MISSING',
    )
    .join(' ');
  const next = addVariable(ds, newNumericVar(name, { label: spec.label ?? '', decimals: 0, width: 4, measure: 'scale' }), out);
  let mean = 0;
  for (let i = 0; i < out.length; i++) mean += out[i];
  mean /= Math.max(1, out.length);
  return {
    dataset: next,
    title: 'Count Values within Cases',
    syntax: lines(`COUNT ${name}=${varList(vars.map((v) => v.name))} (${valSyn}).`, spec.label ? variableLabelSyntax(name, spec.label) : '', 'EXECUTE.'),
    summary: `Created ${name}: the number of the ${vars.length} variables with the listed values (average ${mean.toFixed(2)} per case).`,
    warnings: [],
  };
}

// ---------- Rank cases ----------

export interface RankSpec {
  varIds: string[];
  order: 'asc' | 'desc';
  ties: 'mean' | 'low' | 'high' | 'condense';
  type: 'rank' | 'percent' | 'ntiles';
  ntiles?: number;
}

/** Ranks (1-based) of valid values; ties handled per `ties`. Returns NaN for excluded cases. */
export function rankColumn(values: Float64Array | string[], include: (i: number) => boolean, order: 'asc' | 'desc', ties: RankSpec['ties']): { ranks: Float64Array; n: number } {
  const n = values.length;
  const idx: number[] = [];
  for (let i = 0; i < n; i++) if (include(i)) idx.push(i);
  const cmp = (a: number, b: number) => {
    const x = values[a], y = values[b];
    const c = x < y ? -1 : x > y ? 1 : 0;
    return order === 'asc' ? c : -c;
  };
  idx.sort((a, b) => cmp(a, b) || a - b);
  const ranks = new Float64Array(n).fill(NaN);
  let pos = 0, dense = 0;
  while (pos < idx.length) {
    let end = pos + 1;
    while (end < idx.length && cmp(idx[pos], idx[end]) === 0) end++;
    dense++;
    const lo = pos + 1, hi = end;
    const r = ties === 'mean' ? (lo + hi) / 2 : ties === 'low' ? lo : ties === 'high' ? hi : dense;
    for (let k = pos; k < end; k++) ranks[idx[k]] = r;
    pos = end;
  }
  return { ranks, n: idx.length };
}

export function rankCases(ds: Dataset, spec: RankSpec): TransformResult {
  if (!spec.varIds.length) throw new DeriveError('Choose at least one variable to rank.');
  const mask = activeCaseMask(ds);
  let next = ds;
  const made: string[] = [];
  const k = spec.ntiles ?? 4;
  if (spec.type === 'ntiles' && !(k >= 2 && k <= 100)) throw new DeriveError('The number of groups must be between 2 and 100.');
  for (const id of spec.varIds) {
    const v = findVar(ds, id);
    const col = ds.columns[v.id] as Column;
    const { ranks, n } = rankColumn(col, (i) => !!mask[i] && !isMissingValue(v, col[i]) && !(typeof col[i] === 'string' && (col[i] as string).trim() === ''), spec.order, spec.ties);
    let out = ranks;
    let prefix = 'R', label = `Rank of ${v.name}`;
    if (spec.type === 'percent') {
      out = ranks.map((r) => (r / n) * 100);
      prefix = 'P';
      label = `Fractional rank percent of ${v.name}`;
    } else if (spec.type === 'ntiles') {
      out = ranks.map((r) => (Number.isNaN(r) ? NaN : Math.floor((r * k) / (n + 1)) + 1));
      prefix = 'N';
      label = `Percentile group of ${v.name} (${k} groups)`;
    }
    const name = uniqueVarName(next, prefix + v.name);
    const decimals = spec.type === 'ntiles' || (spec.ties !== 'mean' && spec.type === 'rank') ? 0 : suggestDecimals(out) || 0;
    next = addVariable(next, newNumericVar(name, { label, decimals: spec.type === 'percent' ? 2 : decimals, measure: spec.type === 'ntiles' ? 'ordinal' : 'scale' }), out);
    made.push(name);
  }
  const names = spec.varIds.map((id) => findVar(ds, id).name);
  const fn = spec.type === 'rank' ? 'RANK' : spec.type === 'percent' ? 'PERCENT' : `NTILES(${k})`;
  return {
    dataset: next,
    title: 'Rank Cases',
    syntax: `RANK VARIABLES=${varList(names)} (${spec.order === 'asc' ? 'A' : 'D'})\n  /${fn}\n  /TIES=${spec.ties.toUpperCase()}.`,
    summary: `Created ${made.join(', ')}.`,
    warnings: [],
  };
}

