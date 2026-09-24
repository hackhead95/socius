// Undo history must not grow without bound on big files: every sort of 100,000 x 200 copies 160 MB.
import { describe, expect, it } from 'vitest';
import { trimHistory, useStore } from '../../src/core/store';
import { makeDataset, makeVariable } from '../../src/core/types';

function big(nCases: number) {
  const v = makeVariable({ name: 'x' });
  return makeDataset({ name: 'b', variables: [v], columns: { [v.id]: new Float64Array(nCases) }, nCases });
}

describe('undo history memory', () => {
  it('drops the oldest states once the columns only they hold pass the budget', () => {
    const states = [big(1000), big(1000), big(1000), big(1000)]; // 8000 bytes each
    expect(trimHistory(states, null, 20_000)).toEqual(states.slice(2));
    expect(trimHistory(states, null, 1_000_000)).toBe(states);
    expect(trimHistory(states, null, 10)).toEqual(states.slice(3)); // always keeps the latest
  });

  it('counts columns shared with the current data or other states once', () => {
    const a = big(1000);
    const shared = [a, { ...a, name: 'renamed' }, { ...a, fileLabel: 'x' }];
    expect(trimHistory(shared, a, 1)).toBe(shared); // nothing but the current data's own column
  });

  it('keeps sorting a large dataset from piling up copies', () => {
    const ds = big(4_000_000); // 32 MB per copy
    useStore.getState().setDataset(ds);
    for (let i = 0; i < 60; i++) useStore.getState().mutateDataset((d) => ({ ...d, columns: { [d.variables[0].id]: new Float64Array(d.nCases) } }));
    const n = useStore.getState().past.length;
    expect(n).toBeGreaterThan(1);
    expect(n).toBeLessThan(40);
    expect(n * 32_000_000).toBeLessThanOrEqual(700 * 1024 * 1024 + 32_000_000);
  });
});
