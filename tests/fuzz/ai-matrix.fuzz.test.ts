// AI provider error matrix (pure, mocked fetch):
//   providers {Gemini AIza key, Gemini AQ. key, OpenAI-compatible (Groq), local (Ollama)} x
//   responses {200 text, 200 with thought parts, 200 empty (MAX_TOKENS), 400 invalid key,
//              401 ACCESS_TOKEN_TYPE_UNSUPPORTED, 403 referrer blocked, 403 service disabled, 404 model,
//              429 per minute, 429 per day / limit 0, 500, 503, network TypeError, abort, malformed JSON,
//              SSE split across chunks, mid-stream error event} x
//   modes {test connection, askAI text, askAIJson, streaming}.
// Invariant: every combination ends in a result or an AiError with a known code, and the user-facing
// text (aiErrorText) is plain English (never "TypeError", "Failed to fetch", "undefined", JSON...).
// Response shapes follow docs/research/gemini-auth-keys-and-interactions-api.md: Interactions error
// bodies are a JSON array [{error}], also for stream:true; Interactions SSE events are data-only JSON
// with event_type step.start/step.delta/step.stop/interaction.completed/error, ending with [DONE].
// The AI layer is being reworked; this suite only uses the public functions in src/platform/ai.ts.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as ai from '../../src/platform/ai';
import * as http from '../../src/platform/ai-http';
import * as claude from '../../src/platform/claude';
import { Collector } from './lib/findings';
import { badWords } from './lib/invariants';

const col = new Collector('ai');
const out = (s: string) => process.stdout.write(s + '\n');

// ---------- in-memory localStorage ----------
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
  };
}

// ---------- providers ----------
type ProviderId = 'gemini-aiza' | 'gemini-aq' | 'openai' | 'local';
const PROVIDERS: Record<ProviderId, () => void> = {
  'gemini-aiza': () => ai.saveAiSettings({ provider: 'gemini', gemini: { apiKey: 'AIzaSyD-FAKEfakeFAKEfake0123456789abcde', model: '' } as never }),
  'gemini-aq': () => ai.saveAiSettings({ provider: 'gemini', gemini: { apiKey: 'AQ.Ab8RN6LfakeFAKEfake0123456789abcdefghij', model: '' } as never }),
  openai: () => ai.saveAiSettings({ provider: 'openai', openai: { preset: 'groq', baseUrl: 'https://api.groq.com/openai/v1', apiKey: 'gsk_fakeFAKEfake', model: 'llama-3.3-70b-versatile' } }),
  local: () => ai.saveAiSettings({ provider: 'openai', openai: { preset: 'ollama', baseUrl: 'http://localhost:11434/v1', apiKey: '', model: 'llama3.2' } }),
};

// ---------- scenarios ----------
type Scenario =
  | 'ok' | 'thought' | 'empty-max-tokens' | '400-invalid-key' | '401-aq-token-type' | '403-referrer' | '403-service-disabled' | '404-model'
  | '429-minute' | '429-daily-limit-0' | '500' | '503' | 'network' | 'abort' | 'malformed-json' | 'sse-split' | 'midstream-error'
  | 'interactions-unsupported';
const SCENARIOS: Scenario[] = ['ok', 'thought', 'empty-max-tokens', '400-invalid-key', '401-aq-token-type', '403-referrer', '403-service-disabled', '404-model', '429-minute', '429-daily-limit-0', '500', '503', 'network', 'abort', 'malformed-json', 'sse-split', 'midstream-error', 'interactions-unsupported'];
type Mode = 'test' | 'text' | 'json' | 'stream';
const MODES: Mode[] = ['test', 'text', 'json', 'stream'];

const googleError = (code: number, status: string, message: string, reason?: string, extra: object[] = []) => ({
  error: { code, message, status, details: [...(reason ? [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason, domain: 'googleapis.com', metadata: { service: 'generativelanguage.googleapis.com' } }] : []), ...extra] },
});

