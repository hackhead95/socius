// One-way analysis of variance (SPSS ONEWAY / MEANS): ANOVA table, robust tests of equality of
// means (Welch, Brown-Forsythe), effect sizes, post hoc comparisons (Tukey HSD, Bonferroni,
// Scheffe, Games-Howell), Tukey homogeneous subsets and a linear trend contrast.

import { fPpf, fSf, studentizedRangePpf, studentizedRangeSf, tPpf, twoSidedP } from './distributions';
import { levene, type LeveneResult } from './ttest';
import { Acc, moments, type Num } from './util';

export interface GroupInput {
  x: Num;
  w?: Num;
}

export interface GroupDesc {
  N: number;
  mean: number;
  sd: number;
  se: number;
  ciLower: number;
  ciUpper: number;
  min: number;
  max: number;
}

export interface AnovaResult {
  groups: GroupDesc[];
  total: GroupDesc;
  ssB: number;
  ssW: number;
  ssT: number;
  dfB: number;
  dfW: number;
  dfT: number;
  msB: number;
  msW: number;
  F: number;
  p: number;
  welch: { F: number; df1: number; df2: number; p: number };
  brownForsythe: { F: number; df1: number; df2: number; p: number };
  leveneMean: LeveneResult;
  leveneMedian: LeveneResult;
  effects: { etaSq: number; epsilonSq: number; omegaSqFixed: number; omegaSqRandom: number };
}

function desc(x: Num, w: Num | undefined, conf: number): GroupDesc {
  const m = moments(x, w);
  const se = m.sd / Math.sqrt(m.W);
  const crit = m.W > 1 ? tPpf(1 - (1 - conf) / 2, m.W - 1) : NaN;
  return { N: m.W, mean: m.mean, sd: m.sd, se, ciLower: m.mean - crit * se, ciUpper: m.mean + crit * se, min: m.min, max: m.max };
}

export function oneWayAnova(groups: GroupInput[], conf = 0.95): AnovaResult {
  const k = groups.length;
  if (k < 2) throw new Error('One-way ANOVA needs at least two groups with valid cases');
  const ms = groups.map((g) => moments(g.x, g.w));
  const descs = groups.map((g) => desc(g.x, g.w, conf));
  // total
  const allX: number[] = [];
  const allW: number[] = [];
  for (const g of groups) for (let i = 0; i < g.x.length; i++) {
    allX.push(g.x[i]);
    allW.push(g.w ? g.w[i] : 1);
  }
  const total = desc(allX, allW, conf);
  const W = ms.reduce((s, m) => s + m.W, 0);
  const grand = total.mean;
  const aB = new Acc();
  const aW = new Acc();
  for (const m of ms) {
    aB.add(m.W * (m.mean - grand) * (m.mean - grand));
    aW.add(m.m2);
  }
  const ssB = aB.value;
  const ssW = aW.value;
  const ssT = ssB + ssW;
  const dfB = k - 1;
  const dfW = W - k;
  const msB = ssB / dfB;
  const msW = ssW / dfW;
  const F = msB / msW;
  // Welch
  const wts = ms.map((m) => m.W / m.variance);
  const sw = wts.reduce((a, b) => a + b, 0);
  const mw = ms.reduce((s, m, i) => s + wts[i] * m.mean, 0) / sw;
  let A = 0;
  let lam = 0;
  for (let i = 0; i < k; i++) {
    A += wts[i] * (ms[i].mean - mw) * (ms[i].mean - mw);
    lam += Math.pow(1 - wts[i] / sw, 2) / (ms[i].W - 1);
  }
  const welchF = A / (k - 1) / (1 + (2 * (k - 2) * lam) / (k * k - 1));
  const welchDf2 = (k * k - 1) / (3 * lam);
  // Brown-Forsythe
  let bfDen = 0;
  for (const m of ms) bfDen += (1 - m.W / W) * m.variance;
  const bfF = ssB / bfDen;
  let fsum = 0;
  for (const m of ms) {
    const c = ((1 - m.W / W) * m.variance) / bfDen;
    fsum += (c * c) / (m.W - 1);
  }
  const bfDf2 = 1 / fsum;
  // Effect sizes (SPSS 27 ANOVA Effect Sizes)
  const etaSq = ssB / ssT;
  const epsilonSq = (ssB - dfB * msW) / ssT;
  const omegaSqFixed = (ssB - dfB * msW) / (ssT + msW);
  const n0 = (W - ms.reduce((s, m) => s + m.W * m.W, 0) / W) / (k - 1);
  const sigmaA = (msB - msW) / n0;
  const omegaSqRandom = sigmaA / (sigmaA + msW);
  return {
    groups: descs,
    total,
    ssB,
    ssW,
    ssT,
    dfB,
    dfW,
    dfT: W - 1,
    msB,
    msW,
    F,
    p: fSf(F, dfB, dfW),
    welch: { F: welchF, df1: k - 1, df2: welchDf2, p: fSf(welchF, k - 1, welchDf2) },
    brownForsythe: { F: bfF, df1: k - 1, df2: bfDf2, p: fSf(bfF, k - 1, bfDf2) },
    leveneMean: levene(groups, 'mean'),
    leveneMedian: levene(groups, 'median'),
    effects: { etaSq, epsilonSq, omegaSqFixed, omegaSqRandom },
  };
}

