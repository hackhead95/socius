// Step-by-step "Test connection" for AI assistant settings, and plain-text reports for support.
//
// Google Gemini: 1) Internet connection, 2) Reached Google, 3) Key accepted, 4) Model chosen,
// 5) Got an answer. OpenAI-compatible online services (Groq, OpenRouter, ...): the same steps, with
// "Reached <host>" and "Model available" (the service's model list is offered when the typed model is
// not in it). Claude and the on-device model: one step, "Got an answer". (A program on this computer,
// such as Ollama, has its own guided check in ai-local.ts.)
//
// Reports never contain a key: keys are described ("set, 39 characters, starts with AIza") and anything
// that looks like a key is removed from the text before it is shown or copied.

import {
  CHECK_TIMEOUT_MS, askGemini, askOpenAiCompatible, describeKey, geminiCandidates, geminiModelName, geminiPreference, listGeminiModels, listOpenAiModels, normaliseBaseUrl, rankGeminiModels,
  sanitizeApiKey, suggestOpenAiModels, type AiAttempt, type AiHttpError,
} from './ai-http';
import { DEFAULT_GEMINI_MODEL, aiErrorMessage, aiErrorText, effectiveProvider, logAiError, recordAiConnection, getAiSettings, providerLabel, saveAiSettings, testAiConnection, type AiProviderId, type AiSettings } from './ai';
import { BUILD_INFO } from './buildInfo';
import { logError } from './errorlog';
import { recentAiTimings, startAiTiming, type AiTiming } from './ai-timing';

export type CheckStepId = 'internet' | 'reach' | 'key' | 'model' | 'answer';
export type CheckState = 'pending' | 'running' | 'ok' | 'warn' | 'fail' | 'skip';

export interface CheckStep {
  id: CheckStepId;
  label: string;
  state: CheckState;
  detail?: string;
}

export interface CheckError {
  code: string;
  /** Plain-English reason and what to do. */
  message: string;
  /** The service's own words. */
  detail?: string;
  httpStatus?: number;
  apiStatus?: string;
  reason?: string;
  host?: string;
}

export interface ConnectionCheck {
  provider: AiProviderId | null;
  providerLabel: string;
  startedAt: string;
  finishedAt?: string;
  running: boolean;
  ok: boolean;
  steps: CheckStep[];
  /** The model that answered, and every model tried (in order). */
  model?: string;
  tried?: string[];
  /** Models Socius would try, best first (Gemini automatic choice). */
  candidates?: string[];
  modelSetting?: string;
  keyInfo?: string;
  reply?: string;
  error?: CheckError;
  /** OpenAI-compatible: models the service offers, for a picker when the typed one is missing. */
  models?: string[];
  attempts: AiAttempt[];
  online: boolean | null;
  /** Where the time went (ai-timing.ts), for Copy details. */
  timing?: string[];
}

/** Step names, as shown in the checklist. */
export const CHECK_LABELS: Record<CheckStepId, string> = {
  internet: 'Internet connection',
  reach: 'Reached Google',
  key: 'Key accepted',
  model: 'Model chosen',
  answer: 'Got an answer',
};

/** Errors that mean the key (not the model or the network) is the problem. */
const KEY_CODES = new Set(['invalid_key', 'referrer_blocked', 'key_restricted', 'api_disabled', 'key_suspended', 'bad_key_format', 'key_not_accepted']);

const TEST_PROMPT = 'Reply with the single word OK.';

function browserOnline(): boolean | null {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : null;
  } catch {
    return null;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

function isLocalBase(url: string): boolean {
  return /^(localhost|127(?:\.\d{1,3}){3}|\[::1\]|0\.0\.0\.0)(:\d+)?$/i.test(hostOf(url));
}

/** Can this page's own server be reached? (null when that tells nothing, e.g. on localhost.) */
async function pageReachable(signal?: AbortSignal): Promise<boolean | null> {
  try {
    if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol) || /^(localhost|127\.|\[::1\])/.test(location.hostname)) return null;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    signal?.addEventListener('abort', () => ctrl.abort(), { once: true });
    try {
      await fetch(location.href.split('#')[0], { method: 'HEAD', cache: 'no-store', signal: ctrl.signal });
      return true;
    } finally {
      clearTimeout(t);
    }
  } catch {
    return false;
  }
}

