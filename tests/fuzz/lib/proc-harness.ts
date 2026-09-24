// Harness for fuzzing ProcedureDefs: option domains, slot assignment, one checked run, metamorphic
// comparisons (weights, filter, user-missing) and a shrinker that produces a minimal reproduction.
import type { Dataset, Variable } from '../../../src/core/types';
import type { OptionDef, OptionValues, ProcedureDef, SlotValues } from '../../../src/core/procedure';
import { defaultOptions } from '../../../src/core/procedure';
import type { OutputItem } from '../../../src/core/output';
import { distinctValues, isUserMissing } from '../../../src/core/data';
import { validate as dialogValidate, optionInactive } from '../../../src/features/analysis/varUtils';
import type { Rng } from './rng';
import { cloneDataset, datasetToCode, deepDiff, keepVariables, replicateByWeight, subsetRows } from './gen-data';
import { badWords, compareTables, errorProblems, outputProblems } from './invariants';
import type { Failure } from './findings';
import { signature } from './findings';

export const PAIR_MARKERS = ['pair:valid', 'pair:absent', 'pair:same'] as const;

/** Values to cover for one option (pairwise parameter domain). */
export function optionDomain(o: OptionDef): unknown[] {
  switch (o.type) {
    case 'checkbox':
      return [true, false];
    case 'select':
      return o.choices.map((c) => c.value);
    case 'number': {
      const vals = new Set<number>([o.default]);
      if (o.min !== undefined) vals.add(o.min);
      if (o.max !== undefined) vals.add(o.max);
      if (o.min === undefined && o.max === undefined) for (const x of [0, -3.5, 1e9]) vals.add(x);
      else if (o.min !== undefined && o.max !== undefined) vals.add(+((o.min + o.max) / 2).toFixed(3));
      return [...vals];
    }
    case 'text':
      if (o.key === 'percentiles') return ['', '10, 90', '0, 50, 100', 'abc', '150', '25;75'];
      if (o.key === 'expectedValues') return ['', '1, 1', '1, 2, 3', '0, 1', '-1, 2', 'x', '1,1,1,1,1,1,1,1,1,1'];
      return ['', 'abc'];
    case 'groupPair':
    case 'valueList':
      return [...PAIR_MARKERS];
  }
}

/** Invalid option values: the dialog must reject them with a readable message (never run). */
export function invalidOptionValues(o: OptionDef): unknown[] {
  if (o.type === 'number') {
    const out: unknown[] = [NaN, 'abc', null];
    if (o.min !== undefined) out.push(o.min - 1);
    if (o.max !== undefined) out.push(o.max + 1);
    return out;
  }
  return [];
}

export interface SlotChoice {
  slots: SlotValues;
  desc: string;
}

/** A random but UI-valid slot assignment (types respected, counts within min..max). */
export function assignSlots(rng: Rng, def: ProcedureDef, ds: Dataset, variant: 'min' | 'more' | 'reuse' = 'min'): SlotChoice {
  const slots: SlotValues = {};
  const used = new Set<string>();
  const exclude = new Set([ds.weightVarId, ds.filterVarId].filter(Boolean) as string[]);
  for (const s of def.slots) {
    const typeOk = ds.variables.filter((v) => (!s.types || s.types.includes(v.type)) && !exclude.has(v.id));
    const measureOk = typeOk.filter((v) => !s.measures || s.measures.includes(v.measure));
    let k = s.min;
    if (variant !== 'min') k = Math.min(s.max, s.min + rng.int(s.min === 0 ? 1 : 0, 3));
    else if (s.min === 0 && rng.bool(0.4)) k = Math.min(1, s.max);
    k = Math.min(k, typeOk.length);
    const chosen: string[] = [];
    const poolFirst = rng.shuffle(measureOk.filter((v) => !used.has(v.id)));
    const poolAny = rng.shuffle(typeOk.filter((v) => !used.has(v.id)));
    const reuse = rng.shuffle(typeOk.filter((v) => used.has(v.id)));
    const pools = variant === 'reuse' ? [reuse, poolFirst, poolAny] : rng.bool(0.8) ? [poolFirst, poolAny, reuse] : [poolAny, poolFirst, reuse];
    for (const pool of pools)
      for (const v of pool) {
        if (chosen.length >= k) break;
        if (!chosen.includes(v.id)) chosen.push(v.id);
      }
    chosen.forEach((id) => used.add(id));
    slots[s.key] = chosen;
  }
  const name = (id: string) => ds.variables.find((v) => v.id === id)?.name ?? id;
  return { slots, desc: Object.entries(slots).map(([k, ids]) => `${k}=[${ids.map(name).join(',')}]`).join(' ') };
}

