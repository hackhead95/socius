"""Oracle for Socius core statistics (descriptives, t tests, ANOVA, crosstabs, nonparametric tests,
correlations). Generates random and edge-case datasets, computes reference values with scipy,
statsmodels, pingouin and scikit-posthocs (plus independent re-implementations of SPSS-specific
formulas where no library exists), and writes tests/stats-core/fixtures/core.json.

Run:  /opt/oracle/bin/python scripts/oracle/core_oracle.py
(The distribution-function fixtures come from scripts/oracle/core_oracle_dist.py.)

Conventions checked against the library where they differ by design:
- Mann-Whitney: asymptotic, tie-corrected, no continuity correction (SPSS).
- Wilcoxon: zeros dropped (zero_method='wilcox'), no continuity correction, tie-corrected.
- Frequency weights: integer weights are checked against the replicated (expanded) data.
- Measures of association ASE1: checked against the multinomial delta method, evaluated by
  numerical differentiation in 30-digit arithmetic (mpmath), which is exactly what ASE1 estimates.
"""
import json
import os
import itertools
import math

import mpmath as mp
import numpy as np
import pandas as pd
import pingouin as pg
import scikit_posthocs as sp
from scipy import stats
from statsmodels.stats import contingency_tables as ct
from statsmodels.stats.diagnostic import lilliefors
from statsmodels.stats._lilliefors import pval_lf
from statsmodels.stats.oneway import anova_oneway
from statsmodels.stats.inter_rater import cohens_kappa

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'tests', 'stats-core', 'fixtures', 'core.json')
rng = np.random.RandomState(20240917)


def fl(a):
    return [float(v) for v in a]


def expand(x, w):
    return np.repeat(np.asarray(x, float), np.asarray(w, int))


# ------------------------------------------------------------------------------------------------
# Descriptives
# ------------------------------------------------------------------------------------------------

def haverage(sorted_x, p):
    """(n+1)p percentile with linear interpolation, clamped (SPSS HAVERAGE for unit weights)."""
    n = len(sorted_x)
    t = (n + 1) * p
    if t <= 1:
        return sorted_x[0]
    if t >= n:
        return sorted_x[-1]
    i = int(math.floor(t))
    g = t - i
    return sorted_x[i - 1] + g * (sorted_x[i] - sorted_x[i - 1])


def tukey_hinges(sorted_x):
    n = len(sorted_x)
    depth_h = math.floor((n + 3) / 2) / 2  # depth of the hinges
    def at(depth):
        lo = int(math.floor(depth))
        g = depth - lo
        if g == 0:
            return sorted_x[lo - 1]
        return sorted_x[lo - 1] + g * (sorted_x[lo] - sorted_x[lo - 1])
    return [at(depth_h), at((n + 1) / 2), at(n + 1 - depth_h)]


def spss_trimmed_mean(sorted_x, tail=0.05):
    """Remove tail*n from each end, fractionally at the boundary observations."""
    n = len(sorted_x)
    k = tail * n
    total = 0.0
    for i, v in enumerate(sorted_x):
        lo, hi = i, i + 1  # this observation occupies [i, i+1) of the cumulative weight
        a, b = max(lo, k), min(hi, n - k)
        if b > a:
            total += (b - a) * v
    return total / (n - 2 * k)


