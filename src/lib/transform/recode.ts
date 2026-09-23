// RECODE (into same / different variables) and AUTORECODE.

import type { Column, Dataset, ValueLabel, Variable } from '../../core/types';
import { isUserMissing, validateVarName, valueLabelFor } from '../../core/data';
import { compileExpression } from './evaluate';
import { ExprError } from './expr';
import { addVariable, bump, newNumericVar, newStringVar, plural, suggestDecimals, type TransformResult } from './dsops';
import { lines, sv, valueLabelsSyntax, variableLabelSyntax, varList } from './syntax';

export type RecodeFrom =
  | { kind: 'value'; value: number | string }
  | { kind: 'range'; lo: number; hi: number }
  | { kind: 'lowest'; hi: number }
  | { kind: 'highest'; lo: number }
  | { kind: 'sysmis' }
  | { kind: 'missing' }
  | { kind: 'else' };

export type RecodeTo = { kind: 'value'; value: number | string } | { kind: 'sysmis' } | { kind: 'copy' };

export interface RecodeRule {
  from: RecodeFrom;
  to: RecodeTo;
}

export function describeFrom(f: RecodeFrom): string {
  switch (f.kind) {
    case 'value': return typeof f.value === 'string' ? `'${f.value}'` : String(f.value);
    case 'range': return `${f.lo} thru ${f.hi}`;
    case 'lowest': return `Lowest thru ${f.hi}`;
    case 'highest': return `${f.lo} thru Highest`;
    case 'sysmis': return 'System-missing';
    case 'missing': return 'System- or user-missing';
    case 'else': return 'All other values';
  }
}

export function describeTo(t: RecodeTo): string {
  switch (t.kind) {
    case 'value': return typeof t.value === 'string' ? `'${t.value}'` : String(t.value);
    case 'sysmis': return 'System-missing';
    case 'copy': return 'Copy old value';
  }
}

function fromSyntax(f: RecodeFrom): string {
  switch (f.kind) {
    case 'value': return sv(f.value);
    case 'range': return `${f.lo} THRU ${f.hi}`;
    case 'lowest': return `LOWEST THRU ${f.hi}`;
    case 'highest': return `${f.lo} THRU HIGHEST`;
    case 'sysmis': return 'SYSMIS';
    case 'missing': return 'MISSING';
    case 'else': return 'ELSE';
  }
}

function toSyntax(t: RecodeTo): string {
  return t.kind === 'value' ? sv(t.value) : t.kind === 'sysmis' ? 'SYSMIS' : 'COPY';
}

export function rulesSyntax(rules: RecodeRule[]): string {
  return rules.map((r) => `(${fromSyntax(r.from)}=${toSyntax(r.to)})`).join(' ');
}

/** Does old value x of variable v match the rule's "from" spec? */
export function matchesFrom(v: Variable, x: number | string, f: RecodeFrom): boolean {
  if (typeof x === 'string') {
    switch (f.kind) {
      case 'value': return typeof f.value === 'string' && f.value.trimEnd() === x.trimEnd();
      case 'missing': return isUserMissing(v.missing, x);
      case 'else': return true;
      default: return false;
    }
  }
  const sys = Number.isNaN(x);
  switch (f.kind) {
    case 'value': return !sys && typeof f.value === 'number' && f.value === x;
    case 'range': return !sys && x >= f.lo && x <= f.hi;
    case 'lowest': return !sys && x <= f.hi;
    case 'highest': return !sys && x >= f.lo;
    case 'sysmis': return sys;
    case 'missing': return sys || isUserMissing(v.missing, x);
    case 'else': return true;
  }
}

/**
 * Recode one value. Returns `undefined` when no rule matched (caller keeps the old value for
 * "into same", or sets missing for "into different").
 */
