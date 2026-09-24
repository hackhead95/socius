// Transformations on the real sample survey, checked against pandas (the Python oracle reads the
// same .sav with pyreadstat, which turns declared user-missing codes into NaN, as SPSS does in
// transformations). Skipped when the oracle is not installed.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Dataset } from '../../src/core/types';
import { isMissingValue } from '../../src/core/data';
import { reliabilityAnalysis } from '../../src/lib/stats/reliability';
import { importFile } from '../../src/lib/io';
import {
  aggregate, autoRecode, computeVariable, countValues, createScale, rankCases, recodeDifferent, reverseCode, selectCasesTransform, standardize, visualBin,
} from '../../src/lib/transform';
import { HAS_ORACLE, PYTHON } from '../io/helpers';
import { col, vid } from './helpers';

const SAV = fileURLToPath(new URL('../../src/samples/urban_trust_survey.sav', import.meta.url));

const ORACLE = `
import json, sys, numpy as np, pandas as pd, pyreadstat
df, meta = pyreadstat.read_sav(sys.argv[1])
t = [f'trust{i}' for i in range(1, 6)]
out = {}
out['mean3'] = df[t].mean(axis=1).where(df[t].notna().sum(axis=1) >= 3).tolist()
civ = ['civic_meet', 'civic_vol', 'civic_petition', 'civic_contact', 'civic_protest']
out['civsum'] = df[civ].sum(axis=1, min_count=1).tolist()
out['count1'] = (df[civ] == 1).sum(axis=1).astype(float).tolist()
out['rndinc'] = [float(np.sign(x) * np.floor(abs(x) / 1000 + 0.5)) if x == x else None for x in df['hh_income']]
d = pd.to_datetime(df['int_date'])
out['year'] = d.dt.year.astype(float).tolist()
out['month'] = d.dt.month.astype(float).tolist()
out['senior'] = [1.0 if a >= 60 else None for a in df['age']]
ag = df['age']
out['agegrp'] = [None if a != a else (1.0 if a <= 29 else (2.0 if a <= 44 else 3.0)) for a in ag]
out['rev3'] = (6 - df['trust3']).tolist()
m = df[t].copy(); m['trust3'] = 6 - m['trust3']
out['scale'] = m.mean(axis=1).where(m.notna().sum(axis=1) >= 3).tolist()
k = m.dropna(); n = k.shape[1]
out['alpha'] = n / (n - 1) * (1 - k.var(ddof=1).sum() / k.sum(axis=1).var(ddof=1))
out['zage'] = ((ag - ag.mean()) / ag.std(ddof=1)).tolist()
out['rank'] = ag.rank(method='average').tolist()
out['agg'] = df.groupby('city')['life_sat'].transform('mean').tolist()
out['sel'] = (ag >= 40).astype(float).where(ag.notna()).tolist()
interv = sorted(df['interviewer'].dropna().unique())
out['auto'] = [float(interv.index(x) + 1) for x in df['interviewer']]
out['autolabels'] = interv
print(json.dumps(out).replace('NaN', 'null'))
`;

type Oracle = Record<string, Array<number | null>> & { alpha: number; autolabels: string[] };

function close(actual: Array<number | string>, expected: Array<number | null>, tol = 1e-9) {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i] as number;
    const e = expected[i];
    if (e === null) expect(Number.isNaN(a), `case ${i + 1}: expected missing, got ${a}`).toBe(true);
    else expect(Math.abs(a - e), `case ${i + 1}: ${a} vs ${e}`).toBeLessThanOrEqual(tol * Math.max(1, Math.abs(e)));
  }
}

