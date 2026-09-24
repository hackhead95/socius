// @vitest-environment jsdom
// Regression tests for the Text coding bugs from the QA crawl (docs/qa/UI-BUGS.md):
// UI-002, UI-008, UI-015, UI-016, UI-018, UI-019, UI-023, UI-029 and UI-030.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useStore } from '../../src/core/store';
import { emptyCodingProject, type TextDoc } from '../../src/core/coding-types';
import type { Dataset } from '../../src/core/types';
import { importFile } from '../../src/lib/io';
import { SAMPLE_SURVEY_FILE } from '../../src/samples';
import { addCoder, addDocs, createCode, setWholeResponseCode } from '../../src/features/coding/actions';
import { useCodingUi } from '../../src/features/coding/uiStore';
import { CodingWorkspace } from '../../src/features/coding/CodingWorkspace';
import { AnalyseView } from '../../src/features/coding/AnalyseView';
import { CodebookPanel } from '../../src/features/coding/CodebookPanel';
import { MemosView } from '../../src/features/coding/MemosView';
import { MenuButton, placeMenu } from '../../src/features/coding/ui';
import { CodingDialog } from '../../src/features/coding/CodingDialog';
import { workedExampleGuide, UNDO_CODING_LABEL, NOT_CODED_FILTER_LABEL } from '../../src/features/coding/exampleGuide';
import { codingMenuItems } from '../../src/features/coding/menu';
import { buildWorkedExample, describeCodebookSize } from '../../src/lib/coding/example';
import { allMenus } from '../../src/app/menus';
import { formatDateTime } from '../../src/core/format-date';

const SAV = join(process.cwd(), 'src/samples/urban_trust_survey.sav');
let sample: Dataset;

beforeAll(async () => {
  const { dataset } = await importFile(SAMPLE_SURVEY_FILE, new Uint8Array(readFileSync(SAV)));
  sample = { ...dataset, source: { ...dataset.source, kind: 'sample', fileName: SAMPLE_SURVEY_FILE } };
  // jsdom has no layout APIs the workspace touches.
  (globalThis as any).ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= function () {};
});

beforeEach(() => {
  useStore.setState({ dataset: null, toasts: [], tab: 'coding' });
  useStore.getState().setCoding(emptyCodingProject());
  useCodingUi.setState({ view: 'documents', viewPicked: false, activeDocId: null, history: [], future: [], dialog: null, exampleNote: null, analyseTab: 'frequencies', showAllCoders: true });
});
afterEach(cleanup);

const responses = (n: number): TextDoc[] => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, name: `R${i}`, kind: 'response', text: i % 2 ? 'water and roads' : 'safety', createdAt: i }));

describe('UI-002: the Documents tab in a responses-only project', () => {
  it('opens on the first visit to Responses, but stays on Documents once the tab is clicked', () => {
    addDocs(responses(4));
    render(<CodingWorkspace />);
    // Default view: an empty Documents view gives way to Responses.
    expect(useCodingUi.getState().view).toBe('responses');
    fireEvent.click(screen.getByRole('tab', { name: /^Documents/ }));
    expect(useCodingUi.getState().view).toBe('documents');
    expect(screen.getByRole('tab', { name: /^Documents/ }).getAttribute('aria-selected')).toBe('true');
    const center = screen.getByRole('main', { name: 'Coding area' });
    expect(center.textContent).toContain('No documents yet');
    expect(within(center).getByRole('button', { name: 'Import documents...' })).toBeTruthy();
    fireEvent.click(within(center).getByRole('button', { name: 'Go to Responses' }));
    expect(useCodingUi.getState().view).toBe('responses');
  });
});

describe('UI-008: dropdowns stay on screen', () => {
  const vp = { width: 1024, height: 768 };
  it('right-aligns when there is room on the left', () => {
    const p = placeMenu({ left: 700, right: 800, top: 100, bottom: 130 }, { width: 260, height: 200 }, vp);
    expect(700 + p.left + 260).toBe(800);
    expect(p.up).toBe(false);
  });
  it('left-aligns a button near the left edge instead of opening off-screen (the old x = -113)', () => {
    const anchor = { left: 40, right: 147, top: 100, bottom: 130 };
    const p = placeMenu(anchor, { width: 260, height: 200 }, vp);
    expect(anchor.left + p.left).toBe(40);
  });
  it('shifts a menu that fits neither way and never goes past either edge', () => {
    const phone = { width: 400, height: 800 };
    for (const left of [0, 60, 150, 250, 330]) {
      const anchor = { left, right: left + 60, top: 100, bottom: 130 };
      const p = placeMenu(anchor, { width: 340, height: 200 }, phone);
      const x = anchor.left + p.left;
      expect(x).toBeGreaterThanOrEqual(8);
      expect(x + 340).toBeLessThanOrEqual(400 - 8);
    }
  });
  it('opens upwards when there is no room below, and limits the height to the screen', () => {
    const p = placeMenu({ left: 700, right: 800, top: 700, bottom: 730 }, { width: 260, height: 300 }, vp);
    expect(p.up).toBe(true);
    expect(p.maxHeight).toBeLessThanOrEqual(700);
  });
});

