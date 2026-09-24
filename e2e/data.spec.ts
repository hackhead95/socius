// Data management end to end: opening messy real-world files, Data View editing, transforms,
// round trips, session restore, the Artifact sandbox and small screens.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { zipSync } from 'fflate';
import { buildSav, valueLabels } from '../tests/io/sav-builder';

const FIX = 'tests/io/fixtures/';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('.grid-scroll')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.dataset-size')).toContainText('cases');
}

async function menu(page: Page, top: string, item: string) {
  await page.getByRole('menuitem', { name: top, exact: true }).click();
  await page.getByRole('menuitem', { name: item }).click();
}

/** Drop a file on the window, like dragging it from the desktop. */
async function drop(page: Page, name: string, bytes: Uint8Array | Buffer) {
  await page.evaluate(
    ({ name, b64 }) => {
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bin], name));
      for (const t of ['dragenter', 'dragover', 'drop']) window.dispatchEvent(new DragEvent(t, { dataTransfer: dt, bubbles: true, cancelable: true }));
    },
    { name, b64: Buffer.from(bytes).toString('base64') },
  );
}

const toasts = (page: Page) => page.locator('.toast');

test('unsupported files get a friendly message instead of opening as garbage', async ({ page }) => {
  await ready(page);
  await drop(page, 'report.pdf', Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\n'));
  await expect(toasts(page).filter({ hasText: 'PDF files cannot be opened as data' })).toBeVisible();
  await drop(page, 'old.por', Buffer.from('SPSS PORT FILE'));
  await expect(toasts(page).filter({ hasText: 'portable files (.por)' })).toBeVisible();
  await expect(page.locator('.dataset-size')).toHaveText('640 cases · 34 variables');
});

test('messy CSV: NA words become missing and comma numbers are explained', async ({ page }) => {
  await ready(page);
  await drop(page, 'messy.csv', Buffer.from('id,income,age\n1,"1,234",34\n2,NA,n/a\n3,"12,345.50",.\n'));
  await expect(page.locator('.modal h2')).toHaveText('Open messy.csv');
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page.locator('.dataset-size')).toHaveText('3 cases · 3 variables');
  await expect(toasts(page).filter({ hasText: 'were read as missing values in age' })).toBeVisible();
  await expect(toasts(page).filter({ hasText: 'income holds numbers written with thousands separators' })).toBeVisible();
});

test('opens a .sav inside a zip (how the Artifact viewer saves SPSS files)', async ({ page }) => {
  await ready(page);
  const zip = zipSync({ 'main_bytecode.sav': new Uint8Array(readFileSync(FIX + 'main_bytecode.sav')) });
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.keyboard.press('Control+o')]);
  await fc.setFiles({ name: 'survey.sav.zip', mimeType: 'application/zip', buffer: Buffer.from(zip) });
  await expect(page.locator('.dataset-size')).toHaveText('6 cases · 19 variables');
  await expect(toasts(page).filter({ hasText: 'Opened main_bytecode.sav' })).toBeVisible();
});

test('an SPSS file without an encoding record can be re-read with another encoding', async ({ page }) => {
  await ready(page);
  const cp1252 = (s: string) => Uint8Array.from(Array.from(s, (c) => c.charCodeAt(0)));
  const sav = buildSav({
    vars: [{ name: 'REGION', width: 0, label: cp1252('Région') }, { name: 'NOM', width: 12, label: cp1252('Nom') }],
    records: [valueLabels(true, [[1, cp1252('Île-de-France')]], [1])],
    cases: [[1, cp1252('Béatrice')]],
  });
  await drop(page, 'legacy.sav', sav);
  const dlg = page.getByRole('dialog', { name: 'Text encoding of legacy.sav' });
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('table')).toContainText('Île-de-France');
  await dlg.getByLabel('Character encoding').selectOption('utf-8');
  await expect(dlg.locator('table')).toContainText('R�gion');
  await dlg.getByLabel('Character encoding').selectOption('windows-1252');
  await dlg.getByRole('button', { name: 'Re-read with this encoding' }).click();
  await expect(dlg).toHaveCount(0);
  await expect(page.locator('.grid-cell[data-r="0"][data-c="1"]')).toHaveText('Béatrice');
});

