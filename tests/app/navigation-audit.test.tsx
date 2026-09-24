// @vitest-environment jsdom
// Navigation audit: the rules in docs/NAVIGATION.md, checked against the real menu model (useMenus,
// which includes the Text coding menu built from codingMenuItems) and the search palette.
//
// Every menu item is run with its effects recorded instead of performed (dialog requests, tab
// switches, file actions, links, AI calls, store and UI calls). That gives each item a behavioural
// signature, so two items that do the same thing are caught even if their labels differ.
//
// Repeat the diagnostic at any time: `npx vitest run tests/app/navigation-audit.test.ts`.
// Write the whole model to a file with NAV_SNAPSHOT=/path/file.json.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, renderHook } from '@testing-library/react';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rec = vi.hoisted(() => ({ calls: [] as string[] }));

vi.mock('../../src/features/project/fileActions', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/features/project/fileActions')>();
  const wrap = (name: string) => async (...args: unknown[]) => {
    rec.calls.push(`file.${name}(${JSON.stringify(args)})`);
  };
  return {
    ...real,
    newDataset: wrap('newDataset'),
    openDataFile: wrap('openDataFile'),
    openProjectFile: wrap('openProjectFile'),
    saveProject: wrap('saveProject'),
    loadSample: wrap('loadSample'),
    exportSavFile: wrap('exportSavFile'),
    exportCsvFile: wrap('exportCsvFile'),
    exportXlsxFile: wrap('exportXlsxFile'),
    exportCodebook: wrap('exportCodebook'),
    startFresh: wrap('startFresh'),
  };
});
vi.mock('../../src/app/links', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/app/links')>();
  return { ...real, openExternal: (url: string) => rec.calls.push(`url(${url === real.GUIDE_URL ? 'GUIDE_URL' : url === real.FEEDBACK_URL ? 'FEEDBACK_URL' : url})`) };
});
vi.mock('../../src/features/ai/hooks', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/features/ai/hooks')>();
  return { ...real, openAiSettings: (intent?: unknown) => rec.calls.push(`aiSettings(${typeof intent === 'string' ? intent : ''})`) };
});
vi.mock('../../src/features/ai/features', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/features/ai/features')>();
  return { ...real, runAiFeature: async (id: string) => { rec.calls.push(`ai(${id})`); } };
});
vi.mock('../../src/features/output/actions', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/features/output/actions')>();
  return {
    ...real,
    exportAllOutput: async (f: string) => { rec.calls.push(`exportOutput(${f})`); },
    confirmAndClearOutputs: async () => { rec.calls.push('confirm(Clear all output?)'); },
  };
});
vi.mock('../../src/features/transform/common', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/features/transform/common')>();
  return { ...real, turnFilterOff: () => rec.calls.push('turnFilterOff()'), turnWeightOff: () => rec.calls.push('turnWeightOff()') };
});

import { useStore } from '../../src/core/store';
import { makeDataset, makeVariable } from '../../src/core/types';
import { procedures } from '../../src/procedures';
import { useMenus, type TopMenu } from '../../src/app/menus';
import { useUi } from '../../src/app/ui-store';
import { handleGlobalKey } from '../../src/app/shortcuts';
import { ShortcutsDialog } from '../../src/app/HelpDialogs';
import { codingMenuItems } from '../../src/features/coding/menu';
import { AI_FEATURES } from '../../src/features/ai/features';
import { isAssistantShortcut } from '../../src/features/assistant/AssistantRoot';
import { cleanLabel, commandsFromMenus, searchEntries, type CommandEntry } from '../../src/app/search';
import type { MenuItem } from '../../src/ui/Menu';
import beforeFixture from './navigation-before.json';

// ---------- building the model ----------

function richDataset() {
  const w = makeVariable({ name: 'wt', label: 'Weight' });
  const f = makeVariable({ name: 'filter_$', label: 'Filter' });
  const g = makeVariable({ name: 'gender', label: 'Gender', valueLabels: [{ value: 1, label: 'Man' }] });
  return makeDataset({
    name: 'Survey',
    variables: [w, f, g],
    columns: { [w.id]: new Float64Array([1, 1]), [f.id]: new Float64Array([1, 0]), [g.id]: new Float64Array([1, 1]) },
    nCases: 2,
    weightVarId: w.id,
    filterVarId: f.id,
  });
}

/** Everything present, so every conditional item shows: data with cases, filter and weight on, output, undo and redo. */
function setRichState() {
  const ds = richDataset();
  useStore.setState({ dataset: ds, past: [ds], future: [ds], outputs: [{ id: 'o1', title: 'Frequencies', createdAt: 0, blocks: [] } as never], tab: 'output', dialog: null });
}

