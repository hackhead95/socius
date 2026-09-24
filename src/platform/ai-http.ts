// AI over HTTP: Google Gemini and any OpenAI-compatible chat completions service (Groq, OpenRouter, a
// local Ollama or LM Studio, ...). Browser fetch only; the user's own key goes straight from this page
// to the service, never anywhere else.
//
// Gemini, as of 2026:
// - Google's primary API is the Interactions API (POST /v1beta/interactions), tried first; the older
//   generateContent endpoint is a fallback when Interactions fails for a reason other than the key (for
//   example 404 on the endpoint). Keys, "AQ." (AI Studio auth keys, all new keys since May 2026) or
//   "AIza" (older, being retired by Google in September 2026), go only in the x-goog-api-key header.
//   401 ACCESS_TOKEN_TYPE_UNSUPPORTED means Google could not validate an "AQ." key (truncated, deleted,
//   or an account-side problem), on every endpoint: it is reported as a key problem, not retried.
//   Shapes are taken from @google/genai 2.24 (dist/genai.d.ts: CreateModelInteraction, Interaction,
//   Step, InteractionSSEEvent) and checked against the live endpoint's replies
//   (docs/research/gemini-auth-keys-and-interactions-api.md). No Api-Revision header (CORS refuses it).
// - Model names are never hard-coded: the key's model list is read (GET /v1beta/models) and ranked.
//   "Automatic" prefers the newest Flash-Lite (far more free requests per day than Flash); users may
//   prefer Flash for single requests. When a model is retired for new keys (404), not allowed (403) or
//   has no free allowance (429 with "limit: 0" or a used-up daily allowance), the next candidates are
//   tried (at most 3 models), and the one that works is remembered per key.
// - Thinking models: a low thinking level is requested where supported (retried without it when a model
//   refuses), output limits get room for thinking, and empty replies (MAX_TOKENS, safety, recitation)
//   become clear errors.
// - Requests time out (45 s for checks, 90 s otherwise), a busy service (500/503) is retried once, and
//   every request is recorded (without keys) for the connection check's "Copy details" report.

import { AiUnavailableError } from './claude';

export interface HttpAskOptions {
  onText?: (text: string) => void;
  /** Called when a different model than the one typed in settings answered. `reason` is why the typed one failed (e.g. 'bad_model' when retired). */
  onModelFallback?: (model: string, reason?: string) => void;
  /** Called with the model that answered. */
  onModel?: (model: string) => void;
  signal?: AbortSignal;
  json?: boolean;
  maxTokens?: number;
  /** Stop waiting for the service's first byte after this long (default 90 s; 0 = no limit). */
  timeoutMs?: number;
  /** Requests made, appended here (for the connection check and "Copy details"). */
  trace?: AiAttempt[];
  /** Gemini automatic model choice: Flash-Lite (default, more free requests) or Flash. */
  prefer?: GeminiPreference;
}

/** What "automatic" favours: Flash-Lite (more free requests per day) or Flash (better answers). */
export type GeminiPreference = 'lite' | 'flash';

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export interface OpenAiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const GEMINI_INTERACTIONS_URL = `${GEMINI_BASE}/interactions`;
export type GeminiApi = 'interactions' | 'generateContent';

/** Default wait for a service to start answering. */
export const DEFAULT_TIMEOUT_MS = 90_000;
/** Wait used by the connection check and the model list. */
export const CHECK_TIMEOUT_MS = 45_000;
/** Models tried at most for one request (the chosen one plus fallbacks). */
export const MAX_MODEL_TRIES = 3;

// ---------- diagnostics records ----------

/** One HTTP request, as recorded for "Copy details". Never contains a key. */
export interface AiAttempt {
  /** ISO time the request started. */
  at: string;
  method: string;
  /** Address without its query string. */
  url: string;
  model?: string;
  api?: GeminiApi;
  /** 0 when no answer arrived. */
  httpStatus: number;
  ms: number;
  ok: boolean;
  /** Google's error `status` (e.g. RESOURCE_EXHAUSTED) or an OpenAI-style error `type`. */
  apiStatus?: string;
  /** Google's ErrorInfo `reason` (e.g. API_KEY_INVALID) or an OpenAI-style error `code`. */
  reason?: string;
  message?: string;
  note?: string;
}

/** Extra facts on an AI error thrown here (all optional). */
export interface AiErrorInfo {
  httpStatus?: number;
  apiStatus?: string;
  reason?: string;
  host?: string;
  model?: string;
  api?: GeminiApi;
  /** Models tried, in order. */
  tried?: string[];
  /** Rate limits: how long the service asked us to wait, and which allowance ran out. */
  retryAfterMs?: number;
  daily?: boolean;
  perMinute?: boolean;
  /** The service's free allowance for this model is 0 (not a temporary limit). */
  zeroQuota?: boolean;
  /** Gemini key format ('aq', 'aiza', 'other'), for advice about Google's key changes. */
  keyKind?: GeminiKeyKind;
  trace?: AiAttempt[];
}

export type AiHttpError = AiUnavailableError & AiErrorInfo;

export function aiHttpError(code: string, message: string, detail?: string, info: AiErrorInfo = {}): AiHttpError {
  const e = new AiUnavailableError(code, message, detail) as AiHttpError;
  decorate(e, info);
  return e;
}

/** Add facts to an error without overwriting ones it already has. */
function decorate<T>(e: T, info: AiErrorInfo): T {
  if (e && typeof e === 'object') {
    for (const [k, v] of Object.entries(info)) if (v !== undefined && (e as any)[k] === undefined) (e as any)[k] = v;
  }
  return e;
}

const cancelled = () => new AiUnavailableError('cancelled', 'Stopped.');

// ---------- keys ----------

/**
 * Clean a pasted key: drop spaces, line breaks and invisible characters, surrounding quotes, and prefixes
 * such as `GEMINI_API_KEY=` or `Bearer `. Keys are plain ASCII, so anything else is removed (it would
 * otherwise make the browser refuse to send the request at all).
 */
