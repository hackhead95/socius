// Small numeric helpers shared by the model modules (weighted moments, logistic function).

export function sum(x: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i];
  return s;
}

export function weightedMean(x: ArrayLike<number>, w: ArrayLike<number>): number {
  let sw = 0, s = 0;
  for (let i = 0; i < x.length; i++) {
    sw += w[i];
    s += w[i] * x[i];
  }
  const m = s / sw;
  // Second pass correction for accuracy.
  let c = 0;
  for (let i = 0; i < x.length; i++) c += w[i] * (x[i] - m);
  return m + c / sw;
}

/** Weighted centred sum of squares Σ w (x - mean)². */
export function weightedSS(x: ArrayLike<number>, w: ArrayLike<number>, mean = weightedMean(x, w)): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    const d = x[i] - mean;
    s += w[i] * d * d;
  }
  return s;
}

/** Weighted centred cross-product Σ w (x - mx)(y - my). */
export function weightedCP(x: ArrayLike<number>, y: ArrayLike<number>, w: ArrayLike<number>, mx = weightedMean(x, w), my = weightedMean(y, w)): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += w[i] * (x[i] - mx) * (y[i] - my);
  return s;
}

/** Frequency-weighted sample variance (denominator Σw - 1, like SPSS). */
export function weightedVariance(x: ArrayLike<number>, w: ArrayLike<number>): number {
  return weightedSS(x, w) / (sum(w) - 1);
}

export function weightedCorrelation(x: ArrayLike<number>, y: ArrayLike<number>, w: ArrayLike<number>): number {
  const mx = weightedMean(x, w), my = weightedMean(y, w);
  const sxy = weightedCP(x, y, w, mx, my);
  const sxx = weightedSS(x, w, mx);
  const syy = weightedSS(y, w, my);
  return sxy / Math.sqrt(sxx * syy);
}

/** Logistic CDF 1 / (1 + e^-z), stable for large |z|. */
export function logistic(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z);
  return e / (1 + e);
}

/** log(1 + e^z) without overflow. */
export function log1pExp(z: number): number {
  return z > 0 ? z + Math.log1p(Math.exp(-z)) : Math.log1p(Math.exp(z));
}

/** Logistic density f(z) = F(z)(1 - F(z)). */
export function logisticDensity(z: number): number {
  const a = Math.abs(z);
  const e = Math.exp(-a);
  return e / ((1 + e) * (1 + e));
}
