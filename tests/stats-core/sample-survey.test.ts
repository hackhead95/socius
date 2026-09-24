// End-to-end numerical checks on the bundled sample survey (src/samples/urban_trust_survey.sav):
// every procedure is run the way the dialogs run it, and key numbers are compared with values
// computed independently in Python (pyreadstat with user-missing codes as missing, scipy,
// statsmodels, pingouin, factor_analyzer). Also covers wording regressions found in QA.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { importFile } from '../../src/lib/io';
import { computeVariable, reverseCode } from '../../src/lib/transform';
import { procedures } from '../../src/procedures';
import { defaultOptions } from '../../src/core/procedure';
import { makeVariable, type Dataset } from '../../src/core/types';
import type { OutputItem, OutputTable } from '../../src/core/output';
import { apaP } from '../../src/procedures/core/common';
import { fmtP } from '../../src/procedures/models/common';

const SAV = fileURLToPath(new URL('../../src/samples/urban_trust_survey.sav', import.meta.url));
let ds: Dataset;

beforeAll(async () => {
  ds = (await importFile('urban_trust_survey.sav', new Uint8Array(readFileSync(SAV)))).dataset;
});

function ids(d: Dataset, names: string[]): string[] {
  return names.map((n) => {
    const v = d.variables.find((x) => x.name === n);
    if (!v) throw new Error(`no variable ${n}`);
    return v.id;
  });
}

function run(id: string, slots: Record<string, string[]>, opts: Record<string, unknown> = {}, d: Dataset = ds): OutputItem {
  const def = procedures.find((p) => p.id === id)!;
  const s: Record<string, string[]> = {};
  for (const [k, names] of Object.entries(slots)) s[k] = ids(d, names);
  const o = { ...defaultOptions(def), ...opts };
  const msg = def.validate?.(d, s, o);
  if (msg) throw new Error(msg);
  return def.run(d, s, o);
}

function table(item: OutputItem, title: string | RegExp): OutputTable {
  const t = item.blocks.find((b) => b.kind === 'table' && (typeof title === 'string' ? b.table.title === title : title.test(b.table.title)));
  if (!t || t.kind !== 'table') throw new Error(`no table ${title} in ${item.title}: ${item.blocks.map((b) => (b.kind === 'table' ? b.table.title : b.kind)).join(', ')}`);
  return t.table;
}

function lastTable(item: OutputItem, title: string): OutputTable {
  const all = item.blocks.filter((b) => b.kind === 'table' && b.table.title === title);
  const t = all[all.length - 1];
  if (!t || t.kind !== 'table') throw new Error(`no table ${title}`);
  return t.table;
}

function nums(t: OutputTable): number[] {
  return t.rows.flatMap((r) => r.map((c) => c.v).filter((v): v is number => typeof v === 'number' && Number.isFinite(v)));
}

/** The table contains a number within `tol` (relative for large values) of `x`. */
function expectValue(t: OutputTable, x: number, tol = 1e-6) {
  const hit = nums(t).some((v) => Math.abs(v - x) <= tol * Math.max(1, Math.abs(x)));
  if (!hit) throw new Error(`${t.title}: no value close to ${x}; have ${nums(t).slice(0, 40).join(', ')}`);
}

function texts(item: OutputItem, style: 'interpretation' | 'apa' | 'warning' | 'note'): string {
  return item.blocks.filter((b) => b.kind === 'text' && b.style === style).map((b) => (b.kind === 'text' ? b.text : '')).join('\n');
}

