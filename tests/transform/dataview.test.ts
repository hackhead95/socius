import { describe, expect, it } from 'vitest';
import { parseCellInput, parseDateText, parseTsv, toTsv, editText } from '../../src/features/data/gridEdit';
import { changeType, clearRange, copyProperties, defaultVarName, duplicateVariables, formatWith, looksLikeHeader, nameVariablesFromHeader, writeTexts } from '../../src/features/data/mutations';
import { findNext, summarizeColumn } from '../../src/features/data/find';
import { parseLabelLines } from '../../src/features/data/VarDialogs';
import { makeVariable } from '../../src/core/types';
import { formatRawValue } from '../../src/core/data';
import { col, ds } from './helpers';

describe('cell input parsing', () => {
  const sex = makeVariable({ name: 'sex', valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }] });
  it('accepts numbers, labels, empty and rejects text', () => {
    expect(parseCellInput(sex, ' 2 ')).toEqual({ ok: true, value: 2 });
    expect(parseCellInput(sex, 'female')).toEqual({ ok: true, value: 2 });
    const empty = parseCellInput(sex, '');
    expect(empty.ok && Number.isNaN(empty.value as number)).toBe(true);
    expect(parseCellInput(sex, '1,234.5')).toEqual({ ok: true, value: 1234.5 });
    expect(parseCellInput(sex, 'abc').ok).toBe(false);
  });
  it('parses dates in the variable format', () => {
    const d = makeVariable({ name: 'd', format: 'DATE11' });
    const r = parseCellInput(d, '17-May-1990');
    expect(r.ok).toBe(true);
    expect(formatRawValue(d, (r as { value: number }).value)).toBe('17-MAY-1990');
    expect(parseDateText('1990-05-17', 'DATE11')).toBe((r as { value: number }).value);
    expect(parseDateText('05/17/1990', 'ADATE10')).toBe((r as { value: number }).value);
    expect(parseDateText('17.05.1990', 'EDATE10')).toBe((r as { value: number }).value);
    expect(parseDateText('31-FEB-2020', 'DATE11')).toBeNull();
    expect(parseDateText('01:30:15', 'TIME8')).toBe(5415);
    expect(editText(d, (r as { value: number }).value)).toBe('17-MAY-1990');
  });
  it('truncates strings to their width', () => {
    const s = makeVariable({ name: 's', type: 'string', width: 3 });
    expect(parseCellInput(s, 'abcdef')).toEqual({ ok: true, value: 'abc' });
  });
});

describe('numeric to string keeps labels and missing codes matching the data', () => {
  it('converts labels and missing values with the same format as the values', () => {
    const d = ds([{ name: 'q', values: [1, 2, 9, null] }]);
    d.variables[0] = { ...d.variables[0], format: 'F8.2', decimals: 2, valueLabels: [{ value: 1, label: 'Yes' }, { value: 2, label: 'No' }], missing: { discrete: [9] } };
    const r = changeType(d, d.variables[0].id, 'string', 'A8', 8, 0);
    expect(col(r, 'q')).toEqual(['1.00', '2.00', '9.00', '']);
    expect(r.variables[0].valueLabels).toEqual([{ value: '1.00', label: 'Yes' }, { value: '2.00', label: 'No' }]);
    expect(r.variables[0].missing.discrete).toEqual(['9.00']);
  });
});

describe('pasting a table with headings into an empty dataset', () => {
  it('detects a heading row and names the variables from it', () => {
    expect(looksLikeHeader([['name', 'score'], ['Asha', '3.5'], ['Bikram', '4']])).toBe(true);
    expect(looksLikeHeader([['1', '2'], ['3', '4']])).toBe(false); // numbers are data
    expect(looksLikeHeader([['Asha', 'Delhi'], ['Bikram', 'Pune']])).toBe(false); // all text: cannot tell
    expect(looksLikeHeader([['a', 'a'], ['1', '2']])).toBe(false); // duplicate headings
    expect(looksLikeHeader([['x', 'y']])).toBe(false);
    const empty = ds([]);
    const rep = writeTexts(empty, [{ row: 0, col: 0, text: 'Asha' }, { row: 0, col: 1, text: '3.5' }]);
    const named = nameVariablesFromHeader(rep.dataset, 0, ['name', 'Score (1-5)']);
    expect(named.variables.map((v) => v.name)).toEqual(['name', 'Score_1_5']);
    expect(named.variables[1].label).toBe('Score (1-5)');
    expect(named.variables[1].type).toBe('numeric');
  });
});

