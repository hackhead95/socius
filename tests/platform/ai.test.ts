// Provider layer: settings persistence, provider choice, tolerant JSON, routing, the unchanged Claude path.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AI_SETTINGS_KEY, DEFAULT_PROMPT_BUDGET_BYTES, OPENAI_PRESETS, __reloadAiSettings, aiAvailable, aiErrorMessage, aiErrorText, aiPromptBudget, askAI, askAIJson,
  effectiveProvider, extractJson, forgetAiKey, getAiSettings, getAiStatus, parseAiSettings, providerLabel, providerPrivacy, refreshAiStatus, saveAiSettings,
  stripThinking, subscribeAi, subscribeAiSettings, testAiConnection,
} from '../../src/platform/ai';
import { __resetCapabilityCache } from '../../src/platform/claude';
import * as host from '../../src/platform/host';
import { WEBLLM_PROMPT_BUDGET_BYTES, __setWebLlmLoader } from '../../src/platform/ai-webllm';
import { jsonResponse, memoryStorage } from './helpers';

let store: ReturnType<typeof memoryStorage>;

beforeEach(() => {
  store = memoryStorage();
  vi.stubGlobal('localStorage', store);
  __resetCapabilityCache();
  __setWebLlmLoader(null, { ok: false, reason: 'no_api', f16: false });
  __reloadAiSettings();
});

afterEach(() => {
  vi.unstubAllGlobals();
  __resetCapabilityCache();
});

describe('settings persistence', () => {
  it('starts with defaults and no provider when nothing is stored', () => {
    const s = getAiSettings();
    expect(s.provider).toBeNull();
    expect(s.gemini).toEqual({ apiKey: '', model: 'gemini-2.5-flash' });
    expect(s.openai.baseUrl).toBe(OPENAI_PRESETS.groq.baseUrl);
    expect(effectiveProvider()).toBeNull();
    expect(getAiStatus().ready).toBe('no');
  });

  it('saves to localStorage only and reads it back after a reload', () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: 'AIza123', model: 'gemini-2.5-flash-lite' } });
    const raw = JSON.parse(store.data.get(AI_SETTINGS_KEY)!);
    expect(raw.provider).toBe('gemini');
    expect(raw.gemini.apiKey).toBe('AIza123');
    __reloadAiSettings();
    expect(getAiSettings().gemini.model).toBe('gemini-2.5-flash-lite');
    expect(effectiveProvider()).toBe('gemini');
    expect(providerLabel('gemini')).toBe('Google Gemini (gemini-2.5-flash-lite)');
  });

  it('forget key removes only the key', () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: 'AIza123', model: 'gemini-2.5-flash' } });
    forgetAiKey('gemini');
    __reloadAiSettings();
    expect(getAiSettings().gemini).toEqual({ apiKey: '', model: 'gemini-2.5-flash' });
    expect(getAiSettings().provider).toBe('gemini');
  });

  it('tolerates corrupt or partial stored settings', () => {
    expect(parseAiSettings('{not json').provider).toBeNull();
    const p = parseAiSettings(JSON.stringify({ provider: 'bogus', openai: { preset: 'ollama' }, webllm: { model: 'unknown' } }));
    expect(p.provider).toBeNull();
    expect(p.openai.baseUrl).toBe('http://localhost:11434/v1');
    expect(p.webllm.model).toBe('Qwen2.5-1.5B-Instruct-q4f16_1-MLC');
  });

  it('keeps working when storage throws (private windows, blocked storage)', () => {
    vi.stubGlobal('localStorage', memoryStorage({ throwOnGet: true, throwOnSet: true }));
    __reloadAiSettings();
    expect(getAiSettings().provider).toBeNull();
    expect(() => saveAiSettings({ provider: 'gemini' })).not.toThrow();
    expect(getAiSettings().provider).toBe('gemini');
  });

  it('notifies settings listeners synchronously and status listeners after the check', async () => {
    const settingsSeen = vi.fn();
    const statusSeen = vi.fn();
    const u1 = subscribeAiSettings(settingsSeen);
    const u2 = subscribeAi(statusSeen);
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: 'k', model: 'gemini-2.5-flash' } });
    expect(settingsSeen).toHaveBeenCalledTimes(1);
    const st = await refreshAiStatus();
    expect(st).toMatchObject({ provider: 'gemini', ready: 'yes', privacy: 'google' });
    expect(statusSeen).toHaveBeenCalled();
    u1();
    u2();
  });
});

