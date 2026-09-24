// Binary and multinomial logistic regression by Newton-Raphson with step halving, as in SPSS
// LOGISTIC REGRESSION and NOMREG. Frequency weights multiply each case's log-likelihood
// contribution (SPSS WEIGHT BY semantics). Also: separation diagnostics, Hosmer-Lemeshow test,
// score tests for variables not in the equation.

import { chi2Sf, normalPpf } from './distributions';
import { cholesky, choleskySolve, spdInverseRobust, spdSolveRobust, zeros, type Matrix } from './matrix';
import { log1pExp, logistic, sum, weightedMean, weightedSS } from './models-util';

export const DEFAULT_MAX_ITER = 50;

/**
 * Newton iterations stop as "diverging" when the log-likelihood has stopped improving (relative
 * change below this) for DIVERGE_ITERS iterations in a row while some estimate still moves by at
 * least DIVERGE_STEP: the signature of (quasi-)complete separation, where some estimates run off to
 * infinity. A regular model near its maximum never takes large steps with a flat likelihood.
 */
export const DIVERGE_DLL = 1e-12;
export const DIVERGE_STEP = 0.1;
export const DIVERGE_ITERS = 3;

/** Tracks the divergence rule above across iterations. */
export function divergenceTracker(): (dll: number, ll: number, maxStep: number) => boolean {
  let flat = 0;
  return (dll, ll, maxStep) => {
    if (Math.abs(dll) <= DIVERGE_DLL * (1 + Math.abs(ll)) && maxStep >= DIVERGE_STEP) flat++;
    else flat = 0;
    return flat >= DIVERGE_ITERS;
  };
}

/**
 * Flags parameters whose estimates cannot be trusted because the information matrix is (nearly)
 * singular in their direction: a clear share in the numerical null space, a non-finite standard
 * error, or (for slopes, `scale` = standard deviation of the predictor, 0 for intercepts and
 * thresholds) a standard error of more than 100 logits per standard deviation, or a huge estimate
 * with an even larger standard error. These only happen when an estimate is running off to infinity.
 */
export function unstableParams(est: ArrayLike<number>, se: ArrayLike<number>, nullLoading: ArrayLike<number>, scale: ArrayLike<number>): Uint8Array {
  const out = new Uint8Array(se.length);
  for (let j = 0; j < se.length; j++) {
    const s = scale[j];
    if (!Number.isFinite(se[j]) || nullLoading[j] > 1e-4) out[j] = 1;
    else if (s > 0 && (se[j] * s > 100 || (Math.abs(est[j]) * s > 8 && se[j] > Math.abs(est[j])))) out[j] = 1;
  }
  return out;
}

/** Weighted standard deviation of each column (0 for a constant column). */
export function columnScales(X: ArrayLike<number>[], w: ArrayLike<number>): number[] {
  return X.map((x) => {
    const m = weightedMean(x, w);
    const W = sum(w);
    return W > 0 ? Math.sqrt(Math.max(weightedSS(x, w, m), 0) / W) : 0;
  });
}

export interface CollinearityScreen {
  kept: number[];
  dropped: number[];
}

/**
 * Drop predictors that are constant or (nearly) linear combinations of earlier ones, using the same
 * sequential tolerance rule as linear regression on the weighted, centred columns.
 */
export function screenCollinear(X: ArrayLike<number>[], w: ArrayLike<number>, tol = 1e-8): CollinearityScreen {
  const n = w.length;
  const basis: Float64Array[] = []; // orthonormal (weighted) basis of centred kept columns
  const kept: number[] = [];
  const dropped: number[] = [];
  for (let j = 0; j < X.length; j++) {
    const x = X[j];
    const m = weightedMean(x, w);
    const ss = weightedSS(x, w, m);
    if (!(ss > 0)) {
      dropped.push(j);
      continue;
    }
    const v = new Float64Array(n);
    for (let i = 0; i < n; i++) v[i] = Math.sqrt(w[i]) * (x[i] - m);
    // Two passes of modified Gram-Schmidt for stability.
    for (let pass = 0; pass < 2; pass++)
      for (const q of basis) {
        let d = 0;
        for (let i = 0; i < n; i++) d += q[i] * v[i];
        for (let i = 0; i < n; i++) v[i] -= d * q[i];
      }
    let r = 0;
    for (let i = 0; i < n; i++) r += v[i] * v[i];
    if (r / ss < tol) {
      dropped.push(j);
      continue;
    }
    const nr = Math.sqrt(r);
    for (let i = 0; i < n; i++) v[i] /= nr;
    basis.push(v);
    kept.push(j);
  }
  return { kept, dropped };
}