def describe_case(x, w=None):
    xe = expand(x, w) if w is not None else np.asarray(x, float)
    n = len(xe)
    s = np.sort(xe)
    m = xe.mean()
    sd = xe.std(ddof=1)
    se_sk = math.sqrt(6 * n * (n - 1) / ((n - 2) * (n + 1) * (n + 3)))
    se_ku = math.sqrt(4 * (n * n - 1) * se_sk ** 2 / ((n - 3) * (n + 5))) if n > 3 else float('nan')
    tcrit = stats.t.ppf(0.975, n - 1)
    if n >= 4:
        lil_d, _ = lilliefors(xe, dist='norm', pvalmethod='approx')
    else:
        F = stats.norm.cdf((s - m) / sd)
        lil_d = max(max(np.arange(1, n + 1) / n - F), max(F - np.arange(0, n) / n))
    sw = stats.shapiro(xe)
    return {
        'x': fl(x), 'w': None if w is None else fl(w),
        'N': n, 'mean': m, 'sd': sd, 'variance': xe.var(ddof=1), 'sum': xe.sum(), 'min': xe.min(), 'max': xe.max(),
        'seMean': sd / math.sqrt(n),
        'skewness': float(stats.skew(xe, bias=False)), 'seSkewness': se_sk,
        'kurtosis': float(stats.kurtosis(xe, bias=False)) if n > 3 else float('nan'), 'seKurtosis': se_ku,
        'ciLower': m - tcrit * sd / math.sqrt(n), 'ciUpper': m + tcrit * sd / math.sqrt(n),
        'percentiles': {str(p): haverage(s, p / 100) for p in [5, 10, 25, 50, 75, 90, 95]},
        'numpyWeibull50': float(np.percentile(xe, 50, method='weibull')),
        'hinges': tukey_hinges(s),
        'trimmedMean': spss_trimmed_mean(s),
        'ksD': float(lil_d), 'ksPdw': float(pval_lf(float(lil_d), n)),
        'swW': float(sw.statistic), 'swP': float(sw.pvalue),
    }


def descriptives_cases():
    cases = []
    cases.append(describe_case(np.round(rng.normal(50, 10, 40), 2)))
    cases.append(describe_case(np.round(rng.exponential(3, 33), 1)))  # skewed with ties
    cases.append(describe_case(rng.randint(1, 6, 60).astype(float)))  # Likert, heavy ties
    x = np.round(rng.normal(0, 1, 25), 2)
    w = rng.randint(1, 4, 25)
    cases.append(describe_case(x, w))  # integer frequency weights
    cases.append(describe_case(np.array([3.0, 1.0, 2.0, 7.0, 4.0])))  # n = 5 edge (S-W small n)
    cases.append(describe_case(np.array([2.0, 9.0, 4.0])))  # n = 3 edge
    cases.append(describe_case(np.round(rng.lognormal(0, 1, 200), 3)))  # clearly non-normal, n>100
    return cases


# ------------------------------------------------------------------------------------------------
# t tests
# ------------------------------------------------------------------------------------------------

def hedges_j(df):
    return math.exp(math.lgamma(df / 2) - 0.5 * math.log(df / 2) - math.lgamma((df - 1) / 2))


