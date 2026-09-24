"""Oracle for logit models under (quasi-)complete separation.

When one predictor category perfectly predicts the outcome, the maximum-likelihood estimates of the
parameters involved are infinite. Socius (like SPSS NOMREG) reports the estimates at the last
iteration with very large standard errors for those parameters, and ordinary estimates and
standard errors for the rest. Those "unaffected" estimates converge to the maximum-likelihood
estimates of a well-defined limiting model, which this script fits with statsmodels:

* binary / ordinal / multinomial: every case in the separating category ends up fitted perfectly,
  so it drops out of the likelihood in the limit. The limiting model is the same model fitted
  without those cases (and without the dummy for that category).
* the bundled sample survey (employ on age + gender; no "Other" gender respondent is a Student or
  Retired): here the cases do not drop out, so statsmodels MNLogit is run on the full data with many
  Newton iterations. Its unaffected parameters converge to the same limit as ours (they change by
  less than 1e-8 between 35 and 200 iterations).

Reads tests/stats-models/fixtures/socio_data.json and logistic.json (written by models_oracle.py)
and src/samples/urban_trust_survey.sav; writes tests/stats-models/fixtures/separation.json.

    /opt/oracle/bin/python scripts/oracle/models_separation.py
"""

import json
import os
import warnings

import numpy as np
import pyreadstat
import statsmodels.api as sm
from statsmodels.miscmodels.ordinal_model import OrderedModel

warnings.filterwarnings("ignore")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FIX = os.path.join(ROOT, "tests", "stats-models", "fixtures")


def tolist(x):
    return np.asarray(x, dtype=float).tolist()


with open(os.path.join(FIX, "socio_data.json")) as f:
    socio = {k: np.asarray(v, dtype=float) for k, v in json.load(f).items()}
with open(os.path.join(FIX, "logistic.json")) as f:
    ysep = np.asarray(json.load(f)["ySeparated"], dtype=float)

educ, age, female, region = socio["educ"], socio["age"], socio["female"], socio["region"]
keep = region != 3
out = {}

# Binary: region == 3 has no voters. Limit = Logit without region-3 cases and without that dummy.
Xb = sm.add_constant(np.column_stack([educ, age, female, (region == 2) * 1.0])[keep])
rb = sm.Logit(ysep[keep], Xb).fit(disp=0, tol=1e-14, maxiter=200)
out["binary"] = dict(params=tolist(rb.params), bse=tolist(rb.bse), llf=float(rb.llf))

# Ordinal: likert forced to the lowest category (1) for region == 3.
lik = socio["likert"].copy()
lik[region == 3] = 1
yo = lik.astype(int) - 1
Xo = np.column_stack([educ, age, female, (region == 2) * 1.0])[keep]
mo = OrderedModel(yo[keep], Xo, distr="logit")
ro = mo.fit(method="newton", maxiter=200, disp=0, gtol=1e-12)
k = Xo.shape[1]
raw = np.asarray(ro.params)
J = 5
th = mo.transform_threshold_params(raw)[1:-1]
Jac = np.zeros((J - 1, J - 1))
for j in range(J - 1):
    Jac[j, 0] = 1
    for i in range(1, j + 1):
        Jac[j, i] = np.exp(raw[k + i])
cov = np.asarray(ro.cov_params())
out["ordinal"] = dict(
    likert=tolist(lik),
    thresholds=tolist(th),
    seThresholds=tolist(np.sqrt(np.diag(Jac @ cov[k:, k:] @ Jac.T))),
    beta=tolist(raw[:k]),
    seBeta=tolist(np.sqrt(np.diag(cov)[:k])),
    llf=float(ro.llf),
)

# Multinomial: every region == 3 case chooses party 2 (Centre). Reference = party 3 (last).
party = socio["party"].copy()
party[region == 3] = 2
yy = np.where(party == 3, 0, party)  # statsmodels baseline = lowest code, so recode 3 -> 0
Xm = sm.add_constant(np.column_stack([educ, age, female, (region == 2) * 1.0])[keep])
rm = sm.MNLogit(yy[keep], Xm).fit(method="newton", tol=1e-14, maxiter=200, disp=0)
out["multinomial"] = dict(party=tolist(party), cats=[1, 2], params=tolist(np.asarray(rm.params).T), bse=tolist(np.asarray(rm.bse).T), llf=float(rm.llf))

# Sample survey: employ (7 categories, reference Retired = 7) on age + gender (reference Man).
df, meta = pyreadstat.read_sav(os.path.join(ROOT, "src", "samples", "urban_trust_survey.sav"))  # user-missing -> NaN
d = df[["employ", "age", "gender"]].dropna()
ys = np.where(d["employ"].values == 7, 0, d["employ"].values)
Xs = np.column_stack([np.ones(len(d)), d["age"].values, (d["gender"].values == 2) * 1.0, (d["gender"].values == 3) * 1.0])
rs = sm.MNLogit(ys, Xs).fit(method="newton", maxiter=200, disp=0)
out["sample"] = dict(
    n=int(len(d)),
    cats=[1, 2, 3, 4, 5, 6],
    params=tolist(np.asarray(rs.params).T),
    bse=tolist(np.asarray(rs.bse).T),
    llf=float(rs.llf),
)

path = os.path.join(FIX, "separation.json")
with open(path, "w") as f:
    json.dump(out, f, separators=(",", ":"))
print(f"wrote {path}")