describe('UI-016: disabled menu items say why', () => {
  it('puts the reason on a disabled item as its tooltip', () => {
    render(<MenuButton label="Coder" items={[{ label: 'Coder 1 (coding now)', disabled: true, disabledReason: 'You are already coding as Coder 1.', onSelect: () => {} }, { label: 'Code as Priya', onSelect: () => {} }]} />);
    fireEvent.click(screen.getByRole('button', { name: /Coder/ }));
    const item = screen.getByRole('menuitem', { name: 'Coder 1 (coding now)' }) as HTMLButtonElement;
    expect(item.disabled).toBe(true);
    expect(item.title).toBe('You are already coding as Coder 1.');
    expect((screen.getByRole('menuitem', { name: 'Code as Priya' }) as HTMLButtonElement).title).toBe('');
  });

  it('every disabled item of the coding toolbar menus has a reason', () => {
    addDocs(responses(2));
    addCoder('Priya');
    render(<CodingWorkspace />);
    const toolbar = document.querySelector('.cw-toolbar') as HTMLElement;
    for (const trigger of Array.from(toolbar.querySelectorAll<HTMLButtonElement>('.cw-menu-trigger:not(:disabled)'))) {
      fireEvent.click(trigger);
      const list = toolbar.querySelector('.cw-menu-list');
      for (const b of Array.from(list?.querySelectorAll<HTMLButtonElement>('button:disabled') ?? [])) expect(b.title, `${trigger.textContent} > ${b.textContent}`).toMatch(/\w{4}/);
      fireEvent.keyDown(list!, { key: 'Escape' });
    }
    fireEvent.click(screen.getByRole('button', { name: /Coder:/ }));
    expect((screen.getByRole('menuitem', { name: 'Coder 1 (coding now)' }) as HTMLButtonElement).title).toMatch(/already coding as Coder 1/);
  });
});

describe('UI-015: Auto-code shows the full code name on hover', () => {
  it('gives each code in the list a tooltip', () => {
    addDocs(responses(2));
    const long = createCode('Infrastructure, services and the everyday maintenance of shared spaces');
    render(<CodingDialog id="auto-code" onClose={() => {}} />);
    const name = screen.getAllByText(long.name).find((el) => el.classList.contains('cw-codename-text'))!;
    expect(name.getAttribute('title')).toBe(long.name);
  });
});

describe('UI-023: the view tabs show that they scroll', () => {
  it('marks the side with more tabs when the row is wider than the screen', () => {
    const sw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
    const cw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => 640 });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 360 });
    try {
      render(<CodingWorkspace />);
      const wrap = document.querySelector('.cw-viewtabs-wrap')!;
      expect(wrap.className).toContain('more-right');
      expect(wrap.className).not.toContain('more-left');
      const tabs = wrap.querySelector('.cw-viewtabs') as HTMLElement;
      act(() => {
        tabs.scrollLeft = 280;
        tabs.dispatchEvent(new Event('scroll'));
      });
      expect(wrap.className).toContain('more-left');
      expect(wrap.className).not.toContain('more-right');
    } finally {
      if (sw) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', sw);
      if (cw) Object.defineProperty(HTMLElement.prototype, 'clientWidth', cw);
    }
  });

  it('the Reliability tab says it needs two coders while there is one', () => {
    render(<CodingWorkspace />);
    const tab = screen.getByRole('tab', { name: /Reliability/ });
    expect(tab.textContent).toContain('needs 2 coders');
    expect(tab.title).toMatch(/second coder/);
  });
});

describe('UI-019: Code frequencies shows theme totals', () => {
  it('shows a theme with the total of its sub-codes, not 0 / 0.0%', () => {
    addDocs(responses(4));
    const theme = createCode('Infrastructure and services');
    const water = createCode('Water supply', theme.id);
    const roads = createCode('Roads', theme.id);
    setWholeResponseCode(['r0', 'r1'], water.id);
    setWholeResponseCode(['r1', 'r2'], roads.id);
    render(<AnalyseView />);
    const row = screen.getByText('Infrastructure and services').closest('tr')!;
    expect(row.className).toContain('cw-ftheme');
    expect(row.textContent).toContain('theme total');
    const nums = Array.from(row.querySelectorAll('td.num')).map((td) => td.textContent);
    expect(nums).toEqual(['4', '3', '75.0%']); // 4 segments; 3 of 4 responses (r1 counts once)
    expect(screen.queryByText('Incl. sub-codes')).toBeNull();
  });
});

