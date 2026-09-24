"""Distribution-function oracle for Socius core statistics.

Computes reference values with mpmath at 40 significant digits (scipy for the studentized range)
and writes tests/stats-core/fixtures/distributions.json. Run with /opt/oracle/bin/python.
"""
import json
import os
import mpmath as mp
import numpy as np
from scipy import stats, special

mp.mp.dps = 40
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'tests', 'stats-core', 'fixtures', 'distributions.json')


def f(x):
    x = float(x)
    return x


def ibeta_pair(a, b, x, y=None):
    """(lower, upper) regularised incomplete beta. mpmath for moderate parameters; scipy (Boost,
    ~1e-15 relative) when a parameter is large, where mpmath's hypergeometric series fails."""
    if y is None:
        y = 1 - mp.mpf(x)
    if max(float(a), float(b)) <= 2000:
        # Integrate from 0 on whichever side is the smaller tail (differences of two hypergeometric
        # evaluations would cancel catastrophically).
        lo = mp.betainc(a, b, 0, x, regularized=True)
        up = mp.betainc(b, a, 0, y, regularized=True)
        return lo, up
    return mp.mpf(special.betainc(float(a), float(b), float(x))), mp.mpf(special.betaincc(float(a), float(b), float(x)))


def t_tails(t, df):
    t = mp.mpf(t); df = mp.mpf(df)
    if df > 2000:
        # Direct quadrature of the density (the beta form is ill-conditioned in double precision
        # for huge df, and mpmath's hypergeometric series does not converge there).
        c = mp.exp(mp.loggamma((df + 1) / 2) - mp.loggamma(df / 2)) / mp.sqrt(df * mp.pi)
        pdf = lambda u: c * (1 + u * u / df) ** (-(df + 1) / 2)
        a = abs(t)
        pts = [a] + [a + k for k in (1, 2, 5, 10, 20, 50)] + [mp.inf]
        tail = mp.quad(pdf, pts)
        return (1 - tail, tail) if t > 0 else (tail, 1 - tail)
    x = df / (df + t * t)
    tail = ibeta_pair(df / 2, mp.mpf(1) / 2, x)[0] / 2
    if t > 0:
        return 1 - tail, tail
    return tail, 1 - tail


def chi2_tails(x, df):
    a = mp.mpf(df) / 2; h = mp.mpf(x) / 2
    if a > 2000:
        return mp.mpf(special.gammainc(float(a), float(h))), mp.mpf(special.gammaincc(float(a), float(h)))
    return mp.gammainc(a, 0, h, regularized=True), mp.gammainc(a, h, mp.inf, regularized=True)


def f_tails(x, d1, d2):
    d1 = mp.mpf(d1); d2 = mp.mpf(d2); x = mp.mpf(x)
    u = d1 * x / (d1 * x + d2)
    return ibeta_pair(d1 / 2, d2 / 2, u)


def normal_tails(z):
    z = mp.mpf(z)
    return mp.ncdf(z), mp.ncdf(-z)


def logroot(tails, p, start):
    """Solve tail(x) = target in log space (lower tail if p < 0.5, else upper tail = 1 - p)."""
    p = mp.mpf(p)
    if p < 0.5:
        g = lambda u: mp.log(tails(mp.exp(u))[0]) - mp.log(p)
    else:
        g = lambda u: mp.log(tails(mp.exp(u))[1]) - mp.log(1 - p)
    return mp.exp(mp.findroot(g, mp.log(mp.mpf(float(start))), tol=mp.mpf(10) ** -32, verify=False))


