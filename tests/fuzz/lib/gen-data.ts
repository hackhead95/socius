// Random SPSS-like datasets for fuzzing: mixed types, measurement levels, value labels, user-missing
// codes (discrete and ranges), system-missing, constant and all-missing columns, tiny n, huge values,
// ties, weights (integer / fractional / zero / negative / missing), filters, long and Unicode labels,
// names at the SPSS 64-byte limit. Everything is driven by an Rng so a seed reproduces the dataset.
import { makeDataset, makeVariable, type Column, type Dataset, type MissingSpec, type Variable } from '../../../src/core/types';
import type { Rng } from './rng';

export type VarKind =
  | 'scale'
  | 'scaleHuge'
  | 'scaleTiny'
  | 'scaleTies'
  | 'likert'
  | 'binary'
  | 'cat'
  | 'const'
  | 'allMissing'
  | 'allUserMissing'
  | 'date'
  | 'str'
  | 'strNum'
  | 'weight'
  | 'filter';

export interface GenVarMeta {
  id: string;
  kind: VarKind;
}

export interface GenDataset {
  ds: Dataset;
  meta: GenVarMeta[];
  /** Human description of what was generated (for reports). */
  desc: string;
}

export interface GenOptions {
  nCases?: number;
  weight?: 'none' | 'int' | 'frac' | 'bad';
  filter?: boolean;
  /** Extra random variables on top of the baseline set. */
  extra?: number;
  /** Probability of a system-missing cell in ordinary numeric variables. */
  sysmisRate?: number;
  unicode?: boolean;
}

const BENGALI = ['পুরুষ', 'মহিলা', 'শহর', 'গ্রাম', 'কলকাতা', 'ঢাকা'];
const HINDI = ['शहरी', 'ग्रामीण', 'पुरुष', 'महिला', 'दिल्ली'];
const LATIN = ['North', 'South', 'East', 'West', 'Centre ', 'x'];

const LONG_LABEL = 'How much do you agree or disagree with the following statement about your neighbourhood and the people who live in it, thinking about the past twelve months only, and not counting family members who live elsewhere? '.repeat(3).trim();

export const N_CHOICES = [1, 2, 3, 4, 5, 8, 12, 25, 40, 80, 150];

function spssDateSeconds(y: number, m: number, d: number): number {
  return (Date.UTC(y, m - 1, d) - Date.UTC(1582, 9, 14)) / 1000;
}

let nameCounter = 0;

function genName(rng: Rng, base: string, unicode: boolean): string {
  nameCounter++;
  const r = rng.next();
  if (unicode && r < 0.08) return `আয়${nameCounter}`; // Bengali, valid SPSS name characters
  if (unicode && r < 0.14) return `आय${nameCounter}`; // Hindi
  if (r < 0.2) {
    // Exactly 64 bytes (the SPSS limit).
    const tail = `_${nameCounter}`;
    return ('v' + base).padEnd(64 - tail.length, 'x') + tail;
  }
  return `${base}${nameCounter}`;
}

function genLabel(rng: Rng, fallback: string, unicode: boolean): string {
  const r = rng.next();
  if (r < 0.12) return LONG_LABEL;
  if (unicode && r < 0.22) return 'আপনার মাসিক আয় কত? (मासिक आय)';
  if (r < 0.3) return '';
  return fallback;
}

function missingSpecFor(rng: Rng, codes: { discrete?: number[]; range?: [number, number] }): MissingSpec {
  const m: MissingSpec = { discrete: codes.discrete ?? [] };
  if (codes.range) m.range = { lo: codes.range[0], hi: codes.range[1] };
  return m;
}

