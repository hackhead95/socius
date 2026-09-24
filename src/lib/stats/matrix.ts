// Dense linear algebra for the model procedures.
//
// Matrices are row-major Float64Array buffers wrapped in a small plain object. Everything here is
// pure: inputs are never mutated. Algorithms are the numerically careful textbook ones:
// Householder QR (optionally with column pivoting for rank detection), Cholesky for symmetric
// positive-definite systems, LU with partial pivoting for general systems, and Householder
// tridiagonalisation + implicit QL for the symmetric eigenproblem (EISPACK tred2/tql2).

export interface Matrix {
  readonly rows: number;
  readonly cols: number;
  /** Row-major: element (i, j) is data[i * cols + j]. */
  readonly data: Float64Array;
}

export class SingularMatrixError extends Error {
  constructor(message = 'The matrix is singular (or numerically singular).') {
    super(message);
    this.name = 'SingularMatrixError';
  }
}

// ---------- Construction and access ----------

export function zeros(rows: number, cols: number): Matrix {
  return { rows, cols, data: new Float64Array(rows * cols) };
}

export function identity(n: number): Matrix {
  const m = zeros(n, n);
  for (let i = 0; i < n; i++) m.data[i * n + i] = 1;
  return m;
}

export function matrix(rows: number, cols: number, data: ArrayLike<number>): Matrix {
  if (data.length !== rows * cols) throw new Error(`matrix: expected ${rows * cols} values, got ${data.length}`);
  return { rows, cols, data: Float64Array.from(data) };
}

export function fromRows(a: ArrayLike<ArrayLike<number>>): Matrix {
  const rows = a.length;
  const cols = rows ? a[0].length : 0;
  const m = zeros(rows, cols);
  for (let i = 0; i < rows; i++) {
    if (a[i].length !== cols) throw new Error('fromRows: ragged input');
    for (let j = 0; j < cols; j++) m.data[i * cols + j] = a[i][j];
  }
  return m;
}

/** Build a matrix whose columns are the given vectors (all the same length). */
export function fromColumns(cols: ArrayLike<ArrayLike<number>>): Matrix {
  const c = cols.length;
  const r = c ? cols[0].length : 0;
  const m = zeros(r, c);
  for (let j = 0; j < c; j++) {
    const col = cols[j];
    if (col.length !== r) throw new Error('fromColumns: columns differ in length');
    for (let i = 0; i < r; i++) m.data[i * c + j] = col[i];
  }
  return m;
}

export function toRows(m: Matrix): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < m.rows; i++) out.push(Array.from(m.data.subarray(i * m.cols, (i + 1) * m.cols)));
  return out;
}

export function get(m: Matrix, i: number, j: number): number {
  return m.data[i * m.cols + j];
}

export function column(m: Matrix, j: number): Float64Array {
  const out = new Float64Array(m.rows);
  for (let i = 0; i < m.rows; i++) out[i] = m.data[i * m.cols + j];
  return out;
}

export function row(m: Matrix, i: number): Float64Array {
  return m.data.slice(i * m.cols, (i + 1) * m.cols);
}

export function diag(m: Matrix): Float64Array {
  const n = Math.min(m.rows, m.cols);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = m.data[i * m.cols + i];
  return out;
}

export function diagMatrix(d: ArrayLike<number>): Matrix {
  const n = d.length;
  const m = zeros(n, n);
  for (let i = 0; i < n; i++) m.data[i * n + i] = d[i];
  return m;
}

export function clone(m: Matrix): Matrix {
  return { rows: m.rows, cols: m.cols, data: m.data.slice() };
}

/** Sub-matrix of the given row and column indices. */
export function subMatrix(m: Matrix, rowIdx: ArrayLike<number>, colIdx: ArrayLike<number>): Matrix {
  const out = zeros(rowIdx.length, colIdx.length);
  for (let i = 0; i < rowIdx.length; i++) {
    const base = rowIdx[i] * m.cols;
    for (let j = 0; j < colIdx.length; j++) out.data[i * colIdx.length + j] = m.data[base + colIdx[j]];
  }
  return out;
}

// ---------- Basic arithmetic ----------