function errorOf(e: unknown): CheckError {
  const err = (e ?? {}) as AiHttpError;
  return {
    code: err.code ?? 'unavailable',
    message: aiErrorText(err),
    detail: err.detail,
    httpStatus: err.httpStatus,
    apiStatus: err.apiStatus,
    reason: err.reason,
    host: err.host,
  };
}

function isCancel(e: unknown, signal?: AbortSignal): boolean {
  return !!signal?.aborted || (e as { code?: string })?.code === 'cancelled';
}

class Check {
  c: ConnectionCheck;
  /** The error behind a failed check (for Help > Error log). */
  raw: unknown = null;
  constructor(provider: AiProviderId | null, s: AiSettings, private onUpdate?: (c: ConnectionCheck) => void) {
    this.c = { provider, providerLabel: providerLabel(provider, s), startedAt: new Date().toISOString(), running: true, ok: false, steps: [], attempts: [], online: browserOnline() };
  }
  steps(ids: CheckStepId[], labels: Partial<Record<CheckStepId, string>> = {}) {
    this.c.steps = ids.map((id) => ({ id, label: labels[id] ?? CHECK_LABELS[id], state: 'pending' as CheckState }));
    this.emit();
  }
  set(id: CheckStepId, state: CheckState, detail?: string) {
    this.c.steps = this.c.steps.map((s) => (s.id === id ? { ...s, state, detail } : s));
    this.emit();
  }
  get(id: CheckStepId): CheckStep | undefined {
    return this.c.steps.find((s) => s.id === id);
  }
  fail(e: unknown, message?: string) {
    this.raw = e;
    this.c.error = { ...errorOf(e), ...(message ? { message } : {}) };
    this.c.steps = this.c.steps.map((s) => (s.state === 'pending' || s.state === 'running' ? { ...s, state: 'skip' as CheckState, detail: 'Not checked: an earlier step failed.' } : s));
    this.emit();
  }
  emit() {
    this.onUpdate?.(this.snapshot());
  }
  snapshot(): ConnectionCheck {
    return { ...this.c, steps: this.c.steps.map((s) => ({ ...s })), attempts: [...this.c.attempts] };
  }
  /** Models in the order they were sent a generation request. */
  triedFromAttempts(): string[] {
    const out: string[] = [];
    for (const a of this.c.attempts) if (a.method === 'POST' && a.model && !out.includes(a.model)) out.push(a.model);
    return out;
  }
}

/** Step 1. False when the browser says it is offline (the check stops there). */
function internetStep(k: Check): boolean {
  k.set('internet', 'running');
  if (k.c.online === false) {
    k.set('internet', 'fail', 'The browser says this computer is offline.');
    k.fail({ code: 'offline' });
    return false;
  }
  k.set('internet', 'ok', k.c.online ? 'The browser says this computer is online.' : 'Could not tell; trying anyway.');
  return true;
}

/** After "no answer at all": was it the internet, or only this service? */
async function explainNoAnswer(k: Check, e: unknown, signal?: AbortSignal) {
  const page = await pageReachable(signal);
  if (page === false) {
    k.set('internet', 'fail', 'Neither the AI service nor this website answered.');
    k.fail(e, 'No internet connection: neither the AI service nor this website answered. Check the Wi-Fi or network cable (or whether a proxy or VPN needs signing in to), then try again.');
    return;
  }
  if (page === true) k.set('internet', 'ok', 'Online: this website answered, but the AI service did not.');
  k.fail(e);
}

