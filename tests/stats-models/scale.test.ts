import { describe, expect, it } from 'vitest';
import rfx from './fixtures/reliability.json';
import ffx from './fixtures/factor.json';
import { oneFactorML, reliabilityAnalysis } from '../../src/lib/stats/reliability';
import { correlationMatrix, extractFactors, kmoBartlett, rotate, sortOrder } from '../../src/lib/stats/factor';
import { close, closeAll, closeLoadings, col, ones } from './helpers';

const n = col('educ').length;

describe('reliability (vs pingouin / pandas)', () => {
  const check = (items: string[], w: Float64Array, ref: typeof rfx.unweighted, label: string) => {
    const r = reliabilityAnalysis(items.map(col), w);
    close(r.alpha, ref.alpha, 1e-10, 0, `${label} alpha`);
    close(r.alphaStandardized, ref.alphaStd, 1e-10, 0, `${label} std alpha`);
    closeAll(r.means, ref.means, 1e-12, 0, `${label} means`);
    closeAll(r.sds, ref.sds, 1e-10, 0, `${label} sds`);
    close(r.scaleMean, ref.scaleMean, 1e-12, 0, `${label} scale mean`);
    close(r.scaleVariance, ref.scaleVar, 1e-10, 0, `${label} scale var`);
    close(r.summary.correlations.mean, ref.meanInterItemR, 1e-10, 0, `${label} mean r`);
    r.itemTotal.forEach((it, i) => {
      const e = ref.itemTotal[i];
      close(it.scaleMeanIfDeleted, e.meanDel, 1e-12, 0, `${label} meanDel`);
      close(it.scaleVarianceIfDeleted, e.varDel, 1e-10, 0, `${label} varDel`);
      close(it.correctedItemTotal, e.rit, 1e-10, 1e-12, `${label} r(it)`);
      close(it.squaredMultiple, e.smc, 1e-9, 0, `${label} SMC`);
      close(it.alphaIfDeleted, e.alphaDel, 1e-9, 1e-12, `${label} alpha if deleted`);
    });
    const om = oneFactorML(r.corr);
    expect(om.converged).toBe(true);
    close(om.omega, ref.omega, 1e-6, 0, `${label} omega`);
    closeAll(om.loadings, ref.loadings, 1e-5, 1e-6, `${label} ML loadings`);
    return r;
  };

  it('alpha, standardized alpha, item-total statistics, omega (with a reverse-worded item)', () => {
    const r = check(['r1', 'r2', 'r3', 'r4'], ones(n), rfx.unweighted, 'r');
    expect(r.itemTotal[3].correctedItemTotal).toBeLessThan(0);
  });
  it('all-positive scale', () => {
    check(['s1', 's2', 's3', 's4'], ones(n), rfx.positive, 's');
  });
  it('frequency weights equal replication', () => {
    check(['r1', 'r2', 'r3', 'r4'], col('wt'), rfx.weighted, 'weighted');
  });
  it('rejects zero-variance items and single items', () => {
    expect(() => reliabilityAnalysis([col('r1')], ones(n))).toThrow(/at least two/);
    expect(() => reliabilityAnalysis([col('r1'), new Float64Array(n).fill(3)], ones(n))).toThrow(/zero variance/);
  });
});

