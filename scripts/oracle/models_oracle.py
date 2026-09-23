"""Oracle for the statistical-model procedures (regression, logistic, ordinal, multinomial,
reliability, factor analysis, linear algebra).

Builds deterministic datasets and records reference results from numpy / statsmodels / pingouin /
factor_analyzer into tests/stats-models/fixtures/*.json. The vitest suite reads those JSON files,
so CI never needs Python. Regenerate with:

    /opt/oracle/bin/python scripts/oracle/models_oracle.py

Where a reference library has no implementation of an SPSS-specific algorithm (SPSS stepwise
selection, Hosmer-Lemeshow grouping, PAF with the SPSS stopping rule, the general cumulative model
behind the test of parallel lines, one-factor ML for omega), a direct numpy/scipy transcription of
the published algorithm is used and marked "algorithm oracle" below.
"""

import json
import os
import warnings

import numpy as np
import pandas as pd
import pingouin as pg
import scipy.optimize as so
import scipy.stats as st
import statsmodels.api as sm
from factor_analyzer.factor_analyzer import calculate_bartlett_sphericity, calculate_kmo
from factor_analyzer.rotator import Rotator
from statsmodels.miscmodels.ordinal_model import OrderedModel
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.stattools import durbin_watson

warnings.filterwarnings("ignore")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "tests", "stats-models", "fixtures")
os.makedirs(OUT, exist_ok=True)


def tolist(x):
    if isinstance(x, (pd.Series, pd.DataFrame)):
        x = x.values
    return np.asarray(x, dtype=float).tolist()


def dump(name, obj):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        json.dump(obj, f, separators=(",", ":"), allow_nan=True)
    print(f"wrote {path} ({os.path.getsize(path) / 1024:.1f} KB)")


# ---------------------------------------------------------------------------
# Dataset: a realistic sociology-like survey
# ---------------------------------------------------------------------------

rng = np.random.default_rng(20260923)
N = 400
educ = rng.integers(8, 21, N).astype(float)  # years of schooling
age = rng.integers(18, 81, N).astype(float)
female = (rng.random(N) < 0.52).astype(float)
income = np.round(np.clip(8 + 2.1 * educ + 0.25 * age - 3 * female + rng.normal(0, 9, N), 2, None), 1)
# categorical education (1 Primary, 2 Secondary, 3 Vocational, 4 Graduate), noisy function of educ
educ_cat = np.clip(np.floor((educ - 8) / 3.3 + rng.normal(0, 0.6, N)) + 1, 1, 4)
region = rng.integers(1, 4, N).astype(float)
noise = np.round(rng.normal(0, 1, N), 3)
trust = np.round(2 + 0.12 * educ + 0.012 * age + 0.3 * female + 0.02 * income + 0.25 * (educ_cat == 4) + rng.normal(0, 1.1, N), 2)
eta_v = -4 + 0.18 * educ + 0.03 * age + 0.35 * female + 0.4 * (region == 2) - 0.2 * (region == 3)
voted = (rng.random(N) < 1 / (1 + np.exp(-eta_v))).astype(float)
latent = 0.15 * educ + 0.015 * age + 0.4 * female + rng.logistic(0, 1, N)
cuts = np.quantile(latent, [0.15, 0.4, 0.7, 0.9])
likert = (np.searchsorted(cuts, latent) + 1).astype(float)  # 1..5
# multinomial party choice (1 Left, 2 Centre, 3 Right)
u1 = np.zeros(N)
u2 = -0.5 + 0.05 * educ - 0.01 * age + 0.3 * female
u3 = -2.0 + 0.02 * educ + 0.03 * age - 0.2 * female
U = np.vstack([u1, u2, u3]).T + rng.gumbel(0, 1, (N, 3))
party = (np.argmax(U, axis=1) + 1).astype(float)
wt = rng.integers(1, 4, N).astype(float)
wt_f = np.round(rng.uniform(0.4, 2.6, N), 3)

# scale items: two correlated factors, 4 items each, Likert 1..5; item r4 is reverse worded
F = rng.multivariate_normal([0, 0], [[1, 0.35], [0.35, 1]], N)
load1 = [0.8, 0.7, 0.75, -0.6]
load2 = [0.7, 0.65, 0.8, 0.55]
items = {}
for j, l in enumerate(load1):
    x = l * F[:, 0] + rng.normal(0, np.sqrt(1 - l * l), N)
    items[f"r{j + 1}"] = np.clip(np.round(3 + 1.1 * x), 1, 5)