async function checkGemini(k: Check, s: AiSettings, signal?: AbortSignal, timing?: AiTiming) {
  const key = sanitizeApiKey(s.gemini.apiKey);
  const explicit = geminiModelName(s.gemini.model);
  k.c.keyInfo = describeKey(s.gemini.apiKey);
  k.c.modelSetting = explicit || 'automatic';
  k.steps(['internet', 'reach', 'key', 'model', 'answer']);
  if (!internetStep(k)) return;

  // 2 and 3: the model list shows both that Google answers and that it accepts the key.
  k.set('reach', 'running', 'Asking Google which models this key may use…');
  let listed = 0;
  try {
    const models = await listGeminiModels(key, { signal, trace: k.c.attempts, force: true, timing });
    listed = rankGeminiModels(models).length;
    k.set('reach', 'ok', 'Google answered.');
    k.set('key', 'ok', `Accepted. Google lists ${models.length} models for this key${listed ? `, ${listed} suitable for text` : ''}.`);
  } catch (e) {
    if (isCancel(e, signal)) throw e;
    const err = e as AiHttpError;
    if (!err.httpStatus) {
      k.set('reach', 'fail', err.code === 'timeout' ? 'Google did not answer in time.' : err.code === 'offline' ? 'This computer is offline.' : 'No answer from generativelanguage.googleapis.com.');
      return explainNoAnswer(k, e, signal);
    }
    k.set('reach', 'ok', `Google answered (HTTP ${err.httpStatus}).`);
    if (KEY_CODES.has(err.code) || err.code === 'region' || err.code === 'rate_limited') {
      k.set('key', KEY_CODES.has(err.code) ? 'fail' : 'warn', KEY_CODES.has(err.code) ? 'Google did not accept the key.' : `Google refused the model list (${err.code === 'region' ? 'location not supported' : 'rate limit'}).`);
      return k.fail(e);
    }
    k.set('key', 'warn', `Could not check: the model list was not available (HTTP ${err.httpStatus}). Trying Google's standard model names.`);
  }

  // 4
  k.set('model', 'running');
  const candidates = explicit ? [explicit] : await geminiCandidates(key, { signal, trace: k.c.attempts, prefer: geminiPreference(s.gemini.model), timing });
  k.c.candidates = candidates.slice(0, 8);
  k.set('model', 'ok', explicit ? `${explicit} (typed in the Model box)` : `${candidates[0]} (automatic${listed ? `, best of ${listed} suitable models` : ''})`);

  // 5
  k.set('answer', 'running', 'Asking for a one-word reply…');
  try {
    const reply = await askGemini({ apiKey: key, model: s.gemini.model }, TEST_PROMPT, {
      signal,
      trace: k.c.attempts,
      timeoutMs: CHECK_TIMEOUT_MS,
      timing,
      // A one-word check needs no thinking.
      effort: 'minimal',
      prefer: geminiPreference(s.gemini.model),
      onModel: (m) => (k.c.model = m),
      // A retired model typed in settings: switch to automatic, as real requests do.
      onModelFallback: (_m, reason) => {
        if (reason === 'bad_model') saveAiSettings({ gemini: { ...getAiSettings().gemini, model: DEFAULT_GEMINI_MODEL } });
      },
    });
    k.c.reply = reply.trim();
    k.c.tried = k.triedFromAttempts();
    k.c.ok = true;
    const first = k.c.tried[0];
    if (k.c.model && first && first !== k.c.model) k.set('model', 'ok', `${k.c.model} (${k.c.tried.slice(0, -1).join(', ')} could not be used, so Socius moved on)`);
    else if (k.c.model && k.c.model !== candidates[0]) k.set('model', 'ok', `${k.c.model}`);
    k.set('answer', 'ok', `${k.c.model ?? 'The model'} answered: "${k.c.reply.slice(0, 60)}"`);
  } catch (e) {
    if (isCancel(e, signal)) throw e;
    const err = e as AiHttpError;
    k.c.tried = err.tried ?? k.triedFromAttempts();
    if (KEY_CODES.has(err.code)) k.set('key', 'fail', 'Google did not accept the key for answering.');
    if (['bad_model', 'permission', 'no_free_quota'].includes(err.code) || (k.c.tried?.length ?? 0) > 1) k.set('model', 'fail', `None worked. Tried: ${(k.c.tried ?? []).join(', ') || candidates[0]}.`);
    k.set('answer', 'fail', err.httpStatus ? `Google answered HTTP ${err.httpStatus}${err.apiStatus ? ` ${err.apiStatus}` : ''}.` : err.code === 'timeout' ? 'No answer in time.' : 'No answer.');
    if (!err.httpStatus && ['network', 'offline'].includes(err.code)) return explainNoAnswer(k, e, signal);
    k.fail(e);
  }
}