export function recodeValue(v: Variable, x: number | string, rules: RecodeRule[], outType: 'numeric' | 'string'): number | string | undefined {
  for (const r of rules) {
    if (!matchesFrom(v, x, r.from)) continue;
    const t = r.to;
    if (t.kind === 'sysmis') return outType === 'numeric' ? NaN : '';
    if (t.kind === 'value') return t.value;
    // COPY, with conversion between string and numeric (SPSS CONVERT).
    if (outType === 'numeric') {
      if (typeof x === 'number') return x;
      const s = x.trim();
      const n = s === '' ? NaN : Number(s);
      return Number.isFinite(n) ? n : NaN;
    }
    if (typeof x === 'string') return x;
    return Number.isNaN(x) ? '' : String(x);
  }
  return undefined;
}

export class RecodeError extends Error {}

function validateRules(v: Variable, rules: RecodeRule[], outType: 'numeric' | 'string') {
  if (!rules.length) throw new RecodeError('Add at least one rule (old value and new value).');
  for (const r of rules) {
    if (v.type === 'string' && ['range', 'lowest', 'highest', 'sysmis'].includes(r.from.kind))
      throw new RecodeError(`${v.name} is a string variable: ranges and system-missing do not apply. Use single values, MISSING or ELSE.`);
    if (r.from.kind === 'value' && (typeof r.from.value === 'string') !== (v.type === 'string'))
      throw new RecodeError(`Old value ${describeFrom(r.from)} does not match the type of ${v.name}.`);
    if (r.to.kind === 'value' && (typeof r.to.value === 'string') !== (outType === 'string'))
      throw new RecodeError(`New value ${describeTo(r.to)} must be ${outType === 'string' ? 'text' : 'a number'}.`);
    if (r.from.kind === 'range' && r.from.lo > r.from.hi) throw new RecodeError(`The range ${r.from.lo} thru ${r.from.hi} is empty (low is above high).`);
  }
}

function conditionFn(ds: Dataset, condition?: string): ((i: number) => boolean) | null {
  if (!condition || !condition.trim()) return null;
  let c;
  try {
    c = compileExpression(ds, condition);
  } catch (e) {
    if (e instanceof ExprError) throw new RecodeError(`Condition: ${e.message}`);
    throw e;
  }
  if (c.type !== 'num') throw new RecodeError('The condition must be a comparison such as age >= 18.');
  return (i) => {
    const x = c.evaluate(i) as number;
    return !Number.isNaN(x) && x !== 0;
  };
}

export interface RecodeSameSpec {
  varIds: string[];
  rules: RecodeRule[];
  condition?: string;
}

export function recodeSame(ds: Dataset, spec: RecodeSameSpec): TransformResult {
  if (!spec.varIds.length) throw new RecodeError('Choose at least one variable to recode.');
  const cond = conditionFn(ds, spec.condition);
  const vars = spec.varIds.map((id) => ds.variables.find((v) => v.id === id)!);
  const types = new Set(vars.map((v) => v.type));
  if (types.size > 1) throw new RecodeError('Recode numeric and string variables separately.');
  const cols: Record<string, Column> = {};
  let changed = 0;
  for (const v of vars) {
    validateRules(v, spec.rules, v.type);
    const col = ds.columns[v.id];
    if (col instanceof Float64Array) {
      const c = new Float64Array(col);
      for (let i = 0; i < ds.nCases; i++) {
        if (cond && !cond(i)) continue;
        const r = recodeValue(v, col[i], spec.rules, 'numeric');
        if (r !== undefined && !Object.is(r, col[i])) {
          c[i] = r as number;
          changed++;
        }
      }
      cols[v.id] = c;
    } else {
      const c = col.slice();
      for (let i = 0; i < ds.nCases; i++) {
        if (cond && !cond(i)) continue;
        const r = recodeValue(v, col[i], spec.rules, 'string');
        if (r !== undefined && r !== col[i]) {
          c[i] = (r as string).slice(0, v.width);
          changed++;
        }
      }
      cols[v.id] = c;
    }
  }
  const names = vars.map((v) => v.name);
  const syntax = lines(
    spec.condition?.trim() ? `DO IF (${spec.condition.trim()}).` : '',
    `RECODE ${varList(names)} ${rulesSyntax(spec.rules)}.`,
    spec.condition?.trim() ? 'END IF.' : '',
    'EXECUTE.',
  );
  return {
    dataset: bump(ds, { columns: { ...ds.columns, ...cols } }),
    title: 'Recode into Same Variables',
    syntax,
    summary: `Recoded ${names.join(', ')}: ${plural(changed, 'value')} changed.`,
    warnings: [],
  };
}

