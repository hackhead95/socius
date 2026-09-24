// Unit tests for the shell side of the QA crawl fixes (docs/qa/UI-BUGS.md): menubar hover intent
// (UI-011), toasts with an action that do not stack (UI-001, UI-027), the tokens' contrast (UI-014)
// and the dialog backdrop rule (UI-022). Focus and layout behaviour needs a real browser: see
// e2e/ui-overlays-focus.spec.ts.
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { aimsAtDropdown } from '../../src/app/MenuBar';
import { useStore } from '../../src/core/store';
import { Modal } from '../../src/ui/Modal';

afterEach(() => cleanup());

describe('menubar hover intent (UI-011)', () => {
  const dd = { left: 10, right: 250, top: 40 };
  it('a pointer heading down into the open menu is aiming at it', () => {
    expect(aimsAtDropdown({ x: 30, y: 14 }, { x: 40, y: 18 }, dd)).toBe(true);
    // Down and to the right, crossing the next title on the way to an item.
    expect(aimsAtDropdown({ x: 60, y: 16 }, { x: 72, y: 20 }, dd)).toBe(true);
  });
  it('moving along the bar, up, or away from the menu is not', () => {
    expect(aimsAtDropdown({ x: 30, y: 14 }, { x: 45, y: 14 }, dd)).toBe(false);
    expect(aimsAtDropdown({ x: 30, y: 14 }, { x: 35, y: 10 }, dd)).toBe(false);
    expect(aimsAtDropdown({ x: 240, y: 14 }, { x: 300, y: 20 }, dd)).toBe(false);
  });
});

describe('toasts', () => {
  it('the same message replaces the old one instead of stacking, and can carry an action', () => {
    vi.useFakeTimers();
    try {
      useStore.setState({ toasts: [] });
      const st = useStore.getState();
      st.toast('Weighting on.', 'success');
      st.toast('Weighting on.', 'success');
      expect(useStore.getState().toasts).toHaveLength(1);
      let ran = 0;
      st.toast('Deleted "Frequencies".', 'info', { action: { label: 'Undo', run: () => ran++ } });
      const t = useStore.getState().toasts.find((x) => x.action);
      expect(t?.action?.label).toBe('Undo');
      t!.action!.run();
      expect(ran).toBe(1);
      // A toast with a button stays longer than a plain one.
      vi.advanceTimersByTime(5000);
      expect(useStore.getState().toasts.map((x) => x.text)).toEqual(['Deleted "Frequencies".']);
      vi.advanceTimersByTime(4000);
      expect(useStore.getState().toasts).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('theme tokens (UI-014)', () => {
  const css = readFileSync(join(__dirname, '../../src/styles/tokens.css'), 'utf8');
  const block = (start: string) => {
    const i = css.indexOf(start);
    return css.slice(i, css.indexOf('}', i));
  };
  const tokens = (text: string) => Object.fromEntries([...text.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const light = tokens(block(':root {'));
  const dark = { ...light, ...tokens(block(":root[data-theme='dark'] {")) };
  const surfaces = ['--bg', '--surface', '--surface-2', '--surface-3', '--accent-soft', '--grid-sel', '--grid-rownum', '--grid-head', '--warn-soft', '--good-soft', '--bad-soft'];
  for (const [name, t] of [['light', light], ['dark', dark]] as const) {
    it(`--faint and --muted text reach 4.5:1 on every surface (${name})`, () => {
      for (const fg of ['--faint', '--muted']) for (const bg of surfaces) expect(ratio(t[fg], t[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    });
  }
  it('the dark tokens for "match my system" equal the explicit dark theme', () => {
    const media = tokens(block(":root:not([data-theme='light']) {"));
    expect(media['--faint']).toBe(dark['--faint']);
    expect(media['--muted']).toBe(dark['--muted']);
  });
});

describe('dialog backdrop (UI-022)', () => {
  it('a click on the dimmed area closes an information dialog but not one with fields', () => {
    const closeInfo = vi.fn();
    const { container, unmount } = render(<Modal title="About" onClose={closeInfo}><p>Text only</p></Modal>);
    fireEvent.mouseDown(container.querySelector('.modal-backdrop')!);
    expect(closeInfo).toHaveBeenCalledTimes(1);
    unmount();
    const closeForm = vi.fn();
    const r = render(<Modal title="Frequencies" onClose={closeForm}><input aria-label="Search" /></Modal>);
    act(() => {
      fireEvent.mouseDown(r.container.querySelector('.modal-backdrop')!);
    });
    expect(closeForm).not.toHaveBeenCalled();
    expect(r.container.querySelector('.modal')!.className).toMatch(/modal-nudge/);
    // Escape still closes it.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closeForm).toHaveBeenCalledTimes(1);
  });
});
