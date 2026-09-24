import { describe, expect, it } from 'vitest';
import fx from './fixtures/regression.json';
import { durbinWatson, excludedStats, fitLinear, r2Change, stepwiseSelect, type LinearFit } from '../../src/lib/stats/regression';
import { close, closeAll, col, dummyCols, ones } from './helpers';

const y = col('trust');
const educ = col('educ'), age = col('age'), female = col('female'), income = col('income');
const n = y.length;

type Ref = (typeof fx)['m1'];

function checkFit(f: LinearFit, ref: Omit<Ref, 'vif' | 'dw' | 'corr'>, label: string) {
  closeAll([f.b0, ...f.b], ref.params, 1e-9, 1e-12, `${label} B`);
  closeAll([f.seB0, ...f.se], ref.bse, 1e-8, 1e-12, `${label} SE`);
  closeAll([f.tB0, ...f.t], ref.t, 1e-8, 1e-12, `${label} t`);
  closeAll([f.pB0, ...f.p], ref.p, 1e-6, 1e-14, `${label} p`);
  closeAll([f.ciB0[0], ...f.ci.map((c) => c[0])], ref.ciLo, 1e-8, 1e-12, `${label} ciLo`);
  closeAll([f.ciB0[1], ...f.ci.map((c) => c[1])], ref.ciHi, 1e-8, 1e-12, `${label} ciHi`);
  closeAll(f.beta, ref.beta, 1e-9, 1e-12, `${label} Beta`);
  close(f.r2, ref.r2, 1e-10, 1e-14, `${label} R2`);
  close(f.adjR2, ref.adjR2, 1e-10, 1e-14, `${label} adjR2`);
  close(f.F, ref.F, 1e-9, 1e-12, `${label} F`);
  close(f.pF, ref.pF, 1e-6, 1e-300, `${label} pF`);
  close(f.ssRes, ref.ssRes, 1e-10, 1e-12, `${label} SSres`);
  close(f.ssReg, ref.ssReg, 1e-9, 1e-12, `${label} SSreg`);
  close(f.dfRes, ref.dfRes, 1e-12, 0, `${label} dfRes`);
  close(f.seEstimate, ref.seEst, 1e-10, 1e-12, `${label} SEE`);
}

describe('linear regression (vs statsmodels / pingouin)', () => {
  const m1 = fitLinear(y, [educ, age, female], ones(n));

  it('OLS coefficients, SEs, t, p, CI, Beta, R², F (model 1)', () => {
    checkFit(m1, fx.m1, 'm1');
    closeAll(m1.vif, fx.m1.vif, 1e-9, 1e-12, 'VIF');
    closeAll(m1.tolerance, fx.m1.vif.map((v) => 1 / v), 1e-9, 1e-12, 'tolerance');
    close(durbinWatson(m1.residuals, ones(n)), fx.m1.dw, 1e-10, 1e-12, 'DW');
  });

  it('zero-order, partial and part correlations', () => {
    closeAll(m1.zeroOrder, fx.m1.corr.map((c) => c.zero), 1e-9, 1e-12, 'zero-order');
    closeAll(m1.partial, fx.m1.corr.map((c) => c.partial), 1e-8, 1e-12, 'partial');
    closeAll(m1.part, fx.m1.corr.map((c) => c.part), 1e-8, 1e-12, 'part');
  });

  it('hierarchical block with dummies and R² change', () => {
    const d = dummyCols(col('educ_cat'), [2, 3, 4]);
    const m2 = fitLinear(y, [educ, age, female, income, ...d], ones(n));
    checkFit(m2, fx.m2, 'm2');
    const ch = r2Change(m1, m2);
    close(ch.r2Change, fx.change.r2Change, 1e-9, 1e-14, 'R2 change');
    close(ch.fChange, fx.change.F, 1e-8, 1e-12, 'F change');
    close(ch.pChange, fx.change.p, 1e-6, 1e-300, 'Sig F change');
    expect(ch.df1).toBe(fx.change.df1);
    expect(ch.df2).toBe(fx.change.df2);
  });

  it('excluded-variable statistics (Beta In, t, partial, tolerance)', () => {
    const X = [educ, age, female, income];
    const ex = excludedStats(y, X, ones(n), [0, 1, 2], [3]);
    const ref = fx.excluded[0];
    close(ex[0].betaIn, ref.betaIn, 1e-8, 1e-12, 'Beta In');
    close(ex[0].t, ref.t, 1e-8, 1e-12, 't');
    close(ex[0].p, ref.p, 1e-6, 1e-14, 'p');
    close(ex[0].partial, ref.partial, 1e-8, 1e-12, 'partial');
    close(ex[0].tolerance, ref.tolerance, 1e-9, 1e-12, 'tolerance');
  });

  it('integer frequency weights equal case replication (SPSS WEIGHT BY)', () => {
    const w = col('wt');
    const f = fitLinear(y, [educ, age, female], w);
    checkFit(f, fx.weighted, 'weighted');
    close(durbinWatson(f.residuals, w), fx.weighted.dw, 1e-9, 1e-12, 'weighted DW');
  });

  it('non-integer frequency weights match GLM freq_weights', () => {
    const f = fitLinear(y, [educ, age, female], col('wt_f'));
    checkFit(f, fx.weightedFrac, 'wt_f');
  });

  it('collinear predictor is excluded, others unchanged', () => {
    const combo = Float64Array.from(educ, (v, i) => v + age[i]);
    const f = fitLinear(y, [educ, age, female, combo], ones(n));
    expect(f.included).toEqual([0, 1, 2]);
    expect(f.excluded).toEqual([3]);
    closeAll(f.b, m1.b, 1e-9, 1e-12, 'collinear B');
    const constant = new Float64Array(n).fill(4);
    const g = fitLinear(y, [constant, educ], ones(n));
    expect(g.excluded).toEqual([0]);
  });

  it('stepwise selection follows SPSS PIN/POUT rules', () => {
    const names = ['educ', 'age', 'female', 'income', 'noise', 'region'];
    const X = names.map(col);
    const steps = stepwiseSelect(y, X, ones(n), [], [0, 1, 2, 3, 4, 5]);
    const got = steps.map((s) => (s.entered !== undefined ? { entered: names[s.entered] } : { removed: names[s.removed!] }));
    expect(got).toEqual(fx.stepwise.steps);
    const final = steps[steps.length - 1].model.map((j) => names[j]);
    expect(final).toEqual(fx.stepwise.final);
    const f = fitLinear(y, final.map(col), ones(n));
    close(f.r2, fx.stepwise.r2, 1e-10, 0, 'stepwise R2');
    closeAll([f.b0, ...f.b], fx.stepwise.params, 1e-9, 1e-12, 'stepwise B');
  });

  it('errors clearly on a constant outcome or too few cases', () => {
    expect(() => fitLinear(new Float64Array(5).fill(2), [Float64Array.from([1, 2, 3, 4, 5])], ones(5))).toThrow(/no variance/);
    expect(() => fitLinear(Float64Array.from([1, 2, 4]), [Float64Array.from([1, 2, 3]), Float64Array.from([3, 1, 2])], ones(3))).toThrow(/Too few cases/);
  });
});
