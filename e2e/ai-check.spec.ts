// AI assistant settings > Test connection: the step-by-step checklist for Google Gemini (success, and a
// refused key, no free allowance, a blocked connection), "Copy details" (never the key), the model picker
// for an OpenAI-compatible service, and the "Details" link under an assistant error. Network mocked.
import { expect, test, type Page, type Route } from '@playwright/test';
import { openWithSample } from './helpers';
import { GEMINI, cors, googleErrorReply, interactionReply, modelsReply } from './gemini-mock';

const AQ_KEY = 'AQ.Ab8RN6LfakeE2EkeyForTests_abcdefghijklmnopqrstuvwxyz0123';

async function openSettings(page: Page) {
  await page.getByRole('menuitem', { name: 'AI', exact: true }).click();
  await page.getByRole('menuitem', { name: 'AI assistant settings...' }).click();
  const dlg = page.getByRole('dialog', { name: 'AI assistant' });
  await expect(dlg).toBeVisible();
  return dlg;
}

async function geminiWithKey(page: Page, key = AQ_KEY) {
  const dlg = await openSettings(page);
  await dlg.getByRole('radio', { name: /Google Gemini/ }).check();
  await dlg.locator('#ai-gemini-key').fill(key);
  return dlg;
}

const steps = (dlg: ReturnType<Page['getByRole']>) => dlg.locator('.ai-check-step');

async function copiedText(page: Page, dlg: ReturnType<Page['getByRole']>) {
  await dlg.getByRole('button', { name: 'Copy details' }).click();
  await expect(dlg.getByRole('button', { name: 'Copied' })).toBeVisible();
  return page.evaluate(() => navigator.clipboard.readText());
}

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});

test('Gemini: success shows five ticks, the model and the reply; Details has no key', async ({ page }) => {
  const posts: any[] = [];
  await page.route(GEMINI, async (route: Route) => {
    const req = route.request();
    if (req.method() === 'GET') return route.fulfill(modelsReply(['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro-preview']));
    posts.push({ body: req.postDataJSON(), headers: req.headers() });
    return route.fulfill(interactionReply([{ thoughtSignature: 'EqEYsig' }, { text: 'OK' }], false));
  });
  await openWithSample(page);
  const dlg = await geminiWithKey(page);
  await expect(dlg.locator('.ai-key-warn')).toHaveCount(0); // an AQ. key looks right
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(dlg.locator('.ai-test-result')).toContainText('Connected to gemini-3.5-flash-lite. The AI answered: "OK".');
  await expect(steps(dlg).locator('.ai-check-label')).toHaveText([/1\. Internet connection/, /2\. Reached Google/, /3\. Key accepted/, /4\. Model chosen/, /5\. Got an answer/]);
  await expect(dlg.locator('.ai-check-step[data-state="ok"]')).toHaveCount(5);
  await expect(dlg.locator('.ai-check-step[data-step="model"]')).toContainText('gemini-3.5-flash-lite (automatic');
  await expect(dlg.locator('.ai-check-step[data-step="answer"]')).toContainText('answered: "OK"');
  await expect(dlg.locator('.ai-ready')).toContainText('AI is ready');
  expect(posts[0].headers['x-goog-api-key']).toBe(AQ_KEY);
  expect(posts[0].body).toMatchObject({ model: 'gemini-3.5-flash-lite', store: false });
  await dlg.locator('.ai-check-details summary').click();
  const report = await dlg.locator('.ai-check-report').innerText();
  expect(report).toContain('Socius AI connection report');
  expect(report).toContain('Result: connected');
  expect(report).not.toContain(AQ_KEY);
  expect(await copiedText(page, dlg)).not.toContain('Ab8RN6LfakeE2E');
});

test('Gemini: a key Google cannot validate stops at "Key accepted"; Copy details has statuses but no key', async ({ page }) => {
  await page.route(GEMINI, (route) =>
    route.fulfill(
      googleErrorReply(401, 'UNAUTHENTICATED', 'Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential.', [
        { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'ACCESS_TOKEN_TYPE_UNSUPPORTED', metadata: { service: 'generativelanguage.googleapis.com' } },
      ]),
    ),
  );
  await openWithSample(page);
  const dlg = await geminiWithKey(page);
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(dlg.locator('.ai-test-result .text-bad')).toContainText('Not connected');
  await expect(dlg.locator('.ai-check-step[data-step="internet"]')).toHaveAttribute('data-state', 'ok');
  await expect(dlg.locator('.ai-check-step[data-step="reach"]')).toHaveAttribute('data-state', 'ok');
  await expect(dlg.locator('.ai-check-step[data-step="key"]')).toHaveAttribute('data-state', 'fail');
  await expect(dlg.locator('.ai-check-step[data-step="answer"]')).toHaveAttribute('data-state', 'skip');
  await expect(dlg.locator('.ai-check-error')).toContainText('Google did not accept this key');
  await expect(dlg.locator('.ai-check-error')).toContainText('copied the whole key');
  const text = await copiedText(page, dlg);
  expect(text).toContain('Socius AI connection report');
  expect(text).toMatch(/App: Socius \d/);
  expect(text).toContain('Browser: Mozilla/5.0');
  expect(text).toContain('Online (browser says): yes');
  expect(text).toContain('Error: code key_not_accepted, HTTP 401, status UNAUTHENTICATED, reason ACCESS_TOKEN_TYPE_UNSUPPORTED');
  expect(text).toContain('[fail] Key accepted');
  expect(text).toContain('-> 401 UNAUTHENTICATED (ACCESS_TOKEN_TYPE_UNSUPPORTED)');
  expect(text).not.toContain(AQ_KEY);
  expect(text).not.toContain('Ab8RN6LfakeE2E');
});

