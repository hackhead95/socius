// Linear regression (OLS / frequency-weighted least squares), as in SPSS REGRESSION.
//
// Frequency weights follow SPSS WEIGHT BY: every moment is weighted and the error degrees of
// freedom are Σw - k - 1 (so a case with weight 3 counts as three identical cases).
//
// Fitting uses Householder QR on the weight-scaled, mean-centred design, which is far better
// conditioned than inverting X'X. Predictors are entered in order; a predictor whose tolerance
// (1 - R² with the predictors already entered) is below the tolerance criterion (SPSS default
// .0001) is not entered and is reported as excluded, exactly like SPSS METHOD=ENTER.

import { fSf, tPpf, tSf } from './distributions';
import { weightedMean, weightedSS, weightedCP, sum } from './models-util';

export const DEFAULT_TOLERANCE = 1e-4;

export interface LinearFit {
  /** Number of cases (rows) and weighted N (Σw). */
  nRows: number;
  sumW: number;
  /** Indices (into the predictor list passed in) of predictors actually in the model, in order. */
  included: number[];
  /** Indices of predictors excluded for low tolerance (collinearity) or zero variance. */
  excluded: number[];
  /** Intercept. */
  b0: number;
  seB0: number;
  tB0: number;
  pB0: number;
  ciB0: [number, number];
  /** Per included predictor (aligned with `included`). */
  b: number[];
  se: number[];
  beta: number[];
  t: number[];
  p: number[];
  ci: Array<[number, number]>;
  tolerance: number[];
  vif: number[];
  zeroOrder: number[];
  partial: number[];
  part: number[];
  /** ANOVA decomposition. */
  ssReg: number;
  ssRes: number;
  ssTot: number;
  dfReg: number;
  dfRes: number;
  msReg: number;
  msRes: number;
  F: number;
  pF: number;
  r: number;
  r2: number;
  adjR2: number;
  seEstimate: number;
  fitted: Float64Array;
  residuals: Float64Array;
  /** (Xc' W Xc)^-1 for the included predictors (row-major, k x k), centred design. */
  covUnscaled: Float64Array;
  /** Weighted means of y and the included predictors. */
  meanY: number;
  meanX: number[];
}

export class RegressionError extends Error {}

/**
 * Fit y on the given predictor columns (with a constant) by weighted least squares.
 * All arrays have one entry per case; weights must be positive.
 */
