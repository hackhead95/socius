// Define Variable Properties (Data menu): scan the values a variable really has, spot unlabelled
// values and codes that look like missing answers, suggest a measurement level and common value
// labels, and apply all edits as one undoable change with equivalent SPSS syntax.
//
// Pure: no React, no store. The dialog lives in src/features/data/DefineProperties.tsx.

import type { Dataset, MeasureLevel, MissingSpec, ValueLabel, Variable, VarType } from '../../core/types';
import { caseWeights, isDateFormat, isUserMissing } from '../../core/data';
import { utf8ByteLength } from '../io/encoding';
import { bump, fmtN, plural, type TransformResult } from './dsops';
import { lines, missingSyntax, q, sv, valueLabelsSyntax, varList } from './syntax';

// ---------- limits ----------

/** The limits the .sav writer (src/lib/io/sav-writer.ts) enforces when saving. */
export const SPSS_LIMITS = {
  valueLabelBytes: 120,
  variableLabelBytes: 256,
  /** Discrete missing values without a range. */
  discreteMissing: 3,
  /** Discrete missing values allowed next to a range. */
  discreteWithRange: 1,
  /** String missing values are at most 8 bytes. */
  stringMissingBytes: 8,
} as const;

export const DEFAULT_MAX_VALUES = 200;
/** Unique whole-number values at which a variable is suggested as Scale (SPSS uses 24 too). */
export const SCALE_MIN_UNIQUE = 24;

// ---------- values ----------

/** Stable key for a value (numbers and strings never collide; strings ignore trailing spaces). */
export function valueKey(v: number | string): string {
  return typeof v === 'number' ? `n:${v}` : `s:${v.trimEnd()}`;
}

function sameValue(a: number | string, b: number | string): boolean {
  return valueKey(a) === valueKey(b);
}

export function sortValues<T extends number | string>(vals: T[]): T[] {
  return vals.slice().sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))));
}

/** How a value is shown: numbers plainly, empty text as "(empty)". */
export function displayValue(v: number | string): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(12)));
  return v === '' ? '(empty)' : v;
}

