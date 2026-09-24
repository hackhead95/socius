// Contingency-table statistics (SPSS CROSSTABS): chi-square family, exact tests, nominal and
// ordinal measures of association with asymptotic standard errors (SPSS CROSSTABS algorithms),
// risk estimates, McNemar/Bowker, and Cochran-Mantel-Haenszel statistics for layered 2x2 tables.

import { binomialCdf, chi2Sf, hypergeomLogPmf, lnGamma, normalPpf, normalSf, twoSidedP } from './distributions';
import { seededRandom } from './util';

const lnChoose = (n: number, k: number): number => lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);

export type Table = number[][];

export interface Margins {
  rows: number[];
  cols: number[];
  N: number;
}

export function margins(t: Table): Margins {
  const r = t.length;
  const c = r ? t[0].length : 0;
  const rows = new Array(r).fill(0);
  const cols = new Array(c).fill(0);
  let N = 0;
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++) {
      rows[i] += t[i][j];
      cols[j] += t[i][j];
      N += t[i][j];
    }
  return { rows, cols, N };
}

/** Drop rows and columns whose total is zero (SPSS computes statistics on populated rows/cols). */
export function populated(t: Table): { table: Table; rowIdx: number[]; colIdx: number[] } {
  const m = margins(t);
  const rowIdx = m.rows.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0);
  const colIdx = m.cols.map((v, j) => (v > 0 ? j : -1)).filter((j) => j >= 0);
  return { table: rowIdx.map((i) => colIdx.map((j) => t[i][j])), rowIdx, colIdx };
}

export function expected(t: Table): Table {
  const m = margins(t);
  return t.map((row, i) => row.map((_, j) => (m.rows[i] * m.cols[j]) / m.N));
}

export interface CellStats {
  expected: Table;
  residual: Table;
  standardized: Table;
  adjusted: Table;
}

export function cellStats(t: Table): CellStats {
  const m = margins(t);
  const e = expected(t);
  const residual = t.map((row, i) => row.map((o, j) => o - e[i][j]));
  const standardized = t.map((row, i) => row.map((o, j) => (e[i][j] > 0 ? (o - e[i][j]) / Math.sqrt(e[i][j]) : NaN)));
  const adjusted = t.map((row, i) =>
    row.map((o, j) => {
      const v = e[i][j] * (1 - m.rows[i] / m.N) * (1 - m.cols[j] / m.N);
      return v > 0 ? (o - e[i][j]) / Math.sqrt(v) : NaN;
    }),
  );
  return { expected: e, residual, standardized, adjusted };
}

// ---------------------------------------------------------------------------------------------
// Chi-square tests
// ---------------------------------------------------------------------------------------------

export interface ChiSquareTests {
  N: number;
  df: number;
  pearson: { value: number; p: number };
  likelihoodRatio: { value: number; p: number };
  /** Yates continuity correction, 2x2 only. */
  continuity?: { value: number; p: number };
  /** Linear-by-linear association (Mantel-Haenszel), when scores are available. */
  linearByLinear?: { value: number; p: number; df: 1 };
  fisher?: FisherResult;
  /** Cells with expected count below 5 and the minimum expected count. */
  cellsBelow5: number;
  cellsTotal: number;
  minExpected: number;
}

export interface FisherResult {
  /** Two-sided exact p (sum of tables no more probable than the observed one). */
  p2: number;
  /** One-sided exact p in the direction of the observed association (2x2 only). */
  p1?: number;
  /** Point probability of the observed table. */
  pointProb?: number;
  method: 'exact' | 'monte-carlo';
  /** Monte Carlo: samples and 99% confidence interval of p. */
  samples?: number;
  ci99?: [number, number];
}