def ttest_cases():
    out = {'oneSample': [], 'independent': [], 'paired': []}
    for x, w, tv in [
        (np.round(rng.normal(3.2, 1.1, 30), 2), None, 3.0),
        (np.round(rng.normal(100, 15, 12), 1), rng.randint(1, 4, 12), 105.0),
    ]:
        xe = expand(x, w) if w is not None else x
        r = stats.ttest_1samp(xe, tv)
        n = len(xe)
        ci = r.confidence_interval(0.95)
        d = (xe.mean() - tv) / xe.std(ddof=1)
        out['oneSample'].append({'x': fl(x), 'w': None if w is None else fl(w), 'testValue': tv, 't': float(r.statistic), 'df': n - 1,
                                 'p': float(r.pvalue), 'ciLower': float(ci.low - tv), 'ciUpper': float(ci.high - tv),
                                 'd': d, 'g': d * hedges_j(n - 1)})
    for (x1, w1, x2, w2) in [
        (np.round(rng.normal(10, 2, 25), 2), None, np.round(rng.normal(11.5, 4, 18), 2), None),
        (np.round(rng.normal(0, 1, 8), 2), rng.randint(1, 5, 8), np.round(rng.normal(0.8, 1, 10), 2), rng.randint(1, 5, 10)),
        (np.array([1.0, 2.0]), None, np.array([3.0, 5.0, 4.0]), None),  # n = 2 edge
    ]:
        a = expand(x1, w1) if w1 is not None else x1
        b = expand(x2, w2) if w2 is not None else x2
        eq = stats.ttest_ind(a, b, equal_var=True)
        we = stats.ttest_ind(a, b, equal_var=False)
        lev = stats.levene(a, b, center='mean')
        levm = stats.levene(a, b, center='median')
        n1, n2 = len(a), len(b)
        sp_ = math.sqrt(((n1 - 1) * a.var(ddof=1) + (n2 - 1) * b.var(ddof=1)) / (n1 + n2 - 2))
        d = (a.mean() - b.mean()) / sp_
        v1, v2 = a.var(ddof=1) / n1, b.var(ddof=1) / n2
        dfw = (v1 + v2) ** 2 / (v1 ** 2 / (n1 - 1) + v2 ** 2 / (n2 - 1))
        ci_eq = eq.confidence_interval(0.95)
        ci_we = we.confidence_interval(0.95)
        out['independent'].append({
            'x1': fl(x1), 'w1': None if w1 is None else fl(w1), 'x2': fl(x2), 'w2': None if w2 is None else fl(w2),
            'tEq': float(eq.statistic), 'pEq': float(eq.pvalue), 'dfEq': n1 + n2 - 2, 'ciEq': [float(ci_eq.low), float(ci_eq.high)],
            'tW': float(we.statistic), 'pW': float(we.pvalue), 'dfW': dfw, 'ciW': [float(ci_we.low), float(ci_we.high)],
            'leveneF': float(lev.statistic), 'leveneP': float(lev.pvalue), 'leveneMedianF': float(levm.statistic),
            'd': d, 'g': d * hedges_j(n1 + n2 - 2), 'glass': (a.mean() - b.mean()) / b.std(ddof=1),
            'pingouinCohenD': float(pg.compute_effsize(a, b, eftype='cohen')),
        })
    for x, y, w in [
        (np.round(rng.normal(5, 1, 20), 2), None, None),
        (np.round(rng.normal(5, 1, 9), 1), None, rng.randint(1, 4, 9)),
    ]:
        yy = np.round(x + rng.normal(0.4, 0.8, len(x)), 2)
        a = expand(x, w) if w is not None else x
        b = expand(yy, w) if w is not None else yy
        r = stats.ttest_rel(a, b)
        pr = stats.pearsonr(a, b)
        d = a - b
        ci = r.confidence_interval(0.95)
        out['paired'].append({'x': fl(x), 'y': fl(yy), 'w': None if w is None else fl(w), 't': float(r.statistic), 'df': len(a) - 1,
                              'p': float(r.pvalue), 'r': float(pr.statistic), 'rP': float(pr.pvalue),
                              'ci': [float(ci.low), float(ci.high)], 'dz': d.mean() / d.std(ddof=1),
                              'g': d.mean() / d.std(ddof=1) * hedges_j(len(a) - 1)})
    return out


# ------------------------------------------------------------------------------------------------
# ANOVA
# ------------------------------------------------------------------------------------------------

