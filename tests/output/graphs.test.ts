import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable, type Dataset } from '../../src/core/types';
import { graphProcedures } from '../../src/procedures/graphs';
import { defaultOptions } from '../../src/core/procedure';
import { binCounts, boxStats, histogramEdges, linearFit, meanCI, tQuantile, tukeyHinges, wPercentile } from '../../src/procedures/graphs/stats';
import type { ChartSpec, OutputItem } from '../../src/core/output';

function proc(id: string) {
  const p = graphProcedures.find((g) => g.id === id);
  if (!p) throw new Error(id);
  return p;
}

function run(ds: Dataset, id: string, vars: Record<string, string[]>, opts: Record<string, unknown> = {}): OutputItem {
  const p = proc(id);
  const o = { ...defaultOptions(p), ...opts };
  const msg = p.validate?.(ds, vars, o);
  if (msg) throw new Error(msg);
  return p.run(ds, vars, o);
}

function chartOf(item: OutputItem): ChartSpec {
  const b = item.blocks.find((b) => b.kind === 'chart');
  if (!b || b.kind !== 'chart') throw new Error('no chart');
  return b.chart;
}

/** 12 synthetic respondents. */
function survey(): Dataset {
  const sex = makeVariable({ id: 'sex', name: 'sex', label: 'Sex', measure: 'nominal', valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }] });
  const educ = makeVariable({ id: 'educ', name: 'educ', label: 'Education', measure: 'ordinal', valueLabels: [{ value: 1, label: 'School' }, { value: 2, label: 'College' }, { value: 3, label: 'Degree' }], missing: { discrete: [9] } });
  const age = makeVariable({ id: 'age', name: 'age', label: 'Age', measure: 'scale' });
  const income = makeVariable({ id: 'income', name: 'income', label: 'Income', measure: 'scale' });
  const wt = makeVariable({ id: 'wt', name: 'wt', measure: 'scale' });
  const flt = makeVariable({ id: 'flt', name: 'flt', measure: 'nominal' });
  const region = makeVariable({ id: 'region', name: 'region', type: 'string', width: 8 });
  return makeDataset({
    name: 'synthetic',
    variables: [sex, educ, age, income, wt, flt, region],
    nCases: 12,
    columns: {
      sex: Float64Array.from([1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2]),
      educ: Float64Array.from([1, 1, 2, 2, 3, 3, 1, 2, 3, 3, 9, NaN]),
      age: Float64Array.from([22, 27, 34, 38, 41, 45, 52, 58, 63, 67, 71, 88]),
      income: Float64Array.from([20, 22, 30, 31, 45, 40, 28, 35, 60, 52, 25, 200]),
      wt: Float64Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      flt: Float64Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      region: ['North', 'South', 'North', 'East', 'South', 'North', 'East', 'North', 'South', 'North', 'East', 'South'],
    },
  });
}

