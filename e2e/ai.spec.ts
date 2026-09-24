// AI assistant on the independent site: settings dialog, Gemini with a mocked network, AI coding end to
// end against the mocked Gemini API, and the Help menu / feedback links. (The on-device model needs
// WebGPU and a model download, neither of which exists in this headless browser: only its "not
// supported" path is exercised here.)
import { expect, test, type Page, type Route } from '@playwright/test';
import { loadSampleFromWelcome, openWithSample } from './helpers';

const GEMINI = 'https://generativelanguage.googleapis.com/**';

async function ready(page: Page) {
  await openWithSample(page);
}

async function openSettingsFromHelp(page: Page) {
  await page.getByRole('menuitem', { name: 'Help', exact: true }).click();
  await page.getByRole('menuitem', { name: 'AI assistant settings...' }).click();
  const dlg = page.getByRole('dialog', { name: 'AI assistant' });
  await expect(dlg).toBeVisible();
  return dlg;
}

function geminiReply(text: string) {
  return { candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }] };
}

/** No WebGPU, as on many browsers, so the on-device option shows its explanation deterministically. */
async function noWebGpu(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'gpu', { get: () => undefined, configurable: true });
  });
}

test('AI settings: open from Help, Gemini key guide, privacy notice, test connection success and failures', async ({ page }) => {
  await noWebGpu(page);
  let mode: 'ok' | 'badkey' | 'quota' = 'ok';
  const seen: Array<{ url: string; key: string | undefined; body: any }> = [];
  const listed: string[] = [];
  await page.route(GEMINI, async (route: Route) => {
    const req = route.request();
    const cors = { 'Access-Control-Allow-Origin': '*' };
    if (req.method() === 'GET' && req.url().includes('/models?')) {
      // The model list: Socius picks the newest stable Flash model the key can use.
      listed.push(req.headers()['x-goog-api-key'] ?? '');
      const names = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.6-flash-image', 'gemini-3.6-pro'];
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ models: names.map((n) => ({ name: `models/${n}`, supportedGenerationMethods: ['generateContent'] })) }) });
    }
    seen.push({ url: req.url(), key: req.headers()['x-goog-api-key'], body: req.postDataJSON() });
    if (mode === 'badkey')
      return route.fulfill({ status: 400, headers: cors, contentType: 'application/json', body: JSON.stringify({ error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT', details: [{ reason: 'API_KEY_INVALID' }] } }) });
    if (mode === 'quota')
      return route.fulfill({ status: 429, headers: cors, contentType: 'application/json', body: JSON.stringify({ error: { code: 429, message: 'Resource has been exhausted', status: 'RESOURCE_EXHAUSTED' } }) });
    return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(geminiReply('OK')) });
  });
  await ready(page);
  const dlg = await openSettingsFromHelp(page);
  // No Claude outside the artifact; the free options are offered.
  await expect(dlg.locator('.ai-choice-title')).toHaveText([/On this computer/, /Google Gemini/, /Other service/]);
  await expect(dlg.locator('.ai-choice', { hasText: 'Claude' })).toHaveCount(0);

  // On-device without WebGPU: explain which browsers work and suggest Gemini.
  await dlg.getByRole('radio', { name: /On this computer/ }).check();
  await expect(dlg.locator('.ai-privacy')).toHaveAttribute('data-privacy', 'local');
  await expect(dlg.locator('.ai-privacy')).toContainText('nothing leaves your computer');
  await expect(dlg.locator('.ai-gpu')).toContainText('Chrome or Edge');
  await expect(dlg.locator('.ai-gpu')).toContainText('Google Gemini');
  await expect(dlg.getByRole('button', { name: 'Test connection' })).toBeDisabled();

  await dlg.getByRole('radio', { name: /Google Gemini/ }).check();
  await expect(dlg.locator('.ai-steps')).toContainText('Get a free key in 1 minute');
  await expect(dlg.getByRole('link', { name: 'Google AI Studio' })).toHaveAttribute('href', 'https://aistudio.google.com/apikey');
  await expect(dlg.locator('.ai-privacy')).toHaveAttribute('data-privacy', 'google');
  await expect(dlg.locator('.ai-privacy')).toContainText('human reviewers may read it');
  await expect(dlg.locator('.ai-privacy')).toContainText('anonymise');
  await expect(dlg.locator('#ai-gemini-model')).toHaveValue(''); // empty = automatic
  const key = dlg.locator('#ai-gemini-key');
  await expect(key).toHaveAttribute('type', 'password');
  await key.fill('AIza-e2e-key');
  await dlg.getByRole('button', { name: 'Show' }).click();
  await expect(key).toHaveAttribute('type', 'text');
  // Nothing is sent until Test connection is clicked.
  expect(seen).toHaveLength(0);

  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(dlg.locator('.ai-test-result')).toContainText('Connected to gemini-3.6-flash');
  expect(listed).toEqual(['AIza-e2e-key']);
  expect(seen).toHaveLength(1);
  expect(seen[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent');
  expect(seen[0].key).toBe('AIza-e2e-key');
  expect(seen[0].url).not.toContain('AIza');

  mode = 'badkey';
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(dlg.locator('.ai-test-result .text-bad')).toContainText('did not accept the key');
  mode = 'quota';
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(dlg.locator('.ai-test-result .text-bad')).toContainText('Too many AI requests');

  // The key is kept in this browser's localStorage only.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('socius.ai') ?? '{}'));
  expect(stored).toMatchObject({ provider: 'gemini', gemini: { apiKey: 'AIza-e2e-key', model: '' } });
  await dlg.getByRole('button', { name: 'Forget key' }).click();
  await expect(key).toHaveValue('');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('socius.ai') ?? '{}').gemini.apiKey)).toBe('');

  // Other service: presets fill the base URL.
  await dlg.getByRole('radio', { name: /Other service/ }).check();
  await dlg.locator('#ai-oa-preset').selectOption('openrouter');
  await expect(dlg.locator('#ai-oa-url')).toHaveValue('https://openrouter.ai/api/v1');
  await dlg.locator('#ai-oa-preset').selectOption('groq');
  await expect(dlg.locator('#ai-oa-url')).toHaveValue('https://api.groq.com/openai/v1');
  await expect(dlg.locator('.ai-privacy')).toContainText('api.groq.com');
  await dlg.getByRole('button', { name: 'Done' }).click();
  await expect(dlg).toHaveCount(0);
});

