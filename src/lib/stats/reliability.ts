// Scale reliability: Cronbach's alpha and item analysis (SPSS RELIABILITY /MODEL=ALPHA), plus
// McDonald's omega total from a one-factor maximum-likelihood model.
//
// Moments use frequency weights with the (Σw - 1) denominator, like SPSS.

import { spdInverse, fromRows, SingularMatrixError } from './matrix';
import { sum, weightedMean } from './models-util';

export interface ReliabilityResult {
  k: number;
  n: number;
  alpha: number;
  alphaStandardized: number;
  means: number[];
  sds: number[];
  variances: number[];
  cov: number[][];
  corr: number[][];
  scaleMean: number;
  scaleVariance: number;
  itemTotal: Array<{
    scaleMeanIfDeleted: number;
    scaleVarianceIfDeleted: number;
    correctedItemTotal: number;
    squaredMultiple: number;
    alphaIfDeleted: number;
  }>;
  summary: {
    means: SummaryRow;
    variances: SummaryRow;
    covariances: SummaryRow;
    correlations: SummaryRow;
  };
}

export interface SummaryRow {
  mean: number;
  min: number;
  max: number;
  range: number;
  ratio: number;
  variance: number;
}

function summarize(vals: number[]): SummaryRow {
  const m = vals.reduce((s, v) => s + v, 0) / vals.length;
  const min = Math.min(...vals), max = Math.max(...vals);
  let ss = 0;
  for (const v of vals) ss += (v - m) ** 2;
  // SPSS reports the variance of the summary values with an (n - 1) denominator.
  return { mean: m, min, max, range: max - min, ratio: max / min, variance: vals.length > 1 ? ss / (vals.length - 1) : NaN };
}

export function reliabilityAnalysis(items: ArrayLike<number>[], w: ArrayLike<number>): ReliabilityResult {
  const k = items.length;
  if (k < 2) throw new Error('Reliability analysis needs at least two items.');
  const W = sum(w);
  if (!(W > 1)) throw new Error('Too few cases for a reliability analysis.');
  const nRows = w.length;
  const means = items.map((x) => weightedMean(x, w));
  const cov: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let a = 0; a < k; a++)
    for (let b = a; b < k; b++) {
      let s = 0;
      for (let i = 0; i < nRows; i++) s += w[i] * (items[a][i] - means[a]) * (items[b][i] - means[b]);
      s /= W - 1;
      cov[a][b] = s;
      cov[b][a] = s;
    }
  const variances = cov.map((r, i) => r[i]);
  const sds = variances.map(Math.sqrt);
  const corr = cov.map((r, a) => r.map((v, b) => (a === b ? 1 : v / (sds[a] * sds[b]))));
  const zeroVar = variances.findIndex((v) => !(v > 0));
  if (zeroVar >= 0) {
    throw new Error(`Item ${zeroVar + 1} has zero variance among the cases used; remove it before running the analysis.`);
  }
  const totalVar = cov.reduce((s, r) => s + r.reduce((t, v) => t + v, 0), 0);
  const sumVar = variances.reduce((s, v) => s + v, 0);
  const alpha = (k / (k - 1)) * (1 - sumVar / totalVar);
  const offCorr: number[] = [], offCov: number[] = [];
  for (let a = 0; a < k; a++)
    for (let b = a + 1; b < k; b++) {
      offCorr.push(corr[a][b]);
      offCov.push(cov[a][b]);
    }
  const rbar = offCorr.reduce((s, v) => s + v, 0) / offCorr.length;
  const alphaStandardized = (k * rbar) / (1 + (k - 1) * rbar);

  let Rinv: number[][] | null = null;
  try {
    const inv = spdInverse(fromRows(corr));
    Rinv = Array.from({ length: k }, (_, a) => Array.from({ length: k }, (_, b) => inv.data[a * k + b]));
  } catch (e) {
    if (!(e instanceof SingularMatrixError)) throw e;
  }
  const scaleMean = means.reduce((s, v) => s + v, 0);
  const itemTotal = [];
  for (let i = 0; i < k; i++) {
    const rowSum = cov[i].reduce((s, v) => s + v, 0);
    const varDel = totalVar - 2 * rowSum + cov[i][i];
    const covItemRest = rowSum - cov[i][i];
    const correctedItemTotal = covItemRest / Math.sqrt(cov[i][i] * varDel);
    const alphaIfDeleted = k > 2 ? ((k - 1) / (k - 2)) * (1 - (sumVar - cov[i][i]) / varDel) : NaN;
    const squaredMultiple = Rinv ? 1 - 1 / Rinv[i][i] : NaN;
    itemTotal.push({ scaleMeanIfDeleted: scaleMean - means[i], scaleVarianceIfDeleted: varDel, correctedItemTotal, squaredMultiple, alphaIfDeleted });
  }
  return {
    k,
    n: W,
    alpha,
    alphaStandardized,
    means,
    sds,
    variances,
    cov,
    corr,
    scaleMean,
    scaleVariance: totalVar,
    itemTotal,
    summary: {
      means: summarize(means),
      variances: summarize(variances),
      covariances: summarize(offCov),
      correlations: summarize(offCorr),
    },
  };
}

