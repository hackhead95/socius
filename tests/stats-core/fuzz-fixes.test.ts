// Focused tests for the statistics and procedure fixes from the combinatorial test suite
// (docs/qa/FUZZ-FINDINGS.md FZ-03 ... FZ-16, the weighted multinomial metamorphic failure, UI-010)
// and the shared text helpers (src/procedures/text.ts).
import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable, type Dataset, type Variable } from '../../src/core/types';
import { getProcedure, procedures } from '../../src/procedures';
import { defaultOptions, type OptionValues, type SlotValues } from '../../src/core/procedure';
import type { OutputItem, OutputTable } from '../../src/core/output';
import { layoutRows } from '../../src/features/output/format';
import { validate as dialogValidate } from '../../src/features/analysis/varUtils';
import { chiSquareTests, fisherMonteCarlo, fisherRxC } from '../../src/lib/stats/crosstabs';
import { fitMultinomial } from '../../src/lib/stats/logistic';
import { allFinite, cleanBlocks, confLevel, countText, levelText, numText, CI_MAX, CI_MIN } from '../../src/procedures/text';
import { proseNamer } from '../../src/procedures/models/common';
import { handleRunRequest, runsInBackground, startProcedureRun } from '../../src/features/analysis/runProcedure';

function ds(vars: Array<[Variable, Array<number | string>]>, extra: Partial<Dataset> = {}): Dataset {
  const columns: Dataset['columns'] = {};
  for (const [v, vals] of vars) columns[v.id] = v.type === 'string' ? (vals as string[]) : Float64Array.from(vals as number[]);
  return makeDataset({ name: 'fixes', variables: vars.map(([v]) => v), columns, nCases: vars[0][1].length, ...extra });
}
const run = (id: string, d: Dataset, slots: SlotValues, opts: OptionValues = {}): OutputItem => {
  const def = getProcedure(id)!;
  return def.run(d, slots, { ...defaultOptions(def), ...opts });
};
const texts = (item: OutputItem, style?: string) => item.blocks.filter((b) => b.kind === 'text' && (!style || b.style === style)).map((b) => (b as { text: string }).text).join('\n');
const table = (item: OutputItem, title: RegExp) => item.blocks.map((b) => (b.kind === 'table' ? b.table : null)).find((t): t is OutputTable => !!t && title.test(t.title))!;
const widths = (t: OutputTable) => [layoutRows(t.header).columns, layoutRows(t.rows).columns];

describe('shared text helpers', () => {
  it('numText never prints a negative zero and drops the leading zero for bounded statistics', () => {
    expect(numText(-0.0001, 2)).toBe('0.00');
    expect(numText(-0.0001, 2, true)).toBe('.00');
    expect(numText(-0.25, 2, true)).toBe('-.25');
    expect(numText(-1234.5, 1)).toBe('-1,234.5');
    expect(numText(NaN)).toBe('.');
  });
  it('countText shows tiny fractional weights instead of "0"', () => {
    expect(countText(0.04)).toBe('0.04');
    expect(countText(12.34)).toBe('12.3');
    expect(countText(1204)).toBe('1,204');
  });
  it('allFinite and cleanBlocks', () => {
    expect(allFinite(1, 2)).toBe(true);
    expect(allFinite(1, NaN)).toBe(false);
    expect(allFinite(Infinity)).toBe(false);
    expect(cleanBlocks([{ kind: 'text', style: 'interpretation', text: '  ' }, { kind: 'text', style: 'apa', text: 'x' }])).toHaveLength(1);
  });
});