// ---------- Binary logistic ----------

export interface BinaryLogitFit {
  /** Coefficients: [constant, predictors...]. */
  coef: Float64Array;
  /** Covariance matrix (inverse information) of coef; NaN-filled when the information is singular. */
  cov: Matrix;
  se: Float64Array;
  wald: Float64Array;
  p: Float64Array;
  logLik: number;
  /** -2 log-likelihood. */
  m2ll: number;
  iterations: number;
  converged: boolean;
  /**
   * True if the information matrix was numerically singular (after scaling) at some iteration or at
   * the end; the affected directions are then held fixed and get very large standard errors.
   */
  singular: boolean;
  /** True if iteration stopped because the likelihood stopped improving while estimates kept growing (separation). */
  diverged: boolean;
  /** Per coefficient: 1 when the estimate is not identified or runs off to infinity (see unstableParams). */
  unstable: Uint8Array;
  fitted: Float64Array;
  /** -2LL at each iteration (iteration history). */
  history: number[];
}

function linearPredictor(coef: ArrayLike<number>, X: ArrayLike<number>[], i: number): number {
  let eta = coef[0];
  for (let j = 0; j < X.length; j++) eta += coef[j + 1] * X[j][i];
  return eta;
}

function binaryLogLik(coef: ArrayLike<number>, y: ArrayLike<number>, X: ArrayLike<number>[], w: ArrayLike<number>): number {
  let ll = 0;
  for (let i = 0; i < y.length; i++) {
    const eta = linearPredictor(coef, X, i);
    // log p = -log(1+e^-eta), log(1-p) = -log(1+e^eta)
    ll -= w[i] * (y[i] === 1 ? log1pExp(-eta) : log1pExp(eta));
  }
  return ll;
}

/**
 * Maximum-likelihood binary logistic regression. y must be 0/1. Predictors should already be
 * screened for collinearity. `start` gives optional starting values.
 */
