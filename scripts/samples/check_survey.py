# -*- coding: utf-8 -*-
"""Read back the synthetic sample survey and print the checks a sociologist would run first.

Run:  /opt/oracle/bin/python scripts/samples/check_survey.py [--themes themes.csv]
(--themes takes the optional file written by make_survey.py --themes, to crosstab the open-answer themes.)
"""
import os
import re
import sys

import numpy as np
import pandas as pd
import pyreadstat
import statsmodels.api as sm
from scipy import stats

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SAV = os.path.join(ROOT, 'src', 'samples', 'urban_trust_survey.sav')

raw, meta = pyreadstat.read_sav(SAV, user_missing=True, disable_datetime_conversion=False)
df, _ = pyreadstat.read_sav(SAV)  # user-missing -> NaN


def h(title):
    print('\n' + '=' * 78 + '\n' + title + '\n' + '=' * 78)


h('File')
print('size (KB):', round(os.path.getsize(SAV) / 1024, 1))
print('file label:', meta.file_label)
print('cases:', meta.number_rows, ' variables:', meta.number_columns)
print('names:', ' '.join(meta.column_names))
print('notes:', len(meta.notes), 'lines')
print('missing declared:', {k: v for k, v in meta.missing_ranges.items()})
print('formats:', {k: meta.original_variable_types[k] for k in ['int_date', 'hh_income', 'wt', 'q_challenge', 'q_connect']})
print('measures:', dict(list(meta.variable_measure.items())[:8]), '...')
print('int_date range:', raw['int_date'].min(), 'to', raw['int_date'].max())

h('Frequencies (unweighted)')
for v in ['city', 'area', 'gender', 'educ', 'employ', 'marital', 'migrant', 'belong', 'health']:
    vc = raw[v].value_counts(dropna=False).sort_index()
    lab = meta.variable_value_labels.get(v, {})
    print(f'{v}: ' + ', '.join(f'{lab.get(k, k)}={n}' for k, n in vc.items()))
for v in ['civic_meet', 'civic_vol', 'civic_petition', 'civic_contact', 'civic_protest', 'internet', 'discrim', 'vote']:
    print(f'{v}: % yes = {100 * df[v].mean():.1f}')

h('Scale variables')
desc = df[['age', 'hh_size', 'hh_income', 'yrs_nbhd', 'life_sat', 'sm_hours', 'wt']].describe().T
desc['skew'] = df[desc.index].skew()
desc['sysmis/usermis'] = raw[desc.index].isna().sum().astype(str) + '/' + (df[desc.index].isna().sum() - raw[desc.index].isna().sum()).astype(str)
print(desc.round(2).to_string())

h('Trust battery: Cronbach alpha (trust3 reverse-coded, 8/9 excluded, listwise)')
items = df[['trust1', 'trust2', 'trust3', 'trust4', 'trust5']].copy()
for c in items:
    print(f'{c}: ' + ', '.join(f'{int(k)}={n}' for k, n in raw[c].value_counts().sort_index().items()))
print('corr with trust3 before reversing:', items.corr().loc['trust3'].round(2).to_dict())
items['trust3'] = 6 - items['trust3']
it = items.dropna()
k = it.shape[1]
alpha = k / (k - 1) * (1 - it.var(ddof=1).sum() / it.sum(axis=1).var(ddof=1))
print(f'N listwise = {len(it)}, alpha = {alpha:.3f}')
print('inter-item r:\n', it.corr().round(2).to_string())
for c in it:
    rest = it.drop(columns=c).sum(axis=1)
    others = it.drop(columns=c)
    a_del = (k - 1) / (k - 2) * (1 - others.var(ddof=1).sum() / others.sum(axis=1).var(ddof=1))
    print(f'  {c}: corrected item-total r = {np.corrcoef(it[c], rest)[0, 1]:.3f}, alpha if deleted = {a_del:.3f}')