describe('provider choice', () => {
  it('uses Claude automatically inside the artifact, unless the user chose another provider', () => {
    vi.stubGlobal('claude', { use: async () => null });
    expect(effectiveProvider()).toBe('claude');
    saveAiSettings({ provider: 'gemini' });
    expect(effectiveProvider()).toBe('gemini');
    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', store);
    saveAiSettings({ provider: 'claude' });
    // A stored "claude" choice outside the artifact means nothing is set up.
    expect(effectiveProvider()).toBeNull();
  });

  it('is available only when configured', async () => {
    expect(await aiAvailable()).toBe(false);
    saveAiSettings({ provider: 'gemini' });
    expect(await aiAvailable()).toBe(false);
    saveAiSettings({ gemini: { apiKey: 'k', model: 'gemini-2.5-flash' } });
    expect(await aiAvailable()).toBe(true);
    saveAiSettings({ provider: 'openai', openai: { preset: 'custom', baseUrl: 'http://localhost:11434/v1', apiKey: '', model: '' } });
    expect(await aiAvailable()).toBe(false);
    saveAiSettings({ openai: { ...getAiSettings().openai, model: 'llama3.2' } });
    expect(await aiAvailable()).toBe(true);
    saveAiSettings({ provider: 'webllm' });
    expect(await aiAvailable()).toBe(false); // no WebGPU in this test
  });

  it('prompt budget and privacy follow the provider', () => {
    expect(aiPromptBudget()).toBe(DEFAULT_PROMPT_BUDGET_BYTES);
    saveAiSettings({ provider: 'webllm' });
    expect(aiPromptBudget()).toBe(WEBLLM_PROMPT_BUDGET_BYTES);
    expect(providerPrivacy('webllm')).toBe('local');
    saveAiSettings({ provider: 'openai', openai: { preset: 'groq', baseUrl: OPENAI_PRESETS.groq.baseUrl, apiKey: 'k', model: 'm' } });
    expect(aiPromptBudget()).toBe(OPENAI_PRESETS.groq.budget);
    expect(providerPrivacy('openai')).toBe('third-party');
    saveAiSettings({ openai: { preset: 'custom', baseUrl: 'http://127.0.0.1:1234/v1', apiKey: '', model: 'm' } });
    expect(providerPrivacy('openai')).toBe('local');
    expect(aiPromptBudget()).toBe(10_000);
  });
});

describe('tolerant JSON extraction', () => {
  it('parses the whole reply', () => {
    expect(extractJson(' {"codes":[1]} ')).toEqual({ codes: [1] });
    expect(extractJson('[{"id":"r1","codes":[]}]')).toEqual([{ id: 'r1', codes: [] }]);
  });
  it('parses a fenced block', () => {
    expect(extractJson('Here you go:\n```json\n{"a":1}\n```\nHope this helps.')).toEqual({ a: 1 });
    expect(extractJson('```\n[1,2]\n```')).toEqual([1, 2]);
  });
  it('falls back to the first bracket to the last', () => {
    expect(extractJson('Sure! {"codes":[{"name":"x"}]} Let me know.')).toEqual({ codes: [{ name: 'x' }] });
    expect(extractJson('The answer is [{"id":"r1"}] as requested')).toEqual([{ id: 'r1' }]);
    expect(extractJson('Answer: [{"id":"r1","codes":["a"]}]. Note {braces} later')).toEqual([{ id: 'r1', codes: ['a'] }]);
  });
  it('skips thinking blocks', () => {
    expect(extractJson('<think>maybe {"no":1}</think>\n{"yes":2}')).toEqual({ yes: 2 });
    expect(stripThinking('<think>partial')).toBe('');
  });
  it('rejects replies without JSON', () => {
    expect(() => extractJson('I cannot help with that.')).toThrow(expect.objectContaining({ code: 'invalid_json' }));
    expect(() => extractJson('')).toThrow(expect.objectContaining({ code: 'invalid_json' }));
    expect(() => extractJson('{"a": [1, 2}')).toThrow(expect.objectContaining({ code: 'invalid_json' }));
  });
});