export function sanitizeApiKey(raw: string): string {
  let k = String(raw ?? '').replace(/[​-‍⁠﻿]/g, '').trim();
  k = k.replace(/^(?:export\s+)?[A-Z][A-Z0-9_]*\s*[=:]\s*/, '');
  k = k.replace(/^bearer\s+/i, '');
  k = k.replace(/\s+/g, '');
  k = k.replace(/^["'`‘’“”«»]+/, '').replace(/["'`‘’“”«»,;]+$/, '');
  return k.replace(/[^\x21-\x7E]/g, '');
}

export type GeminiKeyKind = 'aiza' | 'aq' | 'other';

/** "AIza..." (classic Google API key), "AQ." (AI Studio auth key, 2026) or something else. */
export function geminiKeyKind(key: string): GeminiKeyKind {
  const k = sanitizeApiKey(key);
  if (/^AIza/.test(k)) return 'aiza';
  if (/^AQ\./.test(k)) return 'aq';
  return 'other';
}

/** A gentle warning when a pasted Gemini key does not look like one (testing is still allowed). */
export function geminiKeyWarning(raw: string): string | null {
  const k = sanitizeApiKey(raw);
  if (!k) return null;
  const kind = geminiKeyKind(k);
  // Auth keys vary in length but are long (about 50 characters or more): a short one was probably cut off.
  if (kind === 'aq') return k.length < 40 ? `This key has only ${k.length} characters, which is short for a Google key. Check that you copied all of it (use the copy button in AI Studio).` : null;
  if (kind === 'aiza')
    return k.length === 39
      ? 'Keys that start with "AIza" are older Google keys, which Google is retiring during September 2026. If it stops working, create a new key in Google AI Studio.'
      : `This key has ${k.length} characters; Google keys that start with "AIza" have 39. Check that you copied all of it.`;
  return 'This does not look like a Google AI Studio key (those start with "AQ." or "AIza"). Check that you copied the key itself, not its name. You can still test it.';
}

/** A short, safe description of a key for reports: never the key itself. */
export function describeKey(raw: string): string {
  const k = sanitizeApiKey(raw);
  if (!k) return 'none';
  const kind = geminiKeyKind(k);
  const fmt = kind === 'aq' ? 'starts with "AQ."' : kind === 'aiza' ? 'starts with "AIza"' : 'other format';
  const changed = k !== String(raw ?? '').trim() ? ', cleaned when pasted' : '';
  return `set (${k.length} characters, ${fmt}${changed})`;
}

// ---------- service errors ----------

/** "21s", "1.5s", "300ms", "30" -> milliseconds. */
export function parseDelay(s: string): number | undefined {
  const m = /^\s*([\d.]+)\s*(ms|s)?\s*$/i.exec(s);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(m[2]?.toLowerCase() === 'ms' ? n : n * 1000);
}

/** What a service said when it refused a request: Google's error JSON, an OpenAI-style one, or text. */
export interface ServiceError {
  httpStatus: number;
  message: string;
  /** Google `error.status` (RESOURCE_EXHAUSTED...) or OpenAI-style `error.type`. */
  apiStatus?: string;
  /** Google ErrorInfo reasons (API_KEY_INVALID...) and OpenAI-style `error.code` strings. */
  reasons: string[];
  retryAfterMs?: number;
  daily: boolean;
  perMinute: boolean;
  /** "limit: 0" or a quota value of 0: this model has no free allowance at all. */
  zeroQuota: boolean;
  quotaIds: string[];
}

export function parseServiceError(httpStatus: number, body: unknown, retryAfterHeader?: string | null): ServiceError {
  let j: any = body;
  const text = typeof body === 'string' ? body : '';
  if (typeof body === 'string') {
    try {
      j = JSON.parse(body);
    } catch {
      j = null;
    }
  }
  const e = Array.isArray(j) ? j[0]?.error : j?.error;
  let message = '';
  if (typeof e === 'string') message = e;
  else if (e && typeof e.message === 'string') message = e.message;
  else if (typeof j?.message === 'string') message = j.message;
  else message = text.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  // OpenRouter wraps the upstream provider's own error.
  const raw = e?.metadata?.raw;
  if (typeof raw === 'string' && raw.length < 400 && !message.includes(raw)) message = `${message} (${raw})`;
  const apiStatus = typeof e?.status === 'string' ? e.status : typeof e?.type === 'string' ? e.type : undefined;
  const reasons: string[] = [];
  const quotaIds: string[] = [];
  let retryAfterMs: number | undefined;
  let zero = false;
  for (const d of Array.isArray(e?.details) ? e.details : []) {
    if (typeof d?.reason === 'string') reasons.push(d.reason);
    if (typeof d?.retryDelay === 'string') retryAfterMs = parseDelay(d.retryDelay) ?? retryAfterMs;
    for (const v of Array.isArray(d?.violations) ? d.violations : []) {
      const id = `${v?.quotaId ?? ''}`.trim() || `${v?.quotaMetric ?? ''}`.trim();
      if (id) quotaIds.push(id);
      if (v?.quotaValue !== undefined && String(v.quotaValue) === '0') zero = true;
    }
  }
  if (typeof e?.code === 'string' && !/^\d+$/.test(e.code)) reasons.push(e.code);
  if (typeof e?.failed_generation === 'string') reasons.push('tool_use_failed');
  if (retryAfterMs === undefined && retryAfterHeader) retryAfterMs = parseDelay(retryAfterHeader);
  if (retryAfterMs === undefined) {
    const m = /(?:try again|retry) in ([\d.]+\s*(?:ms|s))/i.exec(message);
    if (m) retryAfterMs = parseDelay(m[1].replace(/\s+/g, ''));
  }
  if (/\blimit:\s*0(?![\d.])/i.test(message)) zero = true;
  const all = `${quotaIds.join(' ')} ${message}`;
  return {
    httpStatus,
    message: message.slice(0, 600),
    apiStatus,
    reasons,
    retryAfterMs,
    daily: /per ?day|daily|\bRPD\b|\bTPD\b/i.test(all),
    perMinute: /per ?minute|\bRPM\b|\bTPM\b/i.test(all),
    zeroQuota: zero,
    quotaIds,
  };
}

/** Where an error happened: listing models / checking a key, a Gemini generation, or a chat completion. */
export type ErrorPlace = 'list' | 'generate' | 'chat';

/** A stable AI error code for a refused request (see aiErrorMessage in ./ai). */
export function classifyServiceError(s: ServiceError, where: ErrorPlace = 'list'): string {
  const m = s.message.toLowerCase();
  const has = (r: string) => s.reasons.some((x) => x.toUpperCase() === r);
  const st = s.httpStatus;
  if (has('API_KEY_HTTP_REFERRER_BLOCKED') || /requests from referr?er .* are blocked|referr?er .*(blocked|not allowed)/.test(m)) return 'referrer_blocked';
  if (['API_KEY_SERVICE_BLOCKED', 'API_KEY_IP_ADDRESS_BLOCKED', 'API_KEY_ANDROID_APP_BLOCKED', 'API_KEY_IOS_APP_BLOCKED'].some(has) || /requests to this api .* are blocked|ip address .* (is )?blocked/.test(m))
    return 'key_restricted';
  if (has('SERVICE_DISABLED') || /has not been used in project|api has not been used|is disabled\. enable it|enable it by visiting/.test(m)) return 'api_disabled';
  if (has('UNSUPPORTED_COUNTRY_REGION_TERRITORY') || /user location is not supported|location is not supported for the api|not available in your (country|region)|country, region,? or territory (is )?not supported|unsupported_country_region_territory/.test(m))
    return 'region';
  // Google's reply to an "AQ." key it cannot validate, on every endpoint (not a sign that the endpoint is wrong).
  if (has('ACCESS_TOKEN_TYPE_UNSUPPORTED') || /expected oauth 2 access token/.test(m)) return 'key_not_accepted';
  if (['API_KEY_INVALID', 'API_KEY_EXPIRED', 'INVALID_API_KEY'].some(has) || /api key (not valid|expired|invalid)|invalid api[ _-]?key|incorrect api key|api_key_invalid|no auth credentials|user not found|missing authentication|invalid authentication/.test(m))
    return 'invalid_key';
  if (st === 401) return 'invalid_key';
  if (has('CONSUMER_SUSPENDED') || /has been suspended|consumer .* suspended|account (is |has been )?(suspended|disabled)/.test(m)) return 'key_suspended';
  if (st === 402 || (st !== 429 && /insufficient (credits|balance)|payment required|requires more credits|add credits/.test(m))) return 'payment_required';
  if (st === 429 || s.apiStatus === 'RESOURCE_EXHAUSTED' || has('rate_limit_exceeded')) return 'rate_limited';
  if (st === 413 || /context length|context window|too long|too large|maximum context|token limit|exceeds the maximum number of tokens|input token count/.test(m)) return 'too_large';
  if (st === 400 && /think/.test(m)) return 'thinking_unsupported';
  if (st === 400 && /unknown name|cannot find field|unknown field|unrecognized field/.test(m)) return 'field_unsupported';
  if (st === 404 || has('model_not_found') || has('model_decommissioned') || /model.{0,80}(not found|does not exist|decommissioned|no longer (available|supported))|not a valid model|no endpoints found|unknown model/.test(m))
    return 'bad_model';
  if (st === 403) return where === 'generate' ? 'permission' : 'invalid_key';
  if (st === 400) return 'bad_request';
  if (st === 503 || /overloaded|high demand/.test(m)) return 'overloaded';
  if (st === 504 || s.apiStatus === 'DEADLINE_EXCEEDED') return 'timeout';
  return 'unavailable';
}

/** Map an HTTP error status (and the service's message) to a stable AI error code. */
export function httpErrorCode(status: number, message: string): string {
  return classifyServiceError(parseServiceError(status, JSON.stringify({ error: { message } })), 'list');
}

/** An AiError for a refused request, carrying the service's own words and status. */
export function errorFromService(s: ServiceError, where: ErrorPlace, info: AiErrorInfo = {}): AiHttpError {
  const code = classifyServiceError(s, where);
  const reasons = s.reasons.filter((r) => !s.message.includes(r));
  const detail = [s.message, reasons.length ? `(${reasons.join(' ')})` : ''].filter(Boolean).join(' ').slice(0, 400) || undefined;
  return aiHttpError(code, `The AI service answered ${s.httpStatus}.`, detail, {
    ...info,
    httpStatus: s.httpStatus || undefined,
    apiStatus: s.apiStatus,
    reason: s.reasons[0],
    retryAfterMs: s.retryAfterMs,
    daily: code === 'rate_limited' ? s.daily : undefined,
    perMinute: code === 'rate_limited' ? s.perMinute : undefined,
    zeroQuota: s.zeroQuota || undefined,
  });
}

/** An error reported inside a response body or a stream event (`{error: {...}}`). */
export function errorFromPayload(payload: any, where: ErrorPlace, info: AiErrorInfo = {}): AiHttpError {
  const e = payload?.error ?? payload;
  const n = Number(e?.code);
  const status = Number.isFinite(n) && n >= 100 ? n : /exhaust|quota|rate/i.test(String(e?.code ?? '')) ? 429 : 500;
  return errorFromService(parseServiceError(status, { error: e }), where, info);
}

export async function errorFromResponse(res: Response, where: ErrorPlace = 'list', info: AiErrorInfo = {}): Promise<AiHttpError> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    /* no body */
  }
  return errorFromService(parseServiceError(res.status, text, res.headers?.get?.('retry-after')), where, info);
}

