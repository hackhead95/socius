// Gemini (Interactions API first, generateContent as a fallback) and OpenAI-compatible adapters:
// request building, keys, replies (thinking, empty replies), every error shape the services send,
// automatic model choice with fallbacks, retries, time limits and network failures.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetGeminiState, __setHttpRetryDelay, askGemini, askOpenAiCompatible, buildGeminiRequest, buildInteractionRequest, buildOpenAiRequest, classifyServiceError, describeKey, geminiKeyKind,
  geminiKeyWarning, geminiModelName, geminiText, httpErrorCode, lastResolvedGeminiModel, listOpenAiModels, normaliseBaseUrl, parseServiceError, pickGeminiModel, rankGeminiModels, readSse,
  sanitizeApiKey, suggestOpenAiModels, type AiAttempt,
} from '../../src/platform/ai-http';
import { jsonResponse, sseResponse } from './helpers';
import { G, O, generateContent, generateContentMaxTokens, interaction, interactionIncomplete, interactionStream, modelList } from './gemini-fixtures';

const AIZA = 'AIzaSyA1234567890abcdefghijklmnopqrstuv'; // 39 characters, fake
const AQ = 'AQ.Ab8RN6Ldummy-key-for-tests_0123456789abcdef';
const gem = { apiKey: ` ${AIZA} `, model: 'gemini-3.8-flash' };
const oa = { baseUrl: 'https://api.groq.com/openai/v1/', apiKey: 'gsk_test', model: 'llama-3.3-70b-versatile' };

beforeEach(() => {
  __resetGeminiState();
  __setHttpRetryDelay(0);
});

afterEach(() => {
  vi.unstubAllGlobals();
  __setHttpRetryDelay(1500);
});

type Call = { url: string; init: RequestInit & { headers: Record<string, string> }; body: any };
function mockFetch(respond: (url: string, init: RequestInit, body: any, n: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fn = vi.fn(async (url: string, init: RequestInit) => {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ url, init: init as Call['init'], body });
    return respond(url, init, body, calls.length);
  });
  vi.stubGlobal('fetch', fn);
  return calls;
}
const isList = (u: string) => u.includes('/models?');
const isInteraction = (u: string) => u.endsWith('/v1beta/interactions');

describe('keys', () => {
  it('cleans pasted keys: spaces, line breaks, invisible characters, quotes, prefixes', () => {
    expect(sanitizeApiKey(`  ${AIZA}\n`)).toBe(AIZA);
    expect(sanitizeApiKey(`"${AIZA}"`)).toBe(AIZA);
    expect(sanitizeApiKey(`“${AIZA}”`)).toBe(AIZA);
    expect(sanitizeApiKey(`AIzaSyA12345\n67890abcdefghijklmnopqrstuv`)).toBe(AIZA);
    expect(sanitizeApiKey(`​${AIZA}﻿`)).toBe(AIZA);
    expect(sanitizeApiKey(`export GEMINI_API_KEY="${AIZA}"`)).toBe(AIZA);
    expect(sanitizeApiKey(`GOOGLE_API_KEY=${AQ}`)).toBe(AQ);
    expect(sanitizeApiKey('Bearer gsk_abc')).toBe('gsk_abc');
    expect(sanitizeApiKey(AQ)).toBe(AQ); // the dot is kept
  });

  it('knows the key formats and warns only about keys that do not look like Google keys', () => {
    expect(geminiKeyKind(AQ)).toBe('aq');
    expect(geminiKeyKind(AIZA)).toBe('aiza');
    expect(geminiKeyKind('sk-123')).toBe('other');
    expect(geminiKeyWarning(AQ)).toBeNull();
    expect(geminiKeyWarning('AQ.Ab8RN6Lshort')).toMatch(/only 15 characters/);
    expect(geminiKeyWarning(AIZA)).toMatch(/retiring/);
    expect(geminiKeyWarning('AIzaSyShort')).toMatch(/11 characters.*39/);
    expect(geminiKeyWarning('my key')).toMatch(/start with "AQ\." or "AIza"/);
    expect(geminiKeyWarning('')).toBeNull();
    expect(describeKey(` "${AQ}" `)).toBe(`set (${AQ.length} characters, starts with "AQ.", cleaned when pasted)`);
    expect(describeKey('')).toBe('none');
  });
});

