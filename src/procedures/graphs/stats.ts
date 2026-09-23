// Small, self-contained statistics used by the Graphs procedures (weighted moments, t quantiles for
// confidence intervals, Tukey hinges, binning). Kept local so charts do not depend on the stats
// modules being written in parallel.

/** Weighted mean, variance (frequency weights, SPSS: divisor W - 1), and total weight. */
export function wMoments(x: ArrayLike<number>, w: ArrayLike<number>): { n: number; mean: number; sd: number; variance: number; skew: number } {
  let W = 0;
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    W += w[i];
    s += w[i] * x[i];
  }
  const mean = W > 0 ? s / W : NaN;
  let m2 = 0;
  let m3 = 0;
  for (let i = 0; i < x.length; i++) {
    const d = x[i] - mean;
    m2 += w[i] * d * d;
    m3 += w[i] * d * d * d;
  }
  const variance = W > 1 ? m2 / (W - 1) : NaN;
  const sd = Math.sqrt(variance);
  // SPSS skewness (adjusted Fisher-Pearson) with W as n.
  let skew = NaN;
  if (W > 2 && m2 > 0) {
    const g1 = (m3 / W) / Math.pow(m2 / W, 1.5);
    skew = (Math.sqrt(W * (W - 1)) / (W - 2)) * g1;
  }
  return { n: W, mean, sd, variance, skew };
}

// ---- t distribution (for 95% CIs) ----

function lgamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 300;
  const EPS = 3e-14;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularised incomplete beta I_x(a, b). */
export function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Two-sided p for a t statistic. */
export function tTwoSidedP(t: number, df: number): number {
  if (!Number.isFinite(t)) return 0;
  return ibeta(df / (df + t * t), df / 2, 0.5);
}

/** Upper quantile of t: P(T > q) = alpha (e.g. alpha = .025 for a 95% CI). */
export function tQuantile(alpha: number, df: number): number {
  if (!(df > 0)) return NaN;
  let lo = 0;
  let hi = 1000;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const p = tTwoSidedP(mid, df) / 2;
    if (p > alpha) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-12) break;
  }
  return (lo + hi) / 2;
}

/** Mean with a 95% CI (t-based; frequency weights). */
export function meanCI(x: ArrayLike<number>, w: ArrayLike<number>, level = 0.95): { mean: number; lo: number; hi: number; n: number; sd: number } {
  const m = wMoments(x, w);
  if (!(m.n > 1) || !Number.isFinite(m.sd)) return { mean: m.mean, lo: NaN, hi: NaN, n: m.n, sd: m.sd };
  const q = tQuantile((1 - level) / 2, m.n - 1);
  const se = m.sd / Math.sqrt(m.n);
  return { mean: m.mean, lo: m.mean - q * se, hi: m.mean + q * se, n: m.n, sd: m.sd };
}

// ---- Percentiles ----

/**
 * Weighted percentile, SPSS HAVERAGE definition: position p * (W + 1) over cumulative weights.
 * With unit weights this is the usual (n + 1)p interpolation.
 */
export function wPercentile(sorted: Array<{ x: number; w: number }>, p: number): number {
  const W = sorted.reduce((a, s) => a + s.w, 0);
  if (!sorted.length || W <= 0) return NaN;
  const pos = p * (W + 1);
  const j = Math.floor(pos);
  const g = pos - j;
  const atRank = (r: number) => {
    let cum = 0;
    for (const s of sorted) {
      cum += s.w;
      if (cum >= r - 1e-9) return s.x;
    }
    return sorted[sorted.length - 1].x;
  };
  if (j < 1) return sorted[0].x;
  if (j >= W) return sorted[sorted.length - 1].x;
  const xj = atRank(j);
  const xj1 = atRank(j + 1);
  return xj + g * (xj1 - xj);
}

/** Tukey's hinges (what SPSS EXAMINE draws as the box). Unweighted. */
export function tukeyHinges(sortedX: number[]): { q1: number; median: number; q3: number } {
  const n = sortedX.length;
  if (!n) return { q1: NaN, median: NaN, q3: NaN };
  const med = (a: number[], lo: number, hi: number) => {
    const len = hi - lo + 1;
    const mid = lo + Math.floor((len - 1) / 2);
    return len % 2 ? a[mid] : (a[mid] + a[mid + 1]) / 2;
  };
  const median = med(sortedX, 0, n - 1);
  const half = Math.floor((n + 1) / 2); // include the median in each half when n is odd
  const q1 = med(sortedX, 0, half - 1);
  const q3 = med(sortedX, n - half, n - 1);
  return { q1, median, q3 };
}

export interface BoxStats {
  q1: number;
  median: number;
  q3: number;
  min: number;
  max: number;
  mean: number;
  n: number;
  outliers: Array<{ value: number; caseIndex: number; extreme: boolean }>;
}