describe('Codebook panel counts match Code frequencies', () => {
  it('shows a theme with its sub-codes included, not 0 · 0', () => {
    addDocs(responses(4));
    const theme = createCode('Infrastructure and services');
    const water = createCode('Water supply', theme.id);
    const roads = createCode('Roads', theme.id);
    setWholeResponseCode(['r0', 'r1'], water.id);
    setWholeResponseCode(['r1', 'r2'], roads.id);
    render(<CodebookPanel />);
    const row = screen.getByText('Infrastructure and services').closest('[role="treeitem"]')!;
    const count = row.querySelector('.cw-codecount')!;
    expect(count.textContent).toBe('4 · 3');
    expect(count.getAttribute('title')).toMatch(/including sub-codes \(0 coded to this theme itself\)/);
    const leaf = screen.getByText('Water supply').closest('[role="treeitem"]')!.querySelector('.cw-codecount')!;
    expect(leaf.textContent).toBe('2 · 2');
  });
});

describe('UI-018 / UI-029: the worked example is short in the toast and matches the app', () => {
  it('names real menu items, and counts codes the way the codebook does', () => {
    const g = workedExampleGuide();
    const menus = allMenus();
    const paths = new Set<string>();
    const walk = (items: any[], prefix: string) => {
      for (const it of items) {
        if (!it) continue;
        paths.add(`${prefix} > ${it.label}`);
        if (it.children) walk(it.children, `${prefix} > ${it.label}`);
      }
    };
    for (const m of menus) walk(m.items, m.label);
    expect(paths).toContain(g.codesByAttribute);
    expect(paths).toContain(g.exportCodes);
    expect(paths).toContain(g.crosstabs);
    expect(codingMenuItems.some((c) => `Text coding > ${c.label}` === g.exportCodes)).toBe(true);
    expect(g.undo).toBe(UNDO_CODING_LABEL);
    expect(g.notCodedFilter).toBe(NOT_CODED_FILTER_LABEL);

    const ex = buildWorkedExample(sample, 'Coder 1', null, g);
    expect(ex.memo.text).toContain(`${ex.codes.length} codes`);
    expect(ex.memo.text).toContain(describeCodebookSize(ex.codes));
    for (const v of Object.values(g)) expect(ex.memo.text).toContain(v);
    expect(ex.memo.text).not.toMatch(/Codes to dataset variables|11 starter codes|\u2014/);
  });

  it('loads with a short toast; the next steps are in the note, which stays', () => {
    useStore.setState({ dataset: sample });
    render(<CodingWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /Explore a worked example/ }));
    const toasts = useStore.getState().toasts.map((t) => t.text);
    const t = toasts.find((x) => x.startsWith('Example loaded'))!;
    expect(t.split(/\s+/).length).toBeLessThan(30);
    const n = useStore.getState().coding.codes.length;
    expect(t).toContain(`${n} codes`);
    // The codebook panel shows the same number.
    expect(document.querySelector('.cw-codebook .cw-panel-head .badge')!.textContent).toBe(String(n));
    const note = document.querySelector('.cw-example-note')!;
    const g = workedExampleGuide();
    for (const v of [g.codesByAttribute, g.exportCodes, g.crosstabs, g.undo]) expect(note.textContent).toContain(v);
    expect(screen.getByRole('button', { name: UNDO_CODING_LABEL })).toBeTruthy();
  });
});

describe('UI-030: memo dates use the shared format', () => {
  it('shows the same date and time in the memo list and the footer', () => {
    const at = Date.UTC(2026, 8, 24, 13, 58, 18);
    useStore.getState().setCoding({ ...emptyCodingProject(), memos: [{ id: 'm1', title: 'Idea', text: 'x', createdAt: at, updatedAt: at }] });
    render(<MemosView />);
    const want = formatDateTime(at);
    expect(document.querySelector('.cw-memo-item .cw-docmeta')!.textContent).toContain(want);
    expect(screen.getByText(/last edited/).textContent).toContain(want);
    expect(document.body.textContent).not.toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|:\d{2}:\d{2}/);
  });
});


describe('UI-014 (co-occurrence part): heat map cells keep readable text', () => {
  it('caps the accent share at 70% and marks strong cells for the per-theme text colour', async () => {
    const { heatPct } = await import('../../src/features/coding/AnalyseView');
    expect(heatPct(0, 10)).toBe(10);
    expect(heatPct(10, 10)).toBe(70);
    expect(heatPct(5, 0)).toBe(10);
    const css = readFileSync(join(process.cwd(), 'src/features/coding/coding.css'), 'utf8');
    expect(css).toMatch(/:root\[data-theme='dark'\] \.cw-heat-strong \{ color: var\(--accent-text\); \}/);
    expect(css).toMatch(/\.cw-heat td \{ color: var\(--text\); \}/);
  });
});
