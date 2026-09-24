// Probability distributions for Socius statistics.
//
// Pure functions, no dependencies. Accuracy target is about 1e-12 relative in the body of each
// distribution and full relative accuracy in the tails down to ~1e-300 where the value is
// representable. Algorithms:
// - log-gamma: Lanczos (Godfrey g = 607/128) for small arguments, Stirling series otherwise.
// - densities: Loader's saddle-point method (stirlerr + bd0), as in R's dbinom/dpois, which keeps
//   full relative accuracy for large parameters.
// - normal CDF: Cody's rational Chebyshev approximations (as in R's pnorm_both).
// - normal quantile: Acklam's approximation polished by a Halley step on the exact CDF.
// - incomplete beta: continued fraction (modified Lentz) with the saddle-point prefactor.
// - incomplete gamma: series / continued fraction (Lentz) with the saddle-point prefactor.
// - quantiles of t, chi-square, F: safeguarded Newton iteration on log(tail) in log(x).
// - studentized range: double integral by composite Gauss-Legendre quadrature (both tails).

const LN_SQRT_2PI = 0.918938533204672741780329736406; // log(sqrt(2*pi))
const LN_2PI = 1.83787706640934548356065947281;
const SQRT_2PI = 2.50662827463100050241576528481;
const INV_SQRT_2PI = 0.398942280401432677939946059934;
const DBL_EPS = 2.220446049250313e-16;
const DBL_MIN = 2.2250738585072014e-308;
const FPMIN = 1e-300;

// ---------------------------------------------------------------------------------------------
// Gamma function family
// ---------------------------------------------------------------------------------------------

const LANCZOS_G = 607 / 128;
const LANCZOS_C = [
  0.99999999999999709182, 57.156235665862923517, -59.597960355475491248, 14.136097974741747174,
  -0.49191381609762019978, 0.33994649984811888699e-4, 0.46523628927048575665e-4,
  -0.98374475304879564677e-4, 0.15808870322491248884e-3, -0.21026444172410488319e-3,
  0.2174396181152126432e-3, -0.16431810653676389022e-3, 0.84418223983852743293e-4,
  -0.2619083840158140867e-4, 0.36899182659531622704e-5,
];

/** Stirling series coefficients B_{2k} / (2k (2k-1)). */
const STIRLING = [
  1 / 12, -1 / 360, 1 / 1260, -1 / 1680, 1 / 1188, -691 / 360360, 1 / 156, -3617 / 122400,
];

/**
 * stirlerr(n) = log(Gamma(n+1)) - (n + 1/2) log(n) + n - log(sqrt(2 pi)): the error of Stirling's
 * formula, computed without cancellation. Valid for n > 0 (non-integer allowed).
 */
export function stirlerr(n: number): number {
  if (!(n > 0)) return n === 0 ? 0 : NaN;
  if (n >= 15) {
    const nn = 1 / (n * n);
    let s = 0;
    const terms = n > 500 ? 3 : n > 80 ? 4 : n > 35 ? 6 : 8;
    for (let k = terms - 1; k >= 0; k--) s = s * nn + STIRLING[k];
    return s / n;
  }
  // Upward recurrence: stirlerr(n) = stirlerr(n+1) + (n + 1/2) log1p(1/n) - 1.
  const m = Math.ceil(15 - n);
  let acc = 0;
  for (let j = 0; j < m; j++) {
    const z = n + j;
    acc += (z + 0.5) * Math.log1p(1 / z) - 1;
  }
  return stirlerr(n + m) + acc;
}

/** Natural log of |Gamma(x)|. */
export function lnGamma(x: number): number {
  if (Number.isNaN(x)) return NaN;
  if (x === Infinity) return Infinity;
  if (x <= 0 && Number.isInteger(x)) return Infinity;
  if (x < 0.5) {
    // Reflection: Gamma(x) Gamma(1-x) = pi / sin(pi x)
    const s = Math.sin(Math.PI * x);
    return Math.log(Math.PI / Math.abs(s)) - lnGamma(1 - x);
  }
  if (x >= 15) return stirlerr(x) + (x - 0.5) * Math.log(x) - x + LN_SQRT_2PI;
  // Exact at small integers.
  if (Number.isInteger(x) && x <= 15) {
    let f = 1;
    for (let i = 2; i < x; i++) f *= i;
    return Math.log(f);
  }
  const z = x - 1;
  let sum = LANCZOS_C[0];
  for (let i = 1; i < LANCZOS_C.length; i++) sum += LANCZOS_C[i] / (z + i);
  const t = z + LANCZOS_G + 0.5;
  return LN_SQRT_2PI + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}

/** log(Beta(a, b)). */
export function lnBeta(a: number, b: number): number {
  return lnGamma(a) + lnGamma(b) - lnGamma(a + b);
}

/**
 * Deviance term bd0(x, np) = x log(x/np) + np - x, computed stably (Loader 2000).
 */
function bd0(x: number, np: number): number {
  if (Math.abs(x - np) < 0.1 * (x + np)) {
    let v = (x - np) / (x + np);
    let s = (x - np) * v;
    if (Math.abs(s) < DBL_MIN) return s;
    let ej = 2 * x * v;
    v = v * v;
    for (let j = 1; j < 1000; j++) {
      ej *= v;
      const s1 = s + ej / (2 * j + 1);
      if (s1 === s) return s1;
      s = s1;
    }
  }
  return x * Math.log(x / np) + np - x;
}

