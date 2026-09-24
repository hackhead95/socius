import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable } from '../../src/core/types';
import type { ProcedureDef } from '../../src/core/procedure';
import { addToSlot, bestSlotFor, measureWarning, moveWithinSlot, recall, remember, slotCountHint, validate, clearMemory } from '../../src/features/analysis/varUtils';

const age = makeVariable({ id: 'age', name: 'age', measure: 'scale' });
const sex = makeVariable({ id: 'sex', name: 'sex', measure: 'nominal' });
const town = makeVariable({ id: 'town', name: 'town', type: 'string' });
const ds = makeDataset({ name: 'd', variables: [age, sex, town], nCases: 0, columns: { age: new Float64Array(0), sex: new Float64Array(0), town: [] } });

const def: ProcedureDef = {
  id: 't-test',
  menu: 'Compare Means',
  title: 'T',
  description: 'd',
  slots: [
    { key: 'tests', label: 'Test variables', min: 1, max: Infinity, types: ['numeric'], measures: ['scale'] },
    { key: 'group', label: 'Grouping variable', min: 1, max: 1 },
  ],
  options: [
    { key: 'pair', label: 'Groups', type: 'groupPair', slot: 'group' },
    { key: 'conf', label: 'Confidence', type: 'number', default: 95, min: 50, max: 99.9 },
  ],
  validate: (_ds, vars) => (vars.tests.includes('sex') ? 'No sex as test variable, please.' : null),
  run: () => { throw new Error('not used'); },
};

describe('slot rules', () => {
  it('blocks type mismatches and replaces max-1 slots', () => {
    const r = addToSlot({ tests: [], group: [] }, def.slots[0], [town, age]);
    expect(r.slots.tests).toEqual(['age']);
    expect(r.messages[0]).toMatch(/string/);
    const g1 = addToSlot(r.slots, def.slots[1], [sex]);
    const g2 = addToSlot(g1.slots, def.slots[1], [town]);
    expect(g2.slots.group).toEqual(['town']);
  });
  it('warns (does not block) on measure mismatch', () => {
    expect(measureWarning(def.slots[0], sex)).toMatch(/expects scale/);
    expect(measureWarning(def.slots[0], age)).toBeNull();
    expect(addToSlot({ tests: [] }, def.slots[0], [sex]).slots.tests).toEqual(['sex']);
  });
  it('picks the best slot on double-click', () => {
    expect(bestSlotFor(def, { tests: [], group: [] }, age)?.key).toBe('tests');
    expect(bestSlotFor(def, { tests: [], group: [] }, town)?.key).toBe('group');
  });
  it('reorders within a slot', () => {
    expect(moveWithinSlot({ s: ['a', 'b', 'c'] }, 's', 'c', 0).s).toEqual(['c', 'a', 'b']);
    expect(moveWithinSlot({ s: ['a', 'b', 'c'] }, 's', 'a', 3).s).toEqual(['b', 'c', 'a']);
  });
  it('describes counts', () => {
    expect(slotCountHint(def.slots[0])).toBe('1 or more');
    expect(slotCountHint(def.slots[1])).toBe('1 variable');
    expect(slotCountHint({ key: 'x', label: 'x', min: 0, max: 1 })).toBe('Optional, 1 variable');
  });
});

describe('validation', () => {
  it('checks slot counts, group pairs, numbers and def.validate', () => {
    const empty = validate(def, ds, { tests: [], group: [] }, { pair: null, conf: 95 });
    expect(empty.join(' ')).toMatch(/Test variables/);
    expect(validate(def, ds, { tests: ['age'], group: ['sex'] }, { pair: null, conf: 95 }).join(' ')).toMatch(/two groups/);
    expect(validate(def, ds, { tests: ['age'], group: ['sex'] }, { pair: [1, 1], conf: 95 }).join(' ')).toMatch(/different/);
    expect(validate(def, ds, { tests: ['age'], group: ['sex'] }, { pair: [1, 2], conf: 120 }).join(' ')).toMatch(/between/);
    expect(validate(def, ds, { tests: ['age'], group: ['sex'] }, { pair: [1, 2], conf: 95 })).toEqual([]);
    expect(validate(def, ds, { tests: ['sex'], group: ['sex'] }, { pair: [1, 2], conf: 95 })).toEqual(['No sex as test variable, please.']);
  });
});

describe('session memory', () => {
  it('recalls slots and options, dropping variables that no longer exist', () => {
    clearMemory();
    remember('t-test', { slots: { tests: ['age', 'gone'], group: ['sex'] }, options: { conf: 90, stale: 1 } });
    const r = recall(def, ds);
    expect(r.slots.tests).toEqual(['age']);
    expect(r.options.conf).toBe(90);
    expect(r.options.stale).toBeUndefined();
    expect(r.options.pair).toBeNull();
  });
});

describe('options that do not apply', () => {
  it('a cut-point t test does not ask for two group values (and vice versa)', async () => {
    const { getProcedure } = await import('../../src/procedures');
    const { defaultOptions } = await import('../../src/core/procedure');
    const { optionInactive } = await import('../../src/features/analysis/varUtils');
    const tt = getProcedure('ttest-independent')!;
    const slots = { variables: ['age'], group: ['age'] };
    const cut = { ...defaultOptions(tt), defineBy: 'cut', cutPoint: 40, groups: null };
    expect(validate(tt, ds, slots, cut)).toEqual([]);
    expect(tt.options.filter((o) => optionInactive(o, cut)).map((o) => o.key)).toEqual(['groups']);
    const byValues = { ...defaultOptions(tt), groups: null };
    expect(validate(tt, ds, slots, byValues)).toContain('Choose the two groups for "Groups".');
    expect(tt.options.filter((o) => optionInactive(o, byValues)).map((o) => o.key)).toEqual(['cutPoint']);
    const bin = getProcedure('binomial')!;
    expect(bin.options.filter((o) => optionInactive(o, defaultOptions(bin))).map((o) => o.key)).toEqual(['cutPoint']);
  });
});