describe.skipIf(!HAS_ORACLE)('transformations on the sample survey match pandas', () => {
  let ds: Dataset;
  let o: Oracle;
  beforeAll(async () => {
    ds = (await importFile('urban_trust_survey.sav', new Uint8Array(readFileSync(SAV)))).dataset;
    o = JSON.parse(execFileSync(PYTHON, ['-c', ORACLE, SAV], { encoding: 'utf8' }));
  });
  const run = (target: string, expression: string, condition?: string) => col(computeVariable(ds, { target, expression, condition }).dataset, target);

  it('compute: MEAN.3, SUM, RND, XDATE and IF', () => {
    close(run('m3', 'MEAN.3(trust1 TO trust5)'), o.mean3);
    close(run('m3b', 'MEAN.3(trust1, trust2, trust3, trust4, trust5)'), o.mean3);
    close(run('cs', 'SUM(civic_meet, civic_vol, civic_petition, civic_contact, civic_protest)'), o.civsum);
    close(run('ri', 'RND(hh_income / 1000)'), o.rndinc);
    close(run('yr', 'XDATE.YEAR(int_date)'), o.year);
    close(run('mo', 'XDATE.MONTH(int_date)'), o.month);
    close(run('senior', '1', 'age >= 60'), o.senior);
  });

  it('compute: string functions', () => {
    const r = computeVariable(ds, { target: 'code', expression: "CONCAT(RTRIM(interviewer), '-', LTRIM(STRING(resp_id, F4.0)))" }).dataset;
    expect(col(r, 'code').slice(0, 2)).toEqual(['INT01-1001', 'INT02-1002']);
    const c = computeVariable(ds, { target: 'city3', expression: 'UPCASE(SUBSTR(VALUELABEL(city), 1, 3))' }).dataset;
    expect(col(c, 'city3')[0]).toBe('KOL');
    const none = computeVariable(ds, { target: 'agel', expression: 'VALUELABEL(age)' }).dataset;
    expect(col(none, 'agel')[0]).toBe('');
    const u = computeVariable(ds, { target: 'int3', expression: "LOWER(SUBSTR(interviewer, 1, 3))" }).dataset;
    expect(col(u, 'int3')[0]).toBe('int');
  });

  it('recode into different: LOWEST thru 29, 30 thru 44, 45 thru HIGHEST, ELSE SYSMIS', () => {
    const r = recodeDifferent(ds, {
      targets: [{ sourceId: vid(ds, 'age'), name: 'agegrp' }],
      outType: 'numeric',
      rules: [
        { from: { kind: 'lowest', hi: 29 }, to: { kind: 'value', value: 1 } },
        { from: { kind: 'range', lo: 30, hi: 44 }, to: { kind: 'value', value: 2 } },
        { from: { kind: 'highest', lo: 45 }, to: { kind: 'value', value: 3 } },
        { from: { kind: 'else' }, to: { kind: 'sysmis' } },
      ],
    });
    close(col(r.dataset, 'agegrp'), o.agegrp);
    expect(r.syntax).toMatch(/RECODE age \(LOWEST THRU 29=1\) \(30 THRU 44=2\) \(45 THRU HIGHEST=3\) \(ELSE=SYSMIS\) INTO agegrp/i);
  });

  it('automatic recode of interviewer, reverse-coding trust3, scale with alpha', () => {
    const a = autoRecode(ds, { items: [{ sourceId: vid(ds, 'interviewer'), name: 'int_n' }] }).dataset;
    close(col(a, 'int_n'), o.auto);
    expect(a.variables.find((v) => v.name === 'int_n')!.valueLabels.map((l) => l.label)).toEqual(o.autolabels);

    const rv = reverseCode(ds, { varIds: [vid(ds, 'trust3')], mode: 'new', suffix: '_r' });
    const r3 = col(rv.dataset, 'trust3_r');
    // 8 / 9 (Don't know / Refused) stay as they are and stay declared missing.
    const raw = col(ds, 'trust3') as number[];
    close(r3.map((x, i) => (raw[i] >= 8 ? NaN : x)), o.rev3);
    expect(r3.filter((x, i) => raw[i] >= 8 && x !== raw[i])).toEqual([]);

    const items = ['trust1', 'trust2', 'trust3_r', 'trust4', 'trust5'].map((n) => vid(rv.dataset, n));
    const sc = createScale(rv.dataset, { itemIds: items, method: 'mean', minValid: 3, name: 'trust_idx' });
    close(col(sc.dataset, 'trust_idx'), o.scale);
    // The dialog's alpha (complete cases, same items).
    const rows: number[] = [];
    for (let i = 0; i < ds.nCases; i++) if (items.every((id) => !isMissingValue(rv.dataset.variables.find((v) => v.id === id)!, rv.dataset.columns[id][i]))) rows.push(i);
    const rel = reliabilityAnalysis(items.map((id) => Float64Array.from(rows, (i) => (rv.dataset.columns[id] as Float64Array)[i])), new Float64Array(rows.length).fill(1));
    expect(rel.alpha).toBeCloseTo(o.alpha, 10);
  });

  it('standardize, rank, aggregate, select, count, binning', () => {
    close(col(standardize(ds, [vid(ds, 'age')]).dataset, 'Zage'), o.zage);
    close(col(rankCases(ds, { varIds: [vid(ds, 'age')], order: 'asc', ties: 'mean', type: 'rank' }).dataset, 'Rage'), o.rank);
    const ag = aggregate(ds, { breakIds: [vid(ds, 'city')], items: [{ sourceId: vid(ds, 'life_sat'), fn: 'mean', name: 'ls_mean' }], output: 'add' });
    close(col(ag.dataset, 'ls_mean'), o.agg);
    const sel = selectCasesTransform(ds, { kind: 'if', condition: 'age >= 40' }, 'filter').dataset;
    expect(sel.filterVarId).toBeTruthy();
    const f = col(sel, 'filter_$') as number[];
    close(f.map((x, i) => (Number.isNaN((col(ds, 'age') as number[])[i]) ? NaN : x)), o.sel);
    const civ = ['civic_meet', 'civic_vol', 'civic_petition', 'civic_contact', 'civic_protest'].map((n) => vid(ds, n));
    close(col(countValues(ds, { varIds: civ, values: [{ kind: 'value', value: 1 }], name: 'ncivic' }).dataset, 'ncivic'), o.count1);
    const b = visualBin(ds, { sourceId: vid(ds, 'age'), name: 'age_bin', method: { kind: 'custom', cuts: [29, 44] } }).dataset;
    close(col(b, 'age_bin'), o.agegrp);
  });
});