describe('graph stats', () => {
  it('t quantiles match tables', () => {
    expect(tQuantile(0.025, 9)).toBeCloseTo(2.2622, 3);
    expect(tQuantile(0.025, 1000)).toBeCloseTo(1.9623, 3);
    expect(tQuantile(0.025, 1)).toBeCloseTo(12.706, 2);
  });
  it('mean CI', () => {
    const r = meanCI([1, 2, 3, 4, 5], [1, 1, 1, 1, 1]);
    expect(r.mean).toBe(3);
    // sd = 1.5811, se = .7071, t(4) = 2.7764
    expect(r.hi).toBeCloseTo(3 + 2.7764 * 0.70711, 3);
  });
  it('Tukey hinges and weighted percentiles', () => {
    expect(tukeyHinges([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual({ q1: 3, median: 5, q3: 7 });
    expect(tukeyHinges([1, 2, 3, 4, 5, 6, 7, 8])).toEqual({ q1: 2.5, median: 4.5, q3: 6.5 });
    // Weight 2 on each value equals the duplicated data set.
    const w = wPercentile([1, 2, 3, 4].map((x) => ({ x, w: 2 })), 0.5);
    expect(w).toBe(2.5);
  });
  it('box stats flag outliers and extremes', () => {
    const vals = [10, 11, 12, 13, 14, 15, 16, 30, 80];
    const b = boxStats(vals, vals.map(() => 1), vals.map((_, i) => i));
    expect(b.median).toBe(14);
    expect(b.outliers.map((o) => o.value)).toEqual([30, 80]);
    expect(b.outliers.find((o) => o.value === 80)?.extreme).toBe(true);
    expect(b.outliers.find((o) => o.value === 80)?.caseIndex).toBe(9);
    expect(b.max).toBe(16);
  });
  it('bins cover the data and counts sum to the weight', () => {
    const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const e = histogramEdges(0, 10, xs.length);
    expect(e[0]).toBeLessThanOrEqual(0);
    expect(e[e.length - 1]).toBeGreaterThanOrEqual(10);
    const c = binCounts(xs, xs.map(() => 1), e);
    expect(c.reduce((a, b) => a + b, 0)).toBe(11);
    const e2 = histogramEdges(0, 10, 11, 4);
    expect(e2).toHaveLength(5);
    expect(binCounts(xs, xs.map(() => 2), e2).reduce((a, b) => a + b, 0)).toBe(22);
  });
  it('linear fit', () => {
    const f = linearFit([1, 2, 3, 4], [3, 5, 7, 9], [1, 1, 1, 1]);
    expect(f.a).toBeCloseTo(1);
    expect(f.b).toBeCloseTo(2);
    expect(f.r).toBeCloseTo(1);
  });
});

describe('graph procedures', () => {
  it('all are in the Graphs menu with unique ids', () => {
    expect(new Set(graphProcedures.map((p) => p.id)).size).toBe(graphProcedures.length);
    for (const p of graphProcedures) expect(p.menu).toBe('Graphs');
  });

  it('bar chart counts with value labels, excluding user-missing', () => {
    const it0 = run(survey(), 'graph-bar', { category: ['educ'], cluster: [], variable: [] });
    const c = chartOf(it0);
    if (c.type !== 'bar') throw new Error();
    expect(c.categories).toEqual(['School', 'College', 'Degree']);
    expect(c.series[0].values).toEqual([3, 3, 4]);
    expect(it0.syntax).toContain('GRAPH\n  /BAR(SIMPLE)=COUNT BY educ.');
    expect(it0.caseNote).toContain('N = 10');
    expect(it0.caseNote).toContain('2 cases excluded');
    expect(it0.blocks.some((b) => b.kind === 'text' && b.style === 'interpretation')).toBe(true);
  });

  it('bar chart respects weights and filter', () => {
    const ds = survey();
    (ds.columns.wt as Float64Array)[4] = 3; // a Degree/Male case counts 3 times
    (ds.columns.flt as Float64Array)[0] = 0; // filter out a School case
    ds.weightVarId = 'wt';
    ds.filterVarId = 'flt';
    const c = chartOf(run(ds, 'graph-bar', { category: ['educ'] }));
    if (c.type !== 'bar') throw new Error();
    expect(c.series[0].values).toEqual([2, 3, 6]);
    const it1 = run(ds, 'graph-bar', { category: ['educ'] });
    expect(it1.syntax).toContain('WEIGHT BY wt.');
    expect(it1.syntax).toContain('FILTER BY flt.');
  });

  it('clustered percentages within cluster sum to 100', () => {
    const c = chartOf(run(survey(), 'graph-bar', { category: ['educ'], cluster: ['sex'] }, { stat: 'percent', pctBase: 'cluster' }));
    if (c.type !== 'bar') throw new Error();
    expect(c.series.map((s) => s.name)).toEqual(['Male', 'Female']);
    for (const s of c.series) expect(s.values.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
  });

  it('mean bars have 95% CI error bars', () => {
    const it0 = run(survey(), 'graph-bar', { category: ['sex'], variable: ['income'] }, { stat: 'mean' });
    const c = chartOf(it0);
    if (c.type !== 'bar') throw new Error();
    expect(c.errors?.[0]).toHaveLength(2);
    expect(c.series[0].values[0]).toBeCloseTo((20 + 30 + 45 + 28 + 60 + 25) / 6);
    expect(it0.syntax).toContain('MEAN(income)');
  });

  it('validation asks for a variable when showing means', () => {
    const p = proc('graph-bar');
    expect(p.validate?.(survey(), { category: ['sex'], variable: [] }, { ...defaultOptions(p), stat: 'mean' })).toMatch(/variable/);
  });

  it('histogram with normal curve and stats table', () => {
    const it0 = run(survey(), 'graph-histogram', { variable: ['income'] });
    const c = chartOf(it0);
    if (c.type !== 'histogram') throw new Error();
    expect(c.counts.reduce((a, b) => a + b, 0)).toBe(12);
    expect(c.normal?.n).toBe(12);
    expect(it0.syntax).toContain('/HISTOGRAM(NORMAL)=income.');
    const interp = it0.blocks.find((b) => b.kind === 'text' && b.style === 'interpretation');
    expect(interp && interp.kind === 'text' && interp.text).toMatch(/right-skewed/);
  });

  it('box plot by group lists outliers with case numbers', () => {
    const it0 = run(survey(), 'graph-box', { variables: ['income'], group: ['sex'] });
    const c = chartOf(it0);
    if (c.type !== 'box') throw new Error();
    expect(c.groups.map((g) => g.name)).toEqual(['Male', 'Female']);
    const fem = c.groups[1];
    expect(fem.outliers.some((o) => o.value === 200 && o.caseIndex === 12)).toBe(true);
    expect(it0.syntax).toContain('EXAMINE VARIABLES=income BY sex');
  });

  it('scatter with fit line and APA sentence', () => {
    const it0 = run(survey(), 'graph-scatter', { x: ['age'], y: ['income'], group: ['sex'] });
    const c = chartOf(it0);
    if (c.type !== 'scatter') throw new Error();
    expect(c.points).toHaveLength(12);
    expect(c.points[0].group).toBe('Male');
    expect(c.fit?.r2).toBeGreaterThan(0);
    const apa = it0.blocks.find((b) => b.kind === 'text' && b.style === 'apa');
    expect(apa && apa.kind === 'text' && apa.text).toMatch(/r\(10\) = \.\d\d, p [=<]/);
  });

  it('line chart of means by ordered category and group', () => {
    const it0 = run(survey(), 'graph-line', { x: ['educ'], y: ['income'], group: ['sex'] });
    const c = chartOf(it0);
    if (c.type !== 'line') throw new Error();
    expect(c.series).toHaveLength(2);
    expect(c.categories).toEqual(['School', 'College', 'Degree']);
    expect(it0.syntax).toContain('/LINE(MULTIPLE)=MEAN(income) BY educ BY sex.');
  });

  it('pie chart of a string variable', () => {
    const c = chartOf(run(survey(), 'graph-pie', { category: ['region'] }));
    if (c.type !== 'pie') throw new Error();
    expect(c.slices.map((s) => s.name)).toEqual(['East', 'North', 'South']);
    expect(c.slices.reduce((a, s) => a + s.value, 0)).toBe(12);
  });

  it('population pyramid in 10-year groups with open top group', () => {
    const it0 = run(survey(), 'graph-pyramid', { age: ['age'], sex: ['sex'] }, { width: '10', top: 80 });
    const c = chartOf(it0);
    if (c.type !== 'pyramid') throw new Error();
    expect(c.groups[0]).toBe('20–29');
    expect(c.groups[c.groups.length - 1]).toBe('80+');
    expect(c.left.name).toBe('Male');
    const sum = c.left.values.reduce((a, b) => a + b, 0) + c.right.values.reduce((a, b) => a + b, 0);
    expect(sum).toBe(12);
    expect(c.right.values[c.groups.length - 1]).toBe(1);
  });

  it('pyramid asks for two categories when the split variable has more', () => {
    expect(() => run(survey(), 'graph-pyramid', { age: ['age'], sex: ['educ'] })).toThrow(/Choose the two/);
    const it0 = run(survey(), 'graph-pyramid', { age: ['age'], sex: ['educ'] }, { sides: [1, 3] });
    const c = chartOf(it0);
    if (c.type !== 'pyramid') throw new Error();
    expect(c.left.name).toBe('School');
    expect(c.right.name).toBe('Degree');
    const total = c.left.values.reduce((a, b) => a + b, 0) + c.right.values.reduce((a, b) => a + b, 0);
    expect(total).toBe(7);
    expect(it0.syntax).toContain('SELECT IF (educ = 1 OR educ = 3).');
    expect(it0.blocks.some((b) => b.kind === 'text' && b.style === 'note' && /3 cases/.test(b.text))).toBe(true);
  });
});
