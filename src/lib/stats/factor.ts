// Factor analysis on a correlation matrix, following SPSS FACTOR.
//
// Extraction
//   - Principal components (SPSS default): loadings = eigenvectors * sqrt(eigenvalues) of R.
//   - Principal axis factoring: start with squared multiple correlations on the diagonal of R, then
//     iterate (eigen-decompose the reduced matrix, recompute communalities) until the largest change
//     in any communality is below the convergence criterion (SPSS default .001, 25 iterations).
// Rotation (all with Kaiser normalization, as in SPSS)
//   - Varimax: maximised with the orthogonal gradient-projection / SVD algorithm.
//   - Promax (kappa): varimax first, then a target matrix whose elements are the row-normalised
//     varimax loadings raised to the power kappa (sign kept); the least-squares transformation
//     towards that target is rescaled so the factors have unit variance.
//   - Direct oblimin (delta): gradient projection for oblique rotation (Jennrich 2002).
// Sign convention: every factor (column) is reflected so that the sum of its loadings is positive.

import {
  fromRows,
  identity,
  inverse,
  logDet,
  multiply,
  spdInverse,
  symEigen,
  symMatrixFunction,
  transpose,
  zeros,
  SingularMatrixError,
  type Matrix,
} from './matrix';
import { chi2Sf } from './distributions';
import { weightedMean } from './models-util';

export type Extraction = 'pc' | 'paf';
export type Rotation = 'none' | 'varimax' | 'promax' | 'oblimin';

/** Weighted Pearson correlation matrix of the columns (listwise complete data). */
export function correlationMatrix(cols: ArrayLike<number>[], w: ArrayLike<number>): number[][] {
  const p = cols.length;
  const n = w.length;
  const means = cols.map((c) => weightedMean(c, w));
  const cp: number[][] = Array.from({ length: p }, () => new Array<number>(p).fill(0));
  for (let a = 0; a < p; a++)
    for (let b = a; b < p; b++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += w[i] * (cols[a][i] - means[a]) * (cols[b][i] - means[b]);
      cp[a][b] = s;
      cp[b][a] = s;
    }
  const R = cp.map((r, a) => r.map((v, b) => (a === b ? 1 : v / Math.sqrt(cp[a][a] * cp[b][b]))));
  return R;
}

export interface KmoBartlett {
  kmo: number;
  /** Measure of sampling adequacy per variable (anti-image correlation diagonal). */
  msa: number[];
  chi2: number;
  df: number;
  p: number;
  determinant: number;
}

/** Kaiser-Meyer-Olkin measure and Bartlett's test of sphericity (n = weighted number of cases). */
export function kmoBartlett(R: number[][], n: number): KmoBartlett {
  const p = R.length;
  const Rm = fromRows(R);
  const ld = logDet(Rm);
  const determinant = ld.sign <= 0 ? 0 : Math.exp(ld.logAbs);
  const df = (p * (p - 1)) / 2;
  const chi2 = ld.sign > 0 ? -(n - 1 - (2 * p + 5) / 6) * ld.logAbs : NaN;
  let kmo = NaN;
  const msa = new Array<number>(p).fill(NaN);
  try {
    const inv = spdInverse(Rm);
    const P = (i: number, j: number) => -inv.data[i * p + j] / Math.sqrt(inv.data[i * p + i] * inv.data[j * p + j]);
    let sr = 0, sp = 0;
    for (let i = 0; i < p; i++) {
      let ri = 0, pi = 0;
      for (let j = 0; j < p; j++) {
        if (i === j) continue;
        ri += R[i][j] ** 2;
        pi += P(i, j) ** 2;
      }
      msa[i] = ri / (ri + pi);
      sr += ri;
      sp += pi;
    }
    kmo = sr / (sr + sp);
  } catch (e) {
    if (!(e instanceof SingularMatrixError)) throw e;
  }
  return { kmo, msa, chi2, df, p: Number.isFinite(chi2) ? chi2Sf(chi2, df) : NaN, determinant };
}

export interface ExtractionResult {
  method: Extraction;
  /** Eigenvalues of R (SPSS "Initial Eigenvalues"). */
  eigenvalues: number[];
  nFactors: number;
  /** p x m unrotated loadings. */
  loadings: number[][];
  initialCommunalities: number[];
  communalities: number[];
  iterations: number;
  converged: boolean;
  /** A communality exceeded 1 during iteration (Heywood case). */
  heywood: boolean;
}

