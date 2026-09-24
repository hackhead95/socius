# -*- coding: utf-8 -*-
"""Generate the bundled synthetic sample survey for Socius.

"Urban Neighbourhoods and Social Trust Survey" is FICTIONAL. Every respondent, answer and number is
simulated. The data are built from latent variables (socio-economic status, neighbourhood trust,
civic engagement, belonging) so textbook analyses give sensible, significant-but-not-absurd results.

Outputs (reproducible, seeded):
  src/samples/urban_trust_survey.sav   SPSS, bytecode (row) compressed
  public/samples/urban_trust_survey.csv  codes, UTF-8

Run:  /opt/oracle/bin/python scripts/samples/make_survey.py
"""
import datetime as dt
import os
import re
import sys

import numpy as np
import pandas as pd
import pyreadstat

sys.dont_write_bytecode = True  # keep scripts/samples free of __pycache__
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import phrases as P  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SAV_PATH = os.path.join(ROOT, 'src', 'samples', 'urban_trust_survey.sav')
CSV_PATH = os.path.join(ROOT, 'public', 'samples', 'urban_trust_survey.csv')

SEED = 20250117
N = 640
rng = np.random.default_rng(SEED)


def z(x):
    x = np.asarray(x, dtype=float)
    return (x - np.nanmean(x)) / np.nanstd(x)


def logistic(x):
    return 1.0 / (1.0 + np.exp(-x))


def cut(latent, thresholds):
    """Ordinal categories 1..k+1 from a continuous latent and k increasing thresholds."""
    return 1 + np.searchsorted(np.asarray(thresholds), latent)


# ---------------------------------------------------------------------------
# Sampling frame: city, area, interviewer, date
# ---------------------------------------------------------------------------
CITIES = {1: 'Kolkata', 2: 'Delhi', 3: 'Mumbai', 4: 'Bengaluru', 5: 'Chennai'}
city = rng.choice([1, 2, 3, 4, 5], size=N, p=[0.22, 0.21, 0.21, 0.19, 0.17])
p_peri = np.select([city == 1, city == 2, city == 3, city == 4, city == 5], [0.34, 0.42, 0.30, 0.40, 0.36])
area = np.where(rng.random(N) < p_peri, 2, 1)
peri = (area == 2).astype(float)

gender = rng.choice([1, 2, 3], size=N, p=[0.495, 0.48, 0.025])
woman = (gender == 2).astype(float)
other_g = (gender == 3).astype(float)

age = np.clip(np.round(17.0 + rng.gamma(shape=2.3, scale=10.8, size=N)), 18, 85)
agez = (age - 42) / 15

# Latent socio-economic status
city_ses = np.select([city == 1, city == 2, city == 3, city == 4, city == 5], [-0.15, 0.05, 0.10, 0.25, 0.0])
ses = rng.normal(0, 1, N) + 0.35 * (1 - peri) - 0.25 * np.clip(agez, -1, 3) - 0.12 * woman + city_ses
sesz = z(ses)
educ = cut(0.85 * sesz + 0.53 * rng.normal(0, 1, N), [-1.50, -0.95, -0.25, 0.35, 1.15])  # 1..6

# Employment
employ = np.zeros(N, dtype=int)
for i in range(N):
    a, g = age[i], gender[i]
    if a < 25:
        p = [0.25, 0.10, 0.07, 0.13, 0.40, 0.05, 0.0]
    elif a >= 62:
        p = [0.08, 0.05, 0.12, 0.02, 0.0, 0.18, 0.55]
    else:
        p = [0.45, 0.08, 0.22, 0.08, 0.01, 0.16, 0.0]
    p = np.array(p, dtype=float)
    if g == 2:  # women: more homemakers, fewer full-time
        p = p * np.array([0.55, 1.4, 0.6, 0.9, 1.0, 4.0, 0.6])
    elif g == 1:
        p = p * np.array([1.2, 0.9, 1.3, 1.0, 1.0, 0.05, 1.1])
    if educ[i] >= 5:
        p = p * np.array([1.4, 1.0, 0.9, 0.8, 1.2, 0.7, 1.0])
    p = p / p.sum()
    employ[i] = rng.choice(np.arange(1, 8), p=p)

