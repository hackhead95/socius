// A program on this computer (Ollama / LM Studio) from a website that is not localhost, against a fake
// Ollama server (scripts/diagnostics/fake-ollama.mjs) with Ollama's real CORS behaviour. The app is
// opened as https://socius.test (served through a route), so requests to http://localhost:11434 are
// cross-site exactly as from https://hackhead95.github.io: Ollama refuses them until OLLAMA_ORIGINS
// lists the site. Covers: not running, running but refusing this website, model missing (pick an
// installed one), success with a streamed reply, LM Studio with CORS off, address advice, and
// "Copy details" without the key.
import { expect, test, type Browser, type BrowserContext, type CDPSession, type Page } from '@playwright/test';
import { startFakeOllama, type FakeOllama } from '../scripts/diagnostics/fake-ollama.mjs';
import { loadSampleFromWelcome } from './helpers';

const appPort = Number(process.env.E2E_PORT || 4173);
const SITE = 'https://socius.test';

// The app is served by vite preview on localhost; the browser sees it at https://socius.test (a secure
// public website, like https://hackhead95.github.io), so the program's CORS rules apply as on the
// live site. (An http page would be blocked outright: Chrome does not let insecure public pages reach
// localhost.)
test.use({ baseURL: SITE });

/**
 * Chrome's "Local network access" permission for the site (Chrome 142+ asks before a public website
 * may reach localhost; this Chromium already enforces it). 'prompt' leaves requests waiting for an
 * answer, as when the user has not clicked Allow yet.
 */
async function setLocalNetwork(browser: Browser, context: BrowserContext, page: Page, setting: 'granted' | 'denied' | 'prompt') {
  const info: any = await (await context.newCDPSession(page)).send('Target.getTargetInfo');
  // The override lasts while this session is attached (Playwright closes it with the browser).
  cdp ??= await browser.newBrowserCDPSession();
  try {
    await cdp.send('Browser.setPermission', { permission: { name: 'local-network-access' }, setting, origin: SITE, browserContextId: info.targetInfo.browserContextId } as any);
  } catch {
    /* a browser without this permission: nothing to set */
  }
}
let cdp: CDPSession | undefined;

test.beforeEach(async ({ browser, context, page }) => {
  await context.route(`${SITE}/**`, async (route) => {
    const response = await route.fetch({ url: route.request().url().replace(SITE, `http://localhost:${appPort}`) });
    await route.fulfill({ response });
  });
  await setLocalNetwork(browser, context, page, 'granted');
});

let fake: FakeOllama;

test.beforeEach(async () => {
  fake = await startFakeOllama({ port: 0, models: ['llama3.2:latest'], cors: 'ollama', origins: [] });
});

test.afterEach(async () => {
  await fake?.close();
});

async function openLocal(page: Page, openai: Record<string, string>) {
  await page.addInitScript((o) => {
    localStorage.setItem('socius.ai', JSON.stringify({ provider: 'openai', openai: o }));
    // Record what the Copy buttons put on the clipboard.
    const copied: string[] = [];
    (window as any).__copied = copied;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (t: string) => void copied.push(t) } });
  }, openai);
  await page.goto('/');
  await loadSampleFromWelcome(page);
  await page.getByRole('menuitem', { name: 'AI', exact: true }).click();
  await page.getByRole('menuitem', { name: 'AI assistant settings...' }).click();
  const dlg = page.getByRole('dialog', { name: 'AI assistant' });
  await expect(dlg.getByRole('region', { name: 'Program on this computer' })).toBeVisible();
  return dlg;
}

const step = (dlg: ReturnType<Page['getByRole']>, id: string) => dlg.locator(`.ai-check-step[data-step="${id}"]`);