export function chiSquareTests(tIn: Table, rowScores?: number[] | null, colScores?: number[] | null, opts: { exact?: boolean; exactLimitSeconds?: number } = {}): ChiSquareTests {
  const { table: t, rowIdx, colIdx } = populated(tIn);
  const m = margins(t);
  const r = t.length;
  const c = r ? t[0].length : 0;
  const df = (r - 1) * (c - 1);
  const e = expected(t);
  let X2 = 0;
  let G2 = 0;
  let below5 = 0;
  let minE = Infinity;
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++) {
      const o = t[i][j];
      const ex = e[i][j];
      X2 += ((o - ex) * (o - ex)) / ex;
      if (o > 0) G2 += 2 * o * Math.log(o / ex);
      if (ex < 5) below5++;
      if (ex < minE) minE = ex;
    }
  // Empty rows/columns in the full table still count as cells in SPSS's footnote.
  const fullR = tIn.length;
  const fullC = fullR ? tIn[0].length : 0;
  const zeroCells = fullR * fullC - r * c;
  const out: ChiSquareTests = {
    N: m.N,
    df,
    pearson: { value: X2, p: df > 0 ? chi2Sf(X2, df) : NaN },
    likelihoodRatio: { value: G2, p: df > 0 ? chi2Sf(G2, df) : NaN },
    cellsBelow5: below5 + zeroCells,
    cellsTotal: fullR * fullC,
    minExpected: zeroCells > 0 ? 0 : minE,
  };
  if (df <= 0) return out;
  if (r === 2 && c === 2) {
    const [a, b] = t[0];
    const [cc, d] = t[1];
    const diff = Math.abs(a * d - b * cc) - 0.5 * m.N;
    const yates = diff > 0 ? (m.N * diff * diff) / (m.rows[0] * m.rows[1] * m.cols[0] * m.cols[1]) : 0;
    out.continuity = { value: yates, p: chi2Sf(yates, 1) };
  }
  if (rowScores && colScores) {
    const rs = rowIdx.map((i) => rowScores[i]);
    const cs = colIdx.map((j) => colScores[j]);
    const rr = pearsonFromTable(t, rs, cs).r;
    const M2 = (m.N - 1) * rr * rr;
    out.linearByLinear = { value: M2, p: chi2Sf(M2, 1), df: 1 };
  }
  const integer = t.every((row) => row.every((v) => Math.abs(v - Math.round(v)) < 1e-9));
  if (integer && (r === 2 && c === 2 ? true : opts.exact)) {
    const ti = t.map((row) => row.map((v) => Math.round(v)));
    out.fisher = r === 2 && c === 2 ? fisher2x2(ti) : fisherRxC(ti);
  }
  return out;
}

/** Fisher's exact test for a 2x2 table (two-sided by probability ordering, like SPSS and scipy). */
export function fisher2x2(t: Table): FisherResult {
  const a = t[0][0];
  const r1 = t[0][0] + t[0][1];
  const c1 = t[0][0] + t[1][0];
  const N = r1 + t[1][0] + t[1][1];
  const lo = Math.max(0, r1 + c1 - N);
  const hi = Math.min(r1, c1);
  const lp = (k: number) => hypergeomLogPmf(k, N, c1, r1);
  const lpObs = lp(a);
  const probs: number[] = [];
  for (let k = lo; k <= hi; k++) probs.push(Math.exp(lp(k)));
  const pObs = Math.exp(lpObs);
  const relTol = 1 + 1e-7;
  let p2 = 0;
  for (let k = lo; k <= hi; k++) if (probs[k - lo] <= pObs * relTol) p2 += probs[k - lo];
  // One-sided in the direction of the observed deviation from expectation.
  const expA = (r1 * c1) / N;
  let p1 = 0;
  if (a >= expA) for (let k = a; k <= hi; k++) p1 += probs[k - lo];
  else for (let k = lo; k <= a; k++) p1 += probs[k - lo];
  return { p2: Math.min(1, p2), p1: Math.min(1, p1), pointProb: pObs, method: 'exact' };
}

/** log of the probability of an r x c table given its margins (multivariate hypergeometric). */
function logTableProb(t: number[][], rows: number[], cols: number[], N: number): number {
  let s = -lnGamma(N + 1);
  for (const r of rows) s += lnGamma(r + 1);
  for (const c of cols) s += lnGamma(c + 1);
  for (const row of t) for (const v of row) s -= lnGamma(v + 1);
  return s;
}

/**
 * Fisher-Freeman-Halton exact test for r x c tables. Enumerates all tables with the observed
 * margins (column by column) when that is cheap enough; otherwise estimates the p-value from
 * 10,000 Monte Carlo tables (fixed seed 2000000, as SPSS's default) and reports a 99% CI.
 */