/** A realistic assignment (what a researcher would pick): measure-matching, well-behaved variables only. */
export function assignTypical(rng: Rng, def: ProcedureDef, ds: Dataset, meta: Array<{ id: string; kind: string }>, many = true): SlotChoice {
  const bad = new Set(['date', 'const', 'allMissing', 'allUserMissing', 'scaleHuge', 'scaleTiny', 'strNum', 'weight', 'filter']);
  const kindOf = new Map(meta.map((m) => [m.id, m.kind]));
  const ok = ds.variables.filter((v) => !bad.has(kindOf.get(v.id) ?? ''));
  const slots: SlotValues = {};
  const used = new Set<string>();
  const paired = def.slots.some((s) => s.key === 'first') && def.slots.some((s) => s.key === 'second');
  for (const s of def.slots) {
    const pool = rng.shuffle(ok.filter((v) => (!s.types || s.types.includes(v.type)) && (!s.measures || s.measures.includes(v.measure)) && !used.has(v.id)));
    let k = s.max === 1 ? Math.max(s.min, 1) : Math.max(s.min, many ? Math.min(3, s.max) : s.min);
    if (paired && (s.key === 'first' || s.key === 'second')) k = 1;
    if (s.min === 0 && s.max === 1) k = rng.bool(0.5) ? 1 : 0;
    slots[s.key] = pool.slice(0, k).map((v) => v.id);
    slots[s.key].forEach((id) => used.add(id));
  }
  const name = (id: string) => ds.variables.find((v) => v.id === id)?.name ?? id;
  return { slots, desc: Object.entries(slots).map(([k, ids]) => `${k}=[${ids.map(name).join(',')}]`).join(' ') };
}

/** Resolve group-pair markers to concrete values from the data. */
export function resolveOptions(rng: Rng, def: ProcedureDef, ds: Dataset, slots: SlotValues, raw: Record<string, unknown>): OptionValues {
  const opts: OptionValues = { ...defaultOptions(def) };
  for (const o of def.options) {
    if (!(o.key in raw)) continue;
    const val = raw[o.key];
    if (o.type === 'groupPair' || o.type === 'valueList') {
      const varId = slots[o.slot]?.[0];
      const v = varId ? ds.variables.find((x) => x.id === varId) : undefined;
      if (!v) {
        opts[o.key] = null;
        continue;
      }
      const vals = distinctValues(ds, v);
      const absent = v.type === 'numeric' ? 12345 : 'zzz-absent';
      let pair: Array<number | string>;
      if (val === 'pair:valid') pair = vals.length >= 2 ? rng.sample(vals, 2) : vals.length === 1 ? [vals[0], absent] : [absent, v.type === 'numeric' ? 54321 : 'yyy'];
      else if (val === 'pair:absent') pair = [vals[0] ?? absent, absent];
      else pair = vals.length ? [vals[0], vals[0]] : [absent, absent];
      opts[o.key] = o.type === 'valueList' ? vals : pair;
      continue;
    }
    opts[o.key] = val;
  }
  return opts;
}

export interface RunOutcome {
  kind: 'blocked' | 'ok' | 'threw';
  problems: string[];
  item?: OutputItem;
  error?: unknown;
  ms: number;
}

/** Validate like the dialog, then run; never throws. */
export function runChecked(def: ProcedureDef, ds: Dataset, slots: SlotValues, opts: OptionValues): RunOutcome {
  const t0 = performance.now();
  let problems: string[] = [];
  try {
    problems = dialogValidate(def, ds, slots, opts);
  } catch (e) {
    return { kind: 'threw', problems: [], error: e, ms: performance.now() - t0 };
  }
  if (problems.length) return { kind: 'blocked', problems, ms: performance.now() - t0 };
  try {
    const item = def.run(ds, slots, opts);
    return { kind: 'ok', problems: [], item, ms: performance.now() - t0 };
  } catch (e) {
    return { kind: 'threw', problems: [], error: e, ms: performance.now() - t0 };
  }
}

export interface CaseSpec {
  def: ProcedureDef;
  ds: Dataset;
  slots: SlotValues;
  opts: OptionValues;
  seed: number;
}

