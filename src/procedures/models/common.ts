// Shared helpers for the model procedures: option access, case notes, SPSS syntax preamble,
// APA number formatting, and predictor design (automatic dummy coding of categorical predictors).

import type { Dataset, Variable } from '../../core/types';
import { newId } from '../../core/types';
import { categoryLabel, requireVariable, selectCases, type CaseSelection } from '../../core/data';
import { cell, hcell, type Cell, type CellFormat, type ChartSpec, type OutputBlock, type OutputItem } from '../../core/output';
import type { OptionValues, SlotValues } from '../../core/procedure';

// ---------- Options ----------

export function optBool(o: OptionValues, key: string, def: boolean): boolean {
  const v = o[key];
  return typeof v === 'boolean' ? v : def;
}
export function optStr<T extends string>(o: OptionValues, key: string, def: T): T {
  const v = o[key];
  return typeof v === 'string' && v ? (v as T) : def;
}
export function optNum(o: OptionValues, key: string, def: number): number {
  const v = o[key];
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : def;
}
export function slot(vars: SlotValues, key: string): string[] {
  return vars[key] ?? [];
}

// ---------- Text formatting (APA style) ----------

/** "p < .001" or "p = .032". */
export function fmtP(p: number): string {
  if (!Number.isFinite(p)) return 'p = .';
  if (p < 0.001) return 'p < .001';
  const s = p.toFixed(3);
  return `p = ${s === '1.000' ? '1.000' : s.replace(/^0/, '')}`;
}

