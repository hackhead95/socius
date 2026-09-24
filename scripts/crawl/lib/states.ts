// The app states the crawler visits, built through the real UI (menus, dialogs, buttons) in a fresh
// browser context each time, so every state is reproducible by hand with the listed steps.
import { expect, type Page } from '@playwright/test';

export type StateId = 'first-visit' | 'sample' | 'analyses' | 'coding' | 'weighted';

export interface StateDef {
  id: StateId;
  title: string;
  /** Human steps to reach the state (for bug reports). */
  steps: string[];
  build: (page: Page) => Promise<void>;
}

async function welcome(page: Page) {
  await expect(page.locator('.welcome')).toBeVisible({ timeout: 30_000 });
}

export async function loadSample(page: Page) {
  await welcome(page);
  await page.getByRole('button', { name: /Load sample survey/ }).click();
  await expect(page.locator('.grid-scroll')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.dataset-size')).toContainText('cases');
}

/** Open a command through the menubar (or the narrow-screen Menu sheet) with real clicks. */
export async function menuPath(page: Page, ...path: string[]) {
  const sheet = page.locator('.menu-sheet-btn');
  if (await sheet.isVisible().catch(() => false)) {
    await sheet.click();
    const title = page.locator('.menu-sheet-title', { hasText: new RegExp(`^${escapeRe(path[0])}`) });
    // The sheet remembers the open section; clicking an expanded title would collapse it.
    if ((await title.getAttribute('aria-expanded')) !== 'true') await title.click();
    await page.locator('.menu-sheet-items .menu-item', { hasText: path[path.length - 1] }).first().click();
    return;
  }
  await page.locator('.menubar-btn', { hasText: new RegExp(`^${escapeRe(path[0])}$`) }).click();
  for (let i = 1; i < path.length; i++) {
    const item = page.locator('[role=menu]').last().locator('.menu-item', { hasText: path[i] }).first();
    if (i < path.length - 1) await item.hover();
    else await item.click();
  }
}

export function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Put a variable into the procedure dialog's n-th box using the search field and the arrow button. */
export async function addVar(page: Page, slot: number, name: string) {
  const search = page.locator('.modal input[aria-label="Search variables"]');
  await search.fill(name);
  await page.locator('.pd-list .pd-var').filter({ has: page.locator('.vl-name', { hasText: `[${name}]` }) }).first().click();
  await page.locator('.modal .pd-slot-row').nth(slot).locator('button.pd-arrow').click();
  await search.fill('');
}

export async function runDialog(page: Page) {
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal')).toHaveCount(0, { timeout: 30_000 });
}

export const ANALYSES: Array<{ path: string[]; vars: Array<[number, string]>; label: string }> = [
  { label: 'Frequencies of educ', path: ['Analyze', 'Descriptive Statistics', 'Frequencies...'], vars: [[0, 'educ']] },
  { label: 'Crosstabs civic_meet × migrant', path: ['Analyze', 'Descriptive Statistics', 'Crosstabs...'], vars: [[0, 'civic_meet'], [1, 'migrant']] },
  { label: 'Independent-samples t test of life_sat by migrant', path: ['Analyze', 'Compare Means', 'Independent-Samples T Test...'], vars: [[0, 'life_sat'], [1, 'migrant']] },
  { label: 'Linear regression life_sat on age and yrs_nbhd', path: ['Analyze', 'Regression', 'Linear Regression...'], vars: [[0, 'life_sat'], [1, 'age'], [1, 'yrs_nbhd']] },
  { label: 'Bar chart of educ', path: ['Graphs', 'Bar Chart...'], vars: [[0, 'educ']] },
];

async function runAnalyses(page: Page) {
  for (const a of ANALYSES) {
    await menuPath(page, ...a.path);
    await expect(page.locator('.modal')).toBeVisible();
    for (const [slot, v] of a.vars) await addVar(page, slot, v);
    await runDialog(page);
  }
  await expect(page.locator('#tab-output .badge')).toHaveText(String(ANALYSES.length), { timeout: 30_000 });
}

async function workedExample(page: Page) {
  await page.locator('#tab-coding').click();
  await page.locator('.cw-welcome-card', { hasText: 'Explore a worked example' }).click();
  await expect(page.locator('.cw-viewtabs')).toBeVisible({ timeout: 30_000 });
}

async function weightAndFilter(page: Page) {
  await menuPath(page, 'Data', 'Weight cases...');
  await page.locator('.modal label.check', { hasText: 'Weight cases by' }).click();
  await page.locator('.modal .varpicker-input').fill('wt');
  await page.locator('.modal .varpicker-item', { has: page.locator('.varpicker-name', { hasText: /^wt$/ }) }).click();
  await page.locator('.modal button', { hasText: /^OK$/ }).click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await menuPath(page, 'Data', 'Select cases...');
  await page.locator('#sc-cond').fill('age >= 30');
  await page.locator('.modal button', { hasText: /^OK$/ }).click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(page.locator('.chip-filter')).toBeVisible();
  await expect(page.locator('.chip-weight')).toBeVisible();
}

export const STATES: Record<StateId, StateDef> = {
  'first-visit': {
    id: 'first-visit',
    title: 'First visit (welcome screen, no data)',
    steps: ['Open the app in a fresh browser profile (no saved session)'],
    build: welcome,
  },
  sample: {
    id: 'sample',
    title: 'Sample survey loaded',
    steps: ['Open the app in a fresh browser profile', 'Welcome screen: click "Load sample survey"'],
    build: loadSample,
  },
  analyses: {
    id: 'analyses',
    title: 'Sample survey after Frequencies, Crosstabs, T test, Regression and a Bar chart',
    steps: ['Open the app in a fresh browser profile', 'Welcome screen: click "Load sample survey"', ...ANALYSES.map((a) => `Run ${a.path.join(' > ')} (${a.label})`)],
    build: async (page) => {
      await loadSample(page);
      await runAnalyses(page);
    },
  },
  coding: {
    id: 'coding',
    title: 'Text coding with the worked example loaded',
    steps: ['Open the app in a fresh browser profile', 'Welcome screen: click "Load sample survey"', 'Click the "Text coding" tab', 'Click "Explore a worked example"'],
    build: async (page) => {
      await loadSample(page);
      await workedExample(page);
    },
  },
  weighted: {
    id: 'weighted',
    title: 'Sample survey weighted by wt with a filter (age >= 30)',
    steps: ['Open the app in a fresh browser profile', 'Welcome screen: click "Load sample survey"', 'Data > Weight cases...: Weight cases by wt, OK', 'Data > Select cases...: condition "age >= 30", OK'],
    build: async (page) => {
      await loadSample(page);
      await weightAndFilter(page);
    },
  },
};