export function fitLinear(
  y: ArrayLike<number>,
  X: ArrayLike<number>[],
  w: ArrayLike<number>,
  opts: { tolerance?: number; confidence?: number } = {},
): LinearFit {
  const n = y.length;
  const tolCrit = opts.tolerance ?? DEFAULT_TOLERANCE;
  const conf = opts.confidence ?? 0.95;
  const sumW = sum(w);
  const meanY = weightedMean(y, w);
  const ssTot = weightedSS(y, w, meanY);
  if (!(ssTot > 0)) throw new RegressionError('The dependent variable has no variance among the cases used, so a regression cannot be estimated.');

  const sw = new Float64Array(n);
  for (let i = 0; i < n; i++) sw[i] = Math.sqrt(w[i]);

  // Sequential Householder QR on sqrt(w) * centred columns.
  const reflectors: Float64Array[] = []; // full-length Householder vectors v (v[k] = 1 implicit stored)
  const taus: number[] = [];
  const Rcols: Float64Array[] = []; // R column j (length = rank at the time, plus diagonal)
  const included: number[] = [];
  const excluded: number[] = [];
  const meansX: number[] = [];
  const ssX: number[] = [];

  const applyReflectors = (v: Float64Array, count: number) => {
    for (let k = 0; k < count; k++) {
      const h = reflectors[k];
      const tau = taus[k];
      if (tau === 0) continue;
      let s = v[k];
      for (let i = k + 1; i < n; i++) s += h[i] * v[i];
      s *= tau;
      v[k] -= s;
      for (let i = k + 1; i < n; i++) v[i] -= s * h[i];
    }
  };

  for (let j = 0; j < X.length; j++) {
    const x = X[j];
    const mx = weightedMean(x, w);
    const ss = weightedSS(x, w, mx);
    if (!(ss > 0) || ss <= 1e-14 * Math.max(1, Math.abs(mx)) ** 2 * sumW) {
      excluded.push(j);
      continue;
    }
    const v = new Float64Array(n);
    for (let i = 0; i < n; i++) v[i] = sw[i] * (x[i] - mx);
    const k = included.length;
    applyReflectors(v, k);
    let tail = 0;
    for (let i = k; i < n; i++) tail += v[i] * v[i];
    const tol = tail / ss;
    if (!(tol >= tolCrit) || k >= n - 1) {
      excluded.push(j);
      continue;
    }
    // New reflector at position k.
    const norm = Math.sqrt(tail);
    const alpha = v[k] > 0 ? -norm : norm;
    const v0 = v[k] - alpha;
    const h = new Float64Array(n);
    h[k] = 1;
    for (let i = k + 1; i < n; i++) h[i] = v[i] / v0;
    const tau = -v0 / alpha;
    const rc = new Float64Array(k + 1);
    for (let i = 0; i < k; i++) rc[i] = v[i];
    rc[k] = alpha;
    reflectors.push(h);
    taus.push(tau);
    Rcols.push(rc);
    included.push(j);
    meansX.push(mx);
    ssX.push(ss);
  }

  const k = included.length;
  const dfReg = k;
  const dfRes = sumW - k - 1;
  if (!(dfRes > 0)) {
    throw new RegressionError(
      `Too few cases: the model has ${k + 1} parameters but only ${fmtN(sumW)} (weighted) cases. Add cases or remove predictors.`,
    );
  }

  // Q'(sqrt(w) yc)
  const qy = new Float64Array(n);
  for (let i = 0; i < n; i++) qy[i] = sw[i] * (y[i] - meanY);
  applyReflectors(qy, k);

  // Solve R b = (Q'y)[0:k]
  const b = new Array<number>(k).fill(0);
  for (let i = k - 1; i >= 0; i--) {
    let s = qy[i];
    for (let c = i + 1; c < k; c++) s -= Rcols[c][i] * b[c];
    b[i] = s / Rcols[i][i];
  }
  // R^-1 (upper triangular), then C = R^-1 R^-T.
  const Ri = new Float64Array(k * k);
  for (let jj = k - 1; jj >= 0; jj--) {
    Ri[jj * k + jj] = 1 / Rcols[jj][jj];
    for (let i = jj - 1; i >= 0; i--) {
      let s = 0;
      for (let c = i + 1; c <= jj; c++) s += Rcols[c][i] * Ri[c * k + jj];
      Ri[i * k + jj] = -s / Rcols[i][i];
    }
  }
  const C = new Float64Array(k * k);
  for (let a = 0; a < k; a++)
    for (let c = a; c < k; c++) {
      let s = 0;
      for (let m = c; m < k; m++) s += Ri[a * k + m] * Ri[c * k + m];
      C[a * k + c] = s;
      C[c * k + a] = s;
    }

  // Fitted values and residuals on the original scale.
  let b0 = meanY;
  for (let a = 0; a < k; a++) b0 -= b[a] * meansX[a];
  const fitted = new Float64Array(n);
  const residuals = new Float64Array(n);
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    let f = b0;
    for (let a = 0; a < k; a++) f += b[a] * X[included[a]][i];
    fitted[i] = f;
    residuals[i] = y[i] - f;
    ssRes += w[i] * residuals[i] * residuals[i];
  }
  // The QR residual sum of squares is more accurate than the direct one when the fit is near perfect.
  let ssResQR = 0;
  for (let i = k; i < n; i++) ssResQR += qy[i] * qy[i];
  if (Number.isFinite(ssResQR)) ssRes = ssResQR;
  const ssReg = Math.max(ssTot - ssRes, 0);
  const msRes = ssRes / dfRes;
  const msReg = k > 0 ? ssReg / dfReg : NaN;
  const F = k > 0 ? msReg / msRes : NaN;
  const pF = k > 0 ? fSf(F, dfReg, dfRes) : NaN;
  const r2 = ssReg / ssTot;
  const adjR2 = 1 - ((1 - r2) * (sumW - 1)) / dfRes;
  const seEstimate = Math.sqrt(msRes);
  const tCrit = tPpf(1 - (1 - conf) / 2, dfRes);

  const se: number[] = [], beta: number[] = [], t: number[] = [], p: number[] = [];
  const ci: Array<[number, number]> = [], tolerance: number[] = [], vif: number[] = [];
  const zeroOrder: number[] = [], partial: number[] = [], part: number[] = [];
  for (let a = 0; a < k; a++) {
    const x = X[included[a]];
    const s = Math.sqrt(C[a * k + a] * msRes);
    se.push(s);
    beta.push(b[a] * Math.sqrt(ssX[a] / ssTot));
    const tv = b[a] / s;
    t.push(tv);
    p.push(2 * tSf(Math.abs(tv), dfRes));
    ci.push([b[a] - tCrit * s, b[a] + tCrit * s]);
    const v = C[a * k + a] * ssX[a];
    vif.push(v);
    tolerance.push(1 / v);
    zeroOrder.push(weightedCP(x, y, w, meansX[a], meanY) / Math.sqrt(ssX[a] * ssTot));
    partial.push(tv / Math.sqrt(tv * tv + dfRes));
    part.push(tv * Math.sqrt((1 - r2) / dfRes));
  }
  // Intercept variance: s² (1/W + m' C m).
  let q = 0;
  for (let a = 0; a < k; a++) for (let c = 0; c < k; c++) q += meansX[a] * C[a * k + c] * meansX[c];
  const seB0 = Math.sqrt(msRes * (1 / sumW + q));
  const tB0 = b0 / seB0;

  return {
    nRows: n,
    sumW,
    included,
    excluded,
    b0,
    seB0,
    tB0,
    pB0: 2 * tSf(Math.abs(tB0), dfRes),
    ciB0: [b0 - tCrit * seB0, b0 + tCrit * seB0],
    b,
    se,
    beta,
    t,
    p,
    ci,
    tolerance,
    vif,
    zeroOrder,
    partial,
    part,
    ssReg,
    ssRes,
    ssTot,
    dfReg,
    dfRes,
    msReg,
    msRes,
    F,
    pF,
    r: Math.sqrt(r2),
    r2,
    adjR2,
    seEstimate,
    fitted,
    residuals,
    covUnscaled: C,
    meanY,
    meanX: meansX,
  };
}