/** Nothing open: a first visit. */
function setEmptyState() {
  useStore.setState({ dataset: null, past: [], future: [], outputs: [], tab: 'data', dialog: null });
}

function buildMenus(): TopMenu[] {
  const { result, unmount } = renderHook(() => useMenus());
  const menus = result.current;
  unmount();
  return menus;
}

interface Node {
  /** Menu path of the parent, e.g. ["Analyze", "Descriptive Statistics"]. */
  path: string[];
  item: MenuItem;
  leaf: boolean;
}

function nodes(menus: TopMenu[]): Node[] {
  const out: Node[] = [];
  const walk = (items: MenuItem[], path: string[]) => {
    for (const it of items) {
      out.push({ path, item: it, leaf: !it.children });
      if (it.children) walk(it.children, [...path, it.label]);
    }
  };
  for (const m of menus) walk(m.items, [m.label]);
  return out;
}

const stripDots = (s: string) => s.replace(/\s*(\.\.\.|…)\s*$/, '');
const pathOf = (n: { path: string[]; item: { label: string } }) => [...n.path.map(stripDots), stripDots(n.item.label)].join(' > ');
/** Label comparison ignores case, punctuation and the trailing "..." that means "opens a dialog". */
const normLabel = (s: string) => stripDots(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Run an item with every effect recorded instead of performed. */
async function signature(run: () => void): Promise<string> {
  rec.calls = [];
  const r = (name: string) => (...args: unknown[]) => {
    rec.calls.push(`${name}(${JSON.stringify(args)})`);
  };
  const saved = { store: { ...useStore.getState() }, ui: { ...useUi.getState() } };
  useStore.setState({ openDialog: r('openDialog'), setTab: r('setTab'), undo: r('undo'), redo: r('redo'), clearOutputs: r('clearOutputs'), setShowValueLabels: r('setShowValueLabels') });
  useUi.setState({
    setTheme: r('setTheme'), setSidebarOpen: r('setSidebarOpen'), requestFind: r('requestFind'), requestGoto: r('requestGoto'), setPaletteOpen: r('setPaletteOpen'),
    confirm: async (o: { title: string }) => { rec.calls.push(`confirm(${o.title})`); return false; },
  });
  try {
    run();
    await Promise.resolve();
    await Promise.resolve();
  } finally {
    useStore.setState(saved.store);
    useUi.setState(saved.ui);
  }
  return rec.calls.join(' ');
}

/**
 * What an item does, as one command: a Text coding item's tab switch is part of opening its dialog,
 * and the coding AI dialogs and the coding "AI assistant settings" entry are the AI features.
 */
function concept(sig: string): string {
  let s = sig.replace(/^setTab\(\["coding"\]\) (?=openDialog)/, '');
  const coding = (id: string) => `openDialog([{"kind":"coding","id":"${id}"}])`;
  s = s.replace(coding('ai-codebook'), 'ai(codebook)').replace(coding('ai-suggest'), 'ai(suggest)').replace(coding('ai-settings'), 'aiSettings()');
  return s;
}

interface Row {
  path: string;
  label: string;
  signature: string;
  shortcut?: string;
}

async function rows(): Promise<Row[]> {
  setRichState();
  const out: Row[] = [];
  for (const n of nodes(buildMenus())) {
    if (!n.leaf) continue;
    out.push({ path: pathOf(n), label: n.item.label, signature: await signature(() => n.item.onSelect?.()), shortcut: n.item.shortcut });
  }
  return out;
}

function duplicateGroups<T>(list: T[], key: (x: T) => string): T[][] {
  const m = new Map<string, T[]>();
  for (const x of list) {
    const k = key(x);
    m.set(k, [...(m.get(k) ?? []), x]);
  }
  return [...m.values()].filter((g) => g.length > 1);
}

/**
 * Same label in two places, allowed with a reason. Empty: every label is unique.
 * (Keys are normalised labels, see normLabel.)
 */
const LABEL_ALLOW: Record<string, string> = {};

/** Items removed as duplicates, and the one home that remains for each (docs/NAVIGATION.md). */
const MOVED: Record<string, string> = {
  'Help > AI assistant settings': 'AI > AI assistant settings',
  'Text coding > AI assistant settings': 'AI > AI assistant settings',
  'Text coding > Suggest a codebook with AI': 'AI > Suggest a codebook',
  'Text coding > Suggest codes for responses with AI': 'AI > Suggest codes for open-ended answers',
  'Text coding > Open coding workspace': 'View > Text coding',
  'Data > Define variable properties': 'View > Variable View',
};

const before = beforeFixture.menus as Row[];

beforeEach(() => {
  rec.calls = [];
});
afterEach(() => {
  cleanup();
  setEmptyState();
});

if (process.env.NAV_SNAPSHOT) {
  it('writes the navigation snapshot', async () => {
    writeFileSync(process.env.NAV_SNAPSHOT!, JSON.stringify({ menus: await rows(), codingMenuItems }, null, 2));
  });
}

describe('one home per command', () => {
  it('(a) no two menu items have the same label', () => {
    setRichState();
    const items = nodes(buildMenus());
    const dups = duplicateGroups(items, (n) => normLabel(n.item.label)).filter((g) => !LABEL_ALLOW[normLabel(g[0].item.label)]);
    expect(dups.map((g) => g.map(pathOf))).toEqual([]);
  });

  it('(b) no two menu items do the same thing', async () => {
    const r = await rows();
    for (const x of r) expect(x.signature, `${x.path} does nothing`).not.toBe('');
    const dups = duplicateGroups(r, (x) => concept(x.signature));
    expect(dups.map((g) => g.map((x) => x.path))).toEqual([]);
  });

  it('(c) every procedure appears exactly once, in Analyze or Graphs', async () => {
    const r = await rows();
    for (const p of procedures) {
      const hits = r.filter((x) => x.signature === `openDialog([{"kind":"procedure","id":"${p.id}"}])`);
      expect(hits.map((h) => h.path), p.id).toHaveLength(1);
      expect(hits[0].path.startsWith(p.menu === 'Graphs' ? 'Graphs > ' : 'Analyze > '), hits[0].path).toBe(true);
      expect(hits[0].label).toBe(`${p.title}...`);
    }
  });

  it('(d) every disabled item says why, on a first visit and with data', () => {
    for (const set of [setEmptyState, setRichState]) {
      set();
      for (const n of nodes(buildMenus())) {
        if (n.item.disabled) expect(n.item.title?.trim(), `${pathOf(n)} is disabled without a reason`).toBeTruthy();
      }
    }
  });

  it('AI features and AI assistant settings live only in the AI menu, with settings last', async () => {
    const r = await rows();
    const ai = r.filter((x) => /^(ai\(|aiSettings\()/.test(concept(x.signature)));
    expect(ai.map((x) => x.path.split(' > ')[0])).toEqual(AI_FEATURES.map(() => 'AI').concat('AI'));
    const aiMenu = r.filter((x) => x.path.startsWith('AI > '));
    expect(aiMenu[aiMenu.length - 1].label).toBe('AI assistant settings...');
    for (const x of r.filter((y) => /^(Help|Text coding) > /.test(y.path))) expect(x.label, x.path).not.toMatch(/\bAI\b/);
    expect(codingMenuItems.filter((c) => /^ai-|^workspace$/.test(c.id))).toEqual([]);
  });

  it('all menus mark "opens a dialog" the same way ("...")', () => {
    setRichState();
    for (const n of nodes(buildMenus())) expect(n.item.label, pathOf(n)).not.toContain('…');
  });
});

describe('nothing became unreachable', () => {
  it('the audit catches the duplicates that were there before the clean-up', () => {
    const dups = duplicateGroups(before, (x) => concept(x.signature)).map((g) => g.map((x) => x.path).sort());
    expect(dups.sort()).toEqual(
      [
        ['Data > Define variable properties', 'View > Variable View'],
        ['View > Text coding', 'Text coding > Open coding workspace'].sort(),
        ['AI > Suggest a codebook', 'Text coding > Suggest a codebook with AI'],
        ['AI > Suggest codes for open-ended answers', 'Text coding > Suggest codes for responses with AI'],
        ['AI > AI assistant settings', 'Help > AI assistant settings', 'Text coding > AI assistant settings'],
      ].sort(),
    );
  });

  it('every action that existed before has exactly one menu home now', async () => {
    const after = await rows();
    const mapping: Array<[string, string]> = [];
    for (const b of before) {
      const home = MOVED[b.path] ?? b.path;
      const at = after.filter((a) => a.path === home);
      expect(at.map((a) => a.path), `${b.path} -> ${home}`).toHaveLength(1);
      expect(concept(at[0].signature), `${b.path} -> ${home}`).toBe(concept(b.signature));
      expect(after.filter((a) => concept(a.signature) === concept(b.signature)), b.path).toHaveLength(1);
      mapping.push([b.path, home]);
    }
    // Nothing new was added by the consolidation. Commands added deliberately since then are listed
    // here with their reason, so the list stays a conscious decision.
    const ADDED: Record<string, string> = {
      'File > Export output report > Word document (.docx)': 'The report export had no menu home (only the Output toolbar button).',
      'File > Export output report > Web page (.html)': 'Same.',
      'File > Export output report > Excel workbook (.xlsx)': 'Same.',
      'File > Export output report > Plain text (.txt)': 'Same.',
    };
    const known = new Set(mapping.map(([, h]) => h));
    expect(after.filter((a) => !known.has(a.path) && !(a.path in ADDED)).map((a) => a.path)).toEqual([]);
    // The removed items are exactly the ones listed in MOVED.
    expect(before.filter((b) => !after.some((a) => a.path === b.path)).map((b) => b.path).sort()).toEqual(Object.keys(MOVED).sort());
  });
});

describe('search palette', () => {
  function commands(): CommandEntry[] {
    setRichState();
    return commandsFromMenus(buildMenus(), Object.fromEntries(procedures.map((p) => [p.id, p.description])));
  }

  it('shows one row per command, whatever synonyms match', async () => {
    const c = commands();
    const sig = new Map<CommandEntry, string>();
    for (const e of c) sig.set(e, concept(await signature(() => e.item.onSelect?.())));
    for (const q of ['ai settings', 'ai assistant settings', 'settings', 'gemini key', 'api key', 'set up ai', 'suggest a codebook', 'suggest codes', 'codebook', 'explain', 'variable properties', 'coding workspace', 'value labels', 'import', 'export', 'theme', 'feedback']) {
      const found = searchEntries(q, c, { commands: 50 }).flatMap((g) => g.items);
      expect(duplicateGroups(found, (e) => sig.get(e)!).map((g) => g.map((e) => e.detail + ' > ' + e.title)), q).toEqual([]);
    }
  });

  it('finds the one home of a removed item by its old words', () => {
    const c = commands();
    const top = (q: string) => searchEntries(q, c)[0]?.items[0];
    for (const q of ['ai settings', 'AI assistant settings', 'gemini key', 'api key', 'set up ai']) expect([top(q)?.detail, top(q)?.title], q).toEqual(['AI', 'AI assistant settings']);
    expect([top('define variable properties')?.detail, top('define variable properties')?.title]).toEqual(['View', 'Variable View']);
    expect([top('open coding workspace')?.detail, top('open coding workspace')?.title]).toEqual(['View', 'Text coding']);
    expect([top('suggest a codebook')?.detail, top('suggest a codebook')?.title]).toEqual(['AI', 'Suggest a codebook']);
  });
});

describe('contextual shortcuts use the menu wording', () => {
  it('the AI chip, the AI settings dialog and the coding toolbar name AI features like the AI menu', () => {
    for (const f of AI_FEATURES) expect(f.label).toBe(cleanLabel(f.menuLabel));
  });

  it('every contextual set-up prompt says "Set up AI", and no text points to the removed places', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(f)) files.push(p);
      }
    };
    walk(join(__dirname, '../../src'));
    const banned = [/Set up free AI/, /Set up AI help/, /Open AI assistant settings/, />AI settings</, /Help > AI assistant settings/, /Help &gt; AI assistant settings/, /Text coding > Suggest/, /Text coding > AI/, /Open coding workspace/, /Define variable properties/];
    const hits: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      for (const b of banned) if (b.test(text) && !f.endsWith('search.ts')) hits.push(`${f.replace(/.*\/src\//, 'src/')}: ${b}`);
    }
    expect(hits).toEqual([]);
  });
});

