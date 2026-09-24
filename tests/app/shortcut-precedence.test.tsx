// @vitest-environment jsdom
// Keys bound both globally (handleGlobalKey, on window) and by a view: "/" (Text coding Responses
// view), Ctrl/Cmd+F (Data View grid) and Ctrl/Cmd+K (inside the search palette). The view wins while it
// has focus, the global meaning applies elsewhere, and a key is never acted on twice.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useStore } from '../../src/core/store';
import { makeDataset, makeVariable } from '../../src/core/types';
import { emptyCodingProject, type TextDoc } from '../../src/core/coding-types';
import { CommandPaletteHost } from '../../src/app/CommandPalette';
import { DataView } from '../../src/features/data/DataView';
import { ResponsesView } from '../../src/features/coding/ResponsesView';
import { useUi } from '../../src/app/ui-store';
import { handleGlobalKey } from '../../src/app/shortcuts';

const age = makeVariable({ name: 'age', label: 'Age' });
const ds = makeDataset({ name: 'Survey', variables: [age], columns: { [age.id]: new Float64Array([30, 40, 50]) }, nCases: 3 });

function responses(): TextDoc[] {
  return [1, 2].map((i) => ({ id: `r${i}`, name: `Response ${i}`, kind: 'response' as const, text: `answer ${i}`, caseIndex: i - 1, createdAt: 0 }));
}

beforeEach(() => {
  window.addEventListener('keydown', handleGlobalKey);
  useStore.setState({ dataset: ds, outputs: [], coding: { ...emptyCodingProject(), docs: responses() }, dialog: null, tab: 'data' });
  useUi.setState({ paletteOpen: false, findSeq: 0 });
});
afterEach(() => {
  window.removeEventListener('keydown', handleGlobalKey);
  cleanup();
});

/** Press a key on `target` as the browser would: it bubbles through React's handlers, then window. */
function press(target: Element, init: KeyboardEventInit) {
  act(() => {
    fireEvent.keyDown(target, { bubbles: true, cancelable: true, ...init });
  });
}

describe('handleGlobalKey precedence', () => {
  it('leaves a key alone once a view has handled it (preventDefault)', () => {
    for (const init of [{ key: 'k', ctrlKey: true }, { key: '/' }, { key: 'f', ctrlKey: true }]) {
      const e = new KeyboardEvent('keydown', { ...init, cancelable: true });
      e.preventDefault();
      handleGlobalKey(e);
    }
    expect(useUi.getState().paletteOpen).toBe(false);
    expect(useUi.getState().findSeq).toBe(0);
  });

  it('applies the global meaning when no view handled the key', () => {
    handleGlobalKey(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, cancelable: true }));
    expect(useUi.getState().findSeq).toBe(1);
    act(() => handleGlobalKey(new KeyboardEvent('keydown', { key: '/', cancelable: true })));
    expect(useUi.getState().paletteOpen).toBe(true);
  });
});

describe('Ctrl+F: Data View grid vs global', () => {
  it('in the focused grid, the grid opens Find once and the global handler stays out', () => {
    render(<DataView />);
    const grid = screen.getByRole('grid', { name: 'Data View' });
    grid.focus();
    press(grid, { key: 'f', ctrlKey: true });
    // The grid opened its find bar itself; the global request (findSeq) was not made as well.
    expect(useUi.getState().findSeq).toBe(0);
    expect(document.querySelector('.findbar, [role="search"], input[aria-label*="Find" i]')).not.toBeNull();
  });

  it('elsewhere on the Data View tab, the global Ctrl+F asks the Data View to open Find', () => {
    render(<DataView />);
    press(document.body, { key: 'f', ctrlKey: true });
    expect(useUi.getState().findSeq).toBe(1);
  });
});

describe('Ctrl+K: inside the search palette vs global', () => {
  it('inside the open palette it closes the palette (once, not closed and reopened)', () => {
    render(<CommandPaletteHost />);
    press(document.body, { key: 'k', ctrlKey: true });
    expect(useUi.getState().paletteOpen).toBe(true);
    const input = screen.getByRole('combobox', { name: 'Search Socius' });
    press(input, { key: 'k', ctrlKey: true });
    expect(useUi.getState().paletteOpen).toBe(false);
  });
});

describe('"/": Text coding Responses view vs global', () => {
  it('in the focused Responses view, "/" finds a code for the response and does not open Search', () => {
    useStore.setState({ tab: 'coding' });
    const { container } = render(<ResponsesView />);
    const view = container.querySelector('.cw-responses')!;
    expect(view).not.toBeNull();
    press(view, { key: '/' });
    expect(useUi.getState().paletteOpen).toBe(false);
  });

  it('outside the Responses view, "/" opens Search', () => {
    useStore.setState({ tab: 'coding' });
    render(<ResponsesView />);
    press(document.body, { key: '/' });
    expect(useUi.getState().paletteOpen).toBe(true);
  });
});
