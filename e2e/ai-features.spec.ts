// App-wide AI features against a mocked Gemini API: the AI menu and the AI chip, set-up help that
// names the feature, the "AI is ready. Try it" panel, "do this first" dialogs, and Explain with AI
// on an Output item (preview of what will be sent, streamed answer, Add to output).
import { expect, test, type Page, type Route } from '@playwright/test';
import { openWithSample } from './helpers';

const GEMINI = 'https://generativelanguage.googleapis.com/**';
const cors = { 'Access-Control-Allow-Origin': '*' };
const reply = (text: string) => ({ candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }] });

async function mockGemini(page: Page, calls: Array<{ url: string; prompt: string }>) {
  await page.route(GEMINI, async (route: Route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-3.6-flash', supportedGenerationMethods: ['generateContent'] }] }) });
    }
    const body = req.postDataJSON();
    calls.push({ url: req.url(), prompt: body.contents[0].parts[0].text });
    if (req.url().includes('streamGenerateContent')) {
      const ev = (t: string) => `data: ${JSON.stringify(reply(t))}\r\n\r\n`;
      return route.fulfill({
        status: 200,
        headers: cors,
        contentType: 'text/event-stream',
        body: ev('## What was tested\nWhether attending civic meetings differs ') + ev('between migrants and non-migrants.\n\n## Cautions\n- Association is not causation.'),
      });
    }
    return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(reply('OK')) });
  });
}

async function menu(page: Page, ...path: string[]) {
  await page.getByRole('menuitem', { name: path[0], exact: true }).click();
  for (const p of path.slice(1)) await page.getByRole('menuitem', { name: p, exact: true }).click();
}

async function addVar(page: Page, slot: number, name: string) {
  const search = page.locator('.modal input[aria-label="Search variables"]');
  await search.fill(name);
  await page.locator('.pd-list .pd-var').filter({ has: page.locator('.vl-name', { hasText: `[${name}]` }) }).first().click();
  await page.locator('.modal .pd-slot-row').nth(slot).locator('button.pd-arrow').click();
  await search.fill('');
}

test('AI not set up: the AI menu, the chip and Text coding lead to set-up that names the feature', async ({ page }) => {
  await openWithSample(page);
  const chip = page.locator('.ai-chip');
  await expect(chip).toHaveAttribute('data-ready', 'no');
  await expect(chip).toContainText('not set up');

  await menu(page, 'AI', 'Explain a result...');
  const settings = page.getByRole('dialog', { name: 'AI assistant' });
  await expect(settings).toBeVisible();
  await expect(settings.locator('.ai-intent')).toContainText('Explain a result needs AI help');
  await expect(settings.locator('.ai-intent')).toContainText('what the numbers mean');
  await settings.getByRole('button', { name: 'Done' }).click();

  // The chip's popover lists what AI can do.
  await chip.click();
  const pop = page.getByRole('dialog', { name: 'AI help' });
  await expect(pop).toContainText('AI help is not set up');
  await expect(pop.getByRole('listitem')).toHaveText([/Ask the Socius assistant/, /Explain a result/, /Suggest a codebook/, /Suggest codes for open-ended answers/, /Summarise a code/]);
  await pop.getByRole('listitem').filter({ hasText: 'Suggest a codebook' }).click();
  await expect(settings.locator('.ai-intent')).toContainText('Suggest a codebook needs AI help');
  await settings.getByRole('button', { name: 'Done' }).click();

  // Text coding: the AI group is visible but disabled, with a set-up link.
  await page.getByRole('tab', { name: 'Text coding' }).click();
  const trigger = page.locator('.cw-ai-group .cw-menu-trigger');
  await expect(trigger).toBeVisible();
  await expect(trigger).toBeDisabled();
  await page.locator('.cw-ai-group').getByRole('button', { name: 'Set up AI' }).click();
  await expect(settings).toBeVisible();
  await settings.getByRole('button', { name: 'Done' }).click();

  // Explain with AI on a result opens set-up first.
  await menu(page, 'Analyze', 'Descriptive Statistics', 'Frequencies...');
  await addVar(page, 0, 'gender');
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await page.locator('.oi-explain').first().click();
  await expect(settings.locator('.ai-intent')).toContainText('Explain a result');
});

