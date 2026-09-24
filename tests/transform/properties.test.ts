import { describe, expect, it } from 'vitest';
import { ds, vid } from './helpers';
import { makeVariable } from '../../src/core/types';
import {
  SPSS_LIMITS, applyPropertyDrafts, applySuggestion, batterySiblings, buildRows, copyDraftProps, describeMissingSpec, draftChanges, draftFromVariable,
  draftIssues, formatFor, isDraftChanged, isNegativeCode, isNinesCode, labelLooksMissing, missingCodeHints, orderedScaleOf, parseValue, previewSuggestion,
  propertiesSyntax, removeMissingRange, scanVariable, scanVariables, setValueLabel, statusOf, suggestLabels, suggestMeasure, summarise, toggleMissing, valueKey,
  type PropsDraft,
} from '../../src/lib/transform/properties';

const AGREE = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neither agree nor disagree' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly agree' },
];

function survey() {
  return ds([
    { name: 'trust1', values: [1, 2, 3, 4, 5, 5, 8, 9, null, 4], opts: { measure: 'scale', decimals: 0 } },
    { name: 'trust2', values: [1, 1, 2, 3, 4, 5, 5, 5, 8, null], opts: { measure: 'ordinal', valueLabels: AGREE.slice(), missing: { discrete: [8, 9] } } },
    { name: 'income', values: [12000, 25000, 25000, 40000, 999999, 5000, 88000, 31000, null, 999999] },
    { name: 'city', values: ['Delhi', 'Kolkata', 'NA', 'Delhi', 'DK', 'Mumbai', '', 'Delhi', 'Kolkata', 'Chennai'] },
    { name: 'wt', values: [1, 2, 1, 1, 0.5, 1, 1, 2, 1, 1] },
  ]);
}

const V = (d: ReturnType<typeof survey>, name: string) => d.variables.find((v) => v.name === name)!;

describe('scanning values', () => {
  it('counts every distinct value, sorted, with system-missing separate', () => {
    const d = survey();
    const s = scanVariable(d, V(d, 'trust1'));
    expect(s.values.map((c) => [c.value, c.count])).toEqual([[1, 1], [2, 1], [3, 1], [4, 2], [5, 2], [8, 1], [9, 1]]);
    expect(s.sysmis).toBe(1);
    expect(s.casesScanned).toBe(10);
    expect(s.weighted).toBe(false);
    expect(s.values.every((c) => c.weighted === c.count)).toBe(true);
  });

  it('adds weighted counts when a weight is on (zero and missing weights count 0)', () => {
    const d = { ...survey() };
    d.weightVarId = vid(d, 'wt');
    const s = scanVariable(d, V(d, 'trust1'));
    expect(s.weighted).toBe(true);
    const five = s.values.find((c) => c.value === 5)!;
    expect(five.count).toBe(2);
    expect(five.weighted).toBe(1.5); // rows 4 and 5 have weights 0.5 and 1
  });

  it('limits the cases scanned to the first N', () => {
    const d = survey();
    const s = scanVariable(d, V(d, 'trust1'), { maxCases: 3 });
    expect(s.casesScanned).toBe(3);
    expect(s.values.map((c) => c.value)).toEqual([1, 2, 3]);
  });

  it('scans text values without trailing spaces, keeping empty text as a value', () => {
    const d = ds([{ name: 's', values: ['a  ', 'a', '', 'b'] }]);
    const s = scanVariable(d, d.variables[0]);
    expect(s.values.map((c) => [c.value, c.count])).toEqual([['', 1], ['a', 2], ['b', 1]]);
    expect(s.sysmis).toBe(0);
  });

  it('scans several variables in the order asked, skipping unknown ids', () => {
    const d = survey();
    const out = scanVariables(d, [vid(d, 'income'), 'nope', vid(d, 'trust1')]);
    expect(out.map((s) => s.varId)).toEqual([vid(d, 'income'), vid(d, 'trust1')]);
  });
});