async function checkOpenAi(k: Check, s: AiSettings, signal?: AbortSignal, timing?: AiTiming) {
  const base = normaliseBaseUrl(s.openai.baseUrl);
  const host = hostOf(base) || 'the service';
  const local = isLocalBase(base);
  const key = sanitizeApiKey(s.openai.apiKey);
  const wanted = s.openai.model.trim();
  k.c.keyInfo = key ? `set (${key.length} characters)` : 'none';
  k.c.modelSetting = wanted;
  k.steps(['internet', 'reach', 'key', 'model', 'answer'], { reach: `Reached ${host}`, model: 'Model available' });
  if (local) k.set('internet', 'skip', 'Not needed: the service runs on this computer.');
  else if (!internetStep(k)) return;

  k.set('reach', 'running', `Asking ${host} for its list of models…`);
  let list: string[] | null = null;
  try {
    list = await listOpenAiModels({ baseUrl: base, apiKey: key }, { signal, trace: k.c.attempts, timeoutMs: local ? 0 : CHECK_TIMEOUT_MS });
    k.set('reach', 'ok', list ? `${host} answered.` : `${host} answered, but offers no model list.`);
    if (!key) k.set('key', local ? 'skip' : 'warn', local ? 'No key needed.' : 'No key entered. Most online services need one.');
    else k.set('key', list ? 'ok' : 'skip', list ? 'Accepted.' : 'Checked by the answer below.');
  } catch (e) {
    if (isCancel(e, signal)) throw e;
    const err = e as AiHttpError;
    if (!err.httpStatus) {
      k.set('reach', 'fail', err.code === 'timeout' ? `${host} did not answer in time.` : `No answer from ${host}.`);
      if (local) return k.fail(e);
      return explainNoAnswer(k, e, signal);
    }
    k.set('reach', 'ok', `${host} answered (HTTP ${err.httpStatus}).`);
    if (KEY_CODES.has(err.code) || err.code === 'payment_required') {
      k.set('key', 'fail', 'The service did not accept the key.');
      return k.fail(e);
    }
    k.set('key', 'skip', `Could not check (HTTP ${err.httpStatus}). Checked by the answer below.`);
  }

  k.set('model', 'running');
  let model = wanted;
  if (list) {
    const match = list.find((id) => id === wanted) ?? list.find((id) => id.toLowerCase() === wanted.toLowerCase() || id === `${wanted}:latest`);
    if (match) {
      model = match;
      k.set('model', 'ok', `"${match}" is offered.`);
    } else {
      k.c.models = suggestOpenAiModels(list);
      k.set('model', 'warn', `"${wanted}" is not in ${host}'s list of ${list.length} models. Trying it anyway.`);
    }
  } else k.set('model', 'skip', 'The service has no model list: checked by the answer below.');

  k.set('answer', 'running', 'Asking for a one-word reply…');
  try {
    const reply = await askOpenAiCompatible({ baseUrl: base, apiKey: key, model }, TEST_PROMPT, { signal, trace: k.c.attempts, timeoutMs: local ? 0 : CHECK_TIMEOUT_MS, timing });
    k.c.reply = reply.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
    k.c.model = model;
    k.c.tried = [model];
    k.c.ok = true;
    if (k.get('model')?.state === 'warn') k.set('model', 'ok', `"${model}" answered, although the service did not list it.`);
    if (k.get('key')?.state === 'skip' && key) k.set('key', 'ok', 'Accepted.');
    k.set('answer', 'ok', `${model} answered: "${k.c.reply.slice(0, 60)}"`);
  } catch (e) {
    if (isCancel(e, signal)) throw e;
    const err = e as AiHttpError;
    k.c.tried = [model];
    if (KEY_CODES.has(err.code) || err.code === 'payment_required') k.set('key', 'fail', 'The service did not accept the key.');
    if (err.code === 'bad_model') {
      if (list && !k.c.models) k.c.models = suggestOpenAiModels(list);
      k.set('model', 'fail', `"${model}" is not available on ${host}.${k.c.models?.length ? ' Choose one of the service\'s models below.' : ''}`);
    }
    k.set('answer', 'fail', err.httpStatus ? `${host} answered HTTP ${err.httpStatus}.` : 'No answer.');
    if (!err.httpStatus && !local && ['network', 'offline'].includes(err.code)) return explainNoAnswer(k, e, signal);
    k.fail(e);
  }
}

async function checkSimple(k: Check, signal?: AbortSignal, timing?: AiTiming) {
  k.steps(['answer']);
  k.set('answer', 'running', 'Asking for a one-word reply…');
  try {
    k.c.reply = await testAiConnection(signal, timing);
    k.c.ok = true;
    k.set('answer', 'ok', `It answered: "${k.c.reply.slice(0, 60)}"`);
  } catch (e) {
    if (isCancel(e, signal)) throw e;
    k.set('answer', 'fail');
    k.fail(e);
  }
}