describe('request building', () => {
  it('Interactions: model and prompt in the body, key in a header, low thinking, room for thinking, JSON, no storage, streaming', () => {
    const r = buildInteractionRequest(gem, 'Hello', { stream: false, json: true, maxTokens: 50 });
    expect(r.url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(r.init.headers['x-goog-api-key']).toBe(AIZA);
    expect(r.url).not.toContain('AIza');
    const body = JSON.parse(r.init.body);
    expect(body).toMatchObject({ model: 'gemini-3.8-flash', input: 'Hello', store: false, response_format: { type: 'text', mime_type: 'application/json' } });
    expect(body.generation_config).toEqual({ thinking_level: 'low', max_output_tokens: 1074 });
    expect(body.stream).toBeUndefined();
    const s = JSON.parse(buildInteractionRequest({ apiKey: AQ, model: 'models/gemini-2.5-flash' }, 'Hi', { stream: true, thinking: false, noStore: false }).init.body);
    expect(s).toEqual({ model: 'gemini-2.5-flash', input: 'Hi', stream: true });
    expect(buildInteractionRequest({ apiKey: AQ, model: 'gemini-flash-latest' }, 'x', { stream: true }).init.headers.Accept).toBe('text/event-stream');
  });

  it('generateContent (fallback): thinking settings per model family', () => {
    const r = buildGeminiRequest(gem, 'Hello', { stream: false, json: true });
    expect(r.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
    const body = JSON.parse(r.init.body);
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'Hello' }] }]);
    expect(body.generationConfig).toMatchObject({ responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'low' } });
    const f25 = JSON.parse(buildGeminiRequest({ ...gem, model: 'gemini-2.5-flash-lite' }, 'Hi', { stream: true, maxTokens: 50 }).init.body).generationConfig;
    expect(f25.thinkingConfig).toEqual({ thinkingBudget: 0 });
    expect(f25.maxOutputTokens).toBe(50); // thinking is off: no extra room needed
    expect(JSON.parse(buildGeminiRequest({ ...gem, model: 'gemini-2.5-pro' }, 'Hi', { stream: false }).init.body).generationConfig.thinkingConfig).toEqual({ thinkingBudget: 128 });
    expect(JSON.parse(buildGeminiRequest({ ...gem, model: 'gemini-2.0-flash' }, 'Hi', { stream: false }).init.body).generationConfig.thinkingConfig).toBeUndefined();
    expect(buildGeminiRequest({ ...gem, model: 'gemini-3.8-flash' }, 'x', { stream: true }).url).toMatch(/:streamGenerateContent\?alt=sse$/);
  });

  it('OpenAI-compatible: base URL normalised, bearer key, stream flag; no key header for local servers', () => {
    const r = buildOpenAiRequest(oa, 'Hello', { stream: true });
    expect(r.url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(r.init.headers.Authorization).toBe('Bearer gsk_test');
    const body = JSON.parse(r.init.body);
    expect(body).toMatchObject({ model: 'llama-3.3-70b-versatile', stream: true, messages: [{ role: 'user', content: 'Hello' }] });
    expect(body.response_format).toBeUndefined();
    const local = buildOpenAiRequest({ baseUrl: 'http://localhost:11434/v1/chat/completions', apiKey: '', model: 'llama3.2' }, 'x', { stream: false });
    expect(local.url).toBe('http://localhost:11434/v1/chat/completions');
    expect(local.init.headers.Authorization).toBeUndefined();
    expect(normaliseBaseUrl(' https://openrouter.ai/api/v1// ')).toBe('https://openrouter.ai/api/v1');
  });
});