for j, l in enumerate(load2):
    x = l * F[:, 1] + 0.1 * F[:, 0] + rng.normal(0, np.sqrt(1 - l * l), N)
    items[f"s{j + 1}"] = np.clip(np.round(3 + 1.1 * x), 1, 5)

df = pd.DataFrame(
    dict(educ=educ, age=age, female=female, income=income, educ_cat=educ_cat, region=region, noise=noise,
         trust=trust, voted=voted, likert=likert, party=party, wt=wt, wt_f=wt_f, **items)
)
dump("socio_data.json", {k: tolist(v) for k, v in df.items()})


def dummies(series, ref_first=True):
    levels = sorted(series.unique())
    ref = levels[0] if ref_first else levels[-1]
    cols = {}
    for lv in levels:
        if lv == ref:
            continue
        cols[f"{series.name}_{int(lv)}"] = (series == lv).astype(float)
    return pd.DataFrame(cols)


def replicate(frame, w):
    return frame.loc[frame.index.repeat(w.astype(int))].reset_index(drop=True)


# ---------------------------------------------------------------------------
# Linear algebra
# ---------------------------------------------------------------------------

def matrix_fixture():
    r = np.random.default_rng(7)
    M = r.normal(size=(6, 6))
    spd = M @ M.T + 6 * np.eye(6)
    gen = r.normal(size=(5, 5))
    X = r.normal(size=(30, 5))
    y = r.normal(size=30)
    Xdef = np.column_stack([X, X[:, 0] - 2 * X[:, 3]])
    sym = (M + M.T) / 2
    ev, evec = np.linalg.eigh(sym)
    order = np.argsort(ev)[::-1]
    ev, evec = ev[order], evec[:, order]
    L = np.linalg.cholesky(spd)
    sign, logabs = np.linalg.slogdet(gen)
    coef, *_ = np.linalg.lstsq(X, y, rcond=None)
    # For the rank-deficient matrix, the solution with the aliased (last) column dropped.
    coef_def, *_ = np.linalg.lstsq(Xdef[:, :5], y, rcond=None)
    dump("matrix.json", dict(
        spd=tolist(spd), chol=tolist(L), spdInv=tolist(np.linalg.inv(spd)), spdLogDet=float(np.linalg.slogdet(spd)[1]),
        gen=tolist(gen), genInv=tolist(np.linalg.inv(gen)), genDet=float(np.linalg.det(gen)), genSign=float(sign), genLogAbs=float(logabs),
        genSolveB=[1, 2, 3, 4, 5], genSolveX=tolist(np.linalg.solve(gen, [1, 2, 3, 4, 5])),
        sym=tolist(sym), symValues=tolist(ev), symVectors=tolist(evec),
        X=tolist(X), y=tolist(y), lsCoef=tolist(coef), lsCov=tolist(np.linalg.inv(X.T @ X)),
        Xdef=tolist(Xdef), lsDefCoef=tolist(coef_def), lsDefRank=int(np.linalg.matrix_rank(Xdef)),
    ))


# ---------------------------------------------------------------------------
# Linear regression
# ---------------------------------------------------------------------------

