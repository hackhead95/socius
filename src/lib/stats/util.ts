// Shared numeric helpers for the core statistics modules: compensated sums, weighted moments,
// ranking with ties, SPSS order statistics (HAVERAGE percentiles, Tukey hinges, trimmed mean) and
// a seeded random generator. Everything here is pure and works on plain arrays.

export type Num = ArrayLike<number>;

/** Neumaier (improved Kahan) compensated summation. */
export function sum(xs: Num): number {
  let s = 0;
  let c = 0;
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const t = s + x;
    if (Math.abs(s) >= Math.abs(x)) c += s - t + x;
    else c += x - t + s;
    s = t;
  }
  return s + c;
}

/** Compensated accumulator for streaming sums. */
export class Acc {
  private s = 0;
  private c = 0;
  add(x: number): void {
    const t = this.s + x;
    if (Math.abs(this.s) >= Math.abs(x)) this.c += this.s - t + x;
    else this.c += x - t + this.s;
    this.s = t;
  }
  get value(): number {
    return this.s + this.c;
  }
}

/** Weights array (all ones when undefined). */
export function unitWeights(n: number): Float64Array {
  return new Float64Array(n).fill(1);
}

export function weightsOrOnes(w: Num | undefined, n: number): Num {
  return w ?? unitWeights(n);
}

export interface Moments {
  /** Sum of weights (N in SPSS terms). */
  W: number;
  /** Number of cases (unweighted). */
  n: number;
  mean: number;
  /** Sum of weighted squared deviations. */
  m2: number;
  m3: number;
  m4: number;
  variance: number;
  sd: number;
  sum: number;
  min: number;
  max: number;
}

/** Weighted moments by a two-pass algorithm (mean first, then centred sums). */
export function moments(x: Num, w?: Num): Moments {
  const n = x.length;
  const ww = weightsOrOnes(w, n);
  const sW = new Acc();
  const sX = new Acc();
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < n; i++) {
    sW.add(ww[i]);
    sX.add(ww[i] * x[i]);
    if (x[i] < min) min = x[i];
    if (x[i] > max) max = x[i];
  }
  const W = sW.value;
  const total = sX.value;
  let mean = total / W;
  // Correction step (second pass) for the mean, then centred sums.
  const corr = new Acc();
  for (let i = 0; i < n; i++) corr.add(ww[i] * (x[i] - mean));
  mean += corr.value / W;
  const a2 = new Acc();
  const a3 = new Acc();
  const a4 = new Acc();
  for (let i = 0; i < n; i++) {
    const d = x[i] - mean;
    const d2 = d * d;
    a2.add(ww[i] * d2);
    a3.add(ww[i] * d2 * d);
    a4.add(ww[i] * d2 * d2);
  }
  const m2 = a2.value;
  const variance = W > 1 ? m2 / (W - 1) : NaN;
  return {
    W,
    n,
    mean: W > 0 ? mean : NaN,
    m2,
    m3: a3.value,
    m4: a4.value,
    variance,
    sd: Math.sqrt(variance),
    sum: total,
    min: n ? min : NaN,
    max: n ? max : NaN,
  };
}

/** SPSS skewness (G1) and its standard error, from weighted moments. */
export function skewness(m: Moments): { value: number; se: number } {
  const W = m.W;
  if (!(W > 2) || !(m.variance > 0)) return { value: NaN, se: W > 2 ? seSkew(W) : NaN };
  const s = m.sd;
  const value = (W * m.m3) / ((W - 1) * (W - 2) * s * s * s);
  return { value, se: seSkew(W) };
}

export function seSkew(W: number): number {
  return W > 2 ? Math.sqrt((6 * W * (W - 1)) / ((W - 2) * (W + 1) * (W + 3))) : NaN;
}

/** SPSS kurtosis (G2, excess) and its standard error. */
export function kurtosis(m: Moments): { value: number; se: number } {
  const W = m.W;
  const se = seKurt(W);
  if (!(W > 3) || !(m.variance > 0)) return { value: NaN, se };
  const s2 = m.variance;
  const value = (W * (W + 1) * m.m4 - 3 * m.m2 * m.m2 * (W - 1)) / ((W - 1) * (W - 2) * (W - 3) * s2 * s2);
  return { value, se };
}

