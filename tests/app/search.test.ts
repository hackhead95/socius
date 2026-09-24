// @vitest-environment jsdom
// Search palette matching and ranking, against the real menu model (useMenus).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { useStore } from '../../src/core/store';
import { makeDataset, makeVariable } from '../../src/core/types';
import { procedures } from '../../src/procedures';
import { useMenus } from '../../src/app/menus';
import {
  cleanLabel, commandsFromMenus, editDistance, normalise, queryWords, scoreEntry, searchEntries, wordScore, type CommandEntry, type SearchEntry,
} from '../../src/app/search';

function sampleDataset() {
  const gender = makeVariable({ name: 'gender', label: 'Gender of respondent', valueLabels: [{ value: 1, label: 'Man' }, { value: 2, label: 'Woman' }] });
  const trust = makeVariable({ name: 'trust1', label: 'Most people in this neighbourhood can be trusted' });
  return makeDataset({ name: 'Survey', variables: [gender, trust], columns: { [gender.id]: new Float64Array([1, 2]), [trust.id]: new Float64Array([3, 4]) }, nCases: 2 });
}

function commands(): CommandEntry[] {
  const { result } = renderHook(() => useMenus());
  const desc = Object.fromEntries(procedures.map((p) => [p.id, p.description]));
  return commandsFromMenus(result.current, desc);
}

const titles = (q: string, entries: SearchEntry[]) => searchEntries(q, entries).flatMap((g) => g.items.map((e) => e.title));
const first = (q: string, entries: SearchEntry[]) => titles(q, entries)[0];

beforeEach(() => {
  useStore.setState({ dataset: sampleDataset(), outputs: [] });
});
afterEach(() => {
  cleanup();
  useStore.setState({ dataset: null });
});

describe('text helpers', () => {
  it('normalises punctuation, case, accents and chi symbols', () => {
    expect(normalise('T-Test (Independent)…')).toBe('t test independent');
    expect(normalise("Cramér's V")).toBe('cramers v');
    expect(normalise('χ² test')).toBe('chi square test');
    expect(queryWords('how do I weight the cases')).toEqual(['weight', 'cases']);
    expect(cleanLabel('Crosstabs...')).toBe('Crosstabs');
    expect(cleanLabel('Import documents…')).toBe('Import documents');
  });

  it('measures typos with adjacent swaps as one edit', () => {
    expect(editDistance('sqaure', 'square')).toBe(1);
    expect(editDistance('crostabs', 'crosstabs')).toBe(1);
    expect(editDistance('abc', 'xyz', 1)).toBeGreaterThan(1);
  });

  it('scores exact, prefix, inner and misspelt words', () => {
    expect(wordScore('anova', 'anova')).toBe(1);
    expect(wordScore('freq', 'frequencies')).toBeGreaterThan(0.8);
    expect(wordScore('tabs', 'crosstabs')).toBeGreaterThan(0);
    expect(wordScore('frequncies', 'frequencies')).toBeGreaterThan(0.5);
    expect(wordScore('xyz', 'frequencies')).toBe(0);
    expect(wordScore('ab', 'ba')).toBe(0); // no typo allowance for tiny words
  });
});

describe('commands from the menus', () => {
  it('lists every menu item with its menu path, including Analyze procedures, Transform, Text coding, AI and Help', () => {
    const c = commands();
    const byTitle = (t: string) => c.find((e) => e.title === t);
    expect(byTitle('Crosstabs')?.detail).toBe('Analyze > Descriptive Statistics');
    expect(byTitle('Compute variable')?.detail).toBe('Transform');
    expect(byTitle('Explain a result')?.detail).toBe('AI');
    expect(byTitle('Ask the Socius assistant')?.detail).toBe('AI');
    expect(byTitle('Intercoder reliability')?.detail).toBe('Text coding');
    expect(byTitle('User guide')?.detail).toBe('Help');
    expect(byTitle('Save data as: SPSS data (.sav)')?.detail).toBe('File > Save data as');
    for (const p of procedures) expect(c.some((e) => e.id.endsWith(`:${p.id}`))).toBe(true);
  });

  it('keeps disabled items, with the reason', () => {
    useStore.setState({ dataset: null });
    const c = commands();
    const x = c.find((e) => e.title === 'Crosstabs')!;
    expect(x.disabled).toBe(true);
    expect(x.disabledReason).toBe('Open or create a dataset first');
    const undo = c.find((e) => e.title === 'Undo')!;
    expect(undo.disabledReason).toBe('Nothing to undo');
  });

  it('runs exactly what the menu runs', () => {
    const c = commands();
    c.find((e) => e.title === 'Crosstabs')!.item.onSelect!();
    expect(useStore.getState().dialog).toEqual({ kind: 'procedure', id: 'crosstabs' });
    c.find((e) => e.title === 'Weight cases')!.item.onSelect!();
    expect(useStore.getState().dialog).toMatchObject({ kind: 'transform', id: 'weight' });
    useStore.getState().closeDialog();
  });
});