def ols_block(yv, X, w=None, names=None):
    """Reference OLS/WLS(freq) with SPSS-style statistics."""
    Xc = sm.add_constant(X, has_constant="add")
    if w is None:
        res = sm.OLS(yv, Xc).fit()
        wv = np.ones(len(yv))
    else:
        res = sm.GLM(yv, Xc, family=sm.families.Gaussian(), freq_weights=w).fit()
        wv = w
    W = wv.sum()
    k = X.shape[1]
    ybar = np.average(yv, weights=wv)
    sst = np.sum(wv * (yv - ybar) ** 2)
    fitted = res.fittedvalues if w is None else res.mu
    resid = yv - fitted
    ssr = np.sum(wv * resid ** 2)
    df_res = W - k - 1
    r2 = 1 - ssr / sst
    mse = ssr / df_res
    Fv = ((sst - ssr) / k) / mse
    sdx = np.sqrt(np.average((X - np.average(X, axis=0, weights=wv)) ** 2, axis=0, weights=wv))
    sdy = np.sqrt(np.average((yv - ybar) ** 2, weights=wv))
    params = np.asarray(res.params)
    bse = np.asarray(res.bse)
    tvals = params / bse
    pvals = 2 * st.t.sf(np.abs(tvals), df_res)
    tcrit = st.t.ppf(0.975, df_res)
    out = dict(
        params=tolist(params), bse=tolist(bse), t=tolist(tvals), p=tolist(pvals),
        ciLo=tolist(params - tcrit * bse), ciHi=tolist(params + tcrit * bse),
        beta=tolist(params[1:] * sdx / sdy), r2=float(r2), adjR2=float(1 - (1 - r2) * (W - 1) / df_res),
        F=float(Fv), pF=float(st.f.sf(Fv, k, df_res)), ssRes=float(ssr), ssReg=float(sst - ssr), dfRes=float(df_res),
        seEst=float(np.sqrt(mse)),
    )
    if w is None:
        # Cross-check the weighted/SPSS-style computations against statsmodels OLS attributes.
        assert abs(res.rsquared - r2) < 1e-12 and abs(res.fvalue - Fv) < 1e-8 * Fv
        out["vif"] = [float(variance_inflation_factor(np.asarray(Xc), j)) for j in range(1, k + 1)]
        out["dw"] = float(durbin_watson(resid))
    return out


def regression_fixture():
    y = df["trust"].values
    X1 = df[["educ", "age", "female"]].values
    d_educ = dummies(df["educ_cat"], ref_first=True)
    X2 = np.column_stack([X1, df["income"].values, d_educ.values])
    m1 = ols_block(y, X1)
    m2 = ols_block(y, X2)
    # R² change (block 2 over block 1) via statsmodels' nested F test
    r1 = sm.OLS(y, sm.add_constant(X1)).fit()
    r2 = sm.OLS(y, sm.add_constant(X2)).fit()
    fchg, pchg, dfd = r2.compare_f_test(r1)
    change = dict(r2Change=float(r2.rsquared - r1.rsquared), F=float(fchg), p=float(pchg), df1=int(dfd), df2=float(r2.df_resid))
    # zero-order / partial / part correlations for model 1 (pingouin)
    corr = []
    names = ["educ", "age", "female"]
    for j, nm in enumerate(names):
        others = [o for o in names if o != nm]
        zo = float(np.corrcoef(df[nm], df["trust"])[0, 1])
        pc = float(pg.partial_corr(data=df, x=nm, y="trust", covar=others)["r"].iloc[0])
        sp = float(pg.partial_corr(data=df, x=nm, y="trust", x_covar=others)["r"].iloc[0])
        corr.append(dict(zero=zo, partial=pc, part=sp))
    m1["corr"] = corr
    # Excluded variables for model 1: each block-2 variable entered alone on top of model 1
    excl = []
    for nm in ["income"]:
        Xa = np.column_stack([X1, df[nm].values])
        ra = sm.OLS(y, sm.add_constant(Xa)).fit()
        sdx = df[nm].std(ddof=1)
        tol = 1 - sm.OLS(df[nm].values, sm.add_constant(X1)).fit().rsquared
        pc = float(pg.partial_corr(data=df, x=nm, y="trust", covar=names)["r"].iloc[0])
        excl.append(dict(name=nm, betaIn=float(ra.params[-1] * sdx / df["trust"].std(ddof=1)), t=float(ra.tvalues[-1]),
                         p=float(ra.pvalues[-1]), partial=pc, tolerance=float(tol)))
    # Frequency weights (integer): replication is the reference for everything
    rep = replicate(df, df["wt"].values)
    wm = ols_block(rep["trust"].values, rep[["educ", "age", "female"]].values)
    rep_resid = rep["trust"].values - sm.OLS(rep["trust"].values, sm.add_constant(rep[["educ", "age", "female"]].values)).fit().fittedvalues
    wm["dw"] = float(durbin_watson(rep_resid))
    # Non-integer weights: GLM with freq_weights
    wf = ols_block(y, X1, w=df["wt_f"].values)
    # Collinear: x = educ + age is excluded (entered last)
    # Stepwise (algorithm oracle): SPSS PIN .05 / POUT .10 using statsmodels p-values
    cand = ["educ", "age", "female", "income", "noise", "region"]
    model = []
    steps = []
    for _ in range(20):
        best, bestp = None, 1.0
        for c in cand:
            if c in model:
                continue
            r = sm.OLS(y, sm.add_constant(df[model + [c]].values)).fit()
            if r.pvalues[-1] < bestp:
                best, bestp = c, r.pvalues[-1]
        if best is None or bestp > 0.05:
            break
        model.append(best)
        steps.append(dict(entered=best))
        while True:
            r = sm.OLS(y, sm.add_constant(df[model].values)).fit()
            pv = r.pvalues[1:]
            j = int(np.argmax(pv))
            if pv[j] > 0.10:
                steps.append(dict(removed=model[j]))
                model.pop(j)
            else:
                break
    final = sm.OLS(y, sm.add_constant(df[model].values)).fit()
    dump("regression.json", dict(
        m1=m1, m2=m2, change=change, excluded=excl, weighted=wm, weightedFrac=wf,
        dummyNames=list(d_educ.columns),
        stepwise=dict(steps=steps, final=model, r2=float(final.rsquared), params=tolist(final.params)),
    ))