export function fitBinaryLogit(
  y: ArrayLike<number>,
  X: ArrayLike<number>[],
  w: ArrayLike<number>,
  opts: { maxIter?: number; start?: ArrayLike<number> } = {},
): BinaryLogitFit {
  const n = y.length;
  const p = X.length + 1;
  const maxIter = opts.maxIter ?? DEFAULT_MAX_ITER;
  const W = sum(w);
  let sy = 0;
  for (let i = 0; i < n; i++) sy += w[i] * y[i];
  const ybar = sy / W;
  let coef = new Float64Array(p);
  if (opts.start) coef.set(opts.start);
  else coef[0] = Math.log(ybar / (1 - ybar));
  let ll = binaryLogLik(coef, y, X, w);
  const history = [-2 * ll];
  let converged = false;
  let singular = false;
  let diverged = false;
  const diverging = divergenceTracker();
  let iterations = 0;
  let info = zeros(p, p);
  const xi = new Float64Array(p);
  for (let iter = 1; iter <= maxIter; iter++) {
    iterations = iter;
    const grad = new Float64Array(p);
    info = zeros(p, p);
    for (let i = 0; i < n; i++) {
      const pi = logistic(linearPredictor(coef, X, i));
      const r = w[i] * (y[i] - pi);
      const v = w[i] * pi * (1 - pi);
      xi[0] = 1;
      for (let j = 1; j < p; j++) xi[j] = X[j - 1][i];
      for (let a = 0; a < p; a++) {
        grad[a] += r * xi[a];
        const va = v * xi[a];
        for (let b = a; b < p; b++) info.data[a * p + b] += va * xi[b];
      }
    }
    for (let a = 0; a < p; a++) for (let b = 0; b < a; b++) info.data[a * p + b] = info.data[b * p + a];
    const sol = spdSolveRobust(info, grad);
    if (sol.rankDeficient) singular = true;
    const step = sol.x;
    let t = 1;
    let next = new Float64Array(p);
    let llNext = -Infinity;
    for (let h = 0; h < 30; h++) {
      for (let a = 0; a < p; a++) next[a] = coef[a] + t * step[a];
      llNext = binaryLogLik(next, y, X, w);
      if (llNext >= ll - 1e-12 * Math.abs(ll)) break;
      t /= 2;
    }
    let maxStep = 0, maxCoef = 0;
    for (let a = 0; a < p; a++) {
      maxStep = Math.max(maxStep, Math.abs(next[a] - coef[a]));
      maxCoef = Math.max(maxCoef, Math.abs(next[a]));
    }
    const dll = llNext - ll;
    coef = next;
    ll = llNext;
    history.push(-2 * ll);
    if (maxStep <= 1e-10 * (1 + maxCoef) || (Math.abs(dll) <= 1e-14 * (1 + Math.abs(ll)) && maxStep <= 1e-7 * (1 + maxCoef))) {
      converged = true;
      break;
    }
    if (diverging(dll, ll, maxStep)) {
      diverged = true;
      break;
    }
  }
  // Final information at the solution.
  const fitted = new Float64Array(n);
  info = zeros(p, p);
  for (let i = 0; i < n; i++) {
    const pi = logistic(linearPredictor(coef, X, i));
    fitted[i] = pi;
    const v = w[i] * pi * (1 - pi);
    xi[0] = 1;
    for (let j = 1; j < p; j++) xi[j] = X[j - 1][i];
    for (let a = 0; a < p; a++) {
      const va = v * xi[a];
      for (let b = a; b < p; b++) info.data[a * p + b] += va * xi[b];
    }
  }
  for (let a = 0; a < p; a++) for (let b = 0; b < a; b++) info.data[a * p + b] = info.data[b * p + a];
  const inv = spdInverseRobust(info);
  if (inv.rankDeficient) singular = true;
  const cov = inv.inv;
  const se = new Float64Array(p), wald = new Float64Array(p), pv = new Float64Array(p);
  for (let a = 0; a < p; a++) {
    se[a] = Math.sqrt(cov.data[a * p + a]);
    wald[a] = (coef[a] / se[a]) ** 2;
    pv[a] = chi2Sf(wald[a], 1);
  }
  const unstable = unstableParams(coef, se, inv.nullLoading, [0, ...columnScales(X, w)]);
  return { coef, cov, se, wald, p: pv, logLik: ll, m2ll: -2 * ll, iterations, converged, singular, diverged, unstable, fitted, history };
}

/** Wald chi-square for a set of coefficients (indices into coef): b' V^-1 b, df = count. */
export function waldTest(coef: ArrayLike<number>, cov: Matrix, idx: number[]): { chi2: number; df: number; p: number } {
  const k = idx.length;
  const V = zeros(k, k);
  const b = new Float64Array(k);
  for (let a = 0; a < k; a++) {
    b[a] = coef[idx[a]];
    for (let c = 0; c < k; c++) V.data[a * k + c] = cov.data[idx[a] * cov.cols + idx[c]];
  }
  const L = cholesky(V);
  if (!L) return { chi2: NaN, df: k, p: NaN };
  const x = choleskySolve(L, b);
  let chi2 = 0;
  for (let a = 0; a < k; a++) chi2 += b[a] * x[a];
  return { chi2, df: k, p: chi2Sf(chi2, k) };
}

/** Wald confidence interval for exp(B). */
export function expCI(b: number, se: number, conf = 0.95): [number, number] {
  const z = normalPpf(1 - (1 - conf) / 2);
  return [Math.exp(b - z * se), Math.exp(b + z * se)];
}

/**
 * Score tests for variables not in the equation when only the constant is in the model (SPSS
 * Block 0 "Variables not in the Equation"). Returns per-variable scores and the overall statistic.
 */
