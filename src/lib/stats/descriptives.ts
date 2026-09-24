// Descriptive statistics (DESCRIPTIVES, EXAMINE): moments, percentiles, normality tests, boxplot
// summaries. Pure functions on numeric arrays with optional frequency weights.

import { normalCdf, normalPpf, normalSf, tPpf } from './distributions';
import {
  distinctWeighted,
  kurtosis,
  moments,
  percentileHaverage,
  skewness,
  trimmedMean,
  tukeyHinges,
  type Distinct,
  type Num,
} from './util';

export interface Summary {
  /** Sum of weights. */
  N: number;
  /** Unweighted case count. */
  n: number;
  mean: number;
  sd: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  sum: number;
  seMean: number;
  skewness: number;
  seSkewness: number;
  kurtosis: number;
  seKurtosis: number;
}

/** DESCRIPTIVES-style summary. */
export function summarize(x: Num, w?: Num): Summary {
  const m = moments(x, w);
  const sk = skewness(m);
  const ku = kurtosis(m);
  return {
    N: m.W,
    n: m.n,
    mean: m.mean,
    sd: m.sd,
    variance: m.variance,
    min: m.min,
    max: m.max,
    range: m.max - m.min,
    sum: m.sum,
    seMean: m.sd / Math.sqrt(m.W),
    skewness: sk.value,
    seSkewness: sk.se,
    kurtosis: ku.value,
    seKurtosis: ku.se,
  };
}

export interface ExploreStats extends Summary {
  ciLower: number;
  ciUpper: number;
  trimmedMean: number;
  median: number;
  iqr: number;
  /** HAVERAGE percentiles for the requested p (0-100). */
  percentiles: Array<{ p: number; value: number }>;
  hinges: [number, number, number];
}

export const DEFAULT_PERCENTILES = [5, 10, 25, 50, 75, 90, 95];

/** EXAMINE descriptives with a (conf*100)% confidence interval for the mean. */
export function exploreStats(x: Num, w?: Num, conf = 0.95, ps: number[] = DEFAULT_PERCENTILES): ExploreStats {
  const s = summarize(x, w);
  const d = distinctWeighted(x, w);
  const tcrit = s.N > 1 ? tPpf(1 - (1 - conf) / 2, s.N - 1) : NaN;
  return {
    ...s,
    ciLower: s.mean - tcrit * s.seMean,
    ciUpper: s.mean + tcrit * s.seMean,
    trimmedMean: trimmedMean(d, 0.05),
    median: percentileHaverage(d, 0.5),
    iqr: percentileHaverage(d, 0.75) - percentileHaverage(d, 0.25),
    percentiles: ps.map((p) => ({ p, value: percentileHaverage(d, p / 100) })),
    hinges: tukeyHinges(d),
  };
}

// ---------------------------------------------------------------------------------------------
// Normality tests
// ---------------------------------------------------------------------------------------------

export interface KSResult {
  D: number;
  dPlus: number;
  dMinus: number;
  N: number;
  /** Lilliefors significance (Dallal-Wilkinson), capped at 0.2. */
  p: number;
  /** True when p is the .200 lower bound (the true p is larger). */
  lowerBound: boolean;
}

/**
 * Dallal & Wilkinson (1986) approximation to the Lilliefors p-value, as used by SPSS EXAMINE.
 * The approximation is intended for p <= 0.1; SPSS reports .200 as a lower bound above 0.2.
 */
export function lillieforsP(D: number, n: number): number {
  let d = D;
  let nn = n;
  if (nn > 100) {
    d = d * Math.pow(nn / 100, 0.49);
    nn = 100;
  }
  return Math.exp(-7.01256 * d * d * (nn + 2.78019) + 2.99587 * d * Math.sqrt(nn + 2.78019) - 0.122119 + 0.974598 / Math.sqrt(nn) + 1.67997 / nn);
}

/** Kolmogorov-Smirnov test of normality with estimated mean and SD (Lilliefors correction). */
export function ksLilliefors(x: Num, w?: Num): KSResult {
  const m = moments(x, w);
  const d = distinctWeighted(x, w);
  let dPlus = 0;
  let dMinus = 0;
  for (let i = 0; i < d.values.length; i++) {
    const F = normalCdf((d.values[i] - m.mean) / m.sd);
    const hi = d.cum[i] / d.W;
    const lo = i > 0 ? d.cum[i - 1] / d.W : 0;
    if (hi - F > dPlus) dPlus = hi - F;
    if (F - lo > dMinus) dMinus = F - lo;
  }
  const D = Math.max(dPlus, dMinus);
  let p = lillieforsP(D, m.W);
  let lowerBound = false;
  if (p > 0.2) {
    p = 0.2;
    lowerBound = true;
  }
  return { D, dPlus, dMinus: -dMinus, N: m.W, p, lowerBound };
}

function poly(c: number[], x: number): number {
  let r = c[c.length - 1];
  for (let i = c.length - 2; i >= 0; i--) r = r * x + c[i];
  return r;
}

export interface SWResult {
  W: number;
  n: number;
  p: number;
}

/**
 * Shapiro-Wilk W test (Royston 1995, algorithm AS R94), valid for 3 <= n <= 5000. `sorted` must be
 * ascending. Frequency weights must be expanded (integer replication) by the caller.
 */
