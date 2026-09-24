// Every core procedure produces a well-formed OutputItem on a synthetic survey dataset with value
// labels, user-missing codes, a weight variable and a filter; weights, filters and missing values
// change N as SPSS would; integer weights give the same results as replicated cases.
import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable, type Dataset, type Variable } from '../../src/core/types';
import { defaultOptions, type OptionValues, type ProcedureDef, type SlotValues } from '../../src/core/procedure';
import type { Cell, OutputItem, OutputTable } from '../../src/core/output';
import { coreProcedures } from '../../src/procedures/core';
import { seededRandom } from '../../src/lib/stats/util';

function build(opts: { n?: number; weighted?: boolean; filtered?: boolean; seed?: number; replicate?: boolean } = {}): Dataset {
  const n = opts.n ?? 120;
  const rand = seededRandom(opts.seed ?? 7);
  const norm = () => {
    const u = Math.max(rand(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  const vars: Variable[] = [
    makeVariable({ name: 'id', decimals: 0, measure: 'nominal' }),
    makeVariable({ name: 'sex', label: 'Respondent sex', decimals: 0, measure: 'nominal', valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }] }),
    makeVariable({ name: 'educ', label: 'Highest education', decimals: 0, measure: 'ordinal', valueLabels: [{ value: 1, label: 'Primary' }, { value: 2, label: 'Secondary' }, { value: 3, label: 'Graduate' }, { value: 9, label: 'No answer' }], missing: { discrete: [9] } }),
    makeVariable({ name: 'trust', label: 'Trust in local government', decimals: 0, measure: 'ordinal', valueLabels: [{ value: 1, label: 'Low' }, { value: 2, label: 'Medium' }, { value: 3, label: 'High' }] }),
    makeVariable({ name: 'income', label: 'Monthly income', decimals: 0, measure: 'scale', missing: { discrete: [-1] } }),
    makeVariable({ name: 'age', label: 'Age in years', decimals: 0, measure: 'scale' }),
    makeVariable({ name: 'sat1', label: 'Satisfaction wave 1', decimals: 1, measure: 'scale' }),
    makeVariable({ name: 'sat2', label: 'Satisfaction wave 2', decimals: 1, measure: 'scale' }),
    makeVariable({ name: 'sat3', label: 'Satisfaction wave 3', decimals: 1, measure: 'scale' }),
    makeVariable({ name: 'region', label: 'Region', type: 'string', width: 8, measure: 'nominal' }),
    makeVariable({ name: 'urban', label: 'Urban residence', decimals: 0, measure: 'nominal', valueLabels: [{ value: 0, label: 'Rural' }, { value: 1, label: 'Urban' }] }),
    makeVariable({ name: 'wt', label: 'Frequency weight', decimals: 0, measure: 'scale' }),
    makeVariable({ name: 'filt', label: 'Filter', decimals: 0, measure: 'nominal' }),
  ];
  const cols: Record<string, Float64Array | string[]> = {};
  for (const v of vars) cols[v.id] = v.type === 'string' ? new Array<string>(n).fill('') : new Float64Array(n);
  const col = (name: string) => cols[vars.find((v) => v.name === name)!.id] as Float64Array;
  const regions = ['North', 'South', 'East', 'West'];
  for (let i = 0; i < n; i++) {
    const sex = rand() < 0.5 ? 1 : 2;
    const educ = i % 17 === 0 ? 9 : 1 + Math.floor(rand() * 3);
    const e = educ === 9 ? 2 : educ;
    col('id')[i] = i + 1;
    col('sex')[i] = sex;
    col('educ')[i] = educ;
    col('trust')[i] = Math.min(3, Math.max(1, Math.round(1 + 0.4 * e + 0.6 * rand() + (sex === 2 ? 0.3 : 0))));
    col('income')[i] = i % 13 === 0 ? -1 : i % 29 === 0 ? NaN : Math.round(800 + 400 * e + 150 * norm() + (sex === 1 ? 120 : 0));
    col('age')[i] = Math.round(20 + 50 * rand());
    const base = 5 + norm();
    col('sat1')[i] = Math.round(10 * base) / 10;
    col('sat2')[i] = Math.round(10 * (base + 0.3 + 0.5 * norm())) / 10;
    col('sat3')[i] = Math.round(10 * (base + 0.6 + 0.5 * norm())) / 10;
    (cols[vars.find((v) => v.name === 'region')!.id] as string[])[i] = regions[i % 4];
    col('urban')[i] = rand() < 0.6 ? 1 : 0;
    col('wt')[i] = 1 + (i % 3);
    col('filt')[i] = i % 10 === 0 ? 0 : 1;
  }
  const ds = makeDataset({ name: 'synthetic', variables: vars, columns: cols, nCases: n });
  if (opts.weighted) ds.weightVarId = vars.find((v) => v.name === 'wt')!.id;
  if (opts.filtered) ds.filterVarId = vars.find((v) => v.name === 'filt')!.id;
  return ds;
}

/** Replicate each case `wt` times (for comparing weighted results with expanded data). */
function replicate(ds: Dataset): Dataset {
  const wv = ds.variables.find((v) => v.name === 'wt')!;
  const w = ds.columns[wv.id] as Float64Array;
  const idx: number[] = [];
  for (let i = 0; i < ds.nCases; i++) for (let k = 0; k < w[i]; k++) idx.push(i);
  const cols: Record<string, Float64Array | string[]> = {};
  for (const v of ds.variables) {
    const c = ds.columns[v.id];
    cols[v.id] = c instanceof Float64Array ? Float64Array.from(idx.map((i) => c[i])) : idx.map((i) => (c as string[])[i]);
  }
  return makeDataset({ name: 'replicated', variables: ds.variables, columns: cols, nCases: idx.length });
}

const byName = (ds: Dataset, ...names: string[]) => names.map((n) => ds.variables.find((v) => v.name === n)!.id);

/** Checks that header and body rows tile a rectangular grid, honouring colSpan and rowSpan. */
function checkGeometry(t: OutputTable) {
  const width = (rows: Cell[][]) => {
    let carry: number[] = [];
    let w = -1;
    rows.forEach((row, ri) => {
      const next = carry.map((v) => Math.max(0, v - 1));
      const occ = (c: number) => (carry[c] ?? 0) > 0;
      let col = 0;
      for (const c of row) {
        while (occ(col)) col++;
        const span = c.colSpan ?? 1;
        for (let k = 0; k < span; k++) next[col + k] = (c.rowSpan ?? 1) - 1;
        col += span;
      }
      while (occ(col)) col++;
      if (w < 0) w = col;
      else if (col !== w) throw new Error(`Table "${t.title}": row ${ri} spans ${col} columns, expected ${w}`);
      for (let c = 0; c < next.length; c++) if (next[c] === undefined) next[c] = 0;
      carry = next;
    });
    if (carry.some((v) => v > 0)) throw new Error(`Table "${t.title}": a rowSpan runs past the last row`);
    return w;
  };
  const hw = width(t.header);
  const bw = width(t.rows);
  if (t.rows.length) expect(bw, `table "${t.title}" body width vs header width`).toBe(hw);
}

function checkItem(it: OutputItem, def: ProcedureDef) {
  expect(it.procedure).toBe(def.id);
  expect(it.title.length).toBeGreaterThan(0);
  expect(it.syntax && it.syntax.length).toBeTruthy();
  expect(it.caseNote && /N = /.test(it.caseNote)).toBeTruthy();
  const tables = it.blocks.filter((b) => b.kind === 'table');
  expect(tables.length).toBeGreaterThan(0);
  for (const b of tables) if (b.kind === 'table') checkGeometry(b.table);
  expect(it.blocks.some((b) => b.kind === 'text' && b.style === 'interpretation')).toBe(true);
  // JSON serialisable, no typed arrays
  const json = JSON.stringify(it);
  expect(json.includes('"0":')).toBe(false);
  for (const b of it.blocks) if (b.kind === 'text') expect(b.text).not.toMatch(/—|seamless|robust(?!ness)|leverage|delve|undefined|NaN/);
}

const proc = (id: string) => {
  const p = coreProcedures.find((d) => d.id === id);
  if (!p) throw new Error(`missing procedure ${id}`);
  return p;
};

function runProc(id: string, ds: Dataset, slots: Record<string, string[]>, opts: OptionValues = {}): OutputItem {
  const def = proc(id);
  const o = { ...defaultOptions(def), ...opts };
  const s: SlotValues = {};
  for (const [k, names] of Object.entries(slots)) s[k] = byName(ds, ...names);
  expect(def.validate ? def.validate(ds, s, o) : null).toBeNull();
  const it = def.run(ds, s, o);
  checkItem(it, def);
  return it;
}

function findTable(it: OutputItem, title: string): OutputTable {
  const b = it.blocks.find((x) => x.kind === 'table' && x.table.title === title);
  if (!b || b.kind !== 'table') throw new Error(`no table "${title}" in ${it.title}: ${it.blocks.filter((x) => x.kind === 'table').map((x) => (x.kind === 'table' ? x.table.title : '')).join(', ')}`);
  return b.table;
}

const num = (c: Cell) => c.v as number;

const CASES: Array<{ id: string; slots: Record<string, string[]>; opts?: OptionValues }> = [
  { id: 'frequencies', slots: { variables: ['educ', 'region', 'income'] }, opts: { mean: true, median: true, mode: true, sd: true, skewness: true, kurtosis: true, quartiles: true, percentiles: '10, 90', chart: 'bar' } },
  { id: 'frequencies', slots: { variables: ['income'] }, opts: { chart: 'histogram', showTables: false, mean: true } },
  { id: 'descriptives', slots: { variables: ['income', 'age', 'sat1'] }, opts: { skewness: true, kurtosis: true, seMean: true, variance: true, range: true, sum: true } },
  { id: 'explore', slots: { dependents: ['income', 'age'], factor: ['sex'] }, opts: { percentiles: true, histogram: true } },
  { id: 'explore', slots: { dependents: ['sat1'] } },
  { id: 'crosstabs', slots: { rows: ['educ'], columns: ['trust'] }, opts: { expected: true, colPct: true, totPct: true, stdRes: true, adjRes: true, cc: true, lambda: true, gamma: true, somersD: true, tauB: true, tauC: true, correlations: true, chart: true } },
  { id: 'crosstabs', slots: { rows: ['sex'], columns: ['urban'], layer: ['educ'] }, opts: { risk: true, cmh: true, mcnemar: false, exact: 'exact' } },
  { id: 'crosstabs', slots: { rows: ['sex', 'region'], columns: ['trust'] }, opts: { kappa: true, mcnemar: true } },
  { id: 'crosstabs', slots: { rows: ['educ'], columns: ['trust'] }, opts: { kappa: true, mcnemar: true, observed: false, rowPct: false } },
  { id: 'means', slots: { dependents: ['income', 'age'], layer1: ['educ'] }, opts: { anova: true, median: true, se: true } },
  { id: 'means', slots: { dependents: ['income'], layer1: ['sex'], layer2: ['urban'] } },
  { id: 'ttest-one-sample', slots: { variables: ['sat1', 'age'] }, opts: { testValue: 5 } },
  { id: 'ttest-independent', slots: { variables: ['income', 'sat1'], group: ['sex'] }, opts: { groups: [1, 2], chart: true } },
  { id: 'ttest-independent', slots: { variables: ['income'], group: ['age'] }, opts: { defineBy: 'cut', cutPoint: 45, groups: null } },
  { id: 'ttest-paired', slots: { first: ['sat1', 'sat1'], second: ['sat2', 'sat3'] } },
  { id: 'oneway-anova', slots: { dependents: ['income'], factor: ['educ'] }, opts: { tukey: true, bonferroni: true, scheffe: true, gamesHowell: true, subsets: true, brownForsythe: true, trend: true, plot: true } },
  { id: 'oneway-anova', slots: { dependents: ['sat1'], factor: ['region'] }, opts: { tukey: true } },
  { id: 'correlations', slots: { variables: ['income', 'age', 'sat1', 'sat2'] }, opts: { kendall: true, spearman: true, descriptives: true, heatmap: true } },
  { id: 'correlations', slots: { variables: ['sat1', 'sat2'] }, opts: { tails: 'one', missing: 'listwise' } },
  { id: 'partial-correlations', slots: { variables: ['sat1', 'sat2', 'income'], controls: ['age'] }, opts: { zeroOrder: true } },
  { id: 'chisquare-gof', slots: { variables: ['educ'] } },
  { id: 'chisquare-gof', slots: { variables: ['trust'] }, opts: { expected: 'values', expectedValues: '0.2 0.5 0.3' } },
  { id: 'binomial', slots: { variables: ['sex', 'urban'] } },
  { id: 'binomial', slots: { variables: ['age'] }, opts: { dichotomy: 'cut', cutPoint: 40, testProp: 0.3 } },
  { id: 'mann-whitney', slots: { variables: ['income', 'trust'], group: ['sex'] }, opts: { groups: [1, 2] } },
  { id: 'wilcoxon', slots: { first: ['sat1'], second: ['sat2'] } },
  { id: 'kruskal-wallis', slots: { variables: ['income'], group: ['educ'] }, opts: { dunn: true } },
  { id: 'friedman', slots: { variables: ['sat1', 'sat2', 'sat3'] } },
];

describe('core procedures produce well-formed output', () => {
  it('registers every procedure once, with the expected menus', () => {
    const ids = coreProcedures.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(17);
    for (const p of coreProcedures) {
      expect(['Descriptive Statistics', 'Compare Means', 'Nonparametric Tests', 'Correlate']).toContain(p.menu);
      expect(p.description.length).toBeGreaterThan(20);
      for (const o of p.options) if ('default' in o && o.type === 'select') expect(o.choices.some((c) => c.value === o.default)).toBe(true);
    }
  });
  for (const variant of [{ weighted: false, filtered: false }, { weighted: true, filtered: true }]) {
    for (const c of CASES) {
      it(`${c.id} ${JSON.stringify(c.slots)}${variant.weighted ? ' (weighted, filtered)' : ''}`, () => {
        const ds = build(variant);
        const it = runProc(c.id, ds, c.slots, c.opts);
        if (variant.weighted) expect(it.caseNote).toMatch(/weighted by wt/);
        if (variant.filtered) expect(it.caseNote).toMatch(/filtered out by filt/);
        if (variant.weighted) expect(it.syntax).toMatch(/WEIGHT BY wt/);
      });
    }
  }
});

describe('case selection follows SPSS rules', () => {
  it('Frequencies lists user-missing codes and system-missing separately', () => {
    const ds = build();
    const it = runProc('frequencies', ds, { variables: ['income'] });
    const t = findTable(it, 'Monthly income');
    const labels = t.rows.flatMap((r) => r.filter((c) => c.fmt === 'text').map((c) => c.v));
    expect(labels).toContain('Missing');
    expect(labels).toContain('-1');
    expect(labels).toContain('System');
    const stats = findTable(it, 'Statistics');
    const valid = num(stats.rows[0][2]);
    const missing = num(stats.rows[1][1]);
    // 120 cases: -1 at multiples of 13 (10 cases: 0, 13, ..., 117), NaN at multiples of 29 not of 13 (29, 58, 87, 116)
    expect(missing).toBe(14);
    expect(valid).toBe(106);
  });
  it('weights and filter change N like SPSS', () => {
    const plain = build();
    const wf = build({ weighted: true, filtered: true });
    const a = findTable(runProc('descriptives', plain, { variables: ['age'] }), 'Descriptive Statistics');
    const b = findTable(runProc('descriptives', wf, { variables: ['age'] }), 'Descriptive Statistics');
    expect(num(a.rows[0][1])).toBe(120);
    // filter drops i % 10 == 0 (12 cases); weights 1 + i % 3
    let expectN = 0;
    for (let i = 0; i < 120; i++) if (i % 10 !== 0) expectN += 1 + (i % 3);
    expect(num(b.rows[0][1])).toBe(expectN);
  });
  it('integer weights give the same results as replicated cases', () => {
    const weighted = build({ weighted: true });
    const expanded = replicate(build());
    const compare = (id: string, slots: Record<string, string[]>, title: string, opts?: OptionValues) => {
      const tw = findTable(runProc(id, weighted, slots, opts), title);
      const te = findTable(runProc(id, expanded, slots, opts), title);
      const vals = (t: OutputTable) => t.rows.flatMap((r) => r.filter((c) => typeof c.v === 'number').map((c) => c.v as number));
      const vw = vals(tw);
      const ve = vals(te);
      expect(vw.length).toBe(ve.length);
      vw.forEach((v, i) => {
        if (Number.isNaN(v)) expect(Number.isNaN(ve[i])).toBe(true);
        else expect(Math.abs(v - ve[i])).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(v)));
      });
    };
    compare('descriptives', { variables: ['income', 'sat1'] }, 'Descriptive Statistics', { skewness: true, kurtosis: true, variance: true });
    compare('ttest-independent', { variables: ['income'], group: ['sex'] }, 'Independent Samples Test', { groups: [1, 2] });
    compare('crosstabs', { rows: ['educ'], columns: ['trust'] }, 'Chi-Square Tests', { gamma: true });
    compare('crosstabs', { rows: ['educ'], columns: ['trust'] }, 'Symmetric Measures', { gamma: true, tauB: true, tauC: true, correlations: true });
    compare('oneway-anova', { dependents: ['income'], factor: ['educ'] }, 'ANOVA');
    compare('oneway-anova', { dependents: ['income'], factor: ['educ'] }, 'Multiple Comparisons', { tukey: true, gamesHowell: true });
    compare('mann-whitney', { variables: ['income'], group: ['sex'] }, 'Test Statistics', { groups: [1, 2] });
    compare('kruskal-wallis', { variables: ['income'], group: ['educ'] }, 'Test Statistics');
    compare('correlations', { variables: ['income', 'age', 'sat1'] }, 'Nonparametric Correlations', { pearson: false, kendall: true, spearman: true });
    compare('correlations', { variables: ['income', 'age', 'sat1'] }, 'Correlations');
    compare('ttest-paired', { first: ['sat1'], second: ['sat2'] }, 'Paired Samples Test');
    compare('wilcoxon', { first: ['sat1'], second: ['sat2'] }, 'Test Statistics');
    compare('friedman', { variables: ['sat1', 'sat2', 'sat3'] }, 'Test Statistics');
    compare('explore', { dependents: ['income'] }, 'Descriptives');
  });
  it('user-missing codes are excluded from analyses', () => {
    const ds = build();
    const it = runProc('crosstabs', ds, { rows: ['educ'], columns: ['trust'] });
    const t = findTable(it, 'educ * trust Crosstabulation');
    const labels = t.rows.flatMap((r) => r.map((c) => c.v));
    expect(labels).not.toContain('No answer');
    const cps = findTable(it, 'Case Processing Summary');
    // educ = 9 for i % 17 == 0: 8 cases among 120
    expect(num(cps.rows[0][3])).toBe(8);
  });
  it('readable errors for impossible requests', () => {
    const ds = build();
    const def = proc('ttest-independent');
    const s = { variables: byName(ds, 'income'), group: byName(ds, 'sex') };
    expect(() => def.run(ds, s, { ...defaultOptions(def), groups: [1, 7] })).toThrow(/has no valid cases/);
    const kw = proc('kruskal-wallis');
    const one: Dataset = build();
    const sexCol = one.columns[byName(one, 'sex')[0]] as Float64Array;
    sexCol.fill(1);
    expect(() => kw.run(one, { variables: byName(one, 'income'), group: byName(one, 'sex') }, defaultOptions(kw))).toThrow(/only one group/);
    const constant = build();
    (constant.columns[byName(constant, 'sat1')[0]] as Float64Array).fill(3);
    (constant.columns[byName(constant, 'sat2')[0]] as Float64Array).fill(3);
    const run = (id: string, slots: Record<string, string[]>, o: OptionValues = {}) => {
      const d = proc(id);
      const s2: SlotValues = {};
      for (const [k, v] of Object.entries(slots)) s2[k] = byName(constant, ...v);
      return () => d.run(constant, s2, { ...defaultOptions(d), ...o });
    };
    expect(run('ttest-one-sample', { variables: ['sat1'] })).toThrow(/same value for every case/);
    expect(run('ttest-independent', { variables: ['sat1'], group: ['sex'] }, { groups: [1, 2] })).toThrow(/does not vary/);
    expect(run('ttest-paired', { first: ['sat1'], second: ['sat2'] })).toThrow(/same for every case/);
    expect(run('oneway-anova', { dependents: ['sat1'], factor: ['educ'] })).toThrow(/does not vary/);
    expect(run('mann-whitney', { variables: ['sat1'], group: ['sex'] }, { groups: [1, 2] })).toThrow(/same value/);
    expect(run('wilcoxon', { first: ['sat1'], second: ['sat2'] })).toThrow(/all differences are zero/);
    expect(run('kruskal-wallis', { variables: ['sat1'], group: ['educ'] })).toThrow(/same value/);
    // Descriptives and correlations still run and show "." for undefined statistics
    const dsc = run('descriptives', { variables: ['sat1'] }, { skewness: true })();
    checkItem(dsc, proc('descriptives'));
    const cor = run('correlations', { variables: ['sat1', 'age'] })();
    checkItem(cor, proc('correlations'));
    const bin = proc('binomial');
    expect(() => bin.run(ds, { variables: byName(ds, 'educ') }, defaultOptions(bin))).toThrow(/exactly two/);
  });
});

describe('interpretations use labels and conventions', () => {
  it('crosstabs names groups by value label and reports Cramer V', () => {
    const it = runProc('crosstabs', build(), { rows: ['educ'], columns: ['trust'] });
    const interp = it.blocks.find((b) => b.kind === 'text' && b.style === 'interpretation');
    expect(interp && interp.kind === 'text' && /Primary|Secondary|Graduate/.test(interp.text)).toBe(true);
    expect(interp && interp.kind === 'text' && /Cramer's V/.test(interp.text)).toBe(true);
    const apa = it.blocks.find((b) => b.kind === 'text' && b.style === 'apa');
    expect(apa && apa.kind === 'text' && /χ²\(\d+, N = [\d,]+\) = /.test(apa.text)).toBe(true);
  });
  it('independent t test recommends a row based on Levene', () => {
    const it = runProc('ttest-independent', build(), { variables: ['income'], group: ['sex'] }, { groups: [1, 2] });
    const interp = it.blocks.find((b) => b.kind === 'text' && b.style === 'interpretation');
    expect(interp && interp.kind === 'text' && /Levene's test/.test(interp.text) && /row/.test(interp.text)).toBe(true);
  });
});