describe('missing-code heuristics', () => {
  it('recognises nines codes and negative codes', () => {
    expect([8, 9, 98, 99, 97, 999, 998, 999999].every(isNinesCode)).toBe(true);
    expect([7, 10, 89, 90, 100, 9.5, -9].some(isNinesCode)).toBe(false);
    expect([-1, -9, -99, -98, -77, -888, -999].every(isNegativeCode)).toBe(true);
    expect([0, 1, -10, -12, -1.5].some(isNegativeCode)).toBe(false);
  });

  it('flags 8 and 9 on a 1 to 5 scale, and 999999 above incomes', () => {
    const h = missingCodeHints('numeric', [1, 2, 3, 4, 5, 8, 9], []);
    expect([...h.keys()].sort()).toEqual(['n:8', 'n:9']);
    expect(h.get('n:9')).toMatch(/1 to 5/);
    const inc = missingCodeHints('numeric', [5000, 12000, 88000, 999999], []);
    expect([...inc.keys()]).toEqual(['n:999999']);
  });

  it('does not flag 97 to 99 when they continue the other values (ages up to 96)', () => {
    const ages = Array.from({ length: 82 }, (_, i) => 18 + i); // 18..99
    expect(missingCodeHints('numeric', ages, []).size).toBe(0);
    expect(missingCodeHints('numeric', [1, 2, 3, 4, 5, 6, 7, 8, 9], []).size).toBe(0);
  });

  it('flags negative codes, but not a symmetric scale', () => {
    expect([...missingCodeHints('numeric', [-9, -1, 1, 2, 3], []).keys()].sort()).toEqual(['n:-1', 'n:-9']);
    expect(missingCodeHints('numeric', [-2, -1, 0, 1, 2], []).size).toBe(0);
    expect(missingCodeHints('numeric', [-1, 0, 1], []).size).toBe(0);
    expect(missingCodeHints('numeric', [-3, -2, -1, 1, 5], []).size).toBe(3);
  });

  it('flags text codes such as NA and DK', () => {
    const h = missingCodeHints('string', ['Delhi', 'NA', 'dk', 'n/a', 'Refused', 'none'], []);
    expect([...h.keys()].sort()).toEqual(['s:NA', 's:Refused', 's:dk', 's:n/a']);
  });

  it('flags values whose label reads like a missing answer', () => {
    expect(labelLooksMissing("Don't know")).toBe(true);
    expect(labelLooksMissing('Don’t know')).toBe(true);
    expect(labelLooksMissing('Refused')).toBe(true);
    expect(labelLooksMissing('Prefer not to say')).toBe(true);
    expect(labelLooksMissing('Not applicable')).toBe(true);
    expect(labelLooksMissing('Strongly agree')).toBe(false);
    expect(labelLooksMissing('Kolkata')).toBe(false);
    const h = missingCodeHints('numeric', [0, 1, 7], [{ value: 7, label: 'Not applicable' }]);
    expect(h.get('n:7')).toMatch(/Not applicable/);
  });
});

describe('grid rows and flags', () => {
  it('shows every observed value, labelled unobserved values and missing values, with flags', () => {
    const d = survey();
    const v = V(d, 'trust1');
    const draft: PropsDraft = { ...draftFromVariable(v), measure: 'ordinal', valueLabels: AGREE.slice(0, 4) };
    const { rows, total, hidden } = buildRows('numeric', scanVariable(d, v), draft);
    expect(rows.map((r) => r.value)).toEqual([1, 2, 3, 4, 5, 8, 9]);
    expect(total).toBe(7);
    expect(hidden).toBe(0);
    const f = (x: number) => rows.find((r) => r.value === x)!.flags.map((fl) => fl.kind);
    expect(f(1)).toEqual([]);
    expect(f(5)).toEqual(['unlabelled', 'outside-range']);
    expect(f(8)).toEqual(['missing-code', 'unlabelled']);
    expect(rows.find((r) => r.value === 8)!.flags[0].text).toBe('looks like a missing code');
  });

  it('says "missing code" (not a warning) once the code is marked missing', () => {
    const d = survey();
    const v = V(d, 'trust2');
    const { rows } = buildRows('numeric', scanVariable(d, v), draftFromVariable(v));
    const eight = rows.find((r) => r.value === 8)!;
    expect(eight.missing).toBe(true);
    expect(eight.flags.map((x) => [x.kind, x.tone, x.text])).toEqual([['missing-code', 'good', 'missing code'], ['unlabelled', 'warn', 'unlabelled']]);
    // 9 is declared missing but does not occur: still listed
    const nine = rows.find((r) => r.value === 9)!;
    expect(nine.observed).toBe(false);
    expect(nine.count).toBe(0);
  });

  it('does not call scale values unlabelled', () => {
    const d = survey();
    const v = V(d, 'income');
    const { rows } = buildRows('numeric', scanVariable(d, v), draftFromVariable(v));
    expect(rows.find((r) => r.value === 25000)!.flags).toEqual([]);
    expect(rows.find((r) => r.value === 999999)!.flags.map((x) => x.kind)).toEqual(['missing-code']);
  });

  it('keeps labelled, missing and flagged values when the display is limited, then the most common', () => {
    const vals = [...Array.from({ length: 300 }, (_, i) => i + 1), 7, 7, 7, 250, 250, 999];
    const d = ds([{ name: 'x', values: vals }]);
    const v = d.variables[0];
    const draft = { ...draftFromVariable(v), valueLabels: [{ value: 120, label: 'Hundred twenty' }] };
    const { rows, total, hidden } = buildRows('numeric', scanVariable(d, v), draft, 5);
    expect(total).toBe(301);
    expect(hidden).toBe(296);
    // 120 (labelled) and 999 (missing code) always; then 7 and 250 (most common), then the first of the rest
    expect(rows.map((r) => r.value)).toEqual([1, 7, 120, 250, 999]);
  });
});