export function transpose(m: Matrix): Matrix {
  const out = zeros(m.cols, m.rows);
  for (let i = 0; i < m.rows; i++) for (let j = 0; j < m.cols; j++) out.data[j * m.rows + i] = m.data[i * m.cols + j];
  return out;
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  if (a.cols !== b.rows) throw new Error(`multiply: ${a.rows}x${a.cols} times ${b.rows}x${b.cols}`);
  const out = zeros(a.rows, b.cols);
  const n = a.cols, p = b.cols;
  for (let i = 0; i < a.rows; i++) {
    const oi = i * p;
    for (let k = 0; k < n; k++) {
      const aik = a.data[i * n + k];
      if (aik === 0) continue;
      const bk = k * p;
      for (let j = 0; j < p; j++) out.data[oi + j] += aik * b.data[bk + j];
    }
  }
  return out;
}

export function matVec(a: Matrix, x: ArrayLike<number>): Float64Array {
  if (a.cols !== x.length) throw new Error('matVec: dimension mismatch');
  const out = new Float64Array(a.rows);
  for (let i = 0; i < a.rows; i++) {
    let s = 0;
    const base = i * a.cols;
    for (let j = 0; j < a.cols; j++) s += a.data[base + j] * x[j];
    out[i] = s;
  }
  return out;
}

/** a' x */
export function tMatVec(a: Matrix, x: ArrayLike<number>): Float64Array {
  if (a.rows !== x.length) throw new Error('tMatVec: dimension mismatch');
  const out = new Float64Array(a.cols);
  for (let i = 0; i < a.rows; i++) {
    const xi = x[i];
    if (xi === 0) continue;
    const base = i * a.cols;
    for (let j = 0; j < a.cols; j++) out[j] += a.data[base + j] * xi;
  }
  return out;
}

/** A' diag(w) A (or A'A when w is omitted). Result is exactly symmetric. */
export function crossprod(a: Matrix, w?: ArrayLike<number>): Matrix {
  const p = a.cols;
  const out = zeros(p, p);
  for (let i = 0; i < a.rows; i++) {
    const wi = w ? w[i] : 1;
    if (wi === 0) continue;
    const base = i * p;
    for (let j = 0; j < p; j++) {
      const v = a.data[base + j] * wi;
      if (v === 0) continue;
      for (let k = j; k < p; k++) out.data[j * p + k] += v * a.data[base + k];
    }
  }
  for (let j = 0; j < p; j++) for (let k = 0; k < j; k++) out.data[j * p + k] = out.data[k * p + j];
  return out;
}

export function add(a: Matrix, b: Matrix): Matrix {
  if (a.rows !== b.rows || a.cols !== b.cols) throw new Error('add: dimension mismatch');
  const out = zeros(a.rows, a.cols);
  for (let i = 0; i < a.data.length; i++) out.data[i] = a.data[i] + b.data[i];
  return out;
}

export function subtract(a: Matrix, b: Matrix): Matrix {
  if (a.rows !== b.rows || a.cols !== b.cols) throw new Error('subtract: dimension mismatch');
  const out = zeros(a.rows, a.cols);
  for (let i = 0; i < a.data.length; i++) out.data[i] = a.data[i] - b.data[i];
  return out;
}

export function scale(a: Matrix, s: number): Matrix {
  const out = zeros(a.rows, a.cols);
  for (let i = 0; i < a.data.length; i++) out.data[i] = a.data[i] * s;
  return out;
}

export function dot(x: ArrayLike<number>, y: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * y[i];
  return s;
}

/** Largest absolute element difference (for convergence checks and tests). */
export function maxAbsDiff(a: Matrix, b: Matrix): number {
  let m = 0;
  for (let i = 0; i < a.data.length; i++) m = Math.max(m, Math.abs(a.data[i] - b.data[i]));
  return m;
}

/** Make a nearly-symmetric matrix exactly symmetric by averaging with its transpose. */
export function symmetrize(a: Matrix): Matrix {
  const n = a.rows;
  const out = clone(a);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < i; j++) {
      const v = 0.5 * (a.data[i * n + j] + a.data[j * n + i]);
      out.data[i * n + j] = v;
      out.data[j * n + i] = v;
    }
  return out;
}

// ---------- Cholesky ----------

/**
 * Cholesky factor L (lower triangular, A = L L') of a symmetric positive-definite matrix, or null
 * when A is not numerically positive definite.
 */
