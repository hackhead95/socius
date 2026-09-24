// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useStore } from '../../src/core/store';
import { makeDataset, makeVariable } from '../../src/core/types';
import { procedures } from '../../src/procedures';
import type { ProcedureDef } from '../../src/core/procedure';
import { ProcedureDialog } from '../../src/features/analysis/ProcedureDialog';

const seen: Array<{ vars: Record<string, string[]>; opts: Record<string, unknown> }> = [];
const fake: ProcedureDef = {
  id: 'zz-fake-ttest',
  menu: 'Compare Means',
  title: 'Fake t-test',
  description: 'Compare two group means.',
  guidance: 'Use this for two groups.',
  slots: [
    { key: 'tests', label: 'Test Variable(s)', min: 1, max: Infinity, types: ['numeric'], measures: ['scale'] },
    { key: 'group', label: 'Grouping Variable', min: 1, max: 1 },
  ],
  options: [
    { key: 'pair', label: 'Groups to compare', type: 'groupPair', slot: 'group', group: 'Groups' },
    { key: 'order', label: 'Category order', type: 'valueList', slot: 'group', group: 'Groups' },
    { key: 'ci', label: 'Confidence interval (%)', type: 'number', default: 95, min: 50, max: 99.9, group: 'Options' },
    { key: 'eff', label: 'Effect sizes', type: 'checkbox', default: true, group: 'Options' },
  ],
  run: (ds, vars, opts) => {
    seen.push({ vars, opts });
    if (opts.ci === 51) throw new Error('Too few cases in group 2.');
    return { id: 'o' + seen.length, procedure: 'zz-fake-ttest', title: 'Fake result', createdAt: 0, blocks: [], syntax: 'T-TEST GROUPS=sex(1 2).' };
  },
};

beforeAll(() => {
  procedures.push(fake);
  // jsdom lacks these.
  (globalThis as any).requestAnimationFrame ??= (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0);
  Element.prototype.scrollIntoView ??= function () {};
});
afterEach(() => cleanup());

function setup() {
  const sex = makeVariable({ id: 'sex', name: 'sex', label: 'Sex', measure: 'nominal', valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }] });
  const inc = makeVariable({ id: 'inc', name: 'inc', label: 'Income', measure: 'scale' });
  const town = makeVariable({ id: 'town', name: 'town', type: 'string' });
  useStore.setState({
    dataset: makeDataset({ name: 'd', variables: [sex, inc, town], nCases: 4, columns: { sex: Float64Array.from([1, 2, 1, 2]), inc: Float64Array.from([1, 2, 3, 4]), town: ['a', 'b', 'a', 'b'] } }),
    outputs: [],
  });
  let closed = 0;
  render(<ProcedureDialog procedureId="zz-fake-ttest" onClose={() => closed++} />);
  return { closed: () => closed };
}

const wait = () => act(() => new Promise((r) => setTimeout(r, 20)));

describe('ProcedureDialog', () => {
  it('validates, fills slots, picks groups, runs and closes', async () => {
    const h = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(screen.getByRole('alert').textContent).toMatch(/Test Variable/);

    // Double-click income -> Test Variable(s); double-click sex -> Grouping Variable (auto-filled pair).
    fireEvent.doubleClick(document.getElementById('src-inc')!);
    fireEvent.doubleClick(document.getElementById('src-sex')!);
    const slots = screen.getAllByRole('listbox');
    expect(within(slots[1]).getByText('Income')).toBeTruthy();
    expect(within(slots[2]).getByText('Sex')).toBeTruthy();
    const g1 = screen.getByLabelText('Group 1') as HTMLSelectElement;
    expect(g1.value).toBe('1');

    // A string variable cannot go in Test Variable(s).
    fireEvent.click(document.getElementById('src-town')!);
    fireEvent.click(screen.getByRole('button', { name: /Move selected variables to Test Variable/ }));
    expect(screen.getByRole('status').textContent).toMatch(/string/);

    // Options tab: change confidence to an invalid value, then to a failing one.
    fireEvent.click(screen.getByRole('tab', { name: 'Options' }));
    fireEvent.change(screen.getByLabelText('Confidence interval (%)'), { target: { value: '120' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(screen.getByRole('alert').textContent).toMatch(/between 50 and 99.9/);

    fireEvent.change(screen.getByLabelText('Confidence interval (%)'), { target: { value: '51' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    await wait();
    expect(screen.getByRole('alert').textContent).toMatch(/Too few cases/);
    expect(h.closed()).toBe(0);

    fireEvent.change(screen.getByLabelText('Confidence interval (%)'), { target: { value: '90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    await wait();
    const last = seen[seen.length - 1];
    expect(last.vars).toEqual({ tests: ['inc'], group: ['sex'] });
    expect(last.opts.pair).toEqual([1, 2]);
    expect(last.opts.ci).toBe(90);
    expect(last.opts.eff).toBe(true);
    expect(useStore.getState().outputs.map((o) => o.title)).toEqual(['Fake result']);
    expect(h.closed()).toBe(1);
  });

  it('remembers the last choices for the session and shows the last syntax', async () => {
    setup();
    const slots = screen.getAllByRole('listbox');
    expect(within(slots[1]).getByText('Income')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show syntax' }));
    expect(screen.getByText('T-TEST GROUPS=sex(1 2).')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(within(screen.getAllByRole('listbox')[1]).queryByText('Income')).toBeNull();
  });

  it('explains when no data is open', () => {
    useStore.setState({ dataset: null });
    render(<ProcedureDialog procedureId="zz-fake-ttest" onClose={() => undefined} />);
    expect(screen.getByText(/Open a data file first/)).toBeTruthy();
  });
});
