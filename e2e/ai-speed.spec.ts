// Speed and storage, end to end:
// - Gemini with a tiny free limit (mocked: "limit: 3 requests per minute ... Please retry in Ns"): the
//   assistant shows a countdown instead of hanging, then the answer completes.
// - First words appear quickly (no model list on a second question, the dataset overview looked up
//   before the first request).
// - Browser storage full (IndexedDB writes fail with QuotaExceededError): one banner, Save project
//   still works, Manage storage deletes the downloaded AI model, autosave resumes, the banner goes.
// - A real full quota in Chromium (DevTools Storage.overrideQuotaForOrigin + dummy model files in Cache
//   Storage, like the owner's state): the manager shows and deletes the files, autosave recovers.
import { expect, test, type Page, type Route } from '@playwright/test';
import { loadSampleFromWelcome, openWithSample } from './helpers';
import { GEMINI, cors, fulfil, interactionReply, modelsReply, promptOf, type Part } from './gemini-mock';

async function withGemini(page: Page, model = '') {
  await page.addInitScript((m) => {
    if (!localStorage.getItem('socius.ai')) localStorage.setItem('socius.ai', JSON.stringify({ v: 2, provider: 'gemini', gemini: { apiKey: 'AQ.e2e-speed-key-0123456789abcdefghijklmnopqrstuvwxyz', model: m }, remember: { gemini: true, openai: false } }));
  }, model);
}

interface Mock {
  posts: Array<{ at: number; model: string; status: number }>;
  lists: number;
}

/** Gemini with a per-model limit of `limit` requests in `windowMs` (the reply says "per minute"), and a latency. */
async function mockLimitedGemini(page: Page, o: { limit: number; windowMs: number; latencyMs: number; script: (body: any) => Part[] }): Promise<Mock> {
  const m: Mock = { posts: [], lists: 0 };
  const used = new Map<string, number[]>();
  await page.route(GEMINI, async (route: Route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      m.lists++;
      return route.fulfill(modelsReply(['gemini-3.8-flash', 'gemini-3.5-flash-lite']));
    }
    const body = req.postDataJSON();
    await new Promise((r) => setTimeout(r, o.latencyMs));
    const now = Date.now();
    const list = (used.get(body.model) ?? []).filter((t) => now - t < o.windowMs);
    if (list.length >= o.limit) {
      const retry = Math.max(1, Math.ceil((o.windowMs - (now - list[0])) / 1000));
      m.posts.push({ at: now, model: body.model, status: 429 });
      used.set(body.model, list);
      const message = `Rate limit exceeded for model ${body.model} (limit: ${o.limit} requests per minute on Free Tier). Please retry in ${retry}s`;
      return route.fulfill({
        status: 429,
        headers: cors,
        contentType: 'application/json',
        body: JSON.stringify([{ error: { code: 429, message, status: 'RESOURCE_EXHAUSTED', details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: `${retry}s` }] } }]),
      });
    }
    list.push(now);
    used.set(body.model, list);
    m.posts.push({ at: now, model: body.model, status: 200 });
    return fulfil(route, interactionReply(o.script(body), !!body.stream));
  });
  return m;
}

/** A model that looks up variables once (the overview is already in its instructions), then answers. */
function assistantScript(body: any): Part[] {
  const steps: any[] = Array.isArray(body.input) ? body.input : [];
  const lastUser = steps.map((s) => s.type).lastIndexOf('user_input');
  const looked = steps.slice(lastUser).some((s) => s.type === 'function_result');
  if (!looked) return [{ thoughtSignature: 'sig' }, { functionCall: { name: 'describe_variables', args: { names: ['trust5', 'gender'] } } }];
  return [{ text: `Answer to: ${promptOf(body).slice(0, 40)}. Trust differs a little by gender.` }];
}

async function ask(page: Page, text: string) {
  const input = page.getByTestId('assistant-panel').getByRole('textbox');
  await input.fill(text);
  await input.press('Enter');
}

