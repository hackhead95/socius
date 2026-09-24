// Nonparametric tests (SPSS NPAR TESTS): chi-square goodness of fit, binomial test, Mann-Whitney U,
// Wilcoxon signed-rank, Kruskal-Wallis H (with Dunn's pairwise comparisons) and Friedman with
// Kendall's W. Frequency weights are treated as replication counts.

import { binomialCdf, binomialLogPmf, binomialSfInclusive, chi2Sf, normalCdf, normalSf } from './distributions';
import { rankWithTies, weightsOrOnes, type Num } from './util';

// ---------------------------------------------------------------------------------------------
// Chi-square goodness of fit
// ---------------------------------------------------------------------------------------------

export interface GofResult {
  observed: number[];
  expected: number[];
  residual: number[];
  chiSquare: number;
  df: number;
  p: number;
  N: number;
  cellsBelow5: number;
  minExpected: number;
}

/** `proportions` are relative (they need not sum to 1); equal when omitted. */
export function chiSquareGof(observed: number[], proportions?: number[]): GofResult {
  const k = observed.length;
  const N = observed.reduce((a, b) => a + b, 0);
  const props = proportions ?? new Array(k).fill(1);
  if (props.length !== k) throw new Error(`Expected ${k} expected values (one per category), got ${props.length}`);
  if (props.some((p) => !(p > 0))) throw new Error('Expected values must all be positive');
  const ps = props.reduce((a, b) => a + b, 0);
  const expected = props.map((p) => (N * p) / ps);
  let X2 = 0;
  let below5 = 0;
  let minE = Infinity;
  for (let i = 0; i < k; i++) {
    X2 += ((observed[i] - expected[i]) * (observed[i] - expected[i])) / expected[i];
    if (expected[i] < 5) below5++;
    minE = Math.min(minE, expected[i]);
  }
  return {
    observed,
    expected,
    residual: observed.map((o, i) => o - expected[i]),
    chiSquare: X2,
    df: k - 1,
    p: k > 1 ? chi2Sf(X2, k - 1) : NaN,
    N,
    cellsBelow5: below5,
    minExpected: minE,
  };
}

// ---------------------------------------------------------------------------------------------
// Binomial test
// ---------------------------------------------------------------------------------------------

export interface BinomialResult {
  n1: number;
  n2: number;
  N: number;
  observedProp: number;
  testProp: number;
  /** Exact significance: two-tailed when testProp = .5, else one-tailed (SPSS convention). */
  p: number;
  tails: 1 | 2;
}

export function binomialTest(n1: number, n2: number, testProp = 0.5): BinomialResult {
  const k = Math.round(n1);
  const N = Math.round(n1 + n2);
  let p: number;
  let tails: 1 | 2;
  if (Math.abs(testProp - 0.5) < 1e-12) {
    tails = 2;
    const lo = Math.min(k, N - k);
    p = Math.min(1, 2 * binomialCdf(lo, N, 0.5));
    if (2 * k === N) p = 1;
  } else {
    tails = 1;
    p = k / N > testProp ? binomialSfInclusive(k, N, testProp) : binomialCdf(k, N, testProp);
  }
  return { n1, n2, N: n1 + n2, observedProp: n1 / (n1 + n2), testProp, p, tails };
}

// ---------------------------------------------------------------------------------------------
// Mann-Whitney U
// ---------------------------------------------------------------------------------------------

export interface MannWhitneyResult {
  n1: number;
  n2: number;
  meanRank1: number;
  meanRank2: number;
  sumRank1: number;
  sumRank2: number;
  /** Smaller of the two U statistics (SPSS). */
  U: number;
  /** Rank sum that goes with the reported U (SPSS Wilcoxon W). */
  W: number;
  z: number;
  /** Asymptotic two-sided p, tie-corrected, no continuity correction (SPSS). */
  p: number;
  /** Exact 2 * (1-tailed) p ignoring ties, when the samples are small enough. */
  exactP?: number;
  /** Effect size r = |Z| / sqrt(N). */
  r: number;
  hasTies: boolean;
}

