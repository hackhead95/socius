// The step-by-step connection check (AI assistant settings > Test connection) and the "Copy details"
// reports: each step's state for success and for the common failures, and no key in any report.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __reloadAiSettings, saveAiSettings } from '../../src/platform/ai';
import { __resetGeminiState, __setHttpRetryDelay } from '../../src/platform/ai-http';
import { aiErrorReport, connectionReport, redactSecrets, runConnectionCheck, type ConnectionCheck } from '../../src/platform/ai-diagnose';
import { __setWebLlmLoader } from '../../src/platform/ai-webllm';
import { __resetCapabilityCache } from '../../src/platform/claude';
import { memoryStorage } from './helpers';
import { G, O, interaction, modelList } from './gemini-fixtures';

const AQ = 'AQ.Ab8RN6LsecretSECRETsecret_0123456789abcdefghijk';
const AIZA = 'AIzaSyA1234567890abcdefghijklmnopqrstuv';

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  vi.stubGlobal('navigator', { onLine: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/140 Test' });
  __resetCapabilityCache();
  __setWebLlmLoader(null, { ok: false, reason: 'no_api', f16: false });
  __reloadAiSettings();
  __resetGeminiState();
  __setHttpRetryDelay(0);
});

afterEach(() => {
  vi.unstubAllGlobals();
  __setHttpRetryDelay(1500);
});

function route(respond: (url: string, body: any) => Response) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => respond(url, typeof init?.body === 'string' ? JSON.parse(init.body) : undefined));
  vi.stubGlobal('fetch', fn);
  return fn;
}

const states = (c: ConnectionCheck) => Object.fromEntries(c.steps.map((s) => [s.label, s.state]));