describe('Gemini replies', () => {
  it('Interactions: skips the thought step and returns the text; sends one request with an explicit model', async () => {
    const calls = mockFetch(() => interaction('OK'));
    expect(await askGemini(gem, 'p', { json: true })).toBe('OK');
    expect(calls).toHaveLength(1);
    expect(isInteraction(calls[0].url)).toBe(true);
    expect(calls[0].body.response_format.mime_type).toBe('application/json');
  });

  it('Interactions: older replies with `outputs` instead of `steps`', async () => {
    mockFetch(() => jsonResponse({ id: 'x', status: 'completed', outputs: [{ type: 'thought', signature: 's' }, { type: 'text', text: 'Hello ' }, { type: 'text', text: 'there' }] }));
    expect(await askGemini(gem, 'p')).toBe('Hello there');
  });

  it('Interactions streaming: thought signature deltas, text deltas split across network chunks', async () => {
    const calls = mockFetch(() => interactionStream(['People ', 'describe ', 'water.']));
    const seen: string[] = [];
    expect(await askGemini(gem, 'p', { onText: (t) => seen.push(t) })).toBe('People describe water.');
    expect(seen).toEqual(['People ', 'People describe ', 'People describe water.']);
    expect(calls[0].body.stream).toBe(true);
  });

  it('thinking used every output token: a clear max_tokens error (Interactions and generateContent)', async () => {
    mockFetch(() => interactionIncomplete());
    await expect(askGemini(gem, 'p', { maxTokens: 20 })).rejects.toMatchObject({ code: 'max_tokens', model: 'gemini-3.8-flash' });
    // generateContent: interactions endpoint missing for this AIza key, then MAX_TOKENS with no text.
    __resetGeminiState();
    mockFetch((u) => (isInteraction(u) ? G.endpointNotFound() : generateContentMaxTokens()));
    await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code: 'max_tokens', api: 'generateContent' });
  });

  it('generateContent: thought parts are skipped, text with a thoughtSignature is kept', async () => {
    expect(geminiText({ candidates: [{ content: { parts: [{ text: 'thinking', thought: true }, { text: 'Hello ', thoughtSignature: 'x' }, { text: 'world' }] } }] })).toBe('Hello world');
    expect(geminiText({})).toBe('');
    mockFetch((u) => (isInteraction(u) ? G.endpointNotFound() : generateContent('OK')));
    expect(await askGemini(gem, 'p')).toBe('OK');
  });

  it('safety blocks and recitation become their own codes', async () => {
    mockFetch((u) => (isInteraction(u) ? G.endpointNotFound() : jsonResponse({ promptFeedback: { blockReason: 'PROHIBITED_CONTENT' } })));
    await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code: 'blocked' });
    __resetGeminiState();
    mockFetch((u) => (isInteraction(u) ? G.endpointNotFound() : jsonResponse({ candidates: [{ finishReason: 'RECITATION', content: { role: 'model' } }] })));
    await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code: 'recitation' });
    __resetGeminiState();
    mockFetch(() => jsonResponse({ id: 'x', status: 'failed', steps: [{ type: 'model_output', error: { code: 3, message: 'The response was blocked due to SAFETY.' } }] }));
    await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code: 'blocked' });
  });

  it('an error event inside a stream becomes an AI error', async () => {
    mockFetch(() => sseResponse([`data: ${JSON.stringify({ event_type: 'error', error: { code: 'resource_exhausted', message: 'Resource has been exhausted (e.g. check quota).' } })}\n\n`]));
    await expect(askGemini(gem, 'p', { onText: () => undefined })).rejects.toMatchObject({ code: 'rate_limited' });
    mockFetch(() => sseResponse([`data: ${JSON.stringify({ error: { code: 503, message: 'The model is overloaded.' } })}\n\n`]));
    await expect(askGemini(gem, 'p', { onText: () => undefined })).rejects.toMatchObject({ code: 'overloaded' });
  });
});