def anova_cases():
    out = []
    specs = [
        [(20, 10, 2), (15, 11, 2.5), (25, 12.5, 3), (12, 10.5, 1)],
        [(6, 3, 1), (9, 4.2, 1.5), (7, 3.5, 0.6)],
    ]
    for spec in specs:
        groups = [np.round(rng.normal(m, s, n), 2) for n, m, s in spec]
        df = pd.DataFrame({'y': np.concatenate(groups), 'g': np.concatenate([[i] * len(g) for i, g in enumerate(groups)])})
        f = stats.f_oneway(*groups)
        wa = pg.welch_anova(df, dv='y', between='g')
        bf = anova_oneway(df['y'], df['g'], use_var='bf')
        tk = pg.pairwise_tukey(df, dv='y', between='g')
        gh = pg.pairwise_gameshowell(df, dv='y', between='g')
        k = len(groups)
        N = sum(len(g) for g in groups)
        grand = df['y'].mean()
        ssb = sum(len(g) * (g.mean() - grand) ** 2 for g in groups)
        ssw = sum(((g - g.mean()) ** 2).sum() for g in groups)
        msw = ssw / (N - k)
        dfw = N - k
        bonf, scheffe = [], []
        for i, j in itertools.combinations(range(k), 2):
            diff = groups[i].mean() - groups[j].mean()
            se = math.sqrt(msw * (1 / len(groups[i]) + 1 / len(groups[j])))
            t = diff / se
            bonf.append([i, j, min(1.0, 2 * stats.t.sf(abs(t), dfw) * k * (k - 1) / 2)])
            scheffe.append([i, j, float(stats.f.sf(t * t / (k - 1), k - 1, dfw))])
        lev = stats.levene(*groups, center='mean')
        levm = stats.levene(*groups, center='median')
        out.append({
            'groups': [fl(g) for g in groups], 'F': float(f.statistic), 'p': float(f.pvalue),
            'ssB': ssb, 'ssW': ssw,
            'welchF': float(wa['F'].iloc[0]), 'welchDf2': float(wa['ddof2'].iloc[0]), 'welchP': float(wa['p_unc'].iloc[0]),
            'bfF': float(bf.statistic), 'bfDf2': float(bf.df[1]), 'bfP': float(bf.pvalue2),  # SPSS uses df1 = k - 1 (statsmodels pvalue2), not Mehrotra's df
            'leveneF': float(lev.statistic), 'leveneP': float(lev.pvalue), 'leveneMedianF': float(levm.statistic), 'leveneMedianP': float(levm.pvalue),
            'tukey': [[int(r.A), int(r.B), float(r['diff']), float(r['se']), float(r['p_tukey'])] for _, r in tk.iterrows()],
            'gamesHowell': [[int(r.A), int(r.B), float(r['diff']), float(r['se']), float(r['df']), float(r['pval'])] for _, r in gh.iterrows()],
            'bonferroni': bonf, 'scheffe': scheffe,
            'etaSq': ssb / (ssb + ssw), 'omegaSq': (ssb - (k - 1) * msw) / (ssb + ssw + msw),
            'tukeyQcrit': float(stats.studentized_range.ppf(0.95, k, dfw)),
        })
    return out


# ------------------------------------------------------------------------------------------------
# Crosstabs
# ------------------------------------------------------------------------------------------------

def pq_cells(t):
    t = np.asarray(t, float)
    R, C = t.shape
    Cc = np.zeros_like(t)
    Dd = np.zeros_like(t)
    for i in range(R):
        for j in range(C):
            Cc[i, j] = t[:i, :j].sum() + t[i + 1:, j + 1:].sum()
            Dd[i, j] = t[:i, j + 1:].sum() + t[i + 1:, :j].sum()
    return Cc, Dd


def ordinal_stats(t):
    """Gamma, tau-b, tau-c, Somers' d (row dep = (P-Q)/Dc, col dep = (P-Q)/Dr, symmetric)."""
    t = [[mp.mpf(v) for v in row] for row in t]
    R, C = len(t), len(t[0])
    N = mp.fsum(mp.fsum(r) for r in t)
    rows = [mp.fsum(r) for r in t]
    cols = [mp.fsum(t[i][j] for i in range(R)) for j in range(C)]
    P = Q = mp.mpf(0)
    for i in range(R):
        for j in range(C):
            cij = mp.fsum(t[a][b] for a in range(R) for b in range(C) if (a < i and b < j) or (a > i and b > j))
            dij = mp.fsum(t[a][b] for a in range(R) for b in range(C) if (a < i and b > j) or (a > i and b < j))
            P += t[i][j] * cij
            Q += t[i][j] * dij
    Dr = N * N - mp.fsum(r * r for r in rows)
    Dc = N * N - mp.fsum(c * c for c in cols)
    q = min(R, C)
    return {
        'gamma': (P - Q) / (P + Q), 'tauB': (P - Q) / mp.sqrt(Dr * Dc), 'tauC': q * (P - Q) / (N * N * (q - 1)),
        'dSym': (P - Q) / ((Dr + Dc) / 2), 'dRow': (P - Q) / Dc, 'dCol': (P - Q) / Dr,
    }