const ERRORS: Partial<Record<Scenario, { status: number; google: object; openai: object }>> = {
  '400-invalid-key': { status: 400, google: googleError(400, 'INVALID_ARGUMENT', 'API key not valid. Please pass a valid API key.', 'API_KEY_INVALID'), openai: { error: { message: 'Invalid API Key', type: 'invalid_request_error', code: 'invalid_api_key' } } },
  '401-aq-token-type': {
    status: 401,
    google: googleError(401, 'UNAUTHENTICATED', 'Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential. See https://developers.google.com/identity/sign-in/web/devconsole-project.', 'ACCESS_TOKEN_TYPE_UNSUPPORTED'),
    openai: { error: { message: 'Invalid API Key', type: 'invalid_request_error', code: 'invalid_api_key' } },
  },
  '403-referrer': { status: 403, google: googleError(403, 'PERMISSION_DENIED', 'Requests from referer https://hackhead95.github.io/ are blocked.', 'API_KEY_HTTP_REFERRER_BLOCKED'), openai: { error: { message: 'Forbidden', type: 'permission_error' } } },
  '403-service-disabled': {
    status: 403,
    google: googleError(403, 'PERMISSION_DENIED', 'Generative Language API has not been used in project 1234 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=1234 then retry.', 'SERVICE_DISABLED'),
    openai: { error: { message: 'Project disabled', type: 'permission_error' } },
  },
  '404-model': { status: 404, google: googleError(404, 'NOT_FOUND', 'models/gemini-x is not found for API version v1beta, or is not supported for generateContent.'), openai: { error: { message: 'The model `llama-x` does not exist or you do not have access to it.', type: 'invalid_request_error', code: 'model_not_found' } } },
  '429-minute': {
    status: 429,
    google: googleError(429, 'RESOURCE_EXHAUSTED', 'You exceeded your current quota, please check your plan and billing details.', undefined, [
      { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests', quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier', quotaValue: '10' }] },
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '2s' },
    ]),
    openai: { error: { message: 'Rate limit reached for model in organization on requests per minute (RPM): Limit 30, Used 30. Please try again in 2s.', type: 'requests', code: 'rate_limit_exceeded' } },
  },
  '429-daily-limit-0': {
    status: 429,
    google: googleError(429, 'RESOURCE_EXHAUSTED', 'You exceeded your current quota, please check your plan and billing details. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-3.6-pro', undefined, [
      { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests', quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', quotaValue: '0' }] },
    ]),
    openai: { error: { message: 'Rate limit reached for model on tokens per day (TPD): Limit 100000, Used 100000.', type: 'tokens', code: 'rate_limit_exceeded' } },
  },
  '500': { status: 500, google: googleError(500, 'INTERNAL', 'An internal error has occurred. Please retry or report in https://developers.generativeai.google/guide/troubleshooting'), openai: { error: { message: 'Internal server error', type: 'server_error' } } },
  '503': { status: 503, google: googleError(503, 'UNAVAILABLE', 'The model is overloaded. Please try again later.'), openai: { error: { message: 'Service Unavailable', type: 'server_error' } } },
};

// Scenario-specific expectations on the final user-facing message.
const EXPECT_TEXT: Partial<Record<Scenario, RegExp>> = {
  '400-invalid-key': /key/i,
  '401-aq-token-type': /key/i,
  '403-referrer': /website|referr|restrict|address|allowed/i,
  '403-service-disabled': /enable|disabled|turn(ed)? on|project/i,
  '404-model': /model/i,
  '429-minute': /minute|wait|limit|quota|too many/i,
  '429-daily-limit-0': /day|daily|quota|allowance|limit|tomorrow/i,
  '500': /not available|try again|later|problem|error/i,
  '503': /busy|overloaded|not available|try again|later/i,
  network: /reach|connect|internet|network|running/i,
};

const enc = new TextEncoder();
function sse(chunks: string[], status = 200): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      c.close();
    },
  });
  return new Response(stream, { status, headers: { 'Content-Type': 'text/event-stream' } });
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const splitEvery = (s: string, n: number) => Array.from({ length: Math.ceil(s.length / n) }, (_, i) => s.slice(i * n, i * n + n));