// ---------- transport ----------

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

/** A program on this computer (loopback): localhost, *.localhost, 127.x.x.x, [::1], 0.0.0.0. */
function isLocalHost(host: string): boolean {
  return /^(localhost|[a-z0-9.-]+\.localhost|127(?:\.\d{1,3}){3}|\[::1\]|0\.0\.0\.0)(:\d+)?$/i.test(host);
}

/**
 * Extra fetch options for an address on this computer: Chrome's Local Network Access (142+) asks the
 * user's permission for requests marked `targetAddressSpace: 'loopback'`; other browsers ignore the field.
 * (ai-local.ts marks its probes the same way.)
 */
export function loopbackFetchInit(url: string): RequestInit {
  return (isLocalHost(hostOf(url)) ? { targetAddressSpace: 'loopback' } : {}) as RequestInit;
}

/** Address without its query string, for reports. */
function displayUrl(url: string): string {
  const q = url.search(/[?#]/);
  return q >= 0 ? `${url.slice(0, q)}?…` : url;
}

function browserOnline(): boolean | null {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : null;
  } catch {
    return null;
  }
}

/** A fetch that failed before any answer: offline, blocked, or a key the browser refused to send. */
function networkError(e: any, url: string, info: AiErrorInfo): AiHttpError {
  const msg = String(e?.message ?? e ?? '');
  const host = hostOf(url);
  if (/ISO-8859-1|non-ByteString|ByteString|invalid header value|header value contains|invalid characters? in header/i.test(msg))
    return aiHttpError('bad_key_format', 'The key contains characters that cannot be sent.', msg, { ...info, host });
  if (browserOnline() === false && !isLocalHost(host)) return aiHttpError('offline', 'This computer is offline.', msg || undefined, { ...info, host });
  return aiHttpError('network', 'Could not reach the AI service.', msg || undefined, { ...info, host });
}

/** An abort signal that also fires after `ms` (until `clear`), following the caller's signal. */
function timed(signal: AbortSignal | undefined, ms: number) {
  const ctrl = new AbortController();
  let timedOut = false;
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  const t = ms > 0 ? setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, ms) : undefined;
  return { signal: ctrl.signal, timedOut: () => timedOut, clear: () => t !== undefined && clearTimeout(t) };
}

let retryBaseMs = 1500;
/** Test hook: the wait before retrying a busy service. */
export function __setHttpRetryDelay(ms: number): void {
  retryBaseMs = ms;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(cancelled());
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(cancelled());
    }, { once: true });
  });
}

export interface BuiltRequest {
  url: string;
  init: { method: 'POST'; headers: Record<string, string>; body: string };
}

interface SendContext {
  signal?: AbortSignal;
  timeoutMs: number;
  trace?: AiAttempt[];
  where: ErrorPlace;
  model?: string;
  api?: GeminiApi;
}

/** Send one request. Rejects an AiHttpError for no answer, a timeout, or an HTTP error status. */
async function httpSend(req: { url: string; init: RequestInit & { method?: string } }, c: SendContext): Promise<Response> {
  if (c.signal?.aborted) throw cancelled();
  const started = Date.now();
  const host = hostOf(req.url);
  const info: AiErrorInfo = { host, model: c.model, api: c.api };
  const record = (a: Partial<AiAttempt>) =>
    c.trace?.push({ at: new Date(started).toISOString(), method: req.init.method ?? 'GET', url: displayUrl(req.url), model: c.model, api: c.api, httpStatus: 0, ms: Date.now() - started, ok: false, ...a });
  const t = timed(c.signal, c.timeoutMs);
  let res: Response;
  try {
    res = await fetch(req.url, { ...req.init, ...loopbackFetchInit(req.url), signal: t.signal });
  } catch (e: any) {
    t.clear();
    if (c.signal?.aborted) {
      record({ note: 'stopped' });
      throw cancelled();
    }
    if (t.timedOut()) {
      record({ note: `no answer after ${Math.round(c.timeoutMs / 1000)} s` });
      throw aiHttpError('timeout', 'The AI service did not answer in time.', `No answer from ${host} after ${Math.round(c.timeoutMs / 1000)} seconds.`, info);
    }
    if (e?.name === 'AbortError') {
      record({ note: 'stopped' });
      throw cancelled();
    }
    const err = networkError(e, req.url, info);
    record({ note: `${err.code}: ${String(e?.message ?? e ?? '')}`.slice(0, 200) });
    throw err;
  }
  t.clear();
  if (!res.ok) {
    let text = '';
    try {
      text = await res.text();
    } catch {
      /* no body */
    }
    const s = parseServiceError(res.status, text, res.headers?.get?.('retry-after'));
    record({ httpStatus: res.status, apiStatus: s.apiStatus, reason: s.reasons[0], message: s.message.slice(0, 300) });
    const err = errorFromService(s, c.where, info);
    // A program on this computer (Ollama, LM Studio) answers 403 when it does not allow this website.
    if (res.status === 403 && isLocalHost(host)) err.code = 'local_forbidden';
    throw err;
  }
  record({ httpStatus: res.status, ok: true });
  return res;
}

async function readJsonBody(res: Response, signal?: AbortSignal, info: AiErrorInfo = {}): Promise<any> {
  try {
    return await res.json();
  } catch (e: any) {
    if (signal?.aborted || e?.name === 'AbortError') throw cancelled();
    throw aiHttpError('unavailable', 'The AI service sent an unreadable reply.', undefined, info);
  }
}

