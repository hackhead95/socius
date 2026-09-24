"""Numerical oracle for the procedure fuzz suite (tests/fuzz/procedures-oracle.fuzz.test.ts).

Reads a JSON list of cases on stdin, writes a JSON list of results (same order) on stdout.
Each case: {"kind": ..., plus arrays}. Frequency weights are applied by replicating cases.
    /opt/oracle/bin/python scripts/fuzz/oracle.py < cases.json
"""
import json
import math
import sys
import warnings

import numpy as np
import pandas as pd
import pingouin as pg
import statsmodels.api as sm
from scipy import stats

warnings.filterwarnings("ignore")


def rep(x, w):
    x = np.asarray(x, dtype=float)
    if w is None:
        return x
    return np.repeat(x, np.asarray(w, dtype=int))


def clean(v):
    if isinstance(v, (list, tuple, np.ndarray)):
        return [clean(x) for x in v]
    if v is None:
        return None
    v = float(v)
    return None if (math.isnan(v) or math.isinf(v)) else v


def run(c):
    k = c["kind"]
    w = c.get("w")
    if k == "descriptives":
        x = rep(c["x"], w)
        return {"mean": x.mean(), "sd": x.std(ddof=1), "skew": stats.skew(x, bias=False), "kurt": stats.kurtosis(x, bias=False)}
    if k == "anova":
        gs = [rep(g, gw) for g, gw in zip(c["groups"], c.get("gw") or [None] * len(c["groups"]))]
        f, p = stats.f_oneway(*gs)
        lev = stats.levene(*gs, center="mean")
        df = pd.DataFrame({"y": np.concatenate(gs), "g": np.concatenate([[i] * len(g) for i, g in enumerate(gs)])})
        wa = pg.welch_anova(df, dv="y", between="g")
        return {"F": f, "p": p, "levene": lev.statistic, "levene_p": lev.pvalue, "welchF": float(wa["F"].iloc[0]), "welchP": float(wa["p_unc"].iloc[0] if "p_unc" in wa else wa["p-unc"].iloc[0]), "welchDf2": float(wa["ddof2"].iloc[0])}
    if k == "ttest_ind":
        a, b = rep(c["a"], c.get("wa")), rep(c["b"], c.get("wb"))
        eq = stats.ttest_ind(a, b, equal_var=True)
        we = stats.ttest_ind(a, b, equal_var=False)
        va, vb = a.var(ddof=1) / len(a), b.var(ddof=1) / len(b)
        dfw = (va + vb) ** 2 / (va ** 2 / (len(a) - 1) + vb ** 2 / (len(b) - 1))
        lev = stats.levene(a, b, center="mean")
        return {"t": eq.statistic, "p": eq.pvalue, "tw": we.statistic, "pw": we.pvalue, "dfw": dfw, "levene": lev.statistic}
    if k == "ttest_1samp":
        x = rep(c["x"], w)
        r = stats.ttest_1samp(x, c["mu"])
        return {"t": r.statistic, "p": r.pvalue}
    if k == "corr":
        x, y = rep(c["x"], w), rep(c["y"], w)
        return {"r": stats.pearsonr(x, y)[0], "p": stats.pearsonr(x, y)[1], "rho": stats.spearmanr(x, y)[0], "rhoP": stats.spearmanr(x, y)[1], "tau": stats.kendalltau(x, y, variant="b")[0]}
    if k == "mannwhitney":
        a, b = rep(c["a"], c.get("wa")), rep(c["b"], c.get("wb"))
        r = stats.mannwhitneyu(a, b, alternative="two-sided", method="asymptotic", use_continuity=False)
        u1 = r.statistic
        return {"U": min(u1, len(a) * len(b) - u1), "p": r.pvalue}
    if k == "kruskal":
        gs = [rep(g, gw) for g, gw in zip(c["groups"], c.get("gw") or [None] * len(c["groups"]))]
        r = stats.kruskal(*gs)
        return {"H": r.statistic, "p": r.pvalue}
    if k == "wilcoxon":
        x, y = rep(c["x"], w), rep(c["y"], w)
        d = y - x
        d = d[d != 0]
        r = stats.wilcoxon(d, zero_method="wilcox", correction=False, method="approx")
        return {"p": r.pvalue}
    if k == "friedman":
        cols = [rep(v, w) for v in c["cols"]]
        r = stats.friedmanchisquare(*cols)
        return {"chi2": r.statistic, "p": r.pvalue}
    if k == "chi2":
        t = np.asarray(c["table"], dtype=float)
        chi2, p, dof, _ = stats.chi2_contingency(t, correction=False)
        g, gp, _, _ = stats.chi2_contingency(t, correction=False, lambda_="log-likelihood")
        return {"chi2": chi2, "p": p, "df": dof, "G": g, "Gp": gp}
    if k == "ols":
        y = rep(c["y"], w)
        X = np.column_stack([rep(v, w) for v in c["X"]])
        m = sm.OLS(y, sm.add_constant(X)).fit()
        return {"b": list(m.params), "se": list(m.bse), "r2": m.rsquared, "F": m.fvalue}
    if k == "logit":
        y = rep(c["y"], w)
        X = np.column_stack([rep(v, w) for v in c["X"]])
        m = sm.Logit(y, sm.add_constant(X)).fit(disp=0, maxiter=200)
        return {"b": list(m.params), "se": list(m.bse)}
    if k == "alpha":
        df = pd.DataFrame(np.column_stack([rep(v, w) for v in c["cols"]]))
        return {"alpha": pg.cronbach_alpha(df)[0]}
    raise ValueError("unknown kind " + k)


def main():
    cases = json.load(sys.stdin)
    out = []
    for c in cases:
        try:
            r = run(c)
            out.append({k: clean(v) for k, v in r.items()})
        except Exception as e:  # noqa: BLE001
            out.append({"error": f"{type(e).__name__}: {e}"})
    sys.stdout.write(json.dumps(out))


if __name__ == "__main__":
    main()
