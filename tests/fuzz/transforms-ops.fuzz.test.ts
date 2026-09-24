// Fuzzing the data transformations: recode (same / different / automatic), visual binning, select cases
// (filter and delete), sort, weight, aggregate, merge (add cases / add variables), reverse-code,
// scales, z-scores, count, rank.
// Invariants for every transform: only its own error class with a plain-English message on bad input;
// the input dataset is never mutated; the result is structurally valid (column lengths, types, unique
// names, weight/filter pointing at numeric variables); undo restores the exact previous dataset and redo
// the result; plus reference checks (recode first-match rules, aggregate group statistics, select-cases
// counts, sort order, add-cases concatenation, binning monotonicity).
// Reproduce: FUZZ_SEED=<seed> npx vitest run tests/fuzz/transforms-ops.fuzz.test.ts
import { describe, expect, it } from 'vitest';
import * as T from '../../src/lib/transform';
import type { RecodeFrom, RecodeRule, RecodeTo, TransformResult } from '../../src/lib/transform';
import { useStore } from '../../src/core/store';
import { activeCaseMask, caseWeights, isMissingValue, isUserMissing, validateVarName } from '../../src/core/data';
import type { Dataset, Variable } from '../../src/core/types';
import { makeDataset, makeVariable } from '../../src/core/types';
import { makeRng, suiteSeed, fuzzScale, type Rng } from './lib/rng';
import { cloneDataset, datasetToCode, deepDiff, genDataset } from './lib/gen-data';
import { exprGenerator, render } from './lib/gen-expr';
import { Collector } from './lib/findings';
import { badWords, errorProblems } from './lib/invariants';

const SEED = suiteSeed(777001);
const col = new Collector('transforms-ops');
const out = (s: string) => process.stdout.write(s + '\n');
const OWN_ERRORS = [T.RecodeError, T.BinError, T.CasesError, T.AggregateError, T.MergeError, T.DeriveError, T.ComputeError, T.ExprError];

function fail(subject: string, check: string, detail: string, seed: number, repro?: string) {
  col.add({ area: 'transforms', subject, check, detail, seed, repro });
}

/** Structural validity of a dataset. */
function structureProblems(ds: Dataset): string[] {
  const p: string[] = [];
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const v of ds.variables) {
    if (ids.has(v.id)) p.push(`duplicate variable id ${v.id}`);
    ids.add(v.id);
    const lower = v.name.toLowerCase();
    if (names.has(lower)) p.push(`duplicate variable name ${v.name}`);
    names.add(lower);
    const c = ds.columns[v.id];
    if (!c) {
      p.push(`no column for ${v.name}`);
      continue;
    }
    if (c.length !== ds.nCases) p.push(`${v.name}: ${c.length} values for ${ds.nCases} cases`);
    if (v.type === 'numeric' && !(c instanceof Float64Array)) p.push(`${v.name}: numeric variable without a Float64Array column`);
    if (v.type === 'string') {
      if (c instanceof Float64Array) p.push(`${v.name}: string variable with a numeric column`);
      else if (c.some((s) => typeof s !== 'string')) p.push(`${v.name}: string column holds non-strings`);
    }
    const others = { ...ds, variables: ds.variables.filter((u) => u.id !== v.id) };
    const err = validateVarName(others, v.name);
    if (err) p.push(`invalid name "${v.name}": ${err}`);
  }
  for (const k of ['weightVarId', 'filterVarId'] as const) {
    const id = ds[k];
    if (id && ds.variables.find((v) => v.id === id)?.type !== 'numeric') p.push(`${k} points at ${ds.variables.find((v) => v.id === id)?.name ?? 'a missing variable'}`);
  }
  if (Object.keys(ds.columns).length !== ds.variables.length) p.push(`${Object.keys(ds.columns).length} columns for ${ds.variables.length} variables`);
  return p;
}