/**
 * log of the binomial density with real-valued x and n (Loader's saddle-point form), with both
 * p and q = 1 - p supplied so neither needs to be formed by subtraction.
 */
function logDbinomRaw(x: number, n: number, p: number, q: number): number {
  if (p === 0) return x === 0 ? 0 : -Infinity;
  if (q === 0) return x === n ? 0 : -Infinity;
  if (x === 0) {
    if (n === 0) return 0;
    return p < 0.1 ? -bd0(n, n * q) - n * p : n * Math.log(q);
  }
  if (x === n) return q < 0.1 ? -bd0(n, n * p) - n * q : n * Math.log(p);
  if (x < 0 || x > n) return -Infinity;
  const lc = stirlerr(n) - stirlerr(x) - stirlerr(n - x) - bd0(x, n * p) - bd0(n - x, n * q);
  const lf = LN_2PI + Math.log(x) + Math.log1p(-x / n);
  return lc - 0.5 * lf;
}

/** log of x^a e^{-x} / Gamma(a+1) (Poisson density with real a), Loader's form. */
function logDpoisRaw(a: number, lambda: number): number {
  if (lambda === 0) return a === 0 ? 0 : -Infinity;
  if (!Number.isFinite(lambda)) return -Infinity;
  if (a < 0) return -Infinity;
  if (a <= lambda * DBL_MIN) return -lambda;
  if (lambda < a * DBL_MIN) return -lambda + a * Math.log(lambda) - lnGamma(a + 1);
  return -stirlerr(a) - bd0(a, lambda) - 0.5 * Math.log(2 * Math.PI * a);
}

// ---------------------------------------------------------------------------------------------
// Incomplete gamma
// ---------------------------------------------------------------------------------------------

interface TailPair {
  /** lower tail */
  p: number;
  /** upper tail */
  q: number;
}

function incGamma(a: number, x: number): TailPair {
  if (Number.isNaN(a) || Number.isNaN(x) || a <= 0) return { p: NaN, q: NaN };
  if (x <= 0) return { p: 0, q: 1 };
  if (x === Infinity) return { p: 1, q: 0 };
  const ld = logDpoisRaw(a, x); // log(x^a e^-x / Gamma(a+1))
  if (x < a + 1) {
    // Series: P = dpois(a, x) * (1 + x/(a+1) + x^2/((a+1)(a+2)) + ...)
    let term = 1;
    let sum = 1;
    for (let n = 1; n < 100000; n++) {
      term *= x / (a + n);
      sum += term;
      if (term < sum * 1e-17) break;
    }
    const p = Math.exp(ld + Math.log(sum));
    return { p, q: 1 - p };
  }
  // Continued fraction for Q (modified Lentz): Q = x^a e^-x / Gamma(a) * h
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-16) break;
  }
  const q = Math.exp(ld + Math.log(a) + Math.log(h));
  return { p: 1 - q, q };
}

/** Regularised lower incomplete gamma P(a, x). */
export function regIncGammaP(a: number, x: number): number {
  return incGamma(a, x).p;
}
/** Regularised upper incomplete gamma Q(a, x) = 1 - P(a, x), accurate in the upper tail. */
export function regIncGammaQ(a: number, x: number): number {
  return incGamma(a, x).q;
}

// ---------------------------------------------------------------------------------------------
// Incomplete beta
// ---------------------------------------------------------------------------------------------

/**
 * Continued fraction part of I_x(a,b) (Numerical Recipes betacf, modified Lentz). y = 1 - x is
 * used for the leading term so it does not cancel when a is large and x is near 1.
 */
function betacf(x: number, y: number, a: number, b: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  // 1 - (a+b) x / (a+1) = (a y + 1 - b x) / (a + 1)
  let d = (a * y + 1 - b * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m < 200000; m++) {
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
    if (Math.abs(del - 1) < 1e-16) break;
  }
  return h;
}

/**
 * bd0(x, np) with the difference d = x - np also supplied by the caller (accurate in absolute
 * terms): the series branch uses d, the direct branch uses np (accurate in relative terms).
 */
function bd0d(x: number, np: number, d: number): number {
  if (x === 0) return np;
  if (Math.abs(d) < 0.1 * (x + np)) {
    let v = d / (x + np);
    let s = d * v;
    if (Math.abs(s) < DBL_MIN) return s;
    let ej = 2 * x * v;
    v = v * v;
    for (let j = 1; j < 1000; j++) {
      ej *= v;
      const s1 = s + ej / (2 * j + 1);
      if (s1 === s) return s1;
      s = s1;
    }
    return s;
  }
  return x * Math.log(x / np) + np - x;
}

/**
 * log( x^a y^b Gamma(a+b+1) / (Gamma(a+1) Gamma(b+1)) ) in Loader's saddle-point form. The
 * deviance terms take a - (a+b) x = a y - b x, formed from both x and y, so the result keeps full
 * relative accuracy when a or b is huge (t with large df, F with large df2).
 */
function logBetaKernel(x: number, y: number, a: number, b: number): number {
  const n = a + b;
  const dA = a * y - b * x; // a - n x
  const lc = stirlerr(n) - stirlerr(a) - stirlerr(b) - bd0d(a, n * x, dA) - bd0d(b, n * y, -dA);
  return lc + 0.5 * (Math.log(n) - Math.log(a) - Math.log(b) - LN_2PI);
}

