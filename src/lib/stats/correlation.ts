// Correlations (SPSS CORRELATIONS, NONPAR CORR, PARTIAL CORR): Pearson, Spearman, Kendall's tau-b,
// and partial correlations. Frequency weights are treated as replication counts.

import { normalSf, tCdf, tSf, twoSidedP } from './distributions';
import { ordinalMeasures } from './crosstabs';
import { pearsonWeighted, rankWithTies, weightsOrOnes, type Num } from './util';

export interface CorrResult {
  r: number;
  N: number;
  /** two-tailed p */
  p2: number;
  /** one-tailed p in the direction of r */
  p1: number;
  df?: number;
}

function tTest(r: number, N: number): CorrResult {
  const df = N - 2;
  if (!(df > 0) || Number.isNaN(r)) return { r, N, p2: NaN, p1: NaN, df };
  if (Math.abs(r) >= 1) return { r, N, p2: 0, p1: 0, df };
  const t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
  return { r, N, p2: twoSidedP('t', t, df), p1: t >= 0 ? tSf(t, df) : tCdf(t, df), df };
}

export function pearson(x: Num, y: Num, w?: Num): CorrResult & { sxy: number; sxx: number; syy: number } {
  const pr = pearsonWeighted(x, y, w);
  return { ...tTest(pr.r, pr.W), sxy: pr.sxy, sxx: pr.sxx, syy: pr.syy };
}

export function spearman(x: Num, y: Num, w?: Num): CorrResult {
  const rx = rankWithTies(x, w).ranks;
  const ry = rankWithTies(y, w).ranks;
  const pr = pearsonWeighted(rx, ry, w);
  return tTest(pr.r, pr.W);
}

/** Map values to category indices (sorted distinct values). */
function codes(x: Num): { idx: Int32Array; k: number } {
  const vals = Array.from(new Set(Array.from(x))).sort((a, b) => a - b);
  const map = new Map<number, number>();
  vals.forEach((v, i) => map.set(v, i));
  const idx = new Int32Array(x.length);
  for (let i = 0; i < x.length; i++) idx[i] = map.get(x[i])!;
  return { idx, k: vals.length };
}

/**
 * Kendall's tau-b with significance from T = tau-b / ASE0 (Brown & Benedetti 1977), the same
 * statistic SPSS reports in CROSSTABS.
 */
export function kendallTauB(x: Num, y: Num, w?: Num): CorrResult & { ase: number } {
  const ww = weightsOrOnes(w, x.length);
  const cx = codes(x);
  const cy = codes(y);
  let N = 0;
  for (let i = 0; i < x.length; i++) N += ww[i];
  if (cx.k < 2 || cy.k < 2) return { r: NaN, N, p2: NaN, p1: NaN, ase: NaN };
  if (cx.k * cy.k <= 4_000_000) {
    const t: number[][] = Array.from({ length: cx.k }, () => new Array(cy.k).fill(0));
    for (let i = 0; i < x.length; i++) t[cx.idx[i]][cy.idx[i]] += ww[i];
    const om = ordinalMeasures(t);
    const tt = om.tauB.t ?? NaN;
    return { r: om.tauB.value, N, p2: om.tauB.p ?? NaN, p1: Number.isFinite(tt) ? normalSf(Math.abs(tt)) : NaN, ase: om.tauB.ase ?? NaN };
  }
  // Large continuous data: pairwise computation of the same quantities.
  const n = x.length;
  const C = new Float64Array(n);
  const D = new Float64Array(n);
  let P = 0;
  let Q = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const s = Math.sign(x[i] - x[j]) * Math.sign(y[i] - y[j]);
      if (s > 0) C[i] += ww[j];
      else if (s < 0) D[i] += ww[j];
    }
  for (let i = 0; i < n; i++) {
    P += ww[i] * C[i];
    Q += ww[i] * D[i];
  }
  const rowTot = new Float64Array(cx.k);
  const colTot = new Float64Array(cy.k);
  for (let i = 0; i < n; i++) {
    rowTot[cx.idx[i]] += ww[i];
    colTot[cy.idx[i]] += ww[i];
  }
  let Dr = N * N;
  let Dc = N * N;
  for (const v of rowTot) Dr -= v * v;
  for (const v of colTot) Dc -= v * v;
  const tau = (P - Q) / Math.sqrt(Dr * Dc);
  let s0 = 0;
  let s1 = 0;
  for (let i = 0; i < n; i++) {
    const cd = C[i] - D[i];
    s0 += ww[i] * cd * cd;
    const v = rowTot[cx.idx[i]] * Dc + colTot[cy.idx[i]] * Dr;
    s1 += ww[i] * Math.pow(2 * Math.sqrt(Dr * Dc) * cd + tau * v, 2);
  }
  const ase0 = (2 / Math.sqrt(Dr * Dc)) * Math.sqrt(Math.max(0, s0 - ((P - Q) * (P - Q)) / N));
  const ase1 = Math.sqrt(Math.max(0, s1 - N * N * N * tau * tau * (Dr + Dc) * (Dr + Dc))) / (Dr * Dc);
  const T = tau / ase0;
  return { r: tau, N, p2: 2 * normalSf(Math.abs(T)), p1: normalSf(Math.abs(T)), ase: ase1 };
}