export function cholesky(a: Matrix): Matrix | null {
  const n = a.rows;
  if (a.cols !== n) throw new Error('cholesky: matrix must be square');
  const L = zeros(n, n);
  const l = L.data;
  let maxDiag = 0;
  for (let i = 0; i < n; i++) maxDiag = Math.max(maxDiag, Math.abs(a.data[i * n + i]));
  const tol = maxDiag * n * 2.220446049250313e-16;
  for (let j = 0; j < n; j++) {
    let s = a.data[j * n + j];
    for (let k = 0; k < j; k++) s -= l[j * n + k] * l[j * n + k];
    if (!(s > tol)) return null;
    const d = Math.sqrt(s);
    l[j * n + j] = d;
    for (let i = j + 1; i < n; i++) {
      let t = a.data[i * n + j];
      for (let k = 0; k < j; k++) t -= l[i * n + k] * l[j * n + k];
      l[i * n + j] = t / d;
    }
  }
  return L;
}

/** Solve L y = b (L lower triangular). */
export function forwardSubstitute(L: Matrix, b: ArrayLike<number>): Float64Array {
  const n = L.rows;
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L.data[i * n + k] * y[k];
    y[i] = s / L.data[i * n + i];
  }
  return y;
}

/** Solve U x = b (U upper triangular, stored in the upper triangle of a square matrix). */
export function backSubstitute(U: Matrix, b: ArrayLike<number>): Float64Array {
  const n = U.cols;
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let k = i + 1; k < n; k++) s -= U.data[i * U.cols + k] * x[k];
    x[i] = s / U.data[i * U.cols + i];
  }
  return x;
}

/** Solve L' x = y (L lower triangular). */
function backSubstituteTransposed(L: Matrix, y: ArrayLike<number>): Float64Array {
  const n = L.rows;
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < n; k++) s -= L.data[k * n + i] * x[k];
    x[i] = s / L.data[i * n + i];
  }
  return x;
}

export function choleskySolve(L: Matrix, b: ArrayLike<number>): Float64Array {
  return backSubstituteTransposed(L, forwardSubstitute(L, b));
}

/** Inverse of a symmetric positive-definite matrix via Cholesky. Throws SingularMatrixError otherwise. */
export function spdInverse(a: Matrix): Matrix {
  const L = cholesky(a);
  if (!L) throw new SingularMatrixError('The matrix is not positive definite.');
  return choleskyInverse(L);
}

export function choleskyInverse(L: Matrix): Matrix {
  const n = L.rows;
  // Invert L (lower triangular), then A^-1 = L^-T L^-1.
  const Li = zeros(n, n);
  for (let j = 0; j < n; j++) {
    Li.data[j * n + j] = 1 / L.data[j * n + j];
    for (let i = j + 1; i < n; i++) {
      let s = 0;
      for (let k = j; k < i; k++) s -= L.data[i * n + k] * Li.data[k * n + j];
      Li.data[i * n + j] = s / L.data[i * n + i];
    }
  }
  const out = zeros(n, n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j <= i; j++) {
      let s = 0;
      for (let k = i; k < n; k++) s += Li.data[k * n + i] * Li.data[k * n + j];
      out.data[i * n + j] = s;
      out.data[j * n + i] = s;
    }
  return out;
}

// ---------- LU (general square systems) ----------

export interface LU {
  lu: Matrix;
  piv: Int32Array;
  sign: number;
  singular: boolean;
}

export function luDecompose(a: Matrix): LU {
  const n = a.rows;
  if (a.cols !== n) throw new Error('luDecompose: matrix must be square');
  const m = clone(a);
  const d = m.data;
  const piv = new Int32Array(n);
  for (let i = 0; i < n; i++) piv[i] = i;
  let sign = 1;
  let singular = false;
  let norm = 0;
  for (let i = 0; i < d.length; i++) norm = Math.max(norm, Math.abs(d[i]));
  const tol = norm * n * 2.220446049250313e-16;
  for (let k = 0; k < n; k++) {
    let p = k;
    let best = Math.abs(d[k * n + k]);
    for (let i = k + 1; i < n; i++) {
      const v = Math.abs(d[i * n + k]);
      if (v > best) {
        best = v;
        p = i;
      }
    }
    if (p !== k) {
      for (let j = 0; j < n; j++) {
        const t = d[k * n + j];
        d[k * n + j] = d[p * n + j];
        d[p * n + j] = t;
      }
      const t = piv[k];
      piv[k] = piv[p];
      piv[p] = t;
      sign = -sign;
    }
    const pivot = d[k * n + k];
    if (!(Math.abs(pivot) > tol)) {
      singular = true;
      continue;
    }
    for (let i = k + 1; i < n; i++) {
      const f = (d[i * n + k] /= pivot);
      if (f === 0) continue;
      for (let j = k + 1; j < n; j++) d[i * n + j] -= f * d[k * n + j];
    }
  }
  return { lu: m, piv, sign, singular };
}

