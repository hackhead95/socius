// t tests (SPSS T-TEST): one-sample, independent samples (with Levene's test and Welch), paired.
// Frequency weights are treated as replication counts, so N and df come from summed weights.

import { fSf, lnGamma, tPpf, twoSidedP, tSf, tCdf } from './distributions';
import { Acc, moments, pearsonWeighted, weightsOrOnes, type Num } from './util';

export interface GroupStats {
  N: number;
  mean: number;
  sd: number;
  se: number;
}

export function groupStats(x: Num, w?: Num): GroupStats {
  const m = moments(x, w);
  return { N: m.W, mean: m.mean, sd: m.sd, se: m.sd / Math.sqrt(m.W) };
}

/** Hedges' small-sample correction factor J(df) = Gamma(df/2) / (sqrt(df/2) Gamma((df-1)/2)). */
export function hedgesJ(df: number): number {
  if (!(df > 1)) return NaN;
  return Math.exp(lnGamma(df / 2) - 0.5 * Math.log(df / 2) - lnGamma((df - 1) / 2));
}

export interface TResult {
  t: number;
  df: number;
  /** two-sided p */
  p: number;
  /** one-sided p in the direction of the observed difference */
  pOneSided: number;
  meanDiff: number;
  seDiff: number;
  ciLower: number;
  ciUpper: number;
}

function tResult(meanDiff: number, se: number, df: number, conf: number): TResult {
  const t = meanDiff / se;
  const crit = tPpf(1 - (1 - conf) / 2, df);
  return {
    t,
    df,
    p: twoSidedP('t', t, df),
    pOneSided: t >= 0 ? tSf(t, df) : tCdf(t, df),
    meanDiff,
    seDiff: se,
    ciLower: meanDiff - crit * se,
    ciUpper: meanDiff + crit * se,
  };
}

export interface EffectSize {
  name: string;
  standardizer: number;
  value: number;
}

export interface OneSampleResult {
  stats: GroupStats;
  test: TResult;
  effects: EffectSize[];
}

export function oneSampleT(x: Num, w: Num | undefined, testValue: number, conf = 0.95): OneSampleResult {
  const s = groupStats(x, w);
  const df = s.N - 1;
  const test = tResult(s.mean - testValue, s.se, df, conf);
  const J = hedgesJ(df);
  const d = (s.mean - testValue) / s.sd;
  return {
    stats: s,
    test,
    effects: [
      { name: "Cohen's d", standardizer: s.sd, value: d },
      { name: "Hedges' correction", standardizer: s.sd / J, value: d * J },
    ],
  };
}

export interface LeveneResult {
  F: number;
  df1: number;
  df2: number;
  p: number;
}

/** Levene's test for k groups: one-way ANOVA on |x - centre| (centre = mean, as SPSS, or median). */
export function levene(groups: Array<{ x: Num; w?: Num }>, center: 'mean' | 'median' = 'mean'): LeveneResult {
  const devs = groups.map((g) => {
    const ww = weightsOrOnes(g.w, g.x.length);
    let c: number;
    if (center === 'mean') c = moments(g.x, ww).mean;
    else c = weightedMedianHaverage(g.x, ww);
    const z = new Float64Array(g.x.length);
    for (let i = 0; i < g.x.length; i++) z[i] = Math.abs(g.x[i] - c);
    return { x: z, w: ww };
  });
  const a = anovaF(devs);
  return { F: a.F, df1: a.dfB, df2: a.dfW, p: a.p };
}

function weightedMedianHaverage(x: Num, w: Num): number {
  // local import avoided to keep this module self-contained
  const idx = Array.from({ length: x.length }, (_, i) => i).sort((a, b) => x[a] - x[b]);
  const values: number[] = [];
  const weights: number[] = [];
  for (const i of idx) {
    if (values.length && values[values.length - 1] === x[i]) weights[weights.length - 1] += w[i];
    else {
      values.push(x[i]);
      weights.push(w[i]);
    }
  }
  let W = 0;
  const cum = weights.map((v) => (W += v));
  const tc = (W + 1) * 0.5;
  let lo = -1;
  for (let i = 0; i < cum.length; i++) if (cum[i] <= tc + 1e-9 * W) lo = i;
  if (lo < 0) return values[0];
  if (lo + 1 >= values.length) return values[values.length - 1];
  const gStar = tc - cum[lo];
  if (gStar >= 1) return values[lo + 1];
  const cp1 = weights[lo + 1];
  if (cp1 >= 1) return (1 - gStar) * values[lo] + gStar * values[lo + 1];
  const g = gStar / cp1;
  return (1 - g) * values[lo] + g * values[lo + 1];
}

