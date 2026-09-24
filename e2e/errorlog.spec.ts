// Error log: problems are logged without data values, file names or keys; Help > Error log lists them;
// Copy report works; the feedback dialog prefills the GitHub form with a short summary.
// (The error screens for render errors are tested with a React render in tests/app/error-boundary.test.tsx:
// there is no way to force a render error in the production build.)
import { expect, test, type Page, type Route } from '@playwright/test';
import { openWithSample } from './helpers';

const KEY = 'AIzaSyE2eSecretKey_0123456789abcdefXYZ';
const GEMINI = 'https://generativelanguage.googleapis.com/**';

/** The calm dot on the Help menu button (not the Help menu's items, not the phone menu sheet). */
function helpDot(page: Page) {
  return page.locator('.menubar').getByRole('menuitem', { name: 'Help', exact: true }).locator('.menu-dot');
}

/** Error-level entries in the stored log (the dot follows them). */
async function storedErrors(page: Page): Promise<number> {
  return page.evaluate(() => {
    try {
      return ((JSON.parse(localStorage.getItem('socius.errorlog') ?? '{}').entries ?? []) as Array<{ level: string }>).filter((e) => e.level === 'error').length;
    } catch {
      return 0;
    }
  });
}

async function openErrorLog(page: Page) {
  await page.getByRole('menuitem', { name: 'Help', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Error log...' }).click();
  const dlg = page.getByRole('dialog', { name: 'Error log' });
  await expect(dlg).toBeVisible();
  return dlg;
}

test('failed file open and an AI 500 are logged without data, file names or keys; Copy report works', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // Gemini set up with a key; the service answers 500 and echoes the key in its message.
  await page.addInitScript((key) => {
    if (!localStorage.getItem('socius.ai')) localStorage.setItem('socius.ai', JSON.stringify({ provider: 'gemini', gemini: { apiKey: key, model: 'gemini-2.5-flash' } }));
  }, KEY);
  await page.route(GEMINI, async (route: Route) => {
    const cors = { 'Access-Control-Allow-Origin': '*' };
    if (route.request().method() === 'GET')
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] }] }) });
    return route.fulfill({ status: 500, headers: cors, contentType: 'application/json', body: JSON.stringify({ error: { code: 500, message: `Internal error while serving key=${KEY}`, status: 'INTERNAL' } }) });
  });
  await openWithSample(page);
  // No dot on Help yet.
  await expect(page.locator('.menubar').getByRole('menuitem', { name: 'Help', exact: true })).toBeVisible();
  await expect(helpDot(page)).toHaveCount(0);

  // 1. A broken "SPSS" file whose name and contents are confidential.
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.keyboard.press('Control+o')]);
  await fc.setFiles({ name: 'Confidential Respondents Wave2.sav', mimeType: 'application/octet-stream', buffer: Buffer.from('Maria Lopez;42;Leeds;HIV positive\n'.repeat(20)) });
  await expect(page.locator('.toast').filter({ hasText: /SPSS|open|read/i }).first()).toBeVisible();

  // 2. An AI request that fails with HTTP 500 (AI > AI assistant settings > Test connection).
  await page.getByRole('menuitem', { name: 'AI', exact: true }).click();
  await page.getByRole('menuitem', { name: 'AI assistant settings...' }).click();
  const ai = page.getByRole('dialog', { name: 'AI assistant' });
  await ai.getByRole('button', { name: 'Test connection' }).click();
  await expect(ai.locator('.ai-test-result .text-bad')).toBeVisible();
  await ai.getByRole('button', { name: 'Done' }).click();

  // A calm dot on Help says something was logged. The dot follows the error-level entries of this
  // session (the file problem is a warning; the AI 500 is an error), so wait for the entry first:
  // the Test connection check logs it after its steps finish, and menus re-render after that.
  await expect.poll(() => storedErrors(page), { timeout: 15_000 }).toBeGreaterThan(0);
  await expect(helpDot(page)).toHaveCount(1);
  // The dot is decoration: the Help button keeps its name and says why in its description.
  await expect(page.locator('#help-errors-note')).toHaveText('New problems in Help, Error log');

  const dlg = await openErrorLog(page);
  await expect(helpDot(page)).toHaveCount(0);
  const items = dlg.locator('.errlog-item');
  // One AI error (the 500). AI may also log info entries (timings), which are not counted here.
  const aiItems = items.filter({ has: page.locator('.errlog-area', { hasText: /^AI$/ }) });
  const aiItem = aiItems.filter({ has: page.locator('.errlog-level', { hasText: /^Error$/ }) });
  await expect(aiItem).toHaveCount(1);
  await expect(aiItem.locator('.errlog-level')).toHaveText('Error');
  const fileItem = items.filter({ has: page.locator('.errlog-area', { hasText: 'Opening files' }) });
  await expect(fileItem.first()).toContainText('not a valid SPSS data file');
  // Details: the service error code, and context: sizes and settings only.
  await aiItem.locator('summary').click();
  await expect(aiItem.locator('.errlog-detail')).toContainText('Code: ');
  await expect(aiItem.locator('.errlog-detail')).toContainText('AI gemini');
  await expect(aiItem.locator('.errlog-detail')).toContainText(/data \d[\d,]* cases x \d+ variables/);
  // Filters.
  const nAi = await aiItems.count();
  await dlg.getByLabel('Filter by area').selectOption('ai');
  await expect(dlg.locator('.errlog-item')).toHaveCount(nAi);
  await expect(dlg.locator('.errlog-item').filter({ hasNot: page.locator('.errlog-area', { hasText: /^AI$/ }) })).toHaveCount(0);
  await dlg.getByLabel('Filter by area').selectOption('all');

  // Nothing confidential anywhere: dialog, stored log, copied report.
  const dialogText = (await dlg.textContent()) ?? '';
  const stored = await page.evaluate(() => localStorage.getItem('socius.errorlog') ?? '');
  await dlg.getByRole('button', { name: 'Copy report' }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Error report copied' })).toBeVisible();
  const report = await page.evaluate(() => navigator.clipboard.readText());
  expect(report).toMatch(/^Socius error report/);
  expect(report).toContain('ERROR  ai');
  expect(report).toContain('WARN  import');
  expect(report).toMatch(/Version: \d+\.\d+\.\d+/);
  for (const text of [dialogText, stored, report]) {
    for (const secret of [KEY, 'AIzaSy', 'Confidential', 'Respondents', 'Maria', 'Lopez', 'Leeds', 'HIV']) expect(text, secret).not.toContain(secret);
  }

  // Clear asks in the page first.
  await dlg.getByRole('button', { name: 'Clear log...' }).click();
  await dlg.getByRole('button', { name: 'Clear log', exact: true }).click();
  await expect(dlg.getByText('No problems logged')).toBeVisible();
});