function luSolveVec(f: LU, b: ArrayLike<number>): Float64Array {
  const n = f.lu.rows;
  const d = f.lu.data;
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) x[i] = b[f.piv[i]];
  for (let i = 0; i < n; i++) for (let k = 0; k < i; k++) x[i] -= d[i * n + k] * x[k];
  for (let i = n - 1; i >= 0; i--) {
    for (let k = i + 1; k < n; k++) x[i] -= d[i * n + k] * x[k];
    x[i] /= d[i * n + i];
  }
  return x;
}

/** Solve A x = b for square A. Throws SingularMatrixError when A is singular. */
export function solve(a: Matrix, b: ArrayLike<number>): Float64Array {
  const f = luDecompose(a);
  if (f.singular) throw new SingularMatrixError();
  return luSolveVec(f, b);
}

/** Inverse of a general square matrix. Throws SingularMatrixError when singular. */
export function inverse(a: Matrix): Matrix {
  const n = a.rows;
  const f = luDecompose(a);
  if (f.singular) throw new SingularMatrixError();
  const out = zeros(n, n);
  const e = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    e.fill(0);
    e[j] = 1;
    const x = luSolveVec(f, e);
    for (let i = 0; i < n; i++) out.data[i * n + j] = x[i];
  }
  return out;
}

/** log|det(A)| and the sign of det(A). A singular matrix gives { sign: 0, logAbs: -Infinity }. */
export function logDet(a: Matrix): { sign: number; logAbs: number } {
  const n = a.rows;
  if (n === 0) return { sign: 1, logAbs: 0 };
  const f = luDecompose(a);
  let sign = f.sign;
  let logAbs = 0;
  for (let i = 0; i < n; i++) {
    const v = f.lu.data[i * n + i];
    if (v === 0 || !Number.isFinite(v)) return { sign: 0, logAbs: -Infinity };
    if (v < 0) sign = -sign;
    logAbs += Math.log(Math.abs(v));
  }
  return { sign, logAbs };
}

export function determinant(a: Matrix): number {
  const { sign, logAbs } = logDet(a);
  return sign === 0 ? 0 : sign * Math.exp(logAbs);
}

// ---------- Householder QR ----------

export interface QR {
  /** R in the upper triangle; Householder vectors below the diagonal (LAPACK geqp3 layout). */
  qr: Matrix;
  tau: Float64Array;
  /** Column permutation: column k of Q R is column perm[k] of the input. */
  perm: Int32Array;
  /** Numerical rank. */
  rank: number;
}

/**
 * Householder QR with column pivoting (Businger-Golub). `rank` is the number of leading diagonal
 * elements of R with |r_kk| > tol * |r_11|, where tol defaults to max(m, n) * machine epsilon * 10.
 * Set `pivot` to false for a plain QR in the original column order (rank still reported).
 */
