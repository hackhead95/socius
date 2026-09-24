// Gemini and OpenAI-compatible adapters: request building, response parsing, SSE streaming and error codes.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  askGemini, askOpenAiCompatible, buildGeminiRequest, buildOpenAiRequest, geminiText, httpErrorCode, normaliseBaseUrl, readSse,
} from '../../src/platform/ai-http';
import { jsonResponse, sseResponse } from './helpers';

const gem = { apiKey: ' AIza-test ', model: 'gemini-2.5-flash' };
const oa = { baseUrl: 'https://api.groq.com/openai/v1/', apiKey: 'gsk_test', model: 'llama-3.3-70b-versatile' };

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn(async (url: string, init: RequestInit) => respond(url, init));
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('request building', () => {
  it('Gemini: model URL, key header, JSON mode, streaming URL', () => {
    const r = buildGeminiRequest(gem, 'Hello', { stream: false, json: true });
    expect(r.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
    expect(r.init.headers['x-goog-api-key']).toBe('AIza-test');
    expect(r.init.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(r.init.body);
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'Hello' }] }]);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    const s = buildGeminiRequest({ ...gem, model: 'models/gemini-2.5-flash-lite' }, 'Hi', { stream: true, maxTokens: 50 });
    expect(s.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse');
    const sb = JSON.parse(s.init.body);
    expect(sb.generationConfig.responseMimeType).toBeUndefined();
    expect(sb.generationConfig.maxOutputTokens).toBe(50);
    // The key never goes into the URL.
    expect(s.url).not.toContain('AIza');
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

describe('response parsing', () => {
  it('Gemini: joins text parts and skips thought parts', () => {
    expect(geminiText({ candidates: [{ content: { parts: [{ text: 'thinking', thought: true }, { text: 'Hello ' }, { text: 'world' }] } }] })).toBe('Hello world');
    expect(geminiText({})).toBe('');
  });

  it('Gemini non-streaming reply', async () => {
    const f = mockFetch(() => jsonResponse({ candidates: [{ content: { parts: [{ text: '{"codes":[]}' }] }, finishReason: 'STOP' }] }));
    expect(await askGemini(gem, 'p', { json: true })).toBe('{"codes":[]}');
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toContain(':generateContent');
  });

  it('Gemini streaming over SSE, with events split across network chunks', async () => {
    const ev = (t: string) => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] })}\r\n\r\n`;
    const all = ev('People ') + ev('describe ') + ev('water.');
    mockFetch(() => sseResponse([all.slice(0, 17), all.slice(17, 90), all.slice(90)]));
    const seen: string[] = [];
    const text = await askGemini(gem, 'p', { onText: (t) => seen.push(t) });
    expect(text).toBe('People describe water.');
    expect(seen).toEqual(['People ', 'People describe ', 'People describe water.']);
  });

  it('Gemini safety block with no text is reported as blocked', async () => {
    mockFetch(() => jsonResponse({ promptFeedback: { blockReason: 'SAFETY' } }));
    await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code: 'blocked' });
  });

  it('OpenAI-compatible: plain reply and SSE deltas ending with [DONE]', async () => {
    mockFetch(() => jsonResponse({ choices: [{ message: { role: 'assistant', content: 'OK' } }] }));
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

  it('an error event inside a stream becomes an AI error', async () => {
    mockFetch(() => sseResponse([`data: ${JSON.stringify({ error: { code: 429, message: 'Resource exhausted' } })}\n\n`]));
    await expect(askGemini(gem, 'p', { onText: () => undefined })).rejects.toMatchObject({ code: 'rate_limited' });
  });
});

describe('errors', () => {
  it('maps HTTP statuses to stable codes', () => {
    expect(httpErrorCode(400, 'API key not valid. Please pass a valid API key. (API_KEY_INVALID)')).toBe('invalid_key');
    expect(httpErrorCode(400, 'Invalid JSON payload received.')).toBe('bad_request');
    expect(httpErrorCode(400, "This model's maximum context length is 8192 tokens")).toBe('too_large');
    expect(httpErrorCode(401, '')).toBe('invalid_key');
    expect(httpErrorCode(403, 'Permission denied')).toBe('invalid_key');
    expect(httpErrorCode(404, 'models/gemini-9 is not found')).toBe('bad_model');
    expect(httpErrorCode(413, '')).toBe('too_large');
    expect(httpErrorCode(429, 'Resource has been exhausted')).toBe('rate_limited');
    expect(httpErrorCode(500, 'Internal')).toBe('unavailable');
    expect(httpErrorCode(503, 'The model is overloaded')).toBe('unavailable');
  });

  const cases: Array<[number, unknown, string]> = [
    [400, { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT', details: [{ reason: 'API_KEY_INVALID' }] } }, 'invalid_key'],
    [400, { error: { code: 400, message: 'Invalid value at generation_config', status: 'INVALID_ARGUMENT' } }, 'bad_request'],
    [401, { error: { message: 'Invalid API Key' } }, 'invalid_key'],
    [403, { error: { code: 403, message: 'Method doesn\'t allow unregistered callers', status: 'PERMISSION_DENIED' } }, 'invalid_key'],
    [429, [{ error: { code: 429, message: 'You exceeded your current quota', status: 'RESOURCE_EXHAUSTED' } }], 'rate_limited'],
    [500, { error: { code: 500, message: 'Internal error' } }, 'unavailable'],
  ];
  for (const [status, body, code] of cases) {
    it(`Gemini ${status} -> ${code}`, async () => {
      mockFetch(() => jsonResponse(body, status));
      await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code });
    });
    it(`OpenAI-compatible ${status} -> ${code}`, async () => {
      mockFetch(() => jsonResponse(body, status));
      await expect(askOpenAiCompatible(oa, 'p', { onText: () => undefined })).rejects.toMatchObject({ code });
    });
  }

  it('keeps the service message as detail', async () => {
    mockFetch(() => jsonResponse({ error: { message: 'model `foo` does not exist' } }, 404));
    await expect(askOpenAiCompatible(oa, 'p')).rejects.toMatchObject({ code: 'bad_model', detail: 'model `foo` does not exist' });
  });

  it('network failure, a plain-text error body, and cancelling', async () => {
    mockFetch(() => {
      throw new TypeError('Failed to fetch');
    });
    await expect(askGemini(gem, 'p')).rejects.toMatchObject({ code: 'network' });
    mockFetch(() => new Response('Bad gateway', { status: 502 }));
    await expect(askOpenAiCompatible(oa, 'p')).rejects.toMatchObject({ code: 'unavailable', detail: 'Bad gateway' });
    const ctrl = new AbortController();
    mockFetch((_u, init) => new Promise<Response>((_res, rej) => init.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))));
    const p = askGemini(gem, 'p', { signal: ctrl.signal });
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ code: 'cancelled' });
  });

  it('refuses to send without a key or model', async () => {
    const f = mockFetch(() => jsonResponse({}));
    await expect(askGemini({ apiKey: '', model: 'gemini-2.5-flash' }, 'p')).rejects.toMatchObject({ code: 'not_configured' });
    await expect(askOpenAiCompatible({ baseUrl: 'https://x/v1', apiKey: 'k', model: '' }, 'p')).rejects.toMatchObject({ code: 'not_configured' });
    expect(f).not.toHaveBeenCalled();
  });
});