describe('asking', () => {
  it('without a provider, rejects not_configured and sends nothing', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    await expect(askAI('hi')).rejects.toMatchObject({ code: 'not_configured' });
    expect(f).not.toHaveBeenCalled();
  });

  it('routes to Gemini with JSON mode and parses a fenced JSON reply', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: 'AIzaKEY', model: 'gemini-2.5-flash' } });
    const f = vi.fn(async (_url: string, _init: RequestInit) => jsonResponse({ candidates: [{ content: { parts: [{ text: '```json\n{"codes":[{"name":"Water"}]}\n```' }] } }] }));
    vi.stubGlobal('fetch', f);
    const out = await askAIJson<{ codes: Array<{ name: string }> }>('propose a codebook');
    expect(out.codes[0].name).toBe('Water');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/models/gemini-2.5-flash:generateContent');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('AIzaKEY');
    expect(JSON.parse(init.body as string).generationConfig.responseMimeType).toBe('application/json');
  });

  it('routes to an OpenAI-compatible service and strips thinking from text', async () => {
    saveAiSettings({ provider: 'openai', openai: { preset: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'sk-or', model: 'x:free' } });
    const f = vi.fn(async () => jsonResponse({ choices: [{ message: { content: '<think>hmm</think>OK' } }] }));
    vi.stubGlobal('fetch', f);
    expect(await testAiConnection()).toBe('OK');
    expect((f.mock.calls[0] as unknown[])[0]).toBe('https://openrouter.ai/api/v1/chat/completions');
  });

  it('invalid JSON from a provider becomes invalid_json', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: 'k', model: 'gemini-2.5-flash' } });
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ candidates: [{ content: { parts: [{ text: 'Sorry, no.' }] } }] })));
    await expect(askAIJson('x')).rejects.toMatchObject({ code: 'invalid_json' });
  });
});

describe('Claude artifact path (unchanged)', () => {
  function installClaude(mode: 'ok' | 'not_granted' = 'ok') {
    const calls: Array<{ kind: string; prompt: string; opts: any }> = [];
    const fail = () => Object.assign(new Error('nope'), { code: 'not_granted' });
    const sample: any = vi.fn(async (prompt: string, opts: any) => {
      calls.push({ kind: 'text', prompt, opts });
      if (mode !== 'ok') throw fail();
      opts.onText?.({ text: 'Hel' });
      opts.onText?.({ text: 'Hello' });
      return { text: 'Hello' };
    });
    sample.json = vi.fn(async (prompt: string, opts: any) => {
      calls.push({ kind: 'json', prompt, opts });
      if (mode !== 'ok') throw fail();
      return { codes: [] };
    });
    vi.stubGlobal('claude', { use: async (name: string) => (name === 'sample' ? sample : null) });
    return calls;
  }

  it('askAI / askAIJson use the sample capability with the model tier and streamed text', async () => {
    const calls = installClaude();
    expect(effectiveProvider()).toBe('claude');
    expect(await aiAvailable()).toBe(true);
    const seen: string[] = [];
    expect(await askAI('summarise', { modelTier: 'complex', onText: (t) => seen.push(t) })).toBe('Hello');
    expect(seen).toEqual(['Hel', 'Hello']);
    expect(await askAIJson('codebook')).toEqual({ codes: [] });
    expect(calls.map((c) => [c.kind, c.opts.modelTier])).toEqual([['text', 'complex'], ['json', 'default']]);
    const st = await refreshAiStatus();
    expect(st).toMatchObject({ provider: 'claude', ready: 'yes', label: 'Claude', privacy: 'claude' });
  });

  it('keeps the capability error codes and the older host exports', async () => {
    installClaude('not_granted');
    await expect(askAIJson('x')).rejects.toMatchObject({ code: 'not_granted' });
    await expect(host.askClaude('x')).rejects.toMatchObject({ code: 'not_granted' });
    expect(host.aiErrorMessage('not_granted')).toContain('not allowed');
    expect(typeof host.askClaudeJson).toBe('function');
    expect(await host.aiAvailable()).toBe(true);
  });
});

describe('messages', () => {
  it('has a plain-language message for every stable code, with no em-dashes', () => {
    const codes = ['not_configured', 'invalid_key', 'rate_limited', 'network', 'cancelled', 'invalid_json', 'webgpu_unavailable', 'model_download_failed', 'unavailable', 'not_granted', 'too_large', 'bad_model', 'bad_request', 'blocked'];
    const msgs = codes.map(aiErrorMessage);
    expect(new Set(msgs).size).toBe(codes.length);
    for (const m of msgs) expect(m).not.toMatch(/—/);
    expect(aiErrorMessage('rate_limited')).toContain('Too many AI requests');
    expect(aiErrorMessage('webgpu_unavailable')).toMatch(/Chrome or Edge/);
    expect(aiErrorText({ code: 'bad_model', detail: 'model x not found' })).toContain('The service said: model x not found');
    expect(aiErrorText({ code: 'invalid_key', detail: 'secret' })).not.toContain('secret');
  });
});