/** Run one transform with all generic invariants; returns the result or null. */
function runT(subject: string, seed: number, ds: Dataset, spec: unknown, fn: (d: Dataset) => TransformResult, extra?: (r: TransformResult) => string | null): TransformResult | null {
  const before = cloneDataset(ds);
  const repro = () => `${datasetToCode(ds).slice(0, 3000)}\n${subject}(ds, ${JSON.stringify(spec, (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v))});`;
  let res: TransformResult;
  try {
    res = fn(ds);
  } catch (e) {
    if (!OWN_ERRORS.some((C) => e instanceof C)) fail(subject, 'throw', `non-transform error ${(e as Error)?.name}: ${(e as Error)?.message?.slice(0, 160)}`, seed, repro());
    else for (const p of errorProblems(e)) fail(subject, 'message', p, seed, repro());
    return null;
  }
  const mut = deepDiff(before, ds);
  if (mut) fail(subject, 'mutates', `changed its input dataset: ${mut}`, seed, repro());
  for (const p of structureProblems(res.dataset)) fail(subject, 'structure', p, seed, repro());
  for (const s of [res.summary, res.syntax, res.title, ...res.warnings]) for (const b of badWords(s).filter((w) => w !== 'null')) fail(subject, 'text', `${b} in "${s.slice(0, 140)}"`, seed, repro());
  if (!res.syntax.trim()) fail(subject, 'text', 'no syntax', seed, repro());
  if (extra) {
    let m: string | null = null;
    try {
      m = extra(res);
    } catch (e) {
      m = `check threw: ${(e as Error).message}`;
    }
    if (m) fail(subject, 'semantics', m, seed, repro());
  }
  // Undo / redo through the store.
  const st = useStore.getState();
  st.setDataset(before);
  st.mutateDataset(() => res.dataset);
  if (useStore.getState().dataset !== before) {
    useStore.getState().undo();
    const u = deepDiff(useStore.getState().dataset, before);
    if (u) fail(subject, 'undo', `undo did not restore the dataset: ${u}`, seed, repro());
    useStore.getState().redo();
    const r = deepDiff({ ...useStore.getState().dataset!, version: 0 }, { ...res.dataset, version: 0 });
    if (r) fail(subject, 'redo', `redo did not give the result back: ${r}`, seed, repro());
  }
  return res;
}

// ---------- generators ----------

function numVars(ds: Dataset) {
  return ds.variables.filter((v) => v.type === 'numeric' && v.id !== ds.weightVarId && v.id !== ds.filterVarId);
}
function strVars(ds: Dataset) {
  return ds.variables.filter((v) => v.type === 'string');
}
function valuesOf(ds: Dataset, v: Variable): Array<number | string> {
  return [...new Set(Array.from(ds.columns[v.id] as ArrayLike<number | string>))];
}

function genRules(rng: Rng, ds: Dataset, v: Variable, outType: 'numeric' | 'string'): RecodeRule[] {
  const vals = valuesOf(ds, v).filter((x) => !(typeof x === 'number' && Number.isNaN(x)));
  const n = rng.int(1, 5);
  const rules: RecodeRule[] = [];
  for (let k = 0; k < n; k++) {
    let from: RecodeFrom;
    if (v.type === 'string') {
      const r = rng.int(0, 5);
      from = r < 4 ? { kind: 'value', value: vals.length ? (rng.pick(vals) as string) : 'x' } : r === 4 ? { kind: 'missing' } : { kind: 'else' };
      if (rng.bool(0.03)) from = { kind: 'range', lo: 1, hi: 2 }; // invalid for strings
    } else {
      const nv = vals as number[];
      const pick = () => (nv.length && rng.bool(0.8) ? rng.pick(nv) : rng.pick([0, 1, 5, -1, 97]));
      const r = rng.int(0, 7);
      if (r <= 1) from = { kind: 'value', value: pick() };
      else if (r === 2) {
        const a = pick(), b = pick();
        from = { kind: 'range', lo: rng.bool(0.95) ? Math.min(a, b) : Math.max(a, b), hi: rng.bool(0.95) ? Math.max(a, b) : Math.min(a, b) };
      } else if (r === 3) from = { kind: 'lowest', hi: pick() };
      else if (r === 4) from = { kind: 'highest', lo: pick() };
      else if (r === 5) from = { kind: 'sysmis' };
      else if (r === 6) from = { kind: 'missing' };
      else from = { kind: 'else' };
    }
    let to: RecodeTo;
    const r2 = rng.int(0, 5);
    if (r2 <= 3) to = { kind: 'value', value: outType === 'numeric' ? rng.pick([0, 1, 2, 9, -1, 2.5]) : rng.pick(['a', 'LOW', 'উচ্চ', '', 'a much longer text value than eight']) };
    else if (r2 === 4) to = { kind: 'sysmis' };
    else to = { kind: 'copy' };
    rules.push({ from, to });
  }
  return rules;
}