describe('long text in string variables', () => {
  it('widens the variable instead of cutting typed or pasted text', () => {
    const d = ds([{ name: 's', values: ['ab', 'cd'] }]);
    d.variables[0] = { ...d.variables[0], width: 2, format: 'A2' };
    const r = writeTexts(d, [{ row: 0, col: 0, text: 'Kolkata North' }, { row: 1, col: 0, text: 'দিল্লি' }]);
    expect(col(r.dataset, 's')).toEqual(['Kolkata North', 'দিল্লি']);
    expect(r.dataset.variables[0].width).toBe(18); // দিল্লি is 18 UTF-8 bytes
    expect(r.dataset.variables[0].format).toBe('A18');
    expect(r.widened).toEqual(['s']);
    expect(d.variables[0].width).toBe(2); // original untouched (undo)
    expect(writeTexts(d, [{ row: 0, col: 0, text: 'x' }]).widened).toEqual([]);
  });
});

describe('TSV clipboard', () => {
  it('parses Excel-style quoted fields and round-trips', () => {
    const rows = parseTsv('a\tb\n"x\ty"\t"he said ""hi"""\n1\t\n');
    expect(rows).toEqual([['a', 'b'], ['x\ty', 'he said "hi"'], ['1', '']]);
    expect(parseTsv(toTsv(rows))).toEqual(rows);
  });
});

describe('writing blocks (paste / typing)', () => {
  it('extends cases and creates variables for extra columns', () => {
    const d = ds([{ name: 'x', values: [1, 2] }]);
    const r = writeTexts(d, [
      { row: 1, col: 0, text: '5' },
      { row: 2, col: 0, text: '6' },
      { row: 0, col: 1, text: 'hello' },
      { row: 1, col: 2, text: '3' },
      { row: 0, col: 0, text: 'oops' },
    ]);
    expect(r.addedCases).toBe(1);
    expect(r.addedVars).toBe(2);
    expect(r.rejected).toBe(1);
    expect(col(r.dataset, 'x')).toEqual([1, 5, 6]);
    expect(r.dataset.variables[1].type).toBe('string');
    expect(col(r.dataset, 'VAR00001')).toEqual(['hello', '', '']);
    expect(r.dataset.variables[2].decimals).toBe(0);
    expect(col(d, 'x')).toEqual([1, 2]);
  });
  it('clears ranges', () => {
    const d = ds([{ name: 'x', values: [1, 2, 3] }, { name: 's', values: ['a', 'b', 'c'] }]);
    const r = clearRange(d, 1, 5, 0, 5);
    expect(col(r, 'x').map((v) => (Number.isNaN(v) ? null : v))).toEqual([1, null, null]);
    expect(col(r, 's')).toEqual(['a', '', '']);
  });
  it('names new variables like SPSS', () => {
    expect(defaultVarName(ds([{ name: 'VAR00001', values: [1] }]))).toBe('VAR00002');
  });
});