def main():
    out = {}
    # Normal
    zs = [-37.5, -30, -20, -10, -8.3, -6, -5.657, -5, -3, -1.96, -1, -0.6744, -0.3, -1e-8, 0, 1e-8, 0.5, 0.7, 1, 2, 3.5, 5.7, 8, 12, 25, 37]
    out['normal'] = [[z, f(normal_tails(z)[0]), f(normal_tails(z)[1]), f(mp.npdf(z))] for z in zs]
    ps = [1e-300, 1e-100, 1e-20, 1e-10, 1e-5, 0.001, 0.01, 0.02425, 0.025, 0.05, 0.1, 0.3, 0.5, 0.6, 0.9, 0.975, 0.99, 0.999999]
    def nppf(p):
        return mp.findroot(lambda z: mp.log(mp.ncdf(z)) - mp.log(p), stats.norm.ppf(float(p)), tol=mp.mpf(10) ** -35)
    out['normalPpf'] = [[p, f(nppf(mp.mpf(p)))] for p in ps]

    # t
    trows = []
    for df in [0.3, 1, 1.5, 2, 3, 4.7, 5, 10, 29.3, 30, 100, 1000, 1e5, 1e7]:
        pass
        for t in [-50, -8, -3, -2.2, -1, -0.1, 0, 1e-6, 0.4, 1, 1.96, 2.5, 4, 10, 40, 1e3, 1e6]:
            lo, up = t_tails(t, df)
            trows.append([t, df, f(lo), f(up)])
    out['t'] = trows
    tq = []
    for df in [0.5, 1, 2, 3, 5.5, 10, 30, 200, 1e5]:
        for p in [1e-12, 1e-6, 0.001, 0.025, 0.05, 0.3, 0.5, 0.7, 0.95, 0.975, 0.999]:
            if p == 0.5:
                tq.append([p, df, 0.0]); continue
            start = abs(stats.t.ppf(p, df))
            dfm = mp.mpf(df)
            # Solve upper tail(|t|) = min(p, 1 - p), with 1 - p formed in extended precision.
            target = mp.mpf(p) if p < 0.5 else 1 - mp.mpf(p)
            root = mp.exp(mp.findroot(lambda u: mp.log(t_tails(mp.exp(u), dfm)[1]) - mp.log(target), mp.log(mp.mpf(float(start))), tol=mp.mpf(10) ** -32, verify=False))
            tq.append([p, df, f(root) if p > 0.5 else -f(root)])
    out['tPpf'] = tq

    # chi-square
    crows = []
    for df in [0.5, 1, 2, 3, 7.5, 10, 50, 300, 1e4, 1e6]:
        for q in [1e-8, 0.01, 0.2, 0.5, 1, 1.5, 3, 5]:
            # x as multiple of df plus fixed points
            pass
        xs = [1e-6, 0.01, 0.3, 1, 2, 3.84, 6.63, 10, 30, 100, 700, df * 0.5, df * 0.9, df, df * 1.1, df * 2, df + 10 * np.sqrt(2 * df)]
        for x in xs:
            lo, up = chi2_tails(x, df)
            crows.append([float(x), df, f(lo), f(up)])
    out['chi2'] = crows
    cq = []
    for df in [0.5, 1, 2, 3, 10, 50, 1000]:
        for p in [1e-10, 0.001, 0.05, 0.5, 0.95, 0.99, 0.999999]:
            start = stats.chi2.ppf(p, df)
            dfm = mp.mpf(df)
            root = logroot(lambda x: chi2_tails(x, dfm), p, start)
            cq.append([p, df, f(root)])
    out['chi2Ppf'] = cq

    # F
    frows = []
    for d1, d2 in [(1, 1), (1, 10), (2, 5), (3, 27), (4.5, 12.3), (10, 100), (50, 3), (100, 1e4), (1, 1e6), (3, 1e5)]:
        for x in [1e-8, 0.01, 0.2, 0.5, 1, 1.5, 2.5, 4, 10, 50, 1000, 1e6]:
            lo, up = f_tails(x, d1, d2)
            frows.append([x, d1, d2, f(lo), f(up)])
    out['f'] = frows
    fq = []
    for d1, d2 in [(1, 1), (1, 10), (2, 5), (3, 27), (10, 100), (50, 3)]:
        for p in [1e-8, 0.01, 0.05, 0.5, 0.95, 0.99, 0.9999]:
            start = stats.f.ppf(p, d1, d2)
            root = logroot(lambda x: f_tails(x, d1, d2), p, start)
            fq.append([p, d1, d2, f(root)])
    out['fPpf'] = fq

    # Incomplete beta / gamma directly
    ib = []
    for a, b in [(0.5, 0.5), (1, 1), (2, 3), (0.1, 10), (10, 0.1), (50, 50), (200, 3), (1e4, 1e4), (1e5, 0.5)]:
        for x in [1e-10, 1e-4, 0.01, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99, 0.999999]:
            lo, up = ibeta_pair(a, b, x)
            ib.append([x, a, b, f(lo), f(up)])
    out['ibeta'] = ib
    ig = []
    for a in [0.5, 1, 2.5, 10, 100, 1e4]:
        for x in [1e-8, 0.1, 0.5, 1, 2, 5, 10, 50, 150, 1e4, 1.1e4]:
            lo, up = chi2_tails(2 * x, 2 * a)
            ig.append([a, x, f(lo), f(up)])
    out['igamma'] = ig
    lg = []
    for x in [1e-10, 0.001, 0.1, 0.5, 0.9, 1, 1.5, 2, 2.5, 3.7, 7, 10, 14.9, 15, 20.5, 100, 1e4, 1e10, -0.5, -2.5]:
        lg.append([x, f(mp.log(abs(mp.gamma(x))))])
    out['lnGamma'] = lg

    # Binomial / hypergeometric
    bn = []
    for n, p in [(10, 0.5), (20, 0.1), (100, 0.3), (1000, 0.01), (5, 0.99)]:
        for k in sorted(set([0, 1, 2, n // 4, n // 2, n - 1, n])):
            pmf = mp.binomial(n, k) * mp.mpf(p) ** k * (1 - mp.mpf(p)) ** (n - k)
            cdf = mp.fsum([mp.binomial(n, j) * mp.mpf(p) ** j * (1 - mp.mpf(p)) ** (n - j) for j in range(k + 1)])
            bn.append([k, n, p, f(pmf), f(cdf)])
    out['binomial'] = bn
    hg = []
    for N, K, n in [(20, 7, 12), (50, 25, 25), (1000, 10, 100), (13, 13, 5), (30, 5, 29)]:
        for k in range(max(0, n - (N - K)), min(n, K) + 1, max(1, (min(n, K) - max(0, n - (N - K))) // 6)):
            v = mp.binomial(K, k) * mp.binomial(N - K, n - k) / mp.binomial(N, n)
            hg.append([k, N, K, n, f(v)])
    out['hypergeom'] = hg

    # Studentized range (scipy; its own accuracy is ~1e-10)
    sr = []
    for k in [2, 3, 5, 10, 20]:
        for df in [2, 5, 10, 30, 120, 1000]:
            for q in [0.5, 1.5, 3, 4.5, 6, 9]:
                sr.append([q, k, df, float(stats.studentized_range.cdf(q, k, df))])
    out['ptukey'] = sr

    with open(OUT, 'w') as fh:
        json.dump(out, fh, separators=(',', ':'))
    print('wrote', OUT, os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    main()