/** Import q_challenge (630 answers) as responses. */
async function importChallenge(page: Page) {
  await page.getByRole('menuitem', { name: 'Text coding', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Import open-ended answers from dataset…' }).click();
  const sel = page.locator('#cw-svar');
  const opts = await sel.locator('option').allInnerTexts();
  await sel.selectOption({ index: opts.findIndex((o) => o.includes('q_challenge')) });
  await page.locator('.modal .btn-primary').click();
  await expect(page.locator('.cw-resp-tools .help')).toHaveText('630 shown · 0 of 630 coded');
}

test('AI coding end to end against a mocked Gemini: suggest a codebook, suggest codes, streamed summary', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('socius.ai', JSON.stringify({ provider: 'gemini', gemini: { apiKey: 'AIza-e2e', model: 'gemini-3.6-flash' } }));
  });
  const calls: Array<{ url: string; body: any }> = [];
  await page.route(GEMINI, async (route) => {
    const req = route.request();
    const body = req.postDataJSON();
    calls.push({ url: req.url(), body });
    const prompt: string = body.contents[0].parts[0].text;
    const cors = { 'Access-Control-Allow-Origin': '*' };
    if (req.url().includes('streamGenerateContent')) {
      const ev = (t: string) => `data: ${JSON.stringify(geminiReply(t))}\r\n\r\n`;
      return route.fulfill({ status: 200, headers: cors, contentType: 'text/event-stream', body: ev('Residents describe irregular supply ') + ev('and reliance on tankers.') });
    }
    if (/propose a codebook/.test(prompt)) {
      // Fenced JSON: the tolerant parser must cope.
      const json = { codes: [
        { name: 'Civic infrastructure', parent: null, description: 'Municipal services', inclusion: '', exclusion: '', examples: ['water supply'] },
        { name: 'Water insecurity', parent: 'Civic infrastructure', description: 'Irregular supply', inclusion: '', exclusion: '', examples: [] },
      ] };
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(geminiReply('```json\n' + JSON.stringify(json) + '\n```')) });
    }
    const items = [...prompt.matchAll(/\{"id":"(r\d+)","text":"((?:[^"\\]|\\.)*)"\}/g)];
    const out = items.map((m) => ({ id: m[1], codes: /water/i.test(m[2]) ? ['water'] : [] }));
    return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(geminiReply(JSON.stringify(out))) });
  });
  await ready(page);
  await importChallenge(page);
  await page.locator('input[aria-label="New code name"]').fill('water');
  await page.locator('.cw-newcode button[type=submit]').click();
  await expect(page.locator('.cw-ainote')).toHaveCount(0);
  expect(calls).toHaveLength(0);

  const aiMenu = async (item: string) => {
    await page.locator('.cw-toolbar .cw-menu-trigger', { hasText: 'AI suggestions' }).click();
    await page.locator('.cw-menu-list [role=menuitem]', { hasText: item }).click();
  };
  await aiMenu('Suggest a codebook');
  const dlg = page.getByRole('dialog', { name: 'Suggest a codebook' });
  // Before sending: which provider, how much.
  await expect(dlg.locator('.ai-note')).toContainText('will be sent to Google Gemini (gemini-3.6-flash)');
  await expect(dlg.locator('.ai-note')).toContainText(/up to \d+ excerpts/);
  expect(calls).toHaveLength(0);
  await dlg.getByRole('button', { name: 'Suggest codes' }).click();
  await expect(dlg.locator('.cw-suggest')).toHaveCount(2);
  expect(calls).toHaveLength(1);
  expect(calls[0].body.generationConfig.responseMimeType).toBe('application/json');
  await dlg.getByRole('button', { name: 'Add 2 codes' }).click();
  await expect(page.locator('.cw-code[aria-level="2"]')).toHaveText(/Water insecurity/);

  await aiMenu('Suggest codes for responses');
  const sdlg = page.getByRole('dialog', { name: 'Suggest codes for responses' });
  await sdlg.locator('#cw-smax').selectOption('50');
  await expect(sdlg.locator('.ai-note')).toContainText('50 responses and your codebook will be sent to Google Gemini');
  await sdlg.locator('.btn-primary').click();
  await expect(sdlg.locator('.help', { hasText: 'batches done' })).toBeVisible();
  const rows = sdlg.locator('.cw-suggest-row');
  await expect(rows.first()).toContainText('water');
  const n = await rows.count();
  await sdlg.getByRole('button', { name: /Accept all/ }).click();
  await sdlg.locator('[data-close]').click();
  await expect(page.locator('.cw-code', { hasText: /^water/ }).first().locator('.cw-codecount')).toContainText(String(n));

  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Retrieve' }).click();
  await page.locator('.cw-retrieve select[aria-label="Code"]').selectOption({ label: 'water' });
  await expect(page.locator('.cw-retrieve .ai-note')).toContainText('When you click Summarise this code');
  await page.locator('.cw-retrieve button', { hasText: 'Summarise this code' }).click();
  await expect(page.locator('.cw-ai-summary')).toContainText('Residents describe irregular supply and reliance on tankers.');
  expect(calls[calls.length - 1].url).toContain(':streamGenerateContent?alt=sse');
});