describe('status and summary', () => {
  it('reports suspected missing codes first, then unlabelled values, then complete', () => {
    const d = survey();
    const t1 = V(d, 'trust1');
    const s1 = scanVariable(d, t1);
    expect(statusOf('numeric', s1, draftFromVariable(t1)).status).toBe('suspect');
    let draft: PropsDraft = { ...draftFromVariable(t1), measure: 'ordinal', missing: { discrete: [8, 9] } };
    expect(statusOf('numeric', s1, draft)).toMatchObject({ status: 'unlabelled', text: 'No value labels yet' });
    draft = { ...draft, valueLabels: AGREE.slice() };
    expect(statusOf('numeric', s1, draft).text).toBe('2 values unlabelled');
    draft = setValueLabel(setValueLabel(draft, 8, "Don't know"), 9, 'Refused');
    expect(statusOf('numeric', s1, draft)).toMatchObject({ status: 'complete', text: 'Labels complete' });
    const inc = V(d, 'income');
    const incDraft = { ...draftFromVariable(inc), missing: { discrete: [999999] } };
    expect(statusOf('numeric', scanVariable(d, inc), incDraft).text).toBe('Scale: labels optional');
    const empty = ds([{ name: 'e', values: [null, null] }]);
    expect(statusOf('numeric', scanVariable(empty, empty.variables[0]), draftFromVariable(empty.variables[0])).status).toBe('empty');
  });

  it('summarises valid, user-missing and system-missing cases (weighted too)', () => {
    const d = { ...survey() };
    d.weightVarId = vid(d, 'wt');
    const v = V(d, 'trust2');
    const sm = summarise(scanVariable(d, v), draftFromVariable(v));
    expect(sm).toEqual({ valid: 8, validWeighted: 9.5, userMissing: 1, userMissingWeighted: 1, sysmis: 1, sysmisWeighted: 1, unique: 6 });
  });
});

