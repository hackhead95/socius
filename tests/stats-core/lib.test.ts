// Core statistics library vs scipy / statsmodels / pingouin / scikit-posthocs references.
// Fixture: scripts/oracle/core_oracle.py (tests/stats-core/fixtures/core.json).
import { describe, expect, it } from 'vitest';
import fx from './fixtures/core.json';
import { exploreStats, ksLilliefors, lillieforsP, shapiroWilk, expandIntegerWeights } from '../../src/lib/stats/descriptives';
import { independentT, oneSampleT, pairedT } from '../../src/lib/stats/ttest';
import { oneWayAnova, postHoc } from '../../src/lib/stats/anova';
import {
  cellStats,
  chiSquareTests,
  cmh,
  fisherRxC,
  kappa,
  lambdaTau,
  mcnemar,
  nominalMeasures,
  ordinalMeasures,
  riskEstimate,
  spearmanFromTable,
} from '../../src/lib/stats/crosstabs';
import { binomialTest, chiSquareGof, dunnTest, friedman, kruskalWallis, mannWhitney, wilcoxonSignedRank } from '../../src/lib/stats/nonparametric';
import { kendallTauB, partialCorrelations, pearson, spearman } from '../../src/lib/stats/correlation';
import { studentizedRangePpf } from '../../src/lib/stats/distributions';

const STAT = 1e-8;
const PV = 1e-6;
let maxStatErr = 0;
let maxPErr = 0;

function close(got: number, want: number | null, tol: number, ctx: string, kind: 'stat' | 'p' = 'stat') {
  if (want === null) {
    expect(Number.isNaN(got), `${ctx}: expected NaN, got ${got}`).toBe(true);
    return;
  }
  const err = Math.abs(got - want) / Math.max(Math.abs(want), 1e-12);
  const abs = Math.abs(got - want);
  if (kind === 'stat') maxStatErr = Math.max(maxStatErr, Math.min(err, abs));
  else maxPErr = Math.max(maxPErr, Math.min(err, abs));
  if (!(err <= tol || abs <= tol * 1e-3)) throw new Error(`${ctx}: got ${got}, want ${want} (rel err ${err.toExponential(2)})`);
}

type AnyRec = Record<string, any>;

describe('descriptives', () => {
  (fx.descriptives as AnyRec[]).forEach((c, idx) => {
    it(`case ${idx} (n = ${c.N}${c.w ? ', weighted' : ''})`, () => {
      const e = exploreStats(c.x, c.w ?? undefined);
      close(e.N, c.N, STAT, 'N');
      close(e.mean, c.mean, STAT, 'mean');
      close(e.sd, c.sd, STAT, 'sd');
      close(e.variance, c.variance, STAT, 'variance');
      close(e.sum, c.sum, STAT, 'sum');
      close(e.seMean, c.seMean, STAT, 'seMean');
      close(e.skewness, c.skewness, STAT, 'skewness');
      close(e.seSkewness, c.seSkewness, STAT, 'seSkewness');
      close(e.kurtosis, c.kurtosis, STAT, 'kurtosis');
      close(e.seKurtosis, c.seKurtosis, STAT, 'seKurtosis');
      close(e.ciLower, c.ciLower, STAT, 'ciLower');
      close(e.ciUpper, c.ciUpper, STAT, 'ciUpper');
      close(e.trimmedMean, c.trimmedMean, STAT, 'trimmedMean');
      for (const p of e.percentiles) close(p.value, c.percentiles[String(p.p)], STAT, `P${p.p}`);
      close(e.median, c.numpyWeibull50, STAT, 'median vs numpy weibull');
      e.hinges.forEach((h, i) => close(h, c.hinges[i], STAT, `hinge ${i}`));
      const ks = ksLilliefors(c.x, c.w ?? undefined);
      close(ks.D, c.ksD, STAT, 'KS D');
      close(lillieforsP(ks.D, ks.N), c.ksPdw, PV, 'Lilliefors Dallal-Wilkinson p', 'p');
      const ex = expandIntegerWeights(c.x, c.w ?? undefined);
      const sw = shapiroWilk(ex.values);
      close(sw.W, c.swW, 1e-7, 'Shapiro-Wilk W');
      close(sw.p, c.swP, PV, 'Shapiro-Wilk p', 'p');
    });
  });
});