/** Reference RECODE: first matching rule wins. undefined = no rule matched. */
function refRecode(v: Variable, x: number | string, rules: RecodeRule[], outType: 'numeric' | 'string'): number | string | undefined {
  for (const r of rules) {
    const f = r.from;
    let m = false;
    if (typeof x === 'string') m = f.kind === 'value' ? typeof f.value === 'string' && f.value.trimEnd() === x.trimEnd() : f.kind === 'missing' ? isUserMissing(v.missing, x) : f.kind === 'else';
    else {
      const sys = Number.isNaN(x);
      m =
        f.kind === 'value' ? !sys && f.value === x
        : f.kind === 'range' ? !sys && x >= f.lo && x <= f.hi
        : f.kind === 'lowest' ? !sys && x <= f.hi
        : f.kind === 'highest' ? !sys && x >= f.lo
        : f.kind === 'sysmis' ? sys
        : f.kind === 'missing' ? sys || isUserMissing(v.missing, x)
        : true;
    }
    if (!m) continue;
    if (r.to.kind === 'sysmis') return outType === 'numeric' ? NaN : '';
    if (r.to.kind === 'value') return r.to.value;
    if (outType === 'numeric') return typeof x === 'number' ? x : x.trim() === '' || !Number.isFinite(Number(x.trim())) ? NaN : Number(x.trim());
    return typeof x === 'string' ? x : Number.isNaN(x) ? '' : String(x);
  }
  return undefined;
}

const eqv = (a: unknown, b: unknown) => Object.is(a, b) || (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) || a === b;

function dsFor(seed: number, opts: Parameters<typeof genDataset>[1] = {}) {
  const rng = makeRng(seed);
  return { rng, ...genDataset(rng, { nCases: rng.pick([1, 2, 5, 20, 60]), weight: rng.pick(['none', 'none', 'int', 'bad'] as const), filter: rng.bool(0.3), extra: rng.int(0, 4), ...opts }) };
}

const N = (k: number) => Math.round(k * fuzzScale());

describe('recode', () => {
  it('recode into same / different variables and automatic recode', () => {
    for (let t = 0; t < N(2000); t++) {
      const seed = makeRng(SEED).fork(`recode#${t}`).seed;
      const { rng, ds } = dsFor(seed);
      const g = exprGenerator(rng, ds);
      const cond = rng.bool(0.25) ? render(g.num(2)) : undefined;
      const condMask = (d: Dataset) => (cond ? T.conditionMask(d, cond) : new Uint8Array(d.nCases).fill(1));
      const mode = rng.int(0, 2);
      if (mode === 0) {
        const pool = rng.bool(0.7) ? numVars(ds) : strVars(ds);
        const vars = rng.sample(pool, rng.int(1, 2));
        if (rng.bool(0.05)) vars.push(rng.pick(ds.variables));
        if (!vars.length) continue;
        const rules = genRules(rng, ds, vars[0], vars[0].type);
        const spec = { varIds: vars.map((v) => v.id), rules, condition: cond };
        runT('recodeSame', seed, ds, spec, (d) => T.recodeSame(d, spec), (r) => {
          const m = condMask(ds);
          for (const v of vars) {
            const src = ds.columns[v.id], dst = r.dataset.columns[v.id];
            for (let i = 0; i < ds.nCases; i++) {
              let want: unknown = src[i];
              if (m[i]) {
                const rr = refRecode(v, src[i], rules, v.type);
                if (rr !== undefined) want = typeof rr === 'string' ? rr.slice(0, v.width) : rr;
              }
              if (!eqv(dst[i], want)) return `${v.name} row ${i}: ${JSON.stringify(src[i])} -> ${JSON.stringify(dst[i])}, expected ${JSON.stringify(want)} (rules ${T.rulesSyntax(rules)})`;
            }
          }
          return null;
        });
      } else if (mode === 1) {
        const v = rng.pick(rng.bool(0.7) ? numVars(ds) : strVars(ds).length ? strVars(ds) : numVars(ds));
        const outType = rng.pick(['numeric', 'string'] as const);
        const rules = genRules(rng, ds, v, outType);
        const name = rng.bool(0.9) ? `rec_${t}` : rng.pick(['', v.name, '9bad', 'AND']);
        const width = outType === 'string' ? rng.pick([undefined, 1, 8, 40]) : undefined;
        const spec = { targets: [{ sourceId: v.id, name, label: 'Recoded' }], rules, outType, width, condition: cond, valueLabels: rng.bool(0.3) ? [{ value: outType === 'numeric' ? 1 : 'a', label: 'One' }] : undefined };
        runT('recodeDifferent', seed, ds, spec, (d) => T.recodeDifferent(d, spec), (r) => {
          const nv = r.dataset.variables.find((x) => x.name === name);
          if (!nv) return `new variable ${name} missing`;
          const m = condMask(ds);
          const w = width ?? 8;
          for (let i = 0; i < ds.nCases; i++) {
            let want: unknown = outType === 'numeric' ? NaN : '';
            if (m[i]) {
              const rr = refRecode(v, ds.columns[v.id][i], rules, outType);
              if (rr !== undefined) want = typeof rr === 'string' ? rr.slice(0, w) : rr;
            }
            const got = r.dataset.columns[nv.id][i];
            if (!eqv(got, want)) return `row ${i}: ${JSON.stringify(ds.columns[v.id][i])} -> ${JSON.stringify(got)}, expected ${JSON.stringify(want)} (rules ${T.rulesSyntax(rules)})`;
          }
          return null;
        });
      } else {
        const v = rng.pick(ds.variables);
        const spec = { items: [{ sourceId: v.id, name: rng.bool(0.9) ? `ar_${t}` : v.name }], descending: rng.bool() };
        runT('autoRecode', seed, ds, spec, (d) => T.autoRecode(d, spec), (r) => {
          const nv = r.dataset.variables.find((x) => x.name === spec.items[0].name)!;
          const c = r.dataset.columns[nv.id] as Float64Array;
          // Same source value -> same code; different values -> different codes; labels for every code.
          const map = new Map<string, number>();
          for (let i = 0; i < ds.nCases; i++) {
            const x = ds.columns[v.id][i];
            const key = typeof x === 'string' ? x.trimEnd() : String(x);
            if (Number.isNaN(c[i])) continue;
            if (map.has(key) && map.get(key) !== c[i]) return `value ${key} got two codes`;
            map.set(key, c[i]);
            if (!nv.valueLabels.some((l) => l.value === c[i])) return `code ${c[i]} has no value label`;
          }
          if (new Set(map.values()).size !== map.size) return 'two values share one code';
          // Order: ascending (or descending) among valid values.
          const pairs = [...map.entries()].filter(([k]) => { const x = v.type === 'numeric' ? Number(k) : k; return !isMissingValue(v, x as never); });
          const sorted = pairs.slice().sort((a, b) => a[1] - b[1]).map(([k]) => (v.type === 'numeric' ? Number(k) : k));
          for (let k = 1; k < sorted.length; k++) {
            const a = sorted[k - 1], b = sorted[k];
            const ok = spec.descending ? a > b : a < b;
            if (!ok) return `codes not in ${spec.descending ? 'descending' : 'ascending'} value order: ${JSON.stringify(a)} before ${JSON.stringify(b)}`;
          }
          return null;
        });
      }
    }
  }, 60_000);
});

