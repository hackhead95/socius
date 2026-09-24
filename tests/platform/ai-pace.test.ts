// Speed: rate limits read from Google's 429 replies and adaptive pacing, waiting out a short limit
// with a countdown, the model list cached for a day per key, the remembered API, the thinking level,
// and the timing records (no content, info entries in the error log).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetPace, knownLimit, learnLimit, noteRequest, paceWaitMs, parseRateLimit } from '../../src/platform/ai-pace';
import {
  __resetGeminiState, __setHttpRetryDelay, __setRateLimitSleep, askGemini, buildInteractionRequest, geminiRun, keyHash, listGeminiModels, parseServiceError, thinkingLevelFor,
} from '../../src/platform/ai-http';
import { __resetAiTimings, getAiActivity, recentAiTimings, startAiTiming, subscribeAiActivity } from '../../src/platform/ai-timing';
import { __resetErrorLogForTests, getLog } from '../../src/platform/errorlog';
import { RateLimiter } from '../../src/lib/assistant/rate-limit';
import { jsonResponse, memoryStorage } from './helpers';
import { interaction, modelList } from './gemini-fixtures';

const KEY = 'AQ.Ab8RN6LpaceTestKey_abcdefghijklmnopqrstuvwxyz0123456789';
const OWNER_MSG = 'Rate limit exceeded for model gemini-3.8-flash (limit: 5 requests per minute on Free Tier). Please retry in 11s';

function owner429(model = 'gemini-3.8-flash', retry = 11, limit = 5) {
  return jsonResponse(
    [
      {
        error: {
          code: 429,
          status: 'RESOURCE_EXHAUSTED',
          message: `Rate limit exceeded for model ${model} (limit: ${limit} requests per minute on Free Tier). Please retry in ${retry}s`,
          details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: `${retry}s` }],
        },
      },
    ],
    429,
  );
}

let store: ReturnType<typeof memoryStorage>;
beforeEach(() => {
  store = memoryStorage();
  vi.stubGlobal('localStorage', store);
  __resetGeminiState();
  __resetPace();
  __resetAiTimings();
  __setHttpRetryDelay(0);
  __resetErrorLogForTests();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  __setRateLimitSleep(null);
});