describe('t tests', () => {
  it('one-sample', () => {
    for (const c of fx.ttest.oneSample as AnyRec[]) {
      const r = oneSampleT(c.x, c.w ?? undefined, c.testValue);
      close(r.test.t, c.t, STAT, 't');
      close(r.test.df, c.df, STAT, 'df');
      close(r.test.p, c.p, PV, 'p', 'p');
      close(r.test.ciLower, c.ciLower, STAT, 'ci lo');
      close(r.test.ciUpper, c.ciUpper, STAT, 'ci hi');
      close(r.effects[0].value, c.d, STAT, 'd');
      close(r.effects[1].value, c.g, STAT, 'g');
    }
  });
  it('independent samples (Student, Welch, Levene, effect sizes)', () => {
    for (const c of fx.ttest.independent as AnyRec[]) {
      const r = independentT(c.x1, c.w1 ?? undefined, c.x2, c.w2 ?? undefined);
      close(r.equal.t, c.tEq, STAT, 't eq');
      close(r.equal.p, c.pEq, PV, 'p eq', 'p');
      close(r.equal.df, c.dfEq, STAT, 'df eq');
      close(r.equal.ciLower, c.ciEq[0], STAT, 'ci eq lo');
      close(r.equal.ciUpper, c.ciEq[1], STAT, 'ci eq hi');
      close(r.welch.t, c.tW, STAT, 't welch');
      close(r.welch.df, c.dfW, STAT, 'df welch');
      close(r.welch.p, c.pW, PV, 'p welch', 'p');
      close(r.welch.ciLower, c.ciW[0], STAT, 'ci welch lo');
      close(r.welch.ciUpper, c.ciW[1], STAT, 'ci welch hi');
      close(r.levene.F, c.leveneF, STAT, 'levene F');
      close(r.levene.p, c.leveneP, PV, 'levene p', 'p');
      close(r.effects[0].value, c.d, STAT, 'cohen d');
      close(r.effects[0].value, c.pingouinCohenD, STAT, 'cohen d vs pingouin');
      close(r.effects[1].value, c.g, STAT, 'hedges');
      close(r.effects[2].value, c.glass, STAT, 'glass');
    }
  });
  it('paired', () => {
    for (const c of fx.ttest.paired as AnyRec[]) {
      const r = pairedT(c.x, c.y, c.w ?? undefined);
      close(r.test.t, c.t, STAT, 't');
      close(r.test.p, c.p, PV, 'p', 'p');
      close(r.correlation.r, c.r, STAT, 'r');
      close(r.correlation.p, c.rP, PV, 'r p', 'p');
      close(r.test.ciLower, c.ci[0], STAT, 'ci lo');
      close(r.test.ciUpper, c.ci[1], STAT, 'ci hi');
      close(r.effects[0].value, c.dz, STAT, 'dz');
      close(r.effects[1].value, c.g, STAT, 'g');
    }
  });
});