def lambda_stats(t):
    t = [[mp.mpf(v) for v in row] for row in t]
    R, C = len(t), len(t[0])
    N = mp.fsum(mp.fsum(r) for r in t)
    rows = [mp.fsum(r) for r in t]
    cols = [mp.fsum(t[i][j] for i in range(R)) for j in range(C)]
    fim = mp.fsum(max(r) for r in t)
    fmj = mp.fsum(max(t[i][j] for i in range(R)) for j in range(C))
    rm, cm = max(rows), max(cols)
    tauC = (N * mp.fsum(t[i][j] ** 2 / rows[i] for i in range(R) for j in range(C)) - mp.fsum(c * c for c in cols)) / (N * N - mp.fsum(c * c for c in cols))
    tauR = (N * mp.fsum(t[i][j] ** 2 / cols[j] for i in range(R) for j in range(C)) - mp.fsum(r * r for r in rows)) / (N * N - mp.fsum(r * r for r in rows))
    return {
        'lamSym': (fim + fmj - cm - rm) / (2 * N - rm - cm), 'lamRow': (fmj - rm) / (N - rm), 'lamCol': (fim - cm) / (N - cm),
        'gkRow': tauR, 'gkCol': tauC,
    }


def delta_ase(t, fn, key):
    """ASE1 by the multinomial delta method: Var = (sum p g^2 - (sum p g)^2) / N, g = d stat / d p."""
    mp.mp.dps = 40
    t = np.asarray(t, float)
    N = t.sum()
    p = [[mp.mpf(v) / N for v in row] for row in t]
    R, C = t.shape
    h = mp.mpf(10) ** -15
    grads = [[mp.mpf(0)] * C for _ in range(R)]
    for i in range(R):
        for j in range(C):
            pp = [row[:] for row in p]
            pm = [row[:] for row in p]
            pp[i][j] += h
            pm[i][j] -= h
            grads[i][j] = (fn(pp)[key] - fn(pm)[key]) / (2 * h)
    m1 = mp.fsum(p[i][j] * grads[i][j] for i in range(R) for j in range(C))
    m2 = mp.fsum(p[i][j] * grads[i][j] ** 2 for i in range(R) for j in range(C))
    return float(mp.sqrt((m2 - m1 * m1) / N))


def fisher_rxc_bruteforce(t):
    t = np.asarray(t, int)
    rows, cols = t.sum(1), t.sum(0)
    N = t.sum()
    lf = [math.lgamma(i + 1) for i in range(N + 2)]
    base = -lf[N] + sum(lf[r] for r in rows) + sum(lf[c] for c in cols)
    def lp(tab):
        return base - sum(lf[v] for v in tab.flatten())
    obs = lp(t)
    R, C = t.shape
    total = 0.0
    # enumerate all tables with these margins (small tables only)
    def rec(col, rem, cells):
        nonlocal total
        if col == C - 1:
            tab = np.array(cells + [rem]).T
            v = lp(tab)
            if v <= obs + 1e-7 * abs(obs):
                total += math.exp(v)
            return
        for combo in itertools.product(*[range(0, min(r, cols[col]) + 1) for r in rem]):
            if sum(combo) != cols[col]:
                continue
            rec(col + 1, [r - c for r, c in zip(rem, combo)], cells + [list(combo)])
    rec(0, list(rows), [])
    return total


