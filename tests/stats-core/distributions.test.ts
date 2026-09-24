// Distribution functions vs high-precision references (mpmath at 40 digits; scipy/Boost for very
// large parameters; scipy for the studentized range). Fixture: scripts/oracle/core_oracle_dist.py.
import { describe, expect, it } from 'vitest';
import fx from './fixtures/distributions.json';
import * as D from '../../src/lib/stats/distributions';

/** Relative error, with an absolute floor for values that are essentially zero. */
function relErr(got: number, want: number, floor = 1e-300): number {
  if (want === got) return 0;
  if (!Number.isFinite(want) || !Number.isFinite(got)) return Infinity;
  return Math.abs(got - want) / Math.max(Math.abs(want), floor);
}

function expectRel(got: number, want: number, tol: number, ctx: string) {
  const e = relErr(got, want);
  if (!(e <= tol)) throw new Error(`${ctx}: got ${got}, want ${want}, rel err ${e.toExponential(2)} > ${tol}`);
}

describe('lnGamma', () => {
  it('matches mpmath', () => {
    for (const [x, want] of fx.lnGamma as number[][]) {
      // near the roots at 1 and 2 use absolute error
      const tol = Math.abs(want) < 1e-2 ? 1e-15 / Math.max(Math.abs(want), 1e-300) + 1e-12 : 1e-13;
      if (Math.abs(want) < 1e-2) expect(Math.abs(D.lnGamma(x) - want)).toBeLessThan(2e-16);
      else expectRel(D.lnGamma(x), want, tol, `lnGamma(${x})`);
    }
  });
});

describe('normal', () => {
  it('cdf/sf/pdf', () => {
    for (const [z, lo, up, pdf] of fx.normal as number[][]) {
      expectRel(D.normalCdf(z), lo, 1e-14, `normalCdf(${z})`);
      expectRel(D.normalSf(z), up, 1e-14, `normalSf(${z})`);
      expectRel(D.normalPdf(z), pdf, 1e-13, `normalPdf(${z})`);
    }
  });
  it('ppf', () => {
    for (const [p, want] of fx.normalPpf as number[][]) expectRel(D.normalPpf(p), want, 1e-14, `normalPpf(${p})`);
    expect(D.normalPpf(0.5)).toBe(0);
    expect(D.normalPpf(0)).toBe(-Infinity);
    expect(D.normalPpf(1)).toBe(Infinity);
  });
});

describe('t', () => {
  it('cdf/sf incl. extreme df and tails', () => {
    // For df > 2000 the incomplete-beta continued fraction loses a few digits (observed max
    // 3e-11 at df = 1e7); up to df = 2000 the observed max is 4e-13.
    for (const [t, df, lo, up] of fx.t as number[][]) {
      const tol = df > 2000 ? 1e-10 : 1e-12;
      expectRel(D.tCdf(t, df), lo, tol, `tCdf(${t}, ${df})`);
      expectRel(D.tSf(t, df), up, tol, `tSf(${t}, ${df})`);
    }
  });
  it('ppf', () => {
    for (const [p, df, want] of fx.tPpf as number[][]) {
      if (want === 0) expect(D.tPpf(p, df)).toBe(0);
      else expectRel(D.tPpf(p, df), want, 1e-12, `tPpf(${p}, ${df})`);
    }
  });
  it('twoSidedP', () => {
    for (const [t, df, lo, up] of fx.t as number[][]) {
      const want = Math.min(1, 2 * Math.min(lo, up));
      expectRel(D.twoSidedP('t', t, df), want, df > 2000 ? 1e-10 : 1e-12, `twoSidedP(t, ${t}, ${df})`);
    }
    expectRel(D.twoSidedP('normal', 1.959963984540054), 0.05, 1e-13, 'z 1.96');
  });
});

describe('chi-square', () => {
  it('cdf/sf', () => {
    for (const [x, df, lo, up] of fx.chi2 as number[][]) {
      if (lo > 1e-300) expectRel(D.chi2Cdf(x, df), lo, 1e-12, `chi2Cdf(${x}, ${df})`);
      if (up > 1e-300) expectRel(D.chi2Sf(x, df), up, 1e-12, `chi2Sf(${x}, ${df})`);
    }
  });
  it('ppf', () => {
    for (const [p, df, want] of fx.chi2Ppf as number[][]) expectRel(D.chi2Ppf(p, df), want, 1e-12, `chi2Ppf(${p}, ${df})`);
  });
});