export function scoreTestsConstantOnly(y: ArrayLike<number>, X: ArrayLike<number>[], w: ArrayLike<number>): { each: Array<{ score: number; df: number; p: number }>; overall: { score: number; df: number; p: number } } {
  const W = sum(w);
  const ybar = weightedMean(y, w);
  const v = ybar * (1 - ybar);
  const k = X.length;
  const means = X.map((x) => weightedMean(x, w));
  const U = new Float64Array(k);
  const S = zeros(k, k);
  for (let i = 0; i < y.length; i++) {
    const r = w[i] * (y[i] - ybar);
    for (let a = 0; a < k; a++) {
      const xa = X[a][i] - means[a];
      U[a] += r * xa;
      for (let b = a; b < k; b++) S.data[a * k + b] += w[i] * xa * (X[b][i] - means[b]);
    }
  }
  for (let a = 0; a < k; a++) for (let b = 0; b < a; b++) S.data[a * k + b] = S.data[b * k + a];
  const each = [];
  for (let a = 0; a < k; a++) {
    const sc = (U[a] * U[a]) / (v * S.data[a * k + a]);
    each.push({ score: sc, df: 1, p: chi2Sf(sc, 1) });
  }
  let overall = { score: NaN, df: k, p: NaN };
  const L = cholesky(S);
  if (L && k > 0) {
    const x = choleskySolve(L, U);
    let sc = 0;
    for (let a = 0; a < k; a++) sc += U[a] * x[a];
    sc /= v;
    overall = { score: sc, df: k, p: chi2Sf(sc, k) };
  }
  void W;
  return { each, overall };
}

export interface HosmerLemeshow {
  chi2: number;
  df: number;
  p: number;
  groups: Array<{ n: number; obs1: number; exp1: number; obs0: number; exp0: number }>;
}

/**
 * Hosmer-Lemeshow goodness of fit, SPSS style: cases are sorted by predicted probability and
 * split into about 10 groups of roughly equal (weighted) size; cases with the same covariate
 * pattern (`patternKey`) are never split across groups, so fewer than 10 groups can result.
 * A block is assigned to group ceil(10 * cumulative weight at the block's end / total weight).
 */
export function hosmerLemeshow(y: ArrayLike<number>, prob: ArrayLike<number>, w: ArrayLike<number>, patternKey: (i: number) => string, g = 10): HosmerLemeshow {
  const n = y.length;
  const blocks = new Map<string, { p: number; n: number; o1: number; sp: number }>();
  for (let i = 0; i < n; i++) {
    const key = patternKey(i);
    let b = blocks.get(key);
    if (!b) {
      b = { p: prob[i], n: 0, o1: 0, sp: 0 };
      blocks.set(key, b);
    }
    b.n += w[i];
    b.o1 += w[i] * y[i];
    b.sp += w[i] * prob[i];
  }
  const list = [...blocks.values()].sort((a, b) => a.p - b.p);
  const W = list.reduce((s, b) => s + b.n, 0);
  const groups = new Map<number, { n: number; obs1: number; exp1: number }>();
  let cum = 0;
  for (const b of list) {
    cum += b.n;
    const k = Math.min(g, Math.max(1, Math.ceil((g * cum) / W - 1e-9)));
    const gr = groups.get(k) ?? { n: 0, obs1: 0, exp1: 0 };
    gr.n += b.n;
    gr.obs1 += b.o1;
    gr.exp1 += b.sp;
    groups.set(k, gr);
  }
  const out = [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => ({ n: v.n, obs1: v.obs1, exp1: v.exp1, obs0: v.n - v.obs1, exp0: v.n - v.exp1 }));
  let chi2 = 0;
  for (const gr of out) {
    const xi = gr.exp1 / gr.n;
    const den = gr.exp1 * (1 - xi);
    if (den > 0) chi2 += (gr.obs1 - gr.exp1) ** 2 / den;
  }
  const df = out.length - 2;
  return { chi2, df, p: df > 0 ? chi2Sf(chi2, df) : NaN, groups: out };
}

export interface SeparationReport {
  kind: 'complete' | 'quasi-complete';
  /** Predictor indices implicated (into X). */
  variables: number[];
  /** For dummy/binary columns: which value of the column (0 or 1) perfectly predicts the outcome. */
  details: string[];
}

/**
 * Detect complete or quasi-complete separation after a fit. Checks each predictor on its own first
 * (a category in which every case has the same outcome, or a covariate whose ranges for the two
 * outcomes do not overlap), then looks at diverging coefficients.
 */