test('free per-minute limit: the assistant shows a countdown, then still answers', async ({ page }) => {
  await withGemini(page);
  const m = await mockLimitedGemini(page, { limit: 3, windowMs: 8_000, latencyMs: 150, script: assistantScript });
  await openWithSample(page);
  await page.keyboard.press('Control+j');
  const panel = page.getByTestId('assistant-panel');
  await ask(page, 'Describe trust by gender');
  await expect(panel.getByTestId('assistant-message').last()).toHaveAttribute('data-status', 'done', { timeout: 20_000 });
  // The dataset overview was looked up before the first request (no round spent on it).
  await panel.getByTestId('assistant-message').last().locator('.as-trace summary').click();
  await expect(panel.getByTestId('assistant-message').last().locator('.as-trace li').first()).toContainText('Looked at the dataset overview');
  await ask(page, 'And by age group?');
  // The 4th request in the window gets Google's 429: a visible countdown, not a silent wait.
  const activity = panel.getByTestId('ai-activity');
  await expect(activity).toHaveAttribute('data-stage', 'limit', { timeout: 15_000 });
  await expect(activity).toContainText(/Waiting \d+ s for Google's free limit\.\.\./);
  await expect(panel.getByTestId('assistant-message').last()).toHaveAttribute('data-status', 'done', { timeout: 30_000 });
  await expect(panel.getByTestId('assistant-message').last()).toContainText('Trust differs a little by gender');
  expect(m.posts.filter((p) => p.status === 429)).toHaveLength(1);
  // Flash-Lite by default (a model with room may take over when a long wait would be needed).
  expect(m.posts.slice(0, 4).every((p) => p.model === 'gemini-3.5-flash-lite')).toBe(true);
  expect(m.lists).toBe(1);
});

test('performance: the first words appear quickly', async ({ page }) => {
  await withGemini(page);
  await mockLimitedGemini(page, { limit: 100, windowMs: 60_000, latencyMs: 500, script: (body) => (Array.isArray(body.input) ? [{ text: 'Quick answer about the data.' }] : [{ text: 'OK' }]) });
  await openWithSample(page);
  await page.keyboard.press('Control+j');
  const panel = page.getByTestId('assistant-panel');
  await ask(page, 'Warm up');
  await expect(panel.getByTestId('assistant-message').last()).toHaveAttribute('data-status', 'done');
  const t0 = Date.now();
  await ask(page, 'How many cases are there?');
  await expect(panel.getByTestId('assistant-message').last()).toContainText('Quick answer', { timeout: 10_000 });
  const ms = Date.now() - t0;
  // One request (500 ms simulated latency), no model list, no extra round: well under 2 s.
  expect(ms).toBeLessThan(2_000);
  // The time went into the error log as an info entry (stages and times only).
  const log = await page.evaluate(() => localStorage.getItem('socius.errorlog') ?? '');
  expect(log).toMatch(/assistant: first text [\d.]+ s, done [\d.]+ s; 1 request/);
  expect(log).not.toContain('Quick answer');
});

// ---------- storage full ----------

/** Put a fake downloaded model into Cache Storage, as @mlc-ai/web-llm stores it. */
async function fakeModel(page: Page, mb: number) {
  await page.evaluate(async (size) => {
    const id = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
    const base = `https://huggingface.co/mlc-ai/${id}/resolve/main/`;
    const c = await caches.open('webllm/model');
    await c.put(base + 'tensor-cache.json', new Response(JSON.stringify({ records: [{ dataPath: 'params_shard_0.bin' }, { dataPath: 'params_shard_1.bin' }] })));
    await c.put(base + 'params_shard_0.bin', new Response(new Uint8Array(size * 1e6)));
  }, mb);
}

async function triggerAutosave(page: Page) {
  // Any change to the project schedules an autosave (1.5 s later).
  await page.getByRole('tab', { name: 'Output' }).click();
  await page.getByRole('tab', { name: 'Data View' }).click();
}

test('storage full: one banner, Save project works, deleting the model resumes autosave', async ({ page }) => {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    (window as any).__quotaFull = false;
    (window as any).__puts = 0;
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: any[]) {
      (window as any).__puts++;
      if ((window as any).__quotaFull) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      return put.apply(this, args as any);
    } as any;
  });
  await openWithSample(page);
  await fakeModel(page, 2);
  await page.evaluate(() => ((window as any).__quotaFull = true));
  await triggerAutosave(page);
  const banner = page.getByTestId('storage-full-banner');
  await expect(banner).toBeVisible({ timeout: 10_000 });
  await expect(banner).toContainText('Browser storage is full, so autosave is paused. Free space in AI settings (downloaded models) or save your project to a file.');
  // More changes: still one banner, and no write every 1.5 s.
  const puts = await page.evaluate(() => (window as any).__puts);
  for (let i = 0; i < 3; i++) await triggerAutosave(page);
  await page.waitForTimeout(3_500);
  await expect(banner).toHaveCount(1);
  expect(await page.evaluate(() => (window as any).__puts)).toBe(puts);
  // Save project still saves a file.
  const [dl] = await Promise.all([page.waitForEvent('download'), banner.getByRole('button', { name: 'Save project' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/\.socius\.json$|\.json$/);
  // Manage storage: the downloaded model is listed; deleting it frees space and autosave resumes.
  await banner.getByRole('button', { name: 'Manage storage' }).click();
  const dlg = page.getByRole('dialog', { name: 'Browser storage' });
  await expect(dlg.getByTestId('storage-model')).toContainText('AI model: Small and fast');
  await expect(dlg.getByTestId('storage-model')).toContainText('partly downloaded');
  await page.evaluate(() => ((window as any).__quotaFull = false));
  await dlg.getByTestId('storage-model').getByRole('button', { name: 'Delete' }).click();
  await expect(dlg.getByText('Deleted Small and fast. Autosave works again.')).toBeVisible();
  await expect(dlg.getByTestId('storage-model')).toHaveCount(0);
  await expect(banner).toHaveCount(0);
  // One error entry for the pause (not one per attempt), and an info entry for the resume.
  const log = JSON.parse(await page.evaluate(() => localStorage.getItem('socius.errorlog') ?? '{"entries":[]}')).entries;
  expect(log.filter((e: any) => e.area === 'storage' && e.level === 'error' && e.context?.op === 'autosave paused (browser storage full)')).toHaveLength(1);
  expect(log.some((e: any) => e.level === 'info' && /Autosave resumed/.test(e.message))).toBe(true);
});

test('real quota (DevTools): dummy model files fill the storage, the manager deletes them, autosave recovers', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium only (DevTools protocol)');
  // Start on the welcome screen (little to autosave), fill the storage, then open data.
  await page.goto('/');
  await expect(page.locator('.welcome')).toBeVisible({ timeout: 30_000 });
  const origin = new URL(page.url()).origin;
  const cdp = await context.newCDPSession(page);
  try {
    await cdp.send('Storage.overrideQuotaForOrigin' as any, { origin, quotaSize: 40 * 1024 * 1024 } as any);
  } catch {
    test.skip(true, 'This Chromium has no Storage.overrideQuotaForOrigin');
  }
  // Fill Cache Storage with "model" files until the browser refuses (the owner's state).
  const filled = await page.evaluate(async () => {
    const base = 'https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC/resolve/main/';
    const c = await caches.open('webllm/model');
    let n = 0;
    let error = '';
    // Big files first, then smaller ones, so that almost nothing is left.
    for (const size of [4e6, 256e3, 16e3]) {
      try {
        for (let k = 0; k < 400; k++, n++) await c.put(`${base}params_shard_${n}.bin`, new Response(new Uint8Array(size).map((_, i) => (i * 7 + n) & 255)));
      } catch (e: any) {
        error = String(e?.name);
      }
    }
    return { n, error };
  });
  expect(filled.error).toBe('QuotaExceededError');
  // Opening the sample survey needs more room for autosave, which now fails for real: the banner appears.
  await loadSampleFromWelcome(page);
  const banner = page.getByTestId('storage-full-banner');
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await banner.getByRole('button', { name: 'Manage storage' }).click();
  const dlg = page.getByRole('dialog', { name: 'Browser storage' });
  await expect(dlg.getByTestId('storage-model')).toContainText('Better quality');
  await expect(dlg.getByTestId('storage-total')).toContainText('free');
  await dlg.getByTestId('storage-delete-all').click();
  await expect(dlg.getByTestId('storage-model')).toHaveCount(0);
  // Chromium frees deleted Cache Storage space once nothing refers to the caches any more (garbage
  // collection, which a real browser runs soon on its own); autosave keeps trying (2 s, 4 s, 8 s...).
  await cdp.send('HeapProfiler.collectGarbage');
  await expect(banner).toHaveCount(0, { timeout: 15_000 });
  const n = await page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('webllm')).length);
  expect(n).toBe(0);
});