/** Minimal weighted one-way ANOVA F (used by Levene). */
export function anovaF(groups: Array<{ x: Num; w?: Num }>): { F: number; dfB: number; dfW: number; p: number; ssB: number; ssW: number } {
  const ms = groups.map((g) => moments(g.x, g.w));
  const W = ms.reduce((s, m) => s + m.W, 0);
  const grand = ms.reduce((s, m) => s + m.W * m.mean, 0) / W;
  const ssB = new Acc();
  const ssW = new Acc();
  for (const m of ms) {
    ssB.add(m.W * (m.mean - grand) * (m.mean - grand));
    ssW.add(m.m2);
  }
  const dfB = groups.length - 1;
  const dfW = W - groups.length;
  const F = ssB.value / dfB / (ssW.value / dfW);
  return { F, dfB, dfW, p: fSf(F, dfB, dfW), ssB: ssB.value, ssW: ssW.value };
}

export interface IndependentResult {
  g1: GroupStats;
  g2: GroupStats;
  levene: LeveneResult;
  equal: TResult;
  welch: TResult;
  effects: EffectSize[];
}

export function independentT(x1: Num, w1: Num | undefined, x2: Num, w2: Num | undefined, conf = 0.95): IndependentResult {
  const g1 = groupStats(x1, w1);
  const g2 = groupStats(x2, w2);
  const df = g1.N + g2.N - 2;
  const pooledVar = ((g1.N - 1) * g1.sd * g1.sd + (g2.N - 1) * g2.sd * g2.sd) / df;
  const diff = g1.mean - g2.mean;
  const seEq = Math.sqrt(pooledVar * (1 / g1.N + 1 / g2.N));
  const v1 = (g1.sd * g1.sd) / g1.N;
  const v2 = (g2.sd * g2.sd) / g2.N;
  const seW = Math.sqrt(v1 + v2);
  const dfW = ((v1 + v2) * (v1 + v2)) / ((v1 * v1) / (g1.N - 1) + (v2 * v2) / (g2.N - 1));
  const pooledSd = Math.sqrt(pooledVar);
  const J = hedgesJ(df);
  return {
    g1,
    g2,
    levene: levene([{ x: x1, w: w1 }, { x: x2, w: w2 }], 'mean'),
    equal: tResult(diff, seEq, df, conf),
    welch: tResult(diff, seW, dfW, conf),
    effects: [
      { name: "Cohen's d", standardizer: pooledSd, value: diff / pooledSd },
      { name: "Hedges' correction", standardizer: pooledSd / J, value: (diff / pooledSd) * J },
      { name: "Glass's delta", standardizer: g2.sd, value: diff / g2.sd },
    ],
  };
}

export interface PairedResult {
  first: GroupStats;
  second: GroupStats;
  correlation: { r: number; p: number; N: number };
  diffSd: number;
  diffSe: number;
  test: TResult;
  effects: EffectSize[];
}

/** Paired t test on first - second (SPSS "Pair 1: first - second"). */
export function pairedT(x: Num, y: Num, w?: Num, conf = 0.95): PairedResult {
  const d = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) d[i] = x[i] - y[i];
  const md = moments(d, w);
  const first = groupStats(x, w);
  const second = groupStats(y, w);
  const pr = pearsonWeighted(x, y, w);
  const N = md.W;
  const tr = N - 2 > 0 && Math.abs(pr.r) < 1 ? (pr.r * Math.sqrt(N - 2)) / Math.sqrt(1 - pr.r * pr.r) : NaN;
  const df = N - 1;
  const se = md.sd / Math.sqrt(N);
  const J = hedgesJ(df);
  const dz = md.mean / md.sd;
  return {
    first,
    second,
    correlation: { r: pr.r, p: Math.abs(pr.r) === 1 ? 0 : twoSidedP('t', tr, N - 2), N },
    diffSd: md.sd,
    diffSe: se,
    test: tResult(md.mean, se, df, conf),
    effects: [
      { name: "Cohen's d", standardizer: md.sd, value: dz },
      { name: "Hedges' correction", standardizer: md.sd / J, value: dz * J },
    ],
  };
}