function fmtN(x: number): string {
  return Number.isInteger(x) ? String(x) : x.toFixed(1);
}

/** R² change statistics between a reduced and a fuller nested model. */
export function r2Change(prev: { r2: number; dfReg: number } | null, cur: LinearFit): { r2Change: number; fChange: number; df1: number; df2: number; pChange: number } {
  const r2p = prev ? prev.r2 : 0;
  const dfp = prev ? prev.dfReg : 0;
  const df1 = cur.dfReg - dfp;
  const df2 = cur.dfRes;
  const d = cur.r2 - r2p;
  if (df1 <= 0) return { r2Change: d, fChange: NaN, df1, df2, pChange: NaN };
  const fChange = (d / df1) / ((1 - cur.r2) / df2);
  return { r2Change: d, fChange, df1, df2, pChange: fSf(fChange, df1, df2) };
}

/**
 * Durbin-Watson statistic on residuals in case order. With frequency weights it is the statistic
 * of the replicated data (consecutive copies of the same case contribute nothing to the numerator).
 */
export function durbinWatson(residuals: ArrayLike<number>, w: ArrayLike<number>): number {
  let num = 0, den = 0;
  for (let i = 0; i < residuals.length; i++) {
    den += w[i] * residuals[i] * residuals[i];
    if (i > 0) {
      const d = residuals[i] - residuals[i - 1];
      num += d * d;
    }
  }
  return num / den;
}