export type PostHocMethod = 'tukey' | 'bonferroni' | 'scheffe' | 'gamesHowell';

export interface PairComparison {
  i: number;
  j: number;
  diff: number;
  se: number;
  p: number;
  ciLower: number;
  ciUpper: number;
}

/** All ordered pairs (i, j), i != j, as SPSS lists them. */
export function postHoc(method: PostHocMethod, groups: GroupDesc[], msW: number, dfW: number, conf = 0.95): PairComparison[] {
  const k = groups.length;
  const out: PairComparison[] = [];
  const nPairs = (k * (k - 1)) / 2;
  let qcrit = NaN;
  if (method === 'tukey') qcrit = studentizedRangePpf(conf, k, dfW);
  const scheffeCrit = method === 'scheffe' ? Math.sqrt((k - 1) * fPpf(conf, k - 1, dfW)) : NaN;
  const bonfCrit = method === 'bonferroni' ? tPpf(1 - (1 - conf) / (2 * nPairs), dfW) : NaN;
  const ghCache = new Map<string, { df: number; q: number }>();
  for (let i = 0; i < k; i++)
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const gi = groups[i];
      const gj = groups[j];
      const diff = gi.mean - gj.mean;
      let se: number;
      let p: number;
      let half: number;
      if (method === 'gamesHowell') {
        const vi = (gi.sd * gi.sd) / gi.N;
        const vj = (gj.sd * gj.sd) / gj.N;
        se = Math.sqrt(vi + vj);
        const key = i < j ? `${i},${j}` : `${j},${i}`;
        let c = ghCache.get(key);
        if (!c) {
          const df = ((vi + vj) * (vi + vj)) / ((vi * vi) / (gi.N - 1) + (vj * vj) / (gj.N - 1));
          c = { df, q: studentizedRangePpf(conf, k, df) };
          ghCache.set(key, c);
        }
        p = studentizedRangeSf((Math.abs(diff) / se) * Math.SQRT2, k, c.df);
        half = (c.q / Math.SQRT2) * se;
      } else {
        se = Math.sqrt(msW * (1 / gi.N + 1 / gj.N));
        const t = diff / se;
        if (method === 'tukey') {
          p = studentizedRangeSf(Math.abs(t) * Math.SQRT2, k, dfW);
          half = (qcrit / Math.SQRT2) * se;
        } else if (method === 'bonferroni') {
          p = Math.min(1, twoSidedP('t', t, dfW) * nPairs);
          half = bonfCrit * se;
        } else {
          p = fSf((t * t) / (k - 1), k - 1, dfW);
          half = scheffeCrit * se;
        }
      }
      out.push({ i, j, diff, se, p: Math.min(1, p), ciLower: diff - half, ciUpper: diff + half });
    }
  return out;
}

