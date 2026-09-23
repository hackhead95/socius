import { describe, expect, it } from 'vitest';
import {
  addCases, addVariables, aggregate, autoRecode, binLabels, binOf, computeCutpoints, computeVariable, ComputeError, countValues,
  createScale, detectScaleRange, previewBins, previewCompute, rankCases, rankColumn, recodeDifferent, recodeSame, recodeValue,
  reverseCode, selectCasesTransform, selectionValues, sortCases, standardize, visualBin, weightCases, checkWeightVariable, transformLogItem,
  type RecodeRule,
} from '../../src/lib/transform';
import { activeCaseMask } from '../../src/core/data';
import { col, ds, vid } from './helpers';

const nn = (a: Array<number | string>) => a.map((x) => (typeof x === 'number' && Number.isNaN(x) ? null : x));

describe('compute', () => {
  const d = ds([
    { name: 'age', values: [20, 35, null, 70] },
    { name: 'inc', values: [1000, 2500, 4000, 99], opts: { missing: { discrete: [99] } } },
  ]);
  it('creates a new numeric variable with syntax and integer formatting', () => {
    const r = computeVariable(d, { target: 'age2', expression: 'age * 2', label: 'Double age' });
    expect(nn(col(r.dataset, 'age2'))).toEqual([40, 70, null, 140]);
    const v = r.dataset.variables.find((x) => x.name === 'age2')!;
    expect(v.decimals).toBe(0);
    expect(v.label).toBe('Double age');
    expect(r.syntax).toContain('COMPUTE age2=age * 2.');
    expect(r.syntax).toContain("VARIABLE LABELS age2 'Double age'.");
    expect(r.dataset.version).toBe(d.version + 1);
    expect(d.variables.length).toBe(2); // input untouched
  });
  it('IF condition keeps old values of an existing variable and sysmis for new ones', () => {
    const r1 = computeVariable(d, { target: 'age', expression: '0', condition: 'age > 30' });
    expect(nn(col(r1.dataset, 'age'))).toEqual([20, 0, null, 0]);
    expect(r1.syntax).toContain('IF (age > 30) age=0.');
    const r2 = computeVariable(d, { target: 'old', expression: '1', condition: 'age >= 65' });
    expect(nn(col(r2.dataset, 'old'))).toEqual([null, null, null, 1]);
  });
  it('user-missing income becomes sysmis in arithmetic', () => {
    const r = computeVariable(d, { target: 'k', expression: 'inc / 1000' });
    expect(nn(col(r.dataset, 'k'))).toEqual([1, 2.5, 4, null]);
  });
  it('creates string variables sized to the longest value', () => {
    const r = computeVariable(d, { target: 'grp', expression: "CONCAT('age ', STRING(age, F3.0))" });
    const v = r.dataset.variables.find((x) => x.name === 'grp')!;
    expect(v.type).toBe('string');
    expect(col(r.dataset, 'grp')[0]).toBe('age  20');
    expect(r.syntax).toMatch(/^STRING grp \(A\d+\)\./);
  });
  it('validates names and types with the failing field', () => {
    expect(() => computeVariable(d, { target: '1x', expression: '1' })).toThrow(ComputeError);
    try {
      computeVariable(d, { target: 'age', expression: "'x'" });
    } catch (e) {
      expect((e as ComputeError).field).toBe('expression');
    }
    try {
      computeVariable(d, { target: 'z', expression: '1', condition: 'agee > 1' });
    } catch (e) {
      expect((e as ComputeError).field).toBe('condition');
      expect((e as ComputeError).pos).toBe(0);
    }
  });
  it('previews the first rows', () => {
    const p = previewCompute(d, { target: 'age', expression: 'age + 1', condition: 'age < 50' }, 3);
    expect(p.map((x) => x.applied)).toEqual([true, true, false]);
    expect(p[0].after).toBe('21.00');
  });
});