/** Fixed decimals with thousands separators. */
export function num(x: number, d = 2): string {
  if (!Number.isFinite(x)) return '.';
  return x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Statistic that cannot exceed 1 in absolute value: drop the leading zero (".178"). */
export function noLead(x: number, d = 3): string {
  if (!Number.isFinite(x)) return '.';
  const s = x.toFixed(d);
  return s.replace(/^(-?)0\./, '$1.');
}

export function pct(fraction: number, d = 1): string {
  return `${(fraction * 100).toFixed(d)}%`;
}

/** Degrees of freedom: integer when integral (unweighted), else one decimal (fractional weights). */
export function dfText(x: number): string {
  return Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(1);
}
export function dfCell(x: number): Cell {
  return Math.abs(x - Math.round(x)) < 1e-9 ? cell(Math.round(x), 'int') : cell(x, 'dec1');
}

/** Coefficient cell: 3 decimals, switching to scientific text for tiny non-zero magnitudes (like SPSS). */
export function coefCell(x: number, fmt: CellFormat = 'coef'): Cell {
  if (Number.isFinite(x) && x !== 0 && Math.abs(x) < 0.0005) {
    const [m, e] = x.toExponential(3).split('e');
    return cell(`${m}E${Number(e)}`, 'text', { align: 'right' });
  }
  return cell(Number.isFinite(x) ? x : NaN, fmt);
}

export function pCell(p: number): Cell {
  return cell(Number.isFinite(p) ? p : NaN, 'p', p < 0.05 ? { tone: 'good' } : {});
}

/** How a variable is referred to in running text: its label when short, otherwise its name. */
export function textName(v: Variable): string {
  const l = v.label.trim();
  return l && l.length <= 40 ? l : v.name;
}

/** How a variable is referred to in table footnotes (SPSS shows labels). */
export function footName(v: Variable): string {
  return v.label.trim() ? `${v.label.trim()} (${v.name})` : v.name;
}

export function listText(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// ---------- Case notes and syntax ----------

export function weightedN(sel: CaseSelection): number {
  let s = 0;
  for (let i = 0; i < sel.weights.length; i++) s += sel.weights[i];
  return s;
}

export function caseNote(ds: Dataset, sel: CaseSelection, extra = ''): string {
  const parts: string[] = [];
  const n = sel.rows.length;
  if (ds.weightVarId) {
    const wv = ds.variables.find((v) => v.id === ds.weightVarId);
    const W = weightedN(sel);
    parts.push(`N = ${n.toLocaleString('en-US')} cases (weighted N = ${num(W, Number.isInteger(W) ? 0 : 1)}, weighted by ${wv?.name ?? 'weight'})`);
  } else parts.push(`N = ${n.toLocaleString('en-US')}`);
  if (sel.nMissing > 0) parts.push(`${sel.nMissing.toLocaleString('en-US')} excluded for missing values (listwise)`);
  if (sel.nFiltered > 0) parts.push(`${sel.nFiltered.toLocaleString('en-US')} not selected (filter or zero weight)`);
  return parts.join('; ') + (extra ? `; ${extra}` : '');
}

/** FILTER / WEIGHT lines so the syntax reproduces the same case base in SPSS. */
export function syntaxPreamble(ds: Dataset): string[] {
  const lines: string[] = [];
  if (ds.filterVarId) {
    const fv = ds.variables.find((v) => v.id === ds.filterVarId);
    if (fv) lines.push(`FILTER BY ${fv.name}.`);
  }
  if (ds.weightVarId) {
    const wv = ds.variables.find((v) => v.id === ds.weightVarId);
    if (wv) lines.push(`WEIGHT BY ${wv.name}.`);
  }
  return lines;
}

export function makeItem(procedure: string, title: string, ds: Dataset, blocks: OutputBlock[], syntax: string, note: string): OutputItem {
  return { id: newId('out'), procedure, title, createdAt: Date.now(), datasetName: ds.name, syntax, caseNote: note, blocks };
}

export const heading = (text: string): OutputBlock => ({ kind: 'heading', text });
export const textBlock = (style: 'interpretation' | 'apa' | 'note' | 'warning', text: string): OutputBlock => ({ kind: 'text', style, text });
export const chartBlock = (chart: ChartSpec): OutputBlock => ({ kind: 'chart', chart });
export { cell, hcell };

// ---------- Variables and values ----------

export function vars(ds: Dataset, ids: string[]): Variable[] {
  return ids.map((id) => requireVariable(ds, id));
}

export function numericValues(ds: Dataset, v: Variable, rows: number[]): Float64Array {
  const c = ds.columns[v.id];
  if (!(c instanceof Float64Array)) throw new Error(`${v.name} is a string variable; a numeric variable is needed here.`);
  const out = new Float64Array(rows.length);
  for (let i = 0; i < rows.length; i++) out[i] = c[rows[i]];
  return out;
}

export function rawValues(ds: Dataset, v: Variable, rows: number[]): Array<number | string> {
  const c = ds.columns[v.id];
  return rows.map((r) => (c instanceof Float64Array ? c[r] : (c[r] as string).trimEnd()));
}

/** Distinct values (sorted: numbers ascending, strings alphabetically) with weighted counts. */
export function levelsOf(values: Array<number | string>, w: ArrayLike<number>): Array<{ value: number | string; count: number }> {
  const m = new Map<number | string, number>();
  values.forEach((v, i) => m.set(v, (m.get(v) ?? 0) + w[i]));
  const arr = [...m.entries()].map(([value, count]) => ({ value, count }));
  arr.sort((a, b) => (typeof a.value === 'number' && typeof b.value === 'number' ? a.value - b.value : String(a.value).localeCompare(String(b.value))));
  return arr;
}

// ---------- Predictor design ----------

export type ReferenceChoice = 'first' | 'last' | 'frequent';

export interface Term {
  variable: Variable;
  kind: 'covariate' | 'factor';
  /** Design columns (one for a covariate, one per non-reference level for a factor). */
  cols: Float64Array[];
  /** Descriptive column names, e.g. "educ: Graduate (ref = Primary)". */
  colNames: string[];
  /** Short level labels for factor columns (e.g. "Graduate"). */
  levelLabels: string[];
  /** Level values for factor columns, aligned with cols. */
  levelValues: Array<number | string>;
  /** All levels (sorted), with weighted counts; factors only. */
  levels?: Array<{ value: number | string; count: number }>;
  refValue?: number | string;
  refLabel?: string;
  /** SPSS names for the dummy variables in generated syntax. */
  syntaxNames: string[];
  /** SPSS COMPUTE lines creating the dummies. */
  syntaxCompute: string[];
}

export function isCategorical(v: Variable, dummyOn: boolean): boolean {
  if (v.type === 'string') return true;
  return dummyOn && (v.measure === 'nominal' || v.measure === 'ordinal') && v.valueLabels.length > 0;
}

function spssLiteral(v: number | string): string {
  return typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`;
}

function dummySyntaxName(v: Variable, value: number | string, index: number): string {
  const suffix = typeof value === 'number' && Number.isInteger(value) && value >= 0 ? String(value) : `d${index + 1}`;
  return `${v.name}_${suffix}`.slice(0, 64);
}

/**
 * Build design columns for predictors (rows already selected). Categorical predictors (string, or
 * nominal/ordinal with value labels when dummy coding is on) become 0/1 indicator columns for every
 * level except the reference.
 */
export function buildTerms(
  ds: Dataset,
  predictorIds: string[],
  rows: number[],
  w: ArrayLike<number>,
  opts: { dummy: boolean; reference: ReferenceChoice; maxLevels?: number },
): Term[] {
  const maxLevels = opts.maxLevels ?? 50;
  return predictorIds.map((id) => {
    const v = requireVariable(ds, id);
    if (!isCategorical(v, opts.dummy)) {
      const x = numericValues(ds, v, rows);
      return { variable: v, kind: 'covariate', cols: [x], colNames: [v.name], levelLabels: [], levelValues: [], syntaxNames: [v.name], syntaxCompute: [] };
    }
    const values = rawValues(ds, v, rows);
    const levels = levelsOf(values, w);
    if (levels.length > maxLevels) {
      throw new Error(`${v.name} has ${levels.length} categories, too many to dummy-code (limit ${maxLevels}). Treat it as a scale predictor (set its measure to Scale) or recode it into fewer groups.`);
    }
    let refIdx: number;
    if (opts.reference === 'first') refIdx = 0;
    else if (opts.reference === 'last') refIdx = levels.length - 1;
    else {
      refIdx = 0;
      for (let i = 1; i < levels.length; i++) if (levels[i].count > levels[refIdx].count) refIdx = i;
    }
    const ref = levels[refIdx];
    const refLabel = categoryLabel(v, ref.value);
    const cols: Float64Array[] = [], colNames: string[] = [], levelLabels: string[] = [], levelValues: Array<number | string> = [];
    const syntaxNames: string[] = [], syntaxCompute: string[] = [];
    levels.forEach((lv, i) => {
      if (i === refIdx) return;
      const x = new Float64Array(rows.length);
      for (let r = 0; r < rows.length; r++) x[r] = values[r] === lv.value ? 1 : 0;
      const lab = categoryLabel(v, lv.value);
      cols.push(x);
      colNames.push(`${v.name}: ${lab} (ref = ${refLabel})`);
      levelLabels.push(lab);
      levelValues.push(lv.value);
      const sn = dummySyntaxName(v, lv.value, i);
      syntaxNames.push(sn);
      syntaxCompute.push(`COMPUTE ${sn} = (${v.name} = ${spssLiteral(lv.value)}).`);
    });
    return { variable: v, kind: 'factor', cols, colNames, levelLabels, levelValues, levels, refValue: ref.value, refLabel, syntaxNames, syntaxCompute };
  });
}

/** Names for a set of design columns, grouping dummies of the same factor: "educ_cat (Secondary, Vocational vs Primary)". */
export function describeCols(list: Array<{ name: string; term: Term; level: number }>): string[] {
  const out: string[] = [];
  const seen = new Map<Term, string[]>();
  for (const c of list) {
    if (c.term.kind !== 'factor') out.push(c.name);
    else {
      if (!seen.has(c.term)) {
        seen.set(c.term, []);
        out.push('');
      }
      seen.get(c.term)!.push(c.term.levelLabels[c.level]);
    }
  }
  const factorTexts = [...seen.entries()].map(([t, labs]) => `${t.variable.name} (${listText(labs)} vs ${t.refLabel})`);
  let fi = 0;
  return out.map((x) => (x === '' ? factorTexts[fi++] : x));
}

/** Listwise case selection over all variables used by an analysis, with a friendly error if none remain. */
export function selectAll(ds: Dataset, ids: string[], minCases = 3): CaseSelection {
  const sel = selectCases(ds, ids);
  if (sel.rows.length < minCases) {
    throw new Error(
      sel.rows.length === 0
        ? 'No cases are left after removing cases with missing values (and applying the filter). Check the missing-value definitions and the filter.'
        : `Only ${sel.rows.length} case(s) are left after removing cases with missing values, which is too few for this analysis.`,
    );
  }
  return sel;
}

// ---------- Charts ----------

/** Histogram of standardized values with a normal-curve overlay (weighted counts). */
export function standardizedHistogram(z: ArrayLike<number>, w: ArrayLike<number>, title: string, xLabel: string): ChartSpec {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < z.length; i++) {
    if (!Number.isFinite(z[i])) continue;
    lo = Math.min(lo, z[i]);
    hi = Math.max(hi, z[i]);
  }
  const width = 0.5;
  if (!Number.isFinite(lo)) lo = hi = 0;
  const start = Math.floor(Math.max(lo, -8) / width) * width;
  const nb = Math.max(1, Math.floor((Math.min(hi, 8) - start) / width) + 1);
  const edges = Array.from({ length: nb + 1 }, (_, i) => start + i * width);
  const counts = new Array<number>(nb).fill(0);
  let W = 0, s = 0, ss = 0;
  for (let i = 0; i < z.length; i++) {
    if (!Number.isFinite(z[i])) continue;
    const b = Math.min(nb - 1, Math.max(0, Math.floor((z[i] - start) / width)));
    counts[b] += w[i];
    W += w[i];
    s += w[i] * z[i];
  }
  const mean = s / W;
  for (let i = 0; i < z.length; i++) if (Number.isFinite(z[i])) ss += w[i] * (z[i] - mean) ** 2;
  return { type: 'histogram', title, xLabel, yLabel: 'Frequency', edges, counts, normal: { mean, sd: Math.sqrt(ss / Math.max(W - 1, 1)), n: W } };
}

/** Evenly thinned index list (keeps charts under the renderer's point budget). */
export function thin(n: number, max = 20000): number[] {
  if (n <= max) return Array.from({ length: n }, (_, i) => i);
  const step = n / max;
  return Array.from({ length: max }, (_, i) => Math.floor(i * step));
}

// ---------- Tables shared by the categorical-outcome models ----------

/**
 * SPSS "Case Processing Summary" for PLUM / NOMREG: the outcome's categories (and each factor's
 * levels) with weighted N and marginal percentage, then Valid / Missing / Total / Subpopulation.
 */
export function marginalCaseSummary(
  depVar: Variable,
  depLevels: Array<{ value: number | string; count: number }>,
  factors: Term[],
  sel: CaseSelection,
  subpopulations: number,
): import('../../core/output').OutputTable {
  const W = depLevels.reduce((s, l) => s + l.count, 0);
  const n = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? cell(Math.round(x), 'int') : cell(x, 'dec1'));
  const rows: Cell[][] = [];
  const rules: number[] = [];
  const group = (v: Variable, levels: Array<{ value: number | string; count: number }>) => {
    if (rows.length) rules.push(rows.length);
    levels.forEach((l, i) => {
      const r: Cell[] = [];
      if (i === 0) r.push(cell(v.name, 'text', { rowSpan: levels.length }));
      r.push(cell(categoryLabel(v, l.value), 'text'), n(l.count), cell((100 * l.count) / W, 'pct'));
      rows.push(r);
    });
  };
  group(depVar, depLevels);
  for (const f of factors) if (f.levels) group(f.variable, f.levels);
  rules.push(rows.length);
  rows.push([cell('Valid', 'text', { colSpan: 2 }), n(W), cell(100, 'pct')]);
  rows.push([cell('Missing', 'text', { colSpan: 2 }), cell(sel.nMissing, 'int'), cell(null)]);
  rows.push([cell('Total', 'text', { colSpan: 2 }), n(W + sel.nMissing), cell(null)]);
  rows.push([cell('Subpopulation', 'text', { colSpan: 2 }), cell(subpopulations, 'int'), cell(null)]);
  return {
    title: 'Case Processing Summary',
    header: [[hcell('', { colSpan: 2 }), hcell('N'), hcell('Marginal Percentage')]],
    rows,
    stubColumns: 2,
    ruleBefore: rules,
    footnotes: sel.nMissing && sel.weights.some((x) => x !== 1) ? ['Missing is the unweighted number of cases excluded for missing values.'] : [],
  };
}

/** Number of distinct covariate patterns among the design columns. */
export function countPatterns(cols: ArrayLike<number>[], n: number): number {
  const s = new Set<string>();
  for (let i = 0; i < n; i++) {
    let k = '';
    for (const c of cols) k += c[i] + '|';
    s.add(k);
  }
  return s.size;
}

export function patternKeyFn(cols: ArrayLike<number>[]): (i: number) => string {
  return (i) => {
    let k = '';
    for (const c of cols) k += c[i] + '|';
    return k;
  };
}