describe('ranking: words sociologists type', () => {
  const cases: Array<[string, string]> = [
    ['chi square', 'Crosstabs'],
    ['chi-square', 'Crosstabs'],
    ['chi sqaure', 'Crosstabs'],
    ['χ²', 'Crosstabs'],
    ['crosstab', 'Crosstabs'],
    ['crostabs', 'Crosstabs'],
    ['cross', 'Crosstabs'],
    ['t test', 'Independent-Samples T Test'],
    ['t-test', 'Independent-Samples T Test'],
    ['paired t', 'Paired-Samples T Test'],
    ['anova', 'One-Way ANOVA'],
    ['regression', 'Linear Regression'],
    ['logistic', 'Binary Logistic Regression'],
    ['reliability', 'Reliability Analysis'],
    ['alpha', 'Reliability Analysis'],
    ['cronbach', 'Reliability Analysis'],
    ['kappa', 'Intercoder reliability'],
    ['recode', 'Recode into different variables'],
    ['weight', 'Weight cases'],
    ['filter', 'Select cases'],
    ['select cases', 'Select cases'],
    ['freq', 'Frequencies'],
    ['frequncies', 'Frequencies'],
    ['correlation', 'Bivariate Correlations'],
    ['open data', 'Open data file'],
    ['bar chart', 'Bar Chart'],
    ['explain', 'Explain a result'],
    ['keyboard shortcuts', 'Keyboard shortcuts'],
  ];
  it.each(cases)('"%s" ranks %s first', (q, want) => {
    expect(first(q, commands())).toBe(want);
  });

  it('finds every t-test and every regression', () => {
    const t = titles('t test', commands());
    expect(t).toEqual(expect.arrayContaining(['Independent-Samples T Test', 'Paired-Samples T Test', 'One-Sample T Test']));
    const r = titles('regression', commands());
    expect(r).toEqual(expect.arrayContaining(['Linear Regression', 'Binary Logistic Regression', 'Ordinal Regression', 'Multinomial Logistic Regression']));
  });

  it('finds codebook exports and the AI codebook', () => {
    const t = titles('codebook', commands());
    expect(t).toEqual(expect.arrayContaining(['Export codebook: Excel (.xlsx)', 'Export codebook: CSV', 'Codebook export and import', 'Suggest a codebook']));
  });

  it('needs every query word to match (no noise from unrelated words)', () => {
    expect(titles('chi square goodness', commands())[0]).toBe('Chi-Square (goodness of fit)');
    expect(titles('zzzz qqqq', commands())).toEqual([]);
  });
});

describe('grouping', () => {
  it('puts the best group first and caps each group', () => {
    const vars: SearchEntry[] = [{ id: 'v1', group: 'variables', title: 'gender', detail: 'Gender of respondent', extra: 'Man Woman' }];
    const res = searchEntries('gender', [...commands(), ...vars]);
    expect(res[0].group).toBe('variables');
    expect(res[0].items[0].title).toBe('gender');
    const many = Array.from({ length: 20 }, (_, i): SearchEntry => ({ id: `v${i}`, group: 'variables', title: `trust${i}` }));
    expect(searchEntries('trust', many)[0].items).toHaveLength(6);
  });

  it('matches value labels with less weight than names', () => {
    const a: SearchEntry = { id: 'a', group: 'variables', title: 'woman_q', detail: 'x' };
    const b: SearchEntry = { id: 'b', group: 'variables', title: 'gender', extra: 'Man Woman' };
    expect(scoreEntry('woman', a)).toBeGreaterThan(scoreEntry('woman', b));
    expect(scoreEntry('woman', b)).toBeGreaterThan(0);
  });
});