/** Run the step-by-step check for the provider in settings. Never rejects; `onUpdate` follows each step. */
export async function runConnectionCheck(opts: { signal?: AbortSignal; onUpdate?: (c: ConnectionCheck) => void } = {}): Promise<ConnectionCheck> {
  const s = getAiSettings();
  const provider = effectiveProvider(s);
  const k = new Check(provider, s, opts.onUpdate);
  const timing = startAiTiming('test-connection', provider ?? undefined);
  try {
    if (provider === 'gemini') await checkGemini(k, s, opts.signal, timing);
    else if (provider === 'openai') await checkOpenAi(k, s, opts.signal, timing);
    else if (provider) await checkSimple(k, opts.signal, timing);
    else {
      k.steps(['answer']);
      k.fail({ code: 'not_configured' });
    }
  } catch (e) {
    if (isCancel(e, opts.signal)) {
      k.c.steps = k.c.steps.map((st) => (st.state === 'pending' || st.state === 'running' ? { ...st, state: 'skip' as CheckState, detail: 'Stopped.' } : st));
      k.c.error = { code: 'cancelled', message: aiErrorMessage('cancelled') };
    } else k.fail(e);
  }
  k.c.running = false;
  k.c.finishedAt = new Date().toISOString();
  timing.finish(k.c.ok, k.c.error);
  k.c.timing = timing.lines();
  // A failed check goes into Help > Error log, like any other AI error (keys are removed there too).
  // An expected failure (wrong key, no connection, a limit) is a warning, not an app error (no red dot on Help).
  if (!k.c.ok && k.raw && k.c.error?.code !== 'cancelled') logAiError(k.raw, { op: 'test-connection', provider: provider ?? 'none', model: k.c.model ?? k.c.tried?.[k.c.tried.length - 1] });
  // The AI status (top-bar chip) follows the result of the check.
  if (k.c.error?.code !== 'cancelled') recordAiConnection(k.c.ok, k.c.ok ? null : { code: k.c.error?.code ?? 'unavailable' });
  k.emit();
  return k.snapshot();
}

// ---------- reports ----------

const SECRET_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z_-]{10,}/g,
  /\bAQ\.[0-9A-Za-z._-]{10,}/g,
  /\bya29\.[0-9A-Za-z._-]{10,}/g,
  /\bsk-[A-Za-z0-9_-]{10,}/g,
  /\bgsk_[A-Za-z0-9_-]{10,}/g,
  /\b(?:hf|ghp|github_pat)_[A-Za-z0-9_-]{10,}/g,
];

