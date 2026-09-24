// Data > Define variable properties...: scan, spot missing codes, label, mark missing, set the level,
// apply to a battery, Apply as one change (logged with SPSS syntax), and undo it in one step.
import { expect, test, type Page } from '@playwright/test';
import { openWithSample } from './helpers';

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Define variable properties' });
const row = (page: Page, value: string) => dialog(page).locator(`.dvp-row[data-value="${value}"]`);
const vvRow = (page: Page, name: string) => page.locator('.vv-row', { has: page.locator('.vv-name', { hasText: new RegExp(`^${name}$`) }) });

async function pickVariables(page: Page, names: string[]) {
  const search = dialog(page).getByLabel('Search Variables to scan');
  for (const n of names) {
    await search.fill(n);
    await dialog(page).locator('.varpicker-item', { has: page.locator('.varpicker-name', { hasText: new RegExp(`^${n}$`) }) }).click();
  }
  await search.fill('');
}

test('define variable properties: scan, flag, label, mark missing, set measure, apply to a battery, undo in one step', async ({ page }) => {
  await openWithSample(page);

  await page.getByRole('menuitem', { name: 'Data', exact: true }).click();
  const item = page.getByRole('menuitem', { name: 'Define variable properties...' });
  await item.click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toContainText('Step 1 of 2');
  await expect(dialog(page).getByLabel('Limit the number of cases scanned')).not.toBeChecked();
  await expect(dialog(page).getByLabel('Limit the number of values displayed')).toBeChecked();
  await expect(dialog(page).getByLabel('Show at most')).toHaveValue('200');

  await pickVariables(page, ['trust1', 'trust2', 'trust3', 'trust4', 'trust5', 'hh_income']);
  await dialog(page).getByRole('button', { name: 'Scan 6 variables' }).click();
  await expect(dialog(page)).toContainText('Step 2 of 2');

  // Every scanned variable is listed with a status; trust1 is shown first.
  const list = dialog(page).getByRole('navigation', { name: 'Scanned variables' });
  await expect(list.locator('.dvp-var')).toHaveCount(6);
  await expect(list.locator('.dvp-var[aria-current="true"]')).toContainText('trust1');
  await expect(list.locator('.dvp-var', { hasText: 'trust1' })).toContainText('Labels complete');

  // 8 and 9 are flagged as missing codes, with counts; the measurement suggestion explains itself.
  for (const v of ['8', '9']) await expect(row(page, v).locator('[data-flag="missing-code"]')).toBeVisible();
  await expect(row(page, '8').locator('.dvp-c-count')).toHaveText('13', { useInnerText: true });
  await expect(row(page, '1').locator('[data-flag]')).toHaveCount(0);
  await expect(dialog(page).getByTestId('measure-suggestion')).toContainText('Ordinal suggested: 5 ordered codes with labels like Strongly disagree ... Strongly agree');
  await expect(dialog(page).getByLabel('Weighted', { exact: false })).toHaveCount(0);

  // hh_income: 999999 is flagged too, and Scale is suggested.
  await list.locator('.dvp-var', { hasText: 'hh_income' }).click();
  await expect(row(page, '999999').locator('[data-flag="missing-code"]')).toBeVisible();
  await expect(row(page, '999999').getByRole('checkbox')).toBeChecked();
  await expect(dialog(page).getByTestId('measure-suggestion')).toContainText('Scale suggested');

  // Back on trust1: add a label for a code that is not in the data, mark it missing, and set the level.
  await list.locator('.dvp-var', { hasText: 'trust1' }).click();
  await dialog(page).getByLabel('New value', { exact: true }).fill('7');
  await dialog(page).getByLabel('Label for the new value').fill('Not applicable');
  await dialog(page).getByRole('button', { name: 'Add', exact: true }).click();
  await expect(row(page, '7').getByLabel('Label for 7')).toHaveValue('Not applicable');
  await expect(row(page, '7').locator('[data-flag="missing-code"]')).toContainText('looks like a missing code');
  await row(page, '7').getByLabel('7 is missing').check();
  await expect(row(page, '7').locator('[data-flag="missing-code"]')).toHaveText(/^missing code/);
  await expect(dialog(page).locator('.dvp-missing-line')).toContainText('7, 8, 9');

  // A fourth missing value is refused, with the reason shown in place.
  await row(page, '5').getByLabel('5 is missing').click();
  await expect(row(page, '5').getByLabel('5 is missing')).not.toBeChecked();
  await expect(row(page, '5')).toContainText('SPSS allows at most 3 single missing values');

  // Edit an existing label and set the measurement level.
  await row(page, '3').getByLabel('Label for 3').fill('Neither');
  await dialog(page).getByLabel('Measurement level').selectOption('scale');
  await expect(dialog(page).getByRole('button', { name: 'Use Ordinal' })).toBeVisible();
  await expect(list.locator('.dvp-var', { hasText: 'trust1' })).toContainText('edited');

  // Apply these properties to the other trust items.
  await dialog(page).getByRole('button', { name: 'Apply these properties to other variables...' }).click();
  await dialog(page).getByRole('button', { name: /Select the other items like trust1/ }).click();
  await dialog(page).getByRole('button', { name: 'Apply to 4 variables' }).click();
  await expect(dialog(page).locator('.dvp-notice')).toContainText('trust2, trust3, trust4, trust5');
  await list.locator('.dvp-var', { hasText: 'trust4' }).click();
  await expect(row(page, '7').getByLabel('Label for 7')).toHaveValue('Not applicable');
  await expect(row(page, '3').getByLabel('Label for 3')).toHaveValue('Neither');
  await expect(dialog(page).getByLabel('Measurement level')).toHaveValue('scale');

  // Apply: one change for all five variables, logged quietly to Output with a toast.
  await dialog(page).getByRole('button', { name: 'Apply (5 variables)' }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator('.toast', { hasText: 'Updated the properties of 5 variables' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Data View' })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('tab', { name: 'Variable View' }).click();
  for (const n of ['trust1', 'trust5']) {
    await expect(vvRow(page, n).locator('.vv-missing')).toContainText('7, 8, 9');
    await expect(vvRow(page, n).locator('.vv-measure')).toContainText('Scale');
  }
  await expect(vvRow(page, 'hh_income').locator('.vv-missing')).toContainText('999999');

  await page.getByRole('tab', { name: /Output/ }).click();
  const out = page.locator('article', { has: page.locator('.oi-title', { hasText: 'Define Variable Properties' }) });
  await expect(out).toHaveCount(1);
  await expect(out).toContainText('Updated the properties of 5 variables');
  const syntax = out.locator('.ob-syntax pre');
  await expect(syntax).toContainText('VALUE LABELS trust1 trust2 trust3 trust4 trust5');
  await expect(syntax).toContainText("3 'Neither'");
  await expect(syntax).toContainText('MISSING VALUES trust1 trust2 trust3 trust4 trust5 (7, 8, 9).');
  await expect(syntax).toContainText('VARIABLE LEVEL trust1 trust2 trust3 trust4 trust5 (SCALE).');

  // Ctrl+Z in the Data tab reverts every change in one step.
  await page.getByRole('tab', { name: 'Data View' }).click();
  await page.locator('.grid-scroll').click({ position: { x: 5, y: 5 } }).catch(() => undefined);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z');
  await page.getByRole('tab', { name: 'Variable View' }).click();
  for (const n of ['trust1', 'trust5']) {
    await expect(vvRow(page, n).locator('.vv-missing')).toHaveText('8, 9');
    await expect(vvRow(page, n).locator('.vv-measure')).toContainText('Ordinal');
    await expect(vvRow(page, n).locator('.vv-values')).toContainText('1 = Strongly disagree');
  }
});

test('define variable properties: suggestions are a preview, and closing with edits asks first', async ({ page }) => {
  await openWithSample(page);
  // Right-click in Variable View opens it with the selected variable ready to scan.
  await page.getByRole('tab', { name: 'Variable View' }).click();
  await vvRow(page, 'hh_size').locator('.vv-name').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Define variable properties...' }).click();
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Scan 1 variable' }).click();

  await dialog(page).getByRole('button', { name: 'Suggest labels' }).click();
  const panel = dialog(page).getByRole('region', { name: 'Suggested labels' });
  await expect(panel).toBeVisible();
  // Nothing is applied until the user accepts.
  await dialog(page).getByRole('button', { name: 'Cancel', exact: true }).first().click();
  await expect(dialog(page).getByRole('button', { name: 'Apply', exact: true })).toBeDisabled();

  await dialog(page).getByLabel('Variable label (the question wording)').fill('People living in the household');
  await page.keyboard.press('Escape');
  const confirm = page.getByRole('dialog', { name: 'Discard your changes?' });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByLabel('Variable label (the question wording)')).toHaveValue('People living in the household');
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await page.getByRole('dialog', { name: 'Discard your changes?' }).getByRole('button', { name: 'Discard changes' }).click();
  await expect(dialog(page)).toHaveCount(0);
});

test('define variable properties: search finds it by its words', async ({ page }) => {
  await openWithSample(page);
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Search Socius' });
  const box = palette.getByRole('combobox', { name: 'Search Socius' });
  await box.fill('value labels');
  // The guide section "Value labels" may come first; the command is the first command.
  await expect(palette.getByRole('option', { name: /Define variable properties/ })).toContainText('Data');
  await box.fill('define properties');
  const first = palette.getByRole('option').first();
  await expect(first).toContainText('Define variable properties');
  await first.click();
  await expect(dialog(page)).toBeVisible();
});