// ---------------------------------------------------------------------------------------------
// Partial correlation
// ---------------------------------------------------------------------------------------------

/** Inverse of a small symmetric positive-definite matrix (Gauss-Jordan with partial pivoting). */
export function invert(a: number[][]): number[][] {
  const n = a.length;
  const m = a.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[piv][c])) piv = r;
    if (Math.abs(m[piv][c]) < 1e-13) throw new Error('The correlation matrix is singular (a control variable is a linear combination of the others, or has no variance)');
    [m[c], m[piv]] = [m[piv], m[c]];
    const d = m[c][c];
    for (let j = 0; j < 2 * n; j++) m[c][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c];
      if (f !== 0) for (let j = 0; j < 2 * n; j++) m[r][j] -= f * m[c][j];
    }
  }
  return m.map((row) => row.slice(n));
}

export interface PartialResult {
  /** matrix of partial correlations among the analysis variables */
  r: number[][];
  p2: number[][];
  p1: number[][];
  df: number;
  N: number;
}

/**
 * Partial correlations of `vars` controlling for `controls`, from listwise-complete columns.
 * df = N - 2 - (number of controls).
 */
export function partialCorrelations(vars: Num[], controls: Num[], w?: Num): PartialResult {
  const all = [...vars, ...controls];
  const p = all.length;
  const R: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  let N = 0;
  for (let i = 0; i < p; i++) {
    R[i][i] = 1;
    for (let j = i + 1; j < p; j++) {
      const pr = pearsonWeighted(all[i], all[j], w);
      R[i][j] = R[j][i] = pr.r;
      N = pr.W;
    }
  }
  if (p === 1) N = weightsOrOnes(w, vars[0].length).length;
  const q = controls.length;
  const k = vars.length;
  // Partial covariance of vars given controls: R_vv - R_vc R_cc^-1 R_cv
  const idxV = Array.from({ length: k }, (_, i) => i);
  const idxC = Array.from({ length: q }, (_, i) => k + i);
  let S: number[][];
  if (q === 0) S = idxV.map((i) => idxV.map((j) => R[i][j]));
  else {
    const Rcc = invert(idxC.map((i) => idxC.map((j) => R[i][j])));
    S = idxV.map((i) =>
      idxV.map((j) => {
        let s = R[i][j];
        for (let a = 0; a < q; a++) for (let b = 0; b < q; b++) s -= R[i][idxC[a]] * Rcc[a][b] * R[idxC[b]][j];
        return s;
      }),
    );
  }
  const df = N - 2 - q;
  const r = S.map((row, i) => row.map((v, j) => (i === j ? 1 : Math.max(-1, Math.min(1, v / Math.sqrt(S[i][i] * S[j][j]))))));
  const p2 = r.map((row, i) =>
    row.map((v, j) => {
      if (i === j) return NaN;
      if (Math.abs(v) >= 1) return 0;
      const t = (v * Math.sqrt(df)) / Math.sqrt(1 - v * v);
      return twoSidedP('t', t, df);
    }),
  );
  const p1 = r.map((row, i) =>
    row.map((v, j) => {
      if (i === j) return NaN;
      if (Math.abs(v) >= 1) return 0;
      const t = (v * Math.sqrt(df)) / Math.sqrt(1 - v * v);
      return t >= 0 ? tSf(t, df) : tCdf(t, df);
    }),
  );
  return { r, p2, p1, df, N };
}