test('typing long text widens a string variable instead of cutting it', async ({ page }) => {
  await ready(page);
  const col = await page.locator('.grid-hcell', { hasText: /^interviewer$/ }).getAttribute('data-hc');
  const cell = page.locator(`.grid-cell[data-r="0"][data-c="${col}"]`);
  await cell.click();
  await page.keyboard.type('Interviewer number 12');
  await page.keyboard.press('Enter');
  await expect(cell).toHaveText('Interviewer number 12');
  await expect(toasts(page).filter({ hasText: 'Widened interviewer to 21 characters' })).toBeVisible();
  await page.keyboard.press('Control+z');
  await expect(cell).toHaveText('INT01');
});

test('pasting from Excel reports cells that did not fit', async ({ page }) => {
  await ready(page);
  const col = await page.locator('.grid-hcell', { hasText: /^age$/ }).getAttribute('data-hc');
  await page.locator(`.grid-cell[data-r="0"][data-c="${col}"]`).click();
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.setData('text/plain', '21\r\nNA\r\n"1,234"\r\n');
    document.querySelector('.grid-scroll')!.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await expect(page.locator(`.grid-cell[data-r="0"][data-c="${col}"]`)).toHaveText('21');
  await expect(page.locator(`.grid-cell[data-r="2"][data-c="${col}"]`)).toHaveText('1234');
  await expect(toasts(page).filter({ hasText: '1 pasted value did not fit its variable' })).toBeVisible();
});

test('compute takes its type from the formula; alpha is logged with the scale', async ({ page }) => {
  await ready(page);
  await menu(page, 'Transform', 'Compute variable...');
  await page.locator('#cv-target').fill('tag');
  await page.locator('#cv-expr').fill("CONCAT(RTRIM(interviewer), '-', LTRIM(STRING(resp_id, F4.0)))");
  await expect(page.locator('.preview-table')).toContainText('INT01-1001');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.sidebar-var', { hasText: 'tag' })).toBeVisible();

  await menu(page, 'Transform', 'Create scale / index...');
  const items = page.locator('.modal').getByRole('listbox', { name: 'Items', exact: true });
  for (const n of ['trust1', 'trust2', 'trust4', 'trust5']) await items.getByRole('option', { name: new RegExp(`^${n}\\b`) }).click();
  await expect(page.locator('.modal .callout')).toContainText("Cronbach's alpha");
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await page.getByRole('tab', { name: /Output/ }).click();
  await expect(page.locator('#main')).toContainText("Cronbach's alpha =");
});

test('turning the filter or weight off from the chip is logged with its syntax', async ({ page }) => {
  await ready(page);
  await menu(page, 'Data', 'Weight cases...');
  await page.locator('.modal').getByLabel(/Weight cases by/).check();
  await page.locator('.modal').getByRole('listbox', { name: 'Weight variable', exact: true }).getByRole('option', { name: /^wt\b/ }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.chip-weight')).toBeVisible();
  await page.getByRole('button', { name: 'Turn weighting off' }).click();
  await expect(page.locator('.chip-weight')).toHaveCount(0);
  await expect(page.locator('#tab-output .badge')).toHaveText('2');
  await page.getByRole('tab', { name: /Output/ }).click();
  await expect(page.locator('#main')).toContainText('WEIGHT OFF.');
});

test('Excel round trip keeps the dictionary; the labelled export has its own file name', async ({ page }) => {
  await ready(page);
  const save = async (label: string) => {
    await page.getByRole('menuitem', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Save data as' }).click();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: label }).click()]);
    return dl;
  };
  const codes = await save('Excel with codes');
  const labels = await save('Excel with value labels');
  expect(codes.suggestedFilename()).toBe('Urban trust survey (sample).xlsx');
  expect(labels.suggestedFilename()).toBe('Urban trust survey (sample)_labels.xlsx');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.keyboard.press('Control+o')]);
  await fc.setFiles({ name: codes.suggestedFilename(), mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: readFileSync((await codes.path())!) });
  await page.getByLabel('Sheet').selectOption({ label: 'Data' });
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(toasts(page).filter({ hasText: 'restored from the "Variables" sheet' })).toBeVisible();
  await page.getByRole('tab', { name: 'Variable View' }).click();
  const trust1 = page.locator('.vv-row', { has: page.locator('.vv-name', { hasText: /^trust1$/ }) });
  await expect(trust1.locator('.vv-values')).toContainText('1 = Strongly disagree');
  await expect(trust1.locator('.vv-missing')).toContainText('8, 9');
  await expect(trust1.locator('.vv-measure')).toContainText('Ordinal');
});