/** Read a server-sent-events body, calling onData for each `data:` payload (joined across lines). */
export async function readSse(body: ReadableStream<Uint8Array>, onData: (data: string) => void, signal?: AbortSignal): Promise<void> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const flush = (block: string) => {
    const lines = block.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).replace(/^ /, ''));
    if (lines.length) onData(lines.join('\n'));
  };
  try {
    for (;;) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let m: RegExpExecArray | null;
      while ((m = /\r?\n\r?\n/.exec(buf))) {
        flush(buf.slice(0, m.index));
        buf = buf.slice(m.index + m[0].length);
      }
    }
    buf += dec.decode();
    if (buf.trim()) flush(buf);
  } catch (e) {
    reader.cancel().catch(() => undefined);
    throw e;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }
}

/**
 * Read an SSE body of JSON payloads. An `{error}` payload (or an Interactions "error" event) rejects.
 * Resolves to the number of payloads that were valid JSON.
 */
export async function readJsonEvents(res: Response, onData: (data: any) => void, signal?: AbortSignal, where: ErrorPlace = 'generate', info: AiErrorInfo = {}): Promise<number> {
  if (!res.body) return 0;
  let parsed = 0;
  try {
    await readSse(
      res.body,
      (payload) => {
        if (payload.trim() === '[DONE]') return;
        let data: any;
        try {
          data = JSON.parse(payload);
        } catch {
          return;
        }
        parsed++;
        if (data?.error && (data.event_type === 'error' || !data.event_type) && !data.choices && !data.candidates) throw errorFromPayload(data, where, info);
        onData(data);
      },
      signal,
    );
  } catch (e: any) {
    if (e instanceof AiUnavailableError) throw e;
    if (signal?.aborted || e?.name === 'AbortError') throw cancelled();
    throw aiHttpError('network', 'The connection to the AI service was interrupted.', e?.message, info);
  }
  return parsed;
}

// ---------- Gemini: automatic model choice ----------

export interface GeminiModelInfo {
  name: string;
  supportedGenerationMethods?: string[];
}

const SPECIAL_MODEL = /(image|tts|audio|live|embed|vision|thinking|learnlm|robotics|computer|native|aqa|gemma|nano|customtools|veo|imagen|lyria|omni|research|banana)/i;

/** Version number in a model id ("gemini-3.6-flash" -> 3.6), or 0 for aliases such as gemini-flash-latest. */
export function geminiModelVersion(id: string): number {
  const v = /^gemini-(\d+(?:\.\d+)?)/i.exec(id);
  return v ? parseFloat(v[1]) : 0;
}

/**
 * Rank the models a key may use for text: newest stable general-purpose Flash first (or Flash-Lite
 * first with prefer 'lite'), then the other, Pro last (it has no free tier); previews after stable releases of the same
 * version. Google's "-latest" aliases rank with the newest version listed. Pure, exported for tests.
 */
