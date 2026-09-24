// The guided check for an AI program on this computer (src/platform/ai-local.ts), against a fake
// fetch that behaves like Ollama / LM Studio seen from another website. The same logic is exercised in
// a real browser against scripts/diagnostics/fake-ollama.mjs by e2e/ai-local.spec.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addressAdvice, detectBrowser, detectOs, isLocalServiceUrl, isLoopbackUrl, localDiagnostics, localKind, matchModel, ollamaOriginsFix, parseModelList,
  queryLocalNetworkPermission, runLocalCheck, serverRoot, type LocalCheckResult,
} from '../../src/platform/ai-local';
import { __reloadAiSettings } from '../../src/platform/ai';
import { jsonResponse, memoryStorage, sseResponse } from './helpers';

const ORIGIN = 'https://hackhead95.github.io';
const CHROME_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  vi.stubGlobal('location', { origin: ORIGIN, protocol: 'https:' });
  __reloadAiSettings();
});
afterEach(() => vi.unstubAllGlobals());

interface FakeOpts {
  running?: boolean;
  /** CORS: does the program allow this website? */
  allowed?: boolean;
  models?: string[];
  reply?: string;
  flavour?: 'ollama' | 'lmstudio';
  status?: number;
}

/** A fetch that behaves like the browser talking to a local program. */
function fakeFetch(o: FakeOpts = {}) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const { running = true, allowed = true, models = ['llama3.2:latest'], reply = 'OK', flavour = 'ollama' } = o;
  const f = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (!running) throw new TypeError('Failed to fetch');
    if (init.mode === 'no-cors') return new Response(null, { status: 200 });
    if (!allowed) throw new TypeError('Failed to fetch'); // blocked by CORS
    const path = new URL(url).pathname;
    if (path === '/api/version') return jsonResponse({ version: '0.12.3' });
    if (path === '/api/tags') return jsonResponse({ models: models.map((name) => ({ name, size: 2e9 })) });
    if (path === '/v1/models') return o.status ? jsonResponse({ error: 'no' }, o.status) : jsonResponse({ object: 'list', data: models.map((id) => ({ id })) });
    if (path === '/v1/chat/completions') {
      const body = JSON.parse(String(init.body));
      if (!models.some((m) => m === body.model || m === `${body.model}:latest`)) return jsonResponse({ error: { message: `model "${body.model}" not found, try pulling it first` } }, 404);
      return sseResponse([`data: ${JSON.stringify({ choices: [{ delta: { content: reply.slice(0, 1) } }] })}\n\n`, `data: ${JSON.stringify({ choices: [{ delta: { content: reply.slice(1) } }] })}\n\ndata: [DONE]\n\n`]);
    }
    return new Response('404 page not found', { status: 404 });
  });
  void flavour;
  // The final question goes through the app's own request code (ai-http), which uses the global fetch.
  vi.stubGlobal('fetch', f);
  return { f: f as unknown as typeof fetch, calls };
}

const nav = (state?: 'granted' | 'denied' | 'prompt', name = 'loopback-network') => ({
  userAgent: CHROME_WIN,
  platform: 'Win32',
  permissions: {
    query: async (d: { name: string }) => {
      if (!state || d.name !== name) throw new TypeError(`'${d.name}' is not a valid enum value of type PermissionName`);
      return { state };
    },
  },
});

const OLLAMA = { preset: 'ollama', baseUrl: 'http://localhost:11434/v1', apiKey: '', model: 'llama3.2' };
const status = (r: LocalCheckResult) => Object.fromEntries(r.steps.map((s) => [s.id, s.status]));