describe('binning, select, sort, weight', () => {
  it('visual binning', () => {
    for (let t = 0; t < N(1500); t++) {
      const seed = makeRng(SEED).fork(`bin#${t}`).seed;
      const { rng, ds } = dsFor(seed);
      const v = rng.pick(rng.bool(0.95) ? numVars(ds) : ds.variables);
      const method = rng.pick([
        { kind: 'width', intervals: rng.pick([2, 3, 5, 10, 1, 0, 101, 2.5]) },
        { kind: 'widthFrom', first: rng.pick([0, 10, -5, 1e6]), width: rng.pick([1, 5, 0.1, 0, -1, 1e-9]) },
        { kind: 'count', groups: rng.pick([2, 4, 10, 1, 1000]) },
        { kind: 'custom', cuts: rng.pick([[18, 30, 45, 65], [2.5], [], [NaN], [5, 5, 3], [-1e300, 1e300], [Infinity]]) },
      ] as T.BinMethod[]);
      const spec = { sourceId: v.id, name: rng.bool(0.95) ? `bin_${t}` : v.name, method, upperIncluded: rng.bool(0.7) };
      runT('visualBin', seed, ds, spec, (d) => T.visualBin(d, spec), (r) => {
        const nv = r.dataset.variables.find((x) => x.name === spec.name)!;
        const c = r.dataset.columns[nv.id] as Float64Array;
        const src = ds.columns[v.id] as Float64Array;
        const k = nv.valueLabels.length;
        for (const l of nv.valueLabels) if (/\d--\d|NaN|undefined|Infinity/.test(l.label)) return `odd bin label "${l.label}"`;
        if (new Set(nv.valueLabels.map((l) => l.label)).size !== k) return `duplicate bin labels: ${nv.valueLabels.map((l) => l.label).join(' | ')}`;
        const idx = Array.from({ length: ds.nCases }, (_, i) => i).filter((i) => !isMissingValue(v, src[i]));
        for (const i of idx) if (!(c[i] >= 1 && c[i] <= k && Number.isInteger(c[i]))) return `row ${i}: value ${src[i]} got bin ${c[i]} (bins 1..${k})`;
        for (let i = 0; i < ds.nCases; i++) if (isMissingValue(v, src[i]) && !Number.isNaN(c[i])) return `missing value ${src[i]} got bin ${c[i]}`;
        const sorted = idx.slice().sort((a, b) => src[a] - src[b]);
        for (let j = 1; j < sorted.length; j++) if (c[sorted[j]] < c[sorted[j - 1]]) return `bins not monotonic: ${src[sorted[j - 1]]} -> ${c[sorted[j - 1]]}, ${src[sorted[j]]} -> ${c[sorted[j]]}`;
        return null;
      });
    }
  }, 60_000);

  it('select cases (filter and delete)', () => {
    for (let t = 0; t < N(1500); t++) {
      const seed = makeRng(SEED).fork(`select#${t}`).seed;
      const { rng, ds } = dsFor(seed);
      const g = exprGenerator(rng, ds);
      const method = rng.pick([
        { kind: 'all' },
        { kind: 'if', condition: rng.bool(0.95) ? render(g.num(2)) : rng.pick(["'text'", 'x +', '']) },
        { kind: 'percent', percent: rng.pick([10, 50, 99.9, 0, 100, -5]), seed: rng.int(0, 1e6) },
        { kind: 'exact', n: rng.pick([1, 3, 10, 0, 1e6]), ofFirst: rng.pick([1, 5, 20, 1e6, 0]), seed: rng.int(0, 1e6) },
        { kind: 'range', from: rng.pick([1, 2, 0]), to: rng.pick([1, 3, 100, 0]) },
        { kind: 'variable', varId: rng.pick(ds.variables).id },
      ] as T.SelectMethod[]);
      const output = rng.pick(['filter', 'delete'] as const);
      const spec = { method, output };
      runT('selectCasesTransform', seed, ds, spec, (d) => T.selectCasesTransform(d, method, output), (r) => {
        if (method.kind === 'all') return r.dataset.filterVarId === null ? null : 'filter still on after "all cases"';
        const sel = T.selectionValues(ds, method);
        const chosen = Array.from(sel).map((x, i) => (x === 1 ? i : -1)).filter((i) => i >= 0);
        if (method.kind === 'exact' && chosen.length !== Math.min(Math.floor(method.n), Math.min(Math.floor(method.ofFirst), ds.nCases))) return `exact sample picked ${chosen.length} cases, asked ${method.n} of first ${method.ofFirst}`;
        if (output === 'delete') {
          if (r.dataset.nCases !== chosen.length) return `delete kept ${r.dataset.nCases} cases, ${chosen.length} were selected`;
          for (const v of ds.variables) for (let j = 0; j < chosen.length; j++) if (!eqv(r.dataset.columns[v.id][j], ds.columns[v.id][chosen[j]])) return `row ${j} of ${v.name} is not original row ${chosen[j]}`;
          return null;
        }
        const f = r.dataset.filterVarId;
        if (!f) return 'no filter variable set';
        const mask = activeCaseMask(r.dataset);
        for (let i = 0; i < ds.nCases; i++) if (!!mask[i] !== (sel[i] === 1)) return `row ${i}: active=${mask[i]} but selected=${sel[i]}`;
        if (r.dataset.nCases !== ds.nCases) return 'filter changed the number of cases';
        return null;
      });
    }
    // Existing filter_$ variables of the "wrong" type, and filter_$1 already taken.
    const seed = SEED;
    const vs = [makeVariable({ name: 'filter_$', type: 'string', width: 4 }), makeVariable({ name: 'filter_$1' }), makeVariable({ name: 'age' })];
    const ds = makeDataset({ name: 'f', variables: vs, columns: { [vs[0].id]: ['a', 'b', 'c'], [vs[1].id]: Float64Array.of(1, 2, 3), [vs[2].id]: Float64Array.of(20, 40, 60) }, nCases: 3 });
    runT('selectCasesTransform', seed, ds, { condition: 'age > 30', names: 'filter_$ (string), filter_$1 exist' }, (d) => T.selectCasesTransform(d, { kind: 'if', condition: 'age > 30' }, 'filter'));
  }, 60_000);

  it('sort and weight', () => {
    for (let t = 0; t < N(800); t++) {
      const seed = makeRng(SEED).fork(`sort#${t}`).seed;
      const { rng, ds } = dsFor(seed);
      const keys = rng.sample(ds.variables, rng.int(1, 3)).map((v) => ({ varId: v.id, dir: rng.pick(['asc', 'desc'] as const) }));
      runT('sortCases', seed, ds, keys, (d) => T.sortCases(d, keys), (r) => {
        // Permutation + order.
        const idCol = ds.variables[0];
        const a = Array.from(ds.columns[idCol.id] as ArrayLike<unknown>).map(String).sort();
        const b = Array.from(r.dataset.columns[idCol.id] as ArrayLike<unknown>).map(String).sort();
        if (a.join('|') !== b.join('|')) return 'sort lost or duplicated values';
        for (let i = 1; i < r.dataset.nCases; i++) {
          for (const k of keys) {
            const c = r.dataset.columns[k.varId];
            const x = c[i - 1], y = c[i];
            let cmp: number;
            if (typeof x === 'number') cmp = Number.isNaN(x) && Number.isNaN(y as number) ? 0 : Number.isNaN(x) ? -1 : Number.isNaN(y as number) ? 1 : x - (y as number);
            else cmp = (x as string).trimEnd() < (y as string).trimEnd() ? -1 : (x as string).trimEnd() > (y as string).trimEnd() ? 1 : 0;
            if (k.dir === 'desc') cmp = -cmp;
            if (cmp < 0) break;
            if (cmp > 0) return `rows ${i - 1},${i} out of order on ${ds.variables.find((v) => v.id === k.varId)?.name}`;
          }
        }
        return null;
      });
      const wv = rng.pick(ds.variables);
      runT('weightCases', seed, ds, { varId: wv.id }, (d) => T.weightCases(d, wv.id), (r) => (r.dataset.weightVarId === wv.id ? null : 'weight not set'));
    }
  }, 60_000);
});