# Marital status: 1 Never married, 2 Married, 3 Separated or divorced, 4 Widowed
marital = np.zeros(N, dtype=int)
for i in range(N):
    a = age[i]
    if a < 24:
        p = [0.82, 0.17, 0.01, 0.0]
    elif a < 32:
        p = [0.40, 0.57, 0.03, 0.0]
    elif a < 55:
        p = [0.07, 0.86, 0.04, 0.03]
    elif a < 70:
        p = [0.03, 0.78, 0.03, 0.16]
    else:
        p = [0.02, 0.58, 0.02, 0.38]
    if gender[i] == 3:
        p = [p[0] + p[1] * 0.5, p[1] * 0.5, p[2], p[3]]
    marital[i] = rng.choice([1, 2, 3, 4], p=np.array(p) / sum(p))

# Migration and years in the neighbourhood
p_mig = np.select([city == 1, city == 2, city == 3, city == 4, city == 5], [0.24, 0.42, 0.44, 0.52, 0.30])
p_mig = np.clip(p_mig + 0.10 * (age < 35) - 0.08 * (age > 60), 0.05, 0.9)
migrant = (rng.random(N) < p_mig).astype(int)
yrs_nbhd = np.where(
    migrant == 1,
    np.minimum(age - 17, np.round(rng.gamma(1.6, 5.0, N))),
    np.minimum(age, np.round((age - 5) * rng.beta(2.2, 1.6, N))),
)
yrs_nbhd = np.clip(yrs_nbhd, 0, None)
logyrs_z = z(np.log1p(yrs_nbhd))

# Household size and income
hh_size = np.clip(rng.poisson(3.1 + 0.6 * peri - 0.35 * sesz + 0.3 * (marital == 2), N) + 1, 1, 12)
hh_size = np.where((migrant == 1) & (marital == 1) & (rng.random(N) < 0.35), rng.choice([1, 2, 3], N), hh_size)
city_inc = np.select([city == 1, city == 2, city == 3, city == 4, city == 5], [-0.20, 0.08, 0.20, 0.25, 0.0])
log_inc = np.log(26000) + 0.45 * sesz + city_inc - 0.20 * peri + 0.05 * (hh_size - 4) + rng.normal(0, 0.55, N)
hh_income = np.clip(np.round(np.exp(log_inc) / 500) * 500, 3000, 600000)

# Discrimination (experienced in last 12 months)
discrim = (rng.random(N) < logistic(-1.75 + 0.75 * migrant + 0.30 * woman + 1.3 * other_g - 0.20 * sesz)).astype(int)

# ---------------------------------------------------------------------------
# Latent neighbourhood trust and the trust battery
# ---------------------------------------------------------------------------
city_trust = np.select([city == 1, city == 2, city == 3, city == 4, city == 5], [0.20, -0.25, 0.0, -0.10, 0.15])
T = (0.32 * logyrs_z + 0.18 * sesz - 0.22 * migrant - 0.40 * discrim + 0.12 * peri + 0.10 * agez + city_trust
     + rng.normal(0, 0.85, N))
T = z(T)


def likert_item(loading, extra=0.0, shift=0.0):
    e = rng.normal(0, 1, N)
    x = loading * T + np.sqrt(1 - loading ** 2) * e + extra
    return cut(x + shift, [-1.35, -0.45, 0.30, 1.25])


trust1 = likert_item(0.74, shift=0.10)
trust2 = likert_item(0.76, shift=0.25)
# Reverse worded: agreeing means LOW trust. Slightly skewed towards agreement.
trust3 = cut(-0.66 * T + np.sqrt(1 - 0.66 ** 2) * rng.normal(0, 1, N) + 0.35, [-1.35, -0.45, 0.30, 1.25])
trust4 = likert_item(0.55, shift=-0.35)  # municipal body: lower, weaker loading
trust5 = likert_item(0.64, extra=-0.30 * woman - 0.35 * other_g + 0.05 * (1 - woman - other_g), shift=0.05)


def add_item_missing(x, p_dk, p_ref):
    x = x.astype(float).copy()
    r = rng.random(N)
    x[r < p_dk] = 8
    x[(r >= p_dk) & (r < p_dk + p_ref)] = 9
    return x


