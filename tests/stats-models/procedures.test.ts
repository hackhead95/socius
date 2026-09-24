import { describe, expect, it } from 'vitest';
import type { OutputItem, OutputTable } from '../../src/core/output';
import type { Dataset } from '../../src/core/types';
import { makeVariable } from '../../src/core/types';
import { defaultOptions, type OptionValues, type ProcedureDef, type SlotValues } from '../../src/core/procedure';
import { modelProcedures } from '../../src/procedures/models';
import { procedures } from '../../src/procedures';
import { buildSurvey } from './dataset';
import rfx from './fixtures/regression.json';
import lfx from './fixtures/logistic.json';
import ofx from './fixtures/ordinal.json';
import mfx from './fixtures/multinomial.json';
import relfx from './fixtures/reliability.json';
import ffx from './fixtures/factor.json';
import { close, closeAll, socio } from './helpers';

const proc = (id: string): ProcedureDef => {
  const p = modelProcedures.find((x) => x.id === id);
  if (!p) throw new Error(id);
  return p;
};

function run(id: string, ds: Dataset, vars: SlotValues, opts: OptionValues = {}): OutputItem {
  const p = proc(id);
  const o = { ...defaultOptions(p), ...opts };
  const err = p.validate?.(ds, vars, o) ?? null;
  expect(err).toBeNull();
  return p.run(ds, vars, o);
}

/** Effective column count of every header/body row, honouring rowSpan and colSpan. */
function rowWidths(rows: OutputTable['rows']): number[] {
  const carry: number[] = []; // remaining rowSpan per column index
  const widths: number[] = [];
  for (const r of rows) {
    let col = 0;
    let width = 0;
    const next = carry.map((c) => Math.max(c - 1, 0));
    const occupied = (c: number) => (carry[c] ?? 0) > 0;
    for (const c of r) {
      while (occupied(col)) {
        col++;
        width++;
      }
      const span = c.colSpan ?? 1;
      for (let k = 0; k < span; k++) {
        if ((c.rowSpan ?? 1) > 1) next[col + k] = (c.rowSpan ?? 1) - 1;
      }
      col += span;
      width += span;
    }
    while (occupied(col)) {
      col++;
      width++;
    }
    widths.push(width);
    carry.length = 0;
    carry.push(...next);
  }
  return widths;
}

