// Command smoke test, Analyze and Graphs: with the sample survey loaded, every procedure in these menus
// (read from the live menubar, so a new one is included automatically) is opened, its required boxes
// are filled with suitable sample variables chosen from the procedure's own slot definitions (types
// and measurement levels), and it is run. Each run must add one Output result with no "NaN",
// "undefined" or "n/a" in it, and nothing may reach the page errors or the error log.
import { expect, test, type Page } from '@playwright/test';
import { openWithSample } from './helpers';
import { BAD_OUTPUT, errorLogErrors, invoke, menuTree, settle, watchErrors } from './commands-smoke-helpers';
import { readFileSync } from 'node:fs';
import { procedures } from '../src/procedures';
import type { ProcedureDef, VarSlot } from '../src/core/procedure';
import { readSav } from '../src/lib/io/sav-reader';
import { isMissingValue } from '../src/core/data';

/** Number of different valid values of each sample variable (read from the bundled .sav). */
const DISTINCT: Map<string, number> = (() => {
  const ds = readSav(new Uint8Array(readFileSync(new URL('../src/samples/urban_trust_survey.sav', import.meta.url)))).dataset;
  const out = new Map<string, number>();
  for (const v of ds.variables) {
    const col = ds.columns[v.id];
    const seen = new Set<string>();
    for (let i = 0; i < ds.nCases; i++) {
      const x = col[i] as number | string;
      if ((typeof x === 'number' && Number.isNaN(x)) || x === '' || isMissingValue(v, x)) continue;
      seen.add(String(x));
    }
    out.set(v.name, seen.size);
  }
  return out;
})();

test.describe.configure({ mode: 'parallel' });

interface DialogVar {
  name: string;
  measure: string;
  isString: boolean;
}

/** Variables as the dialog lists them: name, measurement level and type (from the measure icon). */
async function dialogVars(page: Page): Promise<DialogVar[]> {
  return page.locator('.modal .pd-list .pd-var').evaluateAll((els) =>
    els.map((el) => {
      const name = (el.querySelector('.vl-name')?.textContent ?? el.querySelector('.pd-var-text')?.textContent ?? '').trim().replace(/^\[|\]$/g, '');
      const vi = el.querySelector('.vi');
      const measure = vi ? Array.from(vi.classList).find((c) => c.startsWith('vi-') && c !== 'vi-str')?.slice(3) ?? '' : '';
      return { name, measure, isString: !!el.querySelector('.vi-str') };
    }),
  );
}

/** Identifiers, weights, dates and open text make poor analysis variables. */
const AVOID = /(^|_)id$|^wt$|weight|date|^interviewer$/i;

/**
 * Suitable variables for one slot, best first: the slot's types and measurement levels (in the order
 * the slot lists them); categories with a sensible number of values; exactly two values where the
 * procedure needs two groups or two categories.
 */