describe('aggregate and merge', () => {
  it('aggregate matches a reference group-by', () => {
    const fns = T.AGG_FUNCTIONS.map((f) => f.id);
    for (let t = 0; t < N(1200); t++) {
      const seed = makeRng(SEED).fork(`agg#${t}`).seed;
      const { rng, ds } = dsFor(seed);
      const breaks = rng.sample(ds.variables.filter((v) => v.id !== ds.weightVarId), rng.int(0, 2));
      const items = Array.from({ length: rng.int(1, 3) }, (_, k) => {
        const fn = rng.pick(fns);
        const src = rng.bool(0.9) ? rng.pick(numVars(ds)) : rng.pick(ds.variables);
        return { fn, sourceId: fn === 'n' || fn === 'nu' ? undefined : src.id, name: `agg${k}_${fn}` };
      });
      const output = rng.pick(['add', 'new'] as const);
      const spec: T.AggregateSpec = { breakIds: breaks.map((b) => b.id), items, output };
      const r = runT('aggregate', seed, ds, spec, (d) => T.aggregate(d, spec), (res) => {
        const mask = activeCaseMask(ds);
        const w = caseWeights(ds);
        const key = (i: number) => breaks.map((b) => { const x = ds.columns[b.id][i]; return typeof x === 'string' ? 's' + x.trimEnd() : Number.isNaN(x) ? 'm' : 'n' + x; }).join('\u0001');
        const groups = new Map<string, number[]>();
        for (let i = 0; i < ds.nCases; i++) if (mask[i]) groups.set(key(i), [...(groups.get(key(i)) ?? []), i]);
        const ref = (it: (typeof items)[number], rows: number[]): number | string => {
          if (it.fn === 'n') return rows.reduce((s, i) => s + (w[i] > 0 ? w[i] : 0), 0);
          if (it.fn === 'nu') return rows.length;
          const v = ds.variables.find((x) => x.id === it.sourceId)!;
          const c = ds.columns[v.id];
          const valid = rows.filter((i) => w[i] > 0 && !isMissingValue(v, c[i]));
          // SPSS N(var) / NMISS(var): weighted counts of valid / missing values (strings too).
          if (it.fn === 'nvalid') return valid.reduce((s, i) => s + w[i], 0);
          if (it.fn === 'nmiss') return rows.filter((i) => w[i] > 0 && isMissingValue(v, c[i])).reduce((s, i) => s + w[i], 0);
          if (it.fn === 'first' || it.fn === 'last') return valid.length ? c[valid[it.fn === 'first' ? 0 : valid.length - 1]] : v.type === 'numeric' ? NaN : '';
          if (!valid.length) return v.type === 'numeric' ? NaN : '';
          if (v.type === 'string') {
            const ss = valid.map((i) => (c[i] as string).trimEnd()).sort();
            return it.fn === 'min' ? ss[0] : ss[ss.length - 1];
          }
          const xs = valid.map((i) => c[i] as number), ws = valid.map((i) => w[i]);
          if (it.fn === 'min') return xs.reduce((a, b) => Math.min(a, b), Infinity);
          if (it.fn === 'max') return xs.reduce((a, b) => Math.max(a, b), -Infinity);
          const sw = ws.reduce((a, b) => a + b, 0), sx = xs.reduce((a, x, j) => a + x * ws[j], 0);
          if (it.fn === 'sum') return sx;
          const mean = sx / sw;
          if (it.fn === 'mean') return mean;
          const ss = xs.reduce((a, x, j) => a + ws[j] * (x - mean) ** 2, 0);
          return sw > 1 ? Math.sqrt(ss / (sw - 1)) : NaN;
        };
        const close = (a: unknown, b: unknown) => eqv(a, b) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a)));
        if (output === 'add') {
          for (let i = 0; i < ds.nCases; i++) {
            const rows = groups.get(key(i));
            items.forEach((it) => {
              const nv = res.dataset.variables.find((x) => x.name === it.name)!;
              const got = res.dataset.columns[nv.id][i];
              const want = rows ? ref(it, rows) : nv.type === 'numeric' ? NaN : '';
              if (!close(got, want)) throw new Error(`row ${i} ${it.name}: ${got} vs reference ${want}`);
            });
          }
          return null;
        }
        const nd = (res as T.TransformResult & { newDataset?: Dataset }).newDataset;
        if (!nd) return 'no new dataset';
        if (nd.nCases !== groups.size) return `${nd.nCases} groups in the new dataset, reference has ${groups.size}`;
        for (const p of structureProblems(nd)) return `new dataset: ${p}`;
        return null;
      });
      void r;
    }
    // Large group: MIN/MAX over 200k cases must not overflow the call stack.
    const n = 200_000;
    const v = makeVariable({ name: 'x' });
    const big = makeDataset({ name: 'big', variables: [v], columns: { [v.id]: Float64Array.from({ length: n }, (_, i) => i % 1000) }, nCases: n });
    const spec: T.AggregateSpec = { breakIds: [], items: [{ fn: 'max', sourceId: v.id, name: 'xmax' }, { fn: 'min', sourceId: v.id, name: 'xmin' }], output: 'add' };
    runT('aggregate', SEED, big, { n, spec }, (d) => T.aggregate(d, spec));
    // The error for an unsupported summary of a string variable must not suggest one that is refused next.
    const sv = makeVariable({ name: 'region', type: 'string', width: 8 });
    const sds = makeDataset({ name: 's', variables: [sv], columns: { [sv.id]: ['North', 'South'] }, nCases: 2 });
    const msg = (fn: T.AggFunction) => {
      try {
        T.aggregate(sds, { breakIds: [], items: [{ fn, sourceId: sv.id, name: 'r_x' }], output: 'add' });
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    };
    const sdMsg = msg('sd');
    for (const fn of ['min', 'max'] as const) {
      const m = msg(fn);
      if (sdMsg && /minimum|maximum/i.test(sdMsg) && m) fail('aggregate', 'message-contradiction', `for a string variable the error suggests "${sdMsg}", but choosing ${fn} then fails with "${m}"`, SEED, `aggregate(ds /* string variable region */, { breakIds: [], items: [{ fn: 'sd' | '${fn}', sourceId: region.id, name: 'r_x' }], output: 'add' })`);
    }
  }, 60_000);

  it('merge: add cases and add variables', () => {
    for (let t = 0; t < N(600); t++) {
      const seed = makeRng(SEED).fork(`merge#${t}`).seed;
      const { rng, ds } = dsFor(seed, { weight: 'none', filter: false });
      const other = genDataset(rng.fork('other'), { nCases: rng.pick([0, 1, 3, 10]), extra: rng.int(0, 3) }).ds;
      // Share some names with the active file (possibly with a different type).
      other.variables = other.variables.map((v, k) => (k < ds.variables.length && rng.bool(0.5) ? { ...v, name: ds.variables[k].name } : v));
      if (new Set(other.variables.map((v) => v.name.toLowerCase())).size !== other.variables.length) continue;
      const opts = { keepUnpaired: rng.bool(0.7), sourceVar: rng.bool(0.3) ? rng.pick(['source01', ds.variables[0].name, '']) : undefined };
      runT('addCases', seed, ds, opts, (d) => T.addCases(d, other, opts), (r) => {
        if (r.dataset.nCases !== ds.nCases + other.nCases) return `${r.dataset.nCases} cases, expected ${ds.nCases}+${other.nCases}`;
        const pairing = T.pairVariables(ds, other);
        for (const p of pairing.paired) {
          const nv = r.dataset.variables.find((x) => x.name.toLowerCase() === p.active.name.toLowerCase())!;
          const c = r.dataset.columns[nv.id];
          for (let i = 0; i < ds.nCases; i++) if (!eqv(c[i], ds.columns[p.active.id][i])) return `${nv.name} row ${i} changed`;
          for (let i = 0; i < other.nCases; i++) {
            const want = other.columns[p.other.id][i];
            const got = c[ds.nCases + i];
            if (!eqv(got, want) && !(typeof want === 'string' && typeof got === 'string' && got === want.slice(0, nv.width))) return `${nv.name} row ${ds.nCases + i}: ${JSON.stringify(got)} vs ${JSON.stringify(want)}`;
          }
        }
        return null;
      });
      const byOrder = { mode: 'order' as const };
      runT('addVariables', seed, ds, byOrder, (d) => T.addVariables(d, other, byOrder));
      const key = rng.pick(ds.variables);
      if (other.variables.length) other.variables[0] = { ...other.variables[0], name: key.name };
      const byKey = { mode: 'key' as const, key: key.name, lookup: rng.bool(), keepUnmatchedOther: rng.bool() };
      runT('addVariables', seed, ds, byKey, (d) => T.addVariables(d, other, byKey));
    }
  }, 60_000);
});