export function detectSeparation(
  y: ArrayLike<number>,
  X: ArrayLike<number>[],
  w: ArrayLike<number>,
  fit: BinaryLogitFit,
): SeparationReport | null {
  const n = y.length;
  const eps = 1e-7;
  let perfect = 0, totalW = 0;
  for (let i = 0; i < n; i++) {
    totalW += w[i];
    const pi = fit.fitted[i];
    if ((y[i] === 1 && pi > 1 - eps) || (y[i] === 0 && pi < eps)) perfect += w[i];
  }
  const diverging: number[] = [];
  for (let j = 0; j < X.length; j++) {
    const b = fit.coef[j + 1], se = fit.se[j + 1];
    if (Math.abs(b) > 10 && (!Number.isFinite(se) || se > 100 || se > 10 * Math.abs(b))) diverging.push(j);
  }
  const suspicious = !fit.converged || fit.singular || diverging.length > 0 || perfect > 0;
  if (!suspicious) return null;
  const complete = perfect >= totalW - 1e-9;
  const vars: number[] = [];
  const details: string[] = [];
  for (let j = 0; j < X.length; j++) {
    const x = X[j];
    let binary = true;
    for (let i = 0; i < n; i++) if (x[i] !== 0 && x[i] !== 1) { binary = false; break; }
    if (binary) {
      for (const val of [1, 0]) {
        let cnt = 0, s1 = 0;
        for (let i = 0; i < n; i++) if (x[i] === val) { cnt += w[i]; s1 += w[i] * y[i]; }
        if (cnt > 0 && (s1 === 0 || s1 === cnt)) {
          vars.push(j);
          details.push(`${val}:${s1 === 0 ? 0 : 1}`);
          break;
        }
      }
    } else {
      let max0 = -Infinity, min0 = Infinity, max1 = -Infinity, min1 = Infinity;
      for (let i = 0; i < n; i++) {
        if (y[i] === 1) { max1 = Math.max(max1, x[i]); min1 = Math.min(min1, x[i]); }
        else { max0 = Math.max(max0, x[i]); min0 = Math.min(min0, x[i]); }
      }
      if (max0 <= min1 || max1 <= min0) {
        vars.push(j);
        details.push('range');
      }
    }
  }
  if (vars.length === 0 && diverging.length === 0 && fit.converged && !fit.singular) return null;
  if (vars.length === 0 && perfect === 0 && diverging.length === 0) return null;
  if (vars.length === 0) {
    for (const j of diverging) {
      vars.push(j);
      details.push('diverging');
    }
  }
  if (vars.length === 0 && perfect === 0) return null;
  return { kind: complete ? 'complete' : 'quasi-complete', variables: vars, details };
}

// ---------- Multinomial logistic ----------

export interface MultinomialFit {
  /** Number of outcome categories and the reference index. */
  J: number;
  ref: number;
  /** Non-reference category indices in output order. */
  cats: number[];
  /** coef[c][j]: for non-reference category cats[c], parameter j (0 = intercept). */
  coef: Float64Array[];
  se: Float64Array[];
  /** Full covariance (size (J-1)p square), parameters ordered by category then predictor. */
  cov: Matrix;
  logLik: number;
  m2ll: number;
  iterations: number;
  converged: boolean;
  /**
   * True if the information matrix was numerically singular (SPSS: "unexpected singularities in
   * the Hessian matrix"); the affected directions are held at their last values and get very large
   * standard errors, while the other parameters are estimated and tested normally.
   */
  singular: boolean;
  /** True if iteration stopped because the likelihood stopped improving while estimates kept growing (separation). */
  diverged: boolean;
  /** unstable[c][j]: 1 when that parameter is not identified or runs off to infinity (see unstableParams). */
  unstable: Uint8Array[];
}

function multinomialLogLik(beta: Float64Array, yIdx: ArrayLike<number>, X: ArrayLike<number>[], w: ArrayLike<number>, cats: number[], p: number): number {
  let ll = 0;
  const K = cats.length;
  const eta = new Float64Array(K);
  // Category code -> position; a Map, so large or sparse codes cost nothing (no array sized by code value).
  const pos = new Map<number, number>();
  cats.forEach((c, k) => pos.set(c, k));
  for (let i = 0; i < yIdx.length; i++) {
    let mx = 0;
    for (let k = 0; k < K; k++) {
      let e = beta[k * p];
      for (let j = 1; j < p; j++) e += beta[k * p + j] * X[j - 1][i];
      eta[k] = e;
      if (e > mx) mx = e;
    }
    let den = Math.exp(-mx);
    for (let k = 0; k < K; k++) den += Math.exp(eta[k] - mx);
    const yi = yIdx[i];
    const k = pos.get(yi) ?? -1;
    const num = k >= 0 ? eta[k] - mx : -mx;
    ll += w[i] * (num - Math.log(den));
  }
  return ll;
}