describe('reading limits from 429 replies', () => {
  it("the owner's message: 5 requests per minute, retry in 11 s", () => {
    expect(parseRateLimit(OWNER_MSG)).toEqual({ perMinute: 5 });
    const s = parseServiceError(429, JSON.stringify([{ error: { code: 429, message: OWNER_MSG, status: 'RESOURCE_EXHAUSTED' } }]));
    expect(s.retryAfterMs).toBe(11_000);
    expect(s.limitPerMinute).toBe(5);
    expect(s.perMinute).toBe(true);
  });

  it('QuotaFailure violations: per-minute request quota, not token quotas or per-day ones', () => {
    expect(parseRateLimit('x', [{ quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier', quotaValue: '15' }])).toEqual({ perMinute: 15 });
    expect(parseRateLimit('x', [{ quotaId: 'GenerateContentInputTokensPerModelPerMinute-FreeTier', quotaValue: '250000' }])).toEqual({});
    expect(parseRateLimit('x', [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', quotaValue: '20' }])).toEqual({ perDay: 20 });
    expect(parseRateLimit('Quota exceeded for metric: generate_content_free_tier_requests, limit: 10, model: m (GenerateRequestsPerMinutePerProjectPerModel)')).toEqual({ perMinute: 10 });
    expect(parseRateLimit('limit: 0')).toEqual({});
  });
});

describe('adaptive pacing', () => {
  it('nothing is paced until a limit is learned; then requests are spaced to it', () => {
    vi.useFakeTimers({ now: 1_000_000 });
    for (let i = 0; i < 7; i++) noteRequest('k', 'm');
    expect(paceWaitMs('k', 'm')).toBe(0);
    learnLimit('k', 'm', { perMinute: 5 });
    expect(knownLimit('k', 'm')).toBe(5);
    const w = paceWaitMs('k', 'm');
    expect(w).toBeGreaterThan(59_000);
    vi.advanceTimersByTime(61_000);
    expect(paceWaitMs('k', 'm')).toBe(0);
    // Another model is not affected.
    expect(paceWaitMs('k', 'other')).toBe(0);
  });

  it('"retry in N s" blocks the model for N s; learned limits survive a reload for a day', () => {
    vi.useFakeTimers({ now: 5_000_000 });
    learnLimit('k', 'm', { perMinute: 5, retryAfterMs: 11_000 });
    expect(paceWaitMs('k', 'm')).toBe(11_000);
    __resetPace();
    // (reset forgets the in-memory copy; a new page load reads localStorage)
    expect(JSON.parse(store.data.get('socius.ai.limits')!)['k|m'].perMinute).toBe(5);
  });

  it('RateLimiter: a lowered limit waits for the right request to leave the window', () => {
    let now = 0;
    const lim = new RateLimiter(100, () => now);
    for (let i = 0; i < 8; i++) {
      lim.record();
      now += 1000;
    }
    lim.perMinute = 5;
    // Requests at 0..7 s; with 5 a minute the 4th newest (3 s) must leave: at 63 s.
    expect(lim.waitMs()).toBe(60_000 - (now - 3000) + 50);
  });
});

describe('Gemini requests with limits', () => {
  it('a 429 asking to retry in 11 s is waited out with a countdown, then answered', async () => {
    const waits: number[] = [];
    __setRateLimitSleep(async (ms) => void waits.push(ms));
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (url.includes('/models') ? modelList(['gemini-3.8-flash']) : n++ === 0 ? owner429() : interaction('OK'))),
    );
    const timing = startAiTiming('test', 'gemini');
    const labels: string[] = [];
    const unsub = subscribeAiActivity(() => labels.push(getAiActivity()?.label ?? ''));
    const text = await askGemini({ apiKey: KEY, model: 'gemini-3.8-flash' }, 'p', { timing });
    unsub();
    timing.finish(true);
    expect(text).toBe('OK');
    expect(waits).toHaveLength(1);
    expect(waits[0]).toBeGreaterThanOrEqual(11_000);
    expect(labels).toContain("Waiting 12 s for Google's free limit...");
    expect(knownLimit(keyHash(KEY), 'gemini-3.8-flash')).toBe(5);
    expect(recentAiTimings().at(-1)!.lines().join('\n')).toMatch(/wait \(\d+ ms, gemini-3.8-flash answered 429\)/);
  });

  it('automatic choice: a long per-minute wait on one model moves on to another with room', async () => {
    __setRateLimitSleep(async () => undefined);
    const posts: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.includes('/models')) return modelList(['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
        const model = JSON.parse(String(init.body)).model;
        posts.push(model);
        return model === 'gemini-3.5-flash-lite' ? owner429(model, 45, 15) : interaction('OK');
      }),
    );
    expect(await askGemini({ apiKey: KEY, model: '' }, 'p')).toBe('OK');
    expect(posts).toEqual(['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
    // Next time, the paced model is skipped at once (no 429 first).
    posts.length = 0;
    expect(await askGemini({ apiKey: KEY, model: '' }, 'p')).toBe('OK');
    expect(posts[0]).toBe('gemini-3.1-flash-lite');
  });
});

describe('model list cache and remembered API', () => {
  it('the model list is kept for a day per key hash (no key stored), so a new page load does not list again', async () => {
    const f = vi.fn(async (url: string) => (url.includes('/models') ? modelList(['gemini-3.5-flash-lite']) : interaction('OK')));
    vi.stubGlobal('fetch', f);
    await listGeminiModels(KEY);
    expect(f).toHaveBeenCalledTimes(1);
    const raw = store.data.get('socius.ai.geminiModels')!;
    expect(raw).not.toContain(KEY);
    expect(JSON.parse(raw)[keyHash(KEY)].models[0].name).toBe('models/gemini-3.5-flash-lite');
    __resetGeminiState({ reload: true });
    await listGeminiModels(KEY);
    expect(f).toHaveBeenCalledTimes(1);
    // Test connection asks again.
    await listGeminiModels(KEY, { force: true });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('an old list (over a day) is listed again', async () => {
    store.setItem('socius.ai.geminiModels', JSON.stringify({ [keyHash(KEY)]: { at: Date.now() - 25 * 3600_000, models: [{ name: 'models/gemini-old' }] } }));
    __resetGeminiState({ reload: true });
    const f = vi.fn(async () => modelList(['gemini-3.5-flash-lite']));
    vi.stubGlobal('fetch', f);
    const list = await listGeminiModels(KEY);
    expect(f).toHaveBeenCalledTimes(1);
    expect(list[0].name).toBe('models/gemini-3.5-flash-lite');
  });
});

describe('thinking level', () => {
  it('minimal on Flash-Lite, low on Flash, none on 2.x; explicit minimal for checks', () => {
    expect(thinkingLevelFor('gemini-3.5-flash-lite')).toBe('minimal');
    expect(thinkingLevelFor('gemini-3.8-flash')).toBe('low');
    expect(thinkingLevelFor('gemini-3.8-flash', 'minimal')).toBe('minimal');
    expect(thinkingLevelFor('gemini-2.5-flash')).toBeUndefined();
    const b = JSON.parse(buildInteractionRequest({ apiKey: KEY, model: 'gemini-3.5-flash-lite' }, 'p', { stream: true, effort: 'auto', maxTokens: 100 }).init.body);
    expect(b.generation_config).toEqual({ thinking_level: 'minimal', max_output_tokens: 356 });
  });

  it("a model that refuses 'minimal' is asked with 'low' (remembered), not with no level at all", async () => {
    const levels: Array<string | undefined> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        levels.push(body.generation_config?.thinking_level);
        if (body.generation_config?.thinking_level === 'minimal') return jsonResponse({ error: { code: 400, message: 'thinking_level minimal is not supported for this model', status: 'INVALID_ARGUMENT' } }, 400);
        return interaction('OK');
      }),
    );
    await geminiRun(
      { apiKey: KEY, model: 'gemini-3.9-flash-lite' },
      { stream: false, interactions: (m, o) => buildInteractionRequest({ apiKey: KEY, model: m }, 'p', { stream: false, thinking: o.thinking, effort: o.effort }), generateContent: () => { throw new Error('no'); } },
    );
    expect(levels).toEqual(['minimal', 'low']);
    levels.length = 0;
    await geminiRun(
      { apiKey: KEY, model: 'gemini-3.9-flash-lite' },
      { stream: false, interactions: (m, o) => buildInteractionRequest({ apiKey: KEY, model: m }, 'p', { stream: false, thinking: o.thinking, effort: o.effort }), generateContent: () => { throw new Error('no'); } },
    );
    expect(levels).toEqual(['low']);
  });
});

describe('timing records', () => {
  it('each finished action is one info entry in the error log, with stages and times but no content', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.includes('/models') ? modelList(['gemini-3.5-flash-lite']) : interaction('A secret answer about Maria'))));
    const timing = startAiTiming('explain', 'gemini');
    await askGemini({ apiKey: KEY, model: '' }, 'Explain the result for Maria', { timing });
    timing.finish(true);
    const e = getLog().find((x) => x.level === 'info' && x.area === 'ai')!;
    expect(e.message).toMatch(/^explain: done [\d.]+ s; 1 request, 1 model list \(gemini-3.5-flash-lite\)$/);
    expect(JSON.stringify(e)).not.toMatch(/Maria|secret/);
    const lines = recentAiTimings().at(-1)!.lines().join('\n');
    expect(lines).toMatch(/list/);
    expect(lines).toMatch(/request \(gemini-3.5-flash-lite, interactions\)/);
    expect(lines).toMatch(/headers \(gemini-3.5-flash-lite, interactions, HTTP 200, \d+ ms\)/);
    expect(lines).not.toMatch(/Maria|secret|AQ\./);
  });
});