# ---------------------------------------------------------------------------
# Binary logistic regression
# ---------------------------------------------------------------------------

def hosmer_lemeshow(yv, p, w, keys, g=10):
    """Algorithm oracle: SPSS-style HL grouping (ties/covariate patterns kept together)."""
    blocks = {}
    for i in range(len(yv)):
        b = blocks.setdefault(keys[i], dict(p=p[i], n=0.0, o1=0.0, sp=0.0))
        b["n"] += w[i]
        b["o1"] += w[i] * yv[i]
        b["sp"] += w[i] * p[i]
    lst = sorted(blocks.values(), key=lambda b: b["p"])
    W = sum(b["n"] for b in lst)
    groups = {}
    cum = 0.0
    for b in lst:
        cum += b["n"]
        k = min(g, max(1, int(np.ceil(g * cum / W - 1e-9))))
        gr = groups.setdefault(k, [0.0, 0.0, 0.0])
        gr[0] += b["n"]
        gr[1] += b["o1"]
        gr[2] += b["sp"]
    chi2 = 0.0
    for n_, o, e in groups.values():
        xi = e / n_
        chi2 += (o - e) ** 2 / (e * (1 - xi))
    dfh = len(groups) - 2
    return dict(chi2=chi2, df=dfh, p=float(st.chi2.sf(chi2, dfh)))


def logistic_fixture():
    y = df["voted"].values
    d_reg = dummies(df["region"], ref_first=True)
    X = np.column_stack([df[["educ", "age", "female"]].values, d_reg.values])
    Xc = sm.add_constant(X)
    res = sm.Logit(y, Xc).fit(disp=0, tol=1e-14, maxiter=200)
    W = len(y)
    cs = 1 - np.exp(2 / W * (res.llnull - res.llf))
    nk = cs / (1 - np.exp(2 / W * res.llnull))
    wald_reg = res.wald_test(np.eye(Xc.shape[1])[[4, 5]], scalar=True)
    keys = [tuple(r) for r in X]
    hl = hosmer_lemeshow(y, res.predict(Xc), np.ones(W), keys)
    # Block 0 score tests via statsmodels GLM.score_test
    m0 = sm.GLM(y, np.ones((W, 1)), family=sm.families.Binomial())
    r0 = m0.fit()
    scores = []
    for j in range(X.shape[1]):
        s = m0.score_test(r0.params, exog_extra=X[:, [j]])
        scores.append(float(np.ravel(s[0])[0]))
    overall = float(np.ravel(m0.score_test(r0.params, exog_extra=X)[0])[0])
    pred = res.predict(Xc)
    correct = float(np.mean((pred >= 0.5) == (y == 1)) * 100)
    unweighted = dict(params=tolist(res.params), bse=tolist(res.bse), llf=float(res.llf), llnull=float(res.llnull),
                      coxSnell=float(cs), nagelkerke=float(nk), waldRegion=float(wald_reg.statistic), pWaldRegion=float(wald_reg.pvalue),
                      hl=hl, scores=scores, overallScore=overall, pctCorrect=correct)
    # Frequency weights: GLM binomial with freq_weights
    w = df["wt_f"].values
    g = sm.GLM(y, Xc, family=sm.families.Binomial(), freq_weights=w).fit(tol=1e-14)
    Wf = w.sum()
    llf = float(g.llf)
    ll0 = float(np.sum(w * (y * np.log(np.average(y, weights=w)) + (1 - y) * np.log(1 - np.average(y, weights=w)))))
    weighted = dict(params=tolist(g.params), bse=tolist(g.bse), llf=llf, llnull=ll0,
                    coxSnell=float(1 - np.exp(2 / Wf * (ll0 - llf))))
    # Quasi-complete separation example: category region==3 has no voters at all
    ysep = y.copy()
    ysep[df["region"].values == 3] = 0
    dump("logistic.json", dict(unweighted=unweighted, weighted=weighted, ySeparated=tolist(ysep)))