describe('sample survey: numbers match the Python oracle', () => {
  it('frequencies list user-missing codes separately', () => {
    const it = run('frequencies', { variables: ['trust5'] });
    const t = table(it, 'I would feel safe walking alone here after dark');
    const labels = t.rows.map((r) => r.map((c) => c.v).join('|'));
    expect(labels.some((l) => /Don't know\|5\|/.test(l))).toBe(true);
    expect(labels.some((l) => /Refused\|5\|/.test(l))).toBe(true);
    expectValue(t, 630);
  });

  it('descriptives exclude the 999999 income code', () => {
    const it = run('descriptives', { variables: ['age', 'life_sat', 'hh_income'] });
    const t = table(it, 'Descriptive Statistics');
    expectValue(t, 607);
    expectValue(t, 32883.855024711695);
    expectValue(t, 28201.510322218473);
    expectValue(t, 580); // valid listwise
    // The case note must not mix one variable's N with another's missing count.
    expect(it.caseNote).toMatch(/N = 607 to 630 valid cases per variable/);
    expect(it.caseNote).toMatch(/580 are valid on all 3/);
  });

  it('explore: Shapiro-Wilk and Lilliefors by migrant', () => {
    const t = table(run('explore', { dependents: ['life_sat'], factor: ['migrant'] }), 'Tests of Normality');
    expectValue(t, 0.9682636296689829, 1e-4);
    expectValue(t, 0.11594157739958844, 1e-6);
  });

  it('crosstabs trust5 by gender: chi-square, V and ordinal measures', () => {
    const it = run('crosstabs', { rows: ['trust5'], columns: ['gender'] }, { colPct: true, adjRes: true, gamma: true, tauB: true });
    const chi = table(it, 'Chi-Square Tests');
    expectValue(chi, 35.01556484696386);
    expectValue(chi, 2.6564488929006455e-5);
    expectValue(chi, 35.9892825697523);
    const sym = table(it, 'Symmetric Measures');
    expectValue(sym, 0.16670372170687642);
    expectValue(sym, -0.1781690944954557);
    expectValue(sym, -0.2765957446808511);
  });

  it('crosstabs 2x2: Fisher and odds ratio', () => {
    const it = run('crosstabs', { rows: ['civic_meet'], columns: ['migrant'] }, { risk: true });
    const chi = table(it, 'Chi-Square Tests');
    expectValue(chi, 18.125087863730236);
    expectValue(chi, 2.1407094613439137e-5, 1e-4);
    const risk = table(it, 'Risk Estimate');
    expectValue(risk, 0.473083732214281);
    expectValue(risk, 0.3341587119951332, 1e-4);
    expectValue(risk, 0.6697662208162125, 1e-4);
  });

  it('t tests', () => {
    const ind = table(run('ttest-independent', { variables: ['life_sat'], group: ['migrant'] }, { groups: [0, 1] }), 'Independent Samples Test');
    expectValue(ind, 4.506385609706224);
    expectValue(ind, 628);
    expectValue(ind, 7.865778851277658e-6, 1e-5);
    expectValue(ind, 4.485138701537765);
    expectValue(ind, 556.8983129416739);
    expectValue(ind, 0.28221640051786157);
    expectValue(table(run('ttest-paired', { first: ['trust1'], second: ['trust2'] }), 'Paired Samples Test'), -3.9956833229298336);
    expectValue(table(run('ttest-one-sample', { variables: ['life_sat'] }, { testValue: 5 }), 'One-Sample Test'), 14.8069573841427);
  });

  it('one-way ANOVA with Tukey and Games-Howell', () => {
    const it = run('oneway-anova', { dependents: ['life_sat'], factor: ['educ'] }, { tukey: true, gamesHowell: true });
    expectValue(table(it, 'ANOVA'), 8.669105, 1e-6);
    expectValue(table(it, 'Robust Tests of Equality of Means'), 8.56481, 1e-5);
    expectValue(table(it, 'Robust Tests of Equality of Means'), 199.625879, 1e-6);
    const mc = table(it, 'Multiple Comparisons');
    expectValue(mc, 0.0009713661233815563, 1e-4); // Tukey, No formal schooling vs Graduate
    expectValue(mc, 0.0006579446337604544, 1e-4); // Tukey, Secondary vs Postgraduate
  });

  it('correlations and partial correlation', () => {
    const it = run('correlations', { variables: ['yrs_nbhd', 'belong', 'life_sat', 'age'] }, { spearman: true, kendall: true });
    expectValue(table(it, 'Correlations'), 0.35524272356698094);
    const np = table(it, 'Nonparametric Correlations');
    expectValue(np, 0.3738278978245467);
    expectValue(np, 0.294920031823152);
    expectValue(table(run('partial-correlations', { variables: ['yrs_nbhd', 'belong'], controls: ['age'] }), 'Correlations'), 0.28994547, 1e-6);
  });

  it('nonparametric tests', () => {
    const mw = table(run('mann-whitney', { variables: ['life_sat'], group: ['migrant'] }, { groups: [0, 1] }), 'Test Statistics');
    expectValue(mw, 38497);
    expectValue(mw, 1.0102582080834753e-5, 1e-4);
    expectValue(table(run('kruskal-wallis', { variables: ['life_sat'], group: ['educ'] }), 'Test Statistics'), 41.08885677889436);
    expectValue(table(run('wilcoxon', { first: ['trust1'], second: ['trust2'] }), 'Test Statistics'), 9.519332040394203e-5, 1e-4);
    expectValue(table(run('chisquare-gof', { variables: ['city'] }), 'Test Statistics'), 10.890625);
    expectValue(table(run('binomial', { variables: ['vote'] }, { testProp: 0.6 }), 'Binomial Test'), 0.10578688150793493, 1e-6);
    expectValue(table(run('friedman', { variables: ['trust1', 'trust2', 'trust4'] }), 'Test Statistics'), 144.65043478260853);
  });

  it('hierarchical linear regression with dummy coding', () => {
    const it = run('models.linear', { dependent: ['life_sat'], block1: ['age', 'gender'], block2: ['educ', 'hh_income', 'migrant'] });
    const ms = table(it, 'Model Summary');
    expectValue(ms, 0.019527658172145412);
    expectValue(ms, 0.11115231612269683);
    expectValue(ms, 8.379136158859492);
    const co = table(it, 'Coefficients');
    expectValue(co, -0.72186, 1e-5);
    expectValue(co, 0.148717, 1e-5);
    expectValue(co, -0.00977, 1e-4);
  });

  it('binary logistic regression with a computed civic count', () => {
    const d = computeVariable(ds, { target: 'civic', expression: 'SUM(civic_meet, civic_vol, civic_petition, civic_contact, civic_protest)' }).dataset;
    const it = run('models.logistic', { dependent: ['vote'], covariates: ['age', 'yrs_nbhd', 'educ', 'civic'] }, {}, d);
    const ve = lastTable(it, 'Variables in the Equation');
    expectValue(ve, 0.220814, 1e-5);
    expectValue(ve, 0.100224, 1e-5);
    expectValue(ve, 0.044989, 1e-5);
    expectValue(table(it, 'Model Summary'), 692.5193343152321);
    expectValue(table(it, 'Model Summary'), 0.30139210744019607);
    expectValue(table(it, 'Omnibus Tests of Model Coefficients'), 158.38416414605);
    // Nagelkerke is a pseudo R²: never described as variance explained.
    expect(texts(it, 'apa') + texts(it, 'interpretation')).not.toMatch(/of the (variance|variation)/);
    expect(texts(it, 'apa')).toMatch(/Nagelkerke pseudo R² = \.30/);
  });

  it('ordinal regression (PLUM)', () => {
    const it = run('models.ordinal', { dependent: ['belong'], predictors: ['yrs_nbhd', 'migrant'] });
    const pe = table(it, 'Parameter Estimates');
    expectValue(pe, 0.0457, 1e-3);
    expectValue(pe, -0.564119, 1e-4);
    expectValue(pe, -2.237622, 1e-4);
    expectValue(pe, 1.40031, 1e-4);
    expectValue(table(it, 'Model Fitting Information'), 1497.1834449042576, 1e-6);
  });

  it('reliability before and after reverse-coding trust3', () => {
    const items = ['trust1', 'trust2', 'trust3', 'trust4', 'trust5'];
    const before = run('models.reliability', { items });
    expectValue(table(before, 'Reliability Statistics'), 0.31467298603397337);
    expect(texts(before, 'warning')).toMatch(/trust3 correlates negatively[\s\S]*Reverse-code items/);
    const d = reverseCode(ds, { varIds: ids(ds, ['trust3']), mode: 'new' }).dataset;
    const after = run('models.reliability', { items: ['trust1', 'trust2', 'trust3_r', 'trust4', 'trust5'] }, {}, d);
    expectValue(table(after, 'Reliability Statistics'), 0.782148250561008);
  });

  it('factor analysis: KMO, Bartlett and eigenvalues', () => {
    const d = reverseCode(ds, { varIds: ids(ds, ['trust3']), mode: 'new' }).dataset;
    const it = run('models.factor', { variables: ['trust1', 'trust2', 'trust3_r', 'trust4', 'trust5', 'civic_meet', 'civic_vol', 'civic_petition', 'civic_contact', 'civic_protest'] }, {}, d);
    const kmo = table(it, "KMO and Bartlett's Test");
    expectValue(kmo, 0.8359229089665601);
    expectValue(kmo, 781.0218134617331);
    expectValue(table(it, 'Total Variance Explained'), 2.880, 1e-3);
  });

  it('weights change results like weighted Python', () => {
    const w = { ...ds, weightVarId: ids(ds, ['wt'])[0] };
    expectValue(table(run('crosstabs', { rows: ['civic_meet'], columns: ['migrant'] }, {}, w), 'Chi-Square Tests'), 16.884056594202484);
    const t = run('ttest-independent', { variables: ['life_sat'], group: ['migrant'] }, { groups: [0, 1] }, w);
    expectValue(table(t, 'Independent Samples Test'), 4.243584125070616);
    expectValue(table(t, 'Independent Samples Test'), 628.822, 1e-6);
    // Floating-point residue of the weights must not appear as "0 in other groups".
    expect(t.caseNote).not.toMatch(/in other groups/);
    const lin = table(run('models.linear', { dependent: ['life_sat'], block1: ['age', 'migrant'] }, {}, w), 'Coefficients');
    expectValue(lin, -0.015753, 1e-4);
    expectValue(lin, -0.725185, 1e-5);
  });

  it('a filter changes N everywhere and is named in the case note', () => {
    const city = ids(ds, ['city'])[0];
    const fv = makeVariable({ name: 'filter_$', decimals: 0 });
    const col = Float64Array.from(ds.columns[city] as Float64Array, (x) => (x === 1 ? 1 : 0));
    const f: Dataset = { ...ds, variables: [...ds.variables, fv], columns: { ...ds.columns, [fv.id]: col }, filterVarId: fv.id };
    for (const it of [
      run('frequencies', { variables: ['trust5'] }, {}, f),
      run('models.linear', { dependent: ['life_sat'], block1: ['age'] }, {}, f),
      run('graph-pie', { category: ['employ'] }, {}, f),
    ]) expect(it.caseNote).toMatch(/512 filtered out by filter_\$/);
  });
});

describe('sample survey: wording', () => {
  it('question-style labels are replaced by names inside sentences', () => {
    const it = run('correlations', { variables: ['yrs_nbhd', 'belong'] });
    expect(texts(it, 'interpretation')).toMatch(/^yrs_nbhd and belong are moderately positively related/);
  });

  it('crosstab interpretation compares the column groups when column percentages are shown', () => {
    const it = run('crosstabs', { rows: ['civic_meet'], columns: ['migrant'] }, { colPct: true });
    const s = texts(it, 'interpretation');
    expect(s).toMatch(/^Respondents in the "Migrated from another state or district" group of migrant were more likely to answer "No"/);
    expect(s).toMatch(/fewer "Born in this city" respondents answering "No" than expected/);
    const layered = run('crosstabs', { rows: ['trust5'], columns: ['gender'], layer: ['area'] });
    expect(texts(layered, 'warning')).toMatch(/^Core city: 5 of 15 cells \(33\.3%\)/);
  });

  it('group comparisons name the groups as groups', () => {
    expect(texts(run('ttest-independent', { variables: ['life_sat'], group: ['migrant'] }, { groups: [0, 1] }), 'interpretation')).toMatch(/The "Born in this city" group scored significantly higher on life_sat than the "Migrated from another state or district" group/);
    expect(texts(run('mann-whitney', { variables: ['life_sat'], group: ['migrant'] }, { groups: [0, 1] }), 'interpretation')).toMatch(/The "Born in this city" group tended to score higher/);
  });

  it('graphs: equal medians, significant weak correlations, non-monotonic lines, skew wording', () => {
    expect(texts(run('graph-box', { variables: ['life_sat'], group: ['city'] }), 'interpretation')).toMatch(/is the same \(6\) in every group of City/);
    expect(texts(run('graph-scatter', { x: ['yrs_nbhd'], y: ['life_sat'] }), 'apa')).toMatch(/^yrs_nbhd and life_sat were very weakly positively correlated, r\(628\) = \.08, p = \.038\./);
    expect(texts(run('graph-line', { x: ['educ'] }, { stat: 'count' }), 'interpretation')).toBe('Count is highest for Secondary (158) and lowest for No formal schooling (40); it does not change steadily across the categories.');
    const h = texts(run('graph-histogram', { variable: ['hh_income'] }), 'interpretation');
    expect(h).toMatch(/ranges from 3,000 to 257,500/);
    expect(h).toMatch(/strongly right-skewed, with a long tail of high values \(skewness = 2\.79\)/);
  });

  it('readable errors instead of meaningless output', () => {
    let d = computeVariable(ds, { target: 'allmiss', expression: '$SYSMIS' }).dataset;
    d = computeVariable(d, { target: 'const', expression: '1' }).dataset;
    expect(() => run('models.linear', { dependent: ['life_sat'], block1: ['const'] }, {}, d)).toThrow(/No predictor could be used: const/);
    expect(() => run('oneway-anova', { dependents: ['life_sat'], factor: ['hh_income'] }, {}, d)).toThrow(/recode hh_income into 50 or fewer groups/);
    expect(() => run('oneway-anova', { dependents: ['allmiss'], factor: ['educ'] }, {}, d)).toThrow(/allmiss has no valid values/);
    expect(() => run('chisquare-gof', { variables: ['allmiss'] }, {}, d)).toThrow(/allmiss has no valid values/);
    expect(texts(run('descriptives', { variables: ['allmiss'] }, {}, d), 'warning')).toMatch(/allmiss has no valid values/);
    expect(texts(run('means', { dependents: ['life_sat'], layer1: ['const'] }, { anova: true }, d), 'warning')).toMatch(/no groups to compare and no ANOVA was computed/);
  });

  it('APA p values never read "p = 1.000"', () => {
    expect(apaP(0.99999)).toBe('p > .999');
    expect(fmtP(0.9996)).toBe('p > .999');
    expect(fmtP(0.9994)).toBe('p = .999');
    expect(apaP(0.0321)).toBe('p = .032');
  });
});