export function fisherRxC(t: number[][], maxNodes = 2_000_000, budgetMs = 400): FisherResult {
  const r = t.length;
  const c = t[0].length;
  const { rows, cols, N } = margins(t);
  // Skip enumeration that cannot finish: an upper bound on the number of tables (compositions of each
  // column total into r parts, ignoring row totals) far beyond the node limit means Monte Carlo anyway,
  // and trying first would only waste the time budget (e.g. 10 x 2 tables with thousands of cases).
  let logBound = 0;
  for (let j = 0; j < c - 1; j++) logBound += lnChoose(cols[j] + r - 1, r - 1);
  if (logBound > Math.log(maxNodes) + Math.log(1e4)) return fisherMonteCarlo(t, 10000, 2000000);
  const deadline = performance.now() + budgetMs;
  const lpObs = logTableProb(t, rows, cols, N);
  const tol = 1e-7;
  // log factorials table
  const lf = new Float64Array(N + 2);
  for (let i = 2; i <= N + 1; i++) lf[i] = lf[i - 1] + Math.log(i);
  const base = -lf[N] + rows.reduce((s, v) => s + lf[v], 0) + cols.reduce((s, v) => s + lf[v], 0);
  let nodes = 0;
  let pSum = 0;
  let aborted = false;
  const remaining = rows.slice();
  // Enumerate column j: distribute cols[j] among rows respecting remaining row totals.
  const colCell = new Array(r).fill(0);
  const recurseCol = (j: number, acc: number) => {
    if (aborted) return;
    if (j === c - 1) {
      // last column is determined by the remaining row totals
      let a = acc;
      for (let i = 0; i < r; i++) a -= lf[remaining[i]];
      const lp = base + a;
      if (lp <= lpObs + tol * Math.abs(lpObs) + 1e-12) pSum += Math.exp(lp);
      return;
    }
    const fill = (i: number, left: number, acc2: number) => {
      if (aborted) return;
      if (++nodes > maxNodes || ((nodes & 0xffff) === 0 && performance.now() > deadline)) {
        aborted = true;
        return;
      }
      if (i === r - 1) {
        if (left > remaining[i]) return;
        // capacity check for later columns is implicit: remaining totals stay >= 0
        colCell[i] = left;
        remaining[i] -= left;
        recurseCol(j + 1, acc2 - lf[left]);
        remaining[i] += left;
        return;
      }
      // rows below must be able to absorb what is left
      let capBelow = 0;
      for (let k = i + 1; k < r; k++) capBelow += remaining[k];
      const minHere = Math.max(0, left - capBelow);
      const maxHere = Math.min(left, remaining[i]);
      for (let v = minHere; v <= maxHere; v++) {
        colCell[i] = v;
        remaining[i] -= v;
        fill(i + 1, left - v, acc2 - lf[v]);
        remaining[i] += v;
      }
    };
    fill(0, cols[j], acc);
  };
  recurseCol(0, 0);
  if (!aborted) return { p2: Math.min(1, pSum), method: 'exact', pointProb: Math.exp(lpObs) };
  return fisherMonteCarlo(t, 10000, 2000000);
}

/**
 * One draw from the hypergeometric distribution: successes in `n` draws from `N` items of which `K`
 * are successes. Inversion by "chop-down" search from the mode, so the cost is about one standard
 * deviation of steps whatever N is. `lf` holds log factorials up to N.
 */
function rhyper(n: number, K: number, N: number, lf: Float64Array, rand: () => number): number {
  const lo = Math.max(0, n - (N - K));
  const hi = Math.min(n, K);
  if (lo >= hi) return lo;
  const mode = Math.min(hi, Math.max(lo, Math.floor(((n + 1) * (K + 1)) / (N + 2))));
  const lpm = lf[K] - lf[mode] - lf[K - mode] + lf[N - K] - lf[n - mode] - lf[N - K - n + mode] - (lf[N] - lf[n] - lf[N - n]);
  const pm = Math.exp(lpm);
  let u = rand() - pm;
  if (u <= 0) return mode;
  let up = mode;
  let dn = mode;
  let pu = pm;
  let pd = pm;
  for (;;) {
    if (up < hi) {
      pu *= ((K - up) * (n - up)) / ((up + 1) * (N - K - n + up + 1));
      up++;
      u -= pu;
      if (u <= 0) return up;
    }
    if (dn > lo) {
      pd *= (dn * (N - K - n + dn)) / ((K - dn + 1) * (n - dn + 1));
      dn--;
      u -= pd;
      if (u <= 0) return dn;
    }
    if (up >= hi && dn <= lo) return mode; // rounding left a sliver of probability
  }
}

/**
 * Monte Carlo estimate of the Fisher-Freeman-Halton p-value: random tables with the observed margins,
 * drawn column by column as sequential hypergeometric draws (Patefield 1981), so each table costs
 * O(r x c) draws instead of a shuffle of all N cases.
 */
export function fisherMonteCarlo(t: number[][], samples: number, seed: number): FisherResult {
  const r = t.length;
  const c = t[0].length;
  const { rows, cols, N } = margins(t);
  const lpObs = logTableProb(t, rows, cols, N);
  const rand = seededRandom(seed);
  const lf = new Float64Array(N + 2);
  for (let i = 2; i <= N + 1; i++) lf[i] = lf[i - 1] + Math.log(i);
  const base = -lf[N] + rows.reduce((s, v) => s + lf[v], 0) + cols.reduce((s, v) => s + lf[v], 0);
  const rem = new Int32Array(r);
  let hits = 0;
  for (let s = 0; s < samples; s++) {
    for (let i = 0; i < r; i++) rem[i] = rows[i];
    let lp = base;
    let totalLeft = N;
    for (let j = 0; j < c - 1; j++) {
      let left = cols[j];
      let pool = totalLeft; // sum of rem[i..r-1]
      for (let i = 0; i < r - 1 && left > 0; i++) {
        const x = rhyper(left, rem[i], pool, lf, rand);
        pool -= rem[i];
        rem[i] -= x;
        left -= x;
        lp -= lf[x];
      }
      if (left > 0) {
        rem[r - 1] -= left;
        lp -= lf[left];
      }
      totalLeft -= cols[j];
    }
    for (let i = 0; i < r; i++) lp -= lf[rem[i]]; // last column
    if (lp <= lpObs + 1e-7 * Math.abs(lpObs) + 1e-12) hits++;
  }
  const p = hits / samples;
  const z = normalPpf(0.995);
  const se = Math.sqrt((p * (1 - p)) / samples);
  return { p2: p, method: 'monte-carlo', samples, ci99: [Math.max(0, p - z * se), Math.min(1, p + z * se)] };
}