export function qrDecompose(a: Matrix, opts: { pivot?: boolean; tol?: number } = {}): QR {
  const m = a.rows, n = a.cols;
  const pivot = opts.pivot ?? true;
  const A = clone(a);
  const d = A.data;
  const tau = new Float64Array(Math.min(m, n));
  const perm = new Int32Array(n);
  for (let j = 0; j < n; j++) perm[j] = j;
  const colNorm = new Float64Array(n);
  const colNormRef = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (let i = 0; i < m; i++) s += d[i * n + j] * d[i * n + j];
    colNorm[j] = s;
    colNormRef[j] = s;
  }
  const kmax = Math.min(m, n);
  for (let k = 0; k < kmax; k++) {
    if (pivot) {
      let best = k;
      for (let j = k + 1; j < n; j++) if (colNorm[j] > colNorm[best]) best = j;
      if (best !== k) {
        for (let i = 0; i < m; i++) {
          const t = d[i * n + k];
          d[i * n + k] = d[i * n + best];
          d[i * n + best] = t;
        }
        let t = colNorm[k]; colNorm[k] = colNorm[best]; colNorm[best] = t;
        t = colNormRef[k]; colNormRef[k] = colNormRef[best]; colNormRef[best] = t;
        const tp = perm[k]; perm[k] = perm[best]; perm[best] = tp;
      }
    }
    // Householder vector for column k, rows k..m-1.
    let norm = 0;
    for (let i = k; i < m; i++) norm = Math.hypot(norm, d[i * n + k]);
    if (norm === 0) {
      tau[k] = 0;
      continue;
    }
    const alpha = d[k * n + k] > 0 ? -norm : norm;
    const v0 = d[k * n + k] - alpha;
    // Store v with v[0] = 1 implicitly: scale below-diagonal by 1/v0.
    for (let i = k + 1; i < m; i++) d[i * n + k] /= v0;
    tau[k] = -v0 / alpha;
    d[k * n + k] = alpha;
    // Apply H = I - tau v v' to the remaining columns.
    for (let j = k + 1; j < n; j++) {
      let s = d[k * n + j];
      for (let i = k + 1; i < m; i++) s += d[i * n + k] * d[i * n + j];
      s *= tau[k];
      d[k * n + j] -= s;
      for (let i = k + 1; i < m; i++) d[i * n + j] -= s * d[i * n + k];
    }
    // Downdate column norms (recompute when cancellation makes the downdate unreliable).
    if (pivot) {
      for (let j = k + 1; j < n; j++) {
        if (colNorm[j] === 0) continue;
        const r = d[k * n + j];
        let t = colNorm[j] - r * r;
        if (t < 1e-10 * colNormRef[j]) {
          t = 0;
          for (let i = k + 1; i < m; i++) t += d[i * n + j] * d[i * n + j];
          colNormRef[j] = t;
        }
        colNorm[j] = Math.max(t, 0);
      }
    }
  }
  const tol = opts.tol ?? Math.max(m, n) * 2.220446049250313e-16 * 10;
  let rank = 0;
  const r11 = kmax > 0 ? Math.abs(d[0]) : 0;
  for (let k = 0; k < kmax; k++) {
    if (Math.abs(d[k * n + k]) > tol * r11 && r11 > 0) rank++;
    else if (pivot) break;
  }
  return { qr: A, tau, perm, rank };
}

/** Q' b for a QR factorisation. */
export function qrApplyQt(f: QR, b: ArrayLike<number>): Float64Array {
  const m = f.qr.rows, n = f.qr.cols;
  const d = f.qr.data;
  const y = Float64Array.from(b);
  for (let k = 0; k < f.tau.length; k++) {
    if (f.tau[k] === 0) continue;
    let s = y[k];
    for (let i = k + 1; i < m; i++) s += d[i * n + k] * y[i];
    s *= f.tau[k];
    y[k] -= s;
    for (let i = k + 1; i < m; i++) y[i] -= s * d[i * n + k];
  }
  return y;
}

/** The upper-triangular R (first min(m,n) rows) of a QR factorisation, in pivoted column order. */
export function qrR(f: QR): Matrix {
  const n = f.qr.cols;
  const k = Math.min(f.qr.rows, n);
  const R = zeros(k, n);
  for (let i = 0; i < k; i++) for (let j = i; j < n; j++) R.data[i * n + j] = f.qr.data[i * n + j];
  return R;
}

export interface LeastSquaresResult {
  /** Coefficients in the original column order; NaN for columns dropped as linearly dependent. */
  coef: Float64Array;
  rank: number;
  /** Indices (original order) of columns that were aliased (dropped). */
  aliased: number[];
  /** (X'X)^-1 for the retained columns, in original order (rows/cols of aliased columns are NaN). */
  unscaledCov: Matrix;
  residuals: Float64Array;
  rss: number;
}

/**
 * Minimum-norm-free least squares min ||y - X b|| using pivoted QR. Linearly dependent columns
 * (beyond the numerical rank) are dropped and reported in `aliased`.
 */
export function leastSquares(X: Matrix, y: ArrayLike<number>, opts: { tol?: number } = {}): LeastSquaresResult {
  const f = qrDecompose(X, { pivot: true, tol: opts.tol ?? 1e-10 });
  const n = X.cols, r = f.rank;
  const qty = qrApplyQt(f, y);
  const R = zeros(r, r);
  for (let i = 0; i < r; i++) for (let j = i; j < r; j++) R.data[i * r + j] = f.qr.data[i * n + j];
  const bp = backSubstitute(R, qty.subarray(0, r));
  const coef = new Float64Array(n).fill(NaN);
  for (let k = 0; k < r; k++) coef[f.perm[k]] = bp[k];
  // (R'R)^-1 = R^-1 R^-T
  const Ri = upperTriangularInverse(R);
  const cov = zeros(n, n);
  cov.data.fill(NaN);
  for (let a = 0; a < r; a++)
    for (let b = 0; b < r; b++) {
      let s = 0;
      for (let k = Math.max(a, b); k < r; k++) s += Ri.data[a * r + k] * Ri.data[b * r + k];
      cov.data[f.perm[a] * n + f.perm[b]] = s;
    }
  const fitted = new Float64Array(X.rows);
  for (let i = 0; i < X.rows; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) if (!Number.isNaN(coef[j])) s += X.data[i * n + j] * coef[j];
    fitted[i] = s;
  }
  const residuals = new Float64Array(X.rows);
  let rss = 0;
  for (let i = 0; i < X.rows; i++) {
    residuals[i] = y[i] - fitted[i];
    rss += residuals[i] * residuals[i];
  }
  const aliased: number[] = [];
  for (let k = r; k < n; k++) aliased.push(f.perm[k]);
  aliased.sort((p, q) => p - q);
  return { coef, rank: r, aliased, unscaledCov: cov, residuals, rss };
}