h('Crosstab gender x trust5 (feel safe after dark)')
ct = pd.crosstab(df['gender'], df['trust5'])
print(ct.to_string())
print('row %:\n', (100 * ct.div(ct.sum(axis=1), axis=0)).round(1).to_string())
chi2, p, dof, exp = stats.chi2_contingency(ct)
n = ct.values.sum()
print(f'All genders: chi2({dof}, N={n}) = {chi2:.2f}, p = {p:.4g}, Cramer V = {np.sqrt(chi2 / (n * (min(ct.shape) - 1))):.3f}, cells exp<5 = {(exp < 5).sum()}')
ct2 = ct.loc[[1.0, 2.0]]
chi2, p, dof, exp = stats.chi2_contingency(ct2)
n = ct2.values.sum()
print(f'Men vs women: chi2({dof}, N={n}) = {chi2:.2f}, p = {p:.4g}, Cramer V = {np.sqrt(chi2 / n):.3f}')
m = df.groupby('gender')['trust5'].mean()
print('mean trust5 by gender:', m.round(2).to_dict())

h('Correlation yrs_nbhd x belong')
d = df[['yrs_nbhd', 'belong']].dropna()
r, p = stats.pearsonr(d['yrs_nbhd'], d['belong'])
rho, p2 = stats.spearmanr(d['yrs_nbhd'], d['belong'])
print(f'N = {len(d)}, Pearson r = {r:.3f} (p = {p:.3g}), Spearman rho = {rho:.3f} (p = {p2:.3g})')

h('Logistic regression: vote ~ age + yrs_nbhd + civic_n + educ + migrant')
d = df.copy()
d['civic_n'] = d[['civic_meet', 'civic_vol', 'civic_petition', 'civic_contact', 'civic_protest']].sum(axis=1)
d = d[['vote', 'age', 'yrs_nbhd', 'civic_n', 'educ', 'migrant']].dropna()
X = sm.add_constant(d[['age', 'yrs_nbhd', 'civic_n', 'educ', 'migrant']])
res = sm.Logit(d['vote'], X).fit(disp=0)
print(f'N = {len(d)}, % voted = {100 * d.vote.mean():.1f}, LR chi2({int(res.df_model)}) = {res.llr:.2f}, p = {res.llr_pvalue:.3g}, McFadden R2 = {res.prsquared:.3f}')
nag = (1 - np.exp(2 * (res.llnull - res.llf) / len(d))) / (1 - np.exp(2 * res.llnull / len(d)))
print(f'Nagelkerke R2 = {nag:.3f}')
out = pd.DataFrame({'B': res.params, 'SE': res.bse, 'Wald': (res.params / res.bse) ** 2, 'p': res.pvalues, 'Exp(B)': np.exp(res.params)})
print(out.round(4).to_string())
pred = (res.predict(X) >= 0.5).astype(int)
print(f'classification accuracy = {100 * (pred == d.vote).mean():.1f}%')

h('Independent t-test: life_sat by migrant')
a = df.loc[df.migrant == 0, 'life_sat'].dropna()
b = df.loc[df.migrant == 1, 'life_sat'].dropna()
t, p = stats.ttest_ind(a, b)
tw, pw = stats.ttest_ind(a, b, equal_var=False)
lev = stats.levene(a, b)
sp = np.sqrt(((len(a) - 1) * a.var() + (len(b) - 1) * b.var()) / (len(a) + len(b) - 2))
print(f'born here: n={len(a)}, M={a.mean():.2f}, SD={a.std():.2f}; migrant: n={len(b)}, M={b.mean():.2f}, SD={b.std():.2f}')
print(f'Student t({len(a) + len(b) - 2}) = {t:.3f}, p = {p:.4g}; Welch t = {tw:.3f}, p = {pw:.4g}; Levene F = {lev.statistic:.2f}, p = {lev.pvalue:.3f}; d = {(a.mean() - b.mean()) / sp:.3f}')