// ---------------------------------------------------------------------------------------------
// Measures of association
// ---------------------------------------------------------------------------------------------

export interface Measure {
  value: number;
  /** Asymptotic standard error (not assuming the null hypothesis). */
  ase?: number;
  /** Approximate T (value / ASE under the null hypothesis). */
  t?: number;
  /** Approximate significance. */
  p?: number;
}

export interface NominalMeasures {
  phi: Measure;
  cramersV: Measure;
  contingency: Measure;
}

export function nominalMeasures(tIn: Table): NominalMeasures {
  const { table: t } = populated(tIn);
  const tests = chiSquareTests(t);
  const m = margins(t);
  const q = Math.min(t.length, t[0]?.length ?? 0);
  const X2 = tests.pearson.value;
  const p = tests.pearson.p;
  let phi = Math.sqrt(X2 / m.N);
  // For 2x2 tables SPSS gives phi the sign of the association (ad - bc).
  if (t.length === 2 && t[0].length === 2 && t[0][0] * t[1][1] - t[0][1] * t[1][0] < 0) phi = -phi;
  return {
    phi: { value: phi, p },
    cramersV: { value: Math.sqrt(X2 / (m.N * (q - 1))), p },
    contingency: { value: Math.sqrt(X2 / (X2 + m.N)), p },
  };
}

export interface DirectionalNominal {
  lambda: { symmetric: Measure; rowDependent: Measure; colDependent: Measure };
  gkTau: { rowDependent: Measure; colDependent: Measure };
}