# ---------------------------------------------------------------------------
# Multinomial logistic regression
# ---------------------------------------------------------------------------

def multinomial_fixture():
    y = df["party"].values
    X = df[["educ", "age", "female"]].values
    Xc = sm.add_constant(X)
    out = {}
    for ref in ["first", "last"]:
        if ref == "first":
            yy = y - 1  # base = category 1
            order = [2, 3]
        else:
            yy = np.where(y == 3, 0, y)  # base = category 3; others keep 1, 2
            order = [1, 2]
        res = sm.MNLogit(yy, Xc).fit(method="newton", tol=1e-14, maxiter=200, disp=0)
        lr = {}
        for j, nm in enumerate(["educ", "age", "female"]):
            Xr = np.delete(Xc, j + 1, axis=1)
            rr = sm.MNLogit(yy, Xr).fit(method="newton", tol=1e-14, maxiter=200, disp=0)
            lr[nm] = float(2 * (res.llf - rr.llf))
        W = len(y)
        cs = 1 - np.exp(2 / W * (res.llnull - res.llf))
        out[ref] = dict(cats=order, params=tolist(np.asarray(res.params).T), bse=tolist(np.asarray(res.bse).T),
                        llf=float(res.llf), llnull=float(res.llnull), lr=lr, coxSnell=float(cs),
                        nagelkerke=float(cs / (1 - np.exp(2 / W * res.llnull))), mcfadden=float(1 - res.llf / res.llnull))
    rep = replicate(df, df["wt"].values)
    yy = np.where(rep["party"].values == 3, 0, rep["party"].values)
    res = sm.MNLogit(yy, sm.add_constant(rep[["educ", "age", "female"]].values)).fit(method="newton", tol=1e-14, maxiter=200, disp=0)
    out["weighted"] = dict(params=tolist(np.asarray(res.params).T), bse=tolist(np.asarray(res.bse).T), llf=float(res.llf))
    dump("multinomial.json", out)


# ---------------------------------------------------------------------------
# Ordinal regression (PLUM, logit)
# ---------------------------------------------------------------------------

def ordered(yv, X):
    mod = OrderedModel(yv, X, distr="logit")
    res = mod.fit(method="newton", maxiter=200, disp=0, gtol=1e-12)
    k = X.shape[1]
    J = len(np.unique(yv))
    raw = np.asarray(res.params)
    th = mod.transform_threshold_params(raw)[1:-1]
    # Delta method for thresholds: th_1 = a1, th_j = a1 + sum_{i<=j} exp(a_i)
    Jac = np.zeros((J - 1, J - 1))
    for j in range(J - 1):
        Jac[j, 0] = 1
        for i in range(1, j + 1):
            Jac[j, i] = np.exp(raw[k + i])
    cov = np.asarray(res.cov_params())
    cov_th = Jac @ cov[k:, k:] @ Jac.T
    return res, dict(beta=tolist(raw[:k]), seBeta=tolist(np.sqrt(np.diag(cov)[:k])), thresholds=tolist(th),
                     seThresholds=tolist(np.sqrt(np.diag(cov_th))), llf=float(res.llf))