export function rankGeminiModels(models: GeminiModelInfo[], prefer: GeminiPreference = 'flash'): string[] {
  const ids = models
    .filter((m) => {
      const methods = m.supportedGenerationMethods;
      // Keys may list methods the Interactions API uses under other names; accept any text generation.
      return !methods || !methods.length || methods.some((x) => /generateContent|interaction/i.test(x));
    })
    .map((m) => String(m.name ?? '').replace(/^models\//, ''))
    .filter((id) => /^gemini-/i.test(id) && !SPECIAL_MODEL.test(id));
  const newest = Math.max(0, ...ids.filter((id) => !/(preview|exp)/i.test(id)).map(geminiModelVersion));
  const score = (id: string) => {
    const alias = /latest$/i.test(id) && !geminiModelVersion(id);
    let s = (alias ? newest : geminiModelVersion(id)) * 100;
    // The preferred family first (whatever its version), then the other; Pro has no free tier (since
    // April 2026), so it is a last resort.
    if (/flash-lite/i.test(id)) s += prefer === 'lite' ? 2000 : 1000;
    else if (/flash/i.test(id)) s += prefer === 'lite' ? 1000 : 2000;
    else if (/pro/i.test(id)) s -= 1000;
    else s -= 50;
    if (/latest$/i.test(id)) s += 5; // a "-latest" alias tracks the newest release of that family
    if (/(preview|exp)/i.test(id)) s -= 40; // prefer stable releases
    if (/-\d{3,}$/.test(id)) s -= 1; // prefer the unversioned name over a pinned build number
    return s;
  };
  return [...new Set(ids)].sort((a, b) => score(b) - score(a) || a.localeCompare(b));
}

/** The best model id for text, or '' when none fits. */
export function pickGeminiModel(models: GeminiModelInfo[], prefer: GeminiPreference = 'flash'): string {
  return rankGeminiModels(models, prefer)[0] ?? '';
}

/** Used when the model list cannot be read (the aliases are maintained by Google). */
export function defaultGeminiModels(prefer: GeminiPreference): string[] {
  return prefer === 'lite' ? ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.5-flash-lite'] : ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];
}

/** Setting values meaning "choose automatically": empty (Flash-Lite), "auto", "auto-lite", "auto-flash". */
const AUTO_MODEL = /^auto(-lite|-flash)?$/i;

/** Model id without a "models/" prefix; '' means: pick automatically. */
export function geminiModelName(model: string): string {
  const m = String(model ?? '').trim().replace(/^models\//, '');
  return AUTO_MODEL.test(m) ? '' : m;
}

/** What the automatic choice favours for a model setting: Flash only when the setting says "auto-flash". */
export function geminiPreference(model: string): GeminiPreference {
  return /^auto-flash$/i.test(String(model ?? '').trim()) ? 'flash' : 'lite';
}

const listCache = new Map<string, GeminiModelInfo[]>();

/** The models this key may use (GET /v1beta/models), cached per key for this visit. */
export async function listGeminiModels(apiKey: string, opts: { signal?: AbortSignal; trace?: AiAttempt[]; timeoutMs?: number; force?: boolean } = {}): Promise<GeminiModelInfo[]> {
  const key = sanitizeApiKey(apiKey);
  if (!key) throw new AiUnavailableError('not_configured', 'No Gemini key.');
  if (!opts.force && listCache.has(key)) return listCache.get(key)!;
  let res: Response;
  try {
    res = await httpSend(
      { url: `${GEMINI_BASE}/models?pageSize=1000`, init: { method: 'GET', headers: { 'x-goog-api-key': key } } },
      { signal: opts.signal, timeoutMs: opts.timeoutMs ?? CHECK_TIMEOUT_MS, trace: opts.trace, where: 'list' },
    );
  } catch (e) {
    throw decorate(e, { keyKind: geminiKeyKind(key) });
  }
  const data = await readJsonBody(res, opts.signal);
  const models: GeminiModelInfo[] = Array.isArray(data?.models) ? data.models.filter((m: any) => typeof m?.name === 'string') : [];
  listCache.set(key, models);
  return models;
}

// Per key (stored as a hash, never the key): the model and API that last answered, and models that
// failed this visit (retired, not allowed, no free allowance).
const MEMORY_KEY = 'socius.ai.geminiModel';
const badModels = new Map<string, Set<string>>();
const noThinking = new Set<string>();
let memory: Record<string, { model: string; api: GeminiApi }> | null = null;

function keyHash(key: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

function readMemory(): Record<string, { model: string; api: GeminiApi }> {
  if (memory) return memory;
  memory = {};
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(MEMORY_KEY) : null;
    const o = raw ? JSON.parse(raw) : null;
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (typeof (v as any)?.model === 'string') memory[k] = { model: (v as any).model, api: (v as any).api === 'generateContent' ? 'generateContent' : 'interactions' };
  } catch {
    /* storage unavailable */
  }
  return memory;
}

function remember(key: string, prefer: GeminiPreference, model: string, api: GeminiApi) {
  const m = readMemory();
  const h = `${keyHash(key)}:${prefer}`;
  if (m[h]?.model === model && m[h]?.api === api) return;
  m[h] = { model, api };
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(m));
  } catch {
    /* kept for this visit */
  }
}

function remembered(key: string, prefer: GeminiPreference): { model: string; api: GeminiApi } | undefined {
  return readMemory()[`${keyHash(key)}:${prefer}`];
}

/** Test hook: forget model lists, remembered models and failures. */
export function __resetGeminiState(): void {
  listCache.clear();
  badModels.clear();
  noThinking.clear();
  memory = {};
}

/** Listing errors that settle the matter (the key or the connection is the problem, not the model). */
const LIST_FATAL = new Set(['invalid_key', 'key_not_accepted', 'referrer_blocked', 'key_restricted', 'api_disabled', 'key_suspended', 'region', 'bad_key_format', 'network', 'offline', 'timeout', 'cancelled', 'rate_limited', 'not_configured']);

/** Candidate models for this key, best first: the one that answered last time, then the ranked list. */
export async function geminiCandidates(apiKey: string, opts: { signal?: AbortSignal; trace?: AiAttempt[]; timeoutMs?: number; force?: boolean; prefer?: GeminiPreference } = {}): Promise<string[]> {
  const key = sanitizeApiKey(apiKey);
  const prefer = opts.prefer ?? 'lite';
  let ranked: string[] = [];
  try {
    ranked = rankGeminiModels(await listGeminiModels(key, opts), prefer);
  } catch (e: any) {
    if (LIST_FATAL.has(e?.code)) throw decorate(e, { keyKind: geminiKeyKind(key) });
    ranked = [];
  }
  if (!ranked.length) ranked = defaultGeminiModels(prefer);
  const bad = badModels.get(key) ?? new Set<string>();
  const good = ranked.filter((m) => !bad.has(m));
  const list = good.length ? good : ranked;
  const last = remembered(key, prefer)?.model;
  return last && list.includes(last) ? [last, ...list.filter((m) => m !== last)] : list;
}

/** The model to use for this key: the user's explicit choice, else the best candidate. */
export async function resolveGeminiModel(cfg: GeminiConfig, signal?: AbortSignal, forceRefresh = false): Promise<string> {
  const explicit = geminiModelName(cfg.model);
  if (explicit) return explicit;
  return (await geminiCandidates(cfg.apiKey, { signal, force: forceRefresh, prefer: geminiPreference(cfg.model) }))[0];
}

/** The model that last answered for this key, or the best one listed (for display); '' if unknown. */
export function lastResolvedGeminiModel(apiKey: string, prefer: GeminiPreference = 'lite'): string {
  const key = sanitizeApiKey(apiKey);
  if (!key) return '';
  const r = remembered(key, prefer)?.model;
  if (r) return r;
  const listed = listCache.get(key);
  return listed ? rankGeminiModels(listed, prefer)[0] ?? '' : '';
}

// ---------- Gemini: request building ----------

/** Thinking level for the Interactions API: 'low' for Gemini 3 and newer and for aliases; none for 2.x. */
export function interactionThinkingLevel(model: string): string | undefined {
  const v = geminiModelVersion(model);
  return v === 0 || v >= 3 ? 'low' : undefined;
}

/** generateContent `thinkingConfig`: Gemini 3 takes a level, 2.5 Flash a zero budget, 2.5 Pro its minimum. */
export function geminiThinkingConfig(model: string): Record<string, unknown> | undefined {
  const v = geminiModelVersion(model);
  if (v >= 3) return { thinkingLevel: 'low' };
  if (v >= 2.5) return /pro/i.test(model) ? { thinkingBudget: 128 } : { thinkingBudget: 0 };
  return undefined;
}

/** Output tokens to add so that thinking cannot use up a small output limit. */
function thinkingRoom(model: string, thinkingOff: boolean): number {
  const v = geminiModelVersion(model);
  if (thinkingOff) return 0;
  return v === 0 || v >= 2.5 ? 1024 : 0;
}

export interface InteractionOptions {
  stream: boolean;
  json?: boolean;
  maxTokens?: number;
  /** false: send no thinking level (after a model refused it). */
  thinking?: boolean;
  /** false: omit `store: false` (after the service refused the field). */
  noStore?: boolean;
  system?: string;
  tools?: unknown[];
  toolChoice?: 'auto' | 'none';
}

/** POST /v1beta/interactions. `input` is a prompt string or a list of steps (a whole conversation). */
export function buildInteractionRequest(cfg: GeminiConfig, input: unknown, o: InteractionOptions): BuiltRequest {
  const model = geminiModelName(cfg.model);
  const body: Record<string, unknown> = { model, input };
  if (o.system) body.system_instruction = o.system;
  const gc: Record<string, unknown> = {};
  const level = o.thinking === false ? undefined : interactionThinkingLevel(model);
  if (level) gc.thinking_level = level;
  if (o.maxTokens) gc.max_output_tokens = o.maxTokens + thinkingRoom(model, false);
  if (o.tools?.length) {
    body.tools = o.tools;
    if (o.toolChoice === 'none') gc.tool_choice = 'none';
  }
  if (Object.keys(gc).length) body.generation_config = gc;
  if (o.json) body.response_format = { type: 'text', mime_type: 'application/json' };
  // Do not keep research excerpts on Google's servers after answering.
  if (o.noStore !== false) body.store = false;
  if (o.stream) body.stream = true;
  return {
    url: GEMINI_INTERACTIONS_URL,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': sanitizeApiKey(cfg.apiKey), Accept: o.stream ? 'text/event-stream' : 'application/json' },
      body: JSON.stringify(body),
    },
  };
}

/** The older generateContent endpoint (still used for "AIza" keys when Interactions is not usable). */
export function buildGeminiRequest(cfg: GeminiConfig, prompt: string, opts: { stream: boolean; json?: boolean; maxTokens?: number; thinking?: boolean }): BuiltRequest {
  const name = geminiModelName(cfg.model);
  const model = encodeURIComponent(name);
  const url = `${GEMINI_BASE}/models/${model}:${opts.stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`;
  // Gemini 3 and newer: Google advises leaving temperature at its default.
  const generationConfig: Record<string, unknown> = geminiModelVersion(name) >= 3 ? {} : { temperature: 0.4 };
  if (opts.json) generationConfig.responseMimeType = 'application/json';
  const thinking = opts.thinking === false ? undefined : geminiThinkingConfig(name);
  if (thinking) generationConfig.thinkingConfig = thinking;
  if (opts.maxTokens) generationConfig.maxOutputTokens = opts.maxTokens + thinkingRoom(name, thinking?.thinkingBudget === 0);
  return {
    url,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': sanitizeApiKey(cfg.apiKey) },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig }),
    },
  };
}

// ---------- Gemini: sending with fallbacks ----------

export interface GeminiCallSpec {
  stream: boolean;
  interactions: (model: string, o: { thinking: boolean; noStore: boolean }) => BuiltRequest;
  generateContent: (model: string, o: { thinking: boolean }) => BuiltRequest;
}

export interface GeminiRunOptions {
  signal?: AbortSignal;
  prefer?: GeminiPreference;
  timeoutMs?: number;
  trace?: AiAttempt[];
  onModelFallback?: (model: string, reason?: string) => void;
}

export interface GeminiRunResult {
  res: Response;
  model: string;
  api: GeminiApi;
  tried: string[];
}

/** Errors where another model may work. */
function modelLevel(e: AiHttpError): boolean {
  if (['bad_model', 'permission', 'overloaded'].includes(e.code)) return true;
  if (e.code === 'unavailable' && (e.httpStatus ?? 0) >= 500) return true;
  return e.code === 'rate_limited' && !!(e.zeroQuota || e.daily);
}