export function seKurt(W: number): number {
  if (!(W > 3)) return NaN;
  const ss = seSkew(W);
  return Math.sqrt((4 * (W * W - 1) * ss * ss) / ((W - 3) * (W + 5)));
}

// ---------------------------------------------------------------------------------------------
// Distinct values with weights (the basis of SPSS order statistics)
// ---------------------------------------------------------------------------------------------

export interface Distinct {
  /** Distinct values ascending. */
  values: number[];
  /** Summed weight of each distinct value. */
  weights: number[];
  /** Cumulative weight up to and including each value. */
  cum: number[];
  W: number;
  /** Smallest positive weight among cases (SPSS c_min for hinges). */
  cMin: number;
}

export function distinctWeighted(x: Num, w?: Num): Distinct {
  const n = x.length;
  const ww = weightsOrOnes(w, n);
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => x[a] - x[b]);
  const values: number[] = [];
  const weights: number[] = [];
  let cMin = Infinity;
  for (const i of idx) {
    if (ww[i] < cMin) cMin = ww[i];
    if (values.length && values[values.length - 1] === x[i]) weights[weights.length - 1] += ww[i];
    else {
      values.push(x[i]);
      weights.push(ww[i]);
    }
  }
  const cum: number[] = [];
  const acc = new Acc();
  for (const wt of weights) {
    acc.add(wt);
    cum.push(acc.value);
  }
  return { values, weights, cum, W: cum.length ? cum[cum.length - 1] : 0, cMin };
}

/** SPSS order statistic lookup for target cumulative weight tc. */
interface KPoint {
  /** last distinct value with cum <= tc (undefined if none) */
  y?: number;
  cc: number;
  c: number;
  /** first distinct value with cum > tc (undefined if none) */
  yp1?: number;
  cp1: number;
}

function kpoint(d: Distinct, tc: number): KPoint {
  // binary search: last index with cum <= tc (with a tiny tolerance for rounding of summed weights)
  const eps = 1e-9 * Math.max(1, d.W);
  let lo = -1;
  let hi = d.cum.length;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (d.cum[mid] <= tc + eps) lo = mid;
    else hi = mid;
  }
  const k: KPoint = { cc: 0, c: 0, cp1: 0 };
  if (lo >= 0) {
    k.y = d.values[lo];
    k.cc = d.cum[lo];
    k.c = d.weights[lo];
  }
  if (lo + 1 < d.values.length) {
    k.yp1 = d.values[lo + 1];
    k.cp1 = d.weights[lo + 1];
  }
  return k;
}

/**
 * Weighted percentile by SPSS's default HAVERAGE definition ((W+1)p, interpolating), p in [0, 1].
 * Matches the usual (n+1)p rule for unit weights and the expanded data for integer weights.
 */
export function percentileHaverage(d: Distinct, p: number): number {
  if (!d.values.length) return NaN;
  const tc = (d.W + 1) * p;
  const k = kpoint(d, tc);
  if (k.yp1 === undefined) return d.values[d.values.length - 1];
  if (k.y === undefined) return d.values[0];
  const gStar = tc - k.cc;
  if (gStar >= 1) return k.yp1;
  if (k.cp1 >= 1) {
    if (gStar <= 0) return k.y;
    return (1 - gStar) * k.y + gStar * k.yp1;
  }
  const g = gStar / k.cp1;
  return (1 - g) * k.y + g * k.yp1;
}

/** Tukey's hinges [lower hinge, median, upper hinge] as computed by SPSS EXAMINE. */
export function tukeyHinges(d: Distinct): [number, number, number] {
  const W = d.W;
  const cMin = d.cMin;
  let tcs: number[];
  if (cMin >= 1) {
    const dd = Math.floor((W + 3) / 2) / 2;
    tcs = [dd, W / 2 + 0.5, W + 1 - dd];
  } else {
    const dd = Math.floor((W / cMin + 3) / 2) / 2;
    tcs = [dd * cMin, (W + cMin) / 2, W + cMin * (1 - dd)];
  }
  const out = tcs.map((tc) => {
    const k = kpoint(d, tc);
    if (k.yp1 === undefined) return d.values[d.values.length - 1];
    if (k.y === undefined) return d.values[0];
    const aStar = tc - k.cc;
    if (aStar >= 1) return k.yp1;
    if (k.cp1 >= 1) return (1 - aStar) * k.y + aStar * k.yp1;
    const a = aStar / k.cp1;
    return (1 - a) * k.y + a * k.yp1;
  });
  return [out[0], out[1], out[2]];
}