describe('FZ-03 header/body alignment', () => {
  it('Descriptives: every combination of the statistics checkboxes gives a header as wide as the body', () => {
    const x = makeVariable({ name: 'income' });
    const d = ds([[x, [10, 20, 30, 40, 55]]]);
    const keys = ['mean', 'sum', 'sd', 'variance', 'range', 'min', 'max', 'seMean', 'skewness', 'kurtosis'];
    for (let mask = 0; mask < 1 << keys.length; mask++) {
      const opts = Object.fromEntries(keys.map((k, i) => [k, !!(mask & (1 << i))]));
      const t = table(run('descriptives', d, { variables: [x.id] }, opts), /^Descriptive Statistics$/);
      const [h, b] = widths(t);
      if (h !== b) throw new Error(`header ${h} != body ${b} for ${JSON.stringify(opts)}`);
    }
  });
  it('S.E. mean without Mean sits under its own heading, next to the right values', () => {
    const x = makeVariable({ name: 'income' });
    const t = table(run('descriptives', ds([[x, [10, 20, 30, 40, 55]]]), { variables: [x.id] }, { mean: false, seMean: true }), /^Descriptive Statistics$/);
    const top = t.header[0].map((c) => c.v);
    expect(top).toEqual(['', 'N', 'Minimum', 'Maximum', 'Mean', 'Std. Deviation']);
    expect(t.header[1].map((c) => c.v)).toEqual(['Statistic', 'Statistic', 'Statistic', 'Std. Error', 'Statistic']);
    expect(t.rows[0][4].v).toBeCloseTo(7.8102, 4); // S.E. mean under "Mean / Std. Error"
    expect(t.rows[0][5].v).toBeCloseTo(17.4642, 4); // SD under "Std. Deviation"
  });
});

describe('FZ-04 case processing summaries are weighted throughout', () => {
  const a = makeVariable({ name: 'a', measure: 'nominal', decimals: 0 });
  const b = makeVariable({ name: 'b', measure: 'nominal', decimals: 0 });
  const w = makeVariable({ name: 'w', decimals: 0 });
  const d = { ...ds([[a, [1, 1, 2, NaN]], [b, [1, 2, 1, 1]], [w, [2, 2, 2, 3]]]), weightVarId: w.id };
  it('Crosstabs: Valid 6 (66.7%), Missing 3 (33.3%), Total 9, and the case note says 3', () => {
    const item = run('crosstabs', d, { rows: [a.id], columns: [b.id] });
    const row = table(item, /Case Processing Summary/).rows[0].map((c) => c.v);
    expect(row[1]).toBe(6);
    expect(row[2]).toBeCloseTo(66.667, 2);
    expect(row[3]).toBe(3);
    expect(row[4]).toBeCloseTo(33.333, 2);
    expect(row[5]).toBe(9);
    expect(item.caseNote).toMatch(/N = 6 \(weighted by w\); 3 \(weighted\) excluded for missing values/);
  });
  it('the weighted missing count equals the replicated data', () => {
    const rep = ds([[a, [1, 1, 1, 1, 2, 2, NaN, NaN, NaN]], [b, [1, 1, 2, 2, 1, 1, 1, 1, 1]]]);
    const r1 = table(run('crosstabs', d, { rows: [a.id], columns: [b.id] }), /Case Processing Summary/).rows[0].map((c) => c.v);
    const r2 = table(run('crosstabs', rep, { rows: [a.id], columns: [b.id] }), /Case Processing Summary/).rows[0].map((c) => c.v);
    expect(r1).toEqual(r2);
  });
  it('Multinomial: Missing and Total in the Case Processing Summary are weighted', () => {
    const y = makeVariable({ name: 'y', measure: 'nominal', decimals: 0 });
    const x = makeVariable({ name: 'x' });
    const ww = makeVariable({ name: 'ww', decimals: 0 });
    const n = 30;
    const dd = {
      ...ds([
        [y, Array.from({ length: n }, (_, i) => (i === 0 ? NaN : 1 + (i % 3)))],
        [x, Array.from({ length: n }, (_, i) => Math.sin(i) * 3 + (i % 3))],
        [ww, Array.from({ length: n }, (_, i) => (i === 0 ? 5 : 2))],
      ]),
      weightVarId: ww.id,
    };
    const t = table(run('models.multinomial', dd, { dependent: [y.id], predictors: [x.id] }), /Case Processing Summary/);
    const byLabel = new Map(t.rows.map((r) => [String(r[0].v), r[1].v]));
    expect(byLabel.get('Valid')).toBe(58);
    expect(byLabel.get('Missing')).toBe(5);
    expect(byLabel.get('Total')).toBe(63);
  });
});