def crosstab_case(t, row_scores=None, col_scores=None, exact_rxc=False):
    t = np.asarray(t, float)
    R, C = t.shape
    N = t.sum()
    chi = stats.chi2_contingency(t, correction=False)
    lr = stats.chi2_contingency(t, correction=False, lambda_='log-likelihood')
    out = {'table': t.tolist(), 'pearson': float(chi.statistic), 'pearsonP': float(chi.pvalue), 'df': int(chi.dof),
           'lr': float(lr.statistic), 'lrP': float(lr.pvalue), 'expected': chi.expected_freq.tolist(),
           'cramersV': float(stats.contingency.association(t.astype(int), method='cramer')),
           'contingency': float(stats.contingency.association(t.astype(int), method='pearson'))}
    e = chi.expected_freq
    rs, cs = t.sum(1, keepdims=True), t.sum(0, keepdims=True)
    out['adjusted'] = ((t - e) / np.sqrt(e * (1 - rs / N) * (1 - cs / N))).tolist()
    if R == 2 and C == 2:
        y = stats.chi2_contingency(t, correction=True)
        out['yates'] = float(y.statistic)
        out['yatesP'] = float(y.pvalue)
        out['fisher2'] = float(stats.fisher_exact(t).pvalue)
        a = t[0, 0]
        ea = t[0].sum() * t[:, 0].sum() / N
        out['fisher1'] = float(stats.fisher_exact(t, alternative='greater' if a >= ea else 'less').pvalue)
        t22 = ct.Table2x2(t)
        out['or'] = float(t22.oddsratio)
        out['orCI'] = [float(v) for v in t22.oddsratio_confint()]
        out['rr'] = float(t22.riskratio)
        out['rrCI'] = [float(v) for v in t22.riskratio_confint()]
        out['mcnemarExact'] = float(ct.mcnemar(t, exact=True).pvalue)
    if exact_rxc:
        out['fisherRxC'] = fisher_rxc_bruteforce(t)
    if R == C:
        k = cohens_kappa(t)
        out['kappa'] = float(k.kappa)
        out['kappaAse0'] = float(k.std_kappa0)
        out['kappaAseStatsmodels'] = float(k.std_kappa)
        def kappa_fn(pp):
            R_ = len(pp)
            po = mp.fsum(pp[i][i] for i in range(R_))
            pr = [mp.fsum(pp[i]) for i in range(R_)]
            pc = [mp.fsum(pp[i][j] for i in range(R_)) for j in range(R_)]
            tot = mp.fsum(pr)
            pe = mp.fsum(pr[i] * pc[i] for i in range(R_)) / tot ** 2
            return {'kappa': (po / tot - pe) / (1 - pe)}
        out['kappaAse'] = delta_ase(t, kappa_fn, 'kappa')
        if R > 2:
            sym = ct.SquareTable(t, shift_zeros=False).symmetry()
            out['bowker'] = float(sym.statistic)
            out['bowkerP'] = float(sym.pvalue)
    # ordinal measures (exact rational arithmetic) and ASE1 by the delta method
    mp.mp.dps = 40
    om = ordinal_stats(t)
    out.update({k: float(v) for k, v in om.items()})
    for key in ['gamma', 'tauB', 'tauC', 'dSym', 'dRow', 'dCol']:
        out['ase_' + key] = delta_ase(t, ordinal_stats, key)
    lm = lambda_stats(t)
    out.update({k: float(v) for k, v in lm.items()})
    for key in ['lamRow', 'lamCol', 'lamSym', 'gkRow', 'gkCol']:
        out['ase_' + key] = delta_ase(t, lambda_stats, key)
    # scipy cross-checks
    out['scipySomersColDep'] = float(stats.somersd(t.astype(int)).statistic)  # rows = x (independent), cols = y dependent
    # expanded data for kendall tau-b statistic
    xs, ys = [], []
    for i in range(R):
        for j in range(C):
            xs += [i] * int(round(t[i, j]))
            ys += [j] * int(round(t[i, j]))
    if np.allclose(t, np.round(t)):
        out['scipyTauB'] = float(stats.kendalltau(xs, ys, variant='b').statistic)
        out['spearman'] = float(stats.spearmanr(xs, ys).statistic)
        if row_scores is not None:
            xr = [row_scores[i] for i in xs]
            yr = [col_scores[j] for j in ys]
            r = stats.pearsonr(xr, yr).statistic
            out['pearsonR'] = float(r)
            out['linByLin'] = float((N - 1) * r * r)
            out['rowScores'] = row_scores
            out['colScores'] = col_scores
    return out