test('a restored session with unsaved edits still asks before it is replaced', async ({ page }) => {
  await ready(page);
  const col = await page.locator('.grid-hcell', { hasText: /^age$/ }).getAttribute('data-hc');
  await page.locator(`.grid-cell[data-r="0"][data-c="${col}"]`).click();
  await page.keyboard.type('66');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2200);
  await page.reload();
  await expect(toasts(page).filter({ hasText: 'Restored your last session' })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.modified-dot')).toBeVisible();
  await drop(page, 'x.sav', readFileSync(FIX + 'main_bytecode.sav'));
  await expect(page.getByRole('dialog', { name: 'Replace the open data?' })).toBeVisible();
});

test('inside a sandboxed Artifact iframe, files go through downloads.save and .sav is zipped', async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    if (window.parent === window) return;
    const w = window as unknown as Record<string, unknown>;
    w.__saves = [];
    for (const k of ['alert', 'confirm', 'prompt', 'print']) w[k] = () => { throw new Error(`${k} is blocked`); };
    w.claude = {
      use: async (name: string) => (name === 'downloads' ? { save: async ({ filename, data }: { filename: string; data: Blob }) => { (w.__saves as unknown[]).push({ filename, type: data.type }); } } : null),
    };
    Object.defineProperty(window, 'indexedDB', { value: { open() { throw new Error('SecurityError'); } }, configurable: true });
  });
  await page.route('**/__wrap.html', (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta charset=utf-8></head><body style="margin:0"><iframe id=f src="${baseURL}/" sandbox="allow-scripts allow-same-origin allow-popups" style="border:0;width:100vw;height:100vh"></iframe></body></html>` }));
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__wrap.html');
  const f = page.frameLocator('#f');
  await expect(f.locator('.dataset-size')).toContainText('640 cases', { timeout: 30_000 });
  for (const item of ['SPSS data (.sav)', 'CSV with codes']) {
    await f.getByRole('menuitem', { name: 'File', exact: true }).click();
    await f.getByRole('menuitem', { name: 'Save data as' }).click();
    await f.getByRole('menuitem', { name: item }).click();
    await expect(f.locator('.toast').filter({ hasText: 'Saved' }).last()).toBeVisible();
  }
  const frame = page.frames().find((fr) => fr !== page.mainFrame())!;
  const saves = await frame.evaluate(() => (window as unknown as { __saves: Array<{ filename: string; type: string }> }).__saves);
  expect(saves).toEqual([
    { filename: 'Urban trust survey (sample).sav.zip', type: 'application/zip' },
    { filename: 'Urban trust survey (sample).csv', type: 'text/csv' },
  ]);
  expect(errors).toEqual([]);
});

test('phone width: menu sheet keeps focus inside and no screen or dialog scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await ready(page);
  const noSideScroll = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('.menu-sheet-btn').click();
  const sheet = page.getByRole('dialog', { name: 'Menu' });
  await expect(sheet).toBeVisible();
  for (let i = 0; i < 14; i++) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('.menu-sheet'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('.menu-sheet-btn')).toBeFocused();
  for (const tab of ['Variable View', 'Output', 'Text coding', 'Data View']) {
    await page.getByRole('tab', { name: new RegExp(tab) }).click();
    await noSideScroll();
  }
  for (const item of ['Compute variable...', 'Recode into different variables...', 'Visual binning...']) {
    await page.locator('.menu-sheet-btn').click();
    const t = page.getByRole('button', { name: 'Transform', exact: true });
    if ((await t.getAttribute('aria-expanded')) !== 'true') await t.click();
    await page.getByRole('button', { name: item, exact: true }).click();
    await expect(page.locator('.modal')).toBeVisible();
    await noSideScroll();
    const box = await page.locator('.modal').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(400.5);
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal')).toHaveCount(0);
  }
});