/** Invariant failures for one run (not metamorphic). */
export function checkRun(c: CaseSpec, rngForDefValidate = true): Array<Pick<Failure, 'check' | 'detail'>> {
  const out: Array<Pick<Failure, 'check' | 'detail'>> = [];
  // def.validate throwing is caught by the dialog and shown raw: it must still be readable.
  if (rngForDefValidate && c.def.validate) {
    try {
      const m = c.def.validate(c.ds, c.slots, c.opts);
      if (m) for (const b of badWords(m)) out.push({ check: 'validate-text', detail: `validate message contains ${b}: "${m.slice(0, 140)}"` });
    } catch (e) {
      out.push({ check: 'validate-throw', detail: `validate threw: ${(e as Error)?.message?.slice(0, 160)}` });
    }
  }
  const before = cloneDataset(c.ds);
  const r = runChecked(c.def, c.ds, c.slots, c.opts);
  if (r.kind === 'blocked') {
    for (const p of r.problems) for (const b of badWords(p)) out.push({ check: 'validate-text', detail: `dialog message contains ${b}: "${p.slice(0, 140)}"` });
  } else if (r.kind === 'threw') {
    for (const p of errorProblems(r.error)) out.push({ check: 'throw', detail: p });
  } else if (r.item) {
    for (const p of outputProblems(r.item)) out.push(p);
  }
  if (r.ms > Number(process.env.FUZZ_SLOW_MS ?? 4000)) out.push({ check: 'slow', detail: `run took ${Math.round(r.ms)} ms for n=${c.ds.nCases}` });
  const mut = deepDiff(before, c.ds);
  if (mut) out.push({ check: 'mutates', detail: `run() mutated the dataset: ${mut}` });
  return out;
}

// ---------- metamorphic relations ----------

/** Integer weights must equal replicated cases. */
export function checkWeightReplication(c: CaseSpec): string | null {
  if (!c.ds.weightVarId) return null;
  const rep = replicateByWeight(c.ds);
  const a = runChecked(c.def, c.ds, c.slots, c.opts);
  const b = runChecked(c.def, rep, c.slots, c.opts);
  if (a.kind !== b.kind) return `weighted run ${a.kind}${a.kind === 'threw' ? ` (${(a.error as Error)?.message?.slice(0, 80)})` : a.kind === 'blocked' ? ` (${a.problems[0]})` : ''} but replicated run ${b.kind}${b.kind === 'threw' ? ` (${(b.error as Error)?.message?.slice(0, 80)})` : b.kind === 'blocked' ? ` (${b.problems[0]})` : ''}`;
  if (a.kind !== 'ok') return null;
  // Tables that say they show unweighted counts, or whose method changes under weights by design.
  const special = (t: { footnotes?: string[]; header: unknown; title: string }) => /unweighted|Tukey's hinges|HAVERAGE/i.test(JSON.stringify([t.footnotes ?? [], t.header, t.title]));
  const skipTitles = new Set([a.item!, b.item!].flatMap((it) => it.blocks.filter((bl) => bl.kind === 'table' && special(bl.table)).map((bl) => (bl as { table: { title: string } }).table.title)));
  return compareTables(a.item!, b.item!, 1e-4, (t) => skipTitles.has(t.title), true);
}

/** Filtering must equal physically removing the filtered-out cases. */
export function checkFilterSubset(c: CaseSpec): string | null {
  if (!c.ds.filterVarId) return null;
  const fcol = c.ds.columns[c.ds.filterVarId] as Float64Array;
  const rows: number[] = [];
  for (let i = 0; i < c.ds.nCases; i++) if (!Number.isNaN(fcol[i]) && fcol[i] !== 0) rows.push(i);
  const sub = { ...subsetRows(c.ds, rows), filterVarId: null };
  const a = runChecked(c.def, c.ds, c.slots, c.opts);
  const b = runChecked(c.def, sub, c.slots, c.opts);
  if (a.kind !== b.kind) return `filtered run ${a.kind} but subset run ${b.kind}${b.kind === 'threw' ? ` (${(b.error as Error)?.message?.slice(0, 80)})` : ''}${a.kind === 'threw' ? ` (${(a.error as Error)?.message?.slice(0, 80)})` : ''}`;
  if (a.kind !== 'ok') return null;
  // Case numbers refer to the original rows; logistic lists the unselected (filtered) cases by design.
  return compareTables(a.item!, b.item!, 1e-9, (t) => /Casewise Diagnostics|Unselected Cases/i.test(JSON.stringify([t.title, t.rows.map((r) => r[0]?.v)])));
}

/** Declared user-missing numeric codes must behave exactly like system-missing. */
export function userMissingAsSysmis(ds: Dataset): Dataset {
  const columns = { ...ds.columns };
  const variables: Variable[] = ds.variables.map((v) => {
    if (v.type !== 'numeric' || (!v.missing.discrete.length && !v.missing.range)) return v;
    const src = ds.columns[v.id] as Float64Array;
    const c = new Float64Array(src.length);
    for (let i = 0; i < src.length; i++) c[i] = isUserMissing(v.missing, src[i]) ? NaN : src[i];
    columns[v.id] = c;
    return { ...v, missing: { discrete: [] }, valueLabels: v.valueLabels.filter((l) => !(typeof l.value === 'number' && isUserMissing(v.missing, l.value))) };
  });
  return { ...ds, variables, columns };
}