describe('addresses', () => {
  it('knows local addresses, the program kind and the server root', () => {
    expect(isLoopbackUrl('http://localhost:11434/v1')).toBe(true);
    expect(isLoopbackUrl('http://127.0.0.1:1234/v1')).toBe(true);
    expect(isLoopbackUrl('https://api.groq.com/openai/v1')).toBe(false);
    expect(isLocalServiceUrl('http://192.168.1.20:11434/v1')).toBe(true);
    expect(isLocalServiceUrl('http://studio.local:1234/v1')).toBe(true);
    expect(isLocalServiceUrl('https://openrouter.ai/api/v1')).toBe(false);
    expect(localKind('custom', 'http://localhost:11434/v1')).toBe('ollama');
    expect(localKind('custom', 'http://localhost:1234/v1')).toBe('lmstudio');
    expect(localKind('custom', 'http://localhost:8080/v1')).toBe('generic');
    expect(localKind('lmstudio', 'http://localhost:9999/v1')).toBe('lmstudio');
    expect(serverRoot('http://localhost:11434/v1/chat/completions')).toBe('http://localhost:11434');
  });

  it('advises /v1, http for local programs and localhost instead of 0.0.0.0 (127.0.0.1 is fine)', () => {
    expect(addressAdvice('http://localhost:11434/v1', 'ollama')).toBeNull();
    expect(addressAdvice('http://127.0.0.1:11434/v1', 'ollama')).toBeNull();
    expect(addressAdvice('http://127.0.0.1:11434', 'ollama')).toMatchObject({ suggested: 'http://127.0.0.1:11434/v1' });
    expect(addressAdvice('https://localhost:1234/v1', 'lmstudio')).toMatchObject({ suggested: 'http://localhost:1234/v1' });
    expect(addressAdvice('http://0.0.0.0:11434/v1', 'ollama')).toMatchObject({ suggested: 'http://localhost:11434/v1' });
    // Another computer over plain http from an https page is mixed content.
    expect(addressAdvice('http://192.168.1.20:11434/v1', 'generic', 'https:')).toMatchObject({ suggested: '' });
    expect(addressAdvice('http://192.168.1.20:11434/v1', 'generic', 'http:')).toBeNull();
  });
});