describe('one-way ANOVA', () => {
  (fx.anova as AnyRec[]).forEach((c, idx) => {
    it(`case ${idx}`, () => {
      const groups = (c.groups as number[][]).map((x) => ({ x }));
      const a = oneWayAnova(groups);
      close(a.F, c.F, STAT, 'F');
      close(a.p, c.p, PV, 'p', 'p');
      close(a.ssB, c.ssB, STAT, 'ssB');
      close(a.ssW, c.ssW, STAT, 'ssW');
      close(a.welch.F, c.welchF, STAT, 'welch F');
      close(a.welch.df2, c.welchDf2, STAT, 'welch df2');
      close(a.welch.p, c.welchP, PV, 'welch p', 'p');
      close(a.brownForsythe.F, c.bfF, STAT, 'BF F');
      close(a.brownForsythe.df2, c.bfDf2, STAT, 'BF df2');
      close(a.brownForsythe.p, c.bfP, PV, 'BF p', 'p');
      close(a.leveneMean.F, c.leveneF, STAT, 'levene F');
      close(a.leveneMean.p, c.leveneP, PV, 'levene p', 'p');
      close(a.leveneMedian.F, c.leveneMedianF, STAT, 'levene median F');
      close(a.leveneMedian.p, c.leveneMedianP, PV, 'levene median p', 'p');
      close(a.effects.etaSq, c.etaSq, STAT, 'eta sq');
      close(a.effects.omegaSqFixed, c.omegaSq, STAT, 'omega sq');
      const find = (list: ReturnType<typeof postHoc>, i: number, j: number) => list.find((q) => q.i === i && q.j === j)!;
      const tk = postHoc('tukey', a.groups, a.msW, a.dfW);
      for (const [i, j, diff, se, p] of c.tukey as number[][]) {
        const q = find(tk, i, j);
        close(q.diff, diff, STAT, 'tukey diff');
        close(q.se, se, STAT, 'tukey se');
        close(q.p, p, 1e-6, `tukey p ${i}-${j}`, 'p');
      }
      const gh = postHoc('gamesHowell', a.groups, a.msW, a.dfW);
      for (const [i, j, diff, se, , p] of c.gamesHowell as number[][]) {
        const q = find(gh, i, j);
        close(q.diff, diff, STAT, 'GH diff');
        close(q.se, se, STAT, 'GH se');
        close(q.p, p, 1e-6, `GH p ${i}-${j}`, 'p');
      }
      const bf = postHoc('bonferroni', a.groups, a.msW, a.dfW);
      for (const [i, j, p] of c.bonferroni as number[][]) close(find(bf, i, j).p, p, PV, 'bonferroni p', 'p');
      const sc = postHoc('scheffe', a.groups, a.msW, a.dfW);
      for (const [i, j, p] of c.scheffe as number[][]) close(find(sc, i, j).p, p, PV, 'scheffe p', 'p');
      close(studentizedRangePpf(0.95, groups.length, a.dfW), c.tukeyQcrit, 1e-8, 'q crit');
    });
  });
});