/** Parse what the user typed as a value of this type (null when it is not a valid number). */
export function parseValue(type: VarType, text: string): number | string | null {
  if (type === 'string') return text.trimEnd();
  const t = text.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// ---------- scanning ----------

export interface ValueCount {
  value: number | string;
  count: number;
  /** Weighted count (equals count when no weight is on). */
  weighted: number;
}

export interface VarScan {
  varId: string;
  /** Cases looked at (all, or the first N when limited). */
  casesScanned: number;
  /** System-missing (empty numeric) cells. */
  sysmis: number;
  sysmisWeighted: number;
  /** Every distinct observed value (not system-missing), sorted. */
  values: ValueCount[];
  weighted: boolean;
}

export interface ScanOptions {
  /** Scan only the first N cases (null or undefined: all cases). */
  maxCases?: number | null;
}

/**
 * Count every distinct value of a variable. All cases are scanned (a filter does not hide values from
 * the dictionary); counts are weighted too when a weight is on.
 */
export function scanVariable(ds: Dataset, v: Variable, opts: ScanOptions = {}, weights?: Float64Array): VarScan {
  const col = ds.columns[v.id];
  const n = opts.maxCases && opts.maxCases > 0 ? Math.min(ds.nCases, Math.floor(opts.maxCases)) : ds.nCases;
  const weighted = !!ds.weightVarId;
  const w = weighted ? (weights ?? caseWeights(ds)) : null;
  const map = new Map<number | string, ValueCount>();
  let sysmis = 0;
  let sysmisW = 0;
  for (let i = 0; i < n; i++) {
    const raw = col[i];
    const wi = w ? w[i] : 1;
    if (typeof raw === 'number' && Number.isNaN(raw)) {
      sysmis++;
      sysmisW += wi;
      continue;
    }
    const x = typeof raw === 'string' ? raw.trimEnd() : raw;
    let e = map.get(x);
    if (!e) {
      e = { value: x, count: 0, weighted: 0 };
      map.set(x, e);
    }
    e.count++;
    e.weighted += wi;
  }
  const values = [...map.values()];
  values.sort((a, b) => (typeof a.value === 'number' && typeof b.value === 'number' ? a.value - b.value : String(a.value).localeCompare(String(b.value))));
  return { varId: v.id, casesScanned: n, sysmis, sysmisWeighted: sysmisW, values, weighted };
}

export function scanVariables(ds: Dataset, ids: string[], opts: ScanOptions = {}): VarScan[] {
  const w = ds.weightVarId ? caseWeights(ds) : undefined;
  const out: VarScan[] = [];
  for (const id of ids) {
    const v = ds.variables.find((x) => x.id === id);
    if (v) out.push(scanVariable(ds, v, opts, w));
  }
  return out;
}

// ---------- drafts (the edits made in the dialog) ----------

export interface PropsDraft {
  label: string;
  measure: MeasureLevel;
  valueLabels: ValueLabel[];
  missing: MissingSpec;
  width: number;
  decimals: number;
}

export function draftFromVariable(v: Variable): PropsDraft {
  return {
    label: v.label,
    measure: v.measure,
    valueLabels: v.valueLabels.map((l) => ({ ...l })),
    missing: { discrete: v.missing.discrete.slice(), ...(v.missing.range ? { range: { ...v.missing.range } } : {}) },
    width: v.width,
    decimals: v.decimals,
  };
}

function labelsEqual(a: ValueLabel[], b: ValueLabel[]): boolean {
  if (a.length !== b.length) return false;
  const m = new Map(a.map((l) => [valueKey(l.value), l.label]));
  return b.every((l) => m.get(valueKey(l.value)) === l.label);
}

function missingEqual(a: MissingSpec, b: MissingSpec): boolean {
  const ka = a.discrete.map(valueKey).sort().join('|');
  const kb = b.discrete.map(valueKey).sort().join('|');
  if (ka !== kb) return false;
  if (!a.range !== !b.range) return false;
  return !a.range || (a.range.lo === b.range!.lo && a.range.hi === b.range!.hi);
}

export interface DraftChanges {
  label: boolean;
  valueLabels: boolean;
  missing: boolean;
  measure: boolean;
  format: boolean;
}

export function draftChanges(v: Variable, d: PropsDraft): DraftChanges {
  return {
    label: d.label !== v.label,
    valueLabels: !labelsEqual(v.valueLabels, d.valueLabels),
    missing: !missingEqual(v.missing, d.missing),
    measure: d.measure !== v.measure,
    format: v.type === 'numeric' && (d.width !== v.width || d.decimals !== v.decimals),
  };
}

export function isDraftChanged(v: Variable, d: PropsDraft): boolean {
  const c = draftChanges(v, d);
  return c.label || c.valueLabels || c.missing || c.measure || c.format;
}

export function labelFor(d: Pick<PropsDraft, 'valueLabels'>, value: number | string): string | undefined {
  return d.valueLabels.find((l) => sameValue(l.value, value))?.label;
}

/** Set (or, with empty text, remove) the label of one value. Labels stay sorted by value. */
export function setValueLabel(d: PropsDraft, value: number | string, text: string): PropsDraft {
  const rest = d.valueLabels.filter((l) => !sameValue(l.value, value));
  const valueLabels = text.trim() === '' ? rest : [...rest, { value, label: text }];
  return { ...d, valueLabels: sortLabels(valueLabels) };
}

function sortLabels(labels: ValueLabel[]): ValueLabel[] {
  return labels.slice().sort((a, b) => (typeof a.value === 'number' && typeof b.value === 'number' ? a.value - b.value : String(a.value).localeCompare(String(b.value))));
}

export function isMissingIn(spec: MissingSpec, value: number | string): boolean {
  return isUserMissing(spec, value);
}

/** Why one more discrete missing value cannot be added, or null when it can. */
export function missingLimitProblem(type: VarType, spec: MissingSpec, value: number | string): string | null {
  if (type === 'string' && typeof value === 'string' && utf8ByteLength(value) > SPSS_LIMITS.stringMissingBytes) {
    return `SPSS only allows text missing values of up to ${SPSS_LIMITS.stringMissingBytes} characters, so '${value}' cannot be a missing value. Recode it first (Transform > Recode into same variables...).`;
  }
  if (spec.range) {
    if (spec.discrete.length >= SPSS_LIMITS.discreteWithRange) {
      return `This variable already has a missing range (${rangeText(spec.range)}) plus one single missing value, which is the most SPSS allows. Untick a value or remove the range first.`;
    }
  } else if (spec.discrete.length >= SPSS_LIMITS.discreteMissing) {
    return `SPSS allows at most ${SPSS_LIMITS.discreteMissing} single missing values per variable (here: ${spec.discrete.map(displayValue).join(', ')}). Untick one first.`;
  }
  return null;
}

export interface MissingToggle {
  draft: PropsDraft;
  /** Set when the change was not made; explains why in plain English. */
  problem?: string;
}

/** Mark or unmark one value as user-missing, respecting the SPSS limits. */
export function toggleMissing(d: PropsDraft, type: VarType, value: number | string, on: boolean): MissingToggle {
  const spec = d.missing;
  const inDiscrete = spec.discrete.some((x) => sameValue(x, value));
  if (on) {
    if (isUserMissing(spec, value)) return { draft: d };
    const problem = missingLimitProblem(type, spec, value);
    if (problem) return { draft: d, problem };
    return { draft: { ...d, missing: normaliseMissing({ ...spec, discrete: [...spec.discrete, value] }) } };
  }
  if (inDiscrete) {
    const next = normaliseMissing({ ...spec, discrete: spec.discrete.filter((x) => !sameValue(x, value)) });
    if (isUserMissing(next, value)) return { draft: { ...d, missing: next }, problem: `${displayValue(value)} is also inside the missing range ${rangeText(spec.range!)}. Remove the range to unmark it.` };
    return { draft: { ...d, missing: next } };
  }
  if (spec.range && typeof value === 'number' && value >= spec.range.lo && value <= spec.range.hi) {
    return { draft: d, problem: `${displayValue(value)} is inside the missing range ${rangeText(spec.range)}. Remove the range to unmark it.` };
  }
  return { draft: d };
}

/** Remove the missing range (keeping single missing values). */
export function removeMissingRange(d: PropsDraft): PropsDraft {
  return { ...d, missing: { discrete: d.missing.discrete.slice() } };
}

function normaliseMissing(spec: MissingSpec): MissingSpec {
  const discrete = sortValues(spec.discrete);
  return spec.range ? { discrete, range: { ...spec.range } } : { discrete };
}

export function rangeText(r: { lo: number; hi: number }): string {
  return `${r.lo === -Infinity ? 'LO' : r.lo} THRU ${r.hi === Infinity ? 'HI' : r.hi}`;
}

export function describeMissingSpec(spec: MissingSpec): string {
  const parts: string[] = [];
  if (spec.range) parts.push(`${rangeText(spec.range)}`);
  for (const x of spec.discrete) parts.push(typeof x === 'string' ? `'${x}'` : String(x));
  return parts.length ? parts.join(', ') : 'None';
}

export type CopyableProp = 'valueLabels' | 'missing' | 'measure' | 'label';

export const COPYABLE_PROPS: Array<{ id: CopyableProp; label: string; defaultOn: boolean }> = [
  { id: 'valueLabels', label: 'Value labels', defaultOn: true },
  { id: 'missing', label: 'Missing values', defaultOn: true },
  { id: 'measure', label: 'Measurement level', defaultOn: true },
  { id: 'label', label: 'Variable label', defaultOn: false },
];

/** Copy chosen properties from one draft to another (both variables must have the same type). */
export function copyDraftProps(from: PropsDraft, to: PropsDraft, props: CopyableProp[]): PropsDraft {
  const next: PropsDraft = { ...to };
  if (props.includes('valueLabels')) next.valueLabels = from.valueLabels.map((l) => ({ ...l }));
  if (props.includes('missing')) next.missing = { discrete: from.missing.discrete.slice(), ...(from.missing.range ? { range: { ...from.missing.range } } : {}) };
  if (props.includes('measure')) next.measure = from.measure;
  if (props.includes('label')) next.label = from.label;
  return next;
}

/**
 * Other items of the same battery: variables named like this one with a different number
 * (trust1 -> trust2 ... trust5; q12a -> q12b is not matched) and the same type.
 */
export function batterySiblings(ds: Dataset, v: Variable): Variable[] {
  const m = /^(.*?[A-Za-z_.])(\d+)$/.exec(v.name);
  if (!m) return [];
  const stem = m[1].toLowerCase();
  const re = /^(.*?[A-Za-z_.])(\d+)$/;
  return ds.variables.filter((x) => {
    if (x.id === v.id || x.type !== v.type) return false;
    const mm = re.exec(x.name);
    return !!mm && mm[1].toLowerCase() === stem;
  });
}

// ---------- validation against the SPSS limits ----------

export interface DraftIssue {
  where: 'label' | 'valueLabel' | 'missing' | 'format';
  value?: number | string;
  message: string;
}

export function draftIssues(v: Pick<Variable, 'type' | 'format'>, d: PropsDraft): DraftIssue[] {
  const out: DraftIssue[] = [];
  const lb = utf8ByteLength(d.label);
  if (lb > SPSS_LIMITS.variableLabelBytes) out.push({ where: 'label', message: `The variable label is too long for SPSS: ${lb} bytes, and SPSS keeps ${SPSS_LIMITS.variableLabelBytes} (about ${SPSS_LIMITS.variableLabelBytes} English letters). Shorten it.` });
  for (const l of d.valueLabels) {
    const b = utf8ByteLength(l.label);
    if (b > SPSS_LIMITS.valueLabelBytes) out.push({ where: 'valueLabel', value: l.value, message: `The label for ${displayValue(l.value)} is too long for SPSS: ${b} bytes, and SPSS keeps ${SPSS_LIMITS.valueLabelBytes} (about ${SPSS_LIMITS.valueLabelBytes} English letters). Shorten it.` });
  }
  const m = d.missing;
  if (v.type === 'string') {
    if (m.range) out.push({ where: 'missing', message: 'Text variables cannot have a missing range in SPSS. Remove the range.' });
    if (m.discrete.length > SPSS_LIMITS.discreteMissing) out.push({ where: 'missing', message: `SPSS allows at most ${SPSS_LIMITS.discreteMissing} missing values per variable; this one has ${m.discrete.length}. Untick some.` });
    for (const x of m.discrete) if (utf8ByteLength(String(x)) > SPSS_LIMITS.stringMissingBytes) out.push({ where: 'missing', value: x, message: `Text missing values can be at most ${SPSS_LIMITS.stringMissingBytes} characters ('${x}' is longer).` });
  } else if (m.range ? m.discrete.length > SPSS_LIMITS.discreteWithRange : m.discrete.length > SPSS_LIMITS.discreteMissing) {
    out.push({
      where: 'missing',
      message: m.range
        ? `SPSS allows a missing range plus at most one single value; this variable has the range ${rangeText(m.range)} and ${m.discrete.length} single values. Untick some.`
        : `SPSS allows at most ${SPSS_LIMITS.discreteMissing} single missing values per variable; this one has ${m.discrete.length}. Untick some, or use Variable View > Missing to set a range.`,
    });
  }
  if (v.type === 'numeric') {
    const date = isDateFormat(v.format);
    if (!Number.isInteger(d.width) || d.width < 1 || d.width > 40) out.push({ where: 'format', message: 'Width must be a whole number from 1 to 40.' });
    else if (!date && (!Number.isInteger(d.decimals) || d.decimals < 0 || d.decimals > 16 || d.decimals >= d.width)) out.push({ where: 'format', message: 'Decimals must be a whole number from 0 to 16 and smaller than the width.' });
  }
  return out;
}

/** The SPSS format for a width/decimals change, keeping the family (F, COMMA, DOLLAR, DATE...). */
export function formatFor(v: Pick<Variable, 'type' | 'format'>, width: number, decimals: number): string {
  if (v.type === 'string') return `A${width}`;
  const fam = (/^([A-Z]+)/i.exec(v.format)?.[1] ?? 'F').toUpperCase();
  if (isDateFormat(fam)) return `${fam}${width}`;
  return `${fam}${width}.${decimals}`;
}

// ---------- missing-code heuristics ----------

const MISSING_WORDS =
  /\b(don'?t know|do not know|dk|refus\w*|not applicable|inapplicable|n\/a|no answer|not answered|missing|prefer not|rather not|can'?t (say|choose)|cannot (say|choose)|not asked|skipped|unknown|not stated|no response|non-?response|declined)\b/i;

/** True when a value label reads like a missing answer ("Don't know", "Refused", "Not applicable"...). */
export function labelLooksMissing(label: string): boolean {
  return MISSING_WORDS.test(label.replace(/[’‘`]/g, "'"));
}

const STRING_MISSING = new Set(['na', 'n/a', 'n.a.', 'n.a', '#n/a', 'nan', 'null', 'nil', 'dk', 'dont know', "don't know", 'refused', 'ref', 'missing', 'not applicable', 'no answer', 'unknown', 'prefer not to say', '-', '--', '.', '?', '99', '999', '9999', '-9', '-99', '-1', '98', '998']);

/** A code made of nines (9, 99, 999...) or nines ending in 8 or 7 (98, 997...). One digit: 8 or 9. */
export function isNinesCode(x: number): boolean {
  if (!Number.isInteger(x) || x < 8) return false;
  const s = String(x);
  if (s.length === 1) return s === '8' || s === '9';
  return /^9+[789]$/.test(s);
}

/** Negative codes used for "not asked" or "refused": -1 to -9, and -77, -88, -99, -999, -98... */
export function isNegativeCode(x: number): boolean {
  if (!Number.isInteger(x) || x >= 0) return false;
  const a = -x;
  return a <= 9 || /^([789])\1+$/.test(String(a)) || isNinesCode(a);
}

function rangeOf(nums: number[]): string {
  if (!nums.length) return '';
  const lo = Math.min(...nums), hi = Math.max(...nums);
  return lo === hi ? String(lo) : `${lo} to ${hi}`;
}

/**
 * Values that look like codes for a missing answer, with the reason (keyed by valueKey). Looks at
 * the observed values and the value labels.
 */
export function missingCodeHints(type: VarType, observed: Array<number | string>, labels: ValueLabel[]): Map<string, string> {
  const hints = new Map<string, string>();
  if (type === 'numeric') {
    const nums = observed.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
    const nines = nums.filter(isNinesCode);
    const negs = nums.filter(isNegativeCode);
    const cand = new Set([...nines, ...negs]);
    const rest = nums.filter((x) => !cand.has(x));
    if (rest.length) {
      const maxRest = Math.max(...rest);
      const above = nines.filter((c) => c > maxRest).sort((a, b) => a - b);
      if (above.length && above[0] - maxRest >= 2) {
        for (const c of above) hints.set(valueKey(c), `${c} sits well above the other values (${rangeOf(rest)}), like a code for Don't know or Refused.`);
      }
      const minRest = Math.min(...rest);
      if (negs.length && minRest >= 0) {
        const mirrored = negs.every((c) => rest.includes(-c)) && (rest.includes(0) || negs.length >= 2);
        if (!mirrored) for (const c of negs) hints.set(valueKey(c), `Negative codes like ${c} usually mean the question was not asked or not answered (the other values are ${rangeOf(rest)}).`);
      }
    }
  } else {
    for (const x of observed) {
      if (typeof x !== 'string') continue;
      const t = x.trim().toLowerCase().replace(/[’‘`]/g, "'");
      if (STRING_MISSING.has(t)) hints.set(valueKey(x), `'${x.trim()}' is a common way to write a missing answer.`);
    }
  }
  for (const l of labels) {
    if (labelLooksMissing(l.label) && !hints.has(valueKey(l.value))) hints.set(valueKey(l.value), `Its label "${l.label}" describes a missing answer.`);
  }
  return hints;
}

// ---------- the grid ----------

export type FlagKind = 'unlabelled' | 'missing-code' | 'outside-range';

export interface RowFlag {
  kind: FlagKind;
  /** Short text shown in the grid. */
  text: string;
  /** Longer explanation (tooltip). */
  reason: string;
  tone: 'warn' | 'good' | 'info';
}

export interface GridRow {
  value: number | string;
  key: string;
  count: number;
  weighted: number;
  /** False for values that only have a label or a missing declaration. */
  observed: boolean;
  label: string;
  missing: boolean;
  flags: RowFlag[];
}

export interface GridRows {
  rows: GridRow[];
  /** All distinct values (observed or labelled). */
  total: number;
  /** Rows not shown because of the display limit. */
  hidden: number;
}

/** Labelled codes that are real answers (not missing, not missing-looking), used for the labelled range. */
function substantiveLabelled(type: VarType, d: PropsDraft, hints: Map<string, string>): number[] {
  if (type !== 'numeric') return [];
  return d.valueLabels
    .map((l) => l.value)
    .filter((x): x is number => typeof x === 'number' && !isUserMissing(d.missing, x) && !hints.has(valueKey(x)));
}

function flagsFor(type: VarType, d: PropsDraft, value: number | string, observed: boolean, hints: Map<string, string>, labelled: number[]): RowFlag[] {
  const flags: RowFlag[] = [];
  const label = labelFor(d, value);
  const missing = isUserMissing(d.missing, value);
  const hint = hints.get(valueKey(value));
  if (hint) {
    flags.push(
      missing
        ? { kind: 'missing-code', text: 'missing code', reason: `${hint} It is marked as missing, so analyses leave it out.`, tone: 'good' }
        : { kind: 'missing-code', text: 'looks like a missing code', reason: `${hint} Tick Missing if it means no real answer.`, tone: 'warn' },
    );
  }
  if (observed && label === undefined && d.measure !== 'scale') {
    flags.push({ kind: 'unlabelled', text: 'unlabelled', reason: 'This value appears in the data but has no label. Type one so tables show words instead of codes.', tone: 'warn' });
  }
  if (observed && typeof value === 'number' && label === undefined && !missing && !hint && labelled.length >= 2) {
    const lo = Math.min(...labelled), hi = Math.max(...labelled);
    if (value < lo || value > hi) flags.push({ kind: 'outside-range', text: 'outside labelled range', reason: `The labelled answers run from ${lo} to ${hi}. ${value} may be a typing error or an undeclared code.`, tone: 'warn' });
  }
  return flags;
}

/**
 * Rows for the value grid: every observed value plus labelled or missing values that do not occur.
 * When there are more than `maxValues`, labelled, missing and flagged values are always kept and
 * the most frequent of the rest fill the remaining places.
 */
export function buildRows(type: VarType, scan: VarScan, d: PropsDraft, maxValues: number | null = DEFAULT_MAX_VALUES): GridRows {
  const hints = missingCodeHints(type, scan.values.map((x) => x.value), d.valueLabels);
  const labelled = substantiveLabelled(type, d, hints);
  const byKey = new Map<string, GridRow>();
  const add = (value: number | string, count: number, weighted: number, observed: boolean) => {
    const key = valueKey(value);
    if (byKey.has(key)) return;
    byKey.set(key, { value, key, count, weighted, observed, label: labelFor(d, value) ?? '', missing: isUserMissing(d.missing, value), flags: flagsFor(type, d, value, observed, hints, labelled) });
  };
  for (const c of scan.values) add(c.value, c.count, c.weighted, true);
  for (const l of d.valueLabels) add(l.value, 0, 0, false);
  for (const x of d.missing.discrete) add(x, 0, 0, false);
  let rows = [...byKey.values()];
  const total = rows.length;
  let hidden = 0;
  if (maxValues && maxValues > 0 && rows.length > maxValues) {
    const must = rows.filter((r) => r.label || r.missing || r.flags.some((f) => f.kind !== 'unlabelled') || !r.observed);
    const mustKeys = new Set(must.map((r) => r.key));
    const others = rows.filter((r) => !mustKeys.has(r.key)).sort((a, b) => b.count - a.count);
    const room = Math.max(0, maxValues - must.length);
    rows = [...must, ...others.slice(0, room)];
    hidden = total - rows.length;
  }
  rows.sort((a, b) => (typeof a.value === 'number' && typeof b.value === 'number' ? a.value - b.value : String(a.value).localeCompare(String(b.value))));
  return { rows, total, hidden };
}

// ---------- status and summary ----------

export type VarStatus = 'complete' | 'unlabelled' | 'suspect' | 'empty';

export interface StatusInfo {
  status: VarStatus;
  text: string;
  nUnlabelled: number;
  nSuspect: number;
}

export function statusOf(type: VarType, scan: VarScan, d: PropsDraft): StatusInfo {
  if (!scan.values.length) return { status: 'empty', text: 'No values in the data', nUnlabelled: 0, nSuspect: 0 };
  const { rows } = buildRows(type, scan, d, null);
  const nSuspect = rows.filter((r) => r.observed && r.flags.some((f) => f.kind === 'missing-code' && f.tone === 'warn')).length;
  const nUnlabelled = rows.filter((r) => r.flags.some((f) => f.kind === 'unlabelled')).length;
  if (nSuspect) return { status: 'suspect', text: nSuspect === 1 ? 'Suspected missing code' : `${nSuspect} suspected missing codes`, nUnlabelled, nSuspect };
  if (nUnlabelled) return { status: 'unlabelled', text: nUnlabelled === rows.filter((r) => r.observed).length ? 'No value labels yet' : `${nUnlabelled} value${nUnlabelled === 1 ? '' : 's'} unlabelled`, nUnlabelled, nSuspect };
  return { status: 'complete', text: d.measure === 'scale' ? 'Scale: labels optional' : 'Labels complete', nUnlabelled, nSuspect };
}

export interface ScanSummary {
  valid: number;
  validWeighted: number;
  userMissing: number;
  userMissingWeighted: number;
  sysmis: number;
  sysmisWeighted: number;
  unique: number;
}

export function summarise(scan: VarScan, d: PropsDraft): ScanSummary {
  let valid = 0, validW = 0, um = 0, umW = 0;
  for (const c of scan.values) {
    if (isUserMissing(d.missing, c.value)) {
      um += c.count;
      umW += c.weighted;
    } else {
      valid += c.count;
      validW += c.weighted;
    }
  }
  return { valid, validWeighted: validW, userMissing: um, userMissingWeighted: umW, sysmis: scan.sysmis, sysmisWeighted: scan.sysmisWeighted, unique: scan.values.length };
}

// ---------- measurement level ----------

/** Ordered answer scales. Each entry: pattern and rank; the first matching pattern wins. */
const ORDERED_FAMILIES: Array<{ name: string; ranks: Array<[RegExp, number]> }> = [
  {
    name: 'agreement',
    ranks: [
      [/\b(neither|neutral|undecided|not sure|mixed)/i, 2],
      [/\b(strongly|completely|totally) disagree/i, 0],
      [/\b(somewhat|tend to|mostly|slightly|partly) disagree/i, 1.5],
      [/\bdisagree/i, 1],
      [/\b(strongly|completely|totally) agree/i, 4],
      [/\b(somewhat|tend to|mostly|slightly|partly) agree/i, 2.5],
      [/\bagree/i, 3],
    ],
  },
  {
    name: 'satisfaction',
    ranks: [
      [/\bneither/i, 2],
      [/\b(very|extremely|completely) dissatisfied/i, 0],
      [/\b(somewhat|fairly|rather) dissatisfied/i, 1.5],
      [/\b(dissatisfied|unsatisfied)/i, 1],
      [/\b(very|extremely|completely) satisfied/i, 4],
      [/\b(somewhat|fairly|rather) satisfied/i, 2.5],
      [/\bsatisfied/i, 3],
    ],
  },
  {
    name: 'frequency',
    ranks: [
      [/\bnever\b/i, 0],
      [/\b(rarely|seldom|hardly ever|almost never)\b/i, 1],
      [/\b(sometimes|occasionally|now and then)\b/i, 2],
      [/\b(very often|almost always|most of the time)\b/i, 3.5],
      [/\b(often|usually|frequently|regularly)\b/i, 3],
      [/\balways\b/i, 4],
    ],
  },
  {
    name: 'quality',
    ranks: [
      [/\bvery (poor|bad)\b/i, 0],
      [/\b(poor|bad)\b/i, 1],
      [/\b(fair|average|ok|okay|adequate)\b/i, 2],
      [/\b(excellent|very good)\b/i, 4],
      [/\bgood\b/i, 3],
    ],
  },
  {
    name: 'likelihood',
    ranks: [
      [/\b(very|extremely) unlikely\b/i, 0],
      [/\bunlikely\b/i, 1],
      [/\b(very|extremely) likely\b/i, 3],
      [/\blikely\b/i, 2],
    ],
  },
  {
    name: 'intensity',
    ranks: [
      [/\bnot at all\b/i, 0],
      [/\b(not very|a little|slightly|hardly|not much|not too)\b/i, 1],
      [/\b(somewhat|moderately|fairly|quite|rather|to some extent)\b/i, 2],
      [/\b(extremely|completely|a great deal|a lot)\b/i, 4],
      [/\bvery\b/i, 3],
    ],
  },
  {
    name: 'amount',
    ranks: [
      [/\b(none|nothing)\b/i, 0],
      [/\b(very low|lowest)\b/i, 0.5],
      [/\blow\b/i, 1],
      [/\b(medium|middle|moderate)\b/i, 2],
      [/\b(very high|highest)\b/i, 4],
      [/\bhigh\b/i, 3],
    ],
  },
  {
    name: 'education',
    ranks: [
      [/\b(no (formal )?(schooling|education)|none|illiterate)\b/i, 0],
      [/\b(primary|elementary)\b/i, 1],
      [/\bhigher secondary\b/i, 2.5],
      [/\b(secondary|high school|middle school)\b/i, 2],
      [/\b(post ?graduate|master|masters|phd|doctor)/i, 5],
      [/\b(graduate|bachelor|degree|college|university)/i, 4],
    ],
  },
];

/** Do these labels (in value order) follow an ordered answer scale? Returns its name, or null. */
export function orderedScaleOf(labelsInValueOrder: string[]): string | null {
  if (labelsInValueOrder.length < 3) return null;
  for (const fam of ORDERED_FAMILIES) {
    const ranks: number[] = [];
    for (const l of labelsInValueOrder) {
      const hit = fam.ranks.find(([re]) => re.test(l));
      if (!hit) break;
      ranks.push(hit[1]);
    }
    if (ranks.length !== labelsInValueOrder.length) continue;
    const up = ranks.every((r, i) => i === 0 || r > ranks[i - 1]);
    const down = ranks.every((r, i) => i === 0 || r < ranks[i - 1]);
    if (up || down) return fam.name;
  }
  return null;
}

export interface MeasureSuggestion {
  level: MeasureLevel;
  reason: string;
}

/** Names and labels of counts and amounts (analysed as Scale even with few values). */
const COUNT_WORDS = /\b(number of|how many|how much|count|age|hours|minutes|income|salary|wage|size|amount|weight|height|distance|price|cost|spend|spent)\b/i;

const LEVEL_NAME: Record<MeasureLevel, string> = { nominal: 'Nominal', ordinal: 'Ordinal', scale: 'Scale' };

export function measureName(m: MeasureLevel): string {
  return LEVEL_NAME[m];
}

function ellipsis(labels: string[]): string {
  const cut = (t: string) => (t.length > 40 ? `${t.slice(0, 38).trimEnd()}...` : t);
  if (labels.length <= 3) return labels.map(cut).join(', ');
  return `${cut(labels[0])} ... ${cut(labels[labels.length - 1])}`;
}

/** Suggest a measurement level from the values and labels, with a plain-English reason. */
export function suggestMeasure(type: VarType, scan: VarScan, d: PropsDraft, about?: Partial<Pick<Variable, 'name' | 'label' | 'format'>>): MeasureSuggestion {
  if (type === 'string') return { level: 'nominal', reason: 'Nominal suggested: text answers are categories without a numeric order.' };
  if (about?.format && isDateFormat(about.format)) return { level: 'scale', reason: 'Scale suggested: dates and times are measured on a continuous scale.' };
  const hints = missingCodeHints(type, scan.values.map((x) => x.value), d.valueLabels);
  const valid = scan.values
    .map((c) => c.value)
    .filter((x): x is number => typeof x === 'number' && !isUserMissing(d.missing, x) && !hints.has(valueKey(x)));
  const labels = d.valueLabels.filter((l) => typeof l.value === 'number' && !isUserMissing(d.missing, l.value) && !hints.has(valueKey(l.value)));
  const labelTexts = sortLabels(labels).map((l) => l.label);
  if (!valid.length && !labels.length) return { level: d.measure, reason: 'No valid values to judge from, so the current level is kept.' };
  if (valid.some((x) => !Number.isInteger(x))) return { level: 'scale', reason: 'Scale suggested: values have decimals, so they are measurements you can average.' };
  const k = valid.length;
  const ordered = orderedScaleOf(labelTexts);
  if (ordered && labels.length >= 3) {
    return { level: 'ordinal', reason: `Ordinal suggested: ${labels.length} ordered codes with labels like ${ellipsis(labelTexts)}.` };
  }
  if (k >= SCALE_MIN_UNIQUE && labels.length < 3) return { level: 'scale', reason: `Scale suggested: ${fmtN(k)} different values (${rangeOf(valid)}), so it is a count or measurement you can average.` };
  if (k <= 2 && labels.length <= 2) {
    const shown = labelTexts.length ? ` (${labelTexts.join(' / ')})` : valid.length ? ` (${valid.join(' and ')})` : '';
    return { level: 'nominal', reason: `Nominal suggested: only two categories${shown}, like yes/no or two groups.` };
  }
  if (labels.length >= 3) return { level: 'nominal', reason: `Nominal suggested: the labels name categories (${ellipsis(labelTexts)}) with no order Socius recognises. Choose Ordinal if they are ordered.` };
  const sorted = [...valid].sort((a, b) => a - b);
  const words = `${about?.name ?? ''} ${about?.label ?? ''}`;
  if (COUNT_WORDS.test(words.replace(/_/g, ' '))) return { level: 'scale', reason: `Scale suggested: the name or label says it is a count or amount (${rangeOf(sorted)}), which you can average.` };
  const consecutive = sorted.length >= 3 && sorted[sorted.length - 1] - sorted[0] + 1 <= sorted.length + 1;
  if (consecutive && k >= 10) {
    return { level: 'scale', reason: `Scale suggested: ${k} points from ${sorted[0]} to ${sorted[sorted.length - 1]}; long rating scales like 0 to 10 are usually analysed as scale. Ordinal is also defensible.` };
  }
  if (consecutive) {
    const ends = labels.length ? ` with end labels ${labelTexts.join(' / ')}` : '';
    return { level: 'ordinal', reason: `Ordinal suggested: ${k} whole-number codes from ${sorted[0]} to ${sorted[sorted.length - 1]}${ends}, like a rating scale. Choose Nominal if the codes are only names.` };
  }
  return { level: 'nominal', reason: `Nominal suggested: ${k} codes with gaps between them (${sorted.slice(0, 4).join(', ')}${k > 4 ? ', ...' : ''}), like category numbers.` };
}

// ---------- label suggestions ----------

export interface LabelSuggestion {
  id: string;
  title: string;
  /** Plain-English note shown in the preview. */
  note: string;
  labels: ValueLabel[];
  /** Values the suggestion also marks as missing. */
  missing: Array<number | string>;
}

const AGREE5 = ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree'];
const AGREE7 = ['Strongly disagree', 'Disagree', 'Somewhat disagree', 'Neither agree nor disagree', 'Somewhat agree', 'Agree', 'Strongly agree'];

function numbered(texts: string[], start = 1): ValueLabel[] {
  return texts.map((label, i) => ({ value: start + i, label }));
}

function missingLabelFor(x: number | string): string {
  if (typeof x === 'string') {
    const t = x.trim().toLowerCase();
    if (t === 'dk' || t.includes('know')) return "Don't know";
    if (t.startsWith('ref')) return 'Refused';
    if (t.includes('applicable')) return 'Not applicable';
    return 'No answer';
  }
  if (x < 0) return x === -1 ? 'Not applicable' : x === -8 || x === -88 || x === -98 ? "Don't know" : x === -7 || x === -77 || x === -97 ? 'Refused' : 'No answer';
  const last = String(x).slice(-1);
  return last === '8' ? "Don't know" : last === '7' ? 'Refused' : 'No answer';
}

/**
 * Common label sets that fit the values of this variable: agreement scales (1 to 5, 1 to 7), yes/no
 * (0/1 or 1/2), sex or gender (1/2) and labels for suspected missing codes. Offered as a preview;
 * nothing changes until the user accepts one.
 */
export function suggestLabels(v: Pick<Variable, 'name' | 'label' | 'type'>, scan: VarScan, d: PropsDraft): LabelSuggestion[] {
  const out: LabelSuggestion[] = [];
  const hints = missingCodeHints(v.type, scan.values.map((x) => x.value), d.valueLabels);
  const missingCodes = scan.values.map((c) => c.value).filter((x) => hints.has(valueKey(x)) || isUserMissing(d.missing, x));
  const valsAll = scan.values.map((c) => c.value).filter((x) => !hints.has(valueKey(x)) && !isUserMissing(d.missing, x));
  // Answer-scale patterns only when some real answer still has no label (never over complete labels).
  if (v.type === 'numeric' && valsAll.some((x) => labelFor(d, x) === undefined)) {
    const vals = new Set(valsAll as number[]);
    const within = (allowed: number[]) => vals.size > 0 && [...vals].every((x) => allowed.includes(x));
    const max = vals.size ? Math.max(...vals) : 0;
    const sexLike = /(^|[^a-z])(sex|gender)([^a-z]|$)/i.test(`${v.name} ${v.label}`) || /^(sex|gender)/i.test(v.name);
    if (sexLike && within([1, 2, 3])) {
      const gender = /gender/i.test(`${v.name} ${v.label}`);
      const texts = gender ? ['Man', 'Woman', 'Another gender'] : ['Male', 'Female', 'Other'];
      out.push({
        id: 'sex12',
        title: gender ? 'Gender: 1 = Man, 2 = Woman' : 'Sex: 1 = Male, 2 = Female',
        note: 'The most common coding, but some surveys use 1 for women. Check your questionnaire.',
        labels: numbered(vals.has(3) ? texts : texts.slice(0, 2)),
        missing: [],
      });
    }
    if (within([0, 1])) out.push({ id: 'yesno01', title: 'Yes/no: 0 = No, 1 = Yes', note: 'Usual for yes/no questions stored as 0 and 1.', labels: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes' }], missing: [] });
    if (within([1, 2])) out.push({ id: 'yesno12', title: 'Yes/no: 1 = Yes, 2 = No', note: 'Usual for yes/no questions stored as 1 and 2. Check your questionnaire.', labels: [{ value: 1, label: 'Yes' }, { value: 2, label: 'No' }], missing: [] });
    if (vals.size >= 3 && within([1, 2, 3, 4, 5])) out.push({ id: 'agree5', title: 'Agreement scale, 1 to 5', note: '1 = Strongly disagree to 5 = Strongly agree. Check that 5 means agree in your questionnaire.', labels: numbered(AGREE5), missing: [] });
    if (vals.size >= 4 && max >= 6 && within([1, 2, 3, 4, 5, 6, 7])) out.push({ id: 'agree7', title: 'Agreement scale, 1 to 7', note: '1 = Strongly disagree to 7 = Strongly agree. Check that 7 means agree in your questionnaire.', labels: numbered(AGREE7), missing: [] });
  }
  const unlabelledCodes = missingCodes.filter((x) => labelFor(d, x) === undefined);
  if (unlabelledCodes.length) {
    out.push({
      id: 'missing-codes',
      title: `Label the missing codes (${unlabelledCodes.map(displayValue).join(', ')})`,
      note: "Common conventions: 8 or 98 = Don't know, 9 or 99 = No answer, -1 = Not applicable. They are also marked as missing.",
      labels: unlabelledCodes.map((x) => ({ value: x, label: missingLabelFor(x) })),
      missing: unlabelledCodes,
    });
  }
  return out;
}

export interface SuggestionPreviewRow {
  value: number | string;
  current: string;
  suggested: string;
  /** What accepting does to this value. */
  action: 'add' | 'replace' | 'keep' | 'same';
}

export function previewSuggestion(d: PropsDraft, s: LabelSuggestion, onlyUnlabelled: boolean): SuggestionPreviewRow[] {
  return s.labels.map((l) => {
    const current = labelFor(d, l.value) ?? '';
    const action = current === l.label ? 'same' : current === '' ? 'add' : onlyUnlabelled ? 'keep' : 'replace';
    return { value: l.value, current, suggested: l.label, action };
  });
}

export interface AppliedSuggestion {
  draft: PropsDraft;
  added: number;
  replaced: number;
  /** Missing values not added because of the SPSS limit. */
  skippedMissing: Array<number | string>;
}

export function applySuggestion(d: PropsDraft, type: VarType, s: LabelSuggestion, onlyUnlabelled: boolean): AppliedSuggestion {
  let next = d;
  let added = 0, replaced = 0;
  for (const row of previewSuggestion(d, s, onlyUnlabelled)) {
    if (row.action === 'add') added++;
    else if (row.action === 'replace') replaced++;
    else continue;
    next = setValueLabel(next, row.value, row.suggested);
  }
  const skippedMissing: Array<number | string> = [];
  for (const x of s.missing) {
    const r = toggleMissing(next, type, x, true);
    if (r.problem) skippedMissing.push(x);
    next = r.draft;
  }
  return { draft: next, added, replaced, skippedMissing };
}

// ---------- applying ----------

const LEVEL_KEYWORD: Record<MeasureLevel, string> = { nominal: 'NOMINAL', ordinal: 'ORDINAL', scale: 'SCALE' };

function groupBy<T>(items: T[], key: (x: T) => string): T[][] {
  const m = new Map<string, T[]>();
  for (const x of items) {
    const k = key(x);
    m.set(k, [...(m.get(k) ?? []), x]);
  }
  return [...m.values()];
}

/** Equivalent SPSS syntax for property changes (variables with identical settings share one command). */
export function propertiesSyntax(changes: Array<{ before: Variable; after: Variable }>): string {
  const cmds: string[] = [];
  const labelled = changes.filter((c) => c.before.label !== c.after.label);
  if (labelled.length) {
    cmds.push(`VARIABLE LABELS ${labelled.map((c) => `${c.after.name} ${q(c.after.label)}`).join('\n  /')}.`);
  }
  const vl = changes.filter((c) => !labelsEqual(c.before.valueLabels, c.after.valueLabels));
  for (const g of groupBy(vl, (c) => JSON.stringify(sortLabels(c.after.valueLabels).map((l) => [sv(l.value), l.label])))) {
    const names = varList(g.map((c) => c.after.name));
    const labels = sortLabels(g[0].after.valueLabels);
    cmds.push(labels.length ? valueLabelsSyntax(names, labels) : `* Value labels removed from ${names}.\nVALUE LABELS ${names}.`);
  }
  const mv = changes.filter((c) => !missingEqual(c.before.missing, c.after.missing));
  for (const g of groupBy(mv, (c) => describeMissingSpec(c.after.missing))) cmds.push(missingSyntax(varList(g.map((c) => c.after.name)), g[0].after.missing));
  const lv = changes.filter((c) => c.before.measure !== c.after.measure);
  for (const g of groupBy(lv, (c) => c.after.measure)) cmds.push(`VARIABLE LEVEL ${varList(g.map((c) => c.after.name))} (${LEVEL_KEYWORD[g[0].after.measure]}).`);
  const fm = changes.filter((c) => c.before.format !== c.after.format);
  for (const g of groupBy(fm, (c) => c.after.format)) cmds.push(`FORMATS ${varList(g.map((c) => c.after.name))} (${g[0].after.format}).`);
  return lines(...cmds);
}

export interface PropertiesResult extends TransformResult {
  /** Ids of the variables that changed. */
  changed: string[];
}

/**
 * Apply every draft at once: one new Dataset (one undo step), the SPSS syntax, and a summary.
 * Drafts for unchanged variables are ignored. Missing values are stored sorted.
 */
export function applyPropertyDrafts(ds: Dataset, drafts: Record<string, PropsDraft>): PropertiesResult {
  const changes: Array<{ before: Variable; after: Variable }> = [];
  const counts = { label: 0, valueLabels: 0, missing: 0, measure: 0, format: 0 };
  const variables = ds.variables.map((v) => {
    const d = drafts[v.id];
    if (!d || !isDraftChanged(v, d)) return v;
    const c = draftChanges(v, d);
    const after: Variable = { ...v };
    if (c.label) after.label = d.label;
    if (c.valueLabels) after.valueLabels = sortLabels(d.valueLabels).map((l) => ({ value: l.value, label: l.label.trim() || l.label }));
    if (c.missing) after.missing = normaliseMissing(d.missing);
    if (c.measure) after.measure = d.measure;
    if (c.format) {
      after.width = d.width;
      after.decimals = d.decimals;
      after.format = formatFor(v, d.width, d.decimals);
    }
    for (const k of Object.keys(counts) as Array<keyof typeof counts>) if (c[k]) counts[k]++;
    changes.push({ before: v, after });
    return after;
  });
  const n = changes.length;
  if (!n) return { dataset: ds, title: 'Define Variable Properties', syntax: '', summary: 'No properties were changed.', warnings: [], changed: [] };
  const parts: string[] = [];
  if (counts.label) parts.push(`variable label${counts.label === 1 ? '' : 's'} (${counts.label})`);
  if (counts.valueLabels) parts.push(`value labels (${counts.valueLabels})`);
  if (counts.missing) parts.push(`missing values (${counts.missing})`);
  if (counts.measure) parts.push(`measurement level (${counts.measure})`);
  if (counts.format) parts.push(`width or decimals (${counts.format})`);
  const names = changes.map((c) => c.after.name);
  const shown = names.length <= 6 ? names.join(', ') : `${names.slice(0, 5).join(', ')} and ${names.length - 5} more`;
  return {
    dataset: bump(ds, { variables }),
    title: 'Define Variable Properties',
    syntax: propertiesSyntax(changes),
    summary: `Updated the properties of ${plural(n, 'variable')} (${shown}): ${parts.join(', ')}.`,
    warnings: [],
    changed: changes.map((c) => c.after.id),
  };
}