describe('recode', () => {
  const d = ds([
    { name: 'age', values: [15, 18, 29, 30, 64, 65, 90, null, 999], opts: { missing: { discrete: [999] } } },
    { name: 'sex', values: ['m', 'f', 'f', 'x', 'm', 'f', '', 'm', 'f'] },
  ]);
  const rules: RecodeRule[] = [
    { from: { kind: 'lowest', hi: 17 }, to: { kind: 'sysmis' } },
    { from: { kind: 'range', lo: 18, hi: 29 }, to: { kind: 'value', value: 1 } },
    { from: { kind: 'range', lo: 30, hi: 64 }, to: { kind: 'value', value: 2 } },
    { from: { kind: 'highest', lo: 65 }, to: { kind: 'value', value: 3 } },
    { from: { kind: 'missing' }, to: { kind: 'value', value: -9 } },
  ];
  it('recodes into a different variable; first matching rule wins; ranges include user-missing but MISSING catches it first when listed first', () => {
    const r = recodeDifferent(d, { targets: [{ sourceId: vid(d, 'age'), name: 'agegrp', label: 'Age group' }], rules, outType: 'numeric', valueLabels: [{ value: 1, label: '18-29' }] });
    // 999 matches "65 thru highest" first (ranges include user-missing values, like SPSS)
    expect(nn(col(r.dataset, 'agegrp'))).toEqual([null, 1, 1, 2, 2, 3, 3, -9, 3]);
    const v = r.dataset.variables.find((x) => x.name === 'agegrp')!;
    expect(v.valueLabels).toEqual([{ value: 1, label: '18-29' }]);
    expect(r.syntax).toContain('RECODE age (LOWEST THRU 17=SYSMIS) (18 THRU 29=1) (30 THRU 64=2) (65 THRU HIGHEST=3) (MISSING=-9) INTO agegrp.');
  });
  it('recode into same keeps unmatched values', () => {
    const r = recodeSame(d, { varIds: [vid(d, 'age')], rules: [{ from: { kind: 'value', value: 999 }, to: { kind: 'sysmis' } }] });
    expect(nn(col(r.dataset, 'age'))).toEqual([15, 18, 29, 30, 64, 65, 90, null, null]);
  });
  it('ELSE and COPY; unmatched into different is missing', () => {
    const r = recodeDifferent(d, { targets: [{ sourceId: vid(d, 'age'), name: 'a2' }], rules: [{ from: { kind: 'value', value: 18 }, to: { kind: 'value', value: 0 } }], outType: 'numeric' });
    expect(nn(col(r.dataset, 'a2'))).toEqual([null, 0, null, null, null, null, null, null, null]);
    const r2 = recodeDifferent(d, { targets: [{ sourceId: vid(d, 'age'), name: 'a3' }], rules: [{ from: { kind: 'value', value: 18 }, to: { kind: 'value', value: 0 } }, { from: { kind: 'else' }, to: { kind: 'copy' } }], outType: 'numeric' });
    expect(nn(col(r2.dataset, 'a3'))).toEqual([15, 0, 29, 30, 64, 65, 90, null, 999]);
  });
  it('string to numeric', () => {
    const r = recodeDifferent(d, {
      targets: [{ sourceId: vid(d, 'sex'), name: 'female' }],
      rules: [{ from: { kind: 'value', value: 'f' }, to: { kind: 'value', value: 1 } }, { from: { kind: 'value', value: 'm' }, to: { kind: 'value', value: 0 } }],
      outType: 'numeric',
    });
    expect(nn(col(r.dataset, 'female'))).toEqual([0, 1, 1, null, 0, 1, null, 0, 1]);
  });
  it('convert numeric strings with COPY', () => {
    const d2 = ds([{ name: 's', values: ['12', ' 3 ', 'x', ''] }]);
    const v = d2.variables[0];
    expect(['12', ' 3 ', 'x', ''].map((x) => recodeValue(v, x, [{ from: { kind: 'else' }, to: { kind: 'copy' } }], 'numeric'))).toEqual([12, 3, NaN, NaN]);
  });
  it('rejects ranges for strings and type mismatches', () => {
    expect(() => recodeSame(d, { varIds: [vid(d, 'sex')], rules: [{ from: { kind: 'range', lo: 1, hi: 2 }, to: { kind: 'value', value: 'a' } }] })).toThrow(/string variable/);
    expect(() => recodeSame(d, { varIds: [vid(d, 'age')], rules: [{ from: { kind: 'value', value: 1 }, to: { kind: 'value', value: 'a' } }] })).toThrow(/must be a number/);
  });
  it('condition limits the recode', () => {
    const r = recodeSame(d, { varIds: [vid(d, 'age')], rules: [{ from: { kind: 'else' }, to: { kind: 'value', value: 0 } }], condition: "sex = 'f'" });
    expect(nn(col(r.dataset, 'age'))).toEqual([15, 0, 0, 30, 64, 0, 90, null, 0]);
  });
});

