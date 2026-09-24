// Ordinal regression: cumulative logit (proportional odds) model, as in SPSS PLUM with the logit link.
//
// SPSS parameterisation (used throughout):  logit P(Y <= j | x) = theta_j - x'beta,  j = 1..J-1.
// A positive beta therefore shifts cases towards HIGHER categories.
//
// The "general" (non-proportional) model used by the test of parallel lines lets every threshold
// equation have its own slopes: logit P(Y <= j | x) = theta_j - x'beta_j.
//
// Estimation: Newton-Raphson on the observed information with step halving. Frequency weights
// multiply each case's log-likelihood contribution.

import { chi2Sf, normalPpf } from './distributions';
import { spdInverseRobust, spdSolveRobust, zeros, type Matrix } from './matrix';
import { logistic, logisticDensity } from './models-util';
import { columnScales, divergenceTracker, unstableParams } from './logistic';

export interface CumulativeFit {
  J: number;
  q: number;
  general: boolean;
  /** Parameter vector: PO = [theta_1..theta_{J-1}, beta_1..beta_q]; general = per equation [theta_j, beta_j1..beta_jq]. */
  params: Float64Array;
  cov: Matrix;
  se: Float64Array;
  logLik: number;
  m2ll: number;
  iterations: number;
  converged: boolean;
  /** True if the information matrix was numerically singular; affected directions get very large standard errors. */
  singular: boolean;
  /** True if iteration stopped because the likelihood stopped improving while estimates kept growing (separation). */
  diverged: boolean;
  /** Per parameter: 1 when the estimate is not identified or runs off to infinity. */
  unstable: Uint8Array;
  /** Fitted category probabilities, row-major n x J. */
  probs: Float64Array;
}

const F = logistic;
const f = logisticDensity;
/** Derivative of the logistic density: f'(z) = f(z)(1 - 2F(z)). */
const fp = (z: number) => f(z) * (1 - 2 * F(z));

function nParams(J: number, q: number, general: boolean) {
  return general ? (J - 1) * (1 + q) : J - 1 + q;
}

/** P(low < latent threshold band) = F(a) - F(b), computed accurately in both tails. */
function bandProb(a: number, b: number): number {
  // a = upper argument (Infinity for the top category), b = lower (-Infinity for the bottom).
  if (b > 0) return F(-b) - F(-a);
  return F(a) - F(b);
}

function evalLogLik(params: Float64Array, y: ArrayLike<number>, X: ArrayLike<number>[], w: ArrayLike<number>, J: number, general: boolean): number {
  const q = X.length;
  let ll = 0;
  for (let i = 0; i < y.length; i++) {
    const k = y[i];
    const a = k < J - 1 ? eqArg(params, X, i, k, J, q, general) : Infinity;
    const b = k > 0 ? eqArg(params, X, i, k - 1, J, q, general) : -Infinity;
    const p = bandProb(a, b);
    if (!(p > 0)) return -Infinity;
    ll += w[i] * Math.log(p);
  }
  return ll;
}

function eqArg(params: ArrayLike<number>, X: ArrayLike<number>[], i: number, e: number, J: number, q: number, general: boolean): number {
  if (general) {
    const base = e * (1 + q);
    let s = params[base];
    for (let j = 0; j < q; j++) s -= params[base + 1 + j] * X[j][i];
    return s;
  }
  let s = params[e];
  for (let j = 0; j < q; j++) s -= params[J - 1 + j] * X[j][i];
  return s;
}

/**
 * Fit the cumulative logit model. y holds category indices 0..J-1 (ordered). `start` optional.
 */