describe('F', () => {
  it('cdf/sf', () => {
    for (const [x, d1, d2, lo, up] of fx.f as number[][]) {
      if (lo > 1e-300) expectRel(D.fCdf(x, d1, d2), lo, Math.max(d1, d2) > 4000 ? 1e-11 : 1e-12, `fCdf(${x}, ${d1}, ${d2})`);
      if (up > 1e-300) expectRel(D.fSf(x, d1, d2), up, Math.max(d1, d2) > 4000 ? 1e-11 : 1e-12, `fSf(${x}, ${d1}, ${d2})`);
    }
  });
  it('ppf', () => {
    for (const [p, d1, d2, want] of fx.fPpf as number[][]) expectRel(D.fPpf(p, d1, d2), want, 1e-11, `fPpf(${p}, ${d1}, ${d2})`);
  });
});

describe('incomplete beta and gamma', () => {
  it('regIncBeta both tails', () => {
    for (const [x, a, b, lo, up] of fx.ibeta as number[][]) {
      if (lo > 1e-300) expectRel(D.regIncBeta(x, a, b), lo, 1e-12, `I(${x}; ${a}, ${b})`);
      if (up > 1e-300) expectRel(D.regIncBetaUpper(x, a, b), up, 1e-12, `1-I(${x}; ${a}, ${b})`);
    }
  });
  it('regIncGamma P and Q', () => {
    for (const [a, x, lo, up] of fx.igamma as number[][]) {
      if (lo > 1e-300) expectRel(D.regIncGammaP(a, x), lo, 1e-12, `P(${a}, ${x})`);
      if (up > 1e-300) expectRel(D.regIncGammaQ(a, x), up, 1e-12, `Q(${a}, ${x})`);
    }
  });
});

describe('discrete', () => {
  it('binomial pmf/cdf', () => {
    for (const [k, n, p, pmf, cdf] of fx.binomial as number[][]) {
      expectRel(D.binomialPmf(k, n, p), pmf, 1e-12, `binomPmf(${k}, ${n}, ${p})`);
      expectRel(D.binomialCdf(k, n, p), cdf, 1e-12, `binomCdf(${k}, ${n}, ${p})`);
    }
  });
  it('hypergeometric pmf', () => {
    for (const [k, N, K, n, want] of fx.hypergeom as number[][]) expectRel(D.hypergeomPmf(k, N, K, n), want, 1e-12, `hyper(${k}, ${N}, ${K}, ${n})`);
  });
});

describe('studentized range', () => {
  it('cdf/sf match scipy to 1e-10 absolute', () => {
    for (const [q, k, df, want] of fx.ptukey as number[][]) {
      expect(Math.abs(D.studentizedRangeCdf(q, k, df) - want)).toBeLessThan(1e-10);
      expect(Math.abs(D.studentizedRangeSf(q, k, df) - (1 - want))).toBeLessThan(1e-10);
    }
  });
  it('k = 2 reduces to the t distribution: P(Q > q) = P(|T| > q / sqrt 2)', () => {
    for (const [q, df] of [[3, 5], [5, 12], [9, 30], [12, 8]]) {
      expectRel(D.studentizedRangeSf(q, 2, df), D.twoSidedP('t', q / Math.SQRT2, df), 1e-9, `ptukey sf k=2 q=${q} df=${df}`);
    }
  });
  it('ppf inverts cdf', () => {
    for (const [k, df] of [[3, 20], [5, 60], [2, 10]]) {
      const q = D.studentizedRangePpf(0.95, k, df);
      expect(Math.abs(D.studentizedRangeCdf(q, k, df) - 0.95)).toBeLessThan(1e-10);
    }
    // Table value: q(0.95; 3, 20) = 3.577935
    expect(D.studentizedRangePpf(0.95, 3, 20)).toBeCloseTo(3.577935, 5);
  });
});