describe('FZ-06 / FZ-07 / FZ-14: statistics that cannot be computed are explained, never printed as n/a', () => {
  it('One-way ANOVA with a one-case group: no Welch F(2, NaN) sentence; the reason is given', () => {
    const y = makeVariable({ name: 'income' });
    const g = makeVariable({ name: 'trust', measure: 'ordinal', decimals: 0 });
    const item = run('oneway-anova', ds([[y, [41.55, 41.36, 61.89, 50, 52]], [g, [1, 1, 3, 2, 2]]]), { dependents: [y.id], factor: [g.id] });
    const all = texts(item);
    expect(all).not.toMatch(/NaN|n\/a/);
    expect(texts(item, 'apa')).toMatch(/A one-way ANOVA showed .* F\(2, 2\) = /);
  });
  it('Correlations: fewer than 3 cases gives no r(-2) and says a test needs 3 cases', () => {
    const x = makeVariable({ name: 'income' });
    const e = makeVariable({ name: 'notasked' });
    const item = run('correlations', ds([[x, [1, 2, 3, 4]], [e, [5, 7, NaN, NaN]]]), { variables: [x.id, e.id] });
    expect(texts(item)).not.toMatch(/\(-\d|\(0\)|n\/a|NaN/);
    expect(texts(item, 'interpretation')).toMatch(/needs at least 3 cases/);
    const sig = table(item, /^Correlations$/).rows[1][2].v; // Sig. row of income: [label, income, notasked]
    expect(Number.isNaN(sig as number)).toBe(true);
  });
  it('Scatter plot with a total weight below 3 gives a plain note instead of r(-2)', () => {
    const x = makeVariable({ name: 'x' });
    const y = makeVariable({ name: 'y' });
    const w = makeVariable({ name: 'w' });
    const item = run('graph-scatter', { ...ds([[x, [1, 2, 3, 4]], [y, [2, 1, 4, 3]], [w, [0.5, 0.5, 0.5, 0.5]]]), weightVarId: w.id }, { x: [x.id], y: [y.id] });
    expect(texts(item)).not.toMatch(/r\(-|n\/a/);
    expect(texts(item, 'note')).toMatch(/needs at least 3 cases/);
  });
  it('Descriptives and Explore with a single case omit the SD and say why', () => {
    const x = makeVariable({ name: 'income' });
    const d = ds([[x, [42]]]);
    const de = run('descriptives', d, { variables: [x.id] });
    expect(texts(de)).not.toMatch(/n\/a/);
    expect(texts(de, 'apa')).toMatch(/M = 42\.00 \(N = 1; the SD needs at least two cases\)/);
    const ex = run('explore', d, { dependents: [x.id] });
    expect(texts(ex)).not.toMatch(/n\/a/);
  });
  it('Means with fractional weights leaving no within-group df: no negative df and no p = n/a', () => {
    const y = makeVariable({ name: 'y' });
    const g = makeVariable({ name: 'g', measure: 'nominal', decimals: 0 });
    const w = makeVariable({ name: 'w' });
    const item = run('means', { ...ds([[y, [1, 2, 3, 4]], [g, [1, 1, 2, 2]], [w, [0.3, 0.3, 0.3, 0.3]]]), weightVarId: w.id }, { dependents: [y.id], layer1: [g.id] }, { anova: true });
    expect(texts(item)).not.toMatch(/n\/a|F\(1, -/);
    expect(texts(item, 'interpretation')).toMatch(/cannot be computed/);
  });
});

describe('FZ-08 confidence level: the dialog and run() apply the same 1 to 99.99 rule', () => {
  const x = makeVariable({ name: 'income' });
  const g = makeVariable({ name: 'grp', measure: 'nominal', decimals: 0 });
  const d = ds([[x, [1, 2, 3, 5, 8, 13, 4, 6]], [g, [1, 1, 1, 2, 2, 2, 1, 2]]]);
  const cases: Array<[string, SlotValues]> = [
    ['ttest-one-sample', { variables: [x.id] }],
    ['ttest-paired', { first: [x.id], second: [g.id] }],
    ['oneway-anova', { dependents: [x.id], factor: [g.id] }],
    ['explore', { dependents: [x.id] }],
    ['models.linear', { dependent: [x.id], block1: [g.id] }],
  ];
  it('every CI option uses min 1 and max 99.99', () => {
    for (const def of procedures) for (const o of def.options) if (o.type === 'number' && /confidence/i.test(o.label)) expect([def.id, o.min, o.max]).toEqual([def.id, CI_MIN, CI_MAX]);
  });
  it('the boundaries run, and an out-of-range value gives the dialog message from run()', () => {
    for (const [id, slots] of cases) {
      const def = getProcedure(id)!;
      const key = def.options.find((o) => o.type === 'number' && /confidence/i.test(o.label))!;
      for (const v of [1, 50, 99.99]) {
        const opts = { ...defaultOptions(def), [key.key]: v };
        expect(dialogValidate(def, d, slots, opts)).toEqual([]);
        expect(() => def.run(d, slots, opts)).not.toThrow();
      }
      const bad = { ...defaultOptions(def), [key.key]: 0.5 };
      const dialogMsg = dialogValidate(def, d, slots, bad)[0];
      expect(() => def.run(d, slots, bad)).toThrow(dialogMsg);
    }
  });
  it('levels read naturally in headings', () => {
    expect(levelText(0.95)).toBe('95');
    expect(levelText(0.999)).toBe('99.9');
    expect(levelText(0.9999)).toBe('99.99');
    expect(() => confLevel({ ci: 100 }, 'ci', 'CI (%)')).toThrow('"CI (%)" must be between 1 and 99.99.');
  });
});

describe('FZ-09 post hoc speed', () => {
  it('Games-Howell and Tukey on 3,000 cases, 7 groups, 3 dependents finish in well under a second each', () => {
    const n = 3000;
    const ys = [0, 1, 2].map((j) => makeVariable({ name: `y${j}` }));
    const g = makeVariable({ name: 'g', measure: 'nominal', decimals: 0 });
    const d = ds([...ys.map((y, j): [Variable, number[]] => [y, Array.from({ length: n }, (_, i) => Math.sin(i + j) * 10 + (i % 7))]), [g, Array.from({ length: n }, (_, i) => 1 + (i % 7))]]);
    for (const m of ['gamesHowell', 'tukey']) {
      const t0 = performance.now();
      run('oneway-anova', d, { dependents: ys.map((y) => y.id), factor: [g.id] }, { [m]: true });
      expect(performance.now() - t0).toBeLessThan(1000);
    }
  });
});

describe('FZ-11 exact tests: fast Monte Carlo with a time budget', () => {
  it('the Monte Carlo sampler agrees with complete enumeration', () => {
    const tables = [
      [[3, 1, 4], [2, 6, 1], [5, 2, 2]],
      [[8, 2], [1, 5], [4, 4], [0, 3]],
      [[2, 3, 1, 4], [5, 1, 2, 0]],
    ];
    for (const t of tables) {
      const ex = fisherRxC(t);
      expect(ex.method).toBe('exact');
      const mc = fisherMonteCarlo(t, 40000, 2000000);
      expect(Math.abs(mc.p2 - ex.p2)).toBeLessThan(4 * Math.sqrt((ex.p2 * (1 - ex.p2)) / 40000) + 1e-3);
    }
  });
  it('a 10 x 2 table with 6,000 cases goes straight to Monte Carlo and takes milliseconds', () => {
    const t = Array.from({ length: 10 }, (_, i) => [300 - i * 7, 300 + i * 7]);
    const t0 = performance.now();
    const r = chiSquareTests(t, null, null, { exact: true });
    expect(performance.now() - t0).toBeLessThan(500);
    expect(r.fisher?.method).toBe('monte-carlo');
    expect(r.fisher!.p2).toBeGreaterThanOrEqual(0);
  });
});

describe('FZ-15 / FZ-16 messages and names', () => {
  it('Chi-square expected values: a negative value says "greater than 0", never "Infinity"', () => {
    const x = makeVariable({ name: 'region', measure: 'nominal', decimals: 0 });
    const def = getProcedure('chisquare-gof')!;
    const msgs = dialogValidate(def, ds([[x, [1, 2, 1, 2]]]), { variables: [x.id] }, { ...defaultOptions(def), expected: 'values', expectedValues: '-1, 2' });
    expect(msgs.join(' ')).toMatch(/greater than 0/);
    expect(msgs.join(' ')).not.toMatch(/Infinity/);
  });
  it('a blank string category is "(blank)" in chart, model and box-plot text; no empty blocks', () => {
    const x = makeVariable({ name: 'wave', decimals: 0 });
    const y = makeVariable({ name: 'income' });
    const g = makeVariable({ name: 'place', type: 'string', width: 8 });
    const line = run('graph-line', ds([[x, [-30, -10]], [y, [-2.58, -28.74]], [g, ['', '']]]), { x: [x.id], y: [y.id], group: [g.id] });
    expect(texts(line)).toMatch(/For \(blank\), the mean/);
    const out = makeVariable({ name: 'choice', type: 'string', width: 8, measure: 'nominal' });
    const pred = makeVariable({ name: 'age' });
    const n = 30;
    const nom = run('models.multinomial', ds([[out, Array.from({ length: n }, (_, i) => ['', 'b', 'c'][i % 3])], [pred, Array.from({ length: n }, (_, i) => 20 + ((i * 7) % 13))]]), { dependent: [out.id], predictors: [pred.id] }, { reference: 'first' });
    expect(texts(nom)).not.toMatch(/""/);
    const v = makeVariable({ name: 'score' });
    const box = run('graph-box', ds([[v, [5]]]), { variables: [v.id], group: [v.id] });
    for (const b of box.blocks) if (b.kind === 'text') expect(b.text.trim()).not.toBe('');
  });
});

describe('weighted models equal replicated cases', () => {
  it('multinomial: integer weights give the same estimates as replicated cases, bit for bit, even under separation', () => {
    const y = [0, 1, 2, 0];
    const x = [1864.1, -215.1, 400.2, 1864.1];
    const w = [3, 1, 2, 1];
    const yr: number[] = [], xr: number[] = [];
    y.forEach((v, i) => { for (let k = 0; k < w[i]; k++) { yr.push(v); xr.push(x[i]); } });
    const a = fitMultinomial(y, 3, 0, [x], w);
    const b = fitMultinomial(yr, 3, 0, [xr], yr.map(() => 1));
    expect(Array.from(a.coef[0])).toEqual(Array.from(b.coef[0]));
    expect(Array.from(a.se[1])).toEqual(Array.from(b.se[1]));
  });
  it('multinomial and frequencies cope with huge or numerous category codes (no spread over the data)', () => {
    const out = makeVariable({ name: 'code', measure: 'nominal', decimals: 0 });
    const pred = makeVariable({ name: 'age' });
    const n = 30;
    const codes = [1e9, 2e9, 3e9];
    const item = run('models.multinomial', ds([[out, Array.from({ length: n }, (_, i) => codes[i % 3])], [pred, Array.from({ length: n }, (_, i) => 20 + ((i * 7) % 13))]]), { dependent: [out.id], predictors: [pred.id] });
    expect(item.blocks.length).toBeGreaterThan(0);
    const s = makeVariable({ name: 'id', type: 'string', width: 8, measure: 'nominal' });
    const many = 150_000;
    const fr = run('frequencies', ds([[s, Array.from({ length: many }, (_, i) => `r${i}`)]]), { variables: [s.id] }, { mode: true, table: false });
    expect(table(fr, /^Statistics$/)).toBeTruthy();
  }, 60_000);
  it('population pyramid with ages in the billions is refused quickly instead of running out of memory', () => {
    const age = makeVariable({ name: 'age' });
    const sex = makeVariable({ name: 'sex', measure: 'nominal', decimals: 0 });
    const d = ds([[age, [1, 5e12, 30]], [sex, [1, 2, 1]]]);
    expect(() => run('graph-pyramid', d, { age: [age.id], sex: [sex.id] }, { top: 0 })).toThrow(/too wide a range/);
  });
});

describe('UI-010 one naming convention per analysis', () => {
  it('labels only when every variable has a short statement label, otherwise names throughout', () => {
    const dep = makeVariable({ name: 'life_sat', label: 'How satisfied are you with your life?' });
    const age = makeVariable({ name: 'age', label: 'Age in completed years' });
    const yrs = makeVariable({ name: 'yrs_nbhd', label: 'Years lived in the neighbourhood' });
    const nm = proseNamer([dep, age, yrs]);
    expect([nm(dep), nm(age), nm(yrs)]).toEqual(['life_sat', 'age', 'yrs_nbhd']);
    const dep2 = makeVariable({ name: 'life_sat', label: 'Life satisfaction' });
    const nm2 = proseNamer([dep2, age, yrs]);
    expect([nm2(dep2), nm2(age), nm2(yrs)]).toEqual(['Life satisfaction', 'Age in completed years', 'Years lived in the neighbourhood']);
  });
  it('linear regression prose does not mix names and labels', () => {
    const n = 60;
    const dep = makeVariable({ name: 'life_sat', label: 'How satisfied are you with your life?' });
    const age = makeVariable({ name: 'age', label: 'Age in completed years' });
    const yrs = makeVariable({ name: 'yrs_nbhd', label: 'Years lived here' });
    const d = ds([
      [dep, Array.from({ length: n }, (_, i) => 5 + 0.05 * (i % 40) + 0.1 * (i % 7) + Math.sin(i))],
      [age, Array.from({ length: n }, (_, i) => 18 + (i % 40))],
      [yrs, Array.from({ length: n }, (_, i) => i % 7)],
    ]);
    for (const id of ['models.linear']) {
      const item = run(id, d, { dependent: [dep.id], block1: [age.id, yrs.id] });
      const prose = texts(item, 'interpretation') + texts(item, 'apa');
      expect(prose).not.toMatch(/Age in completed years|Years lived here/);
      expect(prose).toMatch(/\bage\b/);
    }
  });
});

describe('background runs (runProcedure)', () => {
  const x = makeVariable({ name: 'income' });
  const d = ds([[x, [1, 2, 3, 5, 8]]]);
  it('the worker handler returns the item, or the procedure\'s own message', () => {
    const ok = handleRunRequest({ id: 'descriptives', dataset: d, slots: { variables: [x.id] }, options: defaultOptions(getProcedure('descriptives')!) });
    expect(ok.ok).toBe(true);
    const bad = handleRunRequest({ id: 'descriptives', dataset: d, slots: { variables: [] }, options: {} });
    expect(bad).toMatchObject({ ok: false, message: 'Choose at least one numeric variable.' });
  });
  it('without Worker support (Node, old browsers) runs directly', async () => {
    const def = getProcedure('descriptives')!;
    expect(runsInBackground(def, d, { variables: [x.id] })).toBe(false);
    const r = startProcedureRun(def, d, { variables: [x.id] }, defaultOptions(def));
    expect(r.background).toBe(false);
    expect((await r.result).procedure).toBe('descriptives');
  });
});