export function extractFactors(
  R: number[][],
  opts: { method: Extraction; nFactors?: number; minEigen?: number; maxIter?: number; convergence?: number },
): ExtractionResult {
  const p = R.length;
  const Rm = fromRows(R);
  const eig = symEigen(Rm);
  const eigenvalues = Array.from(eig.values);
  let m: number;
  if (opts.nFactors && opts.nFactors > 0) m = Math.min(opts.nFactors, p);
  else {
    const minEigen = opts.minEigen ?? 1;
    m = eigenvalues.filter((v) => v > minEigen).length;
  }
  if (m < 1) throw new Error('No factors meet the extraction criterion. Lower the eigenvalue threshold or ask for a fixed number of factors.');
  const maxIter = opts.maxIter ?? 25;
  const eps = opts.convergence ?? 0.001;
  const loadingsFrom = (vals: Float64Array, vecs: Matrix) => {
    const L: number[][] = Array.from({ length: p }, () => new Array<number>(m).fill(0));
    for (let k = 0; k < m; k++) {
      const s = Math.sqrt(Math.max(vals[k], 0));
      for (let i = 0; i < p; i++) L[i][k] = vecs.data[i * p + k] * s;
    }
    return L;
  };
  const comm = (L: number[][]) => L.map((r) => r.reduce((s, v) => s + v * v, 0));

  if (opts.method === 'pc') {
    const L = orientColumns(loadingsFrom(eig.values, eig.vectors));
    return { method: 'pc', eigenvalues, nFactors: m, loadings: L, initialCommunalities: new Array<number>(p).fill(1), communalities: comm(L), iterations: 0, converged: true, heywood: false };
  }
  // Principal axis factoring.
  if (m >= p) throw new Error('Principal axis factoring needs fewer factors than variables.');
  let init: number[];
  try {
    const inv = spdInverse(Rm);
    init = Array.from({ length: p }, (_, i) => 1 - 1 / inv.data[i * p + i]);
  } catch (e) {
    if (!(e instanceof SingularMatrixError)) throw e;
    throw new Error('The correlation matrix is singular (some variables are exact linear combinations of others), so principal axis factoring cannot start. Remove redundant variables or use principal components.');
  }
  let h = init.slice();
  let L: number[][] = [];
  let converged = false;
  let heywood = false;
  let iterations = 0;
  for (let iter = 1; iter <= maxIter; iter++) {
    iterations = iter;
    const Rr = Rm.data.slice();
    for (let i = 0; i < p; i++) Rr[i * p + i] = h[i];
    const e = symEigen({ rows: p, cols: p, data: Rr });
    L = loadingsFrom(e.values, e.vectors);
    const hNew = comm(L);
    let change = 0;
    for (let i = 0; i < p; i++) change = Math.max(change, Math.abs(hNew[i] - h[i]));
    if (hNew.some((v) => v > 1)) heywood = true;
    h = hNew;
    if (change < eps) {
      converged = true;
      break;
    }
  }
  L = orientColumns(L);
  return { method: 'paf', eigenvalues, nFactors: m, loadings: L, initialCommunalities: init, communalities: comm(L), iterations, converged, heywood };
}

/** Reflect columns so each column's loadings sum to a positive number. */
export function orientColumns(L: number[][]): number[][] {
  if (!L.length) return L;
  const m = L[0].length;
  const out = L.map((r) => r.slice());
  for (let k = 0; k < m; k++) {
    let s = 0;
    for (const r of out) s += r[k];
    if (s < 0) for (const r of out) r[k] = -r[k];
  }
  return out;
}

export interface RotationResult {
  rotation: Rotation;
  /** Rotated loadings (orthogonal) or pattern matrix (oblique). p x m. */
  pattern: number[][];
  /** Structure matrix (oblique only; equals pattern for orthogonal). */
  structure: number[][];
  /** Factor correlation matrix (identity for orthogonal). */
  phi: number[][];
  iterations: number;
  converged: boolean;
}

function toMatrix(L: number[][]): Matrix {
  return fromRows(L);
}
function toArray(M: Matrix): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < M.rows; i++) out.push(Array.from(M.data.subarray(i * M.cols, (i + 1) * M.cols)));
  return out;
}

function kaiserNormalize(L: number[][]): { A: number[][]; h: number[] } {
  const h = L.map((r) => Math.sqrt(r.reduce((s, v) => s + v * v, 0)));
  return { A: L.map((r, i) => r.map((v) => (h[i] > 0 ? v / h[i] : 0))), h };
}