trust1 = add_item_missing(trust1, 0.020, 0.005)
trust2 = add_item_missing(trust2, 0.012, 0.004)
trust3 = add_item_missing(trust3, 0.018, 0.006)
trust4 = add_item_missing(trust4, 0.045, 0.008)
trust5 = add_item_missing(trust5, 0.010, 0.006)

# ---------------------------------------------------------------------------
# Civic participation, belonging, well-being, media, voting
# ---------------------------------------------------------------------------
C = z(0.33 * T + 0.32 * sesz + 0.22 * logyrs_z + 0.12 * agez - 0.15 * woman - 0.1 * migrant + rng.normal(0, 0.85, N))
civic_meet = (rng.random(N) < logistic(-0.85 + 1.00 * C)).astype(int)
civic_vol = (rng.random(N) < logistic(-1.45 + 0.85 * C)).astype(int)
civic_petition = (rng.random(N) < logistic(-1.85 + 0.80 * C + 0.25 * (educ >= 5))).astype(int)
civic_contact = (rng.random(N) < logistic(-1.60 + 0.90 * C)).astype(int)
civic_protest = (rng.random(N) < logistic(-2.75 + 0.60 * C + 0.35 * (age < 30))).astype(int)
civic_n = civic_meet + civic_vol + civic_petition + civic_contact + civic_protest

B = 0.16 * logyrs_z + 0.36 * T + 0.08 * agez - 0.12 * migrant - 0.15 * discrim + rng.normal(0, 0.85, N)
belong = cut(z(B), [-1.45, -0.55, 0.55]).astype(float)
belong[rng.random(N) < 0.008] = 9

health_lat = -0.45 * agez + 0.25 * sesz + rng.normal(0, 0.9, N)
health = cut(z(health_lat), [-1.9, -0.95, 0.15, 1.2])

ls_lat = (0.21 * sesz + 0.20 * T + 0.18 * z(B) + 0.20 * z(health_lat) - 0.22 * discrim - 0.18 * migrant
          + 0.05 * (marital == 2) + rng.normal(0, 0.85, N))
life_sat = np.clip(np.round(6.1 + 1.85 * z(ls_lat)), 0, 10).astype(float)
life_sat[rng.random(N) < 0.012] = np.nan

internet = (rng.random(N) < logistic(1.35 + 1.25 * sesz - 0.95 * agez)).astype(int)
sm = np.exp(np.log(1.6) - 0.35 * agez + 0.10 * (employ == 5) + rng.normal(0, 0.62, N))
sm_hours = np.where(internet == 1, np.clip(np.round(sm * 2) / 2, 0, 12), 0.0)

vote_lin = (-0.95 + 0.62 * agez + 0.035 * yrs_nbhd + 0.28 * civic_n + 0.24 * (educ - 3.5) - 0.40 * migrant
            + 0.05 * rng.normal(0, 1, N))
vote = (rng.random(N) < logistic(vote_lin)).astype(int)
vote[age < 20] = np.where(rng.random((age < 20).sum()) < 0.25, vote[age < 20], 0)  # mostly too young last time

# Design weight: peri-urban and men were under-covered, plus noise from non-response adjustment
cell = np.where(area == 2, 1.30, 0.88) * np.where(gender == 1, 1.08, 0.94) * np.select(
    [city == 1, city == 2, city == 3, city == 4, city == 5], [0.95, 1.10, 1.12, 0.90, 0.93])
wt = cell * np.exp(rng.normal(0, 0.22, N))
for _ in range(5):
    wt = np.clip(wt / wt.mean(), 0.4, 2.5)
wt = np.round(wt, 3)

# ---------------------------------------------------------------------------
# Item non-response on demographics
# ---------------------------------------------------------------------------
age_out = age.astype(float).copy()
age_out[rng.random(N) < 0.022] = np.nan
hh_income_out = hh_income.astype(float).copy()
refuse_inc = rng.random(N) < logistic(-3.4 + 0.6 * sesz)
hh_income_out[refuse_inc] = 999999