/**
 * Power series I_x(a,b) = x^a y^b / (a B(a,b)) * 2F1(a+b, 1; a+1; x). All terms are positive, so
 * it is accurate whenever it converges quickly. Returns NaN if it needs more than `maxTerms`.
 */
function logIbetaSeries(x: number, y: number, a: number, b: number, maxTerms: number): number {
  let term = 1;
  let sum = 1;
  let k = 0;
  for (; k < maxTerms; k++) {
    term *= ((a + b + k) * x) / (a + 1 + k);
    sum += term;
    if (term < sum * 1e-17) break;
  }
  if (k >= maxTerms) return NaN;
  return Math.log(b / (a + b)) + logBetaKernel(x, y, a, b) + Math.log(sum);
}

/** log I_x(a,b) by the continued fraction: I = x^a y^b / (a B(a,b)) * cf. */
function logIbetaCF(x: number, y: number, a: number, b: number): number {
  return Math.log(b / (a + b)) + logBetaKernel(x, y, a, b) + Math.log(betacf(x, y, a, b));
}

/**
 * Both tails of the regularised incomplete beta, given x and y = 1 - x separately (so callers can
 * supply y without cancellation). Method choice:
 * 1. the tail on the near side of the mean (x < (a+1)/(a+b+2) means the lower tail) by the
 *    all-positive power series when it converges within a few thousand terms;
 * 2. otherwise the opposite tail by its power series, when that leaves at least
 *    min(1e-3, 30 / max(a, b)) for this tail (the subtraction then costs fewer digits than the
 *    continued fraction would lose for huge parameters);
 * 3. otherwise the continued fraction on the near-side tail.
 */
function incBeta(x: number, y: number, a: number, b: number): TailPair {
  if (Number.isNaN(x) || Number.isNaN(a) || Number.isNaN(b) || a <= 0 || b <= 0) return { p: NaN, q: NaN };
  if (x <= 0) return { p: 0, q: 1 };
  if (y <= 0) return { p: 1, q: 0 };
  const lowerNear = x < (a + 1) / (a + b + 2);
  const nx = lowerNear ? x : y;
  const ny = lowerNear ? y : x;
  const na = lowerNear ? a : b;
  const nb = lowerNear ? b : a;
  const pack = (near: number): TailPair => (lowerNear ? { p: near, q: 1 - near } : { p: 1 - near, q: near });
  const ls = logIbetaSeries(nx, ny, na, nb, 3000);
  if (!Number.isNaN(ls)) return pack(Math.exp(ls));
  const lo = logIbetaSeries(ny, nx, nb, na, 3000);
  if (!Number.isNaN(lo)) {
    const other = Math.exp(lo);
    // The continued fraction loses roughly a * eps / 50 relative accuracy for huge a; prefer the
    // complement whenever it is expected to be more accurate.
    if (1 - other >= Math.min(1e-3, 30 / Math.max(na, nb))) return pack(1 - other);
  }
  return pack(Math.exp(logIbetaCF(nx, ny, na, nb)));
}

/** Regularised incomplete beta I_x(a, b). */
export function regIncBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return incBeta(x, 1 - x, a, b).p;
}

/** Upper tail 1 - I_x(a, b), accurate when small. */
export function regIncBetaUpper(x: number, a: number, b: number): number {
  if (x <= 0) return 1;
  if (x >= 1) return 0;
  return incBeta(x, 1 - x, a, b).q;
}

// ---------------------------------------------------------------------------------------------
// Normal
// ---------------------------------------------------------------------------------------------

const CODY_A = [2.2352520354606839287, 161.02823106855587881, 1067.6894854603709582, 18154.981253343561249, 0.065682337918207449113];
const CODY_B = [47.20258190468824187, 976.09855173777669322, 10260.932208618978205, 45507.789335026729956];
const CODY_C = [
  0.39894151208813466764, 8.8831497943883759412, 93.506656132177855979, 597.27027639480026226,
  2494.5375852903726711, 6848.1904505362823326, 11602.651437647350124, 9842.7148383839780218,
  1.0765576773720192317e-8,
];
const CODY_D = [
  22.266688044328115691, 235.38790178262499861, 1519.377599407554805, 6485.558298266760755,
  18615.571640885098091, 34900.952721145977266, 38912.003286093271411, 19685.429676859990727,
];
const CODY_P = [0.21589853405795699, 0.1274011611602473639, 0.022235277870649807, 0.001421619193227893466, 2.9112874951168792e-5, 0.02307344176494017303];
const CODY_Q = [1.28426009614491121, 0.468238212480865118, 0.0659881378689285515, 0.00378239633202758244, 7.29751555083966205e-5];