type Api = 'interactions' | 'generateContent' | 'openai' | 'list' | 'other';
function apiOf(url: string, init?: RequestInit): Api {
  if (/\/interactions/.test(url)) return 'interactions';
  if (/:(stream)?[gG]enerateContent/.test(url)) return 'generateContent';
  if (/chat\/completions/.test(url)) return 'openai';
  if (/\/models(\?|$)/.test(url) && (!init?.method || init.method === 'GET')) return 'list';
  return 'other';
}

function wantsStream(url: string, init?: RequestInit): boolean {
  if (/alt=sse|streamGenerateContent/.test(url)) return true;
  try {
    return !!JSON.parse(String(init?.body ?? '{}')).stream;
  } catch {
    return false;
  }
}

/** The reply text for the mode: JSON for askAIJson, "OK" otherwise. */
const replyFor = (mode: Mode) => (mode === 'json' ? '{"ok": true, "items": ["a"]}' : 'OK');

function respond(sc: Scenario, mode: Mode, provider: ProviderId, url: string, init: RequestInit | undefined, calls: string[]): Response | Promise<Response> {
  const api = apiOf(url, init);
  const stream = wantsStream(url, init);
  calls.push(`${init?.method ?? 'GET'} ${api}${stream ? ' (stream)' : ''}`);
  const gemini = provider.startsWith('gemini');
  // Errors that concern the key hit every Gemini endpoint, including the model list.
  const keyWide = sc === '400-invalid-key' || sc === '401-aq-token-type' || sc === '403-referrer' || sc === '403-service-disabled';
  if (sc === 'network') return Promise.reject(new TypeError('Failed to fetch'));
  if (api === 'list' || api === 'other') {
    if (gemini && keyWide) {
      const e = ERRORS[sc]!;
      return json(e.google, e.status);
    }
    if (api === 'list')
      return json({ models: ['gemini-3.6-flash', 'gemini-3.6-flash-lite', 'gemini-3.6-pro', 'gemini-flash-latest'].map((m) => ({ name: `models/${m}`, supportedGenerationMethods: ['generateContent', 'countTokens'] })) });
    // Local servers: model lists (Ollama /api/tags, OpenAI /v1/models).
    return json({ models: [{ name: 'llama3.2:latest', model: 'llama3.2:latest' }], data: [{ id: 'llama3.2' }, { id: 'llama3.2:latest' }] });
  }
  const text = replyFor(mode);
  // Interactions not available for this key/model (older project): generateContent must still answer.
  if (sc === 'interactions-unsupported' && api === 'interactions') return json([googleError(404, 'NOT_FOUND', 'Method not found.')], 404);
  const err = ERRORS[sc];
  if (err) {
    const body = api === 'openai' ? err.openai : api === 'interactions' ? [err.google] : err.google;
    return json(body, err.status);
  }
  if (sc === 'malformed-json') {
    if (stream) return sse([api === 'openai' ? 'data: {"choices": [{"delta": {"content": "O\n\n' : 'data: {not json at all\n\n', 'data: [DONE]\n\n']);
    return new Response('{"candidates": [ {"content": ', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  // Successful shapes (ok / thought / empty / sse-split / midstream-error).
  const thought = sc === 'thought';
  const empty = sc === 'empty-max-tokens';
  if (api === 'interactions') {
    if (!stream) {
      if (empty) return json({ id: 'int_1', status: 'incomplete', steps: [{ type: 'model_output', content: [] }], usage: { total_output_tokens: 0, total_thought_tokens: 800 } });
      return json({ id: 'int_1', status: 'completed', steps: [...(thought ? [{ type: 'thought', signature: 'sig', summary: [{ type: 'text', text: 'THINKING-SECRET' }] }] : []), { type: 'model_output', content: [{ type: 'text', text }] }] });
    }
    const ev = (o: object) => `data: ${JSON.stringify(o)}\n\n`;
    let body = ev({ event_type: 'interaction.created', interaction: { id: 'int_1', status: 'in_progress' } });
    let idx = 0;
    if (thought) {
      body += ev({ event_type: 'step.start', index: idx, step: { type: 'thought' } });
      body += ev({ event_type: 'step.delta', index: idx, delta: { type: 'thought_summary', content: { type: 'text', text: 'THINKING-SECRET' } } });
      body += ev({ event_type: 'step.delta', index: idx, delta: { type: 'thought_signature', signature: 'sig' } });
      body += ev({ event_type: 'step.stop', index: idx });
      idx++;
    }
    body += ev({ event_type: 'step.start', index: idx, step: { type: 'model_output' } });
    if (!empty) {
      const half = Math.ceil(text.length / 2);
      body += ev({ event_type: 'step.delta', index: idx, delta: { type: 'text', text: text.slice(0, half) } });
      if (sc === 'midstream-error') return sse([body + ev({ event_type: 'error', error: { code: 'INTERNAL', message: 'Internal error encountered.' } })]);
      body += ev({ event_type: 'step.delta', index: idx, delta: { type: 'text', text: text.slice(half) } });
    }
    body += ev({ event_type: 'step.stop', index: idx });
    body += ev({ event_type: 'interaction.completed', interaction: { id: 'int_1', status: empty ? 'incomplete' : 'completed', usage: { total_output_tokens: empty ? 0 : 2 } } });
    body += 'data: [DONE]\n\n';
    return sse(sc === 'sse-split' ? splitEvery(body, 7) : [body]);
  }
  if (api === 'generateContent') {
    const parts = empty ? [] : [...(thought ? [{ text: 'THINKING-SECRET', thought: true }] : []), { text }];
    const cand = (p: object[], finish?: string) => ({ candidates: [{ content: { role: 'model', parts: p }, ...(finish ? { finishReason: finish } : {}) }] });
    if (!stream) return json(cand(parts, empty ? 'MAX_TOKENS' : 'STOP'));
    const ev = (o: object) => `data: ${JSON.stringify(o)}\r\n\r\n`;
    let body = '';
    if (thought) body += ev(cand([{ text: 'THINKING-SECRET', thought: true }]));
    if (!empty) {
      const half = Math.ceil(text.length / 2);
      body += ev(cand([{ text: text.slice(0, half) }]));
      if (sc === 'midstream-error') return sse([body + ev({ error: { code: 500, message: 'Internal error encountered.', status: 'INTERNAL' } })]);
      body += ev(cand([{ text: text.slice(half) }], 'STOP'));
    } else body += ev(cand([], 'MAX_TOKENS'));
    return sse(sc === 'sse-split' ? splitEvery(body, 5) : [body]);
  }
  // OpenAI-compatible
  const content = empty ? '' : thought ? `<think>THINKING-SECRET</think>${text}` : text;
  if (!stream) return json({ id: 'c1', object: 'chat.completion', choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: empty ? 'length' : 'stop' }] });
  const ev = (o: object) => `data: ${JSON.stringify(o)}\n\n`;
  let body = '';
  const pieces = content ? [content.slice(0, Math.ceil(content.length / 2)), content.slice(Math.ceil(content.length / 2))] : [];
  pieces.forEach((p, k) => {
    if (sc === 'midstream-error' && k === 1) return;
    body += ev({ choices: [{ index: 0, delta: { content: p } }] });
  });
  if (sc === 'midstream-error') return sse([body + ev({ error: { message: 'Internal server error', type: 'server_error', code: 500 } })]);
  body += ev({ choices: [{ index: 0, delta: {}, finish_reason: empty ? 'length' : 'stop' }] });
  body += 'data: [DONE]\n\n';
  return sse(sc === 'sse-split' ? splitEvery(body, 3) : [body]);
}