/**
 * Multinomial (baseline-category) logit. yIdx holds category indices 0..J-1; `ref` is the
 * reference category.
 */
export function fitMultinomial(
  yIdx: ArrayLike<number>,
  J: number,
  ref: number,
  X: ArrayLike<number>[],
  w: ArrayLike<number>,
  opts: { maxIter?: number } = {},
): MultinomialFit {
  // Fit on distinct (outcome, covariate) patterns with summed weights. The likelihood is the same, but
  // integer-weighted data and the same data with replicated cases then run through exactly the same
  // arithmetic. Otherwise rounding in the sums differs, and under separation (where the iterations
  // stop at an arbitrary point) the printed estimates differed between the two.
  ({ yIdx, X, w } = collapsePatterns(yIdx, X, w));
  const n = yIdx.length;
  const p = X.length + 1;
  const cats: number[] = [];
  for (let c = 0; c < J; c++) if (c !== ref) cats.push(c);
  const K = cats.length;
  const P = K * p;
  const maxIter = opts.maxIter ?? DEFAULT_MAX_ITER;
  const counts = new Float64Array(J);
  for (let i = 0; i < n; i++) counts[yIdx[i]] += w[i];
  let beta = new Float64Array(P);
  for (let k = 0; k < K; k++) beta[k * p] = Math.log(counts[cats[k]] / counts[ref]);
  let ll = multinomialLogLik(beta, yIdx, X, w, cats, p);
  let converged = false, singular = false, iterations = 0;
  const xi = new Float64Array(p);
  const pr = new Float64Array(K);
  const buildInfo = (b: Float64Array, withGrad: boolean) => {
    const H = zeros(P, P);
    const g = new Float64Array(P);
    for (let i = 0; i < n; i++) {
      xi[0] = 1;
      for (let j = 1; j < p; j++) xi[j] = X[j - 1][i];
      let mx = 0;
      for (let k = 0; k < K; k++) {
        let e = 0;
        for (let j = 0; j < p; j++) e += b[k * p + j] * xi[j];
        pr[k] = e;
        if (e > mx) mx = e;
      }
      let den = Math.exp(-mx);
      for (let k = 0; k < K; k++) {
        pr[k] = Math.exp(pr[k] - mx);
        den += pr[k];
      }
      for (let k = 0; k < K; k++) pr[k] /= den;
      const wi = w[i];
      for (let a = 0; a < K; a++) {
        if (withGrad) {
          const r = wi * ((yIdx[i] === cats[a] ? 1 : 0) - pr[a]);
          for (let j = 0; j < p; j++) g[a * p + j] += r * xi[j];
        }
        for (let c = a; c < K; c++) {
          const v = wi * pr[a] * ((a === c ? 1 : 0) - pr[c]);
          if (v === 0) continue;
          for (let j = 0; j < p; j++) {
            const vj = v * xi[j];
            const row = (a * p + j) * P + c * p;
            for (let l = 0; l < p; l++) H.data[row + l] += vj * xi[l];
          }
        }
      }
    }
    // Blocks (a, c) with a <= c were accumulated in full; mirror them into the blocks (c, a).
    for (let a = 0; a < K; a++)
      for (let c = a + 1; c < K; c++)
        for (let j = 0; j < p; j++)
          for (let l = 0; l < p; l++) H.data[(c * p + l) * P + a * p + j] = H.data[(a * p + j) * P + c * p + l];
    return { H, g };
  };
  const diverging = divergenceTracker();
  let diverged = false;
  for (let iter = 1; iter <= maxIter; iter++) {
    iterations = iter;
    const { H, g } = buildInfo(beta, true);
    const sol = spdSolveRobust(H, g);
    if (sol.rankDeficient) singular = true;
    const step = sol.x;
    let t = 1;
    const next = new Float64Array(P);
    let llNext = -Infinity;
    for (let h = 0; h < 30; h++) {
      for (let a = 0; a < P; a++) next[a] = beta[a] + t * step[a];
      llNext = multinomialLogLik(next, yIdx, X, w, cats, p);
      if (llNext >= ll - 1e-12 * Math.abs(ll)) break;
      t /= 2;
    }
    let maxStep = 0, maxCoef = 0;
    for (let a = 0; a < P; a++) {
      maxStep = Math.max(maxStep, Math.abs(next[a] - beta[a]));
      maxCoef = Math.max(maxCoef, Math.abs(next[a]));
    }
    const dll = llNext - ll;
    beta = next;
    ll = llNext;
    if (maxStep <= 1e-10 * (1 + maxCoef) || (Math.abs(dll) <= 1e-14 * (1 + Math.abs(ll)) && maxStep <= 1e-7 * (1 + maxCoef))) {
      converged = true;
      break;
    }
    if (diverging(dll, ll, maxStep)) {
      diverged = true;
      break;
    }
  }
  const { H } = buildInfo(beta, false);
  const inv = spdInverseRobust(H);
  if (inv.rankDeficient) singular = true;
  const cov = inv.inv;
  const scales = [0, ...columnScales(X, w)];
  const coef: Float64Array[] = [], se: Float64Array[] = [], unstable: Uint8Array[] = [];
  for (let k = 0; k < K; k++) {
    coef.push(beta.slice(k * p, (k + 1) * p));
    const s = new Float64Array(p);
    for (let j = 0; j < p; j++) s[j] = Math.sqrt(cov.data[(k * p + j) * P + k * p + j]);
    se.push(s);
    unstable.push(unstableParams(coef[k], s, inv.nullLoading.subarray(k * p, (k + 1) * p), scales));
  }
  return { J, ref, cats, coef, se, cov, logLik: ll, m2ll: -2 * ll, iterations, converged, singular, diverged, unstable };
}