h('One-way ANOVA: life_sat by educ')
groups = [g['life_sat'].dropna() for _, g in df.groupby('educ')]
F, p = stats.f_oneway(*groups)
allv = pd.concat(groups)
ssb = sum(len(g) * (g.mean() - allv.mean()) ** 2 for g in groups)
sst = ((allv - allv.mean()) ** 2).sum()
print(df.groupby('educ')['life_sat'].agg(['count', 'mean', 'std']).round(2).to_string())
print(f'F({len(groups) - 1}, {len(allv) - len(groups)}) = {F:.2f}, p = {p:.4g}, eta2 = {ssb / sst:.3f}')

h('Other sanity checks')
print('corr ses proxies: educ x log income r =',
      round(df[['educ']].assign(li=np.log(df.hh_income)).corr().iloc[0, 1], 3))
tr = it.mean(axis=1)
dd = df.loc[it.index]
print('trust scale mean by migrant:', tr.groupby(dd.migrant).mean().round(2).to_dict())
print('trust scale mean by discrim:', tr.groupby(dd.discrim).mean().round(2).to_dict())
print('trust scale x civic count r =', round(np.corrcoef(tr, dd[['civic_meet', 'civic_vol', 'civic_petition', 'civic_contact', 'civic_protest']].sum(axis=1))[0, 1], 3))
print('weighted vs unweighted % peri-urban:', round(100 * (df.area == 2).mean(), 1), round(100 * np.average(df.area == 2, weights=df.wt), 1))
print('weight: mean', round(df.wt.mean(), 3), 'min', df.wt.min(), 'max', df.wt.max())

h('Open-ended answers')
for q in ['q_challenge', 'q_connect']:
    s = raw[q].fillna('')
    words = s.str.split().str.len()
    nonblank = s[s.str.strip() != '']
    native = s[s.apply(lambda x: bool(re.search(r'[\u0900-\u097F\u0980-\u09FF\u0B80-\u0BFF]', x)))]
    n_bn = native.str.contains('[\u0980-\u09FF]').sum()
    n_hi = native.str.contains('[\u0900-\u0963\u0966-\u097F]').sum()  # U+0964 danda is shared with Bengali
    n_ta = native.str.contains('[\u0B80-\u0BFF]').sum()
    print(f'{q}: distinct = {s.nunique()}, blank = {(s.str.strip() == "").sum()}, words min/median/max (non-blank) = '
          f'{words[s.str.strip() != ""].min()}/{int(words[s.str.strip() != ""].median())}/{words.max()}, '
          f'native script = {len(native)} (bn {n_bn}, hi {n_hi}, ta {n_ta}), '
          f'max bytes = {s.str.encode("utf-8").str.len().max()}')
    dup = nonblank[nonblank.duplicated(keep=False)]
    print('  repeated answers:', dup.value_counts().head(8).to_dict())
    print('  examples:')
    for x in s.sample(6, random_state=3):
        print('   -', x)

if '--themes' in sys.argv:
    th = pd.read_csv(sys.argv[sys.argv.index('--themes') + 1]).fillna('')
    h('Theme crosstabs (from generator, not in the dataset)')
    names = {1: 'Kol', 2: 'Del', 3: 'Mum', 4: 'Blr', 5: 'Che'}
    rows = []
    for _, r in th.iterrows():
        for t in r['_ch'].split(';'):
            if t:
                rows.append((t, names[r.city], {1: 'Man', 2: 'Woman', 3: 'Other'}[r.gender], {1: 'Core', 2: 'Peri'}[r.area]))
    t = pd.DataFrame(rows, columns=['theme', 'city', 'gender', 'area'])
    ncity = th.city.map(names).value_counts()
    print('q_challenge: % of respondents in each city mentioning theme')
    print((100 * pd.crosstab(t.theme, t.city) / ncity).round(0).to_string())
    ng = th.gender.map({1: 'Man', 2: 'Woman', 3: 'Other'}).value_counts()
    print('by gender (%):')
    print((100 * pd.crosstab(t.theme, t.gender) / ng).round(0).to_string())
