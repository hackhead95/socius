// App shell end-to-end checks: sample data, Data View editing, transforms, undo, projects, theme, narrow layout.
import { expect, test, type Page } from '@playwright/test';
import { loadSampleFromWelcome, openWithSample } from './helpers';

async function ready(page: Page) {
  await openWithSample(page);
}

async function menu(page: Page, top: string, item: string) {
  await page.getByRole('menuitem', { name: top, exact: true }).click();
  await page.getByRole('menuitem', { name: item }).click();
}

test('first run shows the welcome screen; loading the sample shows its banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.welcome')).toBeVisible({ timeout: 30_000 });
  for (const b of [/Open data file/, /Open project/, /Load sample survey/, /New empty dataset/]) await expect(page.getByRole('button', { name: b })).toBeVisible();
  await expect(page.locator('.dataset-size')).toHaveCount(0);
  await expect(page.locator('.sample-banner')).toHaveCount(0);
  await loadSampleFromWelcome(page);
  await expect(page.locator('.chip-sample')).toBeVisible();
  await expect(page.locator('.sample-banner')).toContainText('You are exploring sample data');
  await expect(page.locator('.grid-hcell').first()).toBeVisible();
});

test('edits cells with validation and undo', async ({ page }) => {
  await ready(page);
  const age = page.locator('.grid-hcell', { hasText: /^age$/ });
  const col = await age.getAttribute('data-hc');
  const cell = page.locator(`.grid-cell[data-r="0"][data-c="${col}"]`);
  await cell.click();
  await page.keyboard.type('55');
  await page.keyboard.press('Enter');
  await expect(cell).toHaveText('55');
  await page.locator(`.grid-cell[data-r="1"][data-c="${col}"]`).click();
  await page.keyboard.type('abc');
  await page.keyboard.press('Enter');
  await expect(page.locator('.grid-edit-error')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z');
  await expect(cell).not.toHaveText('55');
});

test('compute and select cases are logged and undoable', async ({ page }) => {
  await ready(page);
  const before = await page.locator('.dataset-size').innerText();
  await menu(page, 'Transform', 'Compute variable...');
  await page.locator('#cv-target').fill('age_dec');
  await page.locator('#cv-expr').fill('TRUNC(age / 10');
  await expect(page.locator('.expr-error')).toContainText('closing parenthesis');
  await page.locator('#cv-expr').fill('TRUNC(age / 10)');
  await expect(page.locator('.preview-table')).toBeVisible();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.sidebar-var', { hasText: 'age_dec' })).toBeVisible();

  await menu(page, 'Data', 'Select cases...');
  await page.locator('#sc-cond').fill('age >= 40');
  await expect(page.locator('.modal .callout-info')).toContainText('would be selected');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.chip-filter')).toContainText('Filter on');
  await expect(page.locator('.grid-rownum.filtered').first()).toBeVisible();
  await expect(page.locator('#tab-output .badge')).toHaveText('2');

  await page.locator('.grid-scroll').focus();
  await page.keyboard.press('Control+z');
  await expect(page.locator('.chip-filter')).toHaveCount(0);
  await page.keyboard.press('Control+z');
  await expect(page.locator('.dataset-size')).toHaveText(before);
});

test('restores the session after a reload', async ({ page }) => {
  await ready(page);
  const col = await page.locator('.grid-hcell', { hasText: /^age$/ }).getAttribute('data-hc');
  const cell = page.locator(`.grid-cell[data-r="0"][data-c="${col}"]`);
  await cell.click();
  await page.keyboard.type('66');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.reload();
  await expect(page.locator('.toast', { hasText: 'Restored your last session' })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(`.grid-cell[data-r="0"][data-c="${col}"]`)).toHaveText('66');
});

test('saves a project and opens it again', async ({ page }) => {
  await ready(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Control+s')]);
  expect(dl.suggestedFilename()).toMatch(/\.socius\.json$/);
  const path = await dl.path();
  await menu(page, 'File', 'Close data and start fresh...');
  await page.getByRole('button', { name: 'Close and start fresh' }).click();
  await expect(page.locator('.welcome')).toBeVisible();
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: /Open project/ }).click()]);
  await fc.setFiles(path!);
  await expect(page.locator('.dataset-size')).toContainText('cases');
});

test('theme toggle and narrow layout', async ({ page }) => {
  await ready(page);
  const toggle = page.locator('.topbar-right button').last();
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.setViewportSize({ width: 400, height: 800 });
  await expect(page.locator('.menu-sheet-btn')).toBeVisible();
  const [scrollW, clientW] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scrollW).toBeLessThanOrEqual(clientW);
  await page.locator('.menu-sheet-btn').click();
  await page.getByRole('button', { name: 'Transform' }).click();
  await page.getByRole('button', { name: 'Compute variable...' }).click();
  await expect(page.locator('.modal h2')).toHaveText('Compute Variable');
});
