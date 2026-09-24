// @vitest-environment jsdom
// The search palette component: keyboard use, commands, variables with their secondary actions,
// results, coded text and the hand-over to the Socius assistant.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useStore } from '../../src/core/store';
import { makeDataset, makeVariable } from '../../src/core/types';
import { emptyCodingProject } from '../../src/core/coding-types';
import { getProcedure } from '../../src/procedures';
import { recall } from '../../src/features/analysis/varUtils';
import { useAssistantUi } from '../../src/features/assistant/open';
import { useCodingUi } from '../../src/features/coding/uiStore';
import { CommandPaletteHost } from '../../src/app/CommandPalette';
import { useUi } from '../../src/app/ui-store';
import { handleGlobalKey } from '../../src/app/shortcuts';

const gender = makeVariable({ name: 'gender', label: 'Gender of respondent', valueLabels: [{ value: 1, label: 'Man' }, { value: 2, label: 'Woman' }] });
const ds = makeDataset({ name: 'Survey', variables: [gender], columns: { [gender.id]: new Float64Array([1, 2]) }, nCases: 2 });

function open() {
  act(() => useUi.getState().setPaletteOpen(true));
  return screen.getByRole('combobox', { name: 'Search Socius' });
}
function type(input: HTMLElement, q: string) {
  fireEvent.change(input, { target: { value: q } });
}
const options = () => screen.queryAllByRole('option');

beforeEach(() => {
  useStore.setState({ dataset: ds, outputs: [], coding: emptyCodingProject(), dialog: null, tab: 'data' });
  useUi.setState({ paletteOpen: false, gridTarget: null });
  useAssistantUi.setState({ open: false, request: null });
  render(<CommandPaletteHost />);
});
afterEach(() => cleanup());

describe('search palette', () => {
  it('opens with Ctrl+K and "/", and closes with Escape', () => {
    act(() => handleGlobalKey(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true })));
    expect(useUi.getState().paletteOpen).toBe(true);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(useUi.getState().paletteOpen).toBe(false);
    act(() => handleGlobalKey(new KeyboardEvent('keydown', { key: '/', cancelable: true })));
    expect(useUi.getState().paletteOpen).toBe(true);
  });

  it('shows suggestions for an empty query', () => {
    open();
    expect(screen.getByText('Suggestions')).toBeTruthy();
    expect(options().map((o) => o.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('Crosstabs'), expect.stringContaining('Explain a result')]));
  });

  it('runs a command with Enter, like the menu', () => {
    const input = open();
    type(input, 'chi square');
    expect(options()[0].textContent).toContain('Crosstabs');
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useStore.getState().dialog).toEqual({ kind: 'procedure', id: 'crosstabs' });
    expect(useUi.getState().paletteOpen).toBe(false);
  });

  it('moves with the arrow keys', () => {
    const input = open();
    type(input, 't test');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options()[1].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[1].id);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    // Wrapped round to the last entry: ask the assistant.
    expect(options()[options().length - 1].getAttribute('aria-selected')).toBe('true');
  });

  it('jumps to a variable in Data View, or opens Frequencies with it (Alt+Enter)', () => {
    let input = open();
    type(input, 'gendr');
    expect(options()[0].textContent).toContain('gender');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useUi.getState().gridTarget).toMatchObject({ varId: gender.id });
    expect(useStore.getState().tab).toBe('data');

    input = open();
    type(input, 'woman'); // value labels are searched too
    const at = options().findIndex((o) => o.textContent?.startsWith('gender'));
    expect(at).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < at; i++) fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter', altKey: true });
    expect(useStore.getState().dialog).toEqual({ kind: 'procedure', id: 'frequencies' });
    const def = getProcedure('frequencies')!;
    expect(Object.values(recall(def, ds).slots).flat()).toContain(gender.id);
  });

  it('finds results in Output and coded text', () => {
    useStore.setState({
      outputs: [{ id: 'o1', procedure: 'crosstabs', title: 'Crosstabs', createdAt: 0, blocks: [{ kind: 'table', table: { title: 'Chi-Square Tests', header: [], rows: [] } }] }],
      coding: { ...emptyCodingProject(), docs: [{ id: 'd1', name: 'Interview 1', kind: 'document', text: 'The water supply is irregular.', attributes: {}, createdAt: 0 }], codes: [{ id: 'c1', name: 'Water insecurity', description: '', color: '#fff', parentId: null, createdAt: 0 }] },
    });
    let input = open();
    type(input, 'chi-square tests');
    const res = options().find((o) => o.textContent?.includes('In Crosstabs'))!;
    fireEvent.click(res);
    expect(useStore.getState().tab).toBe('output');
    expect(useUi.getState().outputTarget).toMatchObject({ itemId: 'o1', blockIndex: 0 });

    input = open();
    type(input, 'water');
    const code = options().find((o) => o.textContent?.includes('Water insecurity'))!;
    expect(code).toBeTruthy();
    const kwic = options().find((o) => o.textContent?.includes('Search in texts for "water"'))!;
    fireEvent.click(kwic);
    expect(useCodingUi.getState()).toMatchObject({ view: 'analyse', analyseTab: 'kwic', kwicQuery: 'water' });
    expect(useStore.getState().tab).toBe('coding');
  });

  it('hands the query to the Socius assistant', () => {
    const input = open();
    type(input, 'which test compares trust between three cities');
    const ask = options().find((o) => o.textContent?.includes('Ask the assistant: which test compares trust between three cities'))!;
    fireEvent.click(ask);
    expect(useAssistantUi.getState()).toMatchObject({ open: true, request: { prompt: 'which test compares trust between three cities', send: true } });
  });

  it('shows disabled commands with the reason and does not run them', () => {
    useStore.setState({ dataset: null });
    const input = open();
    type(input, 'crosstabs');
    const o = options()[0];
    expect(o.getAttribute('aria-disabled')).toBe('true');
    expect(o.textContent).toContain('Open or create a dataset first');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useStore.getState().dialog).toBeNull();
    expect(useUi.getState().paletteOpen).toBe(true);
  });
});