/** Inverse of a non-singular upper-triangular matrix. */
export function upperTriangularInverse(R: Matrix): Matrix {
  const n = R.rows;
  const out = zeros(n, n);
  for (let j = n - 1; j >= 0; j--) {
    const rjj = R.data[j * n + j];
    if (rjj === 0) throw new SingularMatrixError();
    out.data[j * n + j] = 1 / rjj;
    for (let i = j - 1; i >= 0; i--) {
      let s = 0;
      for (let k = i + 1; k <= j; k++) s += R.data[i * n + k] * out.data[k * n + j];
      out.data[i * n + j] = -s / R.data[i * n + i];
    }
  }
  return out;
}

// ---------- Symmetric eigenproblem ----------

export interface SymEigen {
  /** Eigenvalues sorted in descending order. */
  values: Float64Array;
  /** Eigenvectors as columns, in the same order as `values`. */
  vectors: Matrix;
}

/**
 * Eigen-decomposition of a real symmetric matrix: Householder reduction to tridiagonal form followed
 * by the implicit QL algorithm (EISPACK tred2 / tql2). Eigenvalues are returned in descending order.
 */
export function symEigen(a: Matrix): SymEigen {
  const n = a.rows;
  if (a.cols !== n) throw new Error('symEigen: matrix must be square');
  if (n === 0) return { values: new Float64Array(0), vectors: zeros(0, 0) };
  const V: Float64Array[] = [];
  for (let i = 0; i < n; i++) {
    const r = new Float64Array(n);
    for (let j = 0; j < n; j++) r[j] = 0.5 * (a.data[i * n + j] + a.data[j * n + i]);
    V.push(r);
  }
  const d = new Float64Array(n);
  const e = new Float64Array(n);
  tred2(n, V, d, e);
  tql2(n, V, d, e);
  const order = Array.from({ length: n }, (_, i) => i).sort((p, q) => d[q] - d[p]);
  const values = new Float64Array(n);
  const vectors = zeros(n, n);
  for (let k = 0; k < n; k++) {
    values[k] = d[order[k]];
    for (let i = 0; i < n; i++) vectors.data[i * n + k] = V[i][order[k]];
  }
  return { values, vectors };
}

function tred2(n: number, V: Float64Array[], d: Float64Array, e: Float64Array): void {
  for (let j = 0; j < n; j++) d[j] = V[n - 1][j];
  for (let i = n - 1; i > 0; i--) {
    let scale = 0;
    let h = 0;
    for (let k = 0; k < i; k++) scale += Math.abs(d[k]);
    if (scale === 0) {
      e[i] = d[i - 1];
      for (let j = 0; j < i; j++) {
        d[j] = V[i - 1][j];
        V[i][j] = 0;
        V[j][i] = 0;
      }
    } else {
      for (let k = 0; k < i; k++) {
        d[k] /= scale;
        h += d[k] * d[k];
      }
      let f = d[i - 1];
      let g = Math.sqrt(h);
      if (f > 0) g = -g;
      e[i] = scale * g;
      h -= f * g;
      d[i - 1] = f - g;
      for (let j = 0; j < i; j++) e[j] = 0;
      for (let j = 0; j < i; j++) {
        f = d[j];
        V[j][i] = f;
        g = e[j] + V[j][j] * f;
        for (let k = j + 1; k <= i - 1; k++) {
          g += V[k][j] * d[k];
          e[k] += V[k][j] * f;
        }
        e[j] = g;
      }
      f = 0;
      for (let j = 0; j < i; j++) {
        e[j] /= h;
        f += e[j] * d[j];
      }
      const hh = f / (h + h);
      for (let j = 0; j < i; j++) e[j] -= hh * d[j];
      for (let j = 0; j < i; j++) {
        f = d[j];
        g = e[j];
        for (let k = j; k <= i - 1; k++) V[k][j] -= f * e[k] + g * d[k];
        d[j] = V[i - 1][j];
        V[i][j] = 0;
      }
    }
    d[i] = h;
  }
  for (let i = 0; i < n - 1; i++) {
    V[n - 1][i] = V[i][i];
    V[i][i] = 1;
    const h = d[i + 1];
    if (h !== 0) {
      for (let k = 0; k <= i; k++) d[k] = V[k][i + 1] / h;
      for (let j = 0; j <= i; j++) {
        let g = 0;
        for (let k = 0; k <= i; k++) g += V[k][i + 1] * V[k][j];
        for (let k = 0; k <= i; k++) V[k][j] -= g * d[k];
      }
    }
    for (let k = 0; k <= i; k++) V[k][i + 1] = 0;
  }
  for (let j = 0; j < n; j++) {
    d[j] = V[n - 1][j];
    V[n - 1][j] = 0;
  }
  V[n - 1][n - 1] = 1;
  e[0] = 0;
}