describe('factor analysis (vs numpy / factor_analyzer)', () => {
  const names = ['r1', 'r2', 'r3', 'r4', 's1', 's2', 's3', 's4'];
  const cols = names.map(col);
  const R = correlationMatrix(cols, ones(n));

  it('correlation matrix, KMO/MSA, Bartlett, determinant', () => {
    closeAll(R.flat(), ffx.R.flat(), 1e-12, 1e-14, 'R');
    const kb = kmoBartlett(R, n);
    close(kb.kmo, ffx.kmo, 1e-10, 0, 'KMO');
    closeAll(kb.msa, ffx.msa, 1e-10, 0, 'MSA');
    close(kb.chi2, ffx.bartlett, 1e-10, 0, 'Bartlett');
    close(kb.p, ffx.bartlettP, 1e-6, 0, 'Bartlett p');
    close(kb.determinant, ffx.det, 1e-10, 0, 'det');
  });

  it('principal components: eigenvalues, loadings (sum of each column positive)', () => {
    const ex = extractFactors(R, { method: 'pc' });
    closeAll(ex.eigenvalues, ffx.eigenvalues, 1e-11, 0, 'eigen');
    expect(ex.nFactors).toBe(ffx.nFactors);
    closeAll(ex.loadings.flat(), ffx.pcLoadings.flat(), 1e-9, 1e-12, 'PC loadings');
  });

  it('principal axis factoring with the SPSS stopping rule (algorithm oracle)', () => {
    const ex = extractFactors(R, { method: 'paf' });
    expect(ex.iterations).toBe(ffx.pafIterations);
    closeAll(ex.initialCommunalities, ffx.pafInitial, 1e-10, 0, 'SMC');
    closeAll(ex.loadings.flat(), ffx.pafLoadings.flat(), 1e-8, 1e-11, 'PAF loadings');
  });

  for (const ext of ['pc', 'paf'] as const)
    for (const rot of ['varimax', 'promax', 'oblimin'] as const) {
      it(`${ext} + ${rot} rotation (up to column sign/order)`, () => {
        const ex = extractFactors(R, { method: ext });
        const r = rotate(ex.loadings, rot);
        const ref = ffx.rotations[`${ext}_${rot}`];
        expect(r.converged).toBe(true);
        closeLoadings(r.pattern, ref.pattern, 1e-6, 1e-7, `${ext}_${rot}`, true);
        // Factor correlations up to sign.
        const m = ref.phi.length;
        for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) close(Math.abs(r.phi[a][b]), Math.abs(ref.phi[a][b]), 1e-6, 1e-7, 'phi');
        // Structure = pattern * phi.
        for (let i = 0; i < r.pattern.length; i++)
          for (let k = 0; k < m; k++) {
            let s = 0;
            for (let a = 0; a < m; a++) s += r.pattern[i][a] * r.phi[a][k];
            close(r.structure[i][k], s, 1e-12, 1e-12, 'structure');
          }
      });
    }

  it('varimax keeps communalities; sort-by-size ordering', () => {
    const ex = extractFactors(R, { method: 'pc' });
    const r = rotate(ex.loadings, 'varimax');
    const h = r.pattern.map((row) => row.reduce((s, v) => s + v * v, 0));
    closeAll(h, ex.communalities, 1e-10, 0, 'communalities');
    const order = sortOrder(r.pattern);
    expect(order.length).toBe(8);
    expect(new Set(order).size).toBe(8);
  });

  it('weighted correlation / Bartlett equal replication', () => {
    const w = col('wt');
    const Rw = correlationMatrix(cols, w);
    closeAll(Rw.flat(), ffx.weighted.R.flat(), 1e-12, 1e-14, 'Rw');
    const W = w.reduce((a, b) => a + b, 0);
    close(kmoBartlett(Rw, W).chi2, ffx.weighted.bartlett, 1e-10, 0, 'Bartlett w');
    closeAll(extractFactors(Rw, { method: 'pc' }).eigenvalues, ffx.weighted.eigenvalues, 1e-11, 0, 'eigen w');
  });

  it('fixed number of factors and clear errors', () => {
    expect(extractFactors(R, { method: 'pc', nFactors: 3 }).nFactors).toBe(3);
    // Duplicate variable: singular matrix blocks PAF with a readable message.
    const dup = correlationMatrix([cols[0], cols[0], cols[1]], ones(n));
    expect(() => extractFactors(dup, { method: 'paf', nFactors: 1 })).toThrow(/singular/);
    expect(Number.isNaN(kmoBartlett(dup, n).kmo)).toBe(true);
  });
});