/** SPSS trimmed mean: removes `tail` of the total weight from each end (fractional at the edges). */
export function trimmedMean(d: Distinct, tail = 0.05): number {
  const W = d.W;
  if (!(W > 0)) return NaN;
  const tc0 = tail * W;
  const tc1 = (1 - tail) * W;
  const s = new Acc();
  const eps = 1e-9 * Math.max(1, W);
  let lowCc = 0;
  let lowYp1: number | undefined;
  let highCc = 0;
  let highYp1: number | undefined;
  for (let i = 0; i < d.values.length; i++) {
    const cc = d.cum[i];
    if (cc <= tc0 + eps) lowCc = cc;
    else if (lowYp1 === undefined) lowYp1 = d.values[i];
    if (cc <= tc1 + eps) highCc = cc;
    else if (highYp1 === undefined) highYp1 = d.values[i];
    if (cc > tc0 + eps && cc <= tc1 + eps) s.add(d.weights[i] * d.values[i]);
  }
  let total = s.value;
  if (lowYp1 !== undefined) total += (lowCc - tc0) * lowYp1;
  if (highYp1 !== undefined) total += (W - highCc - tc0) * highYp1;
  return total / ((1 - 2 * tail) * W);
}

/** Mode(s): the values with the largest summed weight. */
export function modes(d: Distinct): number[] {
  let best = -Infinity;
  for (const w of d.weights) if (w > best) best = w;
  const tol = 1e-9 * Math.max(1, best);
  return d.values.filter((_, i) => Math.abs(d.weights[i] - best) <= tol);
}

// ---------------------------------------------------------------------------------------------
// Ranks
// ---------------------------------------------------------------------------------------------

export interface RankResult {
  /** Mid-rank of each observation (in input order); with weights, ranks of the expanded data. */
  ranks: Float64Array;
  /** Sum over tie groups of (t^3 - t), t = tied weight. */
  tieSum: number;
  /** Tie-group sizes (weights) for groups with more than one case. */
  ties: number[];
}

/** Average ranks with ties; frequency weights treated as replicated cases. */
export function rankWithTies(x: Num, w?: Num): RankResult {
  const n = x.length;
  const ww = weightsOrOnes(w, n);
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => x[a] - x[b]);
  const ranks = new Float64Array(n);
  let tieSum = 0;
  const ties: number[] = [];
  let cum = 0;
  let i = 0;
  while (i < n) {
    let j = i;
    let tw = 0;
    while (j < n && x[idx[j]] === x[idx[i]]) {
      tw += ww[idx[j]];
      j++;
    }
    const r = cum + (tw + 1) / 2;
    for (let k = i; k < j; k++) ranks[idx[k]] = r;
    if (tw > 1 || j - i > 1) {
      tieSum += tw * tw * tw - tw;
      ties.push(tw);
    }
    cum += tw;
    i = j;
  }
  return { ranks, tieSum, ties };
}

// ---------------------------------------------------------------------------------------------
// Random numbers (Monte Carlo exact tests): mulberry32-style generator with a fixed seed.
// ---------------------------------------------------------------------------------------------

export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pearson correlation on paired arrays with weights (two-pass). */
export function pearsonWeighted(x: Num, y: Num, w?: Num): { r: number; W: number; sxx: number; syy: number; sxy: number } {
  const n = x.length;
  const ww = weightsOrOnes(w, n);
  const mx = moments(x, ww).mean;
  const my = moments(y, ww).mean;
  const axx = new Acc();
  const ayy = new Acc();
  const axy = new Acc();
  const aw = new Acc();
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    axx.add(ww[i] * dx * dx);
    ayy.add(ww[i] * dy * dy);
    axy.add(ww[i] * dx * dy);
    aw.add(ww[i]);
  }
  const sxx = axx.value;
  const syy = ayy.value;
  const sxy = axy.value;
  let r = sxy / Math.sqrt(sxx * syy);
  if (r > 1) r = 1;
  if (r < -1) r = -1;
  return { r, W: aw.value, sxx, syy, sxy };
}