describe('automatic recode', () => {
  it('maps sorted values to 1..k with labels, user-missing last', () => {
    const d = ds([
      { name: 'city', values: ['Paris', 'Berlin', 'Paris', 'Rome', '', 'NA'], opts: { type: 'string', missing: { discrete: ['NA'] } } },
    ]);
    const r = autoRecode(d, { items: [{ sourceId: d.variables[0].id, name: 'city_n' }] });
    expect(nn(col(r.dataset, 'city_n'))).toEqual([2, 1, 2, 3, null, 4]);
    const v = r.dataset.variables[1];
    expect(v.valueLabels.map((l) => l.label)).toEqual(['Berlin', 'Paris', 'Rome', 'NA']);
    expect(v.missing.discrete).toEqual([4]);
  });
  it('keeps existing value labels of numeric sources', () => {
    const d = ds([{ name: 'x', values: [10, 30, 20, 10], opts: { valueLabels: [{ value: 30, label: 'High' }] } }]);
    const r = autoRecode(d, { items: [{ sourceId: d.variables[0].id, name: 'x2' }], descending: true });
    expect(col(r.dataset, 'x2')).toEqual([3, 1, 2, 3]);
    expect(r.dataset.variables[1].valueLabels.map((l) => l.label)).toEqual(['High', '20', '10']);
  });
});

describe('reverse coding and scales', () => {
  const lik = [{ value: 1, label: 'Strongly disagree' }, { value: 5, label: 'Strongly agree' }, { value: 9, label: 'No answer' }];
  const d = ds([
    { name: 'q1', values: [1, 2, 5, 9, null], opts: { valueLabels: lik, missing: { discrete: [9] } } },
    { name: 'q2', values: [4, 4, 1, 2, 3] },
    { name: 'q3', values: [5, null, 1, null, 3] },
  ]);
  it('detects the range from labels, ignoring missing codes', () => {
    expect(detectScaleRange(d, d.variables[0])).toEqual({ min: 1, max: 5, source: 'labels' });
    expect(detectScaleRange(d, d.variables[1])).toEqual({ min: 1, max: 4, source: 'data' });
  });
  it('reverses values and labels into new variables; missing codes unchanged', () => {
    const r = reverseCode(d, { varIds: [d.variables[0].id], mode: 'new' });
    expect(nn(col(r.dataset, 'q1_r'))).toEqual([5, 4, 1, 9, null]);
    const v = r.dataset.variables[1];
    expect(v.name).toBe('q1_r');
    expect(v.valueLabels).toEqual([{ value: 1, label: 'Strongly agree' }, { value: 5, label: 'Strongly disagree' }, { value: 9, label: 'No answer' }]);
    expect(r.syntax).toContain('RECODE q1 (1=5) (2=4) (3=3) (4=2) (5=1) (ELSE=COPY) INTO q1_r.');
  });
  it('replaces in place', () => {
    const r = reverseCode(d, { varIds: [d.variables[1].id], mode: 'replace' });
    expect(col(r.dataset, 'q2')).toEqual([1, 1, 4, 3, 2]);
  });
  it('scale mean with minimum valid items', () => {
    const r = createScale(d, { itemIds: d.variables.map((v) => v.id), method: 'mean', minValid: 2, name: 'idx' });
    expect(nn(col(r.dataset, 'idx')).map((x) => (x === null ? null : +(x as number).toFixed(4)))).toEqual([3.3333, 3, 2.3333, null, 3]);
    expect(r.syntax).toContain('COMPUTE idx=MEAN.2(q1, q2, q3).');
    const s = createScale(d, { itemIds: d.variables.map((v) => v.id), method: 'sum', minValid: 3, name: 'tot' });
    expect(nn(col(s.dataset, 'tot'))).toEqual([10, null, 7, null, null]);
  });
});