/** Statistics for a variable that is not in the model ("Excluded Variables" table). */
export interface ExcludedStat {
  index: number;
  betaIn: number;
  t: number;
  p: number;
  partial: number;
  tolerance: number;
  vif: number;
  minTolerance: number;
}

/**
 * For each candidate not in `model`, the statistics it would have if entered next (SPSS "Excluded
 * Variables"): Beta In, t, Sig., partial correlation, tolerance, VIF and minimum tolerance.
 * Uses the sweep operator on the weighted correlation matrix, as SPSS does.
 */
export function excludedStats(y: ArrayLike<number>, X: ArrayLike<number>[], w: ArrayLike<number>, model: number[], candidates: number[]): ExcludedStat[] {
  const sw = new SweepState(y, X, w);
  const A = sw.sweptFor(model);
  const out: ExcludedStat[] = [];
  const W = sw.sumW;
  const q = model.length;
  for (const j of candidates) {
    if (model.includes(j)) continue;
    const tol = A[j * sw.dim + j];
    if (!(tol > DEFAULT_TOLERANCE) || !sw.valid[j]) {
      out.push({ index: j, betaIn: NaN, t: NaN, p: NaN, partial: NaN, tolerance: Math.max(tol, 0), vif: tol > 0 ? 1 / tol : NaN, minTolerance: NaN });
      continue;
    }
    const ajy = A[j * sw.dim + sw.yIdx];
    const ayy = A[sw.yIdx * sw.dim + sw.yIdx];
    const betaIn = ajy / tol;
    const partialR = ajy / Math.sqrt(tol * ayy);
    const df = W - q - 2;
    const t = partialR * Math.sqrt(df / (1 - partialR * partialR));
    // Minimum tolerance among all variables in the model after adding j.
    const withJ = sw.sweptFor([...model, j]);
    let minTol = tol;
    for (const m of [...model, j]) {
      const tm = 1 / withJ[m * sw.dim + m];
      if (tm < minTol) minTol = tm;
    }
    out.push({ index: j, betaIn, t, p: 2 * tSf(Math.abs(t), df), partial: partialR, tolerance: tol, vif: 1 / tol, minTolerance: minTol });
  }
  return out;
}

/** Sweep-operator machinery on the weighted correlation matrix of [X, y]. */
class SweepState {
  readonly dim: number;
  readonly yIdx: number;
  readonly R: Float64Array;
  readonly valid: boolean[];
  readonly sumW: number;
  constructor(y: ArrayLike<number>, X: ArrayLike<number>[], w: ArrayLike<number>) {
    const cols = [...X, y];
    const p = cols.length;
    this.dim = p;
    this.yIdx = p - 1;
    this.sumW = sum(w);
    const means = cols.map((c) => weightedMean(c, w));
    const ss = cols.map((c, i) => weightedSS(c, w, means[i]));
    this.valid = ss.map((s) => s > 0);
    this.R = new Float64Array(p * p);
    for (let a = 0; a < p; a++)
      for (let b = a; b < p; b++) {
        let r: number;
        if (a === b) r = 1;
        else if (!this.valid[a] || !this.valid[b]) r = 0;
        else r = weightedCP(cols[a], cols[b], w, means[a], means[b]) / Math.sqrt(ss[a] * ss[b]);
        this.R[a * p + b] = r;
        this.R[b * p + a] = r;
      }
    for (let a = 0; a < p; a++) if (!this.valid[a]) this.R[a * p + a] = 0;
  }
  /** Correlation matrix swept on the given indices (Beaton/Goodnight sweep). */
  sweptFor(idx: number[]): Float64Array {
    const p = this.dim;
    const A = this.R.slice();
    for (const k of idx) {
      const d = A[k * p + k];
      if (!(d > 1e-12)) continue;
      for (let j = 0; j < p; j++) A[k * p + j] /= d;
      for (let i = 0; i < p; i++) {
        if (i === k) continue;
        const bik = A[i * p + k];
        if (bik === 0) continue;
        for (let j = 0; j < p; j++) A[i * p + j] -= bik * A[k * p + j];
        A[i * p + k] = -bik / d;
      }
      A[k * p + k] = 1 / d;
    }
    return A;
  }
}