// ---------- matrix ----------

const knownCodes = (() => {
  const fallback = ai.aiErrorMessage('__no_such_code__');
  return (code: string) => code === 'unavailable' || ai.aiErrorMessage(code) !== fallback;
})();

const RAW_TEXT = /TypeError|Failed to fetch|SyntaxError|Unexpected token|JSON\.parse|in JSON at position|AbortError|DOMException|ReadableStream|\bstack\b|at Object\.|googleapis\.com\/google\.rpc|\bOAuth\b/;

async function runMode(mode: Mode, signal?: AbortSignal): Promise<unknown> {
  switch (mode) {
    case 'test':
      return ai.testAiConnection(signal);
    case 'text':
      return ai.askAI('Summarise: people describe water.', { signal });
    case 'json':
      return ai.askAIJson('Return {"ok": true, "items": ["a"]} as JSON.', { signal });
    case 'stream': {
      const seen: string[] = [];
      const r = await ai.askAI('Summarise: people describe water.', { signal, onText: (t) => seen.push(t) });
      return { result: r, seen };
    }
  }
}

function resetAi() {
  (http as any).__resetGeminiState?.();
  (http as any).__setHttpRetryDelay?.(0);
  (claude as any).__resetCapabilityCache?.();
  ai.__reloadAiSettings();
}

