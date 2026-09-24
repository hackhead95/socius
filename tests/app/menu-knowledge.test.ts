// @vitest-environment jsdom
// The Socius assistant's knowledge of the menus is generated from the real menu model, so every
// command (including new ones) is in its system prompt, with the analysis ids run_analysis needs.
import { afterEach, describe, expect, it } from 'vitest';
import { allMenus, type TopMenu } from '../../src/app/menus';
import { menuKnowledgeText, registerMenuKnowledge } from '../../src/app/menuKnowledge';
import { setMenuKnowledgeProvider, systemPrompt } from '../../src/lib/assistant/prompt';
import { DEFAULT_PERMISSIONS } from '../../src/lib/assistant/types';
import { emptyCodingProject } from '../../src/core/coding-types';
import { procedures } from '../../src/procedures';
import type { MenuItem } from '../../src/ui/Menu';

function prompt(): string {
  return systemPrompt({ snapshot: { dataset: null, outputs: [], coding: emptyCodingProject(), tab: 'data' }, permissions: DEFAULT_PERMISSIONS });
}

function leaves(items: MenuItem[]): MenuItem[] {
  return items.flatMap((it) => (it.children?.length ? leaves(it.children) : [it]));
}

afterEach(() => setMenuKnowledgeProvider(null));

describe('assistant menu knowledge', () => {
  it('names every menu and every top-level menu item, from the live menu model', () => {
    registerMenuKnowledge();
    const text = prompt();
    const menus: TopMenu[] = allMenus();
    expect(menus.length).toBeGreaterThanOrEqual(10);
    for (const m of menus) {
      expect(text, m.label).toContain(`- ${m.label}: `);
      for (const it of m.items) expect(text, `${m.label} > ${it.label}`).toContain(it.label);
    }
  });

  it('includes every command in submenus too, and the analysis ids', () => {
    registerMenuKnowledge();
    const text = prompt();
    for (const m of allMenus()) for (const it of leaves(m.items)) expect(text, `${m.label}: ${it.label}`).toContain(it.label);
    for (const p of procedures) expect(text, p.id).toContain(`${p.title}... [${p.id}]`);
  });

  it('knows the commands the old static list missed', () => {
    registerMenuKnowledge();
    const text = prompt();
    for (const label of ['Define variable properties...', 'Error log...', 'Export output report', 'Load sample interviews...', 'Close data and start fresh...', 'Recent projects...', 'Go to case...', 'Clear output...', 'Variable list']) {
      expect(text, label).toContain(label);
    }
    expect(text).toMatch(/Home \(the Socius logo\)/);
    // One home for AI set-up, as in the menus.
    expect(text).toMatch(/- AI: .*AI assistant settings\.\.\. \(the only place to set up AI help\)/);
    expect(text).not.toMatch(/Help: [^\n]*AI assistant settings/);
  });

  it('follows the menu model: a new command appears without touching the prompt', () => {
    const menus = allMenus();
    menus.find((m) => m.id === 'help')!.items.push({ id: 'h-new', label: 'Brand new command...' });
    setMenuKnowledgeProvider(() => menuKnowledgeText(menus));
    expect(prompt()).toContain('Brand new command...');
  });

  it('still lists the analyses and Text coding when the app has not registered the menus', () => {
    setMenuKnowledgeProvider(null);
    const text = prompt();
    for (const p of procedures) expect(text).toContain(`(${p.id})`);
    expect(text).toContain('- Text coding: ');
  });
});