function candidates(def: ProcedureDef, slot: VarSlot, vars: DialogVar[], used: Set<string>): DialogVar[] {
  const typeOk = (v: DialogVar) => !slot.types || slot.types.includes(v.isString ? 'string' : 'numeric');
  const text = `${slot.key} ${slot.label}`;
  const grouping = /group|split|factor|colour|separate|sex|cluster|category|slices|layer|rows|columns|dependent \(/i.test(text);
  const pairSlot = def.options.some((o) => o.type === 'groupPair' && o.slot === slot.key);
  const needTwo = pairSlot || /two categories/i.test(slot.label) || (def.id === 'binomial' && slot.key === 'variables');
  let order: string[] = slot.measures?.length ? [...slot.measures] : grouping || needTwo ? ['nominal', 'ordinal', 'scale'] : slot.min >= 2 ? ['ordinal', 'scale', 'nominal'] : ['scale', 'ordinal', 'nominal'];
  order = [...order, ...['scale', 'ordinal', 'nominal'].filter((m) => !order.includes(m))];
  const allowed = new Set(slot.measures?.length ? slot.measures : order);
  const n = (v: DialogVar) => DISTINCT.get(v.name) ?? 0;
  const fits = (v: DialogVar) => {
    if (needTwo) return n(v) === 2;
    if (v.measure === 'scale') return n(v) >= 8;
    // Categories: at least two values, and not so many that a table or chart becomes unreadable.
    return n(v) >= 2 && n(v) <= (grouping ? 8 : 12);
  };
  const pool = vars.filter((v) => typeOk(v) && !v.isString && !AVOID.test(v.name) && !used.has(v.name) && allowed.has(v.measure) && fits(v));
  return pool.sort((a, b) => order.indexOf(a.measure) - order.indexOf(b.measure));
}

/** How many variables to put in a slot: the minimum, and at least three for a list that needs two or more. */
function howMany(slot: VarSlot): number {
  if (slot.min >= 2) return Math.min(slot.max, Math.max(slot.min, 3));
  return Math.max(1, slot.min);
}

async function addVar(page: Page, slotIndex: number, name: string) {
  const search = page.locator('.modal input[aria-label="Search variables"]');
  await search.fill(name);
  await page.locator('.modal .pd-list .pd-var').filter({ has: page.locator('.vl-name', { hasText: `[${name}]` }) }).first().click();
  await page.locator('.modal .pd-slot-row').nth(slotIndex).locator('button.pd-arrow').click();
  await search.fill('');
}

/**
 * Fill the required slots (and, from the second attempt, the optional ones too: some charts need
 * their "variable for means" with the default options); `attempt` also moves to later candidates.
 */
async function fill(page: Page, def: ProcedureDef, attempt: number): Promise<string[]> {
  const vars = await dialogVars(page);
  const used = new Set<string>();
  const chosen: string[] = [];
  for (const [i, slot] of def.slots.entries()) {
    if (slot.min < 1 && (attempt === 0 || !/means|optional/i.test(slot.label))) continue;
    const pool = candidates(def, slot, vars, used);
    const n = howMany(slot);
    const shift = slot.min < 1 ? 0 : Math.floor(attempt / 2);
    const pick = pool.slice(shift, shift + n).length === n ? pool.slice(shift, shift + n) : pool.slice(0, n);
    if (slot.min < 1 && pick.length < n) continue;
    expect(pick.length, `${def.id}: not enough sample variables for "${slot.label}"`).toBe(n);
    for (const v of pick) {
      used.add(v.name);
      await addVar(page, i, v.name);
    }
    chosen.push(`${slot.label}: ${pick.map((v) => v.name).join(', ')}`);
  }
  return chosen;
}

async function runProcedure(page: Page, path: string[], notes: string[]): Promise<void> {
  const title = path[path.length - 1].replace(/\.\.\.$/, '');
  const def = procedures.find((p) => p.title === title);
  expect(def, `no procedure titled ${title}`).toBeTruthy();
  const articles = page.locator('.ov-doc article');
  for (let attempt = 0; attempt < 4; attempt++) {
    const before = await articles.count();
    await invoke(page, path);
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2').first()).toHaveText(def!.title);
    // The dialog remembers the last choice: start from empty boxes and default options.
    await modal.getByRole('button', { name: 'Reset', exact: true }).click();
    const chosen = await fill(page, def!, attempt);
    await modal.locator('.pd-run').click();
    // Either the dialog closes with a new result, or it stays open with a message about the choice.
    const outcome = await Promise.race([
      expect(modal).toHaveCount(0, { timeout: 30_000 }).then(() => 'ran' as const),
      expect(modal.locator('.pd-problems, .pd-error')).toBeVisible({ timeout: 30_000 }).then(() => 'refused' as const),
    ]);
    if (outcome === 'refused') {
      const why = ((await modal.locator('.pd-problems, .pd-error').first().textContent()) ?? '').trim();
      notes.push(`${def!.id} with ${chosen.join('; ')}: ${why}`);
      await settle(page);
      continue;
    }
    await expect(articles).toHaveCount(before + 1);
    const item = articles.last();
    await expect(item).toBeVisible();
    const text = (await item.innerText()).replace(/\s+/g, ' ');
    expect(text, `${def!.id} (${chosen.join('; ')}) output`).not.toMatch(BAD_OUTPUT);
    expect(text.length, `${def!.id} output is empty`).toBeGreaterThan(20);
    return;
  }
  throw new Error(`${def!.id}: every attempt was refused:\n${notes.join('\n')}`);
}

// One test per Analyze submenu and one for Graphs, so they run in parallel and stay short. The groups
// come from the procedure registry; the commands in each come from the live menubar.
const GROUPS: Array<{ top: string; group?: string }> = [
  ...[...new Set(procedures.filter((p) => p.menu !== 'Graphs').map((p) => p.menu))].map((group) => ({ top: 'Analyze', group })),
  { top: 'Graphs' },
];

for (const { top, group } of GROUPS) {
  test(`every ${group ? `${top} > ${group}` : top} command runs on the sample survey and gives a clean result`, async ({ page }) => {
    test.setTimeout(150_000);
    const errors = watchErrors(page);
    await openWithSample(page);
    const nodes = (await menuTree(page, [top])).filter((n) => !n.disabled && (!group || n.path[1] === group));
    const expected = procedures.filter((p) => (group ? p.menu === group : p.menu === 'Graphs'));
    expect(nodes.map((n) => n.path[n.path.length - 1]).sort(), `${top} ${group ?? ''} commands`).toEqual(expected.map((p) => `${p.title}...`).sort());
    const notes: string[] = [];
    for (const n of nodes) {
      await test.step(n.path.join(' > '), async () => {
        await runProcedure(page, n.path, notes);
        expect(errors, n.path.join(' > ')).toEqual([]);
      });
    }
    if (notes.length) console.log(`${group ?? top}: first choices refused (then retried):\n${notes.join('\n')}`);
    expect(await errorLogErrors(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
}