/** Returns [lower, upper] normal tail probabilities at x. */
function normalBoth(x: number): [number, number] {
  if (Number.isNaN(x)) return [NaN, NaN];
  const y = Math.abs(x);
  let cum: number;
  let ccum: number;
  if (y <= 0.67448975) {
    let xnum = 0;
    let xden = 0;
    if (y > DBL_EPS * 0.5) {
      const xsq = x * x;
      xnum = CODY_A[4] * xsq;
      xden = xsq;
      for (let i = 0; i < 3; i++) {
        xnum = (xnum + CODY_A[i]) * xsq;
        xden = (xden + CODY_B[i]) * xsq;
      }
    }
    const temp = (x * (xnum + CODY_A[3])) / (xden + CODY_B[3]);
    return [0.5 + temp, 0.5 - temp];
  }
  const tailFromTemp = (temp: number, X: number): [number, number] => {
    const xsq = Math.trunc(X * 16) / 16;
    const del = (X - xsq) * (X + xsq);
    const c = Math.exp(-xsq * xsq * 0.5) * Math.exp(-del * 0.5) * temp;
    return [c, 1 - c];
  };
  if (y <= 5.656854249492380195206754896838) {
    let xnum = CODY_C[8] * y;
    let xden = y;
    for (let i = 0; i < 7; i++) {
      xnum = (xnum + CODY_C[i]) * y;
      xden = (xden + CODY_D[i]) * y;
    }
    const temp = (xnum + CODY_C[7]) / (xden + CODY_D[7]);
    [cum, ccum] = tailFromTemp(temp, y);
  } else if (y < 38.5) {
    const xsq = 1 / (x * x);
    let xnum = CODY_P[5] * xsq;
    let xden = xsq;
    for (let i = 0; i < 4; i++) {
      xnum = (xnum + CODY_P[i]) * xsq;
      xden = (xden + CODY_Q[i]) * xsq;
    }
    let temp = (xsq * (xnum + CODY_P[4])) / (xden + CODY_Q[4]);
    temp = (INV_SQRT_2PI - temp) / y;
    [cum, ccum] = tailFromTemp(temp, y);
  } else {
    cum = 0;
    ccum = 1;
  }
  return x > 0 ? [ccum, cum] : [cum, ccum];
}

export function normalCdf(z: number): number {
  return normalBoth(z)[0];
}
export function normalSf(z: number): number {
  return normalBoth(z)[1];
}
export function normalPdf(z: number): number {
  return INV_SQRT_2PI * Math.exp(-0.5 * z * z);
}

const ACK_A = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
const ACK_B = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
const ACK_C = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
const ACK_D = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

/** Lower-tail quantile for p <= 0.5 (returns z <= 0). */
function normalPpfLower(p: number): number {
  let x: number;
  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((ACK_C[0] * q + ACK_C[1]) * q + ACK_C[2]) * q + ACK_C[3]) * q + ACK_C[4]) * q + ACK_C[5]) /
      ((((ACK_D[0] * q + ACK_D[1]) * q + ACK_D[2]) * q + ACK_D[3]) * q + 1);
  } else {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((ACK_A[0] * r + ACK_A[1]) * r + ACK_A[2]) * r + ACK_A[3]) * r + ACK_A[4]) * r + ACK_A[5]) * q) /
      (((((ACK_B[0] * r + ACK_B[1]) * r + ACK_B[2]) * r + ACK_B[3]) * r + ACK_B[4]) * r + 1);
  }
  // Halley refinement on the exact CDF, in relative form so extreme tails do not underflow.
  for (let it = 0; it < 2; it++) {
    const cdf = normalCdf(x);
    const pdf = normalPdf(x);
    if (!(pdf > 0)) break;
    const u = (cdf / p - 1) * (p / pdf);
    x = x - u / (1 + (x * u) / 2);
  }
  return x;
}

export function normalPpf(p: number): number {
  if (Number.isNaN(p) || p < 0 || p > 1) return NaN;
  if (p === 0) return -Infinity;
  if (p === 1) return Infinity;
  if (p === 0.5) return 0;
  if (p < 0.5) return normalPpfLower(p);
  return -normalPpfLower(1 - p);
}

// ---------------------------------------------------------------------------------------------
// Student t
// ---------------------------------------------------------------------------------------------

/** Returns [lower, upper] tails of the t distribution. */
function tBoth(t: number, df: number): [number, number] {
  if (Number.isNaN(t) || Number.isNaN(df) || df <= 0) return [NaN, NaN];
  if (df === Infinity) return normalBoth(t);
  if (t === Infinity) return [1, 0];
  if (t === -Infinity) return [0, 1];
  const t2 = t * t;
  // P(|T| > |t|) = I_x(df/2, 1/2), x = df / (df + t^2); y = t^2 / (df + t^2)
  let x: number;
  let y: number;
  if (t2 > df) {
    const r = df / t2;
    x = r / (1 + r);
    y = 1 / (1 + r);
  } else {
    const r = t2 / df;
    x = 1 / (1 + r);
    y = r / (1 + r);
  }
  const ib = incBeta(x, y, df / 2, 0.5);
  const tail = 0.5 * ib.p; // one-sided tail beyond |t|
  const body = 0.5 + 0.5 * ib.q; // P(T < |t|)
  return t > 0 ? [body, tail] : [tail, body];
}

export function tCdf(t: number, df: number): number {
  return tBoth(t, df)[0];
}
export function tSf(t: number, df: number): number {
  return tBoth(t, df)[1];
}
export function tPdf(t: number, df: number): number {
  if (df === Infinity) return normalPdf(t);
  // Loader-style: avoid lgamma differences for large df.
  const lg = lnGamma((df + 1) / 2) - lnGamma(df / 2);
  return Math.exp(lg - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log1p((t * t) / df));
}

// ---------------------------------------------------------------------------------------------
// Chi-square
// ---------------------------------------------------------------------------------------------

