// Helpers shared by the core statistics procedures: case selection, category handling, output
// building, plain-language wording (APA numbers, effect-size labels) and SPSS syntax fragments.

import {
  activeCaseMask,
  caseWeights,
  categoryLabel,
  isUserMissing,
  requireVariable,
  selectCases,
  varDisplayName,
  type CaseSelection,
} from '../../core/data';
import { newId, type Dataset, type Variable } from '../../core/types';
import { cell, hcell, type Cell, type CellFormat, type OutputBlock, type OutputItem, type OutputTable } from '../../core/output';
import type { OptionValues, SlotValues } from '../../core/procedure';

// ---------------------------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------------------------

export function optBool(o: OptionValues, key: string, dflt = false): boolean {
  const v = o[key];
  return typeof v === 'boolean' ? v : dflt;
}

export function optNum(o: OptionValues, key: string, dflt: number): number {
  const v = o[key];
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : dflt;
}

export function optStr(o: OptionValues, key: string, dflt: string): string {
  const v = o[key];
  return typeof v === 'string' && v !== '' ? v : dflt;
}

/** Parse "10, 90" / "10 90" into numbers; throws a readable error on bad input. */
export function parseNumberList(text: string, what: string, lo = -Infinity, hi = Infinity): number[] {
  const parts = text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((p) => {
    const n = Number(p);
    if (!Number.isFinite(n)) throw new Error(`${what}: "${p}" is not a number.`);
    if (n < lo || n > hi) throw new Error(`${what}: ${p} is outside the allowed range ${lo} to ${hi}.`);
    return n;
  });
}

// ---------------------------------------------------------------------------------------------
// Variables and values
// ---------------------------------------------------------------------------------------------

export function vars(ds: Dataset, slots: SlotValues, key: string): Variable[] {
  return (slots[key] ?? []).map((id) => requireVariable(ds, id));
}

export function one(ds: Dataset, slots: SlotValues, key: string, what: string): Variable {
  const ids = slots[key] ?? [];
  if (!ids.length) throw new Error(`Choose a ${what}.`);
  return requireVariable(ds, ids[0]);
}

/** Label for tables: variable label if present, else name. */
export function vlabel(v: Variable): string {
  return varDisplayName(v, 'label');
}

/** Short name for prose: the label if it is short, else the name. */
export function vprose(v: Variable): string {
  return v.label && v.label.length <= 60 ? v.label : v.name;
}

export function requireNumeric(v: Variable, role: string): void {
  if (v.type !== 'numeric') throw new Error(`${v.name} is a string variable; ${role} must be numeric.`);
}

/** Canonical key of a raw value (trailing spaces trimmed for strings). */
export function valueKey(x: number | string): number | string {
  return typeof x === 'string' ? x.trimEnd() : x;
}

export function sameValue(a: number | string, b: number | string): boolean {
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  return String(a).trimEnd() === String(b).trimEnd();
}

/** Parse a group value from option input (numbers for numeric variables). */
export function coerceValue(v: Variable, x: unknown): number | string | null {
  if (x === null || x === undefined || x === '') return null;
  if (v.type === 'numeric') {
    const n = typeof x === 'number' ? x : Number(String(x).trim());
    return Number.isFinite(n) ? n : null;
  }
  return String(x);
}

export function valueText(v: Variable, x: number | string): string {
  return categoryLabel(v, typeof x === 'string' ? x.trimEnd() : x);
}

/** Sorted distinct valid values of a variable among `rows`. */
export function categoriesOf(ds: Dataset, v: Variable, rows: number[]): Array<number | string> {
  const col = ds.columns[v.id];
  const set = new Set<number | string>();
  for (const i of rows) set.add(valueKey(col[i]));
  const arr = [...set];
  if (v.type === 'numeric') (arr as number[]).sort((a, b) => a - b);
  else (arr as string[]).sort((a, b) => a.localeCompare(b));
  return arr;
}

export function numericValues(ds: Dataset, v: Variable, rows: number[]): Float64Array {
  const col = ds.columns[v.id];
  if (!(col instanceof Float64Array)) throw new Error(`${v.name} is not numeric`);
  const out = new Float64Array(rows.length);
  for (let i = 0; i < rows.length; i++) out[i] = col[rows[i]];
  return out;
}

/**
 * Number format for statistics of a variable: its print decimals plus `extra` (at most 4). With the
 * default extra of 2 (means, SDs) at least 2 decimals are shown; with extra 0 (minimum, maximum,
 * mode) the variable's own decimals are used, so whole-number codes print as integers.
 */
export function decFmt(v?: Variable, extra = 2): CellFormat {
  let d = Math.min(4, (v?.decimals ?? 0) + extra);
  if (extra >= 2) d = Math.max(2, d);
  return d <= 0 ? 'int' : (`dec${d}` as CellFormat);
}