/** Errors where the other Gemini API may work (for keys that generateContent accepts). */
function apiLevel(e: AiHttpError, api: GeminiApi): boolean {
  if (['endpoint_missing', 'field_unsupported'].includes(e.code)) return true;
  return api === 'interactions' && e.code === 'bad_model';
}

async function sendGemini(spec: GeminiCallSpec, api: GeminiApi, model: string, c: SendContext): Promise<Response> {
  let thinking = !noThinking.has(model);
  let noStore = true;
  let retried = false;
  for (;;) {
    const req = api === 'interactions' ? spec.interactions(model, { thinking, noStore }) : spec.generateContent(model, { thinking });
    try {
      return await httpSend(req, { ...c, model, api });
    } catch (e) {
      const err = e as AiHttpError;
      if (err.code === 'thinking_unsupported' && thinking) {
        thinking = false;
        noThinking.add(model);
        continue;
      }
      if (err.code === 'field_unsupported' && api === 'interactions' && noStore && /store/i.test(err.detail ?? '')) {
        noStore = false;
        continue;
      }
      if ((err.code === 'overloaded' || (err.code === 'unavailable' && (err.httpStatus ?? 0) >= 500)) && !retried) {
        retried = true;
        await sleep(Math.min(8000, Math.max(retryBaseMs, err.retryAfterMs ?? 0)), c.signal);
        continue;
      }
      if (api === 'interactions' && ((err.httpStatus === 404 && !/model/i.test(err.detail ?? '')) || err.httpStatus === 405 || err.httpStatus === 501)) err.code = 'endpoint_missing';
      throw err;
    }
  }
}

function shortReason(e: AiHttpError): string {
  const bits = [e.httpStatus ? String(e.httpStatus) : '', e.apiStatus ?? '', e.zeroQuota ? 'no free allowance (limit 0)' : e.daily ? 'daily allowance used up' : ''].filter(Boolean).join(' ');
  return `${e.model ?? '?'}: ${bits || e.code}${e.detail ? `, ${e.detail.slice(0, 160)}` : ''}`;
}

/** One error for "every model tried failed". */
function summarise(failures: AiHttpError[], tried: string[], trace: AiAttempt[]): AiHttpError {
  if (!failures.length) return aiHttpError('bad_model', 'No suitable Gemini model is available for this key.', 'Google did not list any Gemini text model for this key.', { tried, trace });
  const codes = failures.map((f) => f.code);
  const last = failures[failures.length - 1];
  let code = last.code;
  if (failures.some((f) => f.code === 'rate_limited' && f.zeroQuota) && codes.every((c) => ['rate_limited', 'bad_model', 'permission'].includes(c))) code = 'no_free_quota';
  else if (codes.every((c) => c === 'rate_limited')) code = 'rate_limited';
  else if (codes.every((c) => c === 'bad_model')) code = 'bad_model';
  else if (codes.every((c) => c === 'permission' || c === 'bad_model')) code = 'permission';
  else if (codes.includes('overloaded')) code = 'overloaded';
  const detail = failures.map(shortReason).join('; ');
  return aiHttpError(code, 'None of the Gemini models tried could answer.', detail, {
    tried,
    trace,
    model: last.model,
    httpStatus: last.httpStatus,
    apiStatus: last.apiStatus,
    reason: last.reason,
    daily: code === 'rate_limited' ? failures.every((f) => f.daily) : undefined,
    retryAfterMs: code === 'rate_limited' ? last.retryAfterMs : undefined,
    zeroQuota: code === 'no_free_quota' || undefined,
  });
}

/**
 * Send a Gemini request, choosing the model and API: the typed model (or the best listed one), then up
 * to MAX_MODEL_TRIES models in all; Interactions first, generateContent as a fallback for keys it accepts.
 * Resolves with the successful response (not yet read).
 */
export async function geminiRun(cfg: GeminiConfig, spec: GeminiCallSpec, opts: GeminiRunOptions = {}): Promise<GeminiRunResult> {
  const key = sanitizeApiKey(cfg.apiKey);
  if (!key) throw new AiUnavailableError('not_configured', 'No Gemini key.');
  const trace = opts.trace ?? [];
  const ctx: SendContext = { signal: opts.signal, timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, trace, where: 'generate' };
  const explicit = geminiModelName(cfg.model);
  const keyKind = geminiKeyKind(key);
  const prefer = opts.prefer ?? geminiPreference(cfg.model);
  const queue: string[] = explicit ? [explicit] : await geminiCandidates(key, { signal: opts.signal, trace, prefer });
  let listed = !explicit;
  const tried: string[] = [];
  const failures: AiHttpError[] = [];
  while (tried.length < MAX_MODEL_TRIES) {
    if (!queue.length) {
      if (listed) break;
      listed = true;
      try {
        queue.push(...(await geminiCandidates(key, { signal: opts.signal, trace, prefer })).filter((m) => !tried.includes(m)));
      } catch (e) {
        throw decorate(e, { tried, trace, keyKind });
      }
      if (!queue.length) break;
    }
    const model = queue.shift()!;
    tried.push(model);
    // Interactions first, unless generateContent is the one that answered for this key last time.
    const apis: GeminiApi[] = remembered(key, prefer)?.api === 'generateContent' ? ['generateContent', 'interactions'] : ['interactions', 'generateContent'];
    let modelErr: AiHttpError | null = null;
    for (const api of apis) {
      try {
        const res = await sendGemini(spec, api, model, ctx);
        remember(key, prefer, model, api);
        if (explicit && model !== explicit) opts.onModelFallback?.(model, failures[0]?.code);
        return { res, model, api, tried };
      } catch (e) {
        const err = e as AiHttpError;
        if (err.code === 'cancelled') throw err;
        decorate(err, { model, api, keyKind });
        modelErr = err;
        if (!apiLevel(err, api)) break;
      }
    }
    const err = modelErr!;
    if (!modelLevel(err)) throw decorate(err, { tried, trace, keyKind });
    let bad = badModels.get(key);
    if (!bad) badModels.set(key, (bad = new Set()));
    bad.add(model);
    failures.push(err);
  }
  throw decorate(summarise(failures, tried, trace), { keyKind });
}

// ---------- Gemini: reading replies ----------

/** Text of a generateContent response (or one streamed chunk). Thought parts are skipped. */
export function geminiText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.filter((p: any) => typeof p?.text === 'string' && !p.thought).map((p: any) => p.text).join('');
}

/** generateContent returns 200 with no text when a request is blocked by its safety filter. */
export function geminiBlocked(data: any): boolean {
  if (data?.promptFeedback?.blockReason) return true;
  const fr = data?.candidates?.[0]?.finishReason;
  return fr === 'SAFETY' || fr === 'PROHIBITED_CONTENT' || fr === 'BLOCKLIST' || fr === 'SPII' || fr === 'IMAGE_SAFETY';
}

/** Why a generateContent reply had no text, as an AiError. */
export function geminiEmptyError(finishReason: string | undefined, blockReason: string | undefined, info: AiErrorInfo = {}): AiHttpError {
  if (blockReason) return aiHttpError('blocked', 'The request was blocked by the service.', `Google blocked the prompt (${blockReason}).`, info);
  switch (finishReason) {
    case 'SAFETY':
    case 'PROHIBITED_CONTENT':
    case 'BLOCKLIST':
    case 'SPII':
    case 'IMAGE_SAFETY':
      return aiHttpError('blocked', 'The request was blocked by the service.', `The answer was stopped by Google's filter (${finishReason}).`, info);
    case 'RECITATION':
      return aiHttpError('recitation', 'The answer was stopped because it repeated published text.', 'finishReason: RECITATION', info);
    case 'MAX_TOKENS':
      return aiHttpError('max_tokens', 'The model used its whole answer length before writing any text.', 'finishReason: MAX_TOKENS (probably spent on thinking)', info);
    case 'MALFORMED_FUNCTION_CALL':
      return aiHttpError('malformed_call', 'The model sent a tool call that could not be read.', finishReason, info);
    default:
      return aiHttpError('empty_reply', 'The AI sent an empty answer.', finishReason ? `finishReason: ${finishReason}` : 'No text and no reason given.', info);
  }
}