describe('standardize', () => {
  it('z-scores with sample SD, respecting weights', () => {
    const d = ds([{ name: 'x', values: [1, 2, 3, 4, 5] }]);
    const r = standardize(d, [d.variables[0].id]);
    const z = col(r.dataset, 'Zx') as number[];
    expect(z[0]).toBeCloseTo(-1.264911, 6);
    expect(z[2]).toBeCloseTo(0, 10);
    const w = ds([{ name: 'x', values: [1, 2] }, { name: 'w', values: [3, 1] }]);
    const ww = { ...w, weightVarId: w.variables[1].id };
    const r2 = standardize(ww, [w.variables[0].id]);
    // weighted mean 1.25, weighted var = (3*.0625 + 1*.5625)/(4-1) = .25
    expect((col(r2.dataset, 'Zx') as number[])[1]).toBeCloseTo(1.5, 10);
  });
});

describe('binning', () => {
  const ages = [18, 22, 29, 30, 44, 45, 64, 65, 80, null];
  const d = ds([{ name: 'age', values: ages }]);
  it('assigns bins with upper cutpoints included by default', () => {
    expect([29, 29.5, 30].map((x) => binOf(x, [29, 44], true))).toEqual([1, 2, 2]);
    expect([29, 30].map((x) => binOf(x, [29, 44], false))).toEqual([2, 2]);
    expect(binOf(100, [29, 44])).toBe(3);
  });
  it('labels integer groups the way people write them', () => {
    expect(binLabels([29, 44, 64], 18, true)).toEqual(['18-29', '30-44', '45-64', '65+']);
    expect(binLabels([2.5, 5], 0.1, false)).toEqual(['<= 2.5', '2.5-5', '> 5']);
  });
  it('custom cutpoints with counts', () => {
    const p = previewBins(d, { sourceId: d.variables[0].id, method: { kind: 'custom', cuts: [44, 29, 64] } });
    expect(p.cuts).toEqual([29, 44, 64]);
    expect(p.bins.map((b) => [b.label, b.count])).toEqual([['18-29', 3], ['30-44', 2], ['45-64', 2], ['65+', 2]]);
    const r = visualBin(d, { sourceId: d.variables[0].id, name: 'agegrp', method: { kind: 'custom', cuts: [29, 44, 64] } });
    expect(nn(col(r.dataset, 'agegrp'))).toEqual([1, 1, 1, 2, 2, 3, 3, 4, 4, null]);
    expect(r.dataset.variables[1].valueLabels[3]).toEqual({ value: 4, label: '65+' });
    expect(r.syntax).toContain('IF (NOT MISSING(age)) agegrp=1 + (age > 29) + (age > 44) + (age > 64).');
  });
  it('equal width and equal count', () => {
    expect(computeCutpoints(d, d.variables[0], { kind: 'width', intervals: 2 })).toEqual([49]);
    const q = computeCutpoints(d, d.variables[0], { kind: 'count', groups: 3 });
    expect(q).toEqual([29, 45]);
    expect(computeCutpoints(d, d.variables[0], { kind: 'widthFrom', first: 30, width: 20 })).toEqual([30, 50, 70]);
  });
});