export function shapiroWilk(sorted: Num): SWResult {
  const n = sorted.length;
  if (n < 3) throw new Error('Shapiro-Wilk needs at least 3 cases');
  if (n > 5000) throw new Error('Shapiro-Wilk is only available for up to 5000 cases');
  const nn2 = Math.floor(n / 2);
  const a = new Float64Array(nn2 + 1); // 1-based
  const small = 1e-19;
  if (n === 3) {
    a[1] = Math.SQRT1_2;
  } else {
    const an25 = n + 0.25;
    const m = new Float64Array(nn2 + 1);
    let summ2 = 0;
    for (let i = 1; i <= nn2; i++) {
      m[i] = normalPpf((i - 0.375) / an25);
      summ2 += m[i] * m[i];
    }
    summ2 *= 2;
    const ssumm2 = Math.sqrt(summ2);
    const rsn = 1 / Math.sqrt(n);
    const c1 = [0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056];
    const c2 = [0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633];
    const a1 = poly(c1, rsn) - m[1] / ssumm2;
    let i1: number;
    let fac: number;
    if (n > 5) {
      i1 = 3;
      const a2 = -m[2] / ssumm2 + poly(c2, rsn);
      fac = Math.sqrt((summ2 - 2 * m[1] * m[1] - 2 * m[2] * m[2]) / (1 - 2 * a1 * a1 - 2 * a2 * a2));
      a[2] = a2;
    } else {
      i1 = 2;
      fac = Math.sqrt((summ2 - 2 * m[1] * m[1]) / (1 - 2 * a1 * a1));
    }
    a[1] = a1;
    for (let i = i1; i <= nn2; i++) a[i] = -m[i] / fac;
  }
  const range = sorted[n - 1] - sorted[0];
  if (range < small) throw new Error('All values are identical, so normality cannot be tested');
  // W as the squared correlation between data and coefficients (as in swilk.c).
  let xx = sorted[0] / range;
  let sx = xx;
  let sa = -a[1];
  for (let i = 1, j = n - 1; i < n; j--) {
    const xi = sorted[i] / range;
    sx += xi;
    i++;
    if (i !== j) sa += Math.sign(i - j) * a[Math.min(i, j)];
    xx = xi;
  }
  sa /= n;
  sx /= n;
  let ssa = 0;
  let ssx = 0;
  let sax = 0;
  for (let i = 0, j = n - 1; i < n; i++, j--) {
    const asa = i !== j ? Math.sign(i - j) * a[1 + Math.min(i, j)] - sa : -sa;
    const xsx = sorted[i] / range - sx;
    ssa += asa * asa;
    ssx += xsx * xsx;
    sax += asa * xsx;
  }
  const ssassx = Math.sqrt(ssa * ssx);
  const w1 = ((ssassx - sax) * (ssassx + sax)) / (ssa * ssx);
  const W = 1 - w1;
  if (n === 3) {
    const pi6 = 6 / Math.PI;
    const stqr = Math.PI / 3;
    const p = Math.max(0, pi6 * (Math.asin(Math.sqrt(W)) - stqr));
    return { W, n, p: Math.min(1, p) };
  }
  let y = Math.log(w1);
  const lxx = Math.log(n);
  let mu: number;
  let sigma: number;
  if (n <= 11) {
    const gamma = poly([-2.273, 0.459], n);
    if (y >= gamma) return { W, n, p: 1e-99 };
    y = -Math.log(gamma - y);
    mu = poly([0.544, -0.39978, 0.025054, -6.714e-4], n);
    sigma = Math.exp(poly([1.3822, -0.77857, 0.062767, -0.0020322], n));
  } else {
    mu = poly([-1.5861, -0.31082, -0.083751, 0.0038915], lxx);
    sigma = Math.exp(poly([-0.4803, -0.082676, 0.0030302], lxx));
  }
  return { W, n, p: normalSf((y - mu) / sigma) };
}

/** Expand integer frequency weights into replicated sorted values (for Shapiro-Wilk). */
export function expandIntegerWeights(x: Num, w?: Num): { values: Float64Array; integer: boolean } {
  if (!w) return { values: Float64Array.from(x).sort(), integer: true };
  let integer = true;
  const out: number[] = [];
  for (let i = 0; i < x.length; i++) {
    const k = Math.round(w[i]);
    if (Math.abs(k - w[i]) > 1e-9) integer = false;
    for (let j = 0; j < k; j++) out.push(x[i]);
  }
  return { values: Float64Array.from(out).sort(), integer };
}

// ---------------------------------------------------------------------------------------------
// Boxplot (Tukey hinges, 1.5 / 3 box-length fences, like SPSS EXAMINE)
// ---------------------------------------------------------------------------------------------

export interface BoxStats {
  q1: number;
  median: number;
  q3: number;
  /** Whisker ends: most extreme values that are not outliers. */
  lowWhisker: number;
  highWhisker: number;
  outliers: Array<{ value: number; index: number; extreme: boolean }>;
  n: number;
}

/** `index` values in outliers refer to positions in `x` (callers map them to case numbers). */
export function boxStats(x: Num, w?: Num): BoxStats {
  const d: Distinct = distinctWeighted(x, w);
  const [q1, median, q3] = tukeyHinges(d);
  const step = q3 - q1;
  const out: BoxStats['outliers'] = [];
  let lw = Infinity;
  let hw = -Infinity;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    const lowDist = q1 - v;
    const highDist = v - q3;
    if (lowDist > 1.5 * step || highDist > 1.5 * step) {
      out.push({ value: v, index: i, extreme: lowDist > 3 * step || highDist > 3 * step });
    } else {
      if (v < lw) lw = v;
      if (v > hw) hw = v;
    }
  }
  out.sort((a, b) => a.value - b.value);
  return { q1, median, q3, lowWhisker: lw, highWhisker: hw, outliers: out, n: d.W };
}