describe('crosstabs', () => {
  (fx.crosstabs as AnyRec[]).forEach((c, idx) => {
    it(`table ${idx} (${c.table.length}x${c.table[0].length})`, () => {
      const t = c.table as number[][];
      const chi = chiSquareTests(t, c.rowScores ?? null, c.colScores ?? null, { exact: !!c.fisherRxC });
      close(chi.pearson.value, c.pearson, STAT, 'pearson');
      close(chi.pearson.p, c.pearsonP, PV, 'pearson p', 'p');
      close(chi.likelihoodRatio.value, c.lr, STAT, 'LR');
      close(chi.likelihoodRatio.p, c.lrP, PV, 'LR p', 'p');
      if (c.yates !== undefined) {
        close(chi.continuity!.value, c.yates, STAT, 'yates');
        close(chi.continuity!.p, c.yatesP, PV, 'yates p', 'p');
        close(chi.fisher!.p2, c.fisher2, PV, 'fisher 2-sided', 'p');
        close(chi.fisher!.p1!, c.fisher1, PV, 'fisher 1-sided', 'p');
        const rk = riskEstimate(t);
        close(rk.oddsRatio.value, c.or, STAT, 'OR');
        close(rk.oddsRatio.lo, c.orCI[0], STAT, 'OR lo');
        close(rk.oddsRatio.hi, c.orCI[1], STAT, 'OR hi');
        close(rk.rrFirst.value, c.rr, STAT, 'RR');
        close(rk.rrFirst.lo, c.rrCI[0], STAT, 'RR lo');
        close(rk.rrFirst.hi, c.rrCI[1], STAT, 'RR hi');
        close(mcnemar(t).exactP!, c.mcnemarExact, PV, 'mcnemar', 'p');
      }
      if (c.fisherRxC !== undefined) {
        close(fisherRxC(t).p2, c.fisherRxC, PV, 'fisher RxC', 'p');
      }
      if (c.linByLin !== undefined) close(chi.linearByLinear!.value, c.linByLin, STAT, 'linear-by-linear');
      const cs = cellStats(t);
      cs.adjusted.forEach((row, i) => row.forEach((v, j) => close(v, c.adjusted[i][j], STAT, 'adjusted residual')));
      cs.expected.forEach((row, i) => row.forEach((v, j) => close(v, c.expected[i][j], STAT, 'expected')));
      const nm = nominalMeasures(t);
      close(nm.cramersV.value, c.cramersV, STAT, 'cramers V');
      close(nm.contingency.value, c.contingency, STAT, 'contingency coefficient');
      const om = ordinalMeasures(t);
      close(om.gamma.value, c.gamma, STAT, 'gamma');
      close(om.tauB.value, c.tauB, STAT, 'tau-b');
      if (c.scipyTauB !== undefined) close(om.tauB.value, c.scipyTauB, STAT, 'tau-b vs scipy');
      close(om.tauC.value, c.tauC, STAT, 'tau-c');
      close(om.somersD.symmetric.value, c.dSym, STAT, 'somers sym');
      close(om.somersD.rowDependent.value, c.dRow, STAT, 'somers row');
      close(om.somersD.colDependent.value, c.dCol, STAT, 'somers col');
      close(om.somersD.colDependent.value, c.scipySomersColDep, STAT, 'somers col vs scipy');
      // ASE1 against the multinomial delta method
      close(om.gamma.ase!, c.ase_gamma, 1e-7, 'ASE gamma');
      close(om.tauB.ase!, c.ase_tauB, 1e-7, 'ASE tau-b');
      close(om.tauC.ase!, c.ase_tauC, 1e-7, 'ASE tau-c');
      close(om.somersD.rowDependent.ase!, c.ase_dRow, 1e-7, 'ASE somers row');
      close(om.somersD.colDependent.ase!, c.ase_dCol, 1e-7, 'ASE somers col');
      close(om.somersD.symmetric.ase!, c.ase_dSym, 1e-7, 'ASE somers sym');
      const lt = lambdaTau(t);
      close(lt.lambda.symmetric.value, c.lamSym, STAT, 'lambda sym');
      close(lt.lambda.rowDependent.value, c.lamRow, STAT, 'lambda row');
      close(lt.lambda.colDependent.value, c.lamCol, STAT, 'lambda col');
      close(lt.gkTau.rowDependent.value, c.gkRow, STAT, 'GK tau row');
      close(lt.gkTau.colDependent.value, c.gkCol, STAT, 'GK tau col');
      close(lt.gkTau.rowDependent.ase!, c.ase_gkRow, 1e-7, 'ASE GK tau row');
      close(lt.gkTau.colDependent.ase!, c.ase_gkCol, 1e-7, 'ASE GK tau col');
      // Lambda is piecewise linear; the delta method applies only when the maxima are unique.
      const uniqueMax = (a: number[]) => a.filter((v) => v === Math.max(...a)).length === 1;
      const rowsTot = t.map((r) => r.reduce((x, y) => x + y, 0));
      const colsTot = t[0].map((_, j) => t.reduce((x, r) => x + r[j], 0));
      const cols = t[0].map((_, j) => t.map((r) => r[j]));
      if (uniqueMax(rowsTot) && cols.every(uniqueMax)) close(lt.lambda.rowDependent.ase!, c.ase_lamRow, 1e-6, 'ASE lambda row');
      if (uniqueMax(colsTot) && t.every(uniqueMax)) close(lt.lambda.colDependent.ase!, c.ase_lamCol, 1e-6, 'ASE lambda col');
      if (c.spearman !== undefined) close(spearmanFromTable(t).value, c.spearman, STAT, 'spearman');
      if (c.kappa !== undefined) {
        const k = kappa(t);
        close(k.value, c.kappa, STAT, 'kappa');
        close(k.ase!, c.kappaAse, 1e-7, 'kappa ASE');
        close(k.value / k.t!, c.kappaAse0, 1e-7, 'kappa ASE0');
      }
      if (c.bowker !== undefined) {
        const b = mcnemar(t).bowker!;
        close(b.value, c.bowker, STAT, 'bowker');
        close(b.p, c.bowkerP, PV, 'bowker p', 'p');
      }
    });
  });
  it('Cochran-Mantel-Haenszel', () => {
    const c = fx.cmh as AnyRec;
    const r = cmh(c.layers);
    close(r.commonOR.value, c.or, STAT, 'MH OR');
    close(r.commonOR.seLn, c.lnSe, STAT, 'ln OR se');
    close(r.commonOR.lo, c.ci[0], STAT, 'CI lo');
    close(r.commonOR.hi, c.ci[1], STAT, 'CI hi');
    close(r.mantelHaenszel.value, c.mh, STAT, 'MH chi');
    close(r.mantelHaenszel.p, c.mhP, PV, 'MH p', 'p');
    close(r.breslowDay!.value, c.bd, 1e-7, 'Breslow-Day');
    close(r.tarone!.value, c.tarone, 1e-7, 'Tarone');
  });
  it('integer case weights equal replicated data', () => {
    const c = fx.weightedCrosstab as AnyRec;
    const t = [[0, 0], [0, 0], [0, 0]];
    c.row.forEach((r: number, i: number) => (t[r][c.col[i]] += c.w[i]));
    const chi = chiSquareTests(t);
    close(chi.pearson.value, c.pearson, STAT, 'weighted chi');
    close(chi.pearson.p, c.p, PV, 'weighted chi p', 'p');
  });
});