test('AI errors from Gemini show a friendly message in the coding dialog', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('socius.ai', JSON.stringify({ provider: 'gemini', gemini: { apiKey: 'wrong', model: 'gemini-3.6-flash' } }));
  });
  await page.route(GEMINI, (route) =>
    route.fulfill({ status: 403, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify({ error: { code: 403, message: 'Permission denied', status: 'PERMISSION_DENIED' } }) }),
  );
  await ready(page);
  await importChallenge(page);
  await page.locator('.cw-toolbar .cw-menu-trigger', { hasText: 'AI suggestions' }).click();
  await page.locator('.cw-menu-list [role=menuitem]', { hasText: 'Suggest a codebook' }).click();
  const dlg = page.getByRole('dialog', { name: 'Suggest a codebook' });
  await dlg.getByRole('button', { name: 'Suggest codes' }).click();
  await expect(dlg.locator('.callout-bad')).toContainText('did not accept the key');
  // The note offers a way to fix it.
  await dlg.locator('.ai-note').getByRole('button', { name: 'Change' }).click();
  await expect(page.getByRole('dialog', { name: 'AI assistant' })).toBeVisible();
});

test('Help menu and top bar: user guide, feedback and About links', async ({ page, context, baseURL }) => {
  await context.route('https://github.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>GitHub</title>' }));
  await context.route('**/guide/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>Guide</title>' }));
  await ready(page);
  const feedback = page.locator('.topbar-feedback');
  await expect(feedback).toHaveText('Feedback');
  await expect(feedback).toHaveAttribute('href', 'https://github.com/hackhead95/socius/issues/new/choose');
  await expect(feedback).toHaveAttribute('target', '_blank');

  const viaHelp = async (item: string) => {
    const popup = page.waitForEvent('popup');
    await page.getByRole('menuitem', { name: 'Help', exact: true }).click();
    await page.getByRole('menuitem', { name: item }).click();
    const p = await popup;
    const url = p.url();
    await p.close();
    return url;
  };
  expect(await viaHelp('User guide')).toBe(`${baseURL}/guide/`);
  expect(await viaHelp('Send feedback or report a problem')).toBe('https://github.com/hackhead95/socius/issues/new/choose');

  await page.getByRole('menuitem', { name: 'Help', exact: true }).click();
  await page.getByRole('menuitem', { name: 'About Socius' }).click();
  const about = page.getByRole('dialog', { name: 'About Socius' });
  await expect(about).toContainText('It only sends what you choose, when you click, to the provider you choose.');
  await expect(about.getByRole('link', { name: 'User guide' })).toHaveAttribute('href', `${baseURL}/guide/`);
  await expect(about.getByRole('link', { name: 'Send feedback or report a problem' })).toHaveAttribute('href', 'https://github.com/hackhead95/socius/issues/new/choose');
  await about.getByRole('button', { name: 'AI assistant settings' }).click();
  await expect(page.getByRole('dialog', { name: 'AI assistant' })).toBeVisible();
  // Settings open on top of About; Escape closes only the top one.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'AI assistant' })).toHaveCount(0);
  await expect(about).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(about).toHaveCount(0);

  await page.getByRole('menuitem', { name: 'Help', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Getting started' }).click();
  await expect(page.getByRole('dialog', { name: 'Getting started' }).getByRole('link', { name: 'user guide' })).toHaveAttribute('href', `${baseURL}/guide/`);
});