// ---------------------------------------------------------------------------------------------
// Case notes and syntax
// ---------------------------------------------------------------------------------------------

export function weightVar(ds: Dataset): Variable | undefined {
  return ds.weightVarId ? ds.variables.find((v) => v.id === ds.weightVarId) : undefined;
}

export function filterVar(ds: Dataset): Variable | undefined {
  return ds.filterVarId ? ds.variables.find((v) => v.id === ds.filterVarId) : undefined;
}

export function fmtCount(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('en-US');
  return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

/** Counts cases removed by the filter (and zero/missing weights) separately. */
export function filterCounts(ds: Dataset): { filtered: number; zeroWeight: number } {
  const mask = activeCaseMask(ds);
  const w = caseWeights(ds);
  let filtered = 0;
  let zeroWeight = 0;
  for (let i = 0; i < ds.nCases; i++) {
    if (!mask[i]) filtered++;
    else if (!(w[i] > 0)) zeroWeight++;
  }
  return { filtered, zeroWeight };
}

/** "N = 1,204 (weighted by wt); 12 excluded for missing values; 30 filtered out." */
export function caseNote(ds: Dataset, N: number, nMissing: number, extra?: string): string {
  const parts: string[] = [];
  const wv = weightVar(ds);
  parts.push(`N = ${fmtCount(N)}${wv ? ` (weighted by ${wv.name})` : ''}`);
  if (nMissing > 0) parts.push(`${fmtCount(nMissing)} case${nMissing === 1 ? '' : 's'} excluded for missing values`);
  const fc = filterCounts(ds);
  const fv = filterVar(ds);
  if (fc.filtered > 0) parts.push(`${fmtCount(fc.filtered)} filtered out${fv ? ` by ${fv.name}` : ''}`);
  if (fc.zeroWeight > 0) parts.push(`${fmtCount(fc.zeroWeight)} with zero or missing weight`);
  if (extra) parts.push(extra);
  return parts.join('; ') + '.';
}

/** Weighted N of a selection. */
export function selN(sel: CaseSelection): number {
  let s = 0;
  for (const w of sel.weights) s += w;
  return s;
}

export function syntaxPrefix(ds: Dataset): string {
  const lines: string[] = [];
  const wv = weightVar(ds);
  const fv = filterVar(ds);
  if (fv) lines.push(`FILTER BY ${fv.name}.`);
  if (wv) lines.push(`WEIGHT BY ${wv.name}.`);
  return lines.length ? lines.join('\n') + '\n' : '';
}

export function names(vs: Variable[]): string {
  return vs.map((v) => v.name).join(' ');
}

/** SPSS literal for a value in syntax. */
export function syntaxValue(x: number | string): string {
  return typeof x === 'number' ? String(x) : `'${x.replace(/'/g, "''")}'`;
}

// ---------------------------------------------------------------------------------------------
// Output building
// ---------------------------------------------------------------------------------------------

export function item(procedure: string, title: string, ds: Dataset, blocks: OutputBlock[], syntax: string, note: string): OutputItem {
  return { id: newId('out'), procedure, title, createdAt: Date.now(), datasetName: ds.name, syntax: syntaxPrefix(ds) + syntax, caseNote: note, blocks };
}

export const tableBlock = (table: OutputTable): OutputBlock => ({ kind: 'table', table });
export const text = (style: 'interpretation' | 'apa' | 'note' | 'warning', t: string): OutputBlock => ({ kind: 'text', style, text: t });
export const heading = (t: string): OutputBlock => ({ kind: 'heading', text: t });

export { cell, hcell };
export type { Cell };

/** Cell for a p-value, marked as noteworthy when below .05. */
export function pcell(p: number): Cell {
  return cell(p, 'p', Number.isFinite(p) && p < 0.05 ? { tone: 'good' } : {});
}

export const nan = (): Cell => cell(NaN);
export const blank = (): Cell => cell(null);

// ---------------------------------------------------------------------------------------------
// Plain-language and APA wording
// ---------------------------------------------------------------------------------------------

/** APA number: 2 decimals by default, leading zero dropped for bounded statistics. */
export function apaNum(x: number, decimals = 2, bounded = false): string {
  if (!Number.isFinite(x)) return 'n/a';
  let s = Math.abs(x) >= 1000 ? x.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : x.toFixed(decimals);
  if (/^-?0\.0*$/.test(s)) s = s.replace('-', '');
  if (bounded) s = s.replace(/^(-?)0\./, '$1.');
  return s;
}

/** "p = .032" or "p < .001". */
export function apaP(p: number): string {
  if (!Number.isFinite(p)) return 'p = n/a';
  if (p < 0.001) return 'p < .001';
  if (p >= 0.9995) return 'p = 1.000';
  return `p = ${p.toFixed(3).replace(/^0\./, '.')}`;
}

export function fmtDf(df: number): string {
  return Number.isInteger(df) ? String(df) : df.toFixed(2);
}

export function fmtN(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

export function pct(x: number, d = 1): string {
  return `${x.toFixed(d)}%`;
}

/** "statistically significant" wording with the alpha level. */
export function sigWord(p: number, alpha = 0.05): string {
  return p < alpha ? 'statistically significant' : 'not statistically significant';
}

/** Cohen (1988) label for |d|: .2 small, .5 medium, .8 large. */
export function labelD(d: number): string {
  const a = Math.abs(d);
  if (a < 0.2) return 'negligible';
  if (a < 0.5) return 'small';
  if (a < 0.8) return 'medium';
  return 'large';
}

/** Cohen (1988) label for |r| (and phi, rank-biserial r): .1 small, .3 medium, .5 large. */
export function labelR(r: number): string {
  const a = Math.abs(r);
  if (a < 0.1) return 'negligible';
  if (a < 0.3) return 'weak';
  if (a < 0.5) return 'moderate';
  return 'strong';
}

/** Cohen (1988) label for Cramér's V with df* = min(r, c) - 1: thresholds .1, .3, .5 divided by sqrt(df*). */
export function labelV(v: number, dfStar: number): string {
  const s = Math.sqrt(Math.max(1, dfStar));
  if (v < 0.1 / s) return 'negligible';
  if (v < 0.3 / s) return 'weak';
  if (v < 0.5 / s) return 'moderate';
  return 'strong';
}

/** Cohen (1988) label for eta squared / omega squared: .01 small, .06 medium, .14 large. */
export function labelEta2(e: number): string {
  if (e < 0.01) return 'negligible';
  if (e < 0.06) return 'small';
  if (e < 0.14) return 'medium';
  return 'large';
}

/** Kendall's W (Landis-Koch style conventions are not used; Cohen's r thresholds on W). */
export function labelW(w: number): string {
  return labelR(w);
}

export const COHEN_NOTE = 'Effect-size labels follow Cohen (1988) conventions; judge practical importance in the context of your research question.';

/** Join a list in prose: "a, b and c". */
export function listProse(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// ---------------------------------------------------------------------------------------------
// Group selection (t tests, nonparametric two-sample tests)
// ---------------------------------------------------------------------------------------------

export interface TwoGroups {
  a: { rows: number[]; weights: number[] };
  b: { rows: number[]; weights: number[] };
  labelA: string;
  labelB: string;
  defineSyntax: string;
}

/**
 * Split selected cases into two groups by `gv`: either a pair of values or a cut point (cases
 * >= cut form group 1, as SPSS).
 */
export function twoGroups(ds: Dataset, gv: Variable, sel: CaseSelection, pair: unknown, cut: number | null): TwoGroups {
  const col = ds.columns[gv.id];
  const a = { rows: [] as number[], weights: [] as number[] };
  const b = { rows: [] as number[], weights: [] as number[] };
  if (cut !== null) {
    if (gv.type !== 'numeric') throw new Error('A cut point needs a numeric grouping variable.');
    sel.rows.forEach((r, k) => {
      const x = col[r] as number;
      (x >= cut ? a : b).rows.push(r);
      (x >= cut ? a : b).weights.push(sel.weights[k]);
    });
    return { a, b, labelA: `>= ${cut}`, labelB: `< ${cut}`, defineSyntax: `(${cut})` };
  }
  const arr = Array.isArray(pair) ? pair : null;
  const va = arr ? coerceValue(gv, arr[0]) : null;
  const vb = arr ? coerceValue(gv, arr[1]) : null;
  if (va === null || vb === null) throw new Error(`Define the two groups: choose two values of ${gv.name}.`);
  if (sameValue(va, vb)) throw new Error('The two groups must be different values.');
  sel.rows.forEach((r, k) => {
    const x = col[r];
    if (sameValue(x, va)) {
      a.rows.push(r);
      a.weights.push(sel.weights[k]);
    } else if (sameValue(x, vb)) {
      b.rows.push(r);
      b.weights.push(sel.weights[k]);
    }
  });
  return { a, b, labelA: valueText(gv, va), labelB: valueText(gv, vb), defineSyntax: `(${syntaxValue(va)} ${syntaxValue(vb)})` };
}

/** Selection honouring filter/weights/missing over variables; convenience wrapper. */
export function select(ds: Dataset, vs: Variable[]): CaseSelection {
  return selectCases(ds, vs.map((v) => v.id));
}

/** True when a raw value is user-missing (not system-missing). */
export function userMissing(v: Variable, x: number | string): boolean {
  return isUserMissing(v.missing, x);
}

export function sumArr(a: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i];
  return s;
}

/** Throws a readable error when there are too few cases. */
export function needCases(N: number, min: number, what: string): void {
  if (!(N >= min)) throw new Error(`${what}: not enough valid cases (${fmtCount(N)}; at least ${min} needed).`);
}
