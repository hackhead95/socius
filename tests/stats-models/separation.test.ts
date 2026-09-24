// Logit models under (quasi-)complete separation: estimates at the last iteration, standard errors
// from a numerically stable inverse of the information matrix (huge for the separated parameters,
// ordinary for the rest), and SPSS-like warnings. Unaffected parameters are compared with
// statsmodels fits of the limiting model (scripts/oracle/models_separation.py).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import sfx from './fixtures/separation.json';
import lfx from './fixtures/logistic.json';
import { fitBinaryLogit, fitMultinomial } from '../../src/lib/stats/logistic';
import { fitCumulativeLogit } from '../../src/lib/stats/ordinal';
import { fromRows, spdInverse, spdInverseRobust, spdSolveRobust } from '../../src/lib/stats/matrix';
import { importFile } from '../../src/lib/io';
import { procedures } from '../../src/procedures';
import { defaultOptions } from '../../src/core/procedure';
import type { Dataset } from '../../src/core/types';
import type { OutputItem, OutputTable } from '../../src/core/output';
import { buildSurvey } from './dataset';
import { close, closeAll, col, dummyCols, ones } from './helpers';

const HESSIAN = 'Unexpected singularities in the Hessian matrix are encountered. This indicates that either some predictor variables should be excluded or some categories should be merged.';

const educ = col('educ'), age = col('age'), female = col('female'), region = col('region');
const n = educ.length;
const [reg2, reg3] = dummyCols(region, [2, 3]);
const keptRows = Array.from(region, (r, i) => (r === 3 ? -1 : i)).filter((i) => i >= 0);

function run(id: string, ds: Dataset, slots: Record<string, string[]>, opts: Record<string, unknown> = {}): OutputItem {
  const def = procedures.find((p) => p.id === id)!;
  const o = { ...defaultOptions(def), ...opts };
  expect(def.validate?.(ds, slots, o) ?? null).toBeNull();
  return def.run(ds, slots, o);
}
function table(item: OutputItem, title: string): OutputTable {
  const b = item.blocks.find((x) => x.kind === 'table' && x.table.title === title);
  if (!b || b.kind !== 'table') throw new Error(`no table ${title}`);
  return b.table;
}
function texts(item: OutputItem, style: string): string[] {
  return item.blocks.flatMap((b) => (b.kind === 'text' && b.style === style ? [b.text] : []));
}
function noBadText(item: OutputItem) {
  for (const b of item.blocks) if (b.kind === 'text') {
    expect(b.text).not.toMatch(/NaN|undefined|Infinity/);
    expect(b.text).not.toMatch(/—/);
  }
}

describe('robust inverse of an information matrix', () => {
  it('equals the Cholesky inverse for a positive-definite matrix', () => {
    const A = fromRows([[4, 1, 0.5], [1, 3, 0.2], [0.5, 0.2, 2]]);
    const r = spdInverseRobust(A);
    expect(r.fallback).toBe(false);
    expect(r.rankDeficient).toBe(false);
    closeAll(r.inv.data, spdInverse(A).data, 1e-14, 1e-15, 'inv');
  });
  it('floors null directions: huge but finite variances there, ordinary ones elsewhere', () => {
    // Parameters 0 and 1 are perfectly confounded; parameter 2 is independent of them.
    const A = fromRows([[1, 1, 0], [1, 1, 0], [0, 0, 4]]);
    const r = spdInverseRobust(A);
    expect(r.fallback).toBe(true);
    expect(r.rankDeficient).toBe(true);
    expect(r.inv.data[0]).toBeGreaterThan(1e10);
    expect(Number.isFinite(r.inv.data[0])).toBe(true);
    close(r.inv.data[8], 0.25, 1e-10, 0, 'independent variance');
    close(r.nullLoading[0], 0.5, 1e-10, 0, 'null loading 0');
    close(r.nullLoading[1], 0.5, 1e-10, 0, 'null loading 1');
    expect(r.nullLoading[2]).toBeLessThan(1e-20);
  });
  it('solves on the identified subspace (minimum norm) for a singular matrix', () => {
    const A = fromRows([[1, 1, 0], [1, 1, 0], [0, 0, 4]]);
    const s = spdSolveRobust(A, [2, 2, 8]);
    expect(s.rankDeficient).toBe(true);
    closeAll(s.x, [1, 1, 2], 1e-10, 1e-12, 'x');
  });
});

