// Smoke tests for the transform dialogs the map found untested (docs/map/GRAPH_REPORT.md): Automatic
// recode, Copy variable properties, Recode into same variables and Sort cases. Each one: open the
// dialog, run it on the sample survey, check the result and the Output log, then Edit > Undo (which
// names the step) restores the data.
import { expect, test, type Page } from '@playwright/test';
import { openWithSample } from './helpers';

async function menu(page: Page, top: string, item: string) {
  await page.getByRole('menuitem', { name: top, exact: true }).click();
  await page.getByRole('menuitem', { name: item }).click();
}

/** Edit > Undo, checking that the menu names the step. */
async function undoVia(page: Page, step: string) {
  await page.getByRole('tab', { name: 'Data View' }).click();
  await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^Undo ${step}`) }).click();
}

const cell = (page: Page, r: number, c: number) => page.locator(`.grid-scroll [role="gridcell"][data-r="${r}"][data-c="${c}"]`);

async function outputHas(page: Page, text: string) {
  await page.getByRole('tab', { name: /Output/ }).click();
  await expect(page.locator('#main')).toContainText(text);
}

test.beforeEach(async ({ page }) => {
  await openWithSample(page);
  await expect(page.locator('.dataset-size')).toHaveText('640 cases · 34 variables');
});

test('Automatic recode: interviewer codes become 1..15 with labels, logged, and undone', async ({ page }) => {
  await menu(page, 'Transform', 'Automatic recode...');
  await page.locator('.modal').getByRole('listbox', { name: 'Variables', exact: true }).getByRole('option', { name: /^interviewer\b/ }).click();
  await expect(page.getByLabel('New name for interviewer')).toHaveValue('interviewer_n');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.dataset-size')).toHaveText('640 cases · 35 variables');
  await expect(page.locator('.sidebar-var', { hasText: 'interviewer_n' })).toBeVisible();
  await outputHas(page, 'AUTORECODE VARIABLES=interviewer');
  await expect(page.locator('#main')).toContainText('interviewer to interviewer_n (15 categories)');
  await undoVia(page, 'Automatic recode');
  await expect(page.locator('.dataset-size')).toHaveText('640 cases · 34 variables');
});

test('Copy variable properties: trust1 labels go to yrs_nbhd, logged as syntax, and undone', async ({ page }) => {
  await menu(page, 'Data', 'Copy variable properties...');
  const modal = page.locator('.modal');
  await modal.getByRole('listbox', { name: 'Source variable', exact: true }).getByRole('option', { name: /^trust1\b/ }).click();
  await modal.getByRole('listbox', { name: 'Target variables', exact: true }).getByRole('option', { name: /^yrs_nbhd\b/ }).click();
  await modal.getByRole('button', { name: 'Copy to 1 variable' }).click();
  await expect(modal).toHaveCount(0);
  await page.getByRole('tab', { name: 'Variable View' }).click();
  const row = page.locator('.vv-row', { has: page.locator('.vv-name', { hasText: /^yrs_nbhd$/ }) });
  await expect(row.locator('.vv-values')).toContainText('1 = Strongly disagree');
  await expect(row.locator('.vv-measure')).toContainText('Ordinal');
  await outputHas(page, '* Properties copied from trust1.');
  await expect(page.locator('#main')).toContainText('VALUE LABELS yrs_nbhd');
  await expect(page.locator('#main')).toContainText('VARIABLE LEVEL yrs_nbhd (ORDINAL).');
  await undoVia(page, 'Copy variable properties');
  await page.getByRole('tab', { name: 'Variable View' }).click();
  await expect(row.locator('.vv-values')).not.toContainText('Strongly disagree');
});

test('Recode into same variables: ages 18 to 19 become 18 in place, logged, and undone', async ({ page }) => {
  await menu(page, 'Transform', 'Recode into same variables...');
  const modal = page.locator('.modal');
  await modal.getByRole('listbox', { name: 'Variables', exact: true }).getByRole('option', { name: /^age\b/ }).click();
  await modal.getByLabel('Old value type').selectOption('range');
  await modal.getByLabel('From', { exact: true }).fill('18');
  await modal.getByLabel('To', { exact: true }).fill('19');
  await modal.getByLabel('New value', { exact: true }).fill('18');
  await modal.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(modal.getByLabel('Rules')).toContainText('18 thru 19');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(modal).toHaveCount(0);
  // Row 1 (resp_id 1002) is 19 years old: now 18.
  await expect(cell(page, 1, 6)).toHaveText('18');
  await outputHas(page, 'RECODE age (18 THRU 19=18).');
  await undoVia(page, 'Recode into same variables');
  await expect(cell(page, 1, 6)).toHaveText('19');
});

test('Sort cases: by age descending puts the oldest first, logged, and undone', async ({ page }) => {
  await expect(cell(page, 0, 0)).toHaveText('1001');
  await menu(page, 'Data', 'Sort cases...');
  const modal = page.locator('.modal');
  await modal.getByLabel('Sort variable').selectOption({ label: 'age (Age in completed years)' });
  await modal.getByLabel('Direction').selectOption('desc');
  await modal.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(cell(page, 0, 0)).toHaveText('1036');
  await expect(cell(page, 0, 6)).toHaveText('85');
  await outputHas(page, 'SORT CASES BY age (D).');
  await undoVia(page, 'Sort cases');
  await expect(cell(page, 0, 0)).toHaveText('1001');
});
