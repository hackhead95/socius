// Error log: problems are logged without data values, file names or keys; Help > Error log lists them;
// Copy report works; the feedback dialog prefills the GitHub form with a short summary.
// (The error screens for render errors are tested with a React render in tests/app/error-boundary.test.tsx:
// there is no way to force a render error in the production build.)
import { expect, test, type Page, type Route } from '@playwright/test';
import { openWithSample } from './helpers';

const KEY = 'AIzaSyE2eSecretKey_0123456789abcdefXYZ';
const GEMINI = 'https://generativelanguage.googleapis.com/**';

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
  await expect(page.locator('.menubar .menu-dot')).toHaveCount(0);

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

  // A calm dot on Help says something was logged.
  await expect(page.locator('.menubar .menu-dot')).toHaveCount(1);

  const dlg = await openErrorLog(page);
  await expect(page.locator('.menubar .menu-dot')).toHaveCount(0);
  const items = dlg.locator('.errlog-item');
  const aiItem = items.filter({ has: page.locator('.errlog-area', { hasText: /^AI$/ }) });
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
  await dlg.getByLabel('Filter by area').selectOption('ai');
  await expect(dlg.locator('.errlog-item')).toHaveCount(1);
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