describe('count values', () => {
  it('counts matches per case', () => {
    const d = ds([
      { name: 'a1', values: [1, 0, 1, null] },
      { name: 'a2', values: [1, 1, 0, null] },
      { name: 'a3', values: [2, 0, 1, 1] },
    ]);
    const r = countValues(d, { varIds: d.variables.map((v) => v.id), values: [{ kind: 'value', value: 1 }], name: 'civic' });
    expect(col(r.dataset, 'civic')).toEqual([2, 1, 2, 1]);
    const r2 = countValues(d, { varIds: d.variables.map((v) => v.id), values: [{ kind: 'range', lo: 1, hi: 2 }, { kind: 'sysmis' }], name: 'c2' });
    expect(col(r2.dataset, 'c2')).toEqual([3, 1, 2, 3]);
    expect(r2.syntax).toContain('COUNT c2=a1 a2 a3 (1 THRU 2 SYSMIS).');
  });
});

describe('select cases', () => {
  const d = ds([{ name: 'age', values: [20, 40, null, 60, 80] }]);
  it('filters with filter_$ like SPSS', () => {
    const r = selectCasesTransform(d, { kind: 'if', condition: 'age > 30' }, 'filter');
    const f = r.dataset.variables.find((v) => v.name === 'filter_$')!;
    expect(r.dataset.filterVarId).toBe(f.id);
    expect(nn(col(r.dataset, 'filter_$'))).toEqual([0, 1, null, 1, 1]);
    expect(Array.from(activeCaseMask(r.dataset))).toEqual([0, 1, 0, 1, 1]);
    expect(f.valueLabels).toEqual([{ value: 0, label: 'Not selected' }, { value: 1, label: 'Selected' }]);
    expect(r.syntax).toContain('FILTER BY filter_$.');
    // a second selection reuses filter_$
    const r2 = selectCasesTransform(r.dataset, { kind: 'range', from: 1, to: 2 }, 'filter');
    expect(r2.dataset.variables.filter((v) => v.name.startsWith('filter_$')).length).toBe(1);
    expect(col(r2.dataset, 'filter_$')).toEqual([1, 1, 0, 0, 0]);
    const off = selectCasesTransform(r2.dataset, { kind: 'all' }, 'filter');
    expect(off.dataset.filterVarId).toBeNull();
  });
  it('deletes unselected cases', () => {
    const r = selectCasesTransform(d, { kind: 'if', condition: 'age >= 60' }, 'delete');
    expect(r.dataset.nCases).toBe(2);
    expect(col(r.dataset, 'age')).toEqual([60, 80]);
    expect(r.syntax).toContain('SELECT IF (age >= 60).');
  });
  it('random samples are reproducible; exact n is exact', () => {
    const big = ds([{ name: 'x', values: Array.from({ length: 1000 }, (_, i) => i) }]);
    const a = selectionValues(big, { kind: 'percent', percent: 25, seed: 42 });
    const b = selectionValues(big, { kind: 'percent', percent: 25, seed: 42 });
    expect(Array.from(a)).toEqual(Array.from(b));
    const k = a.reduce((s, x) => s + x, 0);
    expect(k).toBeGreaterThan(200);
    expect(k).toBeLessThan(300);
    const e = selectionValues(big, { kind: 'exact', n: 50, ofFirst: 200, seed: 7 });
    expect(e.reduce((s, x) => s + x, 0)).toBe(50);
    expect(e.slice(200).every((x) => x === 0)).toBe(true);
  });
});