function tql2(n: number, V: Float64Array[], d: Float64Array, e: Float64Array): void {
  for (let i = 1; i < n; i++) e[i - 1] = e[i];
  e[n - 1] = 0;
  let f = 0;
  let tst1 = 0;
  const eps = 2.220446049250313e-16;
  for (let l = 0; l < n; l++) {
    tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
    let m = l;
    while (m < n) {
      if (Math.abs(e[m]) <= eps * tst1) break;
      m++;
    }
    if (m === n) m = n - 1;
    if (m > l) {
      let iter = 0;
      do {
        if (++iter > 100) throw new Error('Eigenvalue computation did not converge.');
        let g = d[l];
        let p = (d[l + 1] - g) / (2 * e[l]);
        let r = Math.hypot(p, 1);
        if (p < 0) r = -r;
        d[l] = e[l] / (p + r);
        d[l + 1] = e[l] * (p + r);
        const dl1 = d[l + 1];
        let h = g - d[l];
        for (let i = l + 2; i < n; i++) d[i] -= h;
        f += h;
        p = d[m];
        let c = 1, c2 = c, c3 = c;
        const el1 = e[l + 1];
        let s = 0, s2 = 0;
        for (let i = m - 1; i >= l; i--) {
          c3 = c2;
          c2 = c;
          s2 = s;
          g = c * e[i];
          h = c * p;
          r = Math.hypot(p, e[i]);
          e[i + 1] = s * r;
          s = e[i] / r;
          c = p / r;
          p = c * d[i] - s * g;
          d[i + 1] = h + s * (c * g + s * d[i]);
          for (let k = 0; k < n; k++) {
            h = V[k][i + 1];
            V[k][i + 1] = s * V[k][i] + c * h;
            V[k][i] = c * V[k][i] - s * h;
          }
        }
        p = (-s * s2 * c3 * el1 * e[l]) / dl1;
        e[l] = s * p;
        d[l] = c * p;
      } while (Math.abs(e[l]) > eps * tst1);
    }
    d[l] = d[l] + f;
    e[l] = 0;
  }
}

/**
 * Symmetric matrix function: V f(D) V'. Used for inverse square roots (polar decompositions in
 * factor rotation) and similar.
 */
export function symMatrixFunction(a: Matrix, fn: (lambda: number) => number): Matrix {
  const { values, vectors } = symEigen(a);
  const n = a.rows;
  const out = zeros(n, n);
  for (let k = 0; k < n; k++) {
    const fk = fn(values[k]);
    for (let i = 0; i < n; i++) {
      const vik = vectors.data[i * n + k] * fk;
      if (vik === 0) continue;
      for (let j = 0; j < n; j++) out.data[i * n + j] += vik * vectors.data[j * n + k];
    }
  }
  return symmetrize(out);
}

// ---------- Nearly singular information matrices ----------

/**
 * Relative size (after scaling the matrix to unit diagonal) below which an eigenvalue of an
 * information matrix is treated as zero. Well above the rounding noise of symEigen (about
 * n * 1e-16 * largest eigenvalue) and far below any eigenvalue of a well-identified model.
 */
export const NULL_EIGEN_TOL = 1e-12;