describe('binary logistic regression, region = South has no voters', () => {
  const y = Float64Array.from(lfx.ySeparated);
  const X = [educ, age, female, reg2, reg3];
  const fit = fitBinaryLogit(y, X, ones(n));

  it('reports finite SEs for every coefficient, a huge one only for the separated dummy', () => {
    expect(fit.converged).toBe(false);
    expect(fit.diverged).toBe(true);
    for (const s of fit.se) expect(Number.isFinite(s)).toBe(true);
    expect(Array.from(fit.unstable)).toEqual([0, 0, 0, 0, 0, 1]);
    expect(fit.se[5]).toBeGreaterThan(1e4);
    expect(fit.coef[5]).toBeLessThan(-15);
  });
  it('unaffected coefficients and SEs match statsmodels Logit without the South cases', () => {
    closeAll(fit.coef.slice(0, 5), sfx.binary.params, 1e-7, 1e-10, 'B');
    closeAll(fit.se.slice(0, 5), sfx.binary.bse, 1e-7, 1e-10, 'SE');
    close(fit.logLik, sfx.binary.llf, 1e-9, 1e-9, 'LL');
  });
  it('procedure: marked row, other rows usable, no "." standard errors', () => {
    const ds = buildSurvey();
    const ds2: Dataset = { ...ds, columns: { ...ds.columns, v_voted: y } };
    const item = run('models.logistic', ds2, { dependent: ['v_voted'], covariates: ['v_educ', 'v_age', 'v_female', 'v_region'] }, { block0: false });
    noBadText(item);
    const t = table(item, 'Variables in the Equation');
    const seCells = t.rows.map((r) => r[r.length - 7]).filter((c) => typeof c.v === 'number');
    expect(seCells.length).toBe(6);
    for (const c of seCells) expect(Number.isFinite(c.v as number)).toBe(true);
    expect(seCells.filter((c) => c.mark === 'a').length).toBe(1);
    const w = texts(item, 'warning').join(' ');
    expect(w).toMatch(/Quasi-complete separation detected: all cases in the "South" category of region/);
    expect(w).toMatch(/other estimates, standard errors and tests are not affected/);
    expect(texts(item, 'interpretation').join(' ')).not.toMatch(/South/);
  });
});

describe('ordinal regression, every South case in the lowest category', () => {
  const y = Int32Array.from(sfx.ordinal.likert, (v) => v - 1);
  const X = [educ, age, female, reg2, reg3];
  const fit = fitCumulativeLogit(y, 5, X, ones(n));

  it('thresholds and unaffected slopes match statsmodels OrderedModel without the South cases', () => {
    for (const s of fit.se) expect(Number.isFinite(s)).toBe(true);
    expect(Array.from(fit.unstable)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 1]);
    expect(fit.se[8]).toBeGreaterThan(1e4);
    closeAll(fit.params.slice(0, 4), sfx.ordinal.thresholds, 1e-7, 1e-10, 'thresholds');
    closeAll(fit.params.slice(4, 8), sfx.ordinal.beta, 1e-7, 1e-10, 'beta');
    // statsmodels OrderedModel takes its covariance from a numerical Hessian (about 1e-6 accurate).
    closeAll(fit.se.slice(0, 4), sfx.ordinal.seThresholds, 5e-6, 1e-10, 'SE thresholds');
    closeAll(fit.se.slice(4, 8), sfx.ordinal.seBeta, 5e-6, 1e-10, 'SE beta');
    close(fit.logLik, sfx.ordinal.llf, 1e-9, 1e-9, 'LL');
  });
  it('unaffected SEs equal the analytic SEs of the limiting model (South cases left out)', () => {
    const pick = (a: ArrayLike<number>) => Float64Array.from(keptRows, (i) => a[i]);
    const yk = Int32Array.from(keptRows, (i) => y[i]);
    const lim = fitCumulativeLogit(yk, 5, [educ, age, female, reg2].map(pick), ones(keptRows.length));
    expect(lim.converged).toBe(true);
    closeAll(fit.params.slice(0, 8), lim.params, 1e-9, 1e-12, 'params');
    closeAll(fit.se.slice(0, 8), lim.se, 1e-9, 1e-12, 'SE');
  });
  it('procedure: separation warning names the category, only that row is marked', () => {
    const ds = buildSurvey();
    const ds2: Dataset = { ...ds, columns: { ...ds.columns, v_likert: Float64Array.from(sfx.ordinal.likert) } };
    const item = run('models.ordinal', ds2, { dependent: ['v_likert'], predictors: ['v_educ', 'v_age', 'v_female', 'v_region'] });
    noBadText(item);
    const t = table(item, 'Parameter Estimates');
    const marked = t.rows.filter((r) => r.some((c) => c.mark === 'b'));
    expect(marked.length).toBe(1);
    expect(marked[0].some((c) => typeof c.v === 'string' && /South/.test(c.v))).toBe(true);
    const w = texts(item, 'warning').join(' ');
    expect(w).toMatch(/all cases with region = "South" have likert = "Very dissatisfied", the lowest category/);
    expect(w).not.toMatch(/did not converge/);
  });
});