test('Gemini: no free allowance on any model tried: "Model chosen" fails and names the models', async ({ page }) => {
  const models: string[] = [];
  await page.route(GEMINI, async (route) => {
    const req = route.request();
    if (req.method() === 'GET') return route.fulfill(modelsReply(['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-pro-preview']));
    const m = req.postDataJSON().model;
    models.push(m);
    return route.fulfill(
      googleErrorReply(429, 'RESOURCE_EXHAUSTED', `You exceeded your current quota.\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: ${m}`, [
        { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', quotaValue: '0' }] },
      ]),
    );
  });
  await openWithSample(page);
  const dlg = await geminiWithKey(page);
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(dlg.locator('.ai-check-step[data-step="key"]')).toHaveAttribute('data-state', 'ok');
  await expect(dlg.locator('.ai-check-step[data-step="model"]')).toHaveAttribute('data-state', 'fail');
  await expect(dlg.locator('.ai-check-step[data-step="model"]')).toContainText('Tried: gemini-3.5-flash-lite, gemini-3.8-flash, gemini-3.1-pro-preview');
  await expect(dlg.locator('.ai-check-error')).toContainText('no free allowance');
  expect(models).toEqual(['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-pro-preview']);
});

test('Gemini: a blocked connection fails at "Reached Google" and says what may block it', async ({ page }) => {
  await page.route(GEMINI, (route) => route.abort('blockedbyclient'));
  await openWithSample(page);
  const dlg = await geminiWithKey(page);
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(dlg.locator('.ai-check-step[data-step="reach"]')).toHaveAttribute('data-state', 'fail');
  await expect(dlg.locator('.ai-check-step[data-step="key"]')).toHaveAttribute('data-state', 'skip');
  await expect(dlg.locator('.ai-check-error')).toContainText('ad or privacy blocker');
  await expect(dlg.locator('.ai-check-error')).toContainText('generativelanguage.googleapis.com');
});

test('Other service: a model the service does not offer gets a picker; choosing one tests again', async ({ page }) => {
  let chosen = '';
  await page.route('https://api.groq.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...cors, 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' } });
    if (req.url().endsWith('/models')) return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'llama-3.1-8b-instant' }, { id: 'openai/gpt-oss-120b' }, { id: 'whisper-large-v3' }] }) });
    chosen = req.postDataJSON().model;
    if (chosen === 'llama-3.3-70b-versatile')
      return route.fulfill({ status: 404, headers: cors, contentType: 'application/json', body: JSON.stringify({ error: { message: 'The model `llama-3.3-70b-versatile` does not exist or you do not have access to it.', type: 'invalid_request_error', code: 'model_not_found' } }) });
    return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { role: 'assistant', content: 'OK' }, finish_reason: 'stop' }] }) });
  });
  await openWithSample(page);
  const dlg = await openSettings(page);
  await dlg.getByRole('radio', { name: /Other service/ }).check();
  await dlg.locator('#ai-oa-preset').selectOption('groq');
  await dlg.locator('#ai-oa-key').fill('gsk_e2eSecretKey0123456789');
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(steps(dlg).locator('.ai-check-label')).toHaveText([/Internet connection/, /Reached api\.groq\.com/, /Key accepted/, /Model available/, /Got an answer/]);
  await expect(dlg.locator('.ai-check-step[data-step="model"]')).toHaveAttribute('data-state', 'fail');
  const picker = dlg.locator('#ai-check-model');
  await expect(picker.locator('option')).toHaveText(['llama-3.1-8b-instant', 'openai/gpt-oss-120b']); // no speech models
  await picker.selectOption('openai/gpt-oss-120b');
  await dlg.getByRole('button', { name: 'Use this model' }).click();
  await expect(dlg.locator('#ai-oa-model')).toHaveValue('openai/gpt-oss-120b');
  await expect(dlg.locator('.ai-test-result')).toContainText('Connected to openai/gpt-oss-120b');
  await expect(dlg.locator('.ai-check-step[data-state="ok"]')).toHaveCount(5);
  expect(chosen).toBe('openai/gpt-oss-120b');
  await dlg.locator('.ai-check-details summary').click();
  expect(await dlg.locator('.ai-check-report').innerText()).not.toContain('gsk_e2eSecretKey');
});

test('Assistant: a daily limit error says when it resets, with a Details report that has no key', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem('socius.ai', JSON.stringify({ provider: 'gemini', gemini: { apiKey: key, model: '' } })), AQ_KEY);
  await page.route(GEMINI, (route) => {
    const req = route.request();
    if (req.method() === 'GET') return route.fulfill(modelsReply(['gemini-3.5-flash-lite']));
    return route.fulfill(
      googleErrorReply(429, 'RESOURCE_EXHAUSTED', 'You exceeded your current quota.\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 500, model: gemini-3.5-flash-lite', [
        { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', quotaValue: '500' }] },
      ]),
    );
  });
  await openWithSample(page);
  await page.keyboard.press('Control+j');
  const panel = page.getByTestId('assistant-panel');
  await panel.getByRole('listitem').first().click();
  const err = panel.locator('.as-error');
  await expect(err).toContainText('daily allowance');
  await expect(err).toContainText('midnight Pacific time');
  await err.getByRole('button', { name: 'Details' }).click();
  const report = await err.locator('pre').innerText();
  expect(report).toContain('Socius AI error report');
  expect(report).toContain('While: Socius assistant');
  expect(report).toContain('code rate_limited');
  expect(report).not.toContain(AQ_KEY);
});