/** Remove keys from text: known key formats, bearer tokens, key= parameters, and the given literal keys. */
export function redactSecrets(text: string, keys: string[] = []): string {
  let out = String(text ?? '');
  for (const k of keys) {
    const key = String(k ?? '').trim();
    if (key.length >= 6) out = out.split(key).join('[key removed]');
  }
  for (const re of SECRET_PATTERNS) out = out.replace(re, '[key removed]');
  out = out.replace(/\b(Bearer)\s+[A-Za-z0-9._~+/=-]{6,}/gi, '$1 [key removed]');
  out = out.replace(/([?&](?:key|api_key|apikey|access_token)=)[^&\s]+/gi, '$1[removed]');
  out = out.replace(/(x-goog-api-key|authorization)(["']?\s*[:=]\s*["']?)[^\s"',;]{6,}/gi, '$1$2[removed]');
  return out;
}

function allKeys(s: AiSettings = getAiSettings()): string[] {
  return [s.gemini.apiKey, sanitizeApiKey(s.gemini.apiKey), s.openai.apiKey, sanitizeApiKey(s.openai.apiKey)];
}

function pageAddress(): string {
  try {
    return typeof location !== 'undefined' ? `${location.origin}${location.pathname}` : 'unknown';
  } catch {
    return 'unknown';
  }
}

function userAgent(): string {
  try {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  } catch {
    return 'unknown';
  }
}

const yesNo = (v: boolean | null | undefined) => (v === true ? 'yes' : v === false ? 'no' : 'unknown');

function attemptLine(a: AiAttempt): string {
  const who = [a.model, a.api].filter(Boolean).join(', ');
  const result = a.httpStatus ? `${a.httpStatus}${a.apiStatus ? ` ${a.apiStatus}` : ''}${a.reason ? ` (${a.reason})` : ''}` : 'no answer';
  const msg = a.message ? `: ${a.message}` : a.note ? `: ${a.note}` : '';
  return `  ${a.at} ${a.method} ${a.url}${who ? ` [${who}]` : ''} -> ${result} in ${a.ms} ms${msg}`;
}

function header(title: string): string[] {
  return [
    title,
    `App: Socius ${BUILD_INFO.label}`,
    `Page: ${pageAddress()}`,
    `Browser: ${userAgent()}`,
    `Online (browser says): ${yesNo(browserOnline())}`,
  ];
}

function errorLines(e: CheckError | undefined): string[] {
  if (!e) return [];
  const facts = [
    `code ${e.code}`,
    e.httpStatus ? `HTTP ${e.httpStatus}` : '',
    e.apiStatus ? `status ${e.apiStatus}` : '',
    e.reason ? `reason ${e.reason}` : '',
    e.host ? `host ${e.host}` : '',
  ].filter(Boolean);
  return [`Error: ${facts.join(', ')}`, `Message shown: ${e.message}`, ...(e.detail ? [`Service said: ${e.detail}`] : [])];
}

/** Plain-text report of a connection check, for "Copy details". Contains no key. */
export function connectionReport(c: ConnectionCheck, s: AiSettings = getAiSettings()): string {
  const lines = [
    ...header('Socius AI connection report'),
    `Check started: ${c.startedAt}${c.finishedAt ? `, finished: ${c.finishedAt}` : ' (still running)'}`,
    `Provider: ${c.providerLabel}`,
    ...(c.keyInfo ? [`Key: ${c.keyInfo}`] : []),
    ...(c.modelSetting !== undefined ? [`Model setting: ${c.modelSetting || '(empty)'}`] : []),
    ...(c.candidates?.length ? [`Candidates: ${c.candidates.join(', ')}`] : []),
    ...(c.tried?.length ? [`Models tried: ${c.tried.join(', ')}`] : []),
    ...(c.model ? [`Model that answered: ${c.model}`] : []),
    `Result: ${c.running ? 'running' : c.ok ? `connected, reply "${(c.reply ?? '').slice(0, 60)}"` : 'not connected'}`,
    ...errorLines(c.error),
    '',
    'Steps:',
    ...c.steps.map((st) => `  [${st.state}] ${st.label}${st.detail ? `: ${st.detail}` : ''}`),
    '',
    'Requests:',
    ...(c.attempts.length ? c.attempts.map(attemptLine) : ['  (none)']),
    ...(c.timing?.length ? ['', ...c.timing] : []),
  ];
  return redactSecrets(lines.join('\n'), allKeys(s));
}

/** Plain-text report for an AI error shown elsewhere (explanations, the assistant). Contains no key. */
export function aiErrorReport(e: unknown, context = ''): string {
  const s = getAiSettings();
  const err = (e ?? {}) as AiHttpError;
  const p = effectiveProvider(s);
  const trace = Array.isArray(err.trace) ? err.trace : [];
  const lines = [
    ...header('Socius AI error report'),
    `Time: ${new Date().toISOString()}`,
    ...(context ? [`While: ${context}`] : []),
    `Provider: ${providerLabel(p, s)}`,
    ...(p === 'gemini' ? [`Key: ${describeKey(s.gemini.apiKey)}`, `Model setting: ${geminiModelName(s.gemini.model) || 'automatic'}`] : []),
    ...(p === 'openai' ? [`Service: ${normaliseBaseUrl(s.openai.baseUrl)}`, `Model setting: ${s.openai.model}`, `Key: ${sanitizeApiKey(s.openai.apiKey) ? 'set' : 'none'}`] : []),
    ...(err.model ? [`Model: ${err.model}${err.api ? ` (${err.api})` : ''}`] : []),
    ...(err.tried?.length ? [`Models tried: ${err.tried.join(', ')}`] : []),
    ...errorLines(errorOf(err)),
    ...(err.daily !== undefined || err.perMinute !== undefined ? [`Limit: ${err.daily ? 'daily' : err.perMinute ? 'per minute' : 'unknown'}${err.zeroQuota ? ', free limit is 0' : ''}${err.retryAfterMs ? `, retry after ${Math.ceil(err.retryAfterMs / 1000)} s` : ''}`] : []),
    ...(trace.length ? ['', 'Requests:', ...trace.map(attemptLine)] : []),
    ...timingLines(),
  ];
  return redactSecrets(lines.join('\n'), allKeys(s));
}

/** The last few AI actions' timelines (no content), for error reports. */
function timingLines(): string[] {
  const list = recentAiTimings().slice(-3);
  if (!list.length) return [];
  return ['', 'Recent AI timings (newest last):', ...list.flatMap((t) => t.lines().map((l) => `  ${l}`))];
}