export interface RecodeTarget {
  sourceId: string;
  name: string;
  label?: string;
}

export interface RecodeDifferentSpec {
  targets: RecodeTarget[];
  rules: RecodeRule[];
  outType: 'numeric' | 'string';
  /** String output width (default 8). */
  width?: number;
  /** Value labels to attach to every new variable. */
  valueLabels?: ValueLabel[];
  condition?: string;
}

export function recodeDifferent(ds: Dataset, spec: RecodeDifferentSpec): TransformResult {
  if (!spec.targets.length) throw new RecodeError('Choose at least one variable to recode.');
  const cond = conditionFn(ds, spec.condition);
  const seen = new Set<string>();
  let next = ds;
  const syn: string[] = [];
  const created: string[] = [];
  for (const t of spec.targets) {
    const v = ds.variables.find((x) => x.id === t.sourceId);
    if (!v) throw new RecodeError('A source variable no longer exists.');
    const name = t.name.trim();
    const err = validateVarName(next, name);
    if (err) throw new RecodeError(`Output name for ${v.name}: ${err}`);
    if (seen.has(name.toLowerCase())) throw new RecodeError(`The output name ${name} is used twice.`);
    seen.add(name.toLowerCase());
    validateRules(v, spec.rules, spec.outType);
    const src = ds.columns[v.id];
    let col: Column;
    if (spec.outType === 'numeric') {
      const c = new Float64Array(ds.nCases).fill(NaN);
      for (let i = 0; i < ds.nCases; i++) {
        if (cond && !cond(i)) continue;
        const r = recodeValue(v, src[i], spec.rules, 'numeric');
        if (r !== undefined) c[i] = r as number;
      }
      col = c;
      const nv = newNumericVar(name, {
        label: t.label ?? '',
        decimals: suggestDecimals(c),
        valueLabels: (spec.valueLabels ?? []).filter((l) => typeof l.value === 'number'),
        measure: v.measure === 'scale' && spec.valueLabels?.length ? 'ordinal' : v.measure,
      });
      next = addVariable(next, nv, col);
    } else {
      const w = spec.width ?? 8;
      const c = new Array<string>(ds.nCases).fill('');
      for (let i = 0; i < ds.nCases; i++) {
        if (cond && !cond(i)) continue;
        const r = recodeValue(v, src[i], spec.rules, 'string');
        if (r !== undefined) c[i] = (r as string).slice(0, w);
      }
      col = c;
      next = addVariable(next, newStringVar(name, w, { label: t.label ?? '', valueLabels: (spec.valueLabels ?? []).filter((l) => typeof l.value === 'string') }), col);
    }
    created.push(name);
    syn.push(`RECODE ${v.name} ${rulesSyntax(spec.rules)}${spec.outType !== v.type && spec.rules.some((r) => r.to.kind === 'copy') ? ' (CONVERT)' : ''} INTO ${name}.`);
    if (t.label) syn.push(variableLabelSyntax(name, t.label));
  }
  const labelsSyn = spec.valueLabels?.length ? created.map((n) => valueLabelsSyntax(n, spec.valueLabels!)).join('\n') : '';
  const syntax = lines(
    spec.outType === 'string' ? `STRING ${created.join(' ')} (A${spec.width ?? 8}).` : '',
    spec.condition?.trim() ? `DO IF (${spec.condition.trim()}).` : '',
    ...syn,
    spec.condition?.trim() ? 'END IF.' : '',
    labelsSyn,
    'EXECUTE.',
  );
  return {
    dataset: next,
    title: 'Recode into Different Variables',
    syntax,
    summary: `Created ${created.join(', ')} by recoding ${spec.targets.map((t) => ds.variables.find((v) => v.id === t.sourceId)!.name).join(', ')}.`,
    warnings: [],
  };
}