# ---------------------------------------------------------------------------
# Fieldwork: interviewers and dates (Jan to Mar 2025)
# ---------------------------------------------------------------------------
FIELD = {  # city: (start, end, interviewers)
    1: (dt.date(2025, 1, 6), dt.date(2025, 2, 14), ['INT01', 'INT02', 'INT03']),
    2: (dt.date(2025, 1, 13), dt.date(2025, 2, 28), ['INT04', 'INT05', 'INT06', 'INT07']),
    3: (dt.date(2025, 2, 3), dt.date(2025, 3, 14), ['INT08', 'INT09', 'INT10']),
    4: (dt.date(2025, 2, 10), dt.date(2025, 3, 21), ['INT11', 'INT12', 'INT13']),
    5: (dt.date(2025, 2, 17), dt.date(2025, 3, 28), ['INT14', 'INT15']),
}
interviewer = []
int_date = []
for i in range(N):
    start, end, ints = FIELD[city[i]]
    interviewer.append(ints[rng.integers(len(ints))])
    d = start + dt.timedelta(days=int(rng.integers((end - start).days + 1)))
    if d.weekday() == 6 and rng.random() < 0.7:  # fewer Sunday interviews
        d = d + dt.timedelta(days=1 if d < end else -1)
    int_date.append(d)

# ---------------------------------------------------------------------------
# Open-ended answers
# ---------------------------------------------------------------------------
TERSE_OK = set()  # answers allowed to repeat


def fill(s, i):
    c = city[i]
    corp = P.CORP_PERI[rng.integers(len(P.CORP_PERI))] if area[i] == 2 and rng.random() < 0.6 else P.CORP[c][rng.integers(len(P.CORP[c]))]
    nb = P.NB_WORDS[c][rng.integers(len(P.NB_WORDS[c]))]
    return (s.replace('{nb}', nb).replace('{corp}', corp)
            .replace('{rs}', str(int(rng.choice([400, 500, 600, 700, 800, 900, 1000, 1200, 1500, 2000, 3000, 5000]))))
            .replace('{hrs}', str(int(rng.choice([2, 3, 3, 4]))))
            .replace('{yrs}', str(int(rng.choice([2, 3, 4, 5, 6, 8, 10, 12, 15, 20]))))
            .replace('{month}', P.MONTHS[rng.integers(len(P.MONTHS))]))


def pick(lst):
    return lst[rng.integers(len(lst))]


def lower_first(s):
    if re.match(r"^(I\b|I'|[A-Z]{2,}|Eid|Diwali|Christmas|Pongal|Durga|Bengaluru|Kolkata|Mumbai|Delhi|Chennai|Hindu|Sunday)", s):
        return s
    return s[0].lower() + s[1:]


def join_opener(op, s):
    return f'{op} {lower_first(s)}'


def challenge_weights(i):
    c, a, g = city[i], area[i], gender[i]
    w = {
        'water': 1.0 + 1.0 * (a == 2) + 0.9 * (c == 5) + 0.6 * (c == 4) + 0.4 * (c == 2),
        'garbage': 1.0 + 0.3 * (c == 1) + 0.3 * (c == 3),
        'traffic': 0.6 + 1.5 * (c == 4) + 0.6 * (c == 3) + 0.5 * (c == 2) + 0.4 * (a == 1),
        'safety': 0.25 + 1.4 * (g == 2) + 1.2 * (g == 3) + 0.5 * (c == 2) + 0.2 * (a == 2),
        'rent': 0.35 + 1.2 * (c == 3) + 0.9 * (c == 4) + 0.6 * migrant[i] + 0.3 * (age[i] < 35),
        'flooding': 0.15 + 1.6 * (c == 3) + 1.4 * (c == 1) + 0.8 * (c == 5),
        'parks': 0.35 + 0.35 * (a == 1) + 0.2 * (hh_size[i] >= 5),
        'youth_jobs': 0.25 + 0.8 * (c == 1) + 0.3 * (a == 2) + 0.4 * (age[i] < 30),
        'noise': 0.25 + 0.3 * (a == 1),
        'streetlights': 0.25 + 0.5 * (a == 2) + 0.35 * (g == 2),
        'air': 0.15 + 1.7 * (c == 2) + 0.4 * (c == 1) + 0.2 * (c == 3),
        'drainage': 0.35 + 0.45 * (a == 2) + 0.4 * (c == 1) + 0.3 * (c == 5),
        'events': 0.15 + 0.35 * (belong[i] <= 2),
        'newcomers': 0.12 + 0.45 * migrant[i] + 0.4 * (c == 4) + 0.2 * (yrs_nbhd[i] > 20),
        'corruption': 0.35 + 0.25 * (g == 1) + 0.3 * (age[i] > 50),
    }
    return w