export function checkUserMissing(c: CaseSpec, skipTable?: (title: string) => boolean): string | null {
  const alt = userMissingAsSysmis(c.ds);
  if (!deepDiff(alt.columns, c.ds.columns)) return null; // no user-missing codes in play
  const a = runChecked(c.def, c.ds, c.slots, c.opts);
  const b = runChecked(c.def, alt, c.slots, c.opts);
  if (a.kind !== b.kind) return `with user-missing codes run ${a.kind} but with them as system-missing run ${b.kind}`;
  if (a.kind !== 'ok') return null;
  return compareTables(a.item!, b.item!, 1e-9, skipTable ? (t) => skipTable(t.title) : undefined);
}

// ---------- shrinking ----------

/**
 * Minimise a failing case: drop unused variables, reset options to defaults, drop cases.
 * `fails` must return true while the (same) failure still occurs.
 */
export function shrinkCase(c: CaseSpec, fails: (c: CaseSpec) => boolean, budget = 150): CaseSpec {
  let cur = c;
  let calls = 0;
  const tryIt = (cand: CaseSpec) => {
    if (calls++ >= budget) return false;
    try {
      if (fails(cand)) {
        cur = cand;
        return true;
      }
    } catch {
      /* the candidate broke differently: not a valid reduction */
    }
    return false;
  };
  // Unused variables.
  const inSlots = new Set(Object.values(cur.slots).flat());
  tryIt({ ...cur, ds: keepVariables(cur.ds, inSlots) });
  // Weight / filter off.
  if (cur.ds.weightVarId) tryIt({ ...cur, ds: { ...cur.ds, weightVarId: null } });
  if (cur.ds.filterVarId) tryIt({ ...cur, ds: { ...cur.ds, filterVarId: null } });
  if (!cur.ds.weightVarId || !cur.ds.filterVarId) tryIt({ ...cur, ds: keepVariables({ ...cur.ds }, new Set(Object.values(cur.slots).flat())) });
  // Options back to default.
  const defs = defaultOptions(cur.def);
  for (const k of Object.keys(cur.opts)) {
    if (JSON.stringify(cur.opts[k]) === JSON.stringify(defs[k])) continue;
    tryIt({ ...cur, opts: { ...cur.opts, [k]: defs[k] } });
  }
  // Extra slot variables.
  for (const s of cur.def.slots) {
    const ids = cur.slots[s.key] ?? [];
    for (let i = ids.length - 1; i >= 0 && (cur.slots[s.key]?.length ?? 0) > s.min; i--) {
      const next = cur.slots[s.key].filter((_, j) => j !== i);
      if (tryIt({ ...cur, slots: { ...cur.slots, [s.key]: next } })) tryIt({ ...cur, ds: keepVariables(cur.ds, new Set(Object.values(cur.slots).flat())) });
    }
  }
  // Cases (ddmin-style chunks).
  let chunk = Math.max(1, Math.floor(cur.ds.nCases / 2));
  while (chunk >= 1 && calls < budget) {
    let removed = false;
    for (let start = 0; start < cur.ds.nCases && calls < budget; start += chunk) {
      const rows = Array.from({ length: cur.ds.nCases }, (_, i) => i).filter((i) => i < start || i >= start + chunk);
      if (!rows.length) continue;
      if (tryIt({ ...cur, ds: subsetRows(cur.ds, rows) })) {
        removed = true;
        start -= chunk;
      }
    }
    if (!removed) chunk = Math.floor(chunk / 2);
  }
  return cur;
}

/** Code that reproduces a case (paste into a vitest file). */
export function reproCode(c: CaseSpec, call = 'run'): string {
  const defs = defaultOptions(c.def);
  const changed: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(c.opts)) if (JSON.stringify(v) !== JSON.stringify(defs[k])) changed[k] = v;
  const code = datasetToCode(c.ds);
  return [
    `// import { makeDataset, makeVariable } from 'src/core/types'; import { getProcedure } from 'src/procedures'; import { defaultOptions } from 'src/core/procedure';`,
    code.length > 4000 ? code.slice(0, 4000) + '\n/* ...truncated: re-run with the seed for the full dataset */' : code,
    `const def = getProcedure(${JSON.stringify(c.def.id)})!;`,
    `def.${call}(ds, ${JSON.stringify(c.slots)}, { ...defaultOptions(def), ...${JSON.stringify(changed)} });`,
  ].join('\n');
}

/** Helper to know whether a list of check failures still contains the given signature. */
export function sameFailure(area: Failure['area'], subject: string, check: string, detail: string) {
  const sig = signature({ area, subject, check, detail });
  return (list: Array<Pick<Failure, 'check' | 'detail'>>) => list.some((p) => signature({ area, subject, check: p.check, detail: p.detail }) === sig);
}

export { optionInactive };