def crosstab_cases():
    cases = []
    cases.append(crosstab_case([[12, 5], [7, 16]], [1, 2], [1, 2]))
    cases.append(crosstab_case([[3, 1], [1, 3]], [0, 1], [0, 1]))  # small 2x2, expected < 5
    cases.append(crosstab_case([[20, 15, 5], [10, 25, 18], [4, 12, 30]], [1, 2, 3], [1, 2, 3]))
    cases.append(crosstab_case([[8, 2, 3, 1], [4, 6, 2, 5], [1, 3, 9, 7]], [1, 2, 3], [1, 2, 3, 4]))
    cases.append(crosstab_case([[3, 1, 0], [1, 2, 2], [0, 1, 4]], [1, 2, 3], [1, 2, 3], exact_rxc=True))
    cases.append(crosstab_case([[2, 3, 1], [4, 0, 2]], [1, 2], [1, 2, 3], exact_rxc=True))
    cases.append(crosstab_case([[30, 12], [9, 41]], [1, 2], [1, 2]))
    # layered 2x2 tables (CMH)
    layers = [np.array([[10, 5], [6, 12]]), np.array([[8, 7], [4, 11]]), np.array([[15, 3], [9, 6]])]
    st = ct.StratifiedTable([l.astype(float) for l in layers])
    cm = {'layers': [l.tolist() for l in layers], 'or': float(st.oddsratio_pooled), 'lnSe': float(st.logodds_pooled_se),
          'ci': [float(v) for v in st.oddsratio_pooled_confint()],
          'mh': float(st.test_null_odds(correction=True).statistic), 'mhP': float(st.test_null_odds(correction=True).pvalue),
          'cochran': float(st.test_null_odds(correction=False).statistic),
          'bd': float(st.test_equal_odds(adjust=False).statistic), 'tarone': float(st.test_equal_odds(adjust=True).statistic)}
    return cases, cm


# ------------------------------------------------------------------------------------------------
# Nonparametric
# ------------------------------------------------------------------------------------------------

def nonparametric_cases():
    out = {}
    obs = [18, 25, 12, 30]
    out['gofEqual'] = {'observed': obs, 'chi': float(stats.chisquare(obs).statistic), 'p': float(stats.chisquare(obs).pvalue)}
    props = [0.1, 0.3, 0.2, 0.4]
    exp = np.array(props) * sum(obs)
    r = stats.chisquare(obs, exp)
    out['gofCustom'] = {'observed': obs, 'props': props, 'chi': float(r.statistic), 'p': float(r.pvalue)}
    out['binomial'] = []
    for k, n, p in [(7, 20, 0.5), (13, 20, 0.5), (10, 20, 0.5), (3, 40, 0.2), (15, 40, 0.2), (60, 100, 0.5)]:
        if p == 0.5:
            pv = stats.binomtest(k, n, p, alternative='two-sided').pvalue
        else:
            pv = stats.binomtest(k, n, p, alternative='greater' if k / n > p else 'less').pvalue
        out['binomial'].append([k, n, p, float(pv)])
    out['mannWhitney'] = []
    for x1, x2 in [
        (np.round(rng.normal(0, 1, 15), 1), np.round(rng.normal(0.7, 1, 12), 1)),  # ties from rounding
        (rng.randint(1, 6, 30).astype(float), rng.randint(2, 7, 25).astype(float)),  # heavy ties
        (np.round(rng.normal(0, 1, 7), 3), np.round(rng.normal(1, 1, 6), 3)),  # small, no ties -> exact
    ]:
        r = stats.mannwhitneyu(x1, x2, method='asymptotic', use_continuity=False)
        n1, n2 = len(x1), len(x2)
        u1 = float(r.statistic)
        entry = {'x1': fl(x1), 'x2': fl(x2), 'U1': u1, 'U': min(u1, n1 * n2 - u1), 'p': float(r.pvalue)}
        if len(set(np.concatenate([x1, x2]))) == n1 + n2:
            entry['exactP'] = float(stats.mannwhitneyu(x1, x2, method='exact').pvalue)
        cases_ranks = stats.rankdata(np.concatenate([x1, x2]))
        entry['R1'] = float(cases_ranks[:n1].sum())
        out['mannWhitney'].append(entry)
    out['wilcoxon'] = []
    for a in [np.round(rng.normal(5, 1, 25), 1), np.round(rng.normal(5, 1, 10), 3)]:
        b = np.round(a + rng.normal(0.3, 0.7, len(a)), 1 if len(a) == 25 else 3)
        b[0] = a[0]  # a zero difference
        r = stats.wilcoxon(a, b, zero_method='wilcox', correction=False, method='approx')
        out['wilcoxon'].append({'first': fl(a), 'second': fl(b), 'z': float(r.zstatistic), 'p': float(r.pvalue), 'T': float(r.statistic)})
    groups = [np.round(rng.normal(m, 1, n), 1) for m, n in [(0, 10), (0.5, 14), (1.2, 9), (0.3, 11)]]
    kw = stats.kruskal(*groups)
    dunn = sp.posthoc_dunn([list(g) for g in groups], p_adjust=None)
    dunnB = sp.posthoc_dunn([list(g) for g in groups], p_adjust='bonferroni')
    out['kruskal'] = {'groups': [fl(g) for g in groups], 'H': float(kw.statistic), 'p': float(kw.pvalue),
                      'dunn': dunn.values.tolist(), 'dunnBonf': dunnB.values.tolist()}
    cols = [rng.randint(1, 6, 18).astype(float) for _ in range(4)]
    fr = stats.friedmanchisquare(*cols)
    out['friedman'] = {'columns': [fl(c) for c in cols], 'chi': float(fr.statistic), 'p': float(fr.pvalue),
                       'W': float(fr.statistic / (18 * 3))}
    return out