/** Goodman and Kruskal's lambda and tau (SPSS CROSSTABS /STATISTICS=LAMBDA). */
export function lambdaTau(tIn: Table): DirectionalNominal {
  const { table: t } = populated(tIn);
  const R = t.length;
  const C = t[0].length;
  const { rows, cols, N } = margins(t);
  const fim: number[] = [];
  const fimIdx: number[] = [];
  for (let i = 0; i < R; i++) {
    let mx = t[i][0];
    let ix = 0;
    for (let j = 1; j < C; j++) if (t[i][j] > mx) {
      mx = t[i][j];
      ix = j;
    }
    fim.push(mx);
    fimIdx.push(ix);
  }
  const fmj: number[] = [];
  const fmjIdx: number[] = [];
  for (let j = 0; j < C; j++) {
    let mx = t[0][j];
    let ix = 0;
    for (let i = 1; i < R; i++) if (t[i][j] > mx) {
      mx = t[i][j];
      ix = i;
    }
    fmj.push(mx);
    fmjIdx.push(ix);
  }
  const sumFim = fim.reduce((a, b) => a + b, 0);
  const sumFmj = fmj.reduce((a, b) => a + b, 0);
  let rm = rows[0];
  let rmIdx = 0;
  for (let i = 1; i < R; i++) if (rows[i] > rm) {
    rm = rows[i];
    rmIdx = i;
  }
  let cm = cols[0];
  let cmIdx = 0;
  for (let j = 1; j < C; j++) if (cols[j] > cm) {
    cm = cols[j];
    cmIdx = j;
  }
  const sym = (sumFim + sumFmj - cm - rm) / (2 * N - rm - cm);
  const lr = (sumFmj - rm) / (N - rm); // row dependent
  const lc = (sumFim - cm) / (N - cm); // column dependent
  // column dependent
  let acc = 0;
  for (let i = 0; i < R; i++) if (cmIdx === fimIdx[i]) acc += fim[i];
  const aseC = Math.sqrt(((N - sumFim) * (sumFim + cm - 2 * acc)) / Math.pow(N - cm, 3));
  acc = 0;
  for (let i = 0; i < R; i++) if (cmIdx !== fimIdx[i]) acc += t[i][fimIdx[i]] + t[i][cmIdx];
  const tC = lc / (Math.sqrt(acc - Math.pow(sumFim - cm, 2) / N) / (N - cm));
  // row dependent
  acc = 0;
  for (let j = 0; j < C; j++) if (rmIdx === fmjIdx[j]) acc += fmj[j];
  const aseR = Math.sqrt(((N - sumFmj) * (sumFmj + rm - 2 * acc)) / Math.pow(N - rm, 3));
  acc = 0;
  for (let j = 0; j < C; j++) if (rmIdx !== fmjIdx[j]) acc += t[fmjIdx[j]][j] + t[rmIdx][j];
  const tR = lr / (Math.sqrt(acc - Math.pow(sumFmj - rm, 2) / N) / (N - rm));
  // symmetric
  let acc0 = 0;
  let acc1 = 0;
  for (let i = 0; i < R; i++)
    for (let j = 0; j < C; j++) {
      const t0 = (fmjIdx[j] === i ? 1 : 0) + (fimIdx[i] === j ? 1 : 0);
      const t1 = (i === rmIdx ? 1 : 0) + (j === cmIdx ? 1 : 0);
      acc0 += t[i][j] * (t0 - t1) * (t0 - t1);
      acc1 += t[i][j] * Math.pow(t0 + (sym - 1) * t1, 2);
    }
  const aseS = Math.sqrt(acc1 - 4 * N * sym * sym) / (2 * N - rm - cm);
  const tS = sym / (Math.sqrt(acc0 - Math.pow(sumFim + sumFmj - cm - rm, 2) / N) / (2 * N - rm - cm));
  const lam = (value: number, ase: number, tt: number): Measure => ({
    value,
    ase,
    t: Number.isFinite(tt) ? tt : NaN,
    p: Number.isFinite(tt) ? 2 * normalSf(Math.abs(tt)) : NaN,
  });
  // Goodman and Kruskal tau, ASE by the delta method; significance from the Light-Margolin
  // chi-square (N - 1)(J - 1) tau with (I - 1)(J - 1) df, J = categories of the dependent variable.
  const gk = (dependentIsCol: boolean): Measure => {
    const P = t.map((row) => row.map((v) => v / N));
    const pr = rows.map((v) => v / N);
    const pc = cols.map((v) => v / N);
    // tau(col | row): (sum p_ij^2 / p_i+ - sum p_+j^2) / (1 - sum p_+j^2)
    const I = dependentIsCol ? R : C;
    const J = dependentIsCol ? C : R;
    const cell = (a: number, b: number) => (dependentIsCol ? P[a][b] : P[b][a]);
    const pa = dependentIsCol ? pr : pc; // predictor margins
    const pb = dependentIsCol ? pc : pr; // dependent margins
    let U = 0;
    for (let a = 0; a < I; a++) for (let b = 0; b < J; b++) U += (cell(a, b) * cell(a, b)) / pa[a];
    let sb2 = 0;
    for (let b = 0; b < J; b++) sb2 += pb[b] * pb[b];
    U -= sb2;
    const V = 1 - sb2;
    const value = U / V;
    // gradient
    const rowSq = new Array(I).fill(0);
    for (let a = 0; a < I; a++) for (let b = 0; b < J; b++) rowSq[a] += cell(a, b) * cell(a, b);
    let mean = 0;
    let meanSq = 0;
    for (let a = 0; a < I; a++)
      for (let b = 0; b < J; b++) {
        const dU = (2 * cell(a, b)) / pa[a] - rowSq[a] / (pa[a] * pa[a]) - 2 * pb[b];
        const dV = -2 * pb[b];
        const g = (dU * V - U * dV) / (V * V);
        mean += cell(a, b) * g;
        meanSq += cell(a, b) * g * g;
      }
    const ase = Math.sqrt(Math.max(0, meanSq - mean * mean) / N);
    const stat = (N - 1) * (J - 1) * value;
    const df = (I - 1) * (J - 1);
    return { value, ase, p: chi2Sf(stat, df) };
  };
  return {
    lambda: { symmetric: lam(sym, aseS, tS), rowDependent: lam(lr, aseR, tR), colDependent: lam(lc, aseC, tC) },
    gkTau: { rowDependent: gk(false), colDependent: gk(true) },
  };
}

export interface OrdinalMeasures {
  gamma: Measure;
  tauB: Measure;
  tauC: Measure;
  somersD: { symmetric: Measure; rowDependent: Measure; colDependent: Measure };
  /** Concordant and discordant counts (each ordered pair counted twice, SPSS convention). */
  P: number;
  Q: number;
}

/** Concordant (C) and discordant (D) totals for each cell. */
function concordance(t: Table): { C: number[][]; D: number[][]; P: number; Q: number } {
  const R = t.length;
  const K = t[0].length;
  // 2-D prefix sums for O(RK) evaluation
  const S = Array.from({ length: R + 1 }, () => new Array(K + 1).fill(0));
  for (let i = 0; i < R; i++) for (let j = 0; j < K; j++) S[i + 1][j + 1] = t[i][j] + S[i][j + 1] + S[i + 1][j] - S[i][j];
  const rect = (i0: number, i1: number, j0: number, j1: number) => (i1 < i0 || j1 < j0 ? 0 : S[i1 + 1][j1 + 1] - S[i0][j1 + 1] - S[i1 + 1][j0] + S[i0][j0]);
  const C: number[][] = [];
  const D: number[][] = [];
  let P = 0;
  let Q = 0;
  for (let i = 0; i < R; i++) {
    C.push([]);
    D.push([]);
    for (let j = 0; j < K; j++) {
      const cij = rect(0, i - 1, 0, j - 1) + rect(i + 1, R - 1, j + 1, K - 1);
      const dij = rect(0, i - 1, j + 1, K - 1) + rect(i + 1, R - 1, 0, j - 1);
      C[i].push(cij);
      D[i].push(dij);
      P += t[i][j] * cij;
      Q += t[i][j] * dij;
    }
  }
  return { C, D, P, Q };
}