/**
 * Merge rows with the same outcome and covariate values (first-occurrence order), summing weights and
 * dropping zero weights. The likelihood is unchanged, and integer-weighted data and the same cases
 * replicated become identical inputs, so they give bit-identical fits even where the iterations stop
 * at an arbitrary point (separation).
 */
export function collapsePatterns(yIdx: ArrayLike<number>, X: ArrayLike<number>[], w: ArrayLike<number>): { yIdx: Int32Array; X: Float64Array[]; w: Float64Array } {
  const n = yIdx.length;
  const index = new Map<string, number>();
  const rows: number[] = [];
  const ws: number[] = [];
  const key: number[] = new Array(X.length + 1);
  for (let i = 0; i < n; i++) {
    if (!(w[i] > 0)) continue;
    key[0] = yIdx[i];
    for (let j = 0; j < X.length; j++) key[j + 1] = X[j][i];
    const k = key.join('|');
    const at = index.get(k);
    if (at === undefined) {
      index.set(k, rows.length);
      rows.push(i);
      ws.push(w[i]);
    } else ws[at] += w[i];
  }
  return {
    yIdx: Int32Array.from(rows, (i) => yIdx[i]),
    X: X.map((col) => Float64Array.from(rows, (i) => col[i])),
    w: Float64Array.from(ws),
  };
}

/** Log-likelihood of the intercept-only multinomial model (closed form). */
export function multinomialNullLogLik(yIdx: ArrayLike<number>, J: number, w: ArrayLike<number>): number {
  const counts = new Float64Array(J);
  let W = 0;
  for (let i = 0; i < yIdx.length; i++) {
    counts[yIdx[i]] += w[i];
    W += w[i];
  }
  let ll = 0;
  for (let c = 0; c < J; c++) if (counts[c] > 0) ll += counts[c] * Math.log(counts[c] / W);
  return ll;
}

/** Cox & Snell, Nagelkerke and McFadden pseudo R² from null and model log-likelihoods. */
export function pseudoR2(ll0: number, ll1: number, W: number): { coxSnell: number; nagelkerke: number; mcfadden: number } {
  const coxSnell = 1 - Math.exp((2 / W) * (ll0 - ll1));
  const maxCS = 1 - Math.exp((2 / W) * ll0);
  return { coxSnell, nagelkerke: coxSnell / maxCS, mcfadden: 1 - ll1 / ll0 };
}