/** Old Interactions responses listed `outputs` (text, thought, function_call); newer ones list `steps`. */
function outputsToSteps(outputs: any[]): any[] {
  const steps: any[] = [];
  for (const o of outputs) {
    if (o?.type === 'text' && typeof o.text === 'string') {
      const last = steps[steps.length - 1];
      if (last?.type === 'model_output') last.content.push({ type: 'text', text: o.text });
      else steps.push({ type: 'model_output', content: [{ type: 'text', text: o.text }] });
    } else if (o && typeof o === 'object') steps.push(o);
  }
  return steps;
}

/** Steps produced by the model in this interaction (after the last input step the response may echo). */
export function interactionOutputSteps(data: any): any[] {
  const all = Array.isArray(data?.steps) ? data.steps : Array.isArray(data?.outputs) ? outputsToSteps(data.outputs) : [];
  let start = 0;
  for (let i = all.length - 1; i >= 0; i--)
    if (all[i]?.type === 'user_input' || all[i]?.type === 'function_result') {
      start = i + 1;
      break;
    }
  return all.slice(start).filter((s: any) => s && typeof s === 'object');
}

function stepText(steps: any[]): string {
  let out = '';
  for (const s of steps) {
    if (s?.type !== 'model_output' || !Array.isArray(s.content)) continue;
    for (const c of s.content) if (c?.type === 'text' && typeof c.text === 'string') out += c.text;
  }
  return out;
}

/** Collects an Interactions reply, whole or streamed (step.start / step.delta / step.stop events). */
export class InteractionAccumulator {
  steps: any[] = [];
  status?: string;
  id?: string;
  errors: Array<{ code?: string; message?: string }> = [];
  usage?: any;
  private args = new Map<number, string>();

  /** A whole (non-streamed) Interaction resource. */
  addInteraction(data: any) {
    this.steps = interactionOutputSteps(data);
    this.status = typeof data?.status === 'string' ? data.status : this.status;
    this.id = data?.id ?? this.id;
    this.usage = data?.usage ?? this.usage;
    for (const e of Array.isArray(data?.errors) ? data.errors : []) this.errors.push(e);
  }

  /** One streamed event. */
  add(ev: any) {
    const type = ev?.event_type;
    const idx = typeof ev?.index === 'number' ? ev.index : this.steps.length;
    switch (type) {
      case 'interaction.created':
      case 'interaction.completed':
      case 'interaction.complete':
      case 'interaction.start': {
        const it = ev.interaction ?? {};
        this.id = it.id ?? this.id;
        if (typeof it.status === 'string') this.status = it.status;
        this.usage = it.usage ?? this.usage;
        const done = interactionOutputSteps(it);
        if (done.length && stepText(done).length >= stepText(this.steps).length) this.steps = done;
        break;
      }
      case 'interaction.status_update':
        if (typeof ev.status === 'string') this.status = ev.status;
        break;
      case 'step.start':
        this.steps[idx] = ev.step && typeof ev.step === 'object' ? structuredCloneSafe(ev.step) : {};
        if (this.steps[idx].type === 'model_output' && !Array.isArray(this.steps[idx].content)) this.steps[idx].content = [];
        break;
      case 'step.delta':
      case 'content.delta': {
        const d = ev.delta ?? {};
        let s = this.steps[idx];
        if (!s) s = this.steps[idx] = { type: d.type === 'thought_signature' || d.type === 'thought_summary' ? 'thought' : d.type === 'arguments_delta' || d.type === 'function_call' ? 'function_call' : 'model_output' };
        if (d.type === 'text' && typeof d.text === 'string') {
          if (!Array.isArray(s.content)) s.content = [];
          const last = s.content[s.content.length - 1];
          if (last?.type === 'text') last.text += d.text;
          else s.content.push({ type: 'text', text: d.text });
        } else if (d.type === 'thought_signature' && typeof d.signature === 'string') s.signature = (s.signature ?? '') + d.signature;
        else if (d.type === 'arguments_delta' && typeof d.arguments === 'string') this.args.set(idx, (this.args.get(idx) ?? '') + d.arguments);
        else if (d.type === 'function_call') Object.assign(s, { type: 'function_call', id: d.id ?? s.id, name: d.name ?? s.name, arguments: d.arguments ?? s.arguments });
        break;
      }
      case 'step.stop':
      case 'content.stop':
        this.finishArgs(idx);
        break;
      case 'error':
        if (ev.error) this.errors.push(ev.error);
        break;
      default:
        break;
    }
  }

  private finishArgs(idx: number) {
    const raw = this.args.get(idx);
    const s = this.steps[idx];
    if (raw === undefined || !s) return;
    this.args.delete(idx);
    try {
      s.arguments = raw.trim() ? JSON.parse(raw) : {};
    } catch {
      s.arguments = raw;
    }
  }

  /** Output steps, compact and in order (for replaying the model's turn in the next request). */
  outputSteps(): any[] {
    for (const idx of [...this.args.keys()]) this.finishArgs(idx);
    return this.steps.filter((s) => s && typeof s === 'object' && s.type);
  }

  text(): string {
    return stepText(this.steps.filter(Boolean));
  }

  /** Why there is no text, as an AiError. */
  emptyError(info: AiErrorInfo = {}): AiHttpError {
    const stepErr = this.steps.find((s) => s?.error)?.error;
    const err = this.errors[0] ?? stepErr;
    const status = this.status ?? '';
    const msg = String(err?.message ?? '');
    if (/safety|blocked|prohibited|harm|blocklist|spii/i.test(`${msg} ${err?.code ?? ''}`)) return aiHttpError('blocked', 'The request was blocked by the service.', msg || status, info);
    if (/recitation/i.test(msg)) return aiHttpError('recitation', 'The answer was stopped because it repeated published text.', msg, info);
    if (/function|tool call/i.test(msg) && /malformed|invalid|parse/i.test(msg)) return aiHttpError('malformed_call', 'The model sent a tool call that could not be read.', msg, info);
    if (status === 'incomplete' || status === 'budget_exceeded' || /max(imum)?[ _]?(output )?tokens/i.test(msg))
      return aiHttpError('max_tokens', 'The model used its whole answer length before writing any text.', `status: ${status || 'incomplete'}${msg ? `, ${msg}` : ''}${this.usage?.total_thought_tokens ? `, ${this.usage.total_thought_tokens} thinking tokens` : ''}`, info);
    if (err) return errorFromPayload({ error: err }, 'generate', info);
    return aiHttpError('empty_reply', 'The AI sent an empty answer.', `status: ${status || 'unknown'}`, info);
  }
}

function structuredCloneSafe<T>(v: T): T {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return v;
  }
}

async function readInteractionReply(res: Response, stream: boolean, opts: HttpAskOptions, info: AiErrorInfo): Promise<string> {
  const acc = new InteractionAccumulator();
  if (stream) {
    let last = '';
    await readJsonEvents(
      res,
      (d) => {
        acc.add(d);
        const t = acc.text();
        if (t && t !== last) {
          last = t;
          opts.onText?.(t);
        }
      },
      opts.signal,
      'generate',
      info,
    );
  } else acc.addInteraction(await readJsonBody(res, opts.signal, info));
  const text = acc.text();
  if (!text) throw acc.emptyError(info);
  return text;
}

