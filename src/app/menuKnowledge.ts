// What the Socius assistant knows about the menus: generated at run time from the real menu model
// (menus.ts, every command whatever is open), so a new command is known as soon as it is in a menu.
// Registered with the assistant's prompt from main.tsx (the prompt lives in src/lib, below the app).
import { setMenuKnowledgeProvider } from '../lib/assistant/prompt';
import { procedures } from '../procedures';
import type { MenuItem } from '../ui/Menu';
import { allMenus, type TopMenu } from './menus';
import { modKey } from './shortcuts';

/** A few words after some items, where the label alone does not say enough (keyed by menu item id). */
const HINTS: Record<string, string> = {
  open: 'SPSS .sav/.zsav, CSV, Excel',
  recent: 'projects kept in this browser',
  'd-define': 'scan values, label them, mark missing codes, set the measurement level',
  'd-select': 'filter',
  'v-vars': 'variable labels, value labels, missing values, measure',
  'v-theme': 'light or dark',
  'ai-settings': 'the only place to set up AI help',
  'h-errorlog': 'problems Socius noticed, to copy into a report',
  close: 'clears the saved session in this browser',
};

const procIds = new Set(procedures.map((p) => p.id));

function itemText(it: MenuItem): string {
  const extras: string[] = [];
  if (procIds.has(it.id)) extras.push(`[${it.id}]`);
  if (it.shortcut) extras.push(`(${it.shortcut})`);
  if (HINTS[it.id]) extras.push(`(${HINTS[it.id]})`);
  const head = [it.label, ...extras].join(' ');
  if (!it.children?.length) return head;
  return `${head} > ${it.children.map(itemText).join(', ')}`;
}

/** One line per menu: "- File: New dataset; Open data file... (Ctrl+O) (...); Save data as > SPSS data (.sav), ...". */
export function menuKnowledgeText(menus: TopMenu[] = allMenus()): string {
  const mod = modKey();
  const lines = menus.map((m) => {
    const list = m.items.map(itemText).join('; ');
    return `- ${m.label}: ${list}${list.endsWith('.') ? '' : '.'}`;
  });
  return [
    '## Socius menus (current version, generated from the app; analysis id in [brackets] for run_analysis)',
    ...lines,
    `- Top bar (not menus): Home (the Socius logo) shows the start screen (open a file, recent projects, the sample survey, Getting started); Search (${mod}+K or /) finds any command, variable, result or help topic; the AI chip; Feedback; Undo and Redo icons; the theme icon; weight and filter chips on the dataset bar.`,
    '- Output tab: every result has SPSS-style tables, an interpretation, an APA sentence and SPSS syntax; buttons copy a table or the APA sentence; File > Export output report (or the Output toolbar\'s Export report) saves all results as Word, a web page, Excel or plain text. A switch shows tables in APA or SPSS style.',
    'Socius follows SPSS: user-missing codes are excluded, listwise deletion per analysis, frequency weights (WEIGHT BY) apply to all counts and statistics, and a filter (FILTER BY) leaves unselected cases out. Data never leaves the computer except what this assistant sends to the AI service.',
  ].join('\n');
}

/** Give the assistant's prompt the live menu knowledge (called once from main.tsx). */
export function registerMenuKnowledge(): void {
  setMenuKnowledgeProvider(() => menuKnowledgeText());
}