/** Number of arrangements of the U statistic: exact null distribution of U (no ties). */
function uDistribution(n1: number, n2: number): Float64Array {
  // f(n1, n2, u) via the standard recurrence, built in n2 layers; stored as probabilities.
  const maxU = n1 * n2;
  // counts[i][u] for sample sizes (i, current n2)
  let prev: Float64Array[] = [];
  for (let i = 0; i <= n1; i++) {
    const a = new Float64Array(maxU + 1);
    a[0] = 1; // n2 = 0: only U = 0
    prev.push(a);
  }
  for (let j = 1; j <= n2; j++) {
    const cur: Float64Array[] = [];
    const a0 = new Float64Array(maxU + 1);
    a0[0] = 1;
    cur.push(a0);
    for (let i = 1; i <= n1; i++) {
      const a = new Float64Array(maxU + 1);
      // f(i, j, u) = f(i-1, j, u - j) + f(i, j-1, u)
      const left = cur[i - 1];
      const up = prev[i];
      for (let u = 0; u <= i * j; u++) a[u] = (u >= j ? left[u - j] : 0) + up[u];
      cur.push(a);
    }
    prev = cur;
  }
  const counts = prev[n1];
  let total = 0;
  for (let u = 0; u <= maxU; u++) total += counts[u];
  const probs = new Float64Array(maxU + 1);
  for (let u = 0; u <= maxU; u++) probs[u] = counts[u] / total;
  return probs;
}

export function mannWhitney(x1: Num, w1: Num | undefined, x2: Num, w2: Num | undefined, opts: { exact?: boolean } = {}): MannWhitneyResult {
  const xs = new Float64Array(x1.length + x2.length);
  const ws = new Float64Array(x1.length + x2.length);
  const ww1 = weightsOrOnes(w1, x1.length);
  const ww2 = weightsOrOnes(w2, x2.length);
  for (let i = 0; i < x1.length; i++) {
    xs[i] = x1[i];
    ws[i] = ww1[i];
  }
  for (let i = 0; i < x2.length; i++) {
    xs[x1.length + i] = x2[i];
    ws[x1.length + i] = ww2[i];
  }
  const { ranks, tieSum } = rankWithTies(xs, ws);
  let n1 = 0;
  let n2 = 0;
  let R1 = 0;
  let R2 = 0;
  for (let i = 0; i < xs.length; i++) {
    if (i < x1.length) {
      n1 += ws[i];
      R1 += ws[i] * ranks[i];
    } else {
      n2 += ws[i];
      R2 += ws[i] * ranks[i];
    }
  }
  let U = n1 * n2 + (n1 * (n1 + 1)) / 2 - R1;
  let W = R2;
  if (U > (n1 * n2) / 2) {
    U = n1 * n2 - U;
    W = R1;
  }
  const N = n1 + n2;
  const variance = ((n1 * n2) / (N * (N - 1))) * ((N * N * N - N) / 12 - tieSum / 12);
  const z = (U - (n1 * n2) / 2) / Math.sqrt(variance);
  const res: MannWhitneyResult = {
    n1,
    n2,
    meanRank1: R1 / n1,
    meanRank2: R2 / n2,
    sumRank1: R1,
    sumRank2: R2,
    U,
    W,
    z,
    p: Math.min(1, 2 * normalCdf(-Math.abs(z))),
    r: Math.abs(z) / Math.sqrt(N),
    hasTies: tieSum > 0,
  };
  const intN = Number.isInteger(n1) && Number.isInteger(n2);
  if (opts.exact !== false && intN && n1 * n2 <= 2500 && n1 > 0 && n2 > 0) {
    const probs = uDistribution(n1, n2);
    const uFloor = Math.floor(U + 1e-9);
    let cdf = 0;
    for (let u = 0; u <= uFloor; u++) cdf += probs[u];
    res.exactP = Math.min(1, 2 * cdf);
  }
  return res;
}