def connect_weights(i):
    c, g = city[i], gender[i]
    w = {
        'festivals': 1.2 + 0.4 * (c == 1) + 0.2 * (age[i] > 45),
        'meetings': 0.5 + 0.3 * (educ[i] >= 5) + 0.3 * migrant[i],
        'spaces': 0.8 + 0.3 * (area[i] == 1),
        'safer_streets': 0.2 + 0.9 * (g == 2) + 0.8 * (g == 3) + 0.2 * (c == 2),
        'neighbours': 1.0 + 0.4 * migrant[i],
        'language': 0.05 + 0.9 * migrant[i] * ((c == 4) | (c == 5) | (c == 1)),
        'municipal': 0.5 + 0.3 * (area[i] == 2) + 0.2 * (g == 1),
        'youth': 0.3 + 0.4 * (age[i] < 30) + 0.2 * (c == 1),
        'women': 0.05 + 0.8 * (g == 2) + 0.4 * (employ[i] == 6),
        'seniors': 0.05 + 1.0 * (age[i] >= 60),
        'online': 0.2 + 0.4 * internet[i] * (age[i] < 45),
        'time': 0.2 + 0.4 * (employ[i] == 1) + 0.2 * (c == 4) + 0.2 * (c == 3),
        'cleanliness': 0.3,
        'harmony': 0.35 + 0.3 * discrim[i],
        'housing': 0.2 + 0.5 * migrant[i] + 0.3 * (c == 3),
    }
    return w


def choose_themes(weights, k):
    keys = list(weights)
    p = np.array([weights[x] for x in keys], dtype=float)
    p /= p.sum()
    return list(rng.choice(keys, size=k, replace=False, p=p))


def native_lang(i):
    if city[i] == 1:
        return 'bn'
    if city[i] in (2, 3):
        return 'hi'
    if city[i] == 5:
        return 'ta'
    return None


def compose(bank, themes, i, closers):
    """Build one answer from 1-3 themes. Returns (text, is_terse)."""
    t1 = bank[themes[0]]
    e = educ[i]
    # register probabilities: terse, short, medium, long, mixed, native
    pr = np.array([0.12, 0.30, 0.30, 0.13, 0.12, 0.075])
    pr = pr * np.array([1.6 - 0.12 * e, 1.0, 0.6 + 0.12 * e, 0.4 + 0.18 * e, 1.5 - 0.15 * e, 1.0])
    if age[i] > 55:
        pr[3] *= 1.4
    lang = native_lang(i)
    if lang is None or lang not in t1['native']:
        pr[5] = 0
    if lang == 'ta':
        pr[5] *= 0.6
    pr = pr / pr.sum()
    reg = rng.choice(['terse', 'short', 'medium', 'long', 'mixed', 'native'], p=pr)

    if reg == 'terse':
        if len(themes) > 1 and rng.random() < 0.5:
            s = f"{pick(t1['terse'])}, {pick(bank[themes[1]]['terse'])}"
        else:
            s = pick(t1['terse'])
        s = fill(s, i)
        if rng.random() < 0.3:
            s = s[0].upper() + s[1:]
        return s, True
    if reg == 'native':
        return pick(t1['native'][lang]), False
    if reg == 'mixed':
        s = fill(pick(t1['mixed']), i)
        if len(themes) > 1 and rng.random() < 0.5:
            s += ' ' + fill(pick(bank[themes[1]]['mixed'] if rng.random() < 0.5 else bank[themes[1]]['medium']), i)
        return s, False
    if reg == 'short':
        s = fill(pick(t1['medium']), i)
        if rng.random() < 0.25:
            s = join_opener(pick(P.OPENERS), s)
        return s, False
    parts = []
    first = fill(pick(t1['medium']), i)
    parts.append(join_opener(pick(P.OPENERS), first) if rng.random() < 0.45 else first)
    if reg == 'long' or rng.random() < 0.25:
        parts.append(fill(pick(t1['extra']), i))
    for t in themes[1:]:
        s = fill(pick(bank[t]['medium']), i)
        parts.append(join_opener(pick(P.CONNECTORS), s) if rng.random() < 0.7 else s)
        if reg == 'long' and rng.random() < 0.5:
            parts.append(fill(pick(bank[t]['extra']), i))
    if reg == 'long' and rng.random() < 0.6:
        parts.append(pick(closers))
    return ' '.join(parts), False