/** Varimax (raw criterion on the supplied matrix). Returns the rotated matrix and the rotation T. */
function varimaxRaw(A: number[][], maxIter = 5000, tol = 1e-11): { L: number[][]; T: Matrix; iterations: number; converged: boolean } {
  const p = A.length, m = A[0].length;
  const Am = toMatrix(A);
  let T = identity(m);
  let iterations = 0;
  let converged = false;
  for (let iter = 1; iter <= maxIter; iter++) {
    iterations = iter;
    const Z = multiply(Am, T);
    const colSq = new Float64Array(m);
    for (let i = 0; i < p; i++) for (let k = 0; k < m; k++) colSq[k] += Z.data[i * m + k] ** 2;
    const G = zeros(p, m);
    for (let i = 0; i < p; i++)
      for (let k = 0; k < m; k++) {
        const z = Z.data[i * m + k];
        G.data[i * m + k] = z * z * z - (z * colSq[k]) / p;
      }
    const B = multiply(transpose(Am), G);
    // Polar factor of B: B (B'B)^-1/2
    const BtB = multiply(transpose(B), B);
    const inv = symMatrixFunction(BtB, (x) => (x > 0 ? 1 / Math.sqrt(x) : 0));
    const Tnew = multiply(B, inv);
    // The criterion is flat at the optimum (changes are quadratic in the rotation error), so
    // convergence is judged on the rotation matrix itself.
    let change = 0;
    for (let i = 0; i < m * m; i++) change = Math.max(change, Math.abs(Tnew.data[i] - T.data[i]));
    T = Tnew;
    if (change <= tol) {
      converged = true;
      break;
    }
  }
  return { L: toArray(multiply(Am, T)), T, iterations, converged };
}

export function rotate(L: number[][], rotation: Rotation, opts: { kappa?: number; delta?: number; normalize?: boolean } = {}): RotationResult {
  const p = L.length;
  const m = L[0]?.length ?? 0;
  const eye = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => (i === j ? 1 : 0)));
  if (rotation === 'none' || m < 2) {
    return { rotation, pattern: L.map((r) => r.slice()), structure: L.map((r) => r.slice()), phi: eye, iterations: 0, converged: true };
  }
  const normalize = opts.normalize ?? true;
  const { A, h } = normalize ? kaiserNormalize(L) : { A: L, h: new Array<number>(p).fill(1) };
  const denorm = (M: number[][]) => M.map((r, i) => r.map((v) => v * h[i]));

  if (rotation === 'varimax') {
    const v = varimaxRaw(A);
    const Lr = orientColumns(denorm(v.L));
    return { rotation, pattern: Lr, structure: Lr.map((r) => r.slice()), phi: eye, iterations: v.iterations, converged: v.converged };
  }
  if (rotation === 'promax') {
    const kappa = opts.kappa ?? 4;
    const v = varimaxRaw(A);
    const An = v.L; // normalised varimax loadings
    const Am = toMatrix(An);
    const Pt = zeros(p, m);
    for (let i = 0; i < p; i++) for (let k = 0; k < m; k++) {
      const a = An[i][k];
      Pt.data[i * m + k] = Math.sign(a) * Math.abs(a) ** kappa;
    }
    const AtA = multiply(transpose(Am), Am);
    let U = multiply(inverse(AtA), multiply(transpose(Am), Pt));
    const UtUinv = inverse(multiply(transpose(U), U));
    const D = zeros(m, m);
    for (let k = 0; k < m; k++) D.data[k * m + k] = Math.sqrt(UtUinv.data[k * m + k]);
    U = multiply(U, D);
    const patternN = multiply(Am, U);
    const phiM = inverse(multiply(transpose(U), U));
    return finishOblique(rotation, denorm(toArray(patternN)), toArray(phiM), v.iterations, v.converged);
  }
  // Direct oblimin via gradient projection.
  const delta = opts.delta ?? 0;
  const res = obliminGPA(A, delta);
  return finishOblique(rotation, denorm(res.L), res.phi, res.iterations, res.converged);
}

function finishOblique(rotation: Rotation, pattern: number[][], phi: number[][], iterations: number, converged: boolean): RotationResult {
  const m = phi.length;
  // Reflect factors with negative loading sums (and the matching rows/cols of phi).
  const sign = new Array<number>(m).fill(1);
  for (let k = 0; k < m; k++) {
    let s = 0;
    for (const r of pattern) s += r[k];
    if (s < 0) sign[k] = -1;
  }
  const P = pattern.map((r) => r.map((v, k) => v * sign[k]));
  const Phi = phi.map((r, a) => r.map((v, b) => v * sign[a] * sign[b]));
  const S = P.map((r) => Phi.map((_, b) => r.reduce((s, v, a) => s + v * Phi[a][b], 0)));
  return { rotation, pattern: P, structure: S, phi: Phi, iterations, converged };
}