/** Gamma, Kendall's tau-b and tau-c, Somers' d with ASE1 and T based on ASE0 (SPSS algorithms). */
export function ordinalMeasures(tIn: Table): OrdinalMeasures {
  const { table: t } = populated(tIn);
  const R = t.length;
  const K = t[0].length;
  const { rows, cols, N } = margins(t);
  const { C, D, P, Q } = concordance(t);
  let Dr = N * N;
  let Dc = N * N;
  for (const r of rows) Dr -= r * r;
  for (const c of cols) Dc -= c * c;
  const q = Math.min(R, K);
  const PQ = P - Q;
  const tauB = PQ / Math.sqrt(Dr * Dc);
  let sumCD2 = 0;
  let gammaCum = 0;
  let btauCum = 0;
  let dyxCum = 0;
  let dxyCum = 0;
  let dsymCum = 0;
  for (let i = 0; i < R; i++)
    for (let j = 0; j < K; j++) {
      const f = t[i][j];
      const cd = C[i][j] - D[i][j];
      sumCD2 += f * cd * cd;
      gammaCum += f * Math.pow(Q * C[i][j] - P * D[i][j], 2);
      btauCum += f * Math.pow(2 * Math.sqrt(Dr * Dc) * cd + tauB * (rows[i] * Dc + cols[j] * Dr), 2);
      dyxCum += f * Math.pow(Dr * cd - PQ * (N - rows[i]), 2);
      dxyCum += f * Math.pow(Dc * cd - PQ * (N - cols[j]), 2);
      dsymCum += f * Math.pow((Dr + Dc) * cd - PQ * (2 * N - rows[i] - cols[j]), 2);
    }
  const base0 = Math.sqrt(Math.max(0, sumCD2 - (PQ * PQ) / N)); // sqrt(sum n (C-D)^2 - (P-Q)^2/N)
  const mk = (value: number, ase: number, ase0: number): Measure => {
    const tt = value / ase0;
    return { value, ase, t: tt, p: Number.isFinite(tt) ? 2 * normalSf(Math.abs(tt)) : NaN };
  };
  const gamma = PQ / (P + Q);
  const btauVar = (btauCum - N * N * N * tauB * tauB * (Dr + Dc) * (Dr + Dc)) / Math.pow(Dr * Dc, 2);
  const tauC = (q * PQ) / (N * N * (q - 1));
  const aseTauC = ((2 * q) / ((q - 1) * N * N)) * base0;
  return {
    gamma: mk(gamma, (4 / ((P + Q) * (P + Q))) * Math.sqrt(gammaCum), (2 / (P + Q)) * base0),
    tauB: mk(tauB, Math.sqrt(Math.max(0, btauVar)), (2 / Math.sqrt(Dr * Dc)) * base0),
    tauC: mk(tauC, aseTauC, aseTauC),
    somersD: {
      symmetric: mk(PQ / (0.5 * (Dr + Dc)), (4 / Math.pow(Dr + Dc, 2)) * Math.sqrt(dsymCum), (4 / (Dr + Dc)) * base0),
      rowDependent: mk(PQ / Dc, (2 / (Dc * Dc)) * Math.sqrt(dxyCum), (2 / Dc) * base0),
      colDependent: mk(PQ / Dr, (2 / (Dr * Dr)) * Math.sqrt(dyxCum), (2 / Dr) * base0),
    },
    P,
    Q,
  };
}

/** Pearson r on a table with the given scores, with SPSS's ASE1 and t-based significance. */
export function pearsonFromTable(t: Table, X: number[], Y: number[]): Measure & { r: number } {
  const { rows, cols, N } = margins(t);
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < X.length; i++) sx += X[i] * rows[i];
  for (let j = 0; j < Y.length; j++) sy += Y[j] * cols[j];
  const xbar = sx / N;
  const ybar = sy / N;
  let SX = 0;
  let SY = 0;
  let S = 0;
  for (let i = 0; i < X.length; i++) SX += rows[i] * (X[i] - xbar) * (X[i] - xbar);
  for (let j = 0; j < Y.length; j++) SY += cols[j] * (Y[j] - ybar) * (Y[j] - ybar);
  for (let i = 0; i < X.length; i++) for (let j = 0; j < Y.length; j++) S += t[i][j] * (X[i] - xbar) * (Y[j] - ybar);
  const T = Math.sqrt(SX * SY);
  const r = S / T;
  let acc = 0;
  for (let i = 0; i < X.length; i++)
    for (let j = 0; j < Y.length; j++) {
      const xr = X[i] - xbar;
      const yr = Y[j] - ybar;
      const tmp = T * xr * yr - (S / (2 * T)) * (xr * xr * SY + yr * yr * SX);
      acc += t[i][j] * tmp * tmp;
    }
  const ase = Math.sqrt(acc) / (T * T);
  const tt = (r / Math.sqrt(1 - r * r)) * Math.sqrt(N - 2);
  return { r, value: r, ase, t: tt, p: twoSidedP('t', tt, N - 2) };
}