describe('keyboard shortcuts', () => {
  it('no two menu items show the same shortcut', async () => {
    const r = (await rows()).filter((x) => x.shortcut);
    expect(duplicateGroups(r, (x) => x.shortcut!).map((g) => g.map((x) => x.path))).toEqual([]);
  });

  it('every shortcut shown in a menu does what the menu item does, and Help > Keyboard shortcuts lists it', async () => {
    const r = (await rows()).filter((x) => x.shortcut);
    expect(r.length).toBeGreaterThan(4);
    const { container } = render(<ShortcutsDialog onClose={() => undefined} />);
    const keys = Array.from(container.querySelectorAll('kbd')).map((k) => k.textContent);
    cleanup(); // the dialog is a modal, and global shortcuts pause while a modal is open
    for (const x of r) {
      expect(keys, `${x.path} (${x.shortcut}) is not in Help > Keyboard shortcuts`).toContain(x.shortcut);
      const key = x.shortcut!.split('+').pop()!.toLowerCase();
      const ev = { key, ctrlKey: true, metaKey: false, altKey: false, shiftKey: false };
      if (key === 'j') {
        expect(isAssistantShortcut(ev), x.path).toBe(true);
        continue;
      }
      setRichState();
      useStore.setState({ tab: 'data' });
      const got = await signature(() => handleGlobalKey(new KeyboardEvent('keydown', { ...ev, cancelable: true })));
      expect(got, `${x.shortcut} does nothing`).not.toBe('');
      for (const call of got.split(' ')) expect(x.signature, `${x.shortcut} vs ${x.path}`).toContain(call);
    }
  });
});