describe('nonparametric', () => {
  const np = fx.nonparametric as AnyRec;
  it('chi-square goodness of fit', () => {
    const e = chiSquareGof(np.gofEqual.observed);
    close(e.chiSquare, np.gofEqual.chi, STAT, 'gof');
    close(e.p, np.gofEqual.p, PV, 'gof p', 'p');
    const c = chiSquareGof(np.gofCustom.observed, np.gofCustom.props);
    close(c.chiSquare, np.gofCustom.chi, STAT, 'gof custom');
    close(c.p, np.gofCustom.p, PV, 'gof custom p', 'p');
  });
  it('binomial', () => {
    for (const [k, n, p, want] of np.binomial as number[][]) close(binomialTest(k, n - k, p).p, want, PV, `binomial ${k}/${n} p0=${p}`, 'p');
  });
  it('Mann-Whitney', () => {
    for (const c of np.mannWhitney as AnyRec[]) {
      const r = mannWhitney(c.x1, undefined, c.x2, undefined);
      close(r.U, c.U, STAT, 'U');
      close(r.sumRank1, c.R1, STAT, 'R1');
      close(r.p, c.p, PV, 'MW p', 'p');
      if (c.exactP !== undefined) close(r.exactP!, c.exactP, PV, 'MW exact p', 'p');
    }
  });
  it('Wilcoxon signed-rank', () => {
    for (const c of np.wilcoxon as AnyRec[]) {
      // scipy: d = first - second; SPSS: second - first. |z| and p agree.
      const r = wilcoxonSignedRank(c.first, c.second);
      close(Math.min(r.sumRankNeg, r.sumRankPos), c.T, STAT, 'T');
      close(Math.abs(r.z), Math.abs(c.z), STAT, 'z');
      close(r.p, c.p, PV, 'p', 'p');
    }
  });
  it('Kruskal-Wallis and Dunn', () => {
    const c = np.kruskal;
    const r = kruskalWallis((c.groups as number[][]).map((x) => ({ x })));
    close(r.H, c.H, STAT, 'H');
    close(r.p, c.p, PV, 'KW p', 'p');
    const d = dunnTest(r);
    for (const q of d) {
      close(q.p, c.dunn[q.i][q.j], PV, `dunn ${q.i}-${q.j}`, 'p');
      close(q.pAdj, c.dunnBonf[q.i][q.j], PV, `dunn bonf ${q.i}-${q.j}`, 'p');
    }
  });
  it('Friedman', () => {
    const c = np.friedman;
    const r = friedman(c.columns);
    close(r.chiSquare, c.chi, STAT, 'friedman');
    close(r.p, c.p, PV, 'friedman p', 'p');
    close(r.kendallW, c.W, STAT, 'kendall W');
  });
});

describe('correlations', () => {
  (fx.correlation as AnyRec[]).forEach((c, idx) => {
    it(`case ${idx}${c.w ? ' (weighted)' : ''}`, () => {
      const w = c.w ?? undefined;
      const p = pearson(c.x, c.y, w);
      close(p.r, c.pearson, STAT, 'pearson');
      close(p.p2, c.pearsonP, PV, 'pearson p', 'p');
      const s = spearman(c.x, c.y, w);
      close(s.r, c.spearman, STAT, 'spearman');
      close(s.p2, c.spearmanP, PV, 'spearman p', 'p');
      close(kendallTauB(c.x, c.y, w).r, c.kendall, STAT, 'kendall tau-b');
      if (c.partial !== undefined) {
        const pc = partialCorrelations([c.x, c.y], [c.z]);
        close(pc.r[0][1], c.partial, STAT, 'partial r');
        close(pc.p2[0][1], c.partialP, PV, 'partial p', 'p');
      }
    });
  });
  it('reports the largest observed deviations', () => {
    // Recorded for the verification report (see console output).
    console.log(`core lib max deviation: statistics ${maxStatErr.toExponential(2)}, p-values ${maxPErr.toExponential(2)}`);
    expect(maxStatErr).toBeLessThan(STAT);
  });
});