test('Ollama: not running, then refusing this website (OLLAMA_ORIGINS), then model missing, then a streamed answer', async ({ page }) => {
  const port = fake.port;
  await fake.close(); // not running: nothing listens on the port
  const dlg = await openLocal(page, { preset: 'ollama', baseUrl: `http://localhost:${port}/v1`, apiKey: '', model: 'llama3.2' });
  await expect(dlg.locator('.ai-local-steps')).toContainText('ollama pull llama3.2');
  // The generic test row is replaced by the local check.
  await expect(dlg.locator('.ai-test')).toHaveCount(0);

  // 1) Not running.
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(step(dlg, 'running')).toHaveAttribute('data-status', 'fail');
  await expect(step(dlg, 'running')).toContainText(`Nothing answered at http://localhost:${port}`);
  await expect(step(dlg, 'running')).toContainText('ollama serve');
  await expect(step(dlg, 'allowed')).toHaveAttribute('data-status', 'skip');
  await expect(step(dlg, 'answer')).toHaveAttribute('data-status', 'skip');

  // 2) Running, but Ollama refuses a page that is not on localhost.
  fake = await startFakeOllama({ port, models: ['qwen2.5:1.5b'], cors: 'ollama', origins: [] });
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(step(dlg, 'running')).toHaveAttribute('data-status', 'ok');
  await expect(step(dlg, 'allowed')).toHaveAttribute('data-status', 'fail');
  await expect(step(dlg, 'allowed')).toContainText(`Ollama is running but refused this website (${SITE})`);
  const origins = step(dlg, 'allowed').locator('.ai-origins');
  await expect(origins).toContainText(SITE);
  await origins.getByRole('button', { name: /^Windows/ }).click();
  await expect(origins).toContainText(`setx OLLAMA_ORIGINS "${SITE}"`);
  await origins.getByRole('button', { name: /^macOS/ }).click();
  await expect(origins).toContainText(`launchctl setenv OLLAMA_ORIGINS "${SITE}"`);
  await origins.getByRole('button', { name: /^Linux/ }).click();
  await expect(origins).toContainText('sudo systemctl edit ollama.service');
  await expect(origins).toContainText(`Environment="OLLAMA_ORIGINS=${SITE}"`);
  await origins.getByRole('button', { name: `Copy: OLLAMA_ORIGINS="${SITE}" ollama serve` }).click();
  expect(await page.evaluate(() => (window as any).__copied.at(-1))).toBe(`OLLAMA_ORIGINS="${SITE}" ollama serve`);
  // The refused requests did carry this site's origin.
  expect(fake.requests.some((r) => r.path === '/api/version' && r.origin === SITE)).toBe(true);

  // 3) The user sets OLLAMA_ORIGINS and restarts Ollama: now the model is missing.
  fake.set({ origins: [SITE] });
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(step(dlg, 'allowed')).toHaveAttribute('data-status', 'ok');
  await expect(step(dlg, 'allowed')).toContainText('Ollama 0.12.3');
  await expect(step(dlg, 'model')).toHaveAttribute('data-status', 'fail');
  await expect(step(dlg, 'model')).toContainText('"llama3.2" is not installed. Installed: qwen2.5:1.5b');
  await expect(step(dlg, 'model')).toContainText('ollama pull llama3.2');
  expect(fake.requests.filter((r) => r.path === '/v1/chat/completions')).toHaveLength(0);

  // 4) Pick the installed model: the check runs again and the reply streams in.
  fake.set({ reply: 'OK, ready.' });
  await dlg.locator('#ai-local-model').selectOption('qwen2.5:1.5b');
  await expect(step(dlg, 'answer')).toHaveAttribute('data-status', 'ok');
  await expect(step(dlg, 'answer')).toContainText('It answered: "OK, ready."');
  await expect(dlg.locator('#ai-oa-model')).toHaveValue('qwen2.5:1.5b');
  await expect(dlg.locator('.ai-local .ai-ok')).toContainText('Connected. Ollama answered with qwen2.5:1.5b');
  await expect(dlg.getByRole('region', { name: 'AI is ready' })).toBeVisible();
  const chat = fake.requests.filter((r) => r.path === '/v1/chat/completions');
  expect(chat).toHaveLength(1);
  expect(chat[0].origin).toBe(SITE);
  expect(JSON.parse(chat[0].body)).toMatchObject({ model: 'qwen2.5:1.5b', stream: true });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('socius.ai') ?? '{}').openai.model)).toBe('qwen2.5:1.5b');
});