describe('this browser', () => {
  it('detects the operating system and browser', () => {
    expect(detectOs({ userAgent: CHROME_WIN, platform: 'Win32' })).toBe('windows');
    expect(detectOs({ userAgentData: { platform: 'macOS' } })).toBe('mac');
    expect(detectOs({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })).toBe('linux');
    expect(detectBrowser({ userAgent: CHROME_WIN })).toEqual({ family: 'chromium', name: 'Chrome', version: 145 });
    expect(detectBrowser({ userAgent: `${CHROME_WIN} Edg/145.0.0.0` }).name).toBe('Edge');
    expect(detectBrowser({ userAgent: 'Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/150.0' }).family).toBe('firefox');
    expect(detectBrowser({ userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15' })).toMatchObject({ family: 'safari', version: 26 });
  });

  it('reads the local network permission under its Chrome 145+ or 142-144 name, else null', async () => {
    expect(await queryLocalNetworkPermission(nav('denied'))).toEqual({ name: 'loopback-network', state: 'denied' });
    expect(await queryLocalNetworkPermission(nav('prompt', 'local-network-access'))).toEqual({ name: 'local-network-access', state: 'prompt' });
    expect(await queryLocalNetworkPermission(nav())).toBeNull();
    expect(await queryLocalNetworkPermission({})).toBeNull();
  });
});

describe('Ollama instructions', () => {
  it('use this website\'s address for every operating system', () => {
    const fixes = ollamaOriginsFix(ORIGIN);
    expect(fixes.map((x) => x.os)).toEqual(['windows', 'mac', 'linux']);
    const copies = (os: string) => fixes.find((x) => x.os === os)!.steps.map((s) => s.copy).filter(Boolean);
    expect(copies('windows')).toContain(`setx OLLAMA_ORIGINS "${ORIGIN}"`);
    expect(copies('mac')).toContain(`launchctl setenv OLLAMA_ORIGINS "${ORIGIN}"`);
    expect(fixes.find((x) => x.os === 'mac')!.steps.some((st) => /lost when the Mac restarts/.test(st.text))).toBe(true);
    expect(copies('windows')).toContain(`$env:OLLAMA_ORIGINS="${ORIGIN}"; ollama serve`);
    expect(copies('linux')).toEqual(['sudo systemctl edit ollama.service', `[Service]\nEnvironment="OLLAMA_ORIGINS=${ORIGIN}"`, 'sudo systemctl daemon-reload && sudo systemctl restart ollama', `OLLAMA_ORIGINS="${ORIGIN}" ollama serve`]);
  });

  it('match "llama3.2" to an installed llama3.2:latest and read both model lists', () => {
    expect(matchModel('llama3.2', [{ id: 'qwen2.5:1.5b' }, { id: 'llama3.2:latest' }])).toBe('llama3.2:latest');
    expect(matchModel('llama3.2:1b', [{ id: 'llama3.2:latest' }])).toBeNull();
    expect(matchModel('qwen2.5-7b-instruct', [{ id: 'lmstudio-community/qwen2.5-7b-instruct' }])).toBe('lmstudio-community/qwen2.5-7b-instruct');
    expect(parseModelList({ models: [{ name: 'llama3.2:latest', size: 5 }] })).toEqual([{ id: 'llama3.2:latest', size: 5 }]);
    expect(parseModelList({ data: [{ id: 'a' }, { id: '' }] })).toEqual([{ id: 'a' }]);
  });
});

describe('runLocalCheck', () => {
  it('not running: step 1 fails with how to start Ollama, the rest is skipped', async () => {
    const { f } = fakeFetch({ running: false });
    const r = await runLocalCheck(OLLAMA, { fetchImpl: f, navigatorImpl: nav() });
    expect(status(r)).toEqual({ running: 'fail', allowed: 'skip', permission: 'ok', model: 'skip', answer: 'skip' });
    expect(r.steps[0].detail).toContain('Nothing answered at http://localhost:11434');
    expect(r.steps[0].fix?.some((s) => s.copy === 'ollama serve')).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('blocked by the browser permission: says so, with where to allow it', async () => {
    const { f } = fakeFetch({ running: false });
    const r = await runLocalCheck(OLLAMA, { fetchImpl: f, navigatorImpl: nav('denied') });
    expect(status(r)).toMatchObject({ running: 'fail', permission: 'fail' });
    expect(r.steps[0].detail).toContain('The browser blocked this website');
    expect(r.steps.find((s) => s.id === 'permission')!.fix![0].text).toContain('"Apps on device (or Local network access)" to Allow');
  });

  it('localhost unreachable but 127.0.0.1 answers: carries on there and suggests that address', async () => {
    const base = fakeFetch({ reply: 'OK' });
    const f = (async (url: string, init?: RequestInit) => (url.startsWith('http://localhost') ? Promise.reject(new TypeError('Failed to fetch')) : base.f(url, init))) as typeof fetch;
    vi.stubGlobal('fetch', f);
    const r = await runLocalCheck(OLLAMA, { fetchImpl: f, navigatorImpl: nav() });
    expect(status(r)).toEqual({ running: 'warn', allowed: 'ok', permission: 'ok', model: 'ok', answer: 'ok' });
    expect(r.suggestedBaseUrl).toBe('http://127.0.0.1:11434/v1');
    expect(r.ok).toBe(false); // not until the address is saved
    expect(base.calls.at(-1)!.url).toBe('http://127.0.0.1:11434/v1/chat/completions');
  });

  it('asks Chrome for the loopback address space on every probe', async () => {
    const { f, calls } = fakeFetch();
    await runLocalCheck(OLLAMA, { fetchImpl: f, navigatorImpl: nav('granted') });
    const probes = calls.filter((c) => !c.url.endsWith('/chat/completions'));
    expect(probes.length).toBe(3);
    for (const c of probes) expect((c.init as any).targetAddressSpace).toBe('loopback');
  });

  it('Safari blocks it outright: say so and suggest Chrome, Edge or Firefox', async () => {
    const { f } = fakeFetch({ running: false });
    const safari = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15', permissions: { query: async () => { throw new TypeError('bad'); } } };
    const r = await runLocalCheck(OLLAMA, { fetchImpl: f, navigatorImpl: safari });
    expect(r.steps[0].detail).toContain('Safari blocks secure websites');
    expect(r.steps[0].detail).toContain('Chrome, Edge or Firefox');
    expect(status(r)).toMatchObject({ running: 'fail', permission: 'fail' });
  });

  it('Firefox: no permission query, but names its "Device apps and services" setting', async () => {
    const { f } = fakeFetch();
    const firefox = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0', permissions: { query: async () => { throw new TypeError('bad'); } } };
    const r = await runLocalCheck(OLLAMA, { fetchImpl: f, navigatorImpl: firefox });
    expect(r.ok).toBe(true);
    expect(r.permission).toBeNull();
  });

  it('running but refusing this website: shows the OLLAMA_ORIGINS fix', async () => {
    const { f, calls } = fakeFetch({ allowed: false });
    const r = await runLocalCheck(OLLAMA, { fetchImpl: f, navigatorImpl: nav('granted') });
    expect(status(r)).toEqual({ running: 'ok', allowed: 'fail', permission: 'ok', model: 'skip', answer: 'skip' });
    const allowed = r.steps.find((s) => s.id === 'allowed')!;
    expect(allowed.detail).toContain(`refused this website (${ORIGIN})`);
    expect(allowed.showOriginsFix).toBe(true);
    expect(calls[0]).toMatchObject({ url: 'http://localhost:11434/', init: { mode: 'no-cors' } });
    expect(calls[1].url).toBe('http://localhost:11434/api/version');
  });

  it('LM Studio refusing this website: Enable CORS', async () => {
    const { f } = fakeFetch({ allowed: false, flavour: 'lmstudio' });
    const r = await runLocalCheck({ preset: 'lmstudio', baseUrl: 'http://localhost:1234/v1', apiKey: '', model: '' }, { fetchImpl: f, navigatorImpl: nav() });
    const allowed = r.steps.find((s) => s.id === 'allowed')!;
    expect(allowed.detail).toContain('Enable CORS');
    expect(allowed.fix?.some((s) => s.copy === 'lms server start --cors')).toBe(true);
  });

  it('model missing: lists the installed ones and gives the pull command, without asking the model', async () => {
    const { f, calls } = fakeFetch({ models: ['qwen2.5:1.5b'] });
    const r = await runLocalCheck(OLLAMA, { fetchImpl: f, navigatorImpl: nav() });
    expect(status(r)).toMatchObject({ running: 'ok', allowed: 'ok', model: 'fail', answer: 'skip' });
    expect(r.models).toEqual([{ id: 'qwen2.5:1.5b', size: 2e9 }]);
    expect(r.steps.find((s) => s.id === 'model')!.fix?.[0].copy).toBe('ollama pull llama3.2');
    expect(calls.some((c) => c.url.endsWith('/chat/completions'))).toBe(false);
  });

  it('no models at all, and no model chosen', async () => {
    const empty = await runLocalCheck(OLLAMA, { fetchImpl: fakeFetch({ models: [] }).f, navigatorImpl: nav() });
    expect(empty.steps.find((s) => s.id === 'model')!.detail).toBe('Ollama has no models yet.');
    const lm = await runLocalCheck({ preset: 'lmstudio', baseUrl: 'http://localhost:1234/v1', apiKey: '', model: '' }, { fetchImpl: fakeFetch({ models: ['a', 'b'] }).f, navigatorImpl: nav() });
    expect(lm.steps.find((s) => s.id === 'model')!.detail).toContain('Choose one of the 2 installed models');
  });

  it('success: streams the answer with the installed model name, and reports each step', async () => {
    const { f, calls } = fakeFetch({ reply: 'OK' });
    const updates: LocalCheckResult[] = [];
    const seen: string[] = [];
    const r = await runLocalCheck({ ...OLLAMA, apiKey: 'sk-1' }, { fetchImpl: f, navigatorImpl: nav('granted'), onUpdate: (x) => updates.push(x), onText: (t) => seen.push(t) });
    expect(status(r)).toEqual({ running: 'ok', allowed: 'ok', permission: 'ok', model: 'ok', answer: 'ok' });
    expect(r.ok).toBe(true);
    expect(r.reply).toBe('OK');
    expect(r.matchedModel).toBe('llama3.2:latest');
    expect(r.version).toBe('0.12.3');
    expect(seen).toEqual(['O', 'OK']);
    expect(updates.length).toBeGreaterThan(5);
    const chat = calls.find((c) => c.url === 'http://localhost:11434/v1/chat/completions')!;
    expect(JSON.parse(String(chat.init.body))).toMatchObject({ model: 'llama3.2:latest', stream: true });
    expect((chat.init.headers as Record<string, string>).Authorization).toBe('Bearer sk-1');
  });

  it('an OpenAI-style server without an Ollama API lists models from /v1/models', async () => {
    const { f, calls } = fakeFetch({ models: ['mistral'] });
    const r = await runLocalCheck({ preset: 'custom', baseUrl: 'http://localhost:8080/v1', apiKey: '', model: 'mistral' }, { fetchImpl: f, navigatorImpl: nav() });
    expect(r.ok).toBe(true);
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual(['/', '/v1/models', '/v1/chat/completions']);
  });

  it('a key the program wants', async () => {
    const r = await runLocalCheck({ preset: 'lmstudio', baseUrl: 'http://localhost:1234/v1', apiKey: '', model: 'x' }, { fetchImpl: fakeFetch({ status: 401 }).f, navigatorImpl: nav() });
    expect(r.steps.find((s) => s.id === 'allowed')).toMatchObject({ status: 'fail' });
    expect(r.steps.find((s) => s.id === 'allowed')!.detail).toContain('asked for a key');
  });

  it('times out when nothing answers, and stops when asked', async () => {
    const hang = (async (_u: string, init: RequestInit) => new Promise((_, rej) => init.signal?.addEventListener('abort', () => rej(new DOMException('Aborted', 'AbortError'))))) as unknown as typeof fetch;
    const r = await runLocalCheck(OLLAMA, { fetchImpl: hang, navigatorImpl: nav(), timeoutMs: 30 });
    expect(r.steps[0].detail).toContain('No answer from http://localhost:11434 within 0 seconds');
    const ctrl = new AbortController();
    const p = runLocalCheck(OLLAMA, { fetchImpl: hang, navigatorImpl: nav(), signal: ctrl.signal, timeoutMs: 10_000 });
    setTimeout(() => ctrl.abort(), 10);
    await expect(p).rejects.toMatchObject({ code: 'cancelled' });
  });

  it('an invalid address fails at once', async () => {
    const r = await runLocalCheck({ ...OLLAMA, baseUrl: 'not a url' }, { fetchImpl: fakeFetch().f, navigatorImpl: nav() });
    expect(status(r)).toMatchObject({ running: 'fail', answer: 'skip' });
  });
});

describe('Copy details', () => {
  it('describes the set-up and each step, never the key', async () => {
    const cfg = { ...OLLAMA, apiKey: 'sk-secret-123' };
    const r = await runLocalCheck(cfg, { fetchImpl: fakeFetch({ allowed: false }).f, navigatorImpl: nav('granted') });
    r.log.push('echo sk-secret-123'); // even if a message echoed it
    const text = localDiagnostics(cfg, r, nav());
    expect(text).toContain(`Website: ${ORIGIN}`);
    expect(text).toContain('Base URL: http://localhost:11434/v1');
    expect(text).toContain('API key: set (not shown)');
    expect(text).toContain('Does it allow this website? FAIL');
    expect(text).toContain('permission: loopback-network=granted');
    expect(text).not.toContain('sk-secret-123');
    expect(localDiagnostics(OLLAMA, null, nav())).toContain('Test connection has not been run yet.');
  });
});