// ---------- AUTORECODE ----------

export interface AutoRecodeSpec {
  items: Array<{ sourceId: string; name: string }>;
  descending?: boolean;
}

export function autoRecode(ds: Dataset, spec: AutoRecodeSpec): TransformResult {
  if (!spec.items.length) throw new RecodeError('Choose at least one variable.');
  let next = ds;
  const syn: string[] = [];
  const parts: string[] = [];
  for (const it of spec.items) {
    const v = ds.variables.find((x) => x.id === it.sourceId)!;
    const name = it.name.trim();
    const err = validateVarName(next, name);
    if (err) throw new RecodeError(`New name for ${v.name}: ${err}`);
    const col = ds.columns[v.id];
    const valid = new Set<number | string>();
    const umiss = new Set<number | string>();
    for (let i = 0; i < ds.nCases; i++) {
      const x = col[i];
      if (typeof x === 'number') {
        if (Number.isNaN(x)) continue;
        (isUserMissing(v.missing, x) ? umiss : valid).add(x);
      } else {
        const t = x.trimEnd();
        if (t === '') continue;
        (isUserMissing(v.missing, x) ? umiss : valid).add(t);
      }
    }
    const sortVals = (arr: Array<number | string>) => {
      if (v.type === 'numeric') (arr as number[]).sort((a, b) => a - b);
      else (arr as string[]).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      if (spec.descending) arr.reverse();
      return arr;
    };
    const ordered = [...sortVals([...valid]), ...sortVals([...umiss])];
    const map = new Map<number | string, number>();
    ordered.forEach((x, k) => map.set(x, k + 1));
    const out = new Float64Array(ds.nCases).fill(NaN);
    for (let i = 0; i < ds.nCases; i++) {
      const x = col[i];
      const key = typeof x === 'string' ? x.trimEnd() : x;
      const code = map.get(key);
      if (code !== undefined) out[i] = code;
    }
    const labels: ValueLabel[] = ordered.map((x, k) => ({ value: k + 1, label: valueLabelFor(v, x) ?? String(x) }));
    const missCodes = [...umiss].map((x) => map.get(x)!).sort((a, b) => a - b);
    const nv = newNumericVar(name, {
      label: v.label,
      decimals: 0,
      width: Math.max(3, String(ordered.length).length + 1),
      valueLabels: labels,
      measure: v.type === 'string' ? 'nominal' : v.measure === 'scale' ? 'ordinal' : v.measure,
      missing: missCodes.length ? (missCodes.length <= 3 ? { discrete: missCodes } : { discrete: [], range: { lo: missCodes[0], hi: Infinity } }) : { discrete: [] },
    });
    next = addVariable(next, nv, out);
    syn.push(`AUTORECODE VARIABLES=${v.name}\n  /INTO ${name}${spec.descending ? '\n  /DESCENDING' : ''}\n  /PRINT.`);
    parts.push(`${v.name} to ${name} (${plural(valid.size, 'category', 'categories')})`);
  }
  return { dataset: next, title: 'Automatic Recode', syntax: syn.join('\n'), summary: `Recoded ${parts.join('; ')}.`, warnings: [] };
}

/** Parse a user-typed old value for a variable (number, or text for string variables). */
export function parseValueFor(type: 'numeric' | 'string', text: string): number | string | null {
  if (type === 'string') return text;
  const t = text.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