export function genVariable(rng: Rng, kind: VarKind, n: number, opts: GenOptions = {}): { v: Variable; col: Column } {
  const unicode = opts.unicode ?? true;
  const sys = opts.sysmisRate ?? 0.08;
  const f = new Float64Array(n);
  const withSysmis = () => {
    for (let i = 0; i < n; i++) if (rng.bool(sys)) f[i] = NaN;
  };
  switch (kind) {
    case 'scale':
    case 'scaleHuge':
    case 'scaleTiny':
    case 'scaleTies': {
      const scale = kind === 'scaleHuge' ? 1e12 : kind === 'scaleTiny' ? 1e-9 : rng.pick([1, 10, 1000]);
      const shift = kind === 'scaleHuge' ? 1e13 : rng.pick([0, 50, -20]);
      for (let i = 0; i < n; i++) {
        let x = shift + scale * rng.normal();
        if (kind === 'scaleTies') x = Math.round(x / Math.max(1, scale)) * Math.max(1, scale);
        f[i] = x;
      }
      withSysmis();
      const missing = rng.bool(0.3) ? missingSpecFor(rng, rng.bool() ? { discrete: [-99] } : { range: [-1e300, -999] }) : { discrete: [] };
      if (missing.discrete.length || missing.range) for (let i = 0; i < n; i++) if (rng.bool(0.06)) f[i] = missing.discrete[0] !== undefined ? (missing.discrete[0] as number) : -1000;
      const v = makeVariable({ name: genName(rng, kind, unicode), label: genLabel(rng, 'Monthly income', unicode), measure: 'scale', decimals: kind === 'scaleTies' ? 0 : 2, missing });
      return { v, col: f };
    }
    case 'likert': {
      const k = rng.pick([3, 4, 5, 7]);
      for (let i = 0; i < n; i++) f[i] = 1 + Math.floor(rng.next() * k);
      const style = rng.int(0, 3);
      const missing = style === 0 ? { discrete: [9] } : style === 1 ? { discrete: [-9, 8] } : style === 2 ? { discrete: [], range: { lo: 97, hi: 99 } } : { discrete: [] };
      const code = style === 0 ? 9 : style === 1 ? -9 : style === 2 ? 98 : NaN;
      for (let i = 0; i < n; i++) if (rng.bool(0.07)) f[i] = code;
      withSysmis();
      const labels = Array.from({ length: k }, (_, j) => ({ value: j + 1, label: unicode && rng.bool(0.2) ? `স্তর ${j + 1}` : `Level ${j + 1}` }));
      if (!Number.isNaN(code)) labels.push({ value: code, label: 'No answer' });
      const v = makeVariable({ name: genName(rng, 'likert', unicode), label: genLabel(rng, 'Trust in government', unicode), measure: rng.bool(0.85) ? 'ordinal' : 'scale', decimals: 0, valueLabels: labels, missing });
      return { v, col: f };
    }
    case 'binary': {
      const [a, b] = rng.pick([[0, 1], [1, 2], [1, 0]] as const);
      for (let i = 0; i < n; i++) f[i] = rng.bool(0.45) ? a : b;
      withSysmis();
      const v = makeVariable({
        name: genName(rng, 'bin', unicode), label: genLabel(rng, 'Respondent sex', unicode), measure: 'nominal', decimals: 0,
        valueLabels: [{ value: a, label: unicode && rng.bool(0.3) ? 'পুরুষ' : 'Male' }, { value: b, label: unicode && rng.bool(0.3) ? 'महिला' : 'Female' }],
      });
      return { v, col: f };
    }
    case 'cat': {
      const k = rng.int(3, 6);
      for (let i = 0; i < n; i++) f[i] = 1 + Math.floor(rng.next() * rng.next() * k); // skewed: rare top categories
      withSysmis();
      const labels = rng.bool(0.7) ? Array.from({ length: k }, (_, j) => ({ value: j + 1, label: `Region ${j + 1}` })) : [];
      const v = makeVariable({ name: genName(rng, 'cat', unicode), label: genLabel(rng, 'Region', unicode), measure: 'nominal', decimals: 0, valueLabels: labels, missing: rng.bool(0.3) ? { discrete: [k] } : { discrete: [] } });
      return { v, col: f };
    }
    case 'const': {
      f.fill(rng.pick([0, 1, 3, 7.5]));
      const v = makeVariable({ name: genName(rng, 'const', unicode), label: 'Constant', measure: rng.pick(['scale', 'nominal', 'ordinal'] as const), decimals: 0 });
      return { v, col: f };
    }
    case 'allMissing': {
      f.fill(NaN);
      const v = makeVariable({ name: genName(rng, 'empty', unicode), label: 'Not asked', measure: rng.pick(['scale', 'nominal'] as const), decimals: 0 });
      return { v, col: f };
    }
    case 'allUserMissing': {
      f.fill(9);
      const v = makeVariable({ name: genName(rng, 'allum', unicode), label: 'All refused', measure: rng.pick(['scale', 'ordinal', 'nominal'] as const), decimals: 0, missing: { discrete: [9] }, valueLabels: [{ value: 9, label: 'Refused' }] });
      return { v, col: f };
    }
    case 'date': {
      for (let i = 0; i < n; i++) f[i] = spssDateSeconds(rng.int(1940, 2030), rng.int(1, 12), rng.int(1, 28));
      withSysmis();
      const v = makeVariable({ name: genName(rng, 'date', unicode), label: 'Interview date', measure: 'scale', format: 'DATE11', width: 11, decimals: 0 });
      return { v, col: f };
    }
    case 'str':
    case 'strNum': {
      const pool = kind === 'strNum' ? ['1', '2', '10', ' 3', '4.5', ''] : unicode ? [...LATIN, ...BENGALI.slice(0, 3), ...HINDI.slice(0, 2), ''] : [...LATIN, ''];
      const k = rng.int(2, pool.length);
      const vals = rng.sample(pool, k);
      const s = new Array<string>(n);
      for (let i = 0; i < n; i++) s[i] = rng.bool(0.05) ? 'NA' : rng.pick(vals);
      const width = Math.max(8, ...s.map((x) => new TextEncoder().encode(x).length));
      const v = makeVariable({
        name: genName(rng, kind, unicode), label: genLabel(rng, 'Place of residence', unicode), type: 'string', width, measure: 'nominal',
        missing: rng.bool(0.5) ? { discrete: ['NA'] } : { discrete: [] },
        valueLabels: rng.bool(0.4) ? vals.filter((x) => x).slice(0, 3).map((x) => ({ value: x, label: `${x.trim()} (label)` })) : [],
      });
      return { v, col: s };
    }
    case 'weight': {
      const mode = opts.weight ?? 'int';
      for (let i = 0; i < n; i++) {
        if (mode === 'int') f[i] = rng.int(1, 3);
        else if (mode === 'frac') f[i] = rng.pick([0.5, 1.25, 2.5, 0.1, 1]);
        else f[i] = rng.pick([1, 2, 0, -1, NaN, 0.5, 1e-9]);
      }
      const v = makeVariable({ name: genName(rng, 'wt', unicode), label: 'Frequency weight', measure: 'scale', decimals: mode === 'int' ? 0 : 2 });
      return { v, col: f };
    }
    case 'filter': {
      for (let i = 0; i < n; i++) f[i] = rng.bool(0.1) ? NaN : rng.bool(0.7) ? 1 : 0;
      if (n > 0) f[0] = 1; // keep at least one case
      const v = makeVariable({ name: genName(rng, 'filt', unicode), label: 'Selected', measure: 'nominal', decimals: 0 });
      return { v, col: f };
    }
  }
}