describe('variable properties', () => {
  it('changes type with conversion', () => {
    const d = ds([{ name: 'x', values: [1.5, null, 3], opts: { valueLabels: [{ value: 3, label: 'Three' }] } }]);
    const s = changeType(d, d.variables[0].id, 'string', 'A8', 8, 0);
    expect(col(s, 'x')).toEqual(['1.50', '', '3.00']);
    expect(s.variables[0].valueLabels).toEqual([{ value: '3.00', label: 'Three' }]);
    const back = changeType(s, d.variables[0].id, 'numeric', 'F8.2', 8, 2);
    expect(col(back, 'x').map((v) => (Number.isNaN(v) ? null : v))).toEqual([1.5, null, 3]);
    const t = ds([{ name: 'd', values: ['2020-01-02', 'nope'] }]);
    const dt = changeType(t, t.variables[0].id, 'numeric', 'DATE11', 11, 0);
    expect(formatRawValue(dt.variables[0], col(dt, 'd')[0] as number)).toBe('02-JAN-2020');
    expect(Number.isNaN(col(dt, 'd')[1] as number)).toBe(true);
  });
  it('keeps the format family when changing width/decimals', () => {
    expect(formatWith({ format: 'COMMA10.2', type: 'numeric' }, 12, 1)).toBe('COMMA12.1');
    expect(formatWith({ format: 'DATE11', type: 'numeric' }, 20, 0)).toBe('DATE20');
    expect(formatWith({ format: 'A8', type: 'string' }, 20, 0)).toBe('A20');
  });
  it('copies properties to a Likert battery and duplicates variables', () => {
    const labels = [{ value: 1, label: 'Disagree' }, { value: 5, label: 'Agree' }];
    const d = ds([
      { name: 'q1', values: [1], opts: { valueLabels: labels, missing: { discrete: [9] }, measure: 'ordinal' } },
      { name: 'q2', values: [2] },
      { name: 'txt', values: ['a'] },
    ]);
    const r = copyProperties(d, d.variables[0].id, [d.variables[1].id, d.variables[2].id], ['valueLabels', 'missing', 'measure']);
    expect(r.variables[1].valueLabels).toEqual(labels);
    expect(r.variables[1].missing.discrete).toEqual([9]);
    expect(r.variables[1].measure).toBe('ordinal');
    expect(r.variables[2].valueLabels).toEqual([]);
    const dup = duplicateVariables(d, [d.variables[0].id]);
    expect(dup.variables.map((v) => v.name)).toEqual(['q1', 'q1_copy', 'q2', 'txt']);
  });
  it('parses pasted value-label lines', () => {
    const r = parseLabelLines("1=Strongly disagree\n2 Disagree\n3\tNeutral\n'x' = no\nbad", 'numeric');
    expect(r.labels).toEqual([{ value: 1, label: 'Strongly disagree' }, { value: 2, label: 'Disagree' }, { value: 3, label: 'Neutral' }]);
    expect(r.bad.length).toBe(2);
    expect(parseLabelLines("m=Male\n'f'=\"Female\"", 'string').labels).toEqual([{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }]);
  });
  it('reads questionnaire-style lists: 1) Yes, 2. No, 3 - Maybe, -9 = Refused', () => {
    const r = parseLabelLines('1) Yes\n2. No\n3 - Maybe\n4 – Not sure\n-9 = Refused\n1.5 Half', 'numeric');
    expect(r.labels).toEqual([
      { value: 1, label: 'Yes' }, { value: 2, label: 'No' }, { value: 3, label: 'Maybe' }, { value: 4, label: 'Not sure' }, { value: -9, label: 'Refused' }, { value: 1.5, label: 'Half' },
    ]);
    expect(r.bad).toEqual([]);
  });
});

describe('find and quick statistics', () => {
  const d = ds([
    { name: 'sex', values: [1, 2, 2, 1], opts: { valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }], measure: 'nominal' } },
    { name: 'town', values: ['Pune', 'Agra', 'pune', 'Delhi'] },
    { name: 'inc', values: [10, 20, null, 30] },
  ]);
  it('finds values and labels in reading order, wrapping', () => {
    const o = { text: 'female', colIndex: null, labels: true, whole: false };
    expect(findNext(d, { row: 0, col: 0 }, o)).toEqual({ row: 1, col: 0 });
    expect(findNext(d, { row: 1, col: 0 }, o)).toEqual({ row: 2, col: 0 });
    expect(findNext(d, { row: 2, col: 0 }, o)).toEqual({ row: 1, col: 0 });
    expect(findNext(d, { row: 0, col: 0 }, { ...o, text: 'pune', whole: true })).toEqual({ row: 0, col: 1 });
    expect(findNext(d, { row: 0, col: 1 }, { ...o, text: 'pune' })).toEqual({ row: 2, col: 1 });
    expect(findNext(d, { row: 0, col: 0 }, { ...o, text: '30' })).toEqual({ row: 3, col: 2 });
    expect(findNext(d, { row: 0, col: 0 }, { ...o, text: 'zzz' })).toBeNull();
    expect(findNext(d, { row: 3, col: 2 }, { ...o, text: '20' }, -1)).toEqual({ row: 1, col: 2 });
  });
  it('summarises numeric and categorical columns', () => {
    const s = summarizeColumn(d, 2);
    expect(s.kind).toBe('numeric');
    expect(s.n).toBe(3);
    expect(s.missing).toBe(1);
    expect(s.mean).toBe(20);
    expect(s.sd).toBe(10);
    const c = summarizeColumn(d, 0);
    expect(c.kind).toBe('categorical');
    expect(c.categories!.map((x) => [x.label, x.pct])).toEqual([['Male', 50], ['Female', 50]]);
  });
});