/** Spearman correlation on a table (midrank scores from the margins). */
export function spearmanFromTable(t: Table): Measure & { r: number } {
  const { rows, cols } = margins(t);
  const mid = (tot: number[]) => {
    let c = 0;
    return tot.map((v) => {
      const r = c + (v + 1) / 2;
      c += v;
      return r;
    });
  };
  return pearsonFromTable(t, mid(rows), mid(cols));
}

/** Cohen's kappa for square tables (rows and columns with the same categories, in order). */
export function kappa(t: Table): Measure {
  const { rows, cols, N } = margins(t);
  const k = t.length;
  let sumFii = 0;
  let sumRiCi = 0;
  let sumFiiRiCi = 0;
  let sumRiCiRiCi = 0;
  for (let i = 0; i < k; i++) {
    const prod = rows[i] * cols[i];
    const s = rows[i] + cols[i];
    sumFii += t[i][i];
    sumRiCi += prod;
    sumFiiRiCi += t[i][i] * s;
    sumRiCiRiCi += prod * s;
  }
  let sumFijRiCj2 = 0;
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) sumFijRiCj2 += t[i][j] * Math.pow(rows[i] + cols[j], 2);
  const N2 = N * N;
  const value = (N * sumFii - sumRiCi) / (N2 - sumRiCi);
  const ase0 = Math.sqrt((N2 * sumRiCi + sumRiCi * sumRiCi - N * sumRiCiRiCi) / (N * (N2 - sumRiCi) * (N2 - sumRiCi)));
  // ASE1: Fleiss, Cohen & Everitt (1969) large-sample variance (the multinomial delta method).
  const pr = rows.map((v) => v / N);
  const pc = cols.map((v) => v / N);
  const th1 = sumFii / N;
  const th2 = sumRiCi / N2;
  let A = 0;
  let B = 0;
  for (let i = 0; i < k; i++)
    for (let j = 0; j < k; j++) {
      const pij = t[i][j] / N;
      if (i === j) A += pij * Math.pow(1 - th2 - (pr[i] + pc[i]) * (1 - th1), 2);
      else B += pij * Math.pow(pc[i] + pr[j], 2);
    }
  B *= (1 - th1) * (1 - th1);
  const Cc = Math.pow(th1 * th2 - 2 * th2 + th1, 2);
  const ase = Math.sqrt(Math.max(0, A + B - Cc) / (N * Math.pow(1 - th2, 4)));
  const tt = value / ase0;
  return { value, ase, t: tt, p: 2 * normalSf(Math.abs(tt)) };
}

// ---------------------------------------------------------------------------------------------
// Risk estimates, McNemar, CMH
// ---------------------------------------------------------------------------------------------

export interface RiskEstimate {
  oddsRatio: { value: number; lo: number; hi: number };
  /** Relative risk for the first column category, rows 1 vs 2 ("For cohort col = first"). */
  rrFirst: { value: number; lo: number; hi: number };
  rrSecond: { value: number; lo: number; hi: number };
  N: number;
}

export function riskEstimate(t: Table, conf = 0.95): RiskEstimate {
  const [[a, b], [c, d]] = t;
  const z = normalPpf(1 - (1 - conf) / 2);
  const ci = (v: number, se: number) => ({ value: v, lo: v * Math.exp(-z * se), hi: v * Math.exp(z * se) });
  const or = (a * d) / (b * c);
  return {
    oddsRatio: ci(or, Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d)),
    rrFirst: ci((a * (c + d)) / (c * (a + b)), Math.sqrt(b / (a * (a + b)) + d / (c * (c + d)))),
    rrSecond: ci((b * (c + d)) / (d * (a + b)), Math.sqrt(a / (b * (a + b)) + c / (d * (c + d)))),
    N: a + b + c + d,
  };
}

export interface McNemarResult {
  /** 2x2: exact binomial p (SPSS "McNemar Test ... Binomial distribution used"). */
  exactP?: number;
  /** Larger square tables: McNemar-Bowker chi-square. */
  bowker?: { value: number; df: number; p: number };
}

