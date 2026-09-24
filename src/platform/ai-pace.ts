// Adaptive pacing for free tiers. Google's free Gemini tier limits requests per minute per model (for
// example Flash 5, Flash-Lite 15; Google no longer publishes fixed numbers and they change). Instead of
// guessing, Socius learns each model's real limit from the 429 replies ("limit: 5 requests per minute",
// QuotaFailure quotaValue) and the wait Google asks for ("Please retry in 11s", RetryInfo), then spaces
// later requests to that model so they do not hit the limit. Learned limits are kept per key (as a
// hash, never the key) for a day in localStorage.
//
// Nothing is paced before a limit is known, so paid keys and new models run at full speed.

import { RateLimiter } from '../lib/assistant/rate-limit';

export interface LimitInfo {
  /** Requests per minute allowed for this model (from the 429 body). */
  perMinute?: number;
  /** Requests per day, when that was the limit. */
  perDay?: number;
  retryAfterMs?: number;
}

/**
 * Read a rate limit out of a 429 message and its QuotaFailure violations: "limit: 5 requests per minute",
 * "...free_tier_requests, limit: 15, model: ..." with a PerMinute quota id, or a violation's quotaValue.
 * Token limits (input_token_count) are ignored.
 */
export function parseRateLimit(message: string, violations: Array<{ quotaId?: string; quotaMetric?: string; quotaValue?: unknown }> = [], retryAfterMs?: number): LimitInfo {
  const out: LimitInfo = {};
  for (const v of violations) {
    const id = `${v.quotaId ?? ''} ${v.quotaMetric ?? ''}`;
    if (!/request/i.test(id) || /token/i.test(id)) continue;
    const n = Number(v.quotaValue);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (/per ?minute|PerMinute/i.test(id)) out.perMinute = n;
    else if (/per ?day|PerDay/i.test(id)) out.perDay = n;
  }
  const m = String(message ?? '');
  let r = /limit:\s*(\d+)\s*requests?\s*(?:per|\/|a)\s*min/i.exec(m);
  if (r && !out.perMinute) out.perMinute = Number(r[1]);
  r = /limit:\s*(\d+)\s*requests?\s*(?:per|\/|a)\s*day/i.exec(m);
  if (r && !out.perDay) out.perDay = Number(r[1]);
  if (!out.perMinute) {
    // "Quota exceeded for metric: ..._requests, limit: 15, model: x" (the quota id says per minute or per day).
    r = /requests?[^,\n]*,\s*limit:\s*(\d+)/i.exec(m);
    if (r && Number(r[1]) > 0 && /per ?minute|PerMinute|\bRPM\b/i.test(m) && !/per ?day|PerDay/i.test(m)) out.perMinute = Number(r[1]);
  }
  if (out.perMinute !== undefined && !(out.perMinute > 0 && out.perMinute < 100_000)) delete out.perMinute;
  if (retryAfterMs !== undefined && retryAfterMs >= 0) out.retryAfterMs = retryAfterMs;
  return out;
}

// ---------- the pacer ----------

const STORE_KEY = 'socius.ai.limits';
const KEEP_MS = 24 * 3600_000;

interface Learned {
  perMinute: number;
  at: number;
}

const limiters = new Map<string, RateLimiter>();
const blocked = new Map<string, number>();
let learned: Record<string, Learned> | null = null;

function readLearned(): Record<string, Learned> {
  if (learned) return learned;
  learned = {};
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null;
    const o = raw ? JSON.parse(raw) : null;
    const now = Date.now();
    if (o && typeof o === 'object')
      for (const [k, v] of Object.entries(o as Record<string, any>)) if (typeof v?.perMinute === 'number' && typeof v?.at === 'number' && now - v.at < KEEP_MS) learned[k] = { perMinute: v.perMinute, at: v.at };
  } catch {
    /* storage unavailable */
  }
  return learned;
}

function saveLearned(): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(readLearned()));
  } catch {
    /* kept for this visit */
  }
}

const slot = (scope: string, model: string) => `${scope}|${model}`;

function limiter(scope: string, model: string): RateLimiter | null {
  const k = slot(scope, model);
  const l = readLearned()[k];
  if (!l) return limiters.get(k) ?? null;
  let lim = limiters.get(k);
  if (!lim) limiters.set(k, (lim = new RateLimiter(l.perMinute)));
  else lim.perMinute = l.perMinute;
  return lim;
}

/** Note a request sent to a model (counted even before a limit is known, so the window is right once it is). */
export function noteRequest(scope: string, model: string): void {
  const k = slot(scope, model);
  let lim = limiters.get(k);
  if (!lim) limiters.set(k, (lim = new RateLimiter(readLearned()[k]?.perMinute ?? 1_000_000)));
  lim.record();
}

/** Learn from a 429: the model's per-minute limit and how long to wait before the next request. */
export function learnLimit(scope: string, model: string, info: LimitInfo): void {
  const k = slot(scope, model);
  if (info.perMinute) {
    readLearned()[k] = { perMinute: info.perMinute, at: Date.now() };
    saveLearned();
    const lim = limiters.get(k);
    if (lim) lim.perMinute = info.perMinute;
  }
  if (info.retryAfterMs && info.retryAfterMs > 0) blocked.set(k, Date.now() + info.retryAfterMs);
}

/** The requested wait is over (Socius waited it out). */
export function clearBlock(scope: string, model: string): void {
  blocked.delete(slot(scope, model));
}

/** The learned per-minute limit of a model, if any. */
export function knownLimit(scope: string, model: string): number | undefined {
  return readLearned()[slot(scope, model)]?.perMinute;
}

/** Milliseconds to wait before the next request to this model (0 = send now). */
export function paceWaitMs(scope: string, model: string): number {
  const k = slot(scope, model);
  const until = blocked.get(k);
  const b = until ? Math.max(0, until - Date.now()) : 0;
  if (until && !b) blocked.delete(k);
  const lim = limiter(scope, model);
  return Math.max(b, lim ? lim.waitMs() : 0);
}

/** Test hook: forget learned limits and windows. */
export function __resetPace(): void {
  limiters.clear();
  blocked.clear();
  learned = {};
}