const EXTRA_KINDS: VarKind[] = ['scale', 'scaleHuge', 'scaleTiny', 'scaleTies', 'likert', 'binary', 'cat', 'const', 'allMissing', 'allUserMissing', 'date', 'str', 'strNum'];

export function genDataset(rng: Rng, opts: GenOptions = {}): GenDataset {
  nameCounter = 0; // names depend only on the rng, not on earlier datasets
  const n = opts.nCases ?? rng.pick(N_CHOICES);
  const kinds: VarKind[] = ['scale', 'scale', 'scaleTies', 'likert', 'likert', 'binary', 'cat', 'str'];
  const extra = opts.extra ?? rng.int(0, 4);
  for (let i = 0; i < extra; i++) kinds.push(rng.pick(EXTRA_KINDS));
  const variables: Variable[] = [];
  const columns: Record<string, Column> = {};
  const meta: GenVarMeta[] = [];
  for (const k of kinds) {
    const { v, col } = genVariable(rng, k, n, opts);
    variables.push(v);
    columns[v.id] = col;
    meta.push({ id: v.id, kind: k });
  }
  let weightVarId: string | null = null;
  let filterVarId: string | null = null;
  if (opts.weight && opts.weight !== 'none') {
    const { v, col } = genVariable(rng, 'weight', n, opts);
    variables.push(v);
    columns[v.id] = col;
    meta.push({ id: v.id, kind: 'weight' });
    weightVarId = v.id;
  }
  if (opts.filter) {
    const { v, col } = genVariable(rng, 'filter', n, opts);
    variables.push(v);
    columns[v.id] = col;
    meta.push({ id: v.id, kind: 'filter' });
    filterVarId = v.id;
  }
  const ds = makeDataset({ name: 'fuzz', variables, columns, nCases: n, weightVarId, filterVarId });
  return { ds, meta, desc: `n=${n} kinds=[${kinds.join(',')}] weight=${opts.weight ?? 'none'} filter=${!!opts.filter}` };
}

// ---------- dataset utilities for metamorphic checks ----------

export function cloneDataset(ds: Dataset): Dataset {
  const columns: Record<string, Column> = {};
  for (const [k, c] of Object.entries(ds.columns)) columns[k] = c instanceof Float64Array ? new Float64Array(c) : c.slice();
  return { ...ds, variables: structuredClone(ds.variables), columns, documents: ds.documents.slice() };
}

/** Keep only the given rows (in order). */
export function subsetRows(ds: Dataset, rows: number[]): Dataset {
  const columns: Record<string, Column> = {};
  for (const [k, c] of Object.entries(ds.columns)) columns[k] = c instanceof Float64Array ? Float64Array.from(rows, (i) => c[i]) : rows.map((i) => c[i]);
  return { ...ds, columns, nCases: rows.length, version: ds.version + 1 };
}