async function readGenerateContentReply(res: Response, stream: boolean, opts: HttpAskOptions, info: AiErrorInfo): Promise<string> {
  let finish: string | undefined;
  let block: string | undefined;
  const note = (d: any) => {
    finish = d?.candidates?.[0]?.finishReason ?? finish;
    block = d?.promptFeedback?.blockReason ?? block;
  };
  let text = '';
  if (stream) {
    await readJsonEvents(
      res,
      (d) => {
        note(d);
        const piece = geminiText(d);
        if (piece) {
          text += piece;
          opts.onText?.(text);
        }
      },
      opts.signal,
      'generate',
      info,
    );
  } else {
    const data = await readJsonBody(res, opts.signal, info);
    note(data);
    text = geminiText(data);
  }
  if (!text) throw geminiEmptyError(finish, block, info);
  return text;
}

export async function askGemini(cfg: GeminiConfig, prompt: string, opts: HttpAskOptions = {}): Promise<string> {
  const key = sanitizeApiKey(cfg.apiKey);
  if (!key) throw new AiUnavailableError('not_configured', 'No Gemini key.');
  const stream = !!opts.onText;
  const trace = opts.trace ?? [];
  const run = await geminiRun(
    { apiKey: key, model: cfg.model },
    {
      stream,
      interactions: (model, o) => buildInteractionRequest({ apiKey: key, model }, prompt, { stream, json: opts.json, maxTokens: opts.maxTokens, thinking: o.thinking, noStore: o.noStore }),
      generateContent: (model, o) => buildGeminiRequest({ apiKey: key, model }, prompt, { stream, json: opts.json, maxTokens: opts.maxTokens, thinking: o.thinking }),
    },
    { signal: opts.signal, timeoutMs: opts.timeoutMs, trace, onModelFallback: opts.onModelFallback, prefer: opts.prefer },
  );
  opts.onModel?.(run.model);
  const info: AiErrorInfo = { model: run.model, api: run.api, tried: run.tried, trace, host: 'generativelanguage.googleapis.com' };
  return run.api === 'interactions' ? readInteractionReply(run.res, stream, opts, info) : readGenerateContentReply(run.res, stream, opts, info);
}

// ---------- OpenAI-compatible services ----------

/** Base URL without a trailing slash or a pasted "/chat/completions". */
export function normaliseBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
}

export function buildOpenAiRequest(cfg: OpenAiConfig, prompt: string, opts: { stream: boolean; json?: boolean; maxTokens?: number }): BuiltRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const key = sanitizeApiKey(cfg.apiKey);
  if (key) headers.Authorization = `Bearer ${key}`;
  const body: Record<string, unknown> = {
    model: cfg.model.trim(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    stream: opts.stream,
  };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  // response_format is not sent: several OpenAI-compatible services reject it. Replies are parsed tolerantly.
  return { url: `${normaliseBaseUrl(cfg.baseUrl)}/chat/completions`, init: { method: 'POST', headers, body: JSON.stringify(body) } };
}

export function openAiText(data: any): string {
  const c = data?.choices?.[0];
  const t = c?.message?.content ?? c?.text;
  return typeof t === 'string' ? t : '';
}

export function openAiDelta(data: any): string {
  const t = data?.choices?.[0]?.delta?.content;
  return typeof t === 'string' ? t : '';
}

function isLocalUrl(url: string): boolean {
  return isLocalHost(hostOf(normaliseBaseUrl(url)));
}

/** Model ids an OpenAI-compatible service offers (GET {base}/models), or null when it has no such list. */
export async function listOpenAiModels(cfg: Pick<OpenAiConfig, 'baseUrl' | 'apiKey'>, opts: { signal?: AbortSignal; trace?: AiAttempt[]; timeoutMs?: number } = {}): Promise<string[] | null> {
  const key = sanitizeApiKey(cfg.apiKey);
  const headers: Record<string, string> = {};
  if (key) headers.Authorization = `Bearer ${key}`;
  let res: Response;
  try {
    res = await httpSend({ url: `${normaliseBaseUrl(cfg.baseUrl)}/models`, init: { method: 'GET', headers } }, { signal: opts.signal, timeoutMs: opts.timeoutMs ?? CHECK_TIMEOUT_MS, trace: opts.trace, where: 'list' });
  } catch (e: any) {
    if (e?.httpStatus === 404 || e?.httpStatus === 405) return null;
    throw e;
  }
  const data = await readJsonBody(res, opts.signal);
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : Array.isArray(data) ? data : [];
  return list.map((m: any) => (typeof m === 'string' ? m : m?.id ?? m?.name)).filter((id: unknown): id is string => typeof id === 'string' && !!id);
}

/** Models worth offering in a picker: chat models only, free ones first (OpenRouter's ":free"). */
export function suggestOpenAiModels(ids: string[]): string[] {
  const chat = ids.filter((id) => !/(whisper|tts|embed|guard|moderation|playai|orpheus|dall-e|image|audio|transcribe|rerank)/i.test(id));
  const free = chat.filter((id) => /:free$/i.test(id));
  return [...new Set([...free.sort(), ...chat.filter((id) => !/:free$/i.test(id)).sort()])];
}

async function streamOpenAi(res: Response, opts: HttpAskOptions, info: AiErrorInfo): Promise<{ text: string; finish?: string }> {
  let text = '';
  let finish: string | undefined;
  const parsed = await readJsonEvents(
    res,
    (data) => {
      finish = data?.choices?.[0]?.finish_reason ?? finish;
      const piece = openAiDelta(data);
      if (piece) {
        text += piece;
        opts.onText?.(text);
      }
    },
    opts.signal,
    'chat',
    info,
  );
  if (!parsed && !text) throw aiHttpError('unavailable', 'The AI service sent an unreadable reply.', 'The stream contained no readable events.', info);
  return { text, finish };
}

export async function askOpenAiCompatible(cfg: OpenAiConfig, prompt: string, opts: HttpAskOptions = {}): Promise<string> {
  if (!cfg.baseUrl.trim() || !cfg.model.trim()) throw new AiUnavailableError('not_configured', 'The service is not set up.');
  const stream = !!opts.onText;
  const req = buildOpenAiRequest(cfg, prompt, { stream, json: opts.json, maxTokens: opts.maxTokens });
  // A program on this computer may take minutes to load a model before its first byte: no time limit.
  const ctx: SendContext = { signal: opts.signal, timeoutMs: opts.timeoutMs ?? (isLocalUrl(cfg.baseUrl) ? 0 : DEFAULT_TIMEOUT_MS), trace: opts.trace, where: 'chat', model: cfg.model.trim() };
  const info: AiErrorInfo = { model: cfg.model.trim(), host: hostOf(req.url), trace: opts.trace };
  let res: Response;
  try {
    res = await httpSend(req, ctx);
  } catch (e) {
    const err = e as AiHttpError;
    if (!(err.code === 'overloaded' || (err.code === 'unavailable' && (err.httpStatus ?? 0) >= 500))) throw err;
    await sleep(Math.min(8000, Math.max(retryBaseMs, err.retryAfterMs ?? 0)), opts.signal);
    res = await httpSend(req, ctx);
  }
  let text: string;
  let finish: string | undefined;
  if (stream) ({ text, finish } = await streamOpenAi(res, opts, info));
  else {
    const data = await readJsonBody(res, opts.signal, info);
    // OpenRouter can answer 200 with an error body.
    if (data?.error && !Array.isArray(data?.choices)) throw errorFromPayload(data, 'chat', info);
    text = openAiText(data);
    finish = data?.choices?.[0]?.finish_reason;
  }
  if (!text && finish === 'length') throw aiHttpError('max_tokens', 'The model used its whole answer length before writing any text.', 'finish_reason: length', info);
  if (!text && finish === 'content_filter') throw aiHttpError('blocked', 'The request was blocked by the service.', 'finish_reason: content_filter', info);
  return text;
}