def messy(s):
    """Occasional informal typing: all lower case, no final full stop."""
    r = rng.random()
    if r < 0.10:
        s = s.lower().rstrip('.')
    elif r < 0.16:
        s = s.rstrip('.')
    return s


def gen_answers(bank, weight_fn, blanks, closers, p_blank):
    out, themes_out = [], []
    seen = set()
    for i in range(N):
        if rng.random() < p_blank:
            out.append(pick(blanks))
            themes_out.append([])
            continue
        for _attempt in range(50):
            k = 1 if rng.random() < 0.58 else (2 if rng.random() < 0.9 else 3)
            th = choose_themes(weight_fn(i), k)
            s, terse = compose(bank, th, i, closers)
            s = messy(s) if not terse else s
            s = re.sub(r'\s+', ' ', s).strip()
            nwords = len(s.split())
            if nwords > 60:
                continue
            if terse or s not in seen:
                break
        seen.add(s)
        out.append(s)
        themes_out.append(th)
    return out, themes_out


q_challenge, th_challenge = gen_answers(P.CHALLENGE, challenge_weights, P.BLANK_CHALLENGE, P.CLOSERS, 0.07)
q_connect, th_connect = gen_answers(P.CONNECT, connect_weights, P.BLANK_CONNECT, P.CONNECT_CLOSERS, 0.09)

# ---------------------------------------------------------------------------
# Assemble, sort by city and date, assign ids
# ---------------------------------------------------------------------------
df = pd.DataFrame({
    'resp_id': 0,
    'city': city, 'area': area, 'interviewer': interviewer, 'int_date': int_date,
    'gender': gender, 'age': age_out, 'educ': educ, 'employ': employ, 'marital': marital,
    'hh_size': hh_size, 'hh_income': hh_income_out, 'migrant': migrant, 'yrs_nbhd': yrs_nbhd,
    'trust1': trust1, 'trust2': trust2, 'trust3': trust3, 'trust4': trust4, 'trust5': trust5,
    'civic_meet': civic_meet, 'civic_vol': civic_vol, 'civic_petition': civic_petition,
    'civic_contact': civic_contact, 'civic_protest': civic_protest,
    'belong': belong, 'life_sat': life_sat, 'health': health, 'internet': internet, 'sm_hours': sm_hours,
    'discrim': discrim, 'vote': vote, 'wt': wt,
    'q_challenge': q_challenge, 'q_connect': q_connect,
})
df['_ch'] = [';'.join(t) for t in th_challenge]
df['_co'] = [';'.join(t) for t in th_connect]
df = df.sort_values(['city', 'int_date', 'interviewer'], kind='stable').reset_index(drop=True)
df['resp_id'] = df.groupby('city').cumcount() + 1 + df['city'] * 1000
themes_df = df[['resp_id', 'city', 'area', 'gender', '_ch', '_co']].copy()
df = df.drop(columns=['_ch', '_co'])

num_cols = [c for c in df.columns if c not in ('interviewer', 'int_date', 'q_challenge', 'q_connect')]
for c in num_cols:
    df[c] = df[c].astype(float)

# ---------------------------------------------------------------------------
# Dictionary
# ---------------------------------------------------------------------------
AGREE = {1.0: 'Strongly disagree', 2.0: 'Disagree', 3.0: 'Neither agree nor disagree', 4.0: 'Agree',
         5.0: 'Strongly agree', 8.0: "Don't know", 9.0: 'Refused'}
NOYES = {0.0: 'No', 1.0: 'Yes'}