export interface Subset {
  /** group indices (sorted by mean) in this subset */
  members: number[];
  /** significance of the range test for the subset */
  p: number;
}

/**
 * Tukey HSD homogeneous subsets (harmonic mean of group sizes, as SPSS). Groups are sorted by
 * mean; each maximal run of consecutive means whose range is not significant forms a subset.
 */
export function tukeySubsets(groups: GroupDesc[], msW: number, dfW: number, alpha = 0.05): { order: number[]; subsets: Subset[]; harmonicN: number } {
  const k = groups.length;
  const order = groups.map((_, i) => i).sort((a, b) => groups[a].mean - groups[b].mean);
  const harmonicN = k / groups.reduce((s, g) => s + 1 / g.N, 0);
  const se = Math.sqrt(msW / harmonicN);
  const rangeP = (a: number, b: number) => studentizedRangeSf((groups[order[b]].mean - groups[order[a]].mean) / se, k, dfW);
  const subsets: Subset[] = [];
  let lastEnd = -1;
  for (let start = 0; start < k; start++) {
    let end = start;
    while (end + 1 < k && rangeP(start, end + 1) > alpha) end++;
    if (end > lastEnd) {
      subsets.push({ members: order.slice(start, end + 1), p: end > start ? rangeP(start, end) : 1 });
      lastEnd = end;
    }
    if (end === k - 1) break;
  }
  return { order, subsets, harmonicN };
}

export interface TrendResult {
  /** Unweighted linear contrast (equally spaced coefficients), as SPSS "Linear Term, Unweighted". */
  unweighted: { ss: number; F: number; p: number };
  /** Weighted linear term and the deviation from linearity. */
  weighted: { ss: number; F: number; p: number };
  deviation: { ss: number; df: number; F: number; p: number };
  coefficients: number[];
}

/** Linear polynomial contrast across ordered groups (equal spacing). */
export function linearTrend(groups: GroupDesc[], ssB: number, msW: number, dfW: number): TrendResult {
  const k = groups.length;
  const coef = groups.map((_, i) => i - (k - 1) / 2);
  const norm = Math.sqrt(coef.reduce((s, c) => s + c * c, 0));
  const c = coef.map((v) => v / norm);
  // unweighted: L = sum c_i mean_i, SS = L^2 / sum(c_i^2 / n_i)
  const L = groups.reduce((s, g, i) => s + c[i] * g.mean, 0);
  const ssU = (L * L) / groups.reduce((s, g, i) => s + (c[i] * c[i]) / g.N, 0);
  // weighted: regression of group means on scores with weights n_i
  const W = groups.reduce((s, g) => s + g.N, 0);
  const xbar = groups.reduce((s, g, i) => s + g.N * coef[i], 0) / W;
  const ybar = groups.reduce((s, g) => s + g.N * g.mean, 0) / W;
  let sxy = 0;
  let sxx = 0;
  groups.forEach((g, i) => {
    sxy += g.N * (coef[i] - xbar) * (g.mean - ybar);
    sxx += g.N * (coef[i] - xbar) * (coef[i] - xbar);
  });
  const ssWt = (sxy * sxy) / sxx;
  const devSS = ssB - ssWt;
  const devDf = k - 2;
  return {
    unweighted: { ss: ssU, F: ssU / msW, p: fSf(ssU / msW, 1, dfW) },
    weighted: { ss: ssWt, F: ssWt / msW, p: fSf(ssWt / msW, 1, dfW) },
    deviation: { ss: devSS, df: devDf, F: devDf > 0 ? devSS / devDf / msW : NaN, p: devDf > 0 ? fSf(devSS / devDf / msW, devDf, dfW) : NaN },
    coefficients: c,
  };
}
