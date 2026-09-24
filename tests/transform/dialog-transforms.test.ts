// Logic behind the Automatic recode, Recode into same variables and Sort cases dialogs, run on the
// bundled sample survey and checked against pandas (Python oracle, skipped without Python) and a
// plain reference. The dialogs themselves are covered end to end in e2e/transform-dialogs.spec.ts.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Dataset } from '../../src/core/types';
import { importFile } from '../../src/lib/io';
import { autoRecode, recodeSame, sortCases, sortOrder } from '../../src/lib/transform';
import { HAS_ORACLE, PYTHON } from '../io/helpers';
import { col, vid } from './helpers';

const SAV = join(__dirname, '../../src/samples/urban_trust_survey.sav');
let survey: Dataset;
beforeAll(async () => {
  survey = (await importFile('urban_trust_survey.sav', new Uint8Array(readFileSync(SAV)))).dataset;
});

/** Run a pandas snippet on the survey (as `df`) and parse the JSON it prints. */
function pandas(code: string): unknown {
  const script = `import pyreadstat, json, sys\ndf, meta = pyreadstat.read_sav(sys.argv[1], user_missing=True)\n${code}`;
  return JSON.parse(execFileSync(PYTHON, ['-W', 'ignore', '-c', script, SAV], { encoding: 'utf-8' }));
}

describe('Automatic recode', () => {
  it('codes a string variable 1..k in sorted order, with the old values as labels', () => {
    const r = autoRecode(survey, { items: [{ sourceId: vid(survey, 'interviewer'), name: 'int_n' }] });
    const src = col(survey, 'interviewer').map((s) => String(s).trimEnd());
    const cats = [...new Set(src.filter((s) => s !== ''))].sort();
    const out = col(r.dataset, 'int_n');
    src.forEach((s, i) => expect(out[i]).toBe(s === '' ? NaN : cats.indexOf(s) + 1));
    const v = r.dataset.variables.find((x) => x.name === 'int_n')!;
    expect(v.valueLabels).toEqual(cats.map((c, k) => ({ value: k + 1, label: c })));
    expect(v.measure).toBe('nominal');
    expect(r.syntax).toBe('AUTORECODE VARIABLES=interviewer\n  /INTO int_n\n  /PRINT.');
    expect(r.title).toBe('Automatic Recode');
  });
  it('descending order and a labelled numeric source keep its labels', () => {
    const r = autoRecode(survey, { items: [{ sourceId: vid(survey, 'city'), name: 'city_d' }], descending: true });
    const v = r.dataset.variables.find((x) => x.name === 'city_d')!;
    const city = survey.variables.find((x) => x.name === 'city')!;
    const codes = [...new Set(col(survey, 'city') as number[])].filter((x) => !Number.isNaN(x)).sort((a, b) => b - a);
    expect(v.valueLabels.map((l) => l.label)).toEqual(codes.map((c) => city.valueLabels.find((l) => l.value === c)?.label ?? String(c)));
    expect(r.syntax).toContain('/DESCENDING');
  });
  it('refuses a name that is taken', () => {
    expect(() => autoRecode(survey, { items: [{ sourceId: vid(survey, 'city'), name: 'age' }] })).toThrow(/already exists/);
  });
  it.skipIf(!HAS_ORACLE)('matches pandas (oracle)', () => {
    const want = pandas(`cats = sorted(set(x.rstrip() for x in df['interviewer'] if x.rstrip()))\nprint(json.dumps([cats.index(x.rstrip()) + 1 if x.rstrip() else None for x in df['interviewer']]))`) as Array<number | null>;
    const r = autoRecode(survey, { items: [{ sourceId: vid(survey, 'interviewer'), name: 'int_n' }] });
    expect(col(r.dataset, 'int_n').map((x) => (Number.isNaN(x) ? null : x))).toEqual(want);
  });
});

