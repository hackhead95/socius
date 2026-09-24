// Search palette end to end: Ctrl+K, the top-bar field and "/", commands (same as the menus),
// variables, results, help topics, coded text, and the phone layout.
import { expect, test, type Page } from '@playwright/test';
import { openWithSample } from './helpers';

const palette = (page: Page) => page.getByRole('dialog', { name: 'Search Socius' });
const input = (page: Page) => palette(page).getByRole('combobox', { name: 'Search Socius' });

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('Ctrl+K: "chi square" opens Crosstabs; arrows, Escape and suggestions work', async ({ page }) => {
  const errors = watchErrors(page);
  await openWithSample(page);
  await page.keyboard.press('Control+k');
  await expect(palette(page)).toBeVisible();
  await expect(input(page)).toBeFocused();
  // Empty query: suggestions.
  await expect(palette(page).getByText('Suggestions')).toBeVisible();
  await expect(palette(page).getByRole('option', { name: /Explain a result/ })).toBeVisible();

  await input(page).fill('chi square');
  const first = palette(page).getByRole('option').first();
  await expect(first).toContainText('Crosstabs');
  await expect(first).toContainText('Analyze > Descriptive Statistics');
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(palette(page).getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(palette(page)).toHaveCount(0);
  await expect(page.locator('.modal h2')).toHaveText('Crosstabs');
  await page.keyboard.press('Escape');
  await expect(page.locator('.modal')).toHaveCount(0);

  // The command is now under Recent.
  await page.keyboard.press('Control+k');
  await expect(palette(page).getByText('Recent')).toBeVisible();
  await expect(palette(page).getByRole('option').first()).toContainText('Crosstabs');
  await page.keyboard.press('Escape');
  await expect(palette(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the top-bar field and "/" open the same palette; typos and synonyms work', async ({ page }) => {
  await openWithSample(page);
  await page.locator('.topbar-search').click();
  await expect(input(page)).toBeFocused();
  for (const [q, want] of [['t test', 'Independent-Samples T Test'], ['reliabilty', 'Reliability Analysis'], ['alpha', 'Reliability Analysis'], ['anova', 'One-Way ANOVA'], ['regression', 'Linear Regression'], ['select cases', 'Select cases'], ['kappa', 'Intercoder reliability']]) {
    await input(page).fill(q);
    await expect(palette(page).getByRole('option').first()).toContainText(want);
  }
  await page.keyboard.press('Escape');
  // "/" works when focus is not in a text field or the data grid (where it types into a cell).
  await page.getByRole('tab', { name: 'Output' }).click();
  await page.keyboard.press('/');
  await expect(palette(page)).toBeVisible();
  await input(page).fill('weight');
  await page.keyboard.press('Enter');
  await expect(page.locator('.modal h2')).toHaveText(/Weight Cases/i);
});

test('a variable: Enter selects its column in Data View; Frequencies of it; Variable View', async ({ page }) => {
  await openWithSample(page);
  await page.getByRole('tab', { name: 'Output' }).click();
  await page.keyboard.press('Control+k');
  await input(page).fill('gender');
  const opt = palette(page).getByRole('option').first();
  await expect(opt).toContainText('Gender of respondent');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: 'Data View' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.sidebar-var.on')).toContainText('gender');

  await page.keyboard.press('Control+k');
  await input(page).fill('gender');
  await palette(page).getByRole('option').first().getByRole('button', { name: 'Frequencies' }).click();
  await expect(page.locator('.modal h2')).toHaveText('Frequencies');
  await expect(page.locator('.modal .pd-slot-row').first()).toContainText('gender');
  await page.keyboard.press('Escape');

  await page.keyboard.press('Control+k');
  await input(page).fill('gender');
  await page.keyboard.press('Shift+Enter');
  await expect(page.getByRole('tab', { name: 'Variable View' })).toHaveAttribute('aria-selected', 'true');
});

test('results, help topics and coded text', async ({ page, context, baseURL }) => {
  await context.route('**/guide/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>Guide</title>' }));
  await openWithSample(page);
  // A result to find.
  await page.keyboard.press('Control+k');
  await input(page).fill('frequencies');
  await page.keyboard.press('Enter');
  const search = page.locator('.modal input[aria-label="Search variables"]');
  await search.fill('gender');
  await page.locator('.pd-list .pd-var').first().click();
  await page.locator('.modal .pd-slot-row').first().locator('button.pd-arrow').click();
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Data View' }).click();

  await page.keyboard.press('Control+k');
  await input(page).fill('frequencies');
  const result = palette(page).getByRole('option', { name: /Output ·/ }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page.getByRole('tab', { name: /Output/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.oi-title').first()).toBeFocused();

  // Help topic: opens the guide at the section.
  await page.keyboard.press('Control+k');
  await input(page).fill('missing values');
  const help = palette(page).getByRole('option', { name: /User guide/ }).first();
  await expect(help).toContainText('Missing values');
  const popup = page.waitForEvent('popup');
  await help.click();
  const p = await popup;
  expect(p.url()).toBe(`${baseURL}/guide/#missing-values`);
  await p.close();

  // Coded text: keyword in context.
  await page.getByRole('menuitem', { name: 'Text coding', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Load sample interviews' }).click();
  await expect(page.locator('.toast').filter({ hasText: 'sample interview' }).first()).toBeVisible();
  await page.keyboard.press('Control+k');
  await input(page).fill('water');
  await palette(page).getByRole('option', { name: /Search in texts for "water"/ }).click();
  await expect(page.locator('.cw-viewtabs [role=tab]', { hasText: 'Analyse' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.cw-kwic-line').first()).toBeVisible();
});

test('disabled commands show why; phone width opens full screen from the search button', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.welcome')).toBeVisible({ timeout: 30_000 });
  await page.keyboard.press('Control+k');
  await input(page).fill('crosstabs');
  const opt = palette(page).getByRole('option').first();
  await expect(opt).toHaveAttribute('aria-disabled', 'true');
  await expect(opt).toContainText('Open or create a dataset first');
  await page.keyboard.press('Enter');
  await expect(palette(page)).toBeVisible();
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 400, height: 800 });
  await page.getByRole('button', { name: /Load sample survey/ }).click();
  await expect(page.locator('.grid-scroll')).toBeVisible();
  await expect(page.locator('.topbar-search')).toBeHidden();
  await page.locator('.topbar-search-btn').click();
  await expect(palette(page)).toBeVisible();
  const box = await palette(page).boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(399);
  expect(box!.height).toBeGreaterThanOrEqual(799);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await input(page).fill('chi square');
  await palette(page).getByRole('option').first().click();
  await expect(page.locator('.modal h2')).toHaveText('Crosstabs');
  await page.keyboard.press('Escape');
  await page.locator('.topbar-search-btn').click();
  await palette(page).getByRole('button', { name: 'Close' }).click();
  await expect(palette(page)).toHaveCount(0);
});