describe('measurement level suggestion', () => {
  const sug = (values: Array<number | string | null>, opts: Partial<PropsDraft> = {}) => {
    const d = ds([{ name: 'x', values }]);
    const v = d.variables[0];
    return suggestMeasure(v.type, scanVariable(d, v), { ...draftFromVariable(v), ...opts });
  };

  it('suggests Ordinal for an agreement scale and says why', () => {
    const s = sug([1, 2, 3, 4, 5, 8, 9], { valueLabels: AGREE });
    expect(s.level).toBe('ordinal');
    expect(s.reason).toBe('Ordinal suggested: 5 ordered codes with labels like Strongly disagree ... Strongly agree.');
  });

  it('suggests Scale for many values or decimals', () => {
    expect(sug(Array.from({ length: 40 }, (_, i) => 18 + i)).level).toBe('scale');
    expect(sug([1.5, 2.25, 3]).reason).toMatch(/decimals/);
    expect(sug([1.5, 2.25, 3]).level).toBe('scale');
  });

  it('suggests Nominal for two categories, text, and named categories', () => {
    expect(sug([0, 1, 1, 0]).level).toBe('nominal');
    expect(sug(['a', 'b']).level).toBe('nominal');
    const cities = [{ value: 1, label: 'Kolkata' }, { value: 2, label: 'Delhi' }, { value: 3, label: 'Mumbai' }];
    const s = sug([1, 2, 3], { valueLabels: cities });
    expect(s.level).toBe('nominal');
    expect(s.reason).toMatch(/Kolkata/);
  });

  it('suggests Ordinal for consecutive unlabelled codes and Nominal for codes with gaps', () => {
    expect(sug([1, 2, 3, 4, 5, 6, 7]).level).toBe('ordinal');
    expect(sug([1, 2, 3, 4, 5, 6, 7]).reason).toBe('Ordinal suggested: 7 whole-number codes from 1 to 7, like a rating scale. Choose Nominal if the codes are only names.');
    const s = sug([11, 25, 31, 47]);
    expect(s.level).toBe('nominal');
    expect(s.reason).toMatch(/gaps/);
  });

  it('suggests Scale for long rating scales, counts named as such, and dates', () => {
    const s = sug([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(s.level).toBe('scale');
    expect(s.reason).toMatch(/0 to 10 are usually analysed as scale/);
    const d = ds([{ name: 'hh_size', values: [1, 2, 3, 5, 7], opts: { label: 'Number of people usually living in the household' } }]);
    const v = d.variables[0];
    expect(suggestMeasure('numeric', scanVariable(d, v), draftFromVariable(v), v)).toMatchObject({ level: 'scale' });
    expect(suggestMeasure('numeric', scanVariable(d, v), draftFromVariable(v), { name: 'q7', label: 'Region' }).level).toBe('nominal');
    expect(suggestMeasure('numeric', scanVariable(d, v), draftFromVariable(v), { format: 'DATE11' }).reason).toMatch(/dates/);
    // "these days" is not a count
    const life = ds([{ name: 'life_sat', values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], opts: { label: 'How satisfied are you with your life these days? (0-10)' } }]);
    expect(suggestMeasure('numeric', scanVariable(life, life.variables[0]), draftFromVariable(life.variables[0]), life.variables[0]).reason).toMatch(/^Scale suggested: 11 points from 0 to 10/);
  });

  it('ignores missing codes when judging (8/9 do not break a 1 to 5 scale)', () => {
    expect(sug([1, 2, 3, 4, 5, 9]).level).toBe('ordinal');
  });

  it('recognises ordered label families in either direction', () => {
    expect(orderedScaleOf(['Never', 'Rarely', 'Sometimes', 'Often', 'Always'])).toBe('frequency');
    expect(orderedScaleOf(['Strongly agree', 'Agree', 'Disagree', 'Strongly disagree'])).toBe('agreement');
    expect(orderedScaleOf(['Not at all', 'Not very strongly', 'Fairly strongly', 'Very strongly'])).toBe('intensity');
    expect(orderedScaleOf(['Very poor', 'Poor', 'Fair', 'Good', 'Very good'])).toBe('quality');
    expect(orderedScaleOf(['No formal schooling', 'Primary', 'Secondary', 'Higher secondary', 'Graduate', 'Postgraduate'])).toBe('education');
    expect(orderedScaleOf(['Kolkata', 'Delhi', 'Mumbai'])).toBeNull();
    expect(orderedScaleOf(['Agree', 'Strongly disagree', 'Agree'])).toBeNull();
  });
});

describe('label suggestions', () => {
  const sugs = (name: string, values: Array<number | string | null>, draft: Partial<PropsDraft> = {}, label = '') => {
    const d = ds([{ name, values, opts: { label } }]);
    const v = d.variables[0];
    return suggestLabels(v, scanVariable(d, v), { ...draftFromVariable(v), ...draft });
  };

  it('offers an agreement scale for 1 to 5, plus labels for missing codes', () => {
    const s = sugs('q1', [1, 2, 3, 4, 5, 8, 9]);
    expect(s.map((x) => x.id)).toEqual(['agree5', 'missing-codes']);
    expect(s[0].labels).toEqual(AGREE);
    expect(s[1].labels).toEqual([{ value: 8, label: "Don't know" }, { value: 9, label: 'No answer' }]);
    expect(s[1].missing).toEqual([8, 9]);
  });

  it('offers 1 to 7 only when values go above 5', () => {
    expect(sugs('q', [1, 2, 3, 6, 7]).map((x) => x.id)).toEqual(['agree7']);
    expect(sugs('q', [1, 2, 3, 6, 7])[0].labels).toHaveLength(7);
  });

  it('offers yes/no for 0/1 and 1/2, and sex or gender when the name says so', () => {
    expect(sugs('voted', [0, 1, 1]).map((x) => x.id)).toEqual(['yesno01']);
    expect(sugs('voted', [1, 2]).map((x) => x.id)).toEqual(['yesno12']);
    const sex = sugs('sex', [1, 2, 2]);
    expect(sex.map((x) => x.id)).toEqual(['sex12', 'yesno12']);
    expect(sex[0].labels).toEqual([{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }]);
    const g = sugs('q3', [1, 2, 3], {}, 'Gender of respondent');
    expect(g[0].labels.map((l) => l.label)).toEqual(['Man', 'Woman', 'Another gender']);
  });

  it('offers nothing for values that fit no pattern, or that are already labelled', () => {
    expect(sugs('age', [18, 25, 40])).toEqual([]);
    const cities = [{ value: 1, label: 'Kolkata' }, { value: 2, label: 'Delhi' }, { value: 3, label: 'Mumbai' }];
    expect(sugs('city', [1, 2, 3], { valueLabels: cities })).toEqual([]);
    expect(sugs('city', [1, 2, 3, 9], { valueLabels: cities }).map((x) => x.id)).toEqual(['missing-codes']);
  });

  it('previews without changing, then fills only unlabelled values by default', () => {
    const d = ds([{ name: 'q', values: [1, 2, 3, 4, 5] }]);
    const v = d.variables[0];
    const draft: PropsDraft = { ...draftFromVariable(v), valueLabels: [{ value: 1, label: 'Totally disagree' }, { value: 4, label: 'Agree' }] };
    const s = suggestLabels(v, scanVariable(d, v), draft)[0];
    expect(previewSuggestion(draft, s, true).map((r) => r.action)).toEqual(['keep', 'add', 'add', 'same', 'add']);
    const a = applySuggestion(draft, 'numeric', s, true);
    expect(a.added).toBe(3);
    expect(a.replaced).toBe(0);
    expect(a.draft.valueLabels.map((l) => l.label)).toEqual(['Totally disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree']);
    const b = applySuggestion(draft, 'numeric', s, false);
    expect(b.replaced).toBe(1);
    expect(b.draft.valueLabels[0].label).toBe('Strongly disagree');
    expect(draft.valueLabels).toHaveLength(2); // input untouched
  });

  it('marks suggested missing codes as missing, within the SPSS limit', () => {
    const d = ds([{ name: 'q', values: [1, 2, 3, 97, 98, 99, -9] }]);
    const v = d.variables[0];
    const s = suggestLabels(v, scanVariable(d, v), draftFromVariable(v)).find((x) => x.id === 'missing-codes')!;
    expect(s.missing).toEqual([-9, 97, 98, 99]);
    const a = applySuggestion(draftFromVariable(v), 'numeric', s, true);
    expect(a.draft.missing.discrete).toEqual([-9, 97, 98]);
    expect(a.skippedMissing).toEqual([99]);
    expect(a.draft.valueLabels.map((l) => l.label)).toEqual(['No answer', 'Refused', "Don't know", 'No answer']);
  });
});

describe('editing drafts', () => {
  const base = (): PropsDraft => ({ label: '', measure: 'ordinal', valueLabels: [], missing: { discrete: [] }, width: 8, decimals: 0 });

  it('sets, sorts and removes value labels', () => {
    let d = setValueLabel(base(), 5, 'Five');
    d = setValueLabel(d, 1, 'One');
    expect(d.valueLabels.map((l) => l.value)).toEqual([1, 5]);
    d = setValueLabel(d, 5, '');
    expect(d.valueLabels).toEqual([{ value: 1, label: 'One' }]);
  });

  it('marks and unmarks missing values, sorted', () => {
    let d = toggleMissing(base(), 'numeric', 9, true).draft;
    d = toggleMissing(d, 'numeric', 8, true).draft;
    expect(d.missing.discrete).toEqual([8, 9]);
    d = toggleMissing(d, 'numeric', 9, false).draft;
    expect(d.missing.discrete).toEqual([8]);
    expect(toggleMissing(d, 'numeric', 8, true).draft).toBe(d);
  });

  it('refuses a fourth missing value and explains why', () => {
    let d = base();
    for (const x of [7, 8, 9]) d = toggleMissing(d, 'numeric', x, true).draft;
    const r = toggleMissing(d, 'numeric', 99, true);
    expect(r.draft).toBe(d);
    expect(r.problem).toMatch(/at most 3 single missing values/);
  });

  it('allows a range plus one value, and explains values inside the range', () => {
    let d: PropsDraft = { ...base(), missing: { discrete: [], range: { lo: 90, hi: Infinity } } };
    d = toggleMissing(d, 'numeric', -1, true).draft;
    expect(d.missing.discrete).toEqual([-1]);
    const r = toggleMissing(d, 'numeric', -9, true);
    expect(r.problem).toMatch(/range \(90 THRU HI\) plus one/);
    const inRange = toggleMissing(d, 'numeric', 95, false);
    expect(inRange.problem).toMatch(/inside the missing range 90 THRU HI/);
    expect(removeMissingRange(d).missing).toEqual({ discrete: [-1] });
  });

  it('refuses text missing values longer than 8 bytes', () => {
    const r = toggleMissing(base(), 'string', 'Not applicable', true);
    expect(r.problem).toMatch(/up to 8 characters/);
    expect(toggleMissing(base(), 'string', 'NA', true).draft.missing.discrete).toEqual(['NA']);
  });

  it('copies chosen properties between drafts', () => {
    const from: PropsDraft = { ...base(), label: 'Trust 1', valueLabels: AGREE, missing: { discrete: [8, 9] }, measure: 'ordinal' };
    const to: PropsDraft = { ...base(), label: 'Trust 2', measure: 'scale' };
    const c = copyDraftProps(from, to, ['valueLabels', 'missing', 'measure']);
    expect(c.label).toBe('Trust 2');
    expect(c.valueLabels).toEqual(AGREE);
    expect(c.valueLabels).not.toBe(from.valueLabels);
    expect(c.missing).toEqual({ discrete: [8, 9] });
    expect(c.measure).toBe('ordinal');
    expect(copyDraftProps(from, to, ['label']).label).toBe('Trust 1');
  });

  it('finds the other items of a battery', () => {
    const d = ds([
      { name: 'trust1', values: [1] }, { name: 'trust2', values: [1] }, { name: 'Trust10', values: [1] },
      { name: 'trust_all', values: [1] }, { name: 'trust3', values: ['a'] }, { name: 'q1', values: [1] },
    ]);
    expect(batterySiblings(d, d.variables[0]).map((v) => v.name)).toEqual(['trust2', 'Trust10']);
    expect(batterySiblings(d, d.variables[3])).toEqual([]);
  });

  it('parses typed values by type', () => {
    expect(parseValue('numeric', ' 7 ')).toBe(7);
    expect(parseValue('numeric', 'x')).toBeNull();
    expect(parseValue('numeric', '')).toBeNull();
    expect(parseValue('string', 'NA  ')).toBe('NA');
    expect(valueKey(1)).not.toBe(valueKey('1'));
  });
});

describe('SPSS limits', () => {
  const v = makeVariable({ name: 'x', decimals: 0 });
  const d0 = draftFromVariable(v);

  it('accepts a normal draft', () => {
    expect(draftIssues(v, { ...d0, valueLabels: AGREE, missing: { discrete: [7, 8, 9] } })).toEqual([]);
  });

  it('explains labels over 120 bytes and variable labels over 256 bytes', () => {
    const long = 'x'.repeat(SPSS_LIMITS.valueLabelBytes + 1);
    const issues = draftIssues(v, { ...d0, label: 'y'.repeat(257), valueLabels: [{ value: 1, label: long }, { value: 2, label: 'é'.repeat(60) }] });
    expect(issues.map((i) => i.where)).toEqual(['label', 'valueLabel']);
    expect(issues[1].message).toMatch(/label for 1 is too long for SPSS: 121 bytes/);
    // 60 accented letters are 120 bytes: allowed
    expect(draftIssues(v, { ...d0, valueLabels: [{ value: 2, label: 'é'.repeat(61) }] })).toHaveLength(1);
  });

  it('explains too many missing values and bad formats', () => {
    expect(draftIssues(v, { ...d0, missing: { discrete: [1, 2, 3, 4] } })[0].message).toMatch(/at most 3/);
    expect(draftIssues(v, { ...d0, missing: { discrete: [1, 2], range: { lo: 90, hi: 99 } } })[0].message).toMatch(/range plus at most one/);
    const s = makeVariable({ name: 's', type: 'string' });
    expect(draftIssues(s, { ...draftFromVariable(s), missing: { discrete: ['Not applicable'], range: { lo: 1, hi: 2 } } }).map((i) => i.where)).toEqual(['missing', 'missing']);
    expect(draftIssues(v, { ...d0, width: 0 })[0].where).toBe('format');
    expect(draftIssues(v, { ...d0, width: 4, decimals: 4 })[0].where).toBe('format');
  });

  it('keeps the format family when width or decimals change', () => {
    expect(formatFor({ type: 'numeric', format: 'COMMA10.2' }, 12, 0)).toBe('COMMA12.0');
    expect(formatFor({ type: 'numeric', format: 'DATE11' }, 11, 0)).toBe('DATE11');
    expect(formatFor({ type: 'numeric', format: 'F8.2' }, 6, 1)).toBe('F6.1');
  });
});

describe('applying all edits as one change', () => {
  it('builds one new dataset, leaves the old one alone, and writes SPSS syntax', () => {
    const d = survey();
    const ids = ['trust1', 'trust2', 'income'].map((n) => vid(d, n));
    const drafts: Record<string, PropsDraft> = {};
    for (const id of ids) drafts[id] = draftFromVariable(d.variables.find((v) => v.id === id)!);
    const t1 = ids[0];
    drafts[t1] = { ...drafts[t1], label: "Most people can be trusted", valueLabels: AGREE, missing: { discrete: [9, 8] }, measure: 'ordinal' };
    drafts[ids[1]] = { ...drafts[ids[1]], valueLabels: AGREE, measure: 'ordinal' }; // no change
    drafts[ids[2]] = { ...drafts[ids[2]], missing: { discrete: [999999] }, valueLabels: [{ value: 999999, label: 'Refused' }], width: 10, decimals: 0 };
    const r = applyPropertyDrafts(d, drafts);
    expect(r.changed).toEqual([t1, ids[2]]);
    expect(r.dataset).not.toBe(d);
    expect(r.dataset.version).toBe(d.version + 1);
    expect(r.dataset.columns).toBe(d.columns);
    const nt1 = r.dataset.variables.find((v) => v.id === t1)!;
    expect(nt1.missing).toEqual({ discrete: [8, 9] });
    expect(nt1.measure).toBe('ordinal');
    expect(nt1.label).toBe('Most people can be trusted');
    expect(r.dataset.variables.find((v) => v.id === ids[1])).toBe(d.variables.find((v) => v.id === ids[1]));
    expect(r.dataset.variables.find((v) => v.id === ids[2])!.format).toBe('F10.0');
    expect(d.variables.find((v) => v.id === t1)!.valueLabels).toEqual([]);
    expect(r.summary).toBe('Updated the properties of 2 variables (trust1, income): variable label (1), value labels (2), missing values (2), measurement level (1), width or decimals (1).');
    expect(r.syntax).toBe(
      [
        "VARIABLE LABELS trust1 'Most people can be trusted'.",
        "VALUE LABELS trust1\n  1 'Strongly disagree'\n  2 'Disagree'\n  3 'Neither agree nor disagree'\n  4 'Agree'\n  5 'Strongly agree'.",
        "VALUE LABELS income\n  999999 'Refused'.",
        'MISSING VALUES trust1 (8, 9).',
        'MISSING VALUES income (999999).',
        'VARIABLE LEVEL trust1 (ORDINAL).',
        'FORMATS income (F10.0).',
      ].join('\n'),
    );
  });

  it('groups identical settings of a battery into one command each', () => {
    const d = ds(['a1', 'a2', 'a3'].map((name) => ({ name, values: [1, 2, 3] })));
    const drafts: Record<string, PropsDraft> = {};
    for (const v of d.variables) drafts[v.id] = { ...draftFromVariable(v), valueLabels: AGREE, missing: { discrete: [9] }, measure: 'ordinal' };
    const r = applyPropertyDrafts(d, drafts);
    expect(r.syntax.split('\n')[0]).toBe('VALUE LABELS a1 a2 a3');
    expect(r.syntax).toContain('MISSING VALUES a1 a2 a3 (9).');
    expect(r.syntax).toContain('VARIABLE LEVEL a1 a2 a3 (ORDINAL).');
  });

  it('writes syntax that clears missing values and quotes text values', () => {
    const before = makeVariable({ name: 'city', type: 'string', missing: { discrete: ['NA'] } });
    const after = { ...before, missing: { discrete: [] }, valueLabels: [{ value: "DK", label: "Don't know" }] };
    const s = propertiesSyntax([{ before, after }]);
    expect(s).toBe("VALUE LABELS city\n  'DK' 'Don''t know'.\nMISSING VALUES city ().");
  });

  it('returns the same dataset when nothing changed', () => {
    const d = survey();
    const drafts = Object.fromEntries(d.variables.map((v) => [v.id, draftFromVariable(v)]));
    const r = applyPropertyDrafts(d, drafts);
    expect(r.dataset).toBe(d);
    expect(r.changed).toEqual([]);
    expect(r.syntax).toBe('');
  });

  it('detects changes regardless of label order or missing order', () => {
    const v = makeVariable({ name: 'x', valueLabels: [{ value: 2, label: 'b' }, { value: 1, label: 'a' }], missing: { discrete: [9, 8] } });
    const d = { ...draftFromVariable(v), valueLabels: [{ value: 1, label: 'a' }, { value: 2, label: 'b' }], missing: { discrete: [8, 9] } };
    expect(isDraftChanged(v, d)).toBe(false);
    expect(draftChanges(v, { ...d, measure: 'nominal' })).toMatchObject({ measure: true, valueLabels: false, missing: false });
    expect(describeMissingSpec({ discrete: [8, 'x'], range: { lo: -Infinity, hi: -1 } })).toBe("LO THRU -1, 8, 'x'");
  });
});

describe('on the sample survey', () => {
  it('the .sav: 8/9 and 999999 are flagged but already missing; the CSV (no labels): flagged as suspected, with a Likert suggestion', async () => {
    const { readFileSync } = await import('node:fs');
    const { importFile } = await import('../../src/lib/io');
    const sav = (await importFile('urban_trust_survey.sav', new Uint8Array(readFileSync('src/samples/urban_trust_survey.sav')))).dataset;
    const t1 = sav.variables.find((v) => v.name === 'trust1')!;
    const inc = sav.variables.find((v) => v.name === 'hh_income')!;
    const [s1, sInc] = scanVariables(sav, [t1.id, inc.id]);
    const rows = buildRows('numeric', s1, draftFromVariable(t1)).rows;
    expect(rows.filter((r) => r.flags.some((f) => f.kind === 'missing-code')).map((r) => [r.value, r.missing])).toEqual([[8, true], [9, true]]);
    expect(statusOf('numeric', s1, draftFromVariable(t1)).status).toBe('complete');
    expect(suggestMeasure('numeric', s1, draftFromVariable(t1), t1).level).toBe('ordinal');
    expect(buildRows('numeric', sInc, draftFromVariable(inc)).rows.find((r) => r.value === 999999)!.flags[0].kind).toBe('missing-code');
    expect(suggestMeasure('numeric', sInc, draftFromVariable(inc), inc).level).toBe('scale');

    const csv = (await importFile('urban_trust_survey.csv', new Uint8Array(readFileSync('public/samples/urban_trust_survey.csv')))).dataset;
    const c1 = csv.variables.find((v) => v.name === 'trust1')!;
    const [cs] = scanVariables(csv, [c1.id]);
    const st = statusOf('numeric', cs, draftFromVariable(c1));
    expect(st.status).toBe('suspect');
    expect(st.nSuspect).toBe(2);
    const sugg = suggestLabels(c1, cs, draftFromVariable(c1));
    expect(sugg.map((x) => x.id)).toEqual(['agree5', 'missing-codes']);
    let d = applySuggestion(draftFromVariable(c1), 'numeric', sugg[0], true).draft;
    d = applySuggestion(d, 'numeric', sugg[1], true).draft;
    expect(statusOf('numeric', cs, { ...d, measure: 'ordinal' }).status).toBe('complete');
    expect(suggestMeasure('numeric', cs, d, c1).reason).toBe('Ordinal suggested: 5 ordered codes with labels like Strongly disagree ... Strongly agree.');
  });
});