// ---------------------------------------------------------------------------------------------
// Wilcoxon signed-rank
// ---------------------------------------------------------------------------------------------

export interface WilcoxonResult {
  nNeg: number;
  nPos: number;
  nTies: number;
  meanRankNeg: number;
  meanRankPos: number;
  sumRankNeg: number;
  sumRankPos: number;
  z: number;
  p: number;
  /** Which rank sum Z is based on (the smaller one, as SPSS). */
  basedOn: 'negative' | 'positive';
  r: number;
  /** Exact two-sided p (no ties or zeros, small n). */
  exactP?: number;
}

/** Differences are second - first (SPSS: "second < first" are negative ranks). */
export function wilcoxonSignedRank(first: Num, second: Num, w?: Num): WilcoxonResult {
  const ww = weightsOrOnes(w, first.length);
  const absd: number[] = [];
  const sgn: number[] = [];
  const wts: number[] = [];
  let nTies = 0;
  for (let i = 0; i < first.length; i++) {
    const d = second[i] - first[i];
    if (d === 0) {
      nTies += ww[i];
      continue;
    }
    absd.push(Math.abs(d));
    sgn.push(Math.sign(d));
    wts.push(ww[i]);
  }
  const { ranks, tieSum } = rankWithTies(absd, wts);
  let nNeg = 0;
  let nPos = 0;
  let sNeg = 0;
  let sPos = 0;
  for (let i = 0; i < absd.length; i++) {
    if (sgn[i] < 0) {
      nNeg += wts[i];
      sNeg += wts[i] * ranks[i];
    } else {
      nPos += wts[i];
      sPos += wts[i] * ranks[i];
    }
  }
  const n = nNeg + nPos;
  const T = Math.min(sNeg, sPos);
  const sd = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - tieSum / 48);
  const z = (T - (n * (n + 1)) / 4) / sd;
  const res: WilcoxonResult = {
    nNeg,
    nPos,
    nTies,
    meanRankNeg: nNeg > 0 ? sNeg / nNeg : NaN,
    meanRankPos: nPos > 0 ? sPos / nPos : NaN,
    sumRankNeg: sNeg,
    sumRankPos: sPos,
    z,
    p: n > 0 ? Math.min(1, 2 * normalCdf(-Math.abs(z))) : NaN,
    basedOn: sPos <= sNeg ? 'positive' : 'negative',
    r: Math.abs(z) / Math.sqrt(n + nTies),
  };
  if (tieSum === 0 && Number.isInteger(n) && n > 0 && n <= 50) {
    // exact distribution of the signed-rank sum
    const maxS = (n * (n + 1)) / 2;
    const c = new Float64Array(maxS + 1);
    c[0] = 1;
    for (let k = 1; k <= n; k++) for (let s = maxS; s >= k; s--) c[s] += c[s - k];
    const total = Math.pow(2, n);
    let cdf = 0;
    for (let s = 0; s <= Math.floor(T + 1e-9); s++) cdf += c[s];
    res.exactP = Math.min(1, (2 * cdf) / total);
  }
  return res;
}

// ---------------------------------------------------------------------------------------------
// Kruskal-Wallis
// ---------------------------------------------------------------------------------------------

export interface KruskalResult {
  n: number[];
  meanRanks: number[];
  H: number;
  df: number;
  p: number;
  /** epsilon-squared = H / (N - 1) (Tomczak & Tomczak 2014, as H / ((N^2 - 1)/(N + 1))). */
  epsilonSq: number;
  N: number;
  tieCorrection: number;
}