describe('Gemini errors, one per real error shape', () => {
  const cases: Array<[string, () => Response, string]> = [
    ['invalid key (400 API_KEY_INVALID)', () => G.apiKeyInvalid(), 'invalid_key'],
    ['expired key', () => G.apiKeyExpired(), 'invalid_key'],
    ['website restriction (403 API_KEY_HTTP_REFERRER_BLOCKED)', () => G.referrerBlocked(), 'referrer_blocked'],
    ['API not enabled (403 SERVICE_DISABLED)', () => G.serviceDisabled(), 'api_disabled'],
    ['key restricted to other APIs (403 API_KEY_SERVICE_BLOCKED)', () => G.keyServiceBlocked(), 'key_restricted'],
    ['suspended (403 CONSUMER_SUSPENDED)', () => G.consumerSuspended(), 'key_suspended'],
    ['region (400 FAILED_PRECONDITION)', () => G.locationUnsupported(), 'region'],
    ['per-minute limit (429)', () => G.quotaPerMinute('gemini-3.8-flash'), 'rate_limited'],
    ['request too large (413)', () => jsonResponse({ error: { code: 413, message: 'Request payload size exceeds the limit', status: 'INVALID_ARGUMENT' } }, 413), 'too_large'],
  ];
  for (const [name, res, code] of cases) {
    it(`${name} -> ${code}`, async () => {
      const calls = mockFetch(() => res());
      const err: any = await askGemini(gem, 'p').catch((e) => e);
      expect(err.code).toBe(code);
      expect(err.httpStatus).toBeGreaterThanOrEqual(400);
      expect(calls).toHaveLength(1); // no pointless retries with other models
    });
  }

  it('per-minute limit keeps the retry delay and says it is per minute', async () => {
    mockFetch(() => G.quotaPerMinute('gemini-3.8-flash'));
    await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code: 'rate_limited', retryAfterMs: 21_000, perMinute: true, daily: false });
  });

  it('maps statuses and messages to stable codes', () => {
    expect(httpErrorCode(400, 'API key not valid. Please pass a valid API key. (API_KEY_INVALID)')).toBe('invalid_key');
    expect(httpErrorCode(400, 'Invalid JSON payload received.')).toBe('bad_request');
    expect(httpErrorCode(400, "This model's maximum context length is 8192 tokens")).toBe('too_large');
    expect(httpErrorCode(401, '')).toBe('invalid_key');
    expect(httpErrorCode(403, 'Permission denied')).toBe('invalid_key');
    expect(httpErrorCode(404, 'models/gemini-9 is not found')).toBe('bad_model');
    expect(httpErrorCode(413, '')).toBe('too_large');
    expect(httpErrorCode(429, 'Resource has been exhausted')).toBe('rate_limited');
    expect(httpErrorCode(500, 'Internal')).toBe('unavailable');
    expect(httpErrorCode(503, 'The model is overloaded')).toBe('overloaded');
    expect(httpErrorCode(504, 'Deadline exceeded')).toBe('timeout');
    const s = parseServiceError(401, JSON.stringify([{ error: { code: 401, message: 'Request had invalid authentication credentials. Expected OAuth 2 access token', status: 'UNAUTHENTICATED', details: [{ reason: 'ACCESS_TOKEN_TYPE_UNSUPPORTED' }] } }]));
    // An "AQ." key Google cannot validate gets this reply on every endpoint: a key problem, wherever it happens.
    expect(classifyServiceError(s, 'list')).toBe('key_not_accepted');
    expect(classifyServiceError(s, 'generate')).toBe('key_not_accepted');
    const q = parseServiceError(429, JSON.stringify({ error: { code: 429, message: 'Quota exceeded for metric: x, limit: 0, model: gemini-3.1-pro-preview', status: 'RESOURCE_EXHAUSTED' } }));
    expect(q.zeroQuota).toBe(true);
    expect(parseServiceError(429, JSON.stringify({ error: { message: 'limit: 10' } })).zeroQuota).toBe(false);
  });

  it('network failures: offline, blocked, a key the browser refuses to send, cancelling', async () => {
    mockFetch(() => {
      throw new TypeError('Failed to fetch');
    });
    await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code: 'network', host: 'generativelanguage.googleapis.com' });
    vi.stubGlobal('navigator', { onLine: false, userAgent: 'test' });
    await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code: 'offline' });
    vi.stubGlobal('navigator', { onLine: true, userAgent: 'test' });
    mockFetch(() => {
      throw new TypeError("Failed to execute 'fetch' on 'Window': Failed to read the 'headers' property from 'RequestInit': String contains non ISO-8859-1 code point.");
    });
    await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code: 'bad_key_format' });
    const ctrl = new AbortController();
    mockFetch((_u, init) => new Promise<Response>((_res, rej) => init.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))));
    const p = askGemini(gem, 'p', { signal: ctrl.signal });
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ code: 'cancelled' });
  });

  it('gives up after the time limit with a timeout error', async () => {
    mockFetch((_u, init) => new Promise<Response>((_res, rej) => init.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))));
    await expect(askGemini(gem, 'p', { timeoutMs: 30 })).rejects.toMatchObject({ code: 'timeout' });
  });

  it('refuses to send without a key or model', async () => {
    const calls = mockFetch(() => jsonResponse({}));
    await expect(askGemini({ apiKey: '  ', model: 'gemini-3.8-flash' }, 'p')).rejects.toMatchObject({ code: 'not_configured' });
    await expect(askOpenAiCompatible({ baseUrl: 'https://x/v1', apiKey: 'k', model: '' }, 'p')).rejects.toMatchObject({ code: 'not_configured' });
    expect(calls).toHaveLength(0);
  });
});