test('set up Gemini, "AI is ready. Try it", run Crosstabs, Explain with AI (streamed), Add to output', async ({ page }) => {
  const calls: Array<{ url: string; prompt: string }> = [];
  await mockGemini(page, calls);
  await openWithSample(page);
  await menu(page, 'AI', 'AI assistant settings...');
  const settings = page.getByRole('dialog', { name: 'AI assistant' });
  await settings.getByRole('radio', { name: /Google Gemini/ }).check();
  await settings.locator('#ai-gemini-key').fill('AIza-e2e');
  await expect(page.locator('.ai-chip')).toHaveAttribute('data-ready', 'yes');
  await expect(page.locator('.ai-chip')).toContainText('Gemini');
  await expect(settings.locator('.ai-ready')).toHaveCount(0);
  await settings.getByRole('button', { name: 'Test connection' }).click();
  const ready = settings.locator('.ai-ready');
  await expect(ready).toContainText('AI is ready. Try it:');
  await expect(ready.getByRole('button')).toHaveText(['Ask the Socius assistant', 'Explain a result', 'Suggest a codebook', 'Suggest codes for open-ended answers', 'Summarise a code']);

  // No results yet: "Run an analysis first, for example Crosstabs".
  await ready.getByRole('button', { name: 'Explain a result' }).click();
  await expect(settings).toHaveCount(0);
  const pre = page.getByRole('dialog', { name: 'Run an analysis first' });
  await expect(pre).toContainText('for example Crosstabs');
  await pre.getByRole('button', { name: 'Open Crosstabs' }).click();
  await expect(page.locator('.modal h2')).toHaveText('Crosstabs');
  await addVar(page, 0, 'civic_meet');
  await addVar(page, 1, 'migrant');
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal')).toHaveCount(0);

  const item = page.locator('.ov-doc article').last();
  await item.getByRole('button', { name: 'Explain with AI' }).click();
  const panel = item.locator('.ai-explain');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.ai-note')).toContainText('will be sent to Google Gemini (gemini-3.6-flash)');
  await expect(panel.locator('.ai-note')).toContainText('no individual answers');
  await panel.getByText(/What will be sent/).click();
  await expect(panel.locator('.ai-preview-text')).toContainText('Pearson Chi-Square');
  await expect(panel.locator('.ai-preview-text')).toContainText('What the numbers mean');
  const before = calls.length; // only the connection test so far
  expect(calls.every((c) => !c.url.includes('streamGenerateContent'))).toBe(true);

  await panel.getByRole('button', { name: 'Explain', exact: true }).click();
  await expect(panel.locator('.ai-explain-text')).toContainText('Whether attending civic meetings differs between migrants and non-migrants.');
  await expect(panel.locator('.ai-explain-text h4').first()).toHaveText('What was tested');
  await expect(panel).toContainText('AI-generated: check against the tables');
  expect(calls).toHaveLength(before + 1);
  const sent = calls[calls.length - 1];
  expect(sent.url).toContain(':streamGenerateContent?alt=sse');
  expect(sent.prompt).toContain('Pearson Chi-Square');
  expect(sent.prompt).toContain('Crosstabulation');
  expect(sent.prompt).not.toContain('Urban trust survey'); // the dataset name stays here
  await expect(panel.getByRole('button', { name: 'Discuss with the assistant' })).toBeVisible();

  await panel.getByRole('button', { name: 'Add to output' }).click();
  await expect(item.locator('.ai-explain')).toHaveCount(0);
  const note = item.locator('.ob-ai-note');
  await expect(note).toContainText('AI-generated');
  await expect(note).toContainText('Google Gemini');
  await expect(note).toContainText('Association is not causation.');
});

test('AI ready but data missing: "do this first" with a button', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('socius.ai', JSON.stringify({ provider: 'gemini', gemini: { apiKey: 'AIza-e2e', model: 'gemini-3.6-flash' } })));
  await mockGemini(page, []);
  await openWithSample(page);
  await menu(page, 'AI', 'Suggest codes for open-ended answers...');
  const pre = page.getByRole('dialog', { name: 'Import open-ended answers first' });
  await expect(pre).toContainText('one answer per respondent');
  await pre.getByRole('button', { name: 'Import answers from a survey question' }).click();
  await expect(page.locator('#cw-svar')).toBeVisible();
  await page.keyboard.press('Escape');

  await menu(page, 'AI', 'Summarise a code...');
  await expect(page.getByRole('dialog', { name: 'Code some text first' })).toBeVisible();
  await page.keyboard.press('Escape');

  // Search finds the AI commands too.
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox', { name: 'Search Socius' }).fill('explain');
  await expect(page.getByRole('option').first()).toContainText('Explain a result');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Run an analysis first' })).toBeVisible();
});

test('phone width: the AI menu in the menu sheet and the AI chip popover fit the screen', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await openWithSample(page);
  await page.locator('.menu-sheet-btn').click();
  await page.getByRole('button', { name: 'AI', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Explain a result...', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ask the Socius assistant...', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explain a result...', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'AI assistant' }).locator('.ai-intent')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.ai-chip').click();
  const pop = page.getByRole('dialog', { name: 'AI help' });
  const box = await pop.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(400.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