export function fitCumulativeLogit(
  y: ArrayLike<number>,
  J: number,
  X: ArrayLike<number>[],
  w: ArrayLike<number>,
  opts: { general?: boolean; start?: ArrayLike<number>; maxIter?: number } = {},
): CumulativeFit {
  const general = opts.general ?? false;
  const q = X.length;
  const P = nParams(J, q, general);
  const n = y.length;
  const maxIter = opts.maxIter ?? 100;
  let params = new Float64Array(P);
  if (opts.start) params.set(opts.start);
  else {
    const counts = new Float64Array(J);
    let W = 0;
    for (let i = 0; i < n; i++) {
      counts[y[i]] += w[i];
      W += w[i];
    }
    let cum = 0;
    for (let e = 0; e < J - 1; e++) {
      cum += counts[e];
      const pc = Math.min(Math.max(cum / W, 1e-10), 1 - 1e-10);
      params[general ? e * (1 + q) : e] = Math.log(pc / (1 - pc));
    }
  }
  let ll = evalLogLik(params, y, X, w, J, general);
  if (!Number.isFinite(ll)) throw new Error('Starting values for the ordinal model are invalid.');

  // Index helpers: derivative vectors of an equation argument with respect to the parameters.
  const thetaIdx = (e: number) => (general ? e * (1 + q) : e);
  const betaIdx = (e: number, j: number) => (general ? e * (1 + q) + 1 + j : J - 1 + j);

  const derivatives = (par: Float64Array) => {
    const g = new Float64Array(P);
    const H = zeros(P, P); // negative Hessian (observed information)
    const du = new Float64Array(P);
    const dl = new Float64Array(P);
    const dp = new Float64Array(P);
    for (let i = 0; i < n; i++) {
      const k = y[i];
      const hasU = k < J - 1, hasL = k > 0;
      const a = hasU ? eqArg(par, X, i, k, J, q, general) : Infinity;
      const b = hasL ? eqArg(par, X, i, k - 1, J, q, general) : -Infinity;
      const p = bandProb(a, b);
      du.fill(0);
      dl.fill(0);
      if (hasU) {
        du[thetaIdx(k)] = 1;
        for (let j = 0; j < q; j++) du[betaIdx(k, j)] -= X[j][i];
      }
      if (hasL) {
        dl[thetaIdx(k - 1)] = 1;
        for (let j = 0; j < q; j++) dl[betaIdx(k - 1, j)] -= X[j][i];
      }
      const fu = hasU ? f(a) : 0, fl = hasL ? f(b) : 0;
      const fpu = hasU ? fp(a) : 0, fpl = hasL ? fp(b) : 0;
      for (let r = 0; r < P; r++) dp[r] = fu * du[r] - fl * dl[r];
      const wi = w[i];
      for (let r = 0; r < P; r++) {
        g[r] += (wi * dp[r]) / p;
        for (let c = r; c < P; c++) {
          const d2p = fpu * du[r] * du[c] - fpl * dl[r] * dl[c];
          H.data[r * P + c] -= wi * (d2p / p - (dp[r] * dp[c]) / (p * p));
        }
      }
    }
    for (let r = 0; r < P; r++) for (let c = 0; c < r; c++) H.data[r * P + c] = H.data[c * P + r];
    return { g, H };
  };

  let converged = false, singular = false, diverged = false, iterations = 0;
  const diverging = divergenceTracker();
  for (let iter = 1; iter <= maxIter; iter++) {
    iterations = iter;
    const { g, H } = derivatives(params);
    const sol = spdSolveRobust(H, g);
    if (sol.rankDeficient) singular = true;
    const step = sol.x;
    let t = 1;
    const next = new Float64Array(P);
    let llNext = -Infinity;
    for (let h = 0; h < 40; h++) {
      for (let r = 0; r < P; r++) next[r] = params[r] + t * step[r];
      llNext = evalLogLik(next, y, X, w, J, general);
      if (Number.isFinite(llNext) && llNext >= ll - 1e-12 * Math.abs(ll)) break;
      t /= 2;
    }
    if (!Number.isFinite(llNext)) {
      singular = true;
      break;
    }
    let maxStep = 0, maxPar = 0;
    for (let r = 0; r < P; r++) {
      maxStep = Math.max(maxStep, Math.abs(next[r] - params[r]));
      maxPar = Math.max(maxPar, Math.abs(next[r]));
    }
    const dll = llNext - ll;
    params = next;
    ll = llNext;
    if (maxStep <= 1e-10 * (1 + maxPar) || (Math.abs(dll) <= 1e-14 * (1 + Math.abs(ll)) && maxStep <= 1e-7 * (1 + maxPar))) {
      converged = true;
      break;
    }
    if (diverging(dll, ll, maxStep)) {
      diverged = true;
      break;
    }
  }
  const { H } = derivatives(params);
  const inv = spdInverseRobust(H);
  if (inv.rankDeficient) singular = true;
  const cov: Matrix = inv.inv;
  const se = new Float64Array(P);
  for (let r = 0; r < P; r++) se[r] = Math.sqrt(cov.data[r * P + r]);
  const xs = columnScales(X, w);
  const scales = new Float64Array(P);
  for (let e = 0; e < (general ? J - 1 : 1); e++) for (let j = 0; j < q; j++) scales[betaIdx(e, j)] = xs[j];
  const unstable = unstableParams(params, se, inv.nullLoading, scales);
  const probs = new Float64Array(n * J);
  for (let i = 0; i < n; i++) {
    let prev = 0;
    for (let e = 0; e < J; e++) {
      const cum = e < J - 1 ? F(eqArg(params, X, i, e, J, q, general)) : 1;
      probs[i * J + e] = cum - prev;
      prev = cum;
    }
  }
  return { J, q, general, params, cov, se, logLik: ll, m2ll: -2 * ll, iterations, converged, singular, diverged, unstable, probs };
}