describe('multinomial logistic regression, every South case chooses Centre', () => {
  const party = sfx.multinomial.party;
  const yIdx = Int32Array.from(party, (v) => v - 1);
  const X = [educ, age, female, reg2, reg3];
  const fit = fitMultinomial(yIdx, 3, 2, X, ones(n));

  it('unaffected parameters and SEs match statsmodels MNLogit without the South cases', () => {
    expect(fit.cats.map((c) => c + 1)).toEqual(sfx.multinomial.cats);
    for (let k = 0; k < 2; k++) {
      for (const s of fit.se[k]) expect(Number.isFinite(s)).toBe(true);
      closeAll(fit.coef[k].slice(0, 5), sfx.multinomial.params[k], 1e-7, 1e-10, `B${k}`);
      closeAll(fit.se[k].slice(0, 5), sfx.multinomial.bse[k], 1e-6, 1e-10, `SE${k}`);
      expect(Array.from(fit.unstable[k])).toEqual([0, 0, 0, 0, 0, 1]);
      expect(fit.se[k][5]).toBeGreaterThan(1e4);
    }
    close(fit.logLik, sfx.multinomial.llf, 1e-9, 1e-9, 'LL');
  });
  it('the same data without separation still converges normally', () => {
    const f = fitMultinomial(Int32Array.from(col('party'), (v) => v - 1), 3, 2, X, ones(n));
    expect(f.converged).toBe(true);
    expect(f.singular).toBe(false);
    expect(f.diverged).toBe(false);
    for (const u of f.unstable) expect(Array.from(u).every((x) => x === 0)).toBe(true);
  });
  it('keeps the non-separated fits identical (no warning on the regular survey)', () => {
    const item = run('models.multinomial', buildSurvey(), { dependent: ['v_party'], predictors: ['v_educ', 'v_age', 'v_female', 'v_region'] });
    const w = texts(item, 'warning').join(' ');
    expect(w).not.toMatch(/singularities|separation/);
    expect(table(item, 'Parameter Estimates').rows.some((r) => r.some((c) => c.mark === 'c'))).toBe(false);
  });
});

describe('sample survey: employ on age + gender (no "Other" gender respondent is a Student or Retired)', () => {
  const SAV = fileURLToPath(new URL('../../src/samples/urban_trust_survey.sav', import.meta.url));
  let ds: Dataset;
  let item: OutputItem;
  beforeAll(async () => {
    ds = (await importFile('urban_trust_survey.sav', new Uint8Array(readFileSync(SAV)))).dataset;
    const id = (nm: string) => ds.variables.find((v) => v.name === nm)!.id;
    item = run('models.multinomial', ds, { dependent: [id('employ')], predictors: [id('age'), id('gender')] });
  });

  it('shows SPSS-like singularity warning and names the empty combination', () => {
    noBadText(item);
    const w = texts(item, 'warning');
    expect(w.some((t) => t.startsWith(HESSIAN))).toBe(true);
    const all = w.join(' ');
    expect(all).toMatch(/No cases with gender = "Other \/ prefer to self-describe" have employ = "Student" or "Retired"/);
    expect(all).toMatch(/gender = "Other \/ prefer to self-describe" \(in all 6 comparisons\)/);
    expect(all).not.toMatch(/did not converge/);
    expect(texts(item, 'interpretation').join(' ')).toMatch(/left out of this summary/);
  });

  it('non-separated parameters get normal SEs matching statsmodels MNLogit; separated ones huge SEs', () => {
    const t = table(item, 'Parameter Estimates');
    expect(t.footnotes?.some((f) => f.startsWith('c. '))).toBe(true);
    // Rows per outcome category: Intercept, age, [gender = Man] (redundant), Woman, Other.
    const groups: Array<{ label: string; b: number; se: number; marked: boolean }[]> = [];
    let cur: Array<{ label: string; b: number; se: number; marked: boolean }> = [];
    for (const r of t.rows) {
      if (r[0].rowSpan) {
        cur = [];
        groups.push(cur);
      }
      const cells = r[0].rowSpan ? r.slice(1) : r;
      if (typeof cells[1].v !== 'number' || cells[2].v === null) continue; // redundant row
      cur.push({ label: String(cells[0].v), b: cells[1].v, se: cells[2].v as number, marked: cells[2].mark === 'c' });
    }
    expect(groups.length).toBe(6);
    groups.forEach((g, k) => {
      expect(g.map((x) => x.label)).toEqual(['Intercept', 'age', '[gender = Woman]', '[gender = Other / prefer to self-describe]']);
      for (let j = 0; j < 3; j++) {
        expect(g[j].marked).toBe(false);
        close(g[j].b, sfx.sample.params[k][j], 1e-6, 1e-9, `B[${k}][${j}]`);
        close(g[j].se, sfx.sample.bse[k][j], 1e-6, 1e-9, `SE[${k}][${j}]`);
      }
      expect(g[3].marked).toBe(true);
      expect(g[3].se).toBeGreaterThan(1e4);
      expect(Number.isFinite(g[3].se)).toBe(true);
    });
    // Differences between the diverging "Other" coefficients are identified and agree too.
    close(groups[0][3].b - groups[5][3].b, sfx.sample.params[0][3] - sfx.sample.params[5][3], 1e-6, 1e-8, 'difference');
  });

  it('likelihood-based results are unaffected (LL matches statsmodels)', () => {
    const t = table(item, 'Model Fitting Information');
    const final = t.rows[1][1].v as number;
    close(final, -2 * sfx.sample.llf, 1e-9, 1e-7, '-2LL');
  });
});