/**
 * Box-plot statistics like SPSS EXAMINE: box = Tukey's hinges (weighted HAVERAGE quartiles when
 * weights are not all 1); outliers beyond 1.5 box-lengths, extremes beyond 3; whiskers end at the
 * most extreme non-outlying values. `rows` are 0-based case indices (reported 1-based).
 */
export function boxStats(values: number[], weights: number[], rows: number[]): BoxStats {
  const idx = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
  const sx = idx.map((i) => values[i]);
  const unit = weights.every((w) => w === 1);
  let q1: number, median: number, q3: number;
  if (unit) ({ q1, median, q3 } = tukeyHinges(sx));
  else {
    const sorted = idx.map((i) => ({ x: values[i], w: weights[i] }));
    q1 = wPercentile(sorted, 0.25);
    median = wPercentile(sorted, 0.5);
    q3 = wPercentile(sorted, 0.75);
  }
  const iqr = q3 - q1;
  const lo1 = q1 - 1.5 * iqr;
  const hi1 = q3 + 1.5 * iqr;
  const lo3 = q1 - 3 * iqr;
  const hi3 = q3 + 3 * iqr;
  let min = Infinity;
  let max = -Infinity;
  const outliers: BoxStats['outliers'] = [];
  for (const i of idx) {
    const v = values[i];
    if (v < lo1 || v > hi1) outliers.push({ value: v, caseIndex: rows[i] + 1, extreme: v < lo3 || v > hi3 });
    else {
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
  }
  if (!Number.isFinite(min)) {
    min = q1;
    max = q3;
  }
  const m = wMoments(values, weights);
  return { q1, median, q3, min, max, mean: m.mean, n: m.n, outliers };
}

// ---- Binning ----

/**
 * Histogram bin edges: `bins` equal-width bins, or automatic: the Freedman-Diaconis width (resistant to
 * outliers; needs the IQR) bounded between Sturges' count and 50 bins, rounded to a nice width.
 */
export function histogramEdges(min: number, max: number, n: number, bins = 0, iqr = 0): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) return [min - 0.5, max + 0.5];
  const sturges = Math.max(5, Math.ceil(Math.log2(Math.max(1, n)) + 1));
  let auto = sturges;
  if (iqr > 0 && n > 1) auto = Math.ceil((max - min) / (2 * iqr * Math.pow(n, -1 / 3)));
  const k = bins > 0 ? Math.round(bins) : Math.max(sturges, Math.min(50, auto));
  if (bins > 0) {
    const w = (max - min) / k;
    return Array.from({ length: k + 1 }, (_, i) => (i === k ? max : min + i * w));
  }
  const rough = (max - min) / k;
  const exp = Math.floor(Math.log10(rough));
  const base = Math.pow(10, exp);
  const f = rough / base;
  const width = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * base;
  const start = Math.floor(min / width) * width;
  const edges: number[] = [];
  for (let e = start; e < max + width * 0.999999; e += width) edges.push(Number(e.toFixed(10)));
  if (edges[edges.length - 1] <= max) edges.push(Number((edges[edges.length - 1] + width).toFixed(10)));
  return edges;
}

/** Weighted counts per bin; the last bin includes its upper edge. */
export function binCounts(values: ArrayLike<number>, weights: ArrayLike<number>, edges: number[]): number[] {
  const k = edges.length - 1;
  const counts = new Array(k).fill(0);
  const lo = edges[0];
  const hi = edges[k];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v < lo || v > hi) continue;
    let b = k - 1;
    // Binary search for the bin.
    let a = 0;
    let z = k - 1;
    while (a <= z) {
      const m = (a + z) >> 1;
      if (v < edges[m]) z = m - 1;
      else if (v >= edges[m + 1] && m < k - 1) a = m + 1;
      else {
        b = m;
        break;
      }
    }
    counts[b] += weights[i];
  }
  return counts;
}

/** Weighted least squares line y = a + b x, with Pearson r. */
export function linearFit(x: ArrayLike<number>, y: ArrayLike<number>, w: ArrayLike<number>): { a: number; b: number; r: number; r2: number; n: number } {
  let W = 0, sx = 0, sy = 0;
  for (let i = 0; i < x.length; i++) {
    W += w[i];
    sx += w[i] * x[i];
    sy += w[i] * y[i];
  }
  const mx = sx / W;
  const my = sy / W;
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    sxx += w[i] * dx * dx;
    syy += w[i] * dy * dy;
    sxy += w[i] * dx * dy;
  }
  const b = sxx > 0 ? sxy / sxx : NaN;
  const a = my - b * mx;
  const r = sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : NaN;
  return { a, b, r, r2: r * r, n: W };
}