describe('AI provider x response x mode', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    resetAi();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const matrix: string[] = [];
  for (const provider of Object.keys(PROVIDERS) as ProviderId[]) {
    it(`${provider}`, async () => {
      for (const sc of SCENARIOS) {
        for (const mode of MODES) {
          resetAi();
          PROVIDERS[provider]();
          const calls: string[] = [];
          const ctrl = new AbortController();
          vi.stubGlobal('fetch', vi.fn((url: string | URL | Request, init?: RequestInit) => {
            const u = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
            if (sc === 'abort') {
              return new Promise<Response>((_res, rej) => {
                const sig = init?.signal;
                const fire = () => rej(new DOMException('The operation was aborted.', 'AbortError'));
                if (sig?.aborted) fire();
                else sig?.addEventListener('abort', fire);
                // A fetch without a signal would hang here: detected as a hang below.
              });
            }
            return Promise.resolve(respond(sc, mode, provider, u, init, calls));
          }));
          vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
          let settled = false;
          let value: unknown;
          let error: unknown;
          const p = runMode(mode, ctrl.signal).then(
            (v) => { settled = true; value = v; },
            (e) => { settled = true; error = e; },
          );
          if (sc === 'abort') setTimeout(() => ctrl.abort(), 10);
          // Drive time forward (retries with backoff, timeouts) for up to 10 simulated minutes.
          for (let k = 0; k < 600 && !settled; k++) await vi.advanceTimersByTimeAsync(1000);
          vi.useRealTimers();
          await Promise.race([p, new Promise((r) => setTimeout(r, 50))]);
          const tag = `${provider} / ${sc} / ${mode}`;
          const add = (check: string, detail: string) => col.add({ area: 'ai', subject: provider, check, detail: `${sc} / ${mode}: ${detail}`, seed: 0, repro: `// tests/fuzz/ai-matrix.fuzz.test.ts: provider ${provider}, scenario ${sc}, mode ${mode}\n// fetch calls: ${calls.join(' -> ') || '(none)'}` });
          if (!settled) {
            add('hang', 'did not finish within 10 simulated minutes');
            matrix.push(`${tag}: HANG`);
            continue;
          }
          if (error !== undefined) {
            const e = error as { code?: string; message?: string; constructor?: { name?: string } };
            const isAiError = error instanceof ai.AiError;
            const text = ai.aiErrorText(error);
            matrix.push(`${tag}: ${isAiError ? `AiError(${e.code})` : `${e.constructor?.name}: ${e.message}`} -> "${text.slice(0, 90)}"`);
            if (!isAiError) add('not-ai-error', `rejected with ${e.constructor?.name}: ${String(e.message).slice(0, 100)}`);
            else if (!e.code || !knownCodes(e.code)) add('unknown-code', `AiError code "${e.code}" has no message of its own`);
            const bad = [...badWords(text).filter((w) => w !== 'null'), ...(RAW_TEXT.test(text) ? [text.match(RAW_TEXT)![0]] : [])];
            if (bad.length) add('raw-text', `user sees ${bad.join(', ')}: "${text.slice(0, 160)}"`);
            if (['ok', 'thought', 'sse-split', 'interactions-unsupported'].includes(sc)) add('unexpected-error', `a valid reply failed with ${e.code}: "${text.slice(0, 120)}"`);
            if (sc === 'abort' && e.code !== 'cancelled') add('abort', `stopping gave code ${e.code} instead of cancelled: "${text.slice(0, 100)}"`);
            const gem = provider.startsWith('gemini');
            // Gemini-specific causes only apply to Gemini; for Ollama a 403 means this website is not in OLLAMA_ORIGINS.
            let want = sc === 'network' && provider === 'local' ? /computer|running|Ollama|LM Studio|reach/i : EXPECT_TEXT[sc];
            if (!gem && (sc === '403-referrer' || sc === '403-service-disabled')) want = provider === 'local' ? /allow|origin|OLLAMA_ORIGINS|website|CORS|computer/i : undefined;
            if (!gem && /Google|Gemini|Pacific|AI Studio/.test(text)) add('misleading', `message for a non-Google service talks about Google: "${text.slice(0, 160)}"`);
            if (want && !want.test(text)) add('misleading', `message does not match the cause (${want}): "${text.slice(0, 160)}"`);
            continue;
          }
          // Success.
          const res = mode === 'stream' ? (value as { result: string }).result : value;
          const seen = mode === 'stream' ? (value as { seen: string[] }).seen : [];
          matrix.push(`${tag}: ok ${JSON.stringify(res).slice(0, 60)} via ${calls.join(' -> ')}`);
          if (sc === 'abort') add('abort', 'resolved although the request was stopped');
          if (['400-invalid-key', '401-aq-token-type', '403-referrer', '403-service-disabled', '404-model', '429-minute', '429-daily-limit-0', '500', '503', 'network', 'malformed-json'].includes(sc))
            add('swallowed-error', `resolved with ${JSON.stringify(res).slice(0, 80)} instead of an error`);
          if (sc === 'midstream-error' && typeof res === 'string' && res.length < replyFor(mode).length) add('swallowed-error', `a stream that failed half-way resolved with the partial text ${JSON.stringify(res)}`);
          if (sc === 'midstream-error' && calls.some((c) => c.includes('(stream)')) && mode === 'json') add('swallowed-error', `a stream that failed half-way resolved: ${JSON.stringify(res).slice(0, 60)}`);
          if (typeof res === 'string' && !res.trim()) add('empty-result', 'resolved with an empty string (the user sees a blank answer, no explanation)');
          if (JSON.stringify(res).includes('THINKING-SECRET') || seen.some((s) => s.includes('THINKING-SECRET'))) add('thought-leak', 'thinking text reached the user');
          if (mode === 'json' && (typeof res !== 'object' || res === null || (res as { ok?: boolean }).ok !== true)) add('json', `askAIJson resolved with ${JSON.stringify(res).slice(0, 80)}`);
          if (mode === 'stream' && ['ok', 'sse-split', 'thought'].includes(sc) && seen.length && seen[seen.length - 1] !== res) add('stream', `last onText ${JSON.stringify(seen[seen.length - 1])} != result ${JSON.stringify(res)}`);
          if (mode === 'test' && ['ok', 'sse-split', 'thought'].includes(sc) && res !== 'OK') add('test', `test connection returned ${JSON.stringify(res)}`);
        }
      }
    }, 120_000);
  }

  afterAll(() => {
    out(`[fuzz:ai] ${matrix.length} combinations`);
    if (process.env.FUZZ_AI_MATRIX) out(matrix.join('\n'));
  });
});

describe('gate', () => {
  it('no new failures (known ones are listed in tests/fuzz/known-issues.ts)', () => {
    const g = col.gate();
    out(`[fuzz:ai]\n${g.summary}`);
    expect(g.unknown, g.summary).toEqual([]);
  });
});