export interface OneFactorML {
  loadings: number[];
  uniquenesses: number[];
  omega: number;
  converged: boolean;
  /** True when a uniqueness hit the lower bound (a Heywood case). */
  heywood: boolean;
}

/**
 * One-factor maximum-likelihood factor analysis of a correlation matrix (EM algorithm, uniquenesses
 * bounded below at .005 like R's factanal), and McDonald's omega total
 *   omega = (Σλ)² / ((Σλ)² + Σψ).
 */
export function oneFactorML(corr: number[][], opts: { maxIter?: number; tol?: number } = {}): OneFactorML {
  const p = corr.length;
  const maxIter = opts.maxIter ?? 100000;
  const tol = opts.tol ?? 1e-13;
  const lower = 0.005;
  // Start: uniquenesses from squared multiple correlations.
  let psi = new Array<number>(p).fill(0.5);
  try {
    const inv = spdInverse(fromRows(corr));
    psi = Array.from({ length: p }, (_, i) => Math.min(Math.max(1 / inv.data[i * p + i], lower), 1));
  } catch (e) {
    if (!(e instanceof SingularMatrixError)) throw e;
  }
  let lambda = psi.map((u) => Math.sqrt(Math.max(1 - u, 0.01)));
  let converged = false;
  const Rb = new Array<number>(p).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    // beta = lambda' (lambda lambda' + Psi)^-1 via Sherman-Morrison.
    let s = 0;
    for (let i = 0; i < p; i++) s += (lambda[i] * lambda[i]) / psi[i];
    const beta = lambda.map((l, i) => l / psi[i] / (1 + s));
    // R beta'
    for (let i = 0; i < p; i++) {
      let t = 0;
      for (let j = 0; j < p; j++) t += corr[i][j] * beta[j];
      Rb[i] = t;
    }
    let bl = 0, bRb = 0;
    for (let i = 0; i < p; i++) {
      bl += beta[i] * lambda[i];
      bRb += beta[i] * Rb[i];
    }
    const Czz = 1 - bl + bRb;
    const newLambda = Rb.map((v) => v / Czz);
    const newPsi = newLambda.map((l, i) => Math.min(Math.max(corr[i][i] - l * Rb[i], lower), 1));
    let change = 0;
    for (let i = 0; i < p; i++) change = Math.max(change, Math.abs(newLambda[i] - lambda[i]), Math.abs(newPsi[i] - psi[i]));
    lambda = newLambda;
    psi = newPsi;
    if (change < tol) {
      converged = true;
      break;
    }
  }
  // Orient the factor so the loadings sum is positive.
  const sl = lambda.reduce((a, b) => a + b, 0);
  if (sl < 0) lambda = lambda.map((l) => -l);
  const sumL = Math.abs(sl);
  const sumPsi = psi.reduce((a, b) => a + b, 0);
  return {
    loadings: lambda,
    uniquenesses: psi,
    omega: (sumL * sumL) / (sumL * sumL + sumPsi),
    converged,
    heywood: psi.some((u) => u <= lower + 1e-12),
  };
}
