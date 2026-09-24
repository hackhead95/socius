// Regression tests for the September 2026 shell fixes: Undo per tab (describing the change, output
// deletions, coding redo), renaming variables, the sample-interview chooser, the start screen's way
// back, and submenu "menu aim".
import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '../../src/core/store';
import { makeDataset, makeVariable, type Dataset } from '../../src/core/types';
import { emptyCodingProject } from '../../src/core/coding-types';
import { describeDatasetChange } from '../../src/app/undo';
import { varNameProblem } from '../../src/features/data/mutations';
import { addDocs, canRedo, canUndo, createCode, redoCoding, setActiveCoder, addCoder, undoCoding } from '../../src/features/coding/actions';
import { useCodingUi } from '../../src/features/coding/uiStore';
import { samplesToTick } from '../../src/features/coding/dialogs/ImportDialog';
import { sampleTranscripts } from '../../src/samples';
import { aimsAtSubmenu } from '../../src/ui/Menu';
import { backTarget } from '../../src/app/Welcome';
import { codingMenuItems } from '../../src/features/coding/menu';

function survey(): Dataset {
  const age = makeVariable({ name: 'age', label: 'Age' });
  const wt = makeVariable({ name: 'wt' });
  const flt = makeVariable({ name: 'filter_$' });
  const inc = makeVariable({ name: 'income' });
  return makeDataset({
    name: 'Survey',
    variables: [age, wt, flt, inc],
    columns: { [age.id]: new Float64Array([30, 40]), [wt.id]: new Float64Array([1, 2]), [flt.id]: new Float64Array([1, 0]), [inc.id]: new Float64Array([5, 6]) },
    nCases: 2,
    weightVarId: wt.id,
    filterVarId: flt.id,
  });
}

beforeEach(() => {
  useStore.setState({ dataset: null, past: [], future: [], outputs: [], outputUndo: [], outputRedo: [], tab: 'data', coding: emptyCodingProject() });
  useCodingUi.setState({ history: [], future: [] });
});

describe('Undo says what it will undo', () => {
  it('describes each kind of data change', () => {
    const ds = survey();
    const [age, , , inc] = ds.variables;
    const withVars = (vars: typeof ds.variables) => ({ ...ds, variables: vars, version: ds.version + 1 });
    expect(describeDatasetChange(ds, withVars(ds.variables.map((v) => (v === age ? { ...v, name: 'Age' } : v))))).toBe('rename of age');
    expect(describeDatasetChange(ds, withVars(ds.variables.map((v) => (v === age ? { ...v, label: 'Age in years' } : v))))).toBe('changes to age');
    const added = makeVariable({ name: 'agegrp' });
    expect(describeDatasetChange(ds, { ...withVars([...ds.variables, added]), columns: { ...ds.columns, [added.id]: new Float64Array(2) } })).toBe('new variable agegrp');
    expect(describeDatasetChange(ds, withVars(ds.variables.filter((v) => v !== inc)))).toBe('deleting income');
    expect(describeDatasetChange(ds, withVars([...ds.variables].reverse()))).toBe('moving variables');
    expect(describeDatasetChange(ds, { ...ds, columns: { ...ds.columns, [inc.id]: new Float64Array([7, 6]) } })).toBe('edit in income');
    expect(describeDatasetChange(ds, { ...ds, weightVarId: null })).toBe('turning weighting off');
    expect(describeDatasetChange(ds, { ...ds, filterVarId: null })).toBe('turning the filter off');
    expect(describeDatasetChange(ds, { ...ds, name: 'Survey 2026' })).toBe('rename of the dataset');
    const grow = Object.fromEntries(ds.variables.map((v) => [v.id, new Float64Array(5)]));
    expect(describeDatasetChange(ds, { ...ds, columns: grow, nCases: 5 })).toBe('inserting 3 cases');
  });

  it('uses the name a change was given', () => {
    useStore.getState().setDataset(survey());
    useStore.getState().mutateDataset((d) => ({ ...d, variables: d.variables.slice(0, 3) }), { label: 'Recode' });
    const { past, dataset } = useStore.getState();
    expect(describeDatasetChange(past[0], dataset!)).toBe('Recode');
  });
});

describe('deleted Output results can be undone', () => {
  const item = (id: string) => ({ id, title: id, createdAt: 0, blocks: [] }) as never;

  it('restores the result at its place, and redo deletes it again', () => {
    useStore.setState({ outputs: [item('a'), item('b'), item('c')] });
    useStore.getState().removeOutput('b');
    expect(useStore.getState().restoreOutput()).toBe(true);
    expect(useStore.getState().outputs.map((o) => o.id)).toEqual(['a', 'b', 'c']);
    expect(useStore.getState().redeleteOutput()).toBe(true);
    expect(useStore.getState().outputs.map((o) => o.id)).toEqual(['a', 'c']);
    expect(useStore.getState().restoreOutput()).toBe(true);
    expect(useStore.getState().restoreOutput()).toBe(false);
  });

  it('skips a result already brought back by the Output toast, and forgets deletions when a project replaces everything', () => {
    useStore.setState({ outputs: [item('a'), item('b')] });
    useStore.getState().removeOutput('a');
    useStore.setState({ outputs: [item('a'), item('b')] }); // the toast's own Undo
    expect(useStore.getState().restoreOutput()).toBe(false);
    useStore.getState().removeOutput('b');
    // Opening a project: new data, new output, fresh history.
    useStore.setState({ dataset: survey(), past: [], future: [], outputs: [item('z')] });
    expect(useStore.getState().outputUndo).toEqual([]);
  });
});