export function mcnemar(t: Table): McNemarResult {
  const k = t.length;
  if (k === 2) {
    const b = Math.round(t[0][1]);
    const c = Math.round(t[1][0]);
    const n = b + c;
    if (n === 0) return { exactP: 1 };
    const p = Math.min(1, 2 * binomialCdf(Math.min(b, c), n, 0.5));
    return { exactP: p };
  }
  let X2 = 0;
  let df = 0;
  for (let i = 0; i < k; i++)
    for (let j = i + 1; j < k; j++) {
      const s = t[i][j] + t[j][i];
      // pairs with no off-diagonal cases add nothing to the statistic but keep their df
      if (s > 0) X2 += Math.pow(t[i][j] - t[j][i], 2) / s;
      df++;
    }
  return { bowker: { value: X2, df, p: df > 0 ? chi2Sf(X2, df) : NaN } };
}

export interface CMHResult {
  /** Mantel-Haenszel common odds ratio with CI (Robins-Breslow-Greenland variance). */
  commonOR: { value: number; lnValue: number; seLn: number; lo: number; hi: number; p: number };
  /** Cochran's and Mantel-Haenszel (continuity-corrected) tests of conditional independence. */
  cochran: { value: number; df: 1; p: number };
  mantelHaenszel: { value: number; df: 1; p: number };
  /** Breslow-Day test of homogeneity of the odds ratio. */
  breslowDay?: { value: number; df: number; p: number };
  tarone?: { value: number; df: number; p: number };
}

/** Cochran-Mantel-Haenszel statistics for K layered 2x2 tables. */
export function cmh(tables: Table[], conf = 0.95): CMHResult {
  const K = tables.filter((t) => margins(t).N > 1);
  let num = 0;
  let den = 0;
  let sumA = 0;
  let sumE = 0;
  let sumV = 0;
  let sumVc = 0;
  let sPR = 0;
  let sPSQR = 0;
  let sQS = 0;
  let sR = 0;
  let sS = 0;
  for (const t of K) {
    const [[a, b], [c, d]] = t;
    const n = a + b + c + d;
    const r1 = a + b;
    const r2 = c + d;
    const c1 = a + c;
    const c2 = b + d;
    const R = (a * d) / n;
    const S = (b * c) / n;
    const P = (a + d) / n;
    const Qq = (b + c) / n;
    num += R;
    den += S;
    sumA += a;
    sumE += (r1 * c1) / n;
    sumV += (r1 * r2 * c1 * c2) / (n * n * (n - 1));
    sumVc += (r1 * r2 * c1 * c2) / (n * n * n);
    sPR += P * R;
    sPSQR += P * S + Qq * R;
    sQS += Qq * S;
    sR += R;
    sS += S;
  }
  const or = num / den;
  const varLn = sPR / (2 * sR * sR) + sPSQR / (2 * sR * sS) + sQS / (2 * sS * sS);
  const se = Math.sqrt(varLn);
  const z = normalPpf(1 - (1 - conf) / 2);
  const ln = Math.log(or);
  const dev = Math.abs(sumA - sumE);
  const cochran = (dev * dev) / sumVc;
  const mhc = Math.max(0, dev - 0.5);
  const mh = (mhc * mhc) / sumV;
  const out: CMHResult = {
    commonOR: { value: or, lnValue: ln, seLn: se, lo: Math.exp(ln - z * se), hi: Math.exp(ln + z * se), p: 2 * normalSf(Math.abs(ln / se)) },
    cochran: { value: cochran, df: 1, p: chi2Sf(cochran, 1) },
    mantelHaenszel: { value: mh, df: 1, p: chi2Sf(mh, 1) },
  };
  if (K.length > 1) {
    // Breslow-Day: expected a under the common OR, from the quadratic in each stratum.
    let bd = 0;
    let sumDiff = 0;
    let sumVar = 0;
    for (const t of K) {
      const [[a, b], [c, d]] = t;
      const r1 = a + b;
      const c1 = a + c;
      const n = a + b + c + d;
      const r2 = n - r1;
      // solve (x (r2 - c1 + x)) / ((r1 - x)(c1 - x)) = or for x in [max(0, c1 - r2), min(r1, c1)]
      const lo = Math.max(0, c1 - r2);
      const hi = Math.min(r1, c1);
      const A = 1 - or;
      const B = r2 - c1 + or * (r1 + c1);
      const Cc = -or * r1 * c1;
      let x: number;
      if (Math.abs(A) < 1e-12) x = -Cc / B;
      else {
        const disc = Math.sqrt(B * B - 4 * A * Cc);
        const x1 = (-B + disc) / (2 * A);
        const x2 = (-B - disc) / (2 * A);
        x = x1 >= lo - 1e-9 && x1 <= hi + 1e-9 ? x1 : x2;
      }
      const vx = 1 / (1 / x + 1 / (r1 - x) + 1 / (c1 - x) + 1 / (r2 - c1 + x));
      bd += ((a - x) * (a - x)) / vx;
      sumDiff += a - x;
      sumVar += vx;
    }
    const df = K.length - 1;
    out.breslowDay = { value: bd, df, p: chi2Sf(bd, df) };
    const tarone = bd - (sumDiff * sumDiff) / sumVar;
    out.tarone = { value: tarone, df, p: chi2Sf(tarone, df) };
  }
  return out;
}