test('Ollama allowing this website: "llama3.2" matches llama3.2:latest, a real AI feature works, Copy details has no key', async ({ page }) => {
  fake.set({ origins: [SITE], reply: 'Plain summary.' });
  const dlg = await openLocal(page, { preset: 'ollama', baseUrl: `http://localhost:${fake.port}/v1`, apiKey: 'sk-local-secret', model: 'llama3.2' });
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(step(dlg, 'answer')).toHaveAttribute('data-status', 'ok');
  await expect(step(dlg, 'model')).toContainText('"llama3.2:latest" is installed');
  await expect(step(dlg, 'permission')).toHaveAttribute('data-status', 'ok');
  expect(fake.requests.find((r) => r.path === '/v1/chat/completions')?.auth).toBe('Bearer sk-local-secret');

  await dlg.getByRole('button', { name: 'Copy details' }).click();
  const report: string = await page.evaluate(() => (window as any).__copied.at(-1));
  expect(report).toContain(`Website: ${SITE}`);
  expect(report).toContain(`Base URL: http://localhost:${fake.port}/v1`);
  expect(report).toContain('API key: set (not shown)');
  expect(report).toContain('Did it answer? OK');
  expect(report).not.toContain('sk-local-secret');

  // The "AI is ready" panel starts a real feature, which talks to the same program.
  const before = fake.requests.length;
  await dlg.getByRole('region', { name: 'AI is ready' }).getByRole('button').first().click();
  await expect(dlg).toHaveCount(0);
  expect(fake.requests.length).toBe(before); // nothing is sent before the user confirms
});

test('Explain with AI streams from the local program; when it stops, the error points to the guided check', async ({ page }) => {
  fake.set({ origins: [SITE], reply: 'Most respondents are women.' });
  const dlg = await openLocal(page, { preset: 'ollama', baseUrl: `http://localhost:${fake.port}/v1`, apiKey: '', model: 'llama3.2' });
  await dlg.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('menuitem', { name: 'Analyze', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Descriptive Statistics', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Frequencies...', exact: true }).click();
  await page.locator('.modal input[aria-label="Search variables"]').fill('gender');
  await page.locator('.pd-list .pd-var').filter({ has: page.locator('.vl-name', { hasText: '[gender]' }) }).first().click();
  await page.locator('.modal .pd-slot-row').nth(0).locator('button.pd-arrow').click();
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  const item = page.locator('.ov-doc article').last();
  await item.getByRole('button', { name: 'Explain with AI' }).click();
  const panel = item.locator('.ai-explain');
  await expect(panel.locator('.ai-note')).toContainText('Nothing leaves this computer');
  await panel.getByRole('button', { name: 'Explain', exact: true }).click();
  await expect(panel.locator('.ai-explain-text')).toContainText('Most respondents are women.');
  const chat = fake.requests.filter((r) => r.path === '/v1/chat/completions');
  expect(chat).toHaveLength(1);
  expect(JSON.parse(chat[0].body).stream).toBe(true);

  await fake.close();
  await panel.getByRole('button', { name: /Explain again|Try again|Explain/ }).first().click();
  await expect(panel).toContainText('Could not reach the AI program on this computer');
  await expect(panel).toContainText('click Test connection');
});

