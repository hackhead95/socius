import { describe, expect, it } from 'vitest';
import lfx from './fixtures/logistic.json';
import mfx from './fixtures/multinomial.json';
import ofx from './fixtures/ordinal.json';
import {
  detectSeparation,
  fitBinaryLogit,
  fitMultinomial,
  hosmerLemeshow,
  multinomialNullLogLik,
  pseudoR2,
  scoreTestsConstantOnly,
  waldTest,
} from '../../src/lib/stats/logistic';
import { cumulativeNullLogLik, fitCumulativeLogit, ordinalGoodnessOfFit } from '../../src/lib/stats/ordinal';
import { close, closeAll, col, dummyCols, ones } from './helpers';

const educ = col('educ'), age = col('age'), female = col('female');
const n = educ.length;

describe('binary logistic regression (vs statsmodels Logit / GLM)', () => {
  const y = col('voted');
  const X = [educ, age, female, ...dummyCols(col('region'), [2, 3])];
  const fit = fitBinaryLogit(y, X, ones(n));

  it('coefficients, SEs, log-likelihood', () => {
    expect(fit.converged).toBe(true);
    closeAll(fit.coef, lfx.unweighted.params, 1e-7, 1e-10, 'B');
    closeAll(fit.se, lfx.unweighted.bse, 1e-7, 1e-10, 'SE');
    close(fit.logLik, lfx.unweighted.llf, 1e-10, 0, 'LL');
  });

  it('pseudo R², Wald test for a multi-df term, classification', () => {
    const ll0 = multinomialNullLogLik(y, 2, ones(n));
    close(ll0, lfx.unweighted.llnull, 1e-9, 0, 'LL0'); // statsmodels fits llnull iteratively
    const pr = pseudoR2(ll0, fit.logLik, n);
    close(pr.coxSnell, lfx.unweighted.coxSnell, 1e-8, 0, 'Cox-Snell');
    close(pr.nagelkerke, lfx.unweighted.nagelkerke, 1e-8, 0, 'Nagelkerke');
    const wt = waldTest(fit.coef, fit.cov, [4, 5]);
    close(wt.chi2, lfx.unweighted.waldRegion, 1e-7, 0, 'Wald region');
    close(wt.p, lfx.unweighted.pWaldRegion, 1e-6, 0, 'Wald p');
    let correct = 0;
    for (let i = 0; i < n; i++) if ((fit.fitted[i] >= 0.5) === (y[i] === 1)) correct++;
    close((100 * correct) / n, lfx.unweighted.pctCorrect, 1e-12, 0, '% correct');
  });

  it('Block 0 score tests (vs statsmodels GLM.score_test)', () => {
    const s = scoreTestsConstantOnly(y, X, ones(n));
    closeAll(s.each.map((e) => e.score), lfx.unweighted.scores, 1e-8, 1e-12, 'score');
    close(s.overall.score, lfx.unweighted.overallScore, 1e-8, 0, 'overall score');
  });

  it('Hosmer-Lemeshow (SPSS grouping, algorithm oracle)', () => {
    const hl = hosmerLemeshow(y, fit.fitted, ones(n), (i) => X.map((c) => c[i]).join('|'));
    close(hl.chi2, lfx.unweighted.hl.chi2, 1e-6, 0, 'HL chi2');
    expect(hl.df).toBe(lfx.unweighted.hl.df);
    close(hl.p, lfx.unweighted.hl.p, 1e-6, 0, 'HL p');
  });

  it('frequency weights (vs GLM freq_weights)', () => {
    const w = col('wt_f');
    const f = fitBinaryLogit(y, X, w);
    closeAll(f.coef, lfx.weighted.params, 1e-7, 1e-10, 'wB');
    closeAll(f.se, lfx.weighted.bse, 1e-7, 1e-10, 'wSE');
    close(f.logLik, lfx.weighted.llf, 1e-10, 0, 'wLL');
    const ll0 = multinomialNullLogLik(y, 2, w);
    close(ll0, lfx.weighted.llnull, 1e-10, 0, 'wLL0');
    const W = w.reduce((a, b) => a + b, 0);
    close(pseudoR2(ll0, f.logLik, W).coxSnell, lfx.weighted.coxSnell, 1e-8, 0, 'wCS');
  });

  it('detects quasi-complete separation and names the variable', () => {
    const ys = Float64Array.from(lfx.ySeparated);
    const f = fitBinaryLogit(ys, X, ones(n));
    const sep = detectSeparation(ys, X, ones(n), f);
    expect(sep).not.toBeNull();
    expect(sep!.kind).toBe('quasi-complete');
    expect(sep!.variables).toContain(4); // region = 3 dummy
    expect(detectSeparation(y, X, ones(n), fit)).toBeNull();
  });

  it('detects complete separation on a continuous predictor', () => {
    const x = Float64Array.from({ length: 40 }, (_, i) => i);
    const ys = Float64Array.from(x, (v) => (v >= 20 ? 1 : 0));
    const f = fitBinaryLogit(ys, [x], ones(40));
    const sep = detectSeparation(ys, [x], ones(40), f);
    expect(sep?.kind).toBe('complete');
    expect(sep?.variables).toEqual([0]);
  });
});