describe('sort, weight, rank', () => {
  it('stable multi-key sort with sysmis first', () => {
    const d = ds([
      { name: 'g', values: ['b', 'a', 'b', 'a', 'a'] },
      { name: 'x', values: [3, null, 1, 2, 2] },
      { name: 'id', values: [1, 2, 3, 4, 5] },
    ]);
    const r = sortCases(d, [{ varId: vid(d, 'g'), dir: 'asc' }, { varId: vid(d, 'x'), dir: 'desc' }]);
    expect(col(r.dataset, 'id')).toEqual([4, 5, 2, 1, 3]);
    const r2 = sortCases(d, [{ varId: vid(d, 'x'), dir: 'asc' }]);
    expect(col(r2.dataset, 'id')).toEqual([2, 3, 4, 5, 1]);
    expect(r2.syntax).toBe('SORT CASES BY x (A).');
  });
  it('weight checks and warnings', () => {
    const d = ds([{ name: 'w', values: [1, -1, 0, null, 2.5] }]);
    const c = checkWeightVariable(d, d.variables[0].id);
    expect(c).toMatchObject({ negative: 1, zero: 1, missing: 1, fractional: 1, valid: 2, sum: 3.5 });
    const r = weightCases(d, d.variables[0].id);
    expect(r.dataset.weightVarId).toBe(d.variables[0].id);
    expect(r.warnings.length).toBe(3);
    expect(weightCases(r.dataset, null).dataset.weightVarId).toBeNull();
  });
  it('ranks with ties', () => {
    const v = Float64Array.from([10, 20, 20, NaN, 5]);
    const inc = (i: number) => !Number.isNaN(v[i]);
    expect(Array.from(rankColumn(v, inc, 'asc', 'mean').ranks)).toEqual([2, 3.5, 3.5, NaN, 1]);
    expect(Array.from(rankColumn(v, inc, 'asc', 'low').ranks)).toEqual([2, 3, 3, NaN, 1]);
    expect(Array.from(rankColumn(v, inc, 'desc', 'condense').ranks)).toEqual([2, 1, 1, NaN, 3]);
    const d = ds([{ name: 'x', values: [10, 20, 20, null, 5] }]);
    const r = rankCases(d, { varIds: [d.variables[0].id], order: 'asc', ties: 'mean', type: 'ntiles', ntiles: 2 });
    expect(nn(col(r.dataset, 'Nx'))).toEqual([1, 2, 2, null, 1]);
  });
});