def general_cumulative_ll(yv, X, J):
    """Algorithm oracle: -2LL of the non-proportional cumulative logit (test of parallel lines)."""
    k = X.shape[1]

    def negll(par):
        par = par.reshape(J - 1, k + 1)
        cum = np.column_stack([1 / (1 + np.exp(-(par[j, 0] - X @ par[j, 1:]))) for j in range(J - 1)])
        cum = np.column_stack([np.zeros(len(yv)), cum, np.ones(len(yv))])
        p = cum[np.arange(len(yv)), yv + 1] - cum[np.arange(len(yv)), yv]
        if np.any(p <= 0):
            return 1e10
        return -np.sum(np.log(p))

    res0, _ = None, None
    start = []
    cnt = np.bincount(yv, minlength=J).cumsum()[:-1] / len(yv)
    for j in range(J - 1):
        start += [np.log(cnt[j] / (1 - cnt[j]))] + [0.0] * k
    r = so.minimize(negll, np.array(start), method="BFGS", options=dict(gtol=1e-10, maxiter=10000))
    r = so.minimize(negll, r.x, method="Nelder-Mead", options=dict(xatol=1e-12, fatol=1e-14, maxiter=20000))
    r = so.minimize(negll, r.x, method="BFGS", options=dict(gtol=1e-11, maxiter=10000))
    return 2 * r.fun


def ordinal_fixture():
    yv = df["likert"].values.astype(int) - 1
    X = df[["educ", "age", "female"]].values
    res, out = ordered(yv, X)
    J = 5
    counts = np.bincount(yv, minlength=J)
    ll0 = float(np.sum(counts * np.log(counts / len(yv))))
    out["llnull"] = ll0
    W = len(yv)
    cs = 1 - np.exp(2 / W * (ll0 - out["llf"]))
    out["coxSnell"] = float(cs)
    out["nagelkerke"] = float(cs / (1 - np.exp(2 / W * ll0)))
    out["mcfadden"] = float(1 - out["llf"] / ll0)
    out["m2llGeneral"] = float(general_cumulative_ll(yv, X, J))
    # Goodness of fit over covariate patterns, using statsmodels predicted probabilities
    probs = res.predict(X)
    pats = {}
    for i in range(W):
        key = tuple(X[i])
        d = pats.setdefault(key, [np.zeros(J), np.zeros(J)])
        d[0][yv[i]] += 1
        d[1] += probs[i]
    pear = dev = 0.0
    for O, E in pats.values():
        pear += np.sum((O - E) ** 2 / E)
        m = O > 0
        dev += 2 * np.sum(O[m] * np.log(O[m] / E[m]))
    out["pearson"] = float(pear)
    out["deviance"] = float(dev)
    out["gofDf"] = int(len(pats) * (J - 1) - (J - 1 + X.shape[1]))
    rep = replicate(df, df["wt"].values)
    _, wout = ordered(rep["likert"].values.astype(int) - 1, rep[["educ", "age", "female"]].values)
    out["weighted"] = wout
    dump("ordinal.json", out)


# ---------------------------------------------------------------------------
# Reliability
# ---------------------------------------------------------------------------

def omega_ml(R):
    """Algorithm oracle: one-factor ML on a correlation matrix (uniquenesses bounded at .005)."""
    p = R.shape[0]

    def obj(psi):
        s = 1 / np.sqrt(psi)
        Rs = R * np.outer(s, s)
        ev = np.linalg.eigvalsh(Rs)[::-1]
        e = ev[1:]
        return -np.sum(np.log(e) - e + 1)

    psi0 = 1 / np.diag(np.linalg.inv(R))
    r = so.minimize(obj, psi0, method="L-BFGS-B", bounds=[(0.005, 1)] * p, options=dict(ftol=1e-16, gtol=1e-12, maxiter=10000))
    psi = r.x
    s = 1 / np.sqrt(psi)
    ev, evec = np.linalg.eigh(R * np.outer(s, s))
    lam = np.sqrt(psi) * evec[:, -1] * np.sqrt(max(ev[-1] - 1, 0))
    if lam.sum() < 0:
        lam = -lam
    return float(lam.sum() ** 2 / (lam.sum() ** 2 + psi.sum())), tolist(lam)


def reliability_block(data):
    k = data.shape[1]
    alpha = float(pg.cronbach_alpha(data=data)[0])
    R = data.corr().values
    rbar = (R.sum() - k) / (k * (k - 1))
    total = data.sum(axis=1)
    rows = []
    Rinv = np.linalg.inv(R)
    for i, c in enumerate(data.columns):
        rest = total - data[c]
        rows.append(dict(
            meanDel=float(rest.mean()), varDel=float(rest.var(ddof=1)), rit=float(np.corrcoef(data[c], rest)[0, 1]),
            smc=float(1 - 1 / Rinv[i, i]), alphaDel=float(pg.cronbach_alpha(data=data.drop(columns=c))[0]),
        ))
    om, lam = omega_ml(R)
    return dict(alpha=alpha, alphaStd=float(k * rbar / (1 + (k - 1) * rbar)), itemTotal=rows, means=tolist(data.mean()),
                sds=tolist(data.std(ddof=1)), scaleMean=float(total.mean()), scaleVar=float(total.var(ddof=1)), omega=om, loadings=lam,
                meanInterItemR=float(rbar))