function obliminGPA(A: number[][], delta: number, maxIter = 5000, tol = 1e-10): { L: number[][]; phi: number[][]; iterations: number; converged: boolean } {
  const p = A.length, m = A[0].length;
  const Am = toMatrix(A);
  // Criterion: f = 1/4 Σ (L² ∘ ((I - δ/p 11') L² N)), N = 11' - I ; gradient L ∘ ((I - δ/p 11') L² N)
  const crit = (Lm: Matrix): { f: number; G: Matrix } => {
    const L2 = new Float64Array(p * m);
    for (let i = 0; i < p * m; i++) L2[i] = Lm.data[i] ** 2;
    // X = L² N : each element = row sum minus self
    const X = new Float64Array(p * m);
    for (let i = 0; i < p; i++) {
      let rs = 0;
      for (let k = 0; k < m; k++) rs += L2[i * m + k];
      for (let k = 0; k < m; k++) X[i * m + k] = rs - L2[i * m + k];
    }
    if (delta !== 0) {
      const colMean = new Float64Array(m);
      for (let i = 0; i < p; i++) for (let k = 0; k < m; k++) colMean[k] += X[i * m + k];
      for (let k = 0; k < m; k++) colMean[k] *= delta / p;
      for (let i = 0; i < p; i++) for (let k = 0; k < m; k++) X[i * m + k] -= colMean[k];
    }
    let f = 0;
    const G = zeros(p, m);
    for (let i = 0; i < p * m; i++) {
      f += L2[i] * X[i];
      G.data[i] = Lm.data[i] * X[i];
    }
    return { f: f / 4, G };
  };
  let T = identity(m);
  let Ti = identity(m);
  let Lm = multiply(Am, transpose(Ti));
  let { f, G: Gq } = crit(Lm);
  // G = -(L' Gq Ti)'
  let G = scaleM(transpose(multiply(multiply(transpose(Lm), Gq), Ti)), -1);
  let al = 1;
  let iterations = 0;
  let converged = false;
  for (let iter = 0; iter <= maxIter; iter++) {
    iterations = iter;
    // Projected gradient: Gp = G - T diag(colSums(T ∘ G))
    const Gp = zeros(m, m);
    let sNorm = 0;
    for (let k = 0; k < m; k++) {
      let cs = 0;
      for (let r = 0; r < m; r++) cs += T.data[r * m + k] * G.data[r * m + k];
      for (let r = 0; r < m; r++) {
        const v = G.data[r * m + k] - T.data[r * m + k] * cs;
        Gp.data[r * m + k] = v;
        sNorm += v * v;
      }
    }
    const s = Math.sqrt(sNorm);
    if (s < tol) {
      converged = true;
      break;
    }
    al *= 2;
    let accepted = false;
    for (let h = 0; h <= 20; h++) {
      const X = zeros(m, m);
      for (let i = 0; i < m * m; i++) X.data[i] = T.data[i] - al * Gp.data[i];
      for (let k = 0; k < m; k++) {
        let cs = 0;
        for (let r = 0; r < m; r++) cs += X.data[r * m + k] ** 2;
        const v = 1 / Math.sqrt(cs);
        for (let r = 0; r < m; r++) X.data[r * m + k] *= v;
      }
      let Xi: Matrix;
      try {
        Xi = inverse(X);
      } catch {
        al /= 2;
        continue;
      }
      const Lt = multiply(Am, transpose(Xi));
      const c = crit(Lt);
      if (c.f < f - 0.5 * s * s * al) {
        T = X;
        Ti = Xi;
        Lm = Lt;
        f = c.f;
        Gq = c.G;
        accepted = true;
        break;
      }
      al /= 2;
    }
    if (!accepted) {
      // No further decrease possible at machine precision: treat as converged.
      converged = s < 1e-6;
      break;
    }
    G = scaleM(transpose(multiply(multiply(transpose(Lm), Gq), Ti)), -1);
  }
  const phi = multiply(transpose(T), T);
  return { L: toArray(Lm), phi: toArray(phi), iterations, converged };
}

function scaleM(M: Matrix, s: number): Matrix {
  const out = zeros(M.rows, M.cols);
  for (let i = 0; i < M.data.length; i++) out.data[i] = M.data[i] * s;
  return out;
}

/** Sums of squared loadings per column. */
export function columnSS(L: number[][]): number[] {
  if (!L.length) return [];
  const m = L[0].length;
  const out = new Array<number>(m).fill(0);
  for (const r of L) for (let k = 0; k < m; k++) out[k] += r[k] * r[k];
  return out;
}

/**
 * Row order for "sort by size" (SPSS): variables grouped by the factor on which they have their
 * largest absolute loading, and sorted by that loading (descending) within each group.
 */
export function sortOrder(L: number[][]): number[] {
  const p = L.length;
  const best = L.map((r) => {
    let k = 0;
    for (let j = 1; j < r.length; j++) if (Math.abs(r[j]) > Math.abs(r[k])) k = j;
    return k;
  });
  return Array.from({ length: p }, (_, i) => i).sort((a, b) => best[a] - best[b] || Math.abs(L[b][best[b]]) - Math.abs(L[a][best[a]]));
}