test('Send feedback offers the error report and prefills the form; Search finds the error log', async ({ page, context }) => {
  await context.route('https://github.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>GitHub</title>' }));
  await openWithSample(page);
  // Search: "report a problem" and "diagnostics" find the error log.
  await page.keyboard.press('Control+k');
  const search = page.getByRole('dialog', { name: /Search/ });
  await search.getByRole('combobox').fill('diagnostics');
  await expect(search.getByRole('option').first()).toContainText('Error log');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Error log' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.locator('.topbar-feedback').click();
  const fb = page.getByRole('dialog', { name: 'Send feedback or report a problem' });
  await expect(fb).toBeVisible();
  await expect(fb.getByRole('button', { name: 'Copy error report' })).toBeVisible();
  await expect(fb.locator('.feedback-preview')).toContainText('Version:');
  const popup = page.waitForEvent('popup');
  await fb.getByRole('button', { name: 'Open the feedback form' }).click();
  const p = await popup;
  const url = new URL(p.url());
  await p.close();
  expect(url.origin + url.pathname).toBe('https://github.com/hackhead95/socius/issues/new');
  expect(url.searchParams.get('template')).toBe('bug_report.yml');
  expect(url.searchParams.get('error-report')).toContain('Version:');
  expect(url.searchParams.get('browser')).toMatch(/Chrome/);
  expect(p.url().length).toBeLessThan(6000);
});

test('a code file missing after an update shows "Socius was updated" with Reload, not a broken feature', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await openWithSample(page);
  // A result to export.
  await page.getByRole('menuitem', { name: 'Analyze', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Descriptive Statistics', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Frequencies...', exact: true }).click();
  await page.locator('.modal input[aria-label="Search variables"]').fill('gender');
  await page.locator('.modal .pd-list .pd-var').filter({ has: page.locator('.vl-name', { hasText: '[gender]' }) }).first().click();
  await page.locator('.modal .pd-slot-row').nth(0).locator('button.pd-arrow').click();
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  // As after a new version is published: the old version's Word-export code file is gone.
  await page.route(/\/assets\/[^/]*[Dd]ocx[^/]*\.js$/, (r) => r.fulfill({ status: 404, body: 'Not found' }));
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Export output report' }).click();
  await page.getByRole('menuitem', { name: 'Word document (.docx)' }).click();
  const banner = page.locator('.update-banner');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('Socius was updated. Reload to get the new version.');
  // Logged calmly (a warning about the network), not as an error; the app keeps working.
  const log = await page.evaluate(() => JSON.parse(localStorage.getItem('socius.errorlog') ?? '{}').entries ?? []);
  expect(log.some((e: { level: string; area: string }) => e.level === 'warn' && e.area === 'network')).toBe(true);
  expect(log.filter((e: { level: string }) => e.level === 'error')).toEqual([]);
  await expect(page.locator('.menubar .menu-dot')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
  // Reload gets the page again (autosave brings the work back) and the banner is gone.
  await page.unroute(/\/assets\/[^/]*[Dd]ocx[^/]*\.js$/);
  await banner.getByRole('button', { name: 'Reload' }).click();
  await page.waitForLoadState('load');
  await expect(page.locator('.update-banner')).toHaveCount(0);
  await expect(page.locator('.dataset-size')).toContainText('cases', { timeout: 30_000 });
});