def reliability_fixture():
    cols = ["r1", "r2", "r3", "r4"]
    out = dict(unweighted=reliability_block(df[cols]))
    rep = replicate(df, df["wt"].values)
    out["weighted"] = reliability_block(rep[cols])
    out["positive"] = reliability_block(df[["s1", "s2", "s3", "s4"]])
    dump("reliability.json", out)


# ---------------------------------------------------------------------------
# Factor analysis
# ---------------------------------------------------------------------------

def orient(L):
    L = L.copy()
    for k in range(L.shape[1]):
        if L[:, k].sum() < 0:
            L[:, k] *= -1
    return L


def paf_spss(R, m, eps=0.001, maxit=25):
    """Algorithm oracle: SPSS principal axis factoring (SMC start, stop when max change < eps)."""
    h = 1 - 1 / np.diag(np.linalg.inv(R))
    init = h.copy()
    it = 0
    for it in range(1, maxit + 1):
        Rr = R.copy()
        np.fill_diagonal(Rr, h)
        ev, evec = np.linalg.eigh(Rr)
        order = np.argsort(ev)[::-1][:m]
        L = evec[:, order] * np.sqrt(ev[order])
        hn = (L ** 2).sum(axis=1)
        ch = np.max(np.abs(hn - h))
        h = hn
        if ch < eps:
            break
    return orient(L), init, it


def factor_fixture():
    cols = ["r1", "r2", "r3", "r4", "s1", "s2", "s3", "s4"]
    X = df[cols]
    R = X.corr().values
    kmo_per, kmo = calculate_kmo(X)
    chi2, pb = calculate_bartlett_sphericity(X)
    ev, evec = np.linalg.eigh(R)
    order = np.argsort(ev)[::-1]
    ev, evec = ev[order], evec[:, order]
    m = int(np.sum(ev > 1))
    Lpc = orient(evec[:, :m] * np.sqrt(ev[:m]))
    Lpaf, init, iters = paf_spss(R, m)

    def rot(L, method):
        if method == "oblimin":
            h = np.sqrt((L ** 2).sum(axis=1))
            A = L / h[:, None]
            r = Rotator(method="oblimin", max_iter=100000, tol=1e-13)
            P = r.fit_transform(A) * h[:, None]
            phi = r.phi_
        elif method == "promax":
            r = Rotator(method="promax", max_iter=100000, tol=1e-15)
            P = r.fit_transform(L)
            phi = r.phi_
        else:
            r = Rotator(method="varimax", max_iter=100000, tol=1e-15)
            P = r.fit_transform(L)
            phi = np.eye(L.shape[1])
        return dict(pattern=tolist(P), phi=tolist(phi))

    rotations = {f"{ext}_{meth}": rot(L, meth) for ext, L in [("pc", Lpc), ("paf", Lpaf)] for meth in ["varimax", "promax", "oblimin"]}
    # Weighted: replicate integer weights
    rep = replicate(df, df["wt"].values)
    Rw = rep[cols].corr().values
    chi2w, _ = calculate_bartlett_sphericity(rep[cols])
    evw = np.sort(np.linalg.eigvalsh(Rw))[::-1]
    dump("factor.json", dict(
        R=tolist(R), kmo=float(kmo), msa=tolist(kmo_per), bartlett=float(chi2), bartlettP=float(pb), det=float(np.linalg.det(R)),
        eigenvalues=tolist(ev), nFactors=m, pcLoadings=tolist(Lpc), pafLoadings=tolist(Lpaf), pafInitial=tolist(init), pafIterations=iters,
        rotations=rotations, weighted=dict(R=tolist(Rw), bartlett=float(chi2w), eigenvalues=tolist(evw)),
    ))


if __name__ == "__main__":
    matrix_fixture()
    regression_fixture()
    logistic_fixture()
    multinomial_fixture()
    ordinal_fixture()
    reliability_fixture()
    factor_fixture()
