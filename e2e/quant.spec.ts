// Statistics end-to-end checks on the bundled sample survey: dialogs, numbers (verified against
// scipy/statsmodels), weighting, inline errors, and the Word export.
import { expect, test, type Page } from '@playwright/test';
import { loadSampleFromWelcome, openWithSample } from './helpers';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

async function ready(page: Page) {
  await openWithSample(page);
}

async function menu(page: Page, ...path: string[]) {
  await page.getByRole('menuitem', { name: path[0], exact: true }).click();
  for (const p of path.slice(1)) await page.getByRole('menuitem', { name: p, exact: true }).click();
}

/** Put a variable into the dialog's n-th box (0-based) using search + the arrow button. */
async function addVar(page: Page, slot: number, name: string) {
  const search = page.locator('.modal input[aria-label="Search variables"]');
  await search.fill(name);
  await page.locator('.pd-list .pd-var').filter({ has: page.locator('.vl-name', { hasText: `[${name}]` }) }).first().click();
  await page.locator('.modal .pd-slot-row').nth(slot).locator('button.pd-arrow').click();
  await search.fill('');
}

async function run(page: Page) {
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal')).toHaveCount(0, { timeout: 30_000 });
}

const lastItem = (page: Page) => page.locator('.ov-doc article').last();

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    // Web fonts may be blocked in the test sandbox; that is not an app error.
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

test('crosstabs with column percentages: SPSS numbers and a group-wise reading', async ({ page }) => {
  const errors = watchErrors(page);
  await ready(page);
  await menu(page, 'Analyze', 'Descriptive Statistics', 'Crosstabs...');
  await addVar(page, 0, 'civic_meet');
  await addVar(page, 1, 'migrant');
  await page.locator('.modal label.check', { hasText: 'Column percentages' }).locator('input').check();
  await run(page);
  const item = lastItem(page);
  await expect(item).toContainText('18.125'); // Pearson chi-square (scipy: 18.1251)
  await expect(item.locator('.ob-interp')).toContainText('Respondents in the "Migrated from another state or district" group of migrant were more likely to answer "No"');
  await expect(item.locator('.ob-apa')).toContainText('χ²(1, N = 640) = 18.13, p < .001');
  expect(errors).toEqual([]);
});

test('independent t test and weighting change the numbers', async ({ page }) => {
  await ready(page);
  await menu(page, 'Analyze', 'Compare Means', 'Independent-Samples T Test...');
  await addVar(page, 0, 'life_sat');
  await addVar(page, 1, 'migrant');
  await run(page);
  await expect(lastItem(page).locator('.ob-apa')).toContainText('t(628) = 4.51, p < .001');

  await menu(page, 'Data', 'Weight cases...');
  await page.locator('.modal label.check', { hasText: 'Weight cases by' }).click();
  await page.locator('.modal .varpicker-input').fill('wt');
  await page.locator('.modal .varpicker-item', { has: page.locator('.varpicker-name', { hasText: /^wt$/ }) }).click();
  await page.locator('.modal button', { hasText: /^OK$/ }).click();
  await expect(page.locator('.modal')).toHaveCount(0);

  await menu(page, 'Analyze', 'Compare Means', 'Independent-Samples T Test...');
  await run(page);
  const item = lastItem(page);
  await expect(item).toContainText('weighted by wt');
  await expect(item.locator('.ob-apa')).toContainText('t(628.82) = 4.24'); // statsmodels weighted t: 4.2436, df 628.822
  await expect(item).not.toContainText('in other groups');
});

test('dialog problems are shown inline, never as a crash', async ({ page }) => {
  const errors = watchErrors(page);
  await ready(page);
  await menu(page, 'Analyze', 'Correlate', 'Bivariate Correlations...');
  await addVar(page, 0, 'age');
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal .pd-problems')).toContainText('Add at least 2 variables');
  await page.locator('.modal button', { hasText: 'Cancel' }).click();

  await menu(page, 'Analyze', 'Compare Means', 'One-Way ANOVA...');
  await addVar(page, 0, 'life_sat');
  await addVar(page, 1, 'hh_income');
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal .pd-error')).toContainText('recode hh_income into 50 or fewer groups');
  await page.locator('.modal button', { hasText: 'Cancel' }).click();
  await expect(page.locator('.grid-scroll, .ov')).not.toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Word export holds APA tables and chart images', async ({ page }) => {
  await ready(page);
  await menu(page, 'Graphs', 'Histogram...');
  await addVar(page, 0, 'age');
  await run(page);
  await menu(page, 'Analyze', 'Descriptive Statistics', 'Frequencies...');
  await addVar(page, 0, 'educ');
  await run(page);
  await page.locator('button', { hasText: 'Export report' }).click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('.ov-menu-item', { hasText: 'Word' }).click()]);
  const path = await dl.path();
  const files = unzipSync(new Uint8Array(readFileSync(path!)));
  const xml = strFromU8(files['word/document.xml']);
  expect((xml.match(/<w:tbl>/g) ?? []).length).toBeGreaterThanOrEqual(2);
  expect(xml).toContain('<w:drawing>');
  expect(Object.keys(files).some((f) => f.startsWith('word/media/') && f.endsWith('.png'))).toBe(true);
  expect(xml).toContain('Highest level of education completed');
  expect(xml).not.toMatch(/NaN|undefined/);
});

test('t test groups defined by a cut point run without asking for group values', async ({ page }) => {
  await ready(page);
  await menu(page, 'Analyze', 'Compare Means', 'Independent-Samples T Test...');
  await addVar(page, 0, 'life_sat');
  await addVar(page, 1, 'age');
  await page.locator('.modal .pd-options select').first().selectOption('cut');
  await expect(page.locator('.modal .pd-pair')).toHaveCount(0);
  await page.locator('.modal .pd-options input.num').first().fill('40');
  await run(page);
  await expect(lastItem(page)).toContainText('>= 40');
  await expect(lastItem(page).locator('.ob-apa')).toContainText('t(');
});