describe('multinomial logistic regression (vs statsmodels MNLogit)', () => {
  const party = col('party');
  const yIdx = Int32Array.from(party, (v) => v - 1);
  const X = [educ, age, female];
  for (const ref of ['first', 'last'] as const) {
    it(`parameters, SEs, LL, LR tests (reference = ${ref})`, () => {
      const r = ref === 'first' ? 0 : 2;
      const fit = fitMultinomial(yIdx, 3, r, X, ones(n));
      const exp = mfx[ref];
      expect(fit.converged).toBe(true);
      expect(fit.cats.map((c) => c + 1)).toEqual(exp.cats);
      for (let k = 0; k < 2; k++) {
        closeAll(fit.coef[k], exp.params[k], 1e-7, 1e-10, `B${k}`);
        closeAll(fit.se[k], exp.bse[k], 1e-7, 1e-10, `SE${k}`);
      }
      close(fit.logLik, exp.llf, 1e-10, 0, 'LL');
      const ll0 = multinomialNullLogLik(yIdx, 3, ones(n));
      // statsmodels obtains llnull by iterative fitting; ours is the closed form, hence 1e-9.
      close(ll0, exp.llnull, 1e-9, 0, 'LL0');
      const pr = pseudoR2(ll0, fit.logLik, n);
      close(pr.coxSnell, exp.coxSnell, 1e-8, 0, 'CS');
      close(pr.nagelkerke, exp.nagelkerke, 1e-8, 0, 'NK');
      close(pr.mcfadden, exp.mcfadden, 1e-8, 0, 'McF');
      ['educ', 'age', 'female'].forEach((nm, j) => {
        const red = fitMultinomial(yIdx, 3, r, X.filter((_, i) => i !== j), ones(n));
        close(2 * (fit.logLik - red.logLik), exp.lr[nm as 'educ'], 1e-7, 1e-10, `LR ${nm}`);
      });
    });
  }
  it('frequency weights equal replication', () => {
    const fit = fitMultinomial(yIdx, 3, 2, X, col('wt'));
    for (let k = 0; k < 2; k++) {
      closeAll(fit.coef[k], mfx.weighted.params[k], 1e-7, 1e-10, `wB${k}`);
      closeAll(fit.se[k], mfx.weighted.bse[k], 1e-7, 1e-10, `wSE${k}`);
    }
    close(fit.logLik, mfx.weighted.llf, 1e-10, 0, 'wLL');
  });
});

describe('ordinal regression, PLUM logit (vs statsmodels OrderedModel)', () => {
  // statsmodels OrderedModel uses P(Y <= j) = F(cut_j - x'beta), the same sign convention as SPSS PLUM.
  const y = Int32Array.from(col('likert'), (v) => v - 1);
  const X = [educ, age, female];
  const fit = fitCumulativeLogit(y, 5, X, ones(n));

  it('thresholds, location parameters and SEs', () => {
    expect(fit.converged).toBe(true);
    closeAll(fit.params.slice(0, 4), ofx.thresholds, 1e-7, 1e-10, 'thresholds');
    closeAll(fit.params.slice(4), ofx.beta, 1e-7, 1e-10, 'beta');
    closeAll(fit.se.slice(0, 4), ofx.seThresholds, 1e-6, 1e-10, 'SE thresholds');
    closeAll(fit.se.slice(4), ofx.seBeta, 1e-6, 1e-10, 'SE beta');
    close(fit.logLik, ofx.llf, 1e-10, 0, 'LL');
  });

  it('model fitting, pseudo R², goodness of fit', () => {
    const ll0 = cumulativeNullLogLik(y, 5, ones(n));
    close(ll0, ofx.llnull, 1e-12, 0, 'LL0');
    const pr = pseudoR2(ll0, fit.logLik, n);
    close(pr.coxSnell, ofx.coxSnell, 1e-8, 0, 'CS');
    close(pr.nagelkerke, ofx.nagelkerke, 1e-8, 0, 'NK');
    close(pr.mcfadden, ofx.mcfadden, 1e-8, 0, 'McF');
    const gof = ordinalGoodnessOfFit(fit, y, ones(n), (i) => X.map((c) => c[i]).join('|'));
    close(gof.pearson, ofx.pearson, 1e-7, 0, 'Pearson');
    close(gof.deviance, ofx.deviance, 1e-7, 0, 'Deviance');
    expect(gof.df).toBe(ofx.gofDf);
  });

  it('general (non-parallel) model for the test of parallel lines (algorithm oracle)', () => {
    const gen = fitCumulativeLogit(y, 5, X, ones(n), { general: true });
    expect(gen.converged).toBe(true);
    // The oracle minimises with generic optimisers, so its -2LL is an upper bound close to ours.
    expect(gen.m2ll).toBeLessThanOrEqual(ofx.m2llGeneral + 1e-6);
    close(gen.m2ll, ofx.m2llGeneral, 1e-8, 0, 'general -2LL');
  });

  it('frequency weights equal replication', () => {
    const f = fitCumulativeLogit(y, 5, X, col('wt'));
    closeAll(f.params.slice(0, 4), ofx.weighted.thresholds, 1e-7, 1e-10, 'w thresholds');
    closeAll(f.params.slice(4), ofx.weighted.beta, 1e-7, 1e-10, 'w beta');
    closeAll(f.se.slice(4), ofx.weighted.seBeta, 1e-6, 1e-10, 'w SE beta');
    close(f.logLik, ofx.weighted.llf, 1e-10, 0, 'w LL');
  });
});