export function kruskalWallis(groups: Array<{ x: Num; w?: Num }>): KruskalResult {
  const xs: number[] = [];
  const ws: number[] = [];
  const gi: number[] = [];
  groups.forEach((g, k) => {
    const ww = weightsOrOnes(g.w, g.x.length);
    for (let i = 0; i < g.x.length; i++) {
      xs.push(g.x[i]);
      ws.push(ww[i]);
      gi.push(k);
    }
  });
  const { ranks, tieSum } = rankWithTies(xs, ws);
  const n = new Array(groups.length).fill(0);
  const R = new Array(groups.length).fill(0);
  for (let i = 0; i < xs.length; i++) {
    n[gi[i]] += ws[i];
    R[gi[i]] += ws[i] * ranks[i];
  }
  const N = n.reduce((a, b) => a + b, 0);
  let H = 0;
  for (let k = 0; k < groups.length; k++) if (n[k] > 0) H += (R[k] * R[k]) / n[k];
  H = (12 / (N * (N + 1))) * H - 3 * (N + 1);
  const corr = 1 - tieSum / (N * N * N - N);
  H /= corr;
  const df = groups.length - 1;
  return { n, meanRanks: R.map((r, k) => r / n[k]), H, df, p: chi2Sf(H, df), epsilonSq: H / (N - 1), N, tieCorrection: corr };
}

export interface DunnComparison {
  i: number;
  j: number;
  /** mean rank i - mean rank j */
  diff: number;
  se: number;
  z: number;
  p: number;
  /** Bonferroni-adjusted p (times the number of comparisons, capped at 1). */
  pAdj: number;
}

/** Dunn's (1964) pairwise comparisons after Kruskal-Wallis, tie-corrected, Bonferroni adjusted. */
export function dunnTest(kw: KruskalResult, tieSum?: number): DunnComparison[] {
  const k = kw.n.length;
  const N = kw.N;
  const ts = tieSum ?? (1 - kw.tieCorrection) * (N * N * N - N);
  const base = (N * (N + 1)) / 12 - ts / (12 * (N - 1));
  const m = (k * (k - 1)) / 2;
  const out: DunnComparison[] = [];
  for (let i = 0; i < k; i++)
    for (let j = i + 1; j < k; j++) {
      const diff = kw.meanRanks[i] - kw.meanRanks[j];
      const se = Math.sqrt(base * (1 / kw.n[i] + 1 / kw.n[j]));
      const z = diff / se;
      const p = Math.min(1, 2 * normalSf(Math.abs(z)));
      out.push({ i, j, diff, se, z, p, pAdj: Math.min(1, p * m) });
    }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Friedman
// ---------------------------------------------------------------------------------------------

export interface FriedmanResult {
  N: number;
  k: number;
  meanRanks: number[];
  chiSquare: number;
  df: number;
  p: number;
  kendallW: number;
}

/** `columns[j][i]` is the value of variable j for case i (complete cases only). */
export function friedman(columns: Num[], w?: Num): FriedmanResult {
  const k = columns.length;
  const n = columns[0].length;
  const ww = weightsOrOnes(w, n);
  const R = new Array(k).fill(0);
  let N = 0;
  let tieTerm = 0;
  for (let i = 0; i < n; i++) {
    const row = columns.map((c) => c[i]);
    const { ranks, tieSum } = rankWithTies(row);
    for (let j = 0; j < k; j++) R[j] += ww[i] * ranks[j];
    tieTerm += ww[i] * tieSum;
    N += ww[i];
  }
  const meanRanks = R.map((r) => r / N);
  let ss = 0;
  for (let j = 0; j < k; j++) ss += Math.pow(R[j] - (N * (k + 1)) / 2, 2);
  const num = (12 * ss) / (N * k * (k + 1));
  const chi = num / (1 - tieTerm / (N * k * (k * k - 1)));
  return { N, k, meanRanks, chiSquare: chi, df: k - 1, p: chi2Sf(chi, k - 1), kendallW: chi / (N * (k - 1)) };
}

/** Probability of exactly k successes (exported for reporting point probabilities). */
export function binomialPoint(k: number, n: number, p: number): number {
  return Math.exp(binomialLogPmf(k, n, p));
}