/** Log-likelihood of the thresholds-only model (closed form). */
export function cumulativeNullLogLik(y: ArrayLike<number>, J: number, w: ArrayLike<number>): number {
  const counts = new Float64Array(J);
  let W = 0;
  for (let i = 0; i < y.length; i++) {
    counts[y[i]] += w[i];
    W += w[i];
  }
  let ll = 0;
  for (let c = 0; c < J; c++) if (counts[c] > 0) ll += counts[c] * Math.log(counts[c] / W);
  return ll;
}

export interface OrdinalGoodnessOfFit {
  pearson: number;
  deviance: number;
  df: number;
  pPearson: number;
  pDeviance: number;
  nPatterns: number;
  zeroCells: number;
  totalCells: number;
}

/**
 * Pearson and deviance goodness-of-fit over covariate patterns x response categories (SPSS PLUM).
 * Cases with the same `patternKey` share a covariate pattern.
 */
export function ordinalGoodnessOfFit(fit: CumulativeFit, y: ArrayLike<number>, w: ArrayLike<number>, patternKey: (i: number) => string): OrdinalGoodnessOfFit {
  const J = fit.J;
  const pats = new Map<string, { obs: Float64Array; exp: Float64Array }>();
  for (let i = 0; i < y.length; i++) {
    const key = patternKey(i);
    let pt = pats.get(key);
    if (!pt) {
      pt = { obs: new Float64Array(J), exp: new Float64Array(J) };
      pats.set(key, pt);
    }
    pt.obs[y[i]] += w[i];
    for (let c = 0; c < J; c++) pt.exp[c] += w[i] * fit.probs[i * J + c];
  }
  let pearson = 0, deviance = 0, zeroCells = 0;
  for (const pt of pats.values())
    for (let c = 0; c < J; c++) {
      const O = pt.obs[c], E = pt.exp[c];
      if (O === 0) zeroCells++;
      if (E > 0) pearson += ((O - E) * (O - E)) / E;
      if (O > 0) deviance += 2 * O * Math.log(O / E);
    }
  const df = pats.size * (J - 1) - fit.params.length;
  return {
    pearson,
    deviance,
    df,
    pPearson: df > 0 ? chi2Sf(pearson, df) : NaN,
    pDeviance: df > 0 ? chi2Sf(deviance, df) : NaN,
    nPatterns: pats.size,
    zeroCells,
    totalCells: pats.size * J,
  };
}

export function waldCI(est: number, se: number, conf = 0.95): [number, number] {
  const z = normalPpf(1 - (1 - conf) / 2);
  return [est - z * se, est + z * se];
}