describe('derived variables', () => {
  it('reverse-code, scales, z-scores, count, rank', () => {
    for (let t = 0; t < N(1000); t++) {
      const seed = makeRng(SEED).fork(`derive#${t}`).seed;
      const { rng, ds } = dsFor(seed);
      const nv = numVars(ds);
      const pickVars = (k: number) => rng.sample(rng.bool(0.95) ? nv : ds.variables, k);
      const rev = { varIds: pickVars(rng.int(1, 3)).map((v) => v.id), mode: rng.pick(['new', 'replace'] as const), range: rng.bool(0.2) ? { min: rng.pick([1, 0, 5]), max: rng.pick([5, 1, 7]) } : undefined };
      runT('reverseCode', seed, ds, rev, (d) => T.reverseCode(d, rev));
      const items = pickVars(rng.int(1, 4));
      const scale = { itemIds: items.map((v) => v.id), method: rng.pick(['mean', 'sum'] as const), minValid: rng.pick([1, 2, 0, 99, 1.5]), name: `sc_${t}` };
      runT('createScale', seed, ds, scale, (d) => T.createScale(d, scale), (r) => {
        const v = r.dataset.variables.find((x) => x.name === scale.name)!;
        const c = compileSafe(ds, `${scale.method.toUpperCase()}.${Math.max(1, Math.min(items.length, Math.round(scale.minValid)))}(${items.map((x) => x.name).join(', ')})`);
        if (!c) return null;
        for (let i = 0; i < ds.nCases; i++) {
          const a = r.dataset.columns[v.id][i] as number, b = c.evaluate(i) as number;
          if (!(Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b)) || Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)))) return `row ${i}: scale ${a} but COMPUTE ${scale.method.toUpperCase()}.n gives ${b}`;
        }
        return null;
      });
      const z = pickVars(rng.int(1, 2)).map((v) => v.id);
      runT('standardize', seed, ds, z, (d) => T.standardize(d, z));
      const cnt = { varIds: pickVars(rng.int(1, 3)).map((v) => v.id), values: [rng.pick<RecodeFrom>([{ kind: 'value', value: 1 }, { kind: 'missing' }, { kind: 'sysmis' }, { kind: 'range', lo: 1, hi: 3 }, { kind: 'value', value: 'x' }])], name: `cnt_${t}` };
      runT('countValues', seed, ds, cnt, (d) => T.countValues(d, cnt));
      const rank = { varIds: pickVars(rng.int(1, 2)).map((v) => v.id), order: rng.pick(['asc', 'desc'] as const), ties: rng.pick(['mean', 'low', 'high', 'condense'] as const), type: rng.pick(['rank', 'percent', 'ntiles'] as const), ntiles: rng.pick([4, 2, 100, 1, 0]) };
      runT('rankCases', seed, ds, rank, (d) => T.rankCases(d, rank), (r) => {
        const made = r.dataset.variables.slice(ds.variables.length);
        for (const v of made) {
          const c = r.dataset.columns[v.id] as Float64Array;
          for (let i = 0; i < c.length; i++) if (!Number.isNaN(c[i]) && !(c[i] > 0)) return `${v.name} row ${i}: rank value ${c[i]}`;
          if (rank.type === 'ntiles') for (let i = 0; i < c.length; i++) if (!Number.isNaN(c[i]) && c[i] > rank.ntiles) return `${v.name}: group ${c[i]} > ${rank.ntiles}`;
        }
        return null;
      });
    }
  }, 60_000);
});

function compileSafe(ds: Dataset, src: string) {
  try {
    return T.compileExpression(ds, src);
  } catch {
    return null;
  }
}

describe('gate', () => {
  it('no new failures (known ones are listed in tests/fuzz/known-issues.ts)', () => {
    const g = col.gate();
    out(`[fuzz:transforms-ops] seed ${SEED}\n${g.summary}`);
    expect(g.unknown, g.summary).toEqual([]);
  });
});