interface ScaledEigen {
  d: Float64Array;
  values: Float64Array;
  vectors: Matrix;
  tol: number;
}

/** Eigen-decomposition of D A D with D = diag(A)^-1/2 (entries with no information keep scale 1). */
function scaledEigen(a: Matrix, relTol: number): ScaledEigen {
  const n = a.rows;
  let maxDiag = 0;
  for (let i = 0; i < n; i++) maxDiag = Math.max(maxDiag, a.data[i * n + i]);
  const d = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const v = a.data[i * n + i];
    d[i] = v > maxDiag * 1e-280 && v > 0 ? 1 / Math.sqrt(v) : 1;
  }
  const S = zeros(n, n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) S.data[i * n + j] = d[i] * a.data[i * n + j] * d[j];
  const { values, vectors } = symEigen(S);
  const tol = relTol * Math.max(n ? values[0] : 0, 1);
  return { d, values, vectors, tol };
}

export interface RobustSolve {
  x: Float64Array;
  /** True when the matrix had (numerically) zero eigenvalues, whose directions were left out of x. */
  rankDeficient: boolean;
}

/**
 * Solve A x = b for a symmetric positive semi-definite A (a Newton step with an information matrix).
 * Uses Cholesky when A is positive definite; otherwise the minimum-norm solution on the identified
 * subspace (Moore-Penrose pseudo-inverse of the unit-diagonal scaled matrix), which leaves
 * directions with no information (for example diverging parameters under separation) unchanged.
 */
export function spdSolveRobust(a: Matrix, b: ArrayLike<number>, relTol = NULL_EIGEN_TOL): RobustSolve {
  const L = cholesky(a);
  if (L) return { x: choleskySolve(L, b), rankDeficient: false };
  const n = a.rows;
  const { d, values, vectors, tol } = scaledEigen(a, relTol);
  const x = new Float64Array(n);
  let rankDeficient = false;
  for (let k = 0; k < n; k++) {
    if (!(values[k] > tol)) {
      rankDeficient = true;
      continue;
    }
    let c = 0;
    for (let i = 0; i < n; i++) c += vectors.data[i * n + k] * d[i] * b[i];
    c /= values[k];
    for (let i = 0; i < n; i++) x[i] += c * vectors.data[i * n + k];
  }
  for (let i = 0; i < n; i++) x[i] *= d[i];
  return { x, rankDeficient };
}

export interface RobustInverse {
  inv: Matrix;
  /** True when Cholesky failed and the eigen-decomposition fallback was used. */
  fallback: boolean;
  /** True when some eigenvalues were (numerically) zero and had to be floored. */
  rankDeficient: boolean;
  /**
   * For each parameter, the share (0 to 1) of its scaled direction lying in the numerical null
   * space. Near 0 for well-determined parameters, clearly positive for the ones that are not
   * identified (for example diverging parameters under quasi-complete separation).
   */
  nullLoading: Float64Array;
}

/**
 * Inverse of an information matrix that may be numerically singular, for standard errors in the
 * style of SPSS when the Hessian has "unexpected singularities". Cholesky when possible; otherwise
 * the matrix is scaled to unit diagonal and eigen-decomposed, and eigenvalues below the tolerance
 * are raised to it. Parameters that are well determined get their ordinary variances (the null
 * directions barely touch them), while parameters in the null space get very large, finite ones.
 */
export function spdInverseRobust(a: Matrix, relTol = NULL_EIGEN_TOL): RobustInverse {
  const n = a.rows;
  const L = cholesky(a);
  if (L) return { inv: choleskyInverse(L), fallback: false, rankDeficient: false, nullLoading: new Float64Array(n) };
  const { d, values, vectors, tol } = scaledEigen(a, relTol);
  const inv = zeros(n, n);
  const nullLoading = new Float64Array(n);
  let rankDeficient = false;
  for (let k = 0; k < n; k++) {
    const small = !(values[k] > tol);
    if (small) rankDeficient = true;
    const lk = small ? tol : values[k];
    for (let i = 0; i < n; i++) {
      const vi = vectors.data[i * n + k];
      if (small) nullLoading[i] += vi * vi;
      if (vi === 0) continue;
      const s = vi / lk;
      for (let j = 0; j < n; j++) inv.data[i * n + j] += s * vectors.data[j * n + k];
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) inv.data[i * n + j] *= d[i] * d[j];
  return { inv: symmetrize(inv), fallback: true, rankDeficient, nullLoading };
}