export function chi2Cdf(x: number, df: number): number {
  if (x <= 0) return df > 0 ? 0 : NaN;
  return incGamma(df / 2, x / 2).p;
}
export function chi2Sf(x: number, df: number): number {
  if (x <= 0) return df > 0 ? 1 : NaN;
  return incGamma(df / 2, x / 2).q;
}
export function chi2Pdf(x: number, df: number): number {
  if (x < 0) return 0;
  if (x === 0) return df === 2 ? 0.5 : df < 2 ? Infinity : 0;
  const a = df / 2;
  // x^(a-1) e^{-x/2} / (2^a Gamma(a)) = dpois(a-1; x/2) / 2 for a > 1
  if (a > 1) return 0.5 * Math.exp(logDpoisRaw(a - 1, x / 2));
  return Math.exp((a - 1) * Math.log(x) - x / 2 - a * Math.LN2 - lnGamma(a));
}

// ---------------------------------------------------------------------------------------------
// F
// ---------------------------------------------------------------------------------------------

function fBoth(x: number, df1: number, df2: number): [number, number] {
  if (Number.isNaN(x) || !(df1 > 0) || !(df2 > 0)) return [NaN, NaN];
  if (x <= 0) return [0, 1];
  if (x === Infinity) return [1, 0];
  if (df2 === Infinity) {
    const r = incGamma(df1 / 2, (df1 * x) / 2);
    return [r.p, r.q];
  }
  // I_u(df1/2, df2/2), u = df1 x / (df1 x + df2)
  const s = df1 * x + df2;
  const u = (df1 * x) / s;
  const v = df2 / s;
  const r = incBeta(u, v, df1 / 2, df2 / 2);
  return [r.p, r.q];
}

export function fCdf(x: number, df1: number, df2: number): number {
  return fBoth(x, df1, df2)[0];
}
export function fSf(x: number, df1: number, df2: number): number {
  return fBoth(x, df1, df2)[1];
}
export function fPdf(x: number, df1: number, df2: number): number {
  if (x < 0) return 0;
  if (x === 0) return df1 === 2 ? 1 : df1 < 2 ? Infinity : 0;
  const a = df1 / 2;
  const b = df2 / 2;
  const la = a * Math.log(df1) + b * Math.log(df2) + (a - 1) * Math.log(x) - (a + b) * Math.log(df1 * x + df2) - lnBeta(a, b);
  return Math.exp(la);
}

// ---------------------------------------------------------------------------------------------
// Quantile solver: safeguarded Newton on log(tail) with respect to log(x), x > 0.
// ---------------------------------------------------------------------------------------------

function solvePositive(
  tail: (x: number) => number,
  pdf: (x: number) => number,
  target: number,
  upper: boolean,
  x0: number,
): number {
  let u = Math.log(x0 > 0 && Number.isFinite(x0) ? x0 : 1);
  let lo = -Infinity;
  let hi = Infinity;
  const logTarget = Math.log(target);
  let step = 1;
  for (let it = 0; it < 400; it++) {
    const x = Math.exp(u);
    const T = tail(x);
    if (T === target) return x;
    const h = Math.log(T) - logTarget; // may be +-Infinity
    // Update bracket in u-space.
    const tooBig = h > 0;
    if (upper ? tooBig : !tooBig) lo = u;
    else hi = u;
    let uNew: number;
    const dens = pdf(x);
    const dh = ((upper ? -1 : 1) * dens * x) / T;
    if (Number.isFinite(h) && Number.isFinite(dh) && dh !== 0) uNew = u - h / dh;
    else uNew = NaN;
    if (!(uNew > lo && uNew < hi)) {
      if (Number.isFinite(lo) && Number.isFinite(hi)) uNew = 0.5 * (lo + hi);
      else if (Number.isFinite(lo)) {
        uNew = lo + step;
        step *= 2;
      } else {
        uNew = hi - step;
        step *= 2;
      }
    }
    const du = Math.abs(uNew - u);
    u = uNew;
    if (du < 4e-16 * Math.max(1, Math.abs(u)) || hi - lo < 4e-16 * Math.max(1, Math.abs(u))) break;
  }
  return Math.exp(u);
}

export function tPpf(p: number, df: number): number {
  if (Number.isNaN(p) || Number.isNaN(df) || p < 0 || p > 1 || !(df > 0)) return NaN;
  if (p === 0) return -Infinity;
  if (p === 1) return Infinity;
  if (p === 0.5) return 0;
  if (df === Infinity) return normalPpf(p);
  const lowerSide = p < 0.5;
  const tp = lowerSide ? p : 1 - p; // one-sided tail target, <= 0.5
  let x: number;
  if (df === 1) {
    x = 1 / Math.tan(Math.PI * tp); // Cauchy: cot(pi p), no cancellation for small p
  } else if (df === 2) {
    // t = (1 - 2a) / sqrt(2 a (1 - a)) with a = tp
    x = (1 - 2 * tp) / Math.sqrt(2 * tp * (1 - tp));
  } else {
    // Initial guess: Cornish-Fisher expansion from the normal quantile, else power-tail approximation.
    const z = -normalPpf(tp);
    const g1 = (z * z * z + z) / 4;
    const g2 = (5 * z ** 5 + 16 * z ** 3 + 3 * z) / 96;
    let guess = z + g1 / df + g2 / (df * df);
    // Heavy-tail guess: P(T > t) ~ C t^-df
    if (!(guess > 0) || df < 3) {
      const lc = lnGamma((df + 1) / 2) - lnGamma(df / 2) - 0.5 * Math.log(df * Math.PI) + ((df - 1) / 2) * Math.log(df) - Math.log(df);
      guess = Math.exp((lc - Math.log(tp)) / df);
    }
    x = solvePositive((t) => tSf(t, df), (t) => tPdf(t, df), tp, true, guess);
  }
  return lowerSide ? -x : x;
}