labels = {
    'resp_id': 'Respondent ID',
    'city': 'City',
    'area': 'Type of area',
    'interviewer': 'Interviewer code',
    'int_date': 'Date of interview',
    'gender': 'Gender of respondent',
    'age': 'Age in completed years',
    'educ': 'Highest level of education completed',
    'employ': 'Main employment status',
    'marital': 'Marital status',
    'hh_size': 'Number of people usually living in the household',
    'hh_income': 'Total monthly household income from all sources (INR)',
    'migrant': 'Were you born in this city, or did you move here from another state or district?',
    'yrs_nbhd': 'How many years have you lived in this neighbourhood?',
    'trust1': 'Most people in this neighbourhood can be trusted',
    'trust2': 'People around here are willing to help their neighbours',
    'trust3': 'You have to be very careful with people in this neighbourhood',
    'trust4': "I trust the local municipal body to act in residents' interests",
    'trust5': 'I would feel safe walking alone here after dark',
    'civic_meet': "In the last 12 months: attended a residents' welfare association or community meeting",
    'civic_vol': 'In the last 12 months: volunteered for a local group or cause',
    'civic_petition': 'In the last 12 months: signed a petition (paper or online) about a local issue',
    'civic_contact': 'In the last 12 months: contacted a local official or councillor',
    'civic_protest': 'In the last 12 months: took part in a protest, dharna or demonstration',
    'belong': 'How strongly do you feel you belong to this neighbourhood?',
    'life_sat': 'All things considered, how satisfied are you with your life as a whole these days? (0-10)',
    'health': 'In general, how would you rate your health?',
    'internet': 'Do you use the internet (on any device)?',
    'sm_hours': 'On a typical day, how many hours do you spend on social media?',
    'discrim': 'In the last 12 months, have you been treated unfairly or discriminated against in this city?',
    'vote': 'Did you vote in the last municipal (ward) election?',
    'wt': 'Design weight (mean 1)',
    'q_challenge': 'What is the biggest challenge facing your neighbourhood today? (open-ended)',
    'q_connect': 'What would make you feel more connected to your community? (open-ended)',
}

value_labels = {
    'city': {float(k): v for k, v in CITIES.items()},
    'area': {1.0: 'Core city', 2.0: 'Peri-urban'},
    'gender': {1.0: 'Man', 2.0: 'Woman', 3.0: 'Other / prefer to self-describe'},
    'educ': {1.0: 'No formal schooling', 2.0: 'Primary', 3.0: 'Secondary', 4.0: 'Higher secondary',
             5.0: 'Graduate', 6.0: 'Postgraduate'},
    'employ': {1.0: 'Employed full-time', 2.0: 'Employed part-time', 3.0: 'Self-employed',
               4.0: 'Unemployed, looking for work', 5.0: 'Student', 6.0: 'Homemaker', 7.0: 'Retired'},
    'marital': {1.0: 'Never married', 2.0: 'Married', 3.0: 'Separated or divorced', 4.0: 'Widowed'},
    'hh_income': {999999.0: 'Refused'},
    'migrant': {0.0: 'Born in this city', 1.0: 'Migrated from another state or district'},
    'trust1': AGREE, 'trust2': AGREE, 'trust3': AGREE, 'trust4': AGREE, 'trust5': AGREE,
    'civic_meet': NOYES, 'civic_vol': NOYES, 'civic_petition': NOYES, 'civic_contact': NOYES,
    'civic_protest': NOYES,
    'belong': {1.0: 'Not at all', 2.0: 'Not very strongly', 3.0: 'Fairly strongly', 4.0: 'Very strongly',
               9.0: 'Refused'},
    'life_sat': {0.0: 'Extremely dissatisfied', 10.0: 'Extremely satisfied'},
    'health': {1.0: 'Very poor', 2.0: 'Poor', 3.0: 'Fair', 4.0: 'Good', 5.0: 'Very good'},
    'internet': NOYES, 'discrim': NOYES, 'vote': NOYES,
}

missing = {
    'hh_income': [999999.0],
    'trust1': [8.0, 9.0], 'trust2': [8.0, 9.0], 'trust3': [8.0, 9.0], 'trust4': [8.0, 9.0], 'trust5': [8.0, 9.0],
    'belong': [9.0],
}

measure = {
    'resp_id': 'nominal', 'city': 'nominal', 'area': 'nominal', 'interviewer': 'nominal', 'int_date': 'scale',
    'gender': 'nominal', 'age': 'scale', 'educ': 'ordinal', 'employ': 'nominal', 'marital': 'nominal',
    'hh_size': 'scale', 'hh_income': 'scale', 'migrant': 'nominal', 'yrs_nbhd': 'scale',
    'trust1': 'ordinal', 'trust2': 'ordinal', 'trust3': 'ordinal', 'trust4': 'ordinal', 'trust5': 'ordinal',
    'civic_meet': 'nominal', 'civic_vol': 'nominal', 'civic_petition': 'nominal', 'civic_contact': 'nominal',
    'civic_protest': 'nominal', 'belong': 'ordinal', 'life_sat': 'scale', 'health': 'ordinal',
    'internet': 'nominal', 'sm_hours': 'scale', 'discrim': 'nominal', 'vote': 'nominal', 'wt': 'scale',
    'q_challenge': 'nominal', 'q_connect': 'nominal',
}