describe('Gemini connection check', () => {
  it('success: five ticks, the model that answered and its reply; updates as it goes', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: AQ, model: '' } });
    route((u) => (u.includes('/models?') ? modelList(['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro-preview']) : interaction('OK', 'gemini-3.5-flash-lite')));
    const seen: string[] = [];
    const c = await runConnectionCheck({ onUpdate: (u) => seen.push(u.steps.map((s) => s.state[0]).join('')) });
    expect(states(c)).toEqual({ 'Internet connection': 'ok', 'Reached Google': 'ok', 'Key accepted': 'ok', 'Model chosen': 'ok', 'Got an answer': 'ok' });
    expect(c.ok).toBe(true);
    expect(c.model).toBe('gemini-3.5-flash-lite');
    expect(c.reply).toBe('OK');
    expect(c.steps.find((s) => s.id === 'model')?.detail).toContain('gemini-3.5-flash-lite (automatic');
    expect(c.steps.find((s) => s.id === 'answer')?.detail).toBe('gemini-3.5-flash-lite answered: "OK"');
    expect(seen[0]).toBe('ppppp');
    expect(seen).toContain('oooor'); // model chosen while the answer runs
    expect(c.running).toBe(false);
  });

  it('invalid key: stops at "Key accepted" with the reason, and skips the rest', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: AIZA, model: '' } });
    const f = route(() => G.apiKeyInvalid());
    const c = await runConnectionCheck();
    expect(states(c)).toEqual({ 'Internet connection': 'ok', 'Reached Google': 'ok', 'Key accepted': 'fail', 'Model chosen': 'skip', 'Got an answer': 'skip' });
    expect(c.error).toMatchObject({ code: 'invalid_key', httpStatus: 400, apiStatus: 'INVALID_ARGUMENT', reason: 'API_KEY_INVALID' });
    expect(c.error?.message).toContain('did not accept the key');
    expect(c.error?.message).toContain('retiring older keys'); // an AIza key
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('AQ. key Google cannot validate: a key problem with advice', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: AQ, model: '' } });
    route(() => G.accessTokenTypeUnsupported('google.ai.generativelanguage.v1beta.ModelService.ListModels'));
    const c = await runConnectionCheck();
    expect(states(c)['Key accepted']).toBe('fail');
    expect(c.error?.code).toBe('key_not_accepted');
    expect(c.error?.message).toMatch(/copied the whole key.*wait a few minutes/);
  });

  it('free limit 0 on the first model, success on the next: the checklist names both', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: AQ, model: '' } });
    route((u, body) => (u.includes('/models?') ? modelList(['gemini-flash-lite-latest', 'gemini-3.5-flash-lite']) : body.model === 'gemini-flash-lite-latest' ? G.quotaZero(body.model) : interaction('OK')));
    const c = await runConnectionCheck();
    expect(c.ok).toBe(true);
    expect(c.tried).toEqual(['gemini-flash-lite-latest', 'gemini-3.5-flash-lite']);
    expect(c.steps.find((s) => s.id === 'model')?.detail).toBe('gemini-3.5-flash-lite (gemini-flash-lite-latest could not be used, so Socius moved on)');
    const report = connectionReport(c);
    expect(report).toContain('429 RESOURCE_EXHAUSTED');
    expect(report).toContain('Models tried: gemini-flash-lite-latest, gemini-3.5-flash-lite');
  });

  it('region not supported: fails at "Got an answer" with the explanation', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: AQ, model: '' } });
    route((u) => (u.includes('/models?') ? modelList(['gemini-3.5-flash-lite']) : G.locationUnsupported()));
    const c = await runConnectionCheck();
    expect(states(c)).toMatchObject({ 'Key accepted': 'ok', 'Model chosen': 'ok', 'Got an answer': 'fail' });
    expect(c.error?.code).toBe('region');
    expect(c.error?.message).toContain('VPN');
  });

  it('offline: stops at step 1 without sending anything', async () => {
    vi.stubGlobal('navigator', { onLine: false, userAgent: 'x' });
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: AQ, model: '' } });
    const f = route(() => interaction('OK'));
    const c = await runConnectionCheck();
    expect(states(c)['Internet connection']).toBe('fail');
    expect(c.error?.code).toBe('offline');
    expect(f).not.toHaveBeenCalled();
  });

  it('online but Google unreachable (blocked): fails at "Reached Google" with what may block it', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: AQ, model: '' } });
    route(() => {
      throw new TypeError('Failed to fetch');
    });
    const c = await runConnectionCheck();
    expect(states(c)).toMatchObject({ 'Internet connection': 'ok', 'Reached Google': 'fail', 'Key accepted': 'skip' });
    expect(c.error?.code).toBe('network');
    expect(c.error?.message).toMatch(/ad or privacy blocker.*firewall.*VPN/);
  });

  it('stopping the check marks the remaining steps as stopped', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: AQ, model: '' } });
    const ctrl = new AbortController();
    vi.stubGlobal('fetch', vi.fn((_u: string, init: RequestInit) => new Promise<Response>((_r, rej) => init.signal!.addEventListener('abort', () => rej(new DOMException('a', 'AbortError'))))));
    const p = runConnectionCheck({ signal: ctrl.signal });
    ctrl.abort();
    const c = await p;
    expect(c.error?.code).toBe('cancelled');
    expect(c.steps.find((s) => s.id === 'reach')?.detail).toBe('Stopped.');
  });
});