export function chi2Ppf(p: number, df: number): number {
  if (Number.isNaN(p) || p < 0 || p > 1 || !(df > 0)) return NaN;
  if (p === 0) return 0;
  if (p === 1) return Infinity;
  // Wilson-Hilferty initial guess
  const z = normalPpf(p);
  const c = 2 / (9 * df);
  let guess = df * Math.pow(1 - c + z * Math.sqrt(c), 3);
  if (!(guess > 0) || guess < 0.1 * df) {
    // Small-x behaviour: P(a, x/2) ~ (x/2)^a / Gamma(a+1)
    const a = df / 2;
    guess = 2 * Math.exp((Math.log(p) + lnGamma(a + 1)) / a);
  }
  if (p <= 0.5) return solvePositive((x) => chi2Cdf(x, df), (x) => chi2Pdf(x, df), p, false, guess);
  return solvePositive((x) => chi2Sf(x, df), (x) => chi2Pdf(x, df), 1 - p, true, guess);
}

export function fPpf(p: number, df1: number, df2: number): number {
  if (Number.isNaN(p) || p < 0 || p > 1 || !(df1 > 0) || !(df2 > 0)) return NaN;
  if (p === 0) return 0;
  if (p === 1) return Infinity;
  // Initial guess: chi-square approximation (exact as df2 -> infinity).
  let guess = chi2Ppf(p, df1) / df1;
  if (!(guess > 0) || !Number.isFinite(guess)) guess = 1;
  if (p <= 0.5) return solvePositive((x) => fCdf(x, df1, df2), (x) => fPdf(x, df1, df2), p, false, guess);
  return solvePositive((x) => fSf(x, df1, df2), (x) => fPdf(x, df1, df2), 1 - p, true, guess);
}

// ---------------------------------------------------------------------------------------------
// Studentized range
// ---------------------------------------------------------------------------------------------
//
// P(Q <= q) = integral over s of f_nu(s) W(q s), where s = chi_nu / sqrt(nu) and W(w) is the
// probability that the range of k independent standard normals is below w:
//   W(w) = k * integral phi(z) [Phi(z) - Phi(z - w)]^(k-1) dz.
// The upper tail uses 1 - W(w) = k * integral phi(z) (a^(k-1) - b^(k-1)) dz with a = Phi(z),
// b = a - Phi(z - w), expanded as Phi(z - w) * sum a^(k-2-i) b^i, so there is no cancellation.
// Both integrals use composite Gauss-Legendre quadrature (the integrands are smooth), and the outer
// integral runs over log(s) with self-normalised weights. Accuracy is about 1e-12 absolute and
// good relative accuracy in the upper tail down to ~1e-40.

function gaussLegendre(n: number): { x: number[]; w: number[] } {
  const x: number[] = new Array(n);
  const w: number[] = new Array(n);
  const m = Math.floor((n + 1) / 2);
  for (let i = 0; i < m; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5));
    let pp = 0;
    for (let it = 0; it < 100; it++) {
      let p1 = 1;
      let p2 = 0;
      for (let j = 1; j <= n; j++) {
        const p3 = p2;
        p2 = p1;
        p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j;
      }
      pp = (n * (z * p1 - p2)) / (z * z - 1);
      const z1 = z;
      z = z1 - p1 / pp;
      if (Math.abs(z - z1) < 1e-16) break;
    }
    x[i] = -z;
    x[n - 1 - i] = z;
    w[i] = 2 / ((1 - z * z) * pp * pp);
    w[n - 1 - i] = w[i];
  }
  return { x, w };
}

const GL = gaussLegendre(16);

/** Nodes and weights of a composite Gauss-Legendre rule on [a, b]. */
function compositeRule(a: number, b: number, pieces: number): { z: Float64Array; w: Float64Array } {
  const n = GL.x.length;
  const z = new Float64Array(pieces * n);
  const w = new Float64Array(pieces * n);
  const h = (b - a) / pieces;
  for (let p = 0; p < pieces; p++) {
    const mid = a + (p + 0.5) * h;
    for (let i = 0; i < n; i++) {
      z[p * n + i] = mid + 0.5 * h * GL.x[i];
      w[p * n + i] = 0.5 * h * GL.w[i];
    }
  }
  return { z, w };
}

interface RangeRule {
  /** lower-tail grid on [-9.5, 9.5] with phi(z) * weight and Phi(z) precomputed */
  z: Float64Array;
  pw: Float64Array;
  cdf: Float64Array;
  /** upper-tail rule on [-9.5, 9.5], shifted by w/2 at use */
  uz: Float64Array;
  uw: Float64Array;
  /** outer cut points in units of the log-scale standard deviation */
  cuts: number[];
}