function expectWellFormed(item: OutputItem, id: string) {
  expect(item.procedure).toBe(id);
  expect(item.id).toBeTruthy();
  expect(item.title).toBeTruthy();
  expect(item.syntax && item.syntax.length > 20).toBe(true);
  expect(item.syntax!.trim().endsWith('.')).toBe(true);
  expect(item.caseNote).toMatch(/^N = /);
  const tables = item.blocks.filter((b) => b.kind === 'table');
  expect(tables.length).toBeGreaterThan(0);
  expect(item.blocks.some((b) => b.kind === 'text' && b.style === 'interpretation')).toBe(true);
  expect(item.blocks.some((b) => b.kind === 'text' && b.style === 'apa')).toBe(true);
  // Plain JSON (no typed arrays, no functions) and no leaked NaN/undefined text.
  const json = JSON.stringify(item);
  expect(JSON.parse(json).blocks.length).toBe(item.blocks.length);
  for (const b of item.blocks) {
    if (b.kind === 'text') {
      expect(b.text).not.toMatch(/NaN|undefined|Infinity|\[object/);
      expect(b.text).not.toMatch(/—/); // no em-dashes in user-facing copy
    }
    if (b.kind === 'chart') {
      const c = b.chart as unknown as Record<string, unknown>;
      for (const v of Object.values(c)) expect(ArrayBuffer.isView(v)).toBe(false);
    }
    if (b.kind === 'table') {
      const t = b.table;
      expect(t.title).toBeTruthy();
      const headerW = rowWidths(t.header);
      const bodyW = rowWidths(t.rows);
      const w = headerW[0];
      for (const x of headerW) expect(x, `${t.title} header`).toBe(w);
      for (const x of bodyW) expect(x, `${t.title} body`).toBe(w);
      for (const r of t.rows) for (const c of r) {
        expect(ArrayBuffer.isView(c.v)).toBe(false);
        if (typeof c.v === 'string') expect(c.v).not.toMatch(/NaN|undefined/);
      }
      for (const f of t.footnotes ?? []) expect(f).not.toMatch(/NaN|undefined/);
    }
  }
}

function table(item: OutputItem, title: string): OutputTable {
  const b = item.blocks.find((x) => x.kind === 'table' && x.table.title === title);
  if (!b || b.kind !== 'table') throw new Error(`no table ${title}; have ${item.blocks.filter((x) => x.kind === 'table').map((x) => (x.kind === 'table' ? x.table.title : '')).join(', ')}`);
  return b.table;
}
function tables(item: OutputItem, title: string): OutputTable[] {
  return item.blocks.flatMap((x) => (x.kind === 'table' && x.table.title === title ? [x.table] : []));
}
function texts(item: OutputItem, style: string): string[] {
  return item.blocks.flatMap((b) => (b.kind === 'text' && b.style === style ? [b.text] : []));
}
/** Find a body row whose (first text) label matches and return its numeric cells. */
function rowNums(t: OutputTable, label: string | RegExp): number[] {
  const r = t.rows.find((row) => row.some((c) => typeof c.v === 'string' && (typeof label === 'string' ? c.v === label : label.test(c.v))));
  if (!r) throw new Error(`no row ${label} in ${t.title}`);
  return r.filter((c) => typeof c.v === 'number').map((c) => c.v as number);
}

const variants: Array<[string, Parameters<typeof buildSurvey>[0]]> = [
  ['plain', {}],
  ['weighted + filtered + user-missing', { weighted: true, filtered: true, userMissing: true }],
];

describe('registry', () => {
  it('exports all model procedures with unique ids and the right menus', () => {
    const ids = modelProcedures.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(['models.linear', 'models.logistic', 'models.ordinal', 'models.multinomial', 'models.reliability', 'models.factor']);
    for (const p of modelProcedures) {
      expect(['Regression', 'Scale', 'Dimension Reduction']).toContain(p.menu);
      expect(p.description.length).toBeGreaterThan(20);
      expect(procedures).toContain(p);
      for (const text of [p.title, p.description, p.guidance ?? '', ...p.options.map((o) => o.label + (o.help ?? '')), ...p.slots.map((s) => s.label + (s.help ?? ''))]) {
        expect(text).not.toMatch(/—|seamless|robust|leverage|delve/i);
      }
    }
  });
});

describe.each(variants)('procedures on a %s survey', (_label, opts) => {
  const ds = buildSurvey(opts);
  it('Linear Regression (hierarchical, dummies, all statistics)', () => {
    const item = run('models.linear', ds, { dependent: ['v_trust'], block1: ['v_educ', 'v_age', 'v_female'], block2: ['v_income', 'v_educ_cat'] }, { zpp: true, durbinWatson: true });
    expectWellFormed(item, 'models.linear');
    const coef = table(item, 'Coefficients');
    expect(coef.rows.some((r) => r.some((c) => c.v === 'educ_cat: Graduate (ref = Primary)'))).toBe(true);
    expect(tables(item, 'Model Summary').length).toBe(1);
    expect(item.syntax).toMatch(/\/METHOD=ENTER income educ_cat_2 educ_cat_3 educ_cat_4/);
    if (opts?.weighted) expect(item.syntax).toMatch(/WEIGHT BY wt\./);
    if (opts?.filtered) expect(item.syntax).toMatch(/FILTER BY in_sample\./);
    expect(item.blocks.some((b) => b.kind === 'chart' && b.chart.type === 'histogram')).toBe(true);
    expect(item.blocks.some((b) => b.kind === 'chart' && b.chart.type === 'scatter')).toBe(true);
  });
  it('Linear Regression (stepwise)', () => {
    const item = run('models.linear', ds, { dependent: ['v_trust'], block1: ['v_educ', 'v_age', 'v_female', 'v_income', 'v_noise', 'v_region'] }, { method: 'stepwise' });
    expectWellFormed(item, 'models.linear');
    expect(table(item, 'Variables Entered/Removed').rows[0][3].v).toMatch(/^Stepwise/);
    expect(item.syntax).toMatch(/METHOD=STEPWISE/);
  });
  it('Binary Logistic Regression', () => {
    const item = run('models.logistic', ds, { dependent: ['v_voted'], covariates: ['v_educ', 'v_age', 'v_female', 'v_region', 'v_sector'] }, { hlTable: true });
    expectWellFormed(item, 'models.logistic');
    for (const t of ['Case Processing Summary', 'Dependent Variable Encoding', 'Categorical Variables Codings', 'Omnibus Tests of Model Coefficients', 'Model Summary', 'Hosmer and Lemeshow Test', 'Contingency Table for Hosmer and Lemeshow Test', 'Variables not in the Equation']) table(item, t);
    expect(tables(item, 'Classification Table').length).toBe(2);
    expect(tables(item, 'Variables in the Equation').length).toBe(2);
  });
  it('Ordinal Regression', () => {
    const item = run('models.ordinal', ds, { dependent: ['v_likert'], predictors: ['v_educ', 'v_age', 'v_female', 'v_region'] });
    expectWellFormed(item, 'models.ordinal');
    for (const t of ['Case Processing Summary', 'Model Fitting Information', 'Goodness-of-Fit', 'Pseudo R-Square', 'Parameter Estimates', 'Test of Parallel Lines']) table(item, t);
  });
  it('Multinomial Logistic Regression', () => {
    const item = run('models.multinomial', ds, { dependent: ['v_party'], predictors: ['v_educ', 'v_age', 'v_female', 'v_sector'] });
    expectWellFormed(item, 'models.multinomial');
    for (const t of ['Case Processing Summary', 'Model Fitting Information', 'Pseudo R-Square', 'Likelihood Ratio Tests', 'Parameter Estimates', 'Classification']) table(item, t);
  });
  it('Reliability Analysis', () => {
    const item = run('models.reliability', ds, { items: ['v_s1', 'v_s2', 'v_s3', 'v_s4'] }, { interItem: true, summary: true });
    expectWellFormed(item, 'models.reliability');
    for (const t of ['Case Processing Summary', 'Reliability Statistics', "McDonald's Omega", 'Item Statistics', 'Inter-Item Correlation Matrix', 'Summary Item Statistics', 'Item-Total Statistics', 'Scale Statistics']) table(item, t);
  });
  it('Factor Analysis (all extraction x rotation combinations)', () => {
    for (const extraction of ['pc', 'paf'])
      for (const rotation of ['none', 'varimax', 'promax', 'oblimin']) {
        const item = run('models.factor', ds, { variables: ['v_r1', 'v_r2', 'v_r3', 'v_r4', 'v_s1', 'v_s2', 'v_s3', 'v_s4'] }, { extraction, rotation, corr: true, sort: true, suppress: true });
        expectWellFormed(item, 'models.factor');
        const unit = extraction === 'pc' ? 'Component' : 'Factor';
        table(item, `${unit} Matrix`);
        if (rotation === 'varimax') table(item, `Rotated ${unit} Matrix`);
        if (rotation === 'promax' || rotation === 'oblimin') {
          table(item, 'Pattern Matrix');
          table(item, 'Structure Matrix');
          table(item, `${unit} Correlation Matrix`);
        }
        expect(item.blocks.some((b) => b.kind === 'chart' && b.chart.type === 'line')).toBe(true);
      }
  });
});

describe('procedure numerics match the oracle through the full run() path', () => {
  it('linear regression model 1 (unweighted) and weighted R² (WEIGHT BY)', () => {
    const plain = run('models.linear', buildSurvey(), { dependent: ['v_trust'], block1: ['v_educ', 'v_age', 'v_female'] }, {});
    const coef = table(plain, 'Coefficients');
    closeAll(rowNums(coef, 'educ').slice(0, 2), [rfx.m1.params[1], rfx.m1.bse[1]], 1e-9, 1e-12, 'educ B/SE');
    const ms = table(plain, 'Model Summary');
    close(ms.rows[0][2].v as number, rfx.m1.r2, 1e-10, 0, 'R2');
    const w = run('models.linear', buildSurvey({ weighted: true }), { dependent: ['v_trust'], block1: ['v_educ', 'v_age', 'v_female'] }, {});
    close(table(w, 'Model Summary').rows[0][2].v as number, rfx.weighted.r2, 1e-10, 0, 'weighted R2');
  });
  it('R² change between blocks', () => {
    const item = run('models.linear', buildSurvey(), { dependent: ['v_trust'], block1: ['v_educ', 'v_age', 'v_female'], block2: ['v_income', 'v_educ_cat'] }, {});
    const r2 = table(item, 'Model Summary').rows[1];
    close(r2[5].v as number, rfx.change.r2Change, 1e-9, 0, 'R2 change');
    close(r2[6].v as number, rfx.change.F, 1e-8, 0, 'F change');
  });
  it('binary logistic coefficients', () => {
    const item = run('models.logistic', buildSurvey(), { dependent: ['v_voted'], covariates: ['v_educ', 'v_age', 'v_female', 'v_region'] }, {});
    const vie = tables(item, 'Variables in the Equation')[1];
    close(rowNums(vie, 'educ')[0], lfx.unweighted.params[1], 1e-7, 0, 'educ B');
    close(rowNums(vie, 'Constant')[0], lfx.unweighted.params[0], 1e-7, 0, 'constant');
    close(rowNums(vie, 'region (ref = North)')[0], lfx.unweighted.waldRegion, 1e-7, 0, 'overall Wald region');
    close(table(item, 'Model Summary').rows[0][1].v as number, -2 * lfx.unweighted.llf, 1e-10, 0, '-2LL');
    close(table(item, 'Hosmer and Lemeshow Test').rows[0][1].v as number, lfx.unweighted.hl.chi2, 1e-6, 0, 'HL');
  });
  it('event = lower value flips the coefficients', () => {
    const ds = buildSurvey();
    const hi = run('models.logistic', ds, { dependent: ['v_voted'], covariates: ['v_educ'] }, { event: 'higher' });
    const lo = run('models.logistic', ds, { dependent: ['v_voted'], covariates: ['v_educ'] }, { event: 'lower' });
    const b = (it: OutputItem) => rowNums(tables(it, 'Variables in the Equation')[1], 'educ')[0];
    close(b(lo), -b(hi), 1e-9, 1e-12, 'flip');
    expect(table(lo, 'Dependent Variable Encoding').rows[1][0].v).toBe('Did not vote');
    expect(lo.syntax).toMatch(/RECODE voted/);
  });
  it('ordinal regression thresholds and locations', () => {
    const item = run('models.ordinal', buildSurvey(), { dependent: ['v_likert'], predictors: ['v_educ', 'v_age', 'v_female'] }, { dummy: false });
    const pe = table(item, 'Parameter Estimates');
    close(rowNums(pe, '[likert = Very dissatisfied]')[0], ofx.thresholds[0], 1e-7, 0, 'threshold 1');
    close(rowNums(pe, 'educ')[0], ofx.beta[0], 1e-7, 0, 'educ');
    close(rowNums(pe, 'female')[0], ofx.beta[2], 1e-7, 0, 'female');
    close(rowNums(pe, 'female')[1], ofx.seBeta[2], 1e-6, 0, 'female SE');
    const pl = table(item, 'Test of Parallel Lines');
    close(pl.rows[1][1].v as number, ofx.m2llGeneral, 1e-8, 0, 'general -2LL');
  });
  it('multinomial parameters and LR tests (reference = last)', () => {
    const item = run('models.multinomial', buildSurvey(), { dependent: ['v_party'], predictors: ['v_educ', 'v_age', 'v_female'] }, { dummy: false });
    const lr = table(item, 'Likelihood Ratio Tests');
    close(rowNums(lr, 'educ')[1], mfx.last.lr.educ, 1e-7, 1e-9, 'LR educ');
    close(rowNums(lr, 'age')[1], mfx.last.lr.age, 1e-7, 1e-9, 'LR age');
    const pe = table(item, 'Parameter Estimates');
    close(rowNums(pe, 'educ')[0], mfx.last.params[0][1], 1e-7, 0, 'educ (Left vs Right)');
  });
  it('reliability alpha, omega and weighted alpha', () => {
    const item = run('models.reliability', buildSurvey(), { items: ['v_r1', 'v_r2', 'v_r3', 'v_r4'] }, {});
    close(table(item, 'Reliability Statistics').rows[0][0].v as number, relfx.unweighted.alpha, 1e-10, 0, 'alpha');
    close(table(item, "McDonald's Omega").rows[0][0].v as number, relfx.unweighted.omega, 1e-6, 0, 'omega');
    const w = run('models.reliability', buildSurvey({ weighted: true }), { items: ['v_r1', 'v_r2', 'v_r3', 'v_r4'] }, {});
    close(table(w, 'Reliability Statistics').rows[0][0].v as number, relfx.weighted.alpha, 1e-10, 0, 'weighted alpha');
  });
  it('factor analysis KMO, Bartlett, eigenvalues', () => {
    const item = run('models.factor', buildSurvey(), { variables: ['v_r1', 'v_r2', 'v_r3', 'v_r4', 'v_s1', 'v_s2', 'v_s3', 'v_s4'] }, {});
    const kb = table(item, "KMO and Bartlett's Test");
    close(kb.rows[0][1].v as number, ffx.kmo, 1e-10, 0, 'KMO');
    close(kb.rows[1][2].v as number, ffx.bartlett, 1e-10, 0, 'Bartlett');
    const tve = table(item, 'Total Variance Explained');
    closeAll(tve.rows.map((r) => r[1].v as number), ffx.eigenvalues, 1e-10, 0, 'eigenvalues');
  });
});

describe('dummy coding names and reference categories', () => {
  const ds = buildSurvey();
  const names = (ref: string) => {
    const item = run('models.linear', ds, { dependent: ['v_trust'], block1: ['v_educ_cat'] }, { reference: ref });
    return table(item, 'Coefficients').rows.slice(1).map((r) => r[0].v);
  };
  it('first / last / most frequent', () => {
    expect(names('first')).toEqual(['educ_cat: Secondary (ref = Primary)', 'educ_cat: Vocational (ref = Primary)', 'educ_cat: Graduate (ref = Primary)']);
    expect(names('last')).toEqual(['educ_cat: Primary (ref = Graduate)', 'educ_cat: Secondary (ref = Graduate)', 'educ_cat: Vocational (ref = Graduate)']);
    const counts = [1, 2, 3, 4].map((c) => socio.educ_cat.filter((x) => x === c).length);
    const modeCode = counts.indexOf(Math.max(...counts)) + 1;
    const labels = ['Primary', 'Secondary', 'Vocational', 'Graduate'];
    for (const n of names('frequent')) expect(n).toMatch(new RegExp(`\\(ref = ${labels[modeCode - 1]}\\)$`));
  });
  it('dummy coding off keeps a labelled variable as a scale predictor; strings are always categorical', () => {
    const item = run('models.linear', ds, { dependent: ['v_trust'], block1: ['v_educ_cat', 'v_sector'] }, { dummy: false });
    const rows = table(item, 'Coefficients').rows.slice(1).map((r) => r[0].v);
    expect(rows).toEqual(['educ_cat', 'sector: private (ref = none)', 'sector: public (ref = none)']);
  });
});

describe('warnings instead of crashes', () => {
  it('perfect collinearity: excluded variable, warning, Excluded Variables table', () => {
    const ds = buildSurvey();
    const v = makeVariable({ id: 'v_combo', name: 'combo', label: 'educ + age' });
    const col = ds.columns['v_educ'] as Float64Array;
    const age = ds.columns['v_age'] as Float64Array;
    const ds2: Dataset = { ...ds, variables: [...ds.variables, v], columns: { ...ds.columns, v_combo: Float64Array.from(col, (x, i) => x + age[i]) } };
    const item = run('models.linear', ds2, { dependent: ['v_trust'], block1: ['v_educ', 'v_age', 'v_combo'] }, {});
    expectWellFormed(item, 'models.linear');
    expect(texts(item, 'warning').some((t) => /collinearity/.test(t) && /combo/.test(t))).toBe(true);
    const ex = table(item, 'Excluded Variables');
    expect(ex.rows.some((r) => r.some((c) => c.v === 'combo'))).toBe(true);
  });
  it('high VIF produces a multicollinearity warning', () => {
    const ds = buildSurvey();
    const educ = ds.columns['v_educ'] as Float64Array;
    const v = makeVariable({ id: 'v_educ2', name: 'educ2' });
    const ds2: Dataset = { ...ds, variables: [...ds.variables, v], columns: { ...ds.columns, v_educ2: Float64Array.from(educ, (x, i) => x + ((i * 7919) % 13) / 40) } };
    const item = run('models.linear', ds2, { dependent: ['v_trust'], block1: ['v_educ', 'v_educ2', 'v_age'] }, {});
    expect(texts(item, 'warning').some((t) => /VIF ≥ 10/.test(t))).toBe(true);
  });
  it('quasi-complete separation in logistic regression names the category', () => {
    const ds = buildSurvey();
    const ds2: Dataset = { ...ds, columns: { ...ds.columns, v_voted: Float64Array.from(lfx.ySeparated) } };
    const item = run('models.logistic', ds2, { dependent: ['v_voted'], covariates: ['v_educ', 'v_age', 'v_female', 'v_region'] }, {});
    expectWellFormed(item, 'models.logistic');
    const w = texts(item, 'warning').join(' ');
    expect(w).toMatch(/Quasi-complete separation/);
    expect(w).toMatch(/South/);
    expect(w).toMatch(/region/);
  });
  it('complete separation on a covariate', () => {
    const ds = buildSurvey();
    const educ = ds.columns['v_educ'] as Float64Array;
    const ds2: Dataset = { ...ds, columns: { ...ds.columns, v_voted: Float64Array.from(educ, (x) => (x >= 14 ? 1 : 0)) } };
    const item = run('models.logistic', ds2, { dependent: ['v_voted'], covariates: ['v_educ', 'v_age'] }, {});
    expectWellFormed(item, 'models.logistic');
    expect(texts(item, 'warning').join(' ')).toMatch(/Complete separation detected: educ/);
  });
  it('logistic rejects a dependent with three values', () => {
    expect(() => run('models.logistic', buildSurvey(), { dependent: ['v_party'], covariates: ['v_educ'] })).toThrow(/exactly two/);
  });
  it('reliability flags a reverse-worded item and low alpha', () => {
    const item = run('models.reliability', buildSurvey(), { items: ['v_r1', 'v_r2', 'v_r3', 'v_r4'] }, {});
    const w = texts(item, 'warning').join(' ');
    expect(w).toMatch(/r4 correlates negatively.*reverse coding/);
    expect(w).toMatch(/below \.60/);
  });
  it('factor analysis warns on unsuitable data (KMO < .6)', () => {
    const ds = buildSurvey();
    const n = ds.nCases;
    const extra = ['n1', 'n2', 'n3', 'n4'].map((name, k) => makeVariable({ id: `v_${name}`, name }));
    const cols: Record<string, Float64Array> = {};
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (const v of extra) cols[v.id] = Float64Array.from({ length: n }, () => rnd());
    const ds2: Dataset = { ...ds, variables: [...ds.variables, ...extra], columns: { ...ds.columns, ...cols } };
    const item = run('models.factor', ds2, { variables: extra.map((v) => v.id) }, { criterion: 'fixed', nFactors: 2 });
    expectWellFormed(item, 'models.factor');
    expect(texts(item, 'warning').some((t) => /KMO/.test(t))).toBe(true);
  });
  it('suppressing small loadings blanks those cells', () => {
    const item = run('models.factor', buildSurvey(), { variables: ['v_r1', 'v_r2', 'v_r3', 'v_r4', 'v_s1', 'v_s2', 'v_s3', 'v_s4'] }, { suppress: true, suppressBelow: 0.3 });
    const rm = table(item, 'Rotated Component Matrix');
    let blanks = 0;
    for (const r of rm.rows) for (const c of r.slice(1)) {
      if (c.v === null) blanks++;
      else expect(Math.abs(c.v as number)).toBeGreaterThanOrEqual(0.3);
    }
    expect(blanks).toBeGreaterThan(0);
  });
  it('stepwise that enters nothing reports it', () => {
    const item = run('models.linear', buildSurvey(), { dependent: ['v_trust'], block1: ['v_noise'] }, { method: 'stepwise' });
    expect(texts(item, 'warning').join(' ')).toMatch(/No predictor met the stepwise entry criterion/);
  });
  it('clear errors: dependent also a predictor, no cases left', () => {
    const p = proc('models.linear');
    expect(p.validate!(buildSurvey(), { dependent: ['v_trust'], block1: ['v_trust'] }, defaultOptions(p))).toMatch(/cannot also be a predictor/);
    const ds = buildSurvey();
    const allMissing: Dataset = { ...ds, columns: { ...ds.columns, v_trust: new Float64Array(ds.nCases).fill(NaN) } };
    expect(() => p.run(allMissing, { dependent: ['v_trust'], block1: ['v_educ'] }, defaultOptions(p))).toThrow(/No cases are left/);
  });
});