describe('OpenAI-compatible connection check', () => {
  it('a typed model the service does not offer: lists its models for a picker', async () => {
    saveAiSettings({ provider: 'openai', openai: { preset: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'sk-or-v1-abcdef0123456789abcdef', model: 'meta-llama/llama-3.3-70b-instruct:free' } });
    route((u) => (u.endsWith('/models') ? O.openrouterModels() : O.openrouterNoEndpoints('meta-llama/llama-3.3-70b-instruct:free')));
    const c = await runConnectionCheck();
    expect(c.steps.map((s) => s.label)).toEqual(['Internet connection', 'Reached openrouter.ai', 'Key accepted', 'Model available', 'Got an answer']);
    expect(states(c)).toMatchObject({ 'Reached openrouter.ai': 'ok', 'Model available': 'fail', 'Got an answer': 'fail' });
    expect(c.models).toEqual(['deepseek/deepseek-chat-v3.1:free', 'qwen/qwen3-235b-a22b:free', 'meta-llama/llama-3.3-70b-instruct']);
    expect(c.error?.code).toBe('bad_model');
  });

  it('Groq: key refused at the model list', async () => {
    saveAiSettings({ provider: 'openai', openai: { preset: 'groq', baseUrl: 'https://api.groq.com/openai/v1', apiKey: 'gsk_wrongwrongwrongwrong', model: 'llama-3.3-70b-versatile' } });
    route(() => O.groqInvalidKey());
    const c = await runConnectionCheck();
    expect(states(c)).toMatchObject({ 'Reached api.groq.com': 'ok', 'Key accepted': 'fail', 'Model available': 'skip' });
    expect(c.error?.code).toBe('invalid_key');
  });

  it('Groq: success', async () => {
    saveAiSettings({ provider: 'openai', openai: { preset: 'groq', baseUrl: 'https://api.groq.com/openai/v1', apiKey: 'gsk_right', model: 'llama-3.3-70b-versatile' } });
    route((u) => (u.endsWith('/models') ? O.groqModels() : O.chat('OK')));
    const c = await runConnectionCheck();
    expect(c.ok).toBe(true);
    expect(Object.values(states(c))).toEqual(['ok', 'ok', 'ok', 'ok', 'ok']);
  });
});

describe('reports never contain a key', () => {
  it('connection report: version, browser, online status, steps, HTTP statuses, Google status and reason; no key', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: `  ${AQ}\n`, model: '' } });
    // A service message that (unusually) echoes the key must not leak it either.
    route((u) => (u.includes('/models?') ? modelList(['gemini-3.5-flash-lite']) : G.googleEcho(AQ)));
    const c = await runConnectionCheck();
    const r = connectionReport(c);
    expect(r).toMatch(/^Socius AI connection report\nApp: Socius \d/);
    expect(r).toContain('Browser: Mozilla/5.0 (Windows NT 10.0) Chrome/140 Test');
    expect(r).toContain('Online (browser says): yes');
    expect(r).toContain('Key: set (');
    expect(r).toContain('starts with "AQ."');
    expect(r).toContain('[ok] Key accepted');
    expect(r).toContain('[fail] Got an answer');
    expect(r).toContain('GET https://generativelanguage.googleapis.com/v1beta/models?…');
    expect(r).toContain('POST https://generativelanguage.googleapis.com/v1beta/interactions [gemini-3.5-flash-lite, interactions] -> 400 INVALID_ARGUMENT');
    expect(r).not.toContain(AQ);
    expect(r).not.toContain(AQ.slice(3, 20));
  });

  it('error report for Explain / the assistant', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: AIZA, model: 'gemini-3.8-flash' } });
    const err = Object.assign(new Error('x'), { code: 'rate_limited', detail: `quota for ${AIZA}`, httpStatus: 429, apiStatus: 'RESOURCE_EXHAUSTED', daily: true, tried: ['gemini-3.8-flash'], trace: [] });
    const r = aiErrorReport(err, 'Explain with AI');
    expect(r).toContain('While: Explain with AI');
    expect(r).toContain('Error: code rate_limited, HTTP 429, status RESOURCE_EXHAUSTED');
    expect(r).toContain('Limit: daily');
    expect(r).not.toContain(AIZA);
  });

  it('redactSecrets removes Google, OpenAI-style and Groq keys, bearer tokens and key= parameters', () => {
    const t = redactSecrets(`a ${AIZA} b ${AQ} c sk-or-v1-0123456789abcdef d gsk_0123456789abcdef e Bearer abc.def.ghi f https://x/y?key=zzz&alt=sse x-goog-api-key: qwertyuiop`);
    expect(t).not.toMatch(/AIzaSy|AQ\.Ab8|sk-or-v1-0|gsk_0|abc\.def|zzz|qwertyuiop/);
    expect(t).toContain('Bearer [key removed]');
    expect(t).toContain('?key=[removed]&alt=sse');
  });
});