function makeRangeRule(panels: number, cuts: number[]): RangeRule {
  const { z, w } = compositeRule(-9.5, 9.5, panels);
  const pw = new Float64Array(z.length);
  const cdf = new Float64Array(z.length);
  for (let i = 0; i < z.length; i++) {
    pw[i] = w[i] * normalPdf(z[i]);
    cdf[i] = normalCdf(z[i]);
  }
  return { z, pw, cdf, uz: z, uw: w, cuts };
}

/** Full accuracy (about 1e-12 absolute) and a cheaper rule (about 1e-7) used to bracket quantiles. */
const RANGE_FULL = makeRangeRule(10, [-40, -20, -12, -8, -5, -3, -1.5, 0, 1.5, 3, 5, 8, 12]);
const RANGE_FAST = makeRangeRule(5, [-20, -8, -3, 0, 3, 8]);

/** [W(w), 1 - W(w)] for the range of k standard normals. */
function rangeProbs(w: number, k: number, rule: RangeRule): [number, number] {
  if (w <= 0) return [0, 1];
  const km1 = k - 1;
  // Lower: W(w) = k * integral phi(z) [Phi(z) - Phi(z - w)]^(k-1) dz
  let W = 0;
  const { z, pw, cdf } = rule;
  for (let i = 0; i < z.length; i++) {
    const d = cdf[i] - normalCdf(z[i] - w);
    if (d > 0) W += pw[i] * Math.pow(d, km1);
  }
  W *= k;
  if (W <= 0.5) return [W, 1 - W];
  // Upper: 1 - W(w) = k * integral phi(z) Phi(z - w) sum_i a^(k-2-i) b^i dz, centred on w/2.
  let R = 0;
  const shift = w / 2;
  const { uz, uw } = rule;
  for (let i = 0; i < uz.length; i++) {
    const zz = uz[i] + shift;
    const a = normalCdf(zz);
    const c = normalCdf(zz - w);
    const b = Math.max(0, a - c);
    let sum = 0;
    let term = Math.pow(a, km1 - 1);
    const ratio = a > 0 ? b / a : 0;
    for (let j = 0; j < km1; j++) {
      sum += term;
      term *= ratio;
    }
    R += uw[i] * normalPdf(zz) * c * sum;
  }
  R *= k;
  return [1 - R, R];
}

function studentizedRangeBoth(q: number, k: number, df: number, rule: RangeRule = RANGE_FULL): [number, number] {
  if (Number.isNaN(q) || Number.isNaN(k) || Number.isNaN(df) || k < 2 || !(df > 0)) return [NaN, NaN];
  if (q <= 0) return [0, 1];
  if (q === Infinity) return [1, 0];
  if (df === Infinity || df > 1e7) return rangeProbs(q, k, rule);
  // Outer integral over t = log(s): weight exp(nu * (t - expm1(2t)/2)) (peak 1 at t = 0).
  const logw = (t: number) => df * (t - Math.expm1(2 * t) / 2);
  const T = 200;
  const root = (sign: number) => {
    let a = 0;
    let b = sign;
    while (logw(b) > -T) b *= 2;
    for (let i = 0; i < 200; i++) {
      const m = 0.5 * (a + b);
      if (logw(m) > -T) a = m;
      else b = m;
      if (Math.abs(b - a) < 1e-12) break;
    }
    return 0.5 * (a + b);
  };
  const tlo = root(-1);
  const thi = root(1);
  // One Gauss-Legendre panel per segment; segments are denser near the peak (sd of log s).
  const sd = 1 / Math.sqrt(2 * df);
  const cuts = [tlo];
  for (const m of rule.cuts) {
    const c = m * sd;
    if (c > tlo && c < thi) cuts.push(c);
  }
  cuts.push(thi);
  let norm = 0;
  let lowSum = 0;
  let upSum = 0;
  for (let c = 0; c + 1 < cuts.length; c++) {
    const a = cuts[c];
    const b = cuts[c + 1];
    const mid = 0.5 * (a + b);
    const half = 0.5 * (b - a);
    for (let i = 0; i < GL.x.length; i++) {
      const t = mid + half * GL.x[i];
      const wt = GL.w[i] * half * Math.exp(logw(t));
      if (wt === 0) continue;
      const [lo, up] = rangeProbs(q * Math.exp(t), k, rule);
      norm += wt;
      lowSum += wt * lo;
      upSum += wt * up;
    }
  }
  return [lowSum / norm, upSum / norm];
}

/** CDF of the studentized range distribution (k means, df error degrees of freedom; df may be Infinity). */
export function studentizedRangeCdf(q: number, k: number, df: number): number {
  return studentizedRangeBoth(q, k, df)[0];
}

/** Upper tail of the studentized range distribution (Tukey HSD / Games-Howell p-values). */
export function studentizedRangeSf(q: number, k: number, df: number): number {
  return studentizedRangeBoth(q, k, df)[1];
}