test('Browser permission for this computer: not answered yet, then blocked, then allowed', async ({ page, context, browser }) => {
  fake.set({ origins: [SITE] });
  // Not answered yet (a fresh browser profile): requests wait for the user's answer to the browser's question.
  const fresh = await browser.newContext({ baseURL: SITE });
  await fresh.route(`${SITE}/**`, async (route) => {
    const response = await route.fetch({ url: route.request().url().replace(SITE, `http://localhost:${appPort}`) });
    await route.fulfill({ response });
  });
  const waiting = await openLocal(await fresh.newPage(), { preset: 'ollama', baseUrl: `http://localhost:${fake.port}/v1`, apiKey: '', model: 'llama3.2' });
  await waiting.getByRole('button', { name: 'Test connection' }).click();
  await expect(step(waiting, 'running')).toHaveAttribute('data-status', 'running');
  await expect(step(waiting, 'running')).toContainText('click Allow');
  await waiting.getByRole('button', { name: 'Stop' }).click();
  await expect(waiting.getByRole('button', { name: 'Test connection' })).toBeEnabled();
  await fresh.close();

  const dlg = await openLocal(page, { preset: 'ollama', baseUrl: `http://localhost:${fake.port}/v1`, apiKey: '', model: 'llama3.2' });
  // Blocked.
  await setLocalNetwork(browser, context, page, 'denied');
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(step(dlg, 'running')).toHaveAttribute('data-status', 'fail');
  await expect(step(dlg, 'running')).toContainText('The browser blocked this website from connecting to programs on this computer');
  await expect(step(dlg, 'permission')).toHaveAttribute('data-status', 'fail');
  await expect(step(dlg, 'permission')).toContainText('Site settings');
  await expect(step(dlg, 'permission')).toContainText('"Local network access" to Allow');
  expect(fake.requests).toHaveLength(0);

  // Allowed: everything passes.
  await setLocalNetwork(browser, context, page, 'granted');
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(step(dlg, 'answer')).toHaveAttribute('data-status', 'ok');
  await expect(step(dlg, 'permission')).toContainText('Allowed');
});

test('LM Studio with CORS off, then on; address advice when /v1 is missing', async ({ page }) => {
  fake.set({ flavour: 'lmstudio', cors: 'none', models: ['lmstudio-community/qwen2.5-7b-instruct'] });
  const dlg = await openLocal(page, { preset: 'lmstudio', baseUrl: `http://127.0.0.1:${fake.port}`, apiKey: '', model: '' });
  // Address advice: the address must end in /v1 (127.0.0.1 itself is fine).
  const advice = dlg.locator('.ai-local-advice');
  await expect(advice).toContainText('The address must end in /v1');
  await expect(advice).not.toContainText('instead of 127.0.0.1');
  await advice.getByRole('button', { name: `Use http://127.0.0.1:${fake.port}/v1` }).click();
  await expect(dlg.locator('#ai-oa-url')).toHaveValue(`http://127.0.0.1:${fake.port}/v1`);
  await expect(advice).toHaveCount(0);

  await dlg.getByRole('button', { name: 'Test connection' }).click();
  await expect(step(dlg, 'running')).toHaveAttribute('data-status', 'ok');
  await expect(step(dlg, 'allowed')).toHaveAttribute('data-status', 'fail');
  await expect(step(dlg, 'allowed')).toContainText('Turn on "Enable CORS"');
  await expect(step(dlg, 'allowed')).toContainText('lms server start --cors');

  fake.set({ cors: 'all' });
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  // No model typed yet: pick one of the loaded models.
  await expect(step(dlg, 'model')).toHaveAttribute('data-status', 'fail');
  await expect(step(dlg, 'model')).toContainText('Choose one of the 1 installed model');
  await dlg.locator('#ai-local-model').selectOption('lmstudio-community/qwen2.5-7b-instruct');
  await expect(step(dlg, 'answer')).toHaveAttribute('data-status', 'ok');
  await expect(dlg.locator('.ai-local .ai-ok')).toContainText('LM Studio answered');
});