describe('Text coding redo', () => {
  it('redoes what was undone, and a new change clears the redo list', () => {
    const a = createCode('A');
    expect(undoCoding()).toBe('Create code "A"');
    expect(canRedo()).toBe(true);
    expect(redoCoding()).toBe('Create code "A"');
    expect(useStore.getState().coding.codes.some((c) => c.id === a.id)).toBe(true);
    expect(undoCoding()).not.toBeNull();
    createCode('B');
    expect(canRedo()).toBe(false);
    expect(canUndo()).toBe(true);
  });

  it('keeps redo working after switching coder', () => {
    addDocs([{ id: 'r1', name: 'R1', kind: 'response', text: 'x', createdAt: 0 }]);
    addCoder('Priya');
    createCode('C');
    undoCoding();
    setActiveCoder('Priya');
    expect(redoCoding()).toBe('Create code "C"');
    expect(useStore.getState().coding.activeCoder).toBe('Priya');
  });
});

describe('renaming a variable (Variable View name cell, Data View heading)', () => {
  const rename = (ds: Dataset, name: string) => varNameProblem(ds, name, ds.variables[0].id);

  it('accepts simple names, a change of capitals only, digits, underscores and non-Latin letters', () => {
    const ds = survey();
    for (const ok of ['respondent_age', 'Age', 'AGE', 'age2', 'q2_1', 'বয়স', 'বয়স_২০২৬', 'âge', 'x'.repeat(64), 'ব'.repeat(21), 'wt2']) expect(rename(ds, ok), ok).toBeNull();
  });

  it('explains what is wrong in plain words, with a suggestion', () => {
    const ds = survey();
    expect(rename(ds, '')).toMatch(/Type a name/);
    expect(rename(ds, 'age group')).toBe('Names cannot contain spaces. Try age_group.');
    expect(rename(ds, '2020_income')).toMatch(/^Names must start with a letter, not "2"\. Try v2020_income\.$/);
    expect(rename(ds, 'age-grp')).toMatch(/not "-"\. Try age_grp\./);
    expect(rename(ds, 'income_')).toMatch(/cannot end with "_"/);
    expect(rename(ds, 'income')).toMatch(/Another variable is already called income.*Try income_2\./);
    expect(rename(ds, 'INCOME')).toMatch(/already called income/);
    expect(rename(ds, 'x'.repeat(65))).toMatch(/too long: 65 bytes/);
    expect(rename(ds, 'ব'.repeat(22))).toMatch(/too long: 66 bytes.*Bengali/);
    expect(rename(ds, 'with')).toMatch(/reserved word/);
    expect(rename(ds, 'বয়স গ্রুপ')).toMatch(/cannot contain spaces\. Try বয়স_গ্রুপ\./);
  });

  it('keeps the weight, the filter and coding links, which refer to the variable by id', () => {
    const ds = survey();
    useStore.getState().setDataset(ds);
    const [, wt, flt] = ds.variables;
    useStore.getState().updateVariable(wt.id, { name: 'Weight_2026' });
    useStore.getState().updateVariable(flt.id, { name: 'ফিল্টার' });
    const now = useStore.getState().dataset!;
    expect(now.weightVarId).toBe(wt.id);
    expect(now.filterVarId).toBe(flt.id);
    expect(now.variables.find((v) => v.id === wt.id)!.name).toBe('Weight_2026');
    expect(now.columns[wt.id]).toBe(ds.columns[wt.id]);
  });
});

describe('sample interviews: one chooser from the menu and the toolbar', () => {
  it('both places are the same command with the same label', () => {
    const item = codingMenuItems.find((c) => c.id === 'load-samples')!;
    expect(item.label).toBe('Load sample interviews...');
  });

  it('ticks every interview that is not loaded yet', () => {
    expect(samplesToTick([])).toEqual(sampleTranscripts.map((_, i) => i));
    const first = { id: 'd1', name: sampleTranscripts[0].name, kind: 'document' as const, text: 'x', createdAt: 0 };
    expect(samplesToTick([first])).toEqual(sampleTranscripts.map((_, i) => i).slice(1));
  });
});

describe('start screen (Home)', () => {
  it('offers a way back to what is open', () => {
    const coding = emptyCodingProject();
    expect(backTarget({ dataset: { name: 'x' }, tab: 'coding', outputs: [], coding })).toBe('your data');
    expect(backTarget({ dataset: null, tab: 'output', outputs: [1], coding })).toBe('Output');
    expect(backTarget({ dataset: null, tab: 'data', outputs: [1], coding })).toBeNull();
  });
});

describe('submenu menu aim', () => {
  const sub = { left: 300, right: 500, top: 100, bottom: 300 };
  it('treats a diagonal move towards the submenu as aiming, and other moves as not', () => {
    expect(aimsAtSubmenu({ x: 200, y: 110 }, { x: 230, y: 140 }, sub)).toBe(true);
    expect(aimsAtSubmenu({ x: 200, y: 110 }, { x: 205, y: 180 }, sub)).toBe(false); // straight down the menu
    expect(aimsAtSubmenu({ x: 200, y: 110 }, { x: 180, y: 120 }, sub)).toBe(false); // moving away
    expect(aimsAtSubmenu({ x: 600, y: 110 }, { x: 560, y: 150 }, { left: 400, right: 520, top: 100, bottom: 300 }, 'left')).toBe(true);
  });
});