# ------------------------------------------------------------------------------------------------
# Correlations
# ------------------------------------------------------------------------------------------------

def correlation_cases():
    out = []
    for n in [30, 12]:
        x = np.round(rng.normal(0, 1, n), 2)
        y = np.round(0.5 * x + rng.normal(0, 1, n), 1)
        z = np.round(0.3 * x - 0.4 * y + rng.normal(0, 1, n), 1)
        pr = stats.pearsonr(x, y)
        sr = stats.spearmanr(x, y)
        kt = stats.kendalltau(x, y, variant='b')
        df = pd.DataFrame({'x': x, 'y': y, 'z': z})
        pc = pg.partial_corr(df, x='x', y='y', covar='z')
        out.append({'x': fl(x), 'y': fl(y), 'z': fl(z), 'pearson': float(pr.statistic), 'pearsonP': float(pr.pvalue),
                    'spearman': float(sr.statistic), 'spearmanP': float(sr.pvalue), 'kendall': float(kt.statistic),
                    'partial': float(pc['r'].iloc[0]), 'partialP': float(pc['p_val'].iloc[0])})
    # weighted pearson vs expanded
    x = np.round(rng.normal(0, 1, 15), 2)
    y = np.round(x + rng.normal(0, 1, 15), 2)
    w = rng.randint(1, 5, 15)
    pr = stats.pearsonr(expand(x, w), expand(y, w))
    sr = stats.spearmanr(expand(x, w), expand(y, w))
    kt = stats.kendalltau(expand(x, w), expand(y, w))
    out.append({'x': fl(x), 'y': fl(y), 'w': fl(w), 'pearson': float(pr.statistic), 'pearsonP': float(pr.pvalue),
                'spearman': float(sr.statistic), 'spearmanP': float(sr.pvalue), 'kendall': float(kt.statistic)})
    return out


def weighted_crosstab_case():
    """Integer-weighted raw data vs chi-square on the replicated data."""
    r = rng.randint(0, 3, 40)
    c = rng.randint(0, 2, 40)
    w = rng.randint(1, 4, 40)
    t = np.zeros((3, 2))
    for a, b, ww in zip(r, c, w):
        t[a, b] += ww
    chi = stats.chi2_contingency(t, correction=False)
    return {'row': [int(v) for v in r], 'col': [int(v) for v in c], 'w': [int(v) for v in w], 'pearson': float(chi.statistic), 'p': float(chi.pvalue)}


def main():
    cross, cmh = crosstab_cases()
    data = {
        'descriptives': descriptives_cases(),
        'ttest': ttest_cases(),
        'anova': anova_cases(),
        'crosstabs': cross,
        'cmh': cmh,
        'nonparametric': nonparametric_cases(),
        'correlation': correlation_cases(),
        'weightedCrosstab': weighted_crosstab_case(),
    }

    def clean(o):
        if isinstance(o, dict):
            return {k: clean(v) for k, v in o.items()}
        if isinstance(o, (list, tuple)):
            return [clean(v) for v in o]
        if isinstance(o, (np.floating, np.integer)):
            return o.item()
        if isinstance(o, float) and (math.isnan(o) or math.isinf(o)):
            return None
        return o

    with open(OUT, 'w') as fh:
        json.dump(clean(data), fh, separators=(',', ':'))
    print('wrote', OUT, os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    main()