/** Replicate case i w[i] times (integer weights), and drop the weight. */
export function replicateByWeight(ds: Dataset): Dataset {
  const wc = ds.columns[ds.weightVarId!] as Float64Array;
  const rows: number[] = [];
  for (let i = 0; i < ds.nCases; i++) {
    const w = wc[i];
    if (!(w > 0)) continue;
    for (let k = 0; k < w; k++) rows.push(i);
  }
  return { ...subsetRows(ds, rows), weightVarId: null };
}

/** Stable, typed-array-aware deep equality with NaN == NaN. Returns a path of the first difference or null. */
export function deepDiff(a: unknown, b: unknown, path = '$'): string | null {
  if (Object.is(a, b)) return null;
  if (typeof a === 'number' && typeof b === 'number') return Number.isNaN(a) && Number.isNaN(b) ? null : `${path}: ${a} != ${b}`;
  if (a instanceof Float64Array || b instanceof Float64Array) {
    if (!(a instanceof Float64Array) || !(b instanceof Float64Array)) return `${path}: typed array vs ${Object.prototype.toString.call(b)}`;
    if (a.length !== b.length) return `${path}.length: ${a.length} != ${b.length}`;
    for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i]) && !(Number.isNaN(a[i]) && Number.isNaN(b[i]))) return `${path}[${i}]: ${a[i]} != ${b[i]}`;
    return null;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return `${path}: array vs non-array`;
    if (a.length !== b.length) return `${path}.length: ${a.length} != ${b.length}`;
    for (let i = 0; i < a.length; i++) {
      const d = deepDiff(a[i], b[i], `${path}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as object).filter((k) => (a as any)[k] !== undefined).sort();
    const kb = Object.keys(b as object).filter((k) => (b as any)[k] !== undefined).sort();
    if (ka.join(',') !== kb.join(',')) return `${path}: keys [${ka.join(',')}] != [${kb.join(',')}]`;
    for (const k of ka) {
      const d = deepDiff((a as any)[k], (b as any)[k], `${path}.${k}`);
      if (d) return d;
    }
    return null;
  }
  return `${path}: ${JSON.stringify(a)?.slice(0, 80)} != ${JSON.stringify(b)?.slice(0, 80)}`;
}

/** Compact TypeScript that rebuilds a (small) dataset: used in minimal reproductions. */
export function datasetToCode(ds: Dataset): string {
  const num = (x: number) => (Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : String(x));
  const lines: string[] = [];
  lines.push(`const vars = [`);
  for (const v of ds.variables) {
    const p: Record<string, unknown> = { id: v.id, name: v.name, type: v.type, measure: v.measure };
    if (v.label) p.label = v.label.length > 60 ? v.label.slice(0, 60) + '…' : v.label;
    if (v.format !== (v.type === 'string' ? `A${v.width}` : `F${v.width}.${v.decimals}`)) p.format = v.format;
    if (v.type === 'string') p.width = v.width;
    else p.decimals = v.decimals;
    if (v.valueLabels.length) p.valueLabels = v.valueLabels;
    if (v.missing.discrete.length || v.missing.range) p.missing = v.missing;
    lines.push(`  makeVariable(${JSON.stringify(p).replace(/"(-?Infinity|NaN)"/g, '$1')}),`);
  }
  lines.push(`];`);
  lines.push(`const columns = {`);
  for (const v of ds.variables) {
    const c = ds.columns[v.id];
    const body = c instanceof Float64Array ? `new Float64Array([${Array.from(c, num).join(', ')}])` : JSON.stringify(c);
    lines.push(`  ${JSON.stringify(v.id)}: ${body},`);
  }
  lines.push(`};`);
  lines.push(
    `const ds = makeDataset({ name: 'repro', variables: vars, columns, nCases: ${ds.nCases}, weightVarId: ${JSON.stringify(ds.weightVarId)}, filterVarId: ${JSON.stringify(ds.filterVarId)} });`,
  );
  return lines.join('\n');
}

/** Keep only the listed variables (plus weight/filter). */
export function keepVariables(ds: Dataset, ids: Set<string>): Dataset {
  const keep = new Set(ids);
  if (ds.weightVarId) keep.add(ds.weightVarId);
  if (ds.filterVarId) keep.add(ds.filterVarId);
  const variables = ds.variables.filter((v) => keep.has(v.id));
  const columns: Record<string, Column> = {};
  for (const v of variables) columns[v.id] = ds.columns[v.id];
  return { ...ds, variables, columns };
}