export interface StepwiseStep {
  /** Predictor index entered (or removed) at this step. */
  entered?: number;
  removed?: number;
  /** Predictors in the model after this step (in entry order). */
  model: number[];
}

/**
 * SPSS METHOD=STEPWISE: starting from `base` (variables already in the equation, e.g. earlier
 * blocks), repeatedly enter the candidate with the smallest probability of F-to-enter if it is
 * below `pin`, then remove the entered candidate with the largest probability of F-to-remove if it
 * exceeds `pout`. Only this block's candidates may be removed. Candidates with tolerance below the
 * tolerance criterion are never entered.
 */
export function stepwiseSelect(
  y: ArrayLike<number>,
  X: ArrayLike<number>[],
  w: ArrayLike<number>,
  base: number[],
  candidates: number[],
  opts: { pin?: number; pout?: number; tolerance?: number } = {},
): StepwiseStep[] {
  const pin = opts.pin ?? 0.05;
  const pout = opts.pout ?? 0.1;
  const tolCrit = opts.tolerance ?? DEFAULT_TOLERANCE;
  if (pout < pin) throw new RegressionError('The removal criterion (POUT) must be at least as large as the entry criterion (PIN).');
  const sw = new SweepState(y, X, w);
  const p = sw.dim;
  const W = sw.sumW;
  const model = [...base];
  const steps: StepwiseStep[] = [];
  const maxSteps = 2 * candidates.length + 2;
  const seen = new Set<string>();
  for (let iter = 0; iter < maxSteps; iter++) {
    const A = sw.sweptFor(model);
    const ayy = A[sw.yIdx * p + sw.yIdx];
    // Entry.
    let best = -1, bestP = Infinity;
    for (const j of candidates) {
      if (model.includes(j) || !sw.valid[j]) continue;
      const tol = A[j * p + j];
      if (!(tol >= tolCrit)) continue;
      // Also require that entering j keeps every variable already in the model above the tolerance.
      const withJ = sw.sweptFor([...model, j]);
      let ok = true;
      for (const m of model) if (1 / withJ[m * p + m] < tolCrit) ok = false;
      if (!ok) continue;
      const ajy = A[j * p + sw.yIdx];
      const red = (ajy * ajy) / tol;
      const df = W - model.length - 2;
      if (df <= 0) continue;
      const F = red / ((ayy - red) / df);
      const pv = fSf(F, 1, df);
      if (pv < bestP) {
        bestP = pv;
        best = j;
      }
    }
    if (best < 0 || !(bestP <= pin)) break;
    model.push(best);
    steps.push({ entered: best, model: [...model] });
    // Removal (only this block's candidates).
    for (let r = 0; r < candidates.length; r++) {
      const B = sw.sweptFor(model);
      const byy = B[sw.yIdx * p + sw.yIdx];
      const df = W - model.length - 1;
      let worst = -1, worstP = -1;
      for (const j of model) {
        if (!candidates.includes(j)) continue;
        const bjy = B[j * p + sw.yIdx];
        const inc = (bjy * bjy) / B[j * p + j];
        const F = inc / (byy / df);
        const pv = fSf(F, 1, df);
        if (pv > worstP) {
          worstP = pv;
          worst = j;
        }
      }
      if (worst < 0 || !(worstP > pout)) break;
      model.splice(model.indexOf(worst), 1);
      steps.push({ removed: worst, model: [...model] });
    }
    const key = [...model].sort((a, b) => a - b).join(',');
    if (seen.has(key)) break; // cycling guard
    seen.add(key);
  }
  return steps;
}