fmt = {
    'resp_id': 'F4.0', 'city': 'F1.0', 'area': 'F1.0', 'interviewer': 'A5', 'int_date': 'DATE11',
    'gender': 'F1.0', 'age': 'F3.0', 'educ': 'F1.0', 'employ': 'F1.0', 'marital': 'F1.0',
    'hh_size': 'F2.0', 'hh_income': 'F8.0', 'migrant': 'F1.0', 'yrs_nbhd': 'F3.0',
    'trust1': 'F1.0', 'trust2': 'F1.0', 'trust3': 'F1.0', 'trust4': 'F1.0', 'trust5': 'F1.0',
    'civic_meet': 'F1.0', 'civic_vol': 'F1.0', 'civic_petition': 'F1.0', 'civic_contact': 'F1.0',
    'civic_protest': 'F1.0', 'belong': 'F1.0', 'life_sat': 'F2.0', 'health': 'F1.0', 'internet': 'F1.0',
    'sm_hours': 'F4.1', 'discrim': 'F1.0', 'vote': 'F1.0', 'wt': 'F6.3',
}
# Open-ended string widths: pyreadstat sizes them to the longest answer in UTF-8 bytes (over 255,
# so they are stored as SPSS very long strings).

display_width = {
    'resp_id': 6, 'city': 10, 'area': 10, 'interviewer': 8, 'int_date': 11, 'gender': 8, 'age': 5, 'educ': 8,
    'employ': 8, 'marital': 8, 'hh_size': 6, 'hh_income': 9, 'migrant': 8, 'yrs_nbhd': 6,
    'life_sat': 6, 'sm_hours': 6, 'wt': 7, 'q_challenge': 40, 'q_connect': 40,
}

FILE_LABEL = 'Synthetic teaching data: urban social trust survey (fictional)'
assert len(FILE_LABEL.encode('utf-8')) <= 64
# SPSS document lines are at most 80 bytes each.
NOTES = [
    'FICTIONAL DATA for teaching and software testing (Socius sample dataset).',
    'Generated by scripts/samples/make_survey.py. No real people were interviewed.',
    'Design (simulated): 640 households in Kolkata, Delhi, Mumbai, Bengaluru and',
    'Chennai, core city and peri-urban areas, interviewed January to March 2025.',
    'trust3 is reverse-worded: recode it (6 - x) before building a trust scale.',
    "Missing codes: trust1-trust5 8 = Don't know, 9 = Refused; belong 9 = Refused;",
    'hh_income 999999 = Refused. Weight cases by wt for population estimates.',
]
assert all(len(n.encode('utf-8')) <= 80 for n in NOTES)

pyreadstat.write_sav(
    df, SAV_PATH, file_label=FILE_LABEL, column_labels=labels, row_compress=True, note=NOTES,
    variable_value_labels=value_labels, missing_ranges=missing, variable_display_width=display_width,
    variable_measure=measure, variable_format=fmt,
)

# CSV (codes). Dates as ISO yyyy-mm-dd, system-missing as empty cells.
csv = df.copy()
csv['int_date'] = [d.isoformat() for d in csv['int_date']]
for c in num_cols:
    if c == 'wt' or c == 'sm_hours':
        continue
    csv[c] = csv[c].astype('Int64')
csv.to_csv(CSV_PATH, index=False, encoding='utf-8', lineterminator='\n')

# Optional: the themes each open answer was built from, for checking qualitative crosstabs.
# Usage: make_survey.py --themes /some/path/themes.csv  (not shipped with the app)
if '--themes' in sys.argv:
    themes_df.to_csv(sys.argv[sys.argv.index('--themes') + 1], index=False)

print(f'wrote {SAV_PATH} ({os.path.getsize(SAV_PATH) / 1024:.1f} KB)')
print(f'wrote {CSV_PATH} ({os.path.getsize(CSV_PATH) / 1024:.1f} KB)')