describe('AQ. keys (AI Studio auth keys, 2026)', () => {
  it('go to the Interactions API first, in the x-goog-api-key header only', async () => {
    const calls = mockFetch((u) => (isList(u) ? modelList(['gemini-2.5-flash', 'gemini-3.8-flash']) : isInteraction(u) ? interaction('OK') : generateContent('wrong API')));
    expect(await askGemini({ apiKey: AQ, model: '' }, 'p')).toBe('OK');
    expect(calls.map((c) => c.url)).toEqual(['https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', 'https://generativelanguage.googleapis.com/v1beta/interactions']);
    expect(calls[0].init.headers['x-goog-api-key']).toBe(AQ);
    expect(calls[1].init.headers['x-goog-api-key']).toBe(AQ);
    expect(calls[1].init.headers.Authorization).toBeUndefined();
    expect(Object.keys(calls[1].init.headers).map((h) => h.toLowerCase())).not.toContain('api-revision');
    expect(calls[1].body.model).toBe('gemini-3.8-flash');
  });

  it('a key Google cannot validate fails at the model list as key_not_accepted', async () => {
    const calls = mockFetch(() => G.accessTokenTypeUnsupported('google.ai.generativelanguage.v1beta.ModelService.ListModels'));
    await expect(askGemini({ apiKey: AQ, model: '' }, 'p')).rejects.toMatchObject({ code: 'key_not_accepted', reason: 'ACCESS_TOKEN_TYPE_UNSUPPORTED', keyKind: 'aq' });
    expect(calls).toHaveLength(1);
  });

  it('ACCESS_TOKEN_TYPE_UNSUPPORTED when answering: a key problem, no switch to generateContent, no other models', async () => {
    const calls = mockFetch((u) => (isList(u) ? modelList(['gemini-3.8-flash', 'gemini-3.5-flash-lite']) : G.accessTokenTypeUnsupported()));
    await expect(askGemini({ apiKey: AQ, model: '' }, 'p')).rejects.toMatchObject({ code: 'key_not_accepted' });
    expect(calls.some((c) => c.url.includes(':generateContent'))).toBe(false);
    expect(calls.filter((c) => isInteraction(c.url))).toHaveLength(1);
  });

  it('Interactions endpoint missing (404, not a key problem): falls back to generateContent, for AQ. keys too', async () => {
    const calls = mockFetch((u) => (isInteraction(u) ? G.endpointNotFound() : generateContent('OK')));
    expect(await askGemini({ apiKey: AQ, model: 'gemini-3.8-flash' }, 'p')).toBe('OK');
    expect(calls.map((c) => (isInteraction(c.url) ? 'interactions' : 'generateContent'))).toEqual(['interactions', 'generateContent']);
    expect(calls[1].init.headers['x-goog-api-key']).toBe(AQ);
  });

  it('an AIza key: the generateContent fallback is remembered for next time', async () => {
    const calls = mockFetch((u) => (isInteraction(u) ? G.endpointNotFound() : generateContent('OK')));
    expect(await askGemini(gem, 'p')).toBe('OK');
    expect(calls.map((c) => (isInteraction(c.url) ? 'interactions' : 'generateContent'))).toEqual(['interactions', 'generateContent']);
    calls.length = 0;
    expect(await askGemini(gem, 'p')).toBe('OK');
    expect(calls.map((c) => (isInteraction(c.url) ? 'interactions' : 'generateContent'))).toEqual(['generateContent']);
  });
});