describe('Recode into same variables', () => {
  const reverse = [1, 2, 3, 4, 5].map((x) => ({ from: { kind: 'value' as const, value: x }, to: { kind: 'value' as const, value: 6 - x } }));
  it('reverses a Likert item in place, leaving other values alone', () => {
    const r = recodeSame(survey, { varIds: [vid(survey, 'trust3')], rules: reverse });
    const before = col(survey, 'trust3') as number[];
    const after = col(r.dataset, 'trust3') as number[];
    before.forEach((x, i) => expect(after[i]).toBe(x >= 1 && x <= 5 ? 6 - x : x));
    expect(r.dataset.variables.find((v) => v.name === 'trust3')!.id).toBe(vid(survey, 'trust3'));
    expect(r.syntax).toContain('RECODE trust3 (1=5) (2=4) (3=3) (4=2) (5=1).');
    expect(col(survey, 'trust3')).toEqual(before); // input untouched
  });
  it('an IF condition limits the recode to some cases', () => {
    const r = recodeSame(survey, { varIds: [vid(survey, 'trust3')], rules: reverse, condition: 'city = 1' });
    const city = col(survey, 'city');
    const before = col(survey, 'trust3') as number[];
    col(r.dataset, 'trust3').forEach((x, i) => expect(x).toBe(city[i] === 1 && before[i] >= 1 && before[i] <= 5 ? 6 - before[i] : before[i]));
    expect(r.syntax).toMatch(/DO IF \(city = 1\)\.\nRECODE trust3/);
  });
  it.skipIf(!HAS_ORACLE)('matches pandas (oracle)', () => {
    const want = pandas(`print(json.dumps([None if x != x else (6 - x if 1 <= x <= 5 else x) for x in df['trust3']]))`) as Array<number | null>;
    const r = recodeSame(survey, { varIds: [vid(survey, 'trust3')], rules: reverse });
    expect(col(r.dataset, 'trust3').map((x) => (Number.isNaN(x) ? null : x))).toEqual(want);
  });
});

describe('Sort cases', () => {
  it('sorts by several keys, stable, system-missing first when ascending', () => {
    const r = sortCases(survey, [{ varId: vid(survey, 'city'), dir: 'asc' }, { varId: vid(survey, 'age'), dir: 'desc' }]);
    const city = col(r.dataset, 'city') as number[];
    const age = col(r.dataset, 'age') as number[];
    const id = col(r.dataset, 'resp_id') as number[];
    for (let i = 1; i < city.length; i++) {
      expect(city[i - 1] <= city[i] || Number.isNaN(city[i - 1])).toBe(true);
      if (city[i - 1] === city[i] && !Number.isNaN(age[i]) && !Number.isNaN(age[i - 1])) {
        expect(age[i - 1]).toBeGreaterThanOrEqual(age[i]);
        if (age[i - 1] === age[i]) expect(id[i - 1]).toBeLessThan(id[i]); // stable: file order kept
      }
    }
    expect(r.syntax).toBe('SORT CASES BY city (A) age (D).');
    expect(new Set(id).size).toBe(survey.nCases);
  });
  it('sorts text by its trimmed value and moves every column together', () => {
    const r = sortCases(survey, [{ varId: vid(survey, 'interviewer'), dir: 'asc' }]);
    const order = sortOrder(survey, [{ varId: vid(survey, 'interviewer'), dir: 'asc' }]);
    const before = col(survey, 'q_challenge');
    expect(col(r.dataset, 'q_challenge')).toEqual(Array.from(order, (i) => before[i]));
  });
  it('asks for a variable', () => {
    expect(() => sortCases(survey, [])).toThrow(/at least one variable/);
  });
  it.skipIf(!HAS_ORACLE)('matches pandas stable sort (oracle)', () => {
    const want = pandas(`import numpy as np\nk = df.assign(c=df['city'].fillna(-np.inf), a=df['age'].fillna(-np.inf))  # SPSS: system-missing sorts lowest\ns = k.sort_values(['c', 'a'], ascending=[True, False], kind='mergesort')\nprint(json.dumps([int(x) for x in s['resp_id']]))`) as number[];
    const r = sortCases(survey, [{ varId: vid(survey, 'city'), dir: 'asc' }, { varId: vid(survey, 'age'), dir: 'desc' }]);
    expect(col(r.dataset, 'resp_id')).toEqual(want);
  });
});