describe('merge files', () => {
  const a = ds([
    { name: 'id', values: [1, 2, 3] },
    { name: 'sex', values: [1, 2, 1], opts: { valueLabels: [{ value: 1, label: 'Male' }] } },
    { name: 'town', values: ['X', 'Y', 'Z'] },
  ], 'wave1');
  const b = ds([
    { name: 'ID', values: [3, 1, 4] },
    { name: 'sex', values: [2, 1, 2], opts: { valueLabels: [{ value: 1, label: 'Man' }, { value: 2, label: 'Female' }] } },
    { name: 'town', values: [5, 6, 7] },
    { name: 'trust', values: [7, 8, 9] },
  ], 'wave2');
  it('add cases matches variables by name, merges labels, keeps type conflicts apart', () => {
    const r = addCases(a, b, { sourceVar: 'source01' });
    expect(r.dataset.nCases).toBe(6);
    expect(col(r.dataset, 'id')).toEqual([1, 2, 3, 3, 1, 4]);
    expect(nn(col(r.dataset, 'trust'))).toEqual([null, null, null, 7, 8, 9]);
    expect(col(r.dataset, 'town')).toEqual(['X', 'Y', 'Z', '', '', '']);
    expect(nn(col(r.dataset, 'town_1'))).toEqual([null, null, null, 5, 6, 7]);
    expect(r.warnings[0]).toMatch(/town/);
    const sex = r.dataset.variables.find((v) => v.name === 'sex')!;
    expect(sex.valueLabels).toEqual([{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }]);
    expect(col(r.dataset, 'source01')).toEqual([0, 0, 0, 1, 1, 1]);
    const r2 = addCases(a, b, { keepUnpaired: false });
    expect(r2.dataset.variables.map((v) => v.name)).toEqual(['id', 'sex']);
  });
  it('add variables by key (one-to-one), including unmatched cases from the second file', () => {
    const r = addVariables(a, b, { mode: 'key', key: 'id' });
    expect(col(r.dataset, 'id')).toEqual([1, 2, 3, 4]);
    expect(nn(col(r.dataset, 'trust'))).toEqual([8, null, 7, 9]);
    expect(r.dataset.variables.map((v) => v.name)).toEqual(['id', 'sex', 'town', 'trust']);
    expect(r.warnings.some((w) => /already exist/.test(w))).toBe(true);
    const r2 = addVariables(a, b, { mode: 'key', key: 'id', keepUnmatchedOther: false });
    expect(r2.dataset.nCases).toBe(3);
  });
  it('lookup table: many cases per key', () => {
    const people = ds([{ name: 'hh', values: [1, 1, 2, 3] }, { name: 'p', values: [1, 2, 3, 4] }]);
    const hh = ds([{ name: 'hh', values: [1, 2] }, { name: 'size', values: [4, 2] }]);
    const r = addVariables(people, hh, { mode: 'key', key: 'hh', lookup: true });
    expect(nn(col(r.dataset, 'size'))).toEqual([4, 4, 2, null]);
    expect(r.dataset.nCases).toBe(4);
    expect(r.syntax).toContain('/TABLE=');
  });
  it('add variables by case order', () => {
    const extra = ds([{ name: 'z', values: [9, 8] }]);
    const r = addVariables(a, extra, { mode: 'order' });
    expect(nn(col(r.dataset, 'z'))).toEqual([9, 8, null]);
    expect(r.warnings[0]).toMatch(/different numbers of cases/);
  });
});

describe('aggregate', () => {
  const d = ds([
    { name: 'region', values: [1, 1, 2, 2, 2] },
    { name: 'inc', values: [10, 20, 30, null, 60] },
  ]);
  it('adds group means to every case', () => {
    const r = aggregate(d, { breakIds: [vid(d, 'region')], items: [{ sourceId: vid(d, 'inc'), fn: 'mean', name: 'inc_mean' }, { fn: 'nu', name: 'n_region' }], output: 'add' });
    expect(col(r.dataset, 'inc_mean')).toEqual([15, 15, 45, 45, 45]);
    expect(col(r.dataset, 'n_region')).toEqual([2, 2, 3, 3, 3]);
    expect(r.syntax).toContain('MODE=ADDVARIABLES');
  });
  it('creates a new dataset with one case per group', () => {
    const r = aggregate(d, { breakIds: [vid(d, 'region')], items: [{ sourceId: vid(d, 'inc'), fn: 'sum', name: 'total' }, { sourceId: vid(d, 'inc'), fn: 'max', name: 'top' }], output: 'new' });
    expect(r.newDataset!.nCases).toBe(2);
    expect(col(r.newDataset!, 'total')).toEqual([30, 90]);
    expect(col(r.newDataset!, 'top')).toEqual([20, 60]);
    expect(col(r.newDataset!, 'region')).toEqual([1, 2]);
  });
});

describe('log items', () => {
  it('builds a transform output item', () => {
    const d = ds([{ name: 'x', values: [1] }]);
    const r = computeVariable(d, { target: 'y', expression: 'x + 1' });
    const item = transformLogItem(r, 'test');
    expect(item.procedure).toBe('transform');
    expect(item.syntax).toBe(r.syntax);
    expect(item.blocks[0]).toEqual({ kind: 'text', style: 'note', text: r.summary });
    expect(JSON.parse(JSON.stringify(item))).toEqual(item);
  });
});