/** Quantile of the studentized range (Tukey HSD and Games-Howell confidence intervals). */
export function studentizedRangePpf(p: number, k: number, df: number): number {
  if (!(p > 0 && p < 1) || !(k >= 2) || !(df > 0)) return p === 0 ? 0 : p === 1 ? Infinity : NaN;
  // Work on the smaller tail for accuracy: g(q) = tail(q) - target, decreasing for the upper tail.
  const upper = p > 0.5;
  const target = upper ? 1 - p : p;
  const g = (q: number, rule: RangeRule) => {
    const [lo, up] = studentizedRangeBoth(q, k, df, rule);
    return upper ? target - up : lo - target; // increasing in q either way
  };
  // Stage 1: bracket and solve with the cheap rule.
  const solve = (rule: RangeRule, a0: number, b0: number, tol: number) => {
    let a = a0;
    let b = b0;
    let fa = g(a, rule);
    let fb = g(b, rule);
    while (fb < 0) {
      a = b;
      fa = fb;
      b *= 2;
      if (b > 1e6) return Infinity;
      fb = g(b, rule);
    }
    while (fa > 0 && a > 1e-8) {
      b = a;
      fb = fa;
      a /= 2;
      fa = g(a, rule);
    }
    let side = 0;
    let c = 0.5 * (a + b);
    for (let it = 0; it < 100; it++) {
      c = (a * fb - b * fa) / (fb - fa);
      if (!(c > a && c < b)) c = 0.5 * (a + b);
      const fc = g(c, rule);
      if (fc === 0 || Math.abs(b - a) < tol * c) return c;
      if (fc > 0) {
        b = c;
        fb = fc;
        if (side === -1) fa /= 2;
        side = -1;
      } else {
        a = c;
        fa = fc;
        if (side === 1) fb /= 2;
        side = 1;
      }
      if (Math.abs(fc) < 1e-14 * Math.max(target, 1e-300) && rule === RANGE_FULL) return c;
    }
    return c;
  };
  const rough = solve(RANGE_FAST, 1, 4, 1e-9);
  if (!Number.isFinite(rough)) return rough;
  // Stage 2: polish with the full rule inside a tight bracket.
  return solve(RANGE_FULL, rough * (1 - 1e-5), rough * (1 + 1e-5), 1e-14);
}

// ---------------------------------------------------------------------------------------------
// Discrete distributions
// ---------------------------------------------------------------------------------------------

export function binomialPmf(k: number, n: number, p: number): number {
  if (Number.isNaN(k) || Number.isNaN(n) || Number.isNaN(p) || p < 0 || p > 1 || n < 0) return NaN;
  if (!Number.isInteger(k) || k < 0 || k > n) return 0;
  return Math.exp(logDbinomRaw(k, n, p, 1 - p));
}

/** log P(X = k) for X ~ Binomial(n, p). */
export function binomialLogPmf(k: number, n: number, p: number): number {
  if (!Number.isInteger(k) || k < 0 || k > n) return -Infinity;
  return logDbinomRaw(k, n, p, 1 - p);
}

/** P(X <= k) for X ~ Binomial(n, p). */
export function binomialCdf(k: number, n: number, p: number): number {
  if (Number.isNaN(k) || Number.isNaN(n) || Number.isNaN(p) || p < 0 || p > 1 || n < 0) return NaN;
  k = Math.floor(k + 1e-7);
  if (k < 0) return 0;
  if (k >= n) return 1;
  if (p === 0) return 1;
  if (p === 1) return 0;
  // P(X <= k) = I_{1-p}(n-k, k+1)
  return incBeta(1 - p, p, n - k, k + 1).p;
}

/** P(X >= k) for X ~ Binomial(n, p), accurate in the upper tail. */
export function binomialSfInclusive(k: number, n: number, p: number): number {
  k = Math.ceil(k - 1e-7);
  if (k <= 0) return 1;
  if (k > n) return 0;
  if (p === 0) return 0;
  if (p === 1) return 1;
  // P(X >= k) = I_p(k, n-k+1)
  return incBeta(p, 1 - p, k, n - k + 1).p;
}

/**
 * Hypergeometric pmf: probability of k successes in n draws without replacement from a
 * population of N containing K successes.
 */
export function hypergeomPmf(k: number, N: number, K: number, n: number): number {
  return Math.exp(hypergeomLogPmf(k, N, K, n));
}

export function hypergeomLogPmf(k: number, N: number, K: number, n: number): number {
  if (!Number.isInteger(k) || k < Math.max(0, n - (N - K)) || k > Math.min(n, K)) return -Infinity;
  if (n === 0 || n === N) return k === (n === 0 ? 0 : K) ? 0 : -Infinity;
  const p = n / N;
  const q = (N - n) / N;
  const d1 = logDbinomRaw(k, K, p, q);
  const d2 = logDbinomRaw(n - k, N - K, p, q);
  const d3 = logDbinomRaw(n, N, p, q);
  return d1 + d2 - d3;
}

// ---------------------------------------------------------------------------------------------
// Convenience
// ---------------------------------------------------------------------------------------------

/** Two-sided p-value for a z or t statistic. */
export function twoSidedP(dist: 'normal' | 't', stat: number, df?: number): number {
  if (Number.isNaN(stat)) return NaN;
  const a = Math.abs(stat);
  if (dist === 'normal') return Math.min(1, 2 * normalSf(a));
  if (df === undefined || !(df > 0)) return NaN;
  if (df === Infinity) return Math.min(1, 2 * normalSf(a));
  if (a === Infinity) return 0;
  const t2 = a * a;
  let x: number;
  let y: number;
  if (t2 > df) {
    const r = df / t2;
    x = r / (1 + r);
    y = 1 / (1 + r);
  } else {
    const r = t2 / df;
    x = 1 / (1 + r);
    y = r / (1 + r);
  }
  return Math.min(1, incBeta(x, y, df / 2, 0.5).p);
}