describe('automatic Gemini model choice and fallbacks', () => {
  const names = (list: string[]) => list.map((n) => ({ name: `models/${n}`, supportedGenerationMethods: ['generateContent', 'countTokens'] }));

  it('ranks the newest stable Flash model first and skips special-purpose ones', () => {
    const models = names(['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.6-flash-image', 'gemini-3.7-flash-preview-09-2026', 'gemini-3.6-pro', 'gemini-3.6-flash-tts', 'gemma-3-27b-it']);
    models.push({ name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] });
    expect(pickGeminiModel(models)).toBe('gemini-3.6-flash');
    // Pro has no free tier: last.
    expect(rankGeminiModels(models)).toEqual(['gemini-3.6-flash', 'gemini-3.7-flash-preview-09-2026', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-3.6-pro']);
    expect(rankGeminiModels(models, 'lite')).toEqual(['gemini-2.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash-preview-09-2026', 'gemini-2.0-flash', 'gemini-3.6-pro']);
    expect(pickGeminiModel(names(['gemini-3.6-flash-lite', 'gemini-3.6-pro']))).toBe('gemini-3.6-flash-lite');
    expect(pickGeminiModel(names(['gemini-3.7-flash-preview-09-2026']))).toBe('gemini-3.7-flash-preview-09-2026');
    // Google's "-latest" alias ranks with the newest listed version.
    expect(rankGeminiModels(names(['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-pro-preview']))[0]).toBe('gemini-flash-latest');
    // A newer preview Flash comes before an older stable one (older ones get retired for new keys).
    expect(pickGeminiModel(names(['gemini-2.5-flash', 'gemini-3-flash-preview']))).toBe('gemini-3-flash-preview');
    expect(pickGeminiModel([])).toBe('');
    // "Automatic" favours Flash-Lite (more free requests per day) unless Flash is preferred.
    const current = names(['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro-preview', 'gemini-2.5-flash']);
    expect(pickGeminiModel(current, 'lite')).toBe('gemini-3.5-flash-lite');
    expect(pickGeminiModel(current, 'flash')).toBe('gemini-3.8-flash');
  });

  it('lists the models when no model is set, then generates with the pick and remembers it', async () => {
    const calls = mockFetch((u) => (isList(u) ? modelList(['gemini-2.5-flash', 'gemini-3.8-flash']) : interaction('OK')));
    let answered = '';
    await expect(askGemini({ apiKey: AIZA, model: 'auto-flash' }, 'p', { onModel: (m) => (answered = m) })).resolves.toBe('OK');
    expect(calls[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000');
    expect(calls[1].body.model).toBe('gemini-3.8-flash');
    expect(answered).toBe('gemini-3.8-flash');
    expect(lastResolvedGeminiModel(AIZA, 'flash')).toBe('gemini-3.8-flash');
    // The default automatic choice is Flash-Lite.
    __resetGeminiState();
    const calls2 = mockFetch((u) => (isList(u) ? modelList(['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite']) : interaction('OK')));
    await askGemini({ apiKey: AIZA, model: '' }, 'p');
    expect(calls2[1].body.model).toBe('gemini-3.5-flash-lite');
    expect(lastResolvedGeminiModel(AIZA)).toBe('gemini-3.5-flash-lite');
  });

  it('free limit 0 for the first model: tries the next one, which answers, and remembers it', async () => {
    const trace: AiAttempt[] = [];
    const calls = mockFetch((u, _i, body) => {
      if (isList(u)) return modelList(['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest']);
      if (body.model === 'gemini-flash-lite-latest') return G.quotaZero('gemini-flash-lite-latest');
      return interaction(`OK from ${body.model}`);
    });
    expect(await askGemini({ apiKey: AIZA, model: '' }, 'p', { trace })).toBe('OK from gemini-3.5-flash-lite');
    expect(calls.filter((c) => isInteraction(c.url)).map((c) => c.body.model)).toEqual(['gemini-flash-lite-latest', 'gemini-3.5-flash-lite']);
    expect(trace.map((a) => a.httpStatus)).toEqual([200, 429, 200]);
    expect(trace[1]).toMatchObject({ model: 'gemini-flash-lite-latest', apiStatus: 'RESOURCE_EXHAUSTED', ok: false });
    expect(JSON.stringify(trace)).not.toContain(AIZA);
    // Next time the model that worked goes first.
    calls.length = 0;
    await askGemini({ apiKey: AIZA, model: '' }, 'p');
    expect(calls.filter((c) => isInteraction(c.url)).map((c) => c.body.model)).toEqual(['gemini-3.5-flash-lite']);
  });

  it('a typed model retired for new users: falls back, reports it, and names the reason', async () => {
    const calls = mockFetch((u, _i, body) => {
      if (isList(u)) return modelList(['gemini-3.8-flash']);
      if (body?.model === 'gemini-2.5-flash' || u.includes('gemini-2.5-flash:')) return G.notForNewUsers('gemini-2.5-flash');
      return interaction('OK');
    });
    let fellBackTo = '';
    let why = '';
    await expect(askGemini({ apiKey: AIZA, model: 'gemini-2.5-flash' }, 'p', { onModelFallback: (m, r) => ((fellBackTo = m), (why = r ?? '')) })).resolves.toBe('OK');
    expect(fellBackTo).toBe('gemini-3.8-flash');
    expect(why).toBe('bad_model');
    // Interactions said 404; generateContent was tried too for this AIza key; then the listed model.
    expect(calls.map((c) => (isList(c.url) ? 'list' : isInteraction(c.url) ? `i:${c.body.model}` : 'gc'))).toEqual(['i:gemini-2.5-flash', 'gc', 'list', 'i:gemini-3.8-flash']);
  });

  it('403 on one model, free limit 0 on the others: moves on; at most three models, then one clear error', async () => {
    const calls = mockFetch((u, _i, body) => {
      if (isList(u)) return modelList(['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']);
      if (body?.model === 'gemini-flash-latest') return G.modelPermission('gemini-flash-latest');
      if (body?.model === 'gemini-3.8-flash') return G.quotaZero('gemini-3.8-flash');
      return G.quotaZero(body?.model ?? 'x');
    });
    const err: any = await askGemini({ apiKey: AQ, model: 'auto-flash' }, 'p').catch((e) => e);
    expect(err.code).toBe('no_free_quota');
    expect(err.tried).toEqual(['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash']);
    expect(err.detail).toContain('limit 0');
    expect(calls.filter((c) => isInteraction(c.url))).toHaveLength(3);
  });

  it('a model that rejects the thinking setting is retried once without it', async () => {
    const calls = mockFetch((_u, _i, body) => (body.generation_config?.thinking_level ? G.thinkingLevelUnsupported() : interaction('OK')));
    expect(await askGemini(gem, 'p')).toBe('OK');
    expect(calls.map((c) => c.body.generation_config?.thinking_level ?? null)).toEqual(['low', null]);
    // Remembered for this model.
    calls.length = 0;
    await askGemini(gem, 'p');
    expect(calls).toHaveLength(1);
  });

  it('"store" refused as an unknown field: retried once without it', async () => {
    const calls = mockFetch((_u, _i, body) => ('store' in body ? G.unknownStoreField() : interaction('OK')));
    expect(await askGemini(gem, 'p')).toBe('OK');
    expect(calls.map((c) => 'store' in c.body)).toEqual([true, false]);
  });

  it('503 overloaded is retried once after a pause', async () => {
    const calls = mockFetch((_u, _i, _b, n) => (n === 1 ? G.overloaded() : interaction('OK')));
    expect(await askGemini(gem, 'p')).toBe('OK');
    expect(calls).toHaveLength(2);
  });

  it('a model list that cannot be read falls back to Google\'s standard names', async () => {
    const calls = mockFetch((u) => (isList(u) ? G.internal() : interaction('OK')));
    expect(await askGemini({ apiKey: AIZA, model: '' }, 'p')).toBe('OK');
    expect(calls.find((c) => isInteraction(c.url))?.body.model).toBe('gemini-flash-lite-latest');
  });

  it('treats "auto" and a "models/" prefix sensibly', () => {
    expect(geminiModelName('auto')).toBe('');
    expect(geminiModelName('auto-flash')).toBe('');
    expect(geminiModelName('models/gemini-3.6-flash')).toBe('gemini-3.6-flash');
  });
});

describe('OpenAI-compatible services', () => {
  it('plain reply and SSE deltas ending with [DONE]', async () => {
    mockFetch(() => O.chat('OK'));
    expect(await askOpenAiCompatible(oa, 'p')).toBe('OK');
    const d = (t: string) => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`;
    mockFetch(() => sseResponse([': keep-alive\n\n', d('A'), d('B') + d(''), 'data: [DONE]\n\n']));
    const seen: string[] = [];
    expect(await askOpenAiCompatible(oa, 'p', { onText: (t) => seen.push(t) })).toBe('AB');
    expect(seen).toEqual(['A', 'AB']);
  });

  it('readSse joins multi-line data fields and handles a final event without a blank line', async () => {
    const got: string[] = [];
    await readSse(sseResponse(['data: {"a":\ndata: 1}\n\n', 'event: x\ndata: last']).body!, (d) => got.push(d));
    expect(got).toEqual(['{"a":\n1}', 'last']);
  });

  const cases: Array<[string, () => Response, Record<string, unknown>]> = [
    ['Groq invalid key', O.groqInvalidKey, { code: 'invalid_key', reason: 'invalid_api_key' }],
    ['Groq unknown model', () => O.groqModelMissing('llama3-70b'), { code: 'bad_model' }],
    ['Groq decommissioned model', () => O.groqDecommissioned('llama3-70b-8192'), { code: 'bad_model' }],
    ['Groq tokens per minute', O.groqRateLimit, { code: 'rate_limited', perMinute: true, retryAfterMs: 6500 }],
    ['OpenRouter no key', O.openrouterNoAuth, { code: 'invalid_key' }],
    ['OpenRouter model gone', () => O.openrouterNoEndpoints('meta-llama/llama-3.3-70b-instruct:free'), { code: 'bad_model' }],
    ['OpenRouter no credit', O.openrouterCredits, { code: 'payment_required' }],
    ['OpenRouter daily free limit', O.openrouterDaily, { code: 'rate_limited', daily: true }],
    ['OpenRouter 200 with an error body', O.openrouter200Error, { code: 'unavailable', detail: expect.stringContaining('upstream timed out') }],
    ['403 from a service', G.noKey, { code: 'invalid_key' }],
  ];
  for (const [name, res, expected] of cases) {
    it(name, async () => {
      mockFetch(() => res());
      await expect(askOpenAiCompatible(oa, 'p')).rejects.toMatchObject(expected);
    });
  }

  it('a stream with no readable events is an error, not an empty answer; a local program\'s 403 means "allow this website"', async () => {
    mockFetch(() => sseResponse(['data: {not json\n\n', 'data: [DONE]\n\n']));
    await expect(askOpenAiCompatible(oa, 'p', { onText: () => undefined })).rejects.toMatchObject({ code: 'unavailable' });
    mockFetch(() => new Response('Forbidden', { status: 403 }));
    await expect(askOpenAiCompatible({ baseUrl: 'http://localhost:11434/v1', apiKey: '', model: 'llama3.2' }, 'p')).rejects.toMatchObject({ code: 'local_forbidden' });
  });

  it('keeps the service message as detail; plain-text bodies; one retry on 5xx', async () => {
    mockFetch(() => jsonResponse({ error: { message: 'model `foo` does not exist' } }, 404));
    await expect(askOpenAiCompatible(oa, 'p')).rejects.toMatchObject({ code: 'bad_model', detail: 'model `foo` does not exist' });
    const calls = mockFetch(() => new Response('Bad gateway', { status: 502 }));
    await expect(askOpenAiCompatible(oa, 'p')).rejects.toMatchObject({ code: 'unavailable', detail: 'Bad gateway' });
    expect(calls).toHaveLength(2);
    mockFetch(() => jsonResponse({ choices: [{ message: { content: '' }, finish_reason: 'length' }] }));
    await expect(askOpenAiCompatible(oa, 'p')).rejects.toMatchObject({ code: 'max_tokens' });
  });

  it('requests to a program on this computer are marked for Chrome\'s local network permission; others are not', async () => {
    const calls = mockFetch(() => O.chat('OK'));
    await askOpenAiCompatible({ baseUrl: 'http://localhost:11434/v1', apiKey: '', model: 'llama3.2' }, 'p');
    await askOpenAiCompatible({ baseUrl: 'http://127.0.0.1:1234/v1', apiKey: '', model: 'm' }, 'p');
    await askOpenAiCompatible({ baseUrl: 'http://ollama.localhost:11434/v1', apiKey: '', model: 'm' }, 'p');
    await askOpenAiCompatible(oa, 'p');
    mockFetch(() => O.groqModels());
    expect((calls.map((c) => (c.init as any).targetAddressSpace))).toEqual(['loopback', 'loopback', 'loopback', undefined]);
    const listCalls = mockFetch(() => O.groqModels());
    await listOpenAiModels({ baseUrl: 'http://[::1]:8080/v1', apiKey: '' });
    expect((listCalls[0].init as any).targetAddressSpace).toBe('loopback');
    // Google is never marked.
    const g = mockFetch(() => interaction('OK'));
    await askGemini(gem, 'p');
    expect((g[0].init as any).targetAddressSpace).toBeUndefined();
  });

  it('lists models (Groq, OpenRouter) and suggests chat models, free ones first', async () => {
    mockFetch(() => O.groqModels());
    const g = await listOpenAiModels(oa);
    expect(g).toContain('llama-3.3-70b-versatile');
    expect(suggestOpenAiModels(g!)).not.toContain('whisper-large-v3');
    mockFetch(() => O.openrouterModels());
    const r = await listOpenAiModels({ baseUrl: 'https://openrouter.ai/api/v1', apiKey: '' });
    expect(suggestOpenAiModels(r!)).toEqual(['deepseek/deepseek-chat-v3.1:free', 'qwen/qwen3-235b-a22b:free', 'meta-llama/llama-3.3-70b-instruct']);
    mockFetch(() => new Response('not here', { status: 404 }));
    expect(await listOpenAiModels(oa)).toBeNull();
    mockFetch(() => O.groqInvalidKey());
    await expect(listOpenAiModels(oa)).rejects.toMatchObject({ code: 'invalid_key' });
  });
});
