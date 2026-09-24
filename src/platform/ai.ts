// AI provider layer. Every AI request in the app goes through askAI / askAIJson here, on a user click.
//
// Providers:
// - claude  : inside the claude.ai Artifact viewer (the `sample` capability). Only offered there.
// - webllm  : a small model running on this computer (WebGPU). Nothing leaves the computer.
// - gemini  : Google Gemini with the user's own free key from Google AI Studio.
// - openai  : any OpenAI-compatible chat service (Groq, OpenRouter, a local Ollama / LM Studio...).
//
// Settings, including keys, live only in this browser's localStorage (never in project files or
// exports). Components follow changes through subscribeAi / getAiStatus.

import { AiUnavailableError, askClaude, askClaudeJson, claudeGlobal, claudeSampleAvailable } from './claude';
import { askGemini, askOpenAiCompatible, geminiModelName, geminiPreference, lastResolvedGeminiModel, normaliseBaseUrl, sanitizeApiKey } from './ai-http';
import { logError } from './errorlog';
import {
  DEFAULT_WEBLLM_MODEL, WEBLLM_IN_BUILD, WEBLLM_MAX_TOKENS, WEBLLM_PROMPT_BUDGET_BYTES, askWebLlm, detectWebGpu, isWebLlmCached, webLlmChoice, type WebGpuStatus,
} from './ai-webllm';

export { AiUnavailableError as AiError } from './claude';

export type AiProviderId = 'claude' | 'webllm' | 'gemini' | 'openai';
export type OpenAiPreset = 'groq' | 'openrouter' | 'ollama' | 'lmstudio' | 'custom';

export interface AiSettings {
  /** The provider the user chose; null means "not chosen" (Claude is used automatically when present). */
  provider: AiProviderId | null;
  gemini: { apiKey: string; model: string };
  openai: { preset: OpenAiPreset; baseUrl: string; apiKey: string; model: string };
  webllm: { model: string };
}

/**
 * Empty = choose automatically, favouring the newest Flash-Lite model the key can use (more free
 * requests per day); 'auto-flash' = automatic, favouring Flash for single requests. See ai-http.
 */
export const DEFAULT_GEMINI_MODEL = '';
export const GEMINI_AUTO_FLASH = 'auto-flash';
/** Model names that earlier versions saved as defaults; treated as "automatic" so retired names don't stick. */
const OLD_DEFAULT_GEMINI_MODELS = new Set(['gemini-2.5-flash']);
export const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey';
/** Largest prompt sent to Claude or Gemini (the Claude sample capability accepts 64 KB). */
export const DEFAULT_PROMPT_BUDGET_BYTES = 40_000;

export interface OpenAiPresetInfo {
  label: string;
  baseUrl: string;
  model: string;
  keyUrl?: string;
  note: string;
  /** Prompt size that fits the service's free tier or a typical local model. */
  budget: number;
}

export const OPENAI_PRESETS: Record<OpenAiPreset, OpenAiPresetInfo> = {
  groq: {
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    keyUrl: 'https://console.groq.com/keys',
    note: 'Fast, with a free tier. Free accounts have small per-minute limits, so Socius sends smaller batches.',
    budget: 12_000,
  },
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    keyUrl: 'https://openrouter.ai/keys',
    note: 'Many models; those ending in ":free" cost nothing. Free models change often: pick one from their list.',
    budget: 40_000,
  },
  ollama: {
    label: 'Ollama on this computer',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.2',
    note: 'Runs on your own computer. Ollama must allow this website (OLLAMA_ORIGINS) and have the model downloaded: Test connection checks each step and shows how.',
    budget: 10_000,
  },
  lmstudio: {
    label: 'LM Studio on this computer',
    baseUrl: 'http://localhost:1234/v1',
    model: '',
    note: 'Runs on your own computer. In LM Studio\'s Developer tab, start the server and turn on Enable CORS. Test connection lists the loaded models.',
    budget: 10_000,
  },
  custom: {
    label: 'Other service',
    baseUrl: '',
    model: '',
    note: 'Any service with an OpenAI-compatible chat completions address.',
    budget: DEFAULT_PROMPT_BUDGET_BYTES,
  },
};

export const DEFAULT_SETTINGS: AiSettings = {
  provider: null,
  gemini: { apiKey: '', model: DEFAULT_GEMINI_MODEL },
  openai: { preset: 'groq', baseUrl: OPENAI_PRESETS.groq.baseUrl, apiKey: '', model: OPENAI_PRESETS.groq.model },
  webllm: { model: DEFAULT_WEBLLM_MODEL },
};

// ---------- settings persistence (localStorage only) ----------

export const AI_SETTINGS_KEY = 'socius.ai';

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);
const PROVIDERS: AiProviderId[] = ['claude', 'webllm', 'gemini', 'openai'];

export function parseAiSettings(raw: string | null): AiSettings {
  let o: any = null;
  try {
    o = raw ? JSON.parse(raw) : null;
  } catch {
    o = null;
  }
  if (!o || typeof o !== 'object') return structuredClone(DEFAULT_SETTINGS);
  const preset: OpenAiPreset = o.openai?.preset in OPENAI_PRESETS ? o.openai.preset : DEFAULT_SETTINGS.openai.preset;
  return {
    provider: PROVIDERS.includes(o.provider) ? o.provider : null,
    gemini: { apiKey: str(o.gemini?.apiKey, ''), model: OLD_DEFAULT_GEMINI_MODELS.has(str(o.gemini?.model, '').trim()) ? DEFAULT_GEMINI_MODEL : str(o.gemini?.model, DEFAULT_GEMINI_MODEL).trim() },
    openai: {
      preset,
      baseUrl: str(o.openai?.baseUrl, OPENAI_PRESETS[preset].baseUrl),
      apiKey: str(o.openai?.apiKey, ''),
      model: str(o.openai?.model, OPENAI_PRESETS[preset].model),
    },
    webllm: { model: webLlmChoice(str(o.webllm?.model, DEFAULT_WEBLLM_MODEL)).id },
  };
}

let settings: AiSettings = loadAiSettings();

export function loadAiSettings(): AiSettings {
  let raw: string | null = null;
  try {
    raw = storage()?.getItem(AI_SETTINGS_KEY) ?? null;
  } catch {
    raw = null;
  }
  return parseAiSettings(raw);
}

export function getAiSettings(): AiSettings {
  return settings;
}

const settingsListeners = new Set<() => void>();

/** Notified synchronously whenever settings change (controlled inputs need that). */
export function subscribeAiSettings(fn: () => void): () => void {
  settingsListeners.add(fn);
  return () => settingsListeners.delete(fn);
}

function notifySettings() {
  for (const l of [...settingsListeners]) l();
}

/** Save settings (merged into the current ones) and notify listeners. */
export function saveAiSettings(patch: Partial<AiSettings>): AiSettings {
  settings = {
    ...settings,
    ...patch,
    gemini: { ...settings.gemini, ...(patch.gemini ?? {}) },
    openai: { ...settings.openai, ...(patch.openai ?? {}) },
    webllm: { ...settings.webllm, ...(patch.webllm ?? {}) },
  };
  try {
    storage()?.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable: settings last for this visit only */
  }
  notifySettings();
  void refreshAiStatus();
  return settings;
}

/** Remove a stored key from this browser. */
export function forgetAiKey(which: 'gemini' | 'openai'): AiSettings {
  return saveAiSettings(which === 'gemini' ? { gemini: { ...settings.gemini, apiKey: '' } } : { openai: { ...settings.openai, apiKey: '' } });
}

/** Test hook: re-read settings from storage and reset the status. */
export function __reloadAiSettings(): void {
  settings = loadAiSettings();
  status = initialStatus();
}

// ---------- which provider ----------

export function claudePresent(): boolean {
  return !!claudeGlobal();
}

/** The provider that askAI will use, or null when none is set up. */
export function effectiveProvider(s: AiSettings = settings): AiProviderId | null {
  if (s.provider && (s.provider !== 'claude' || claudePresent())) {
    if (s.provider === 'webllm' && !WEBLLM_IN_BUILD) return claudePresent() ? 'claude' : null;
    return s.provider;
  }
  return claudePresent() ? 'claude' : null;
}

function isLocalUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:|\/|$)/i.test(url.trim());
}

/** Short name of a provider for "will be sent to ..." lines. */
export function providerLabel(p: AiProviderId | null, s: AiSettings = settings): string {
  switch (p) {
    case 'claude':
      return 'Claude';
    case 'webllm':
      return `the on-device model (${webLlmChoice(s.webllm.model).label.toLowerCase()})`;
    case 'gemini': {
      const pref = geminiPreference(s.gemini.model);
      return `Google Gemini (${geminiModelName(s.gemini.model) || lastResolvedGeminiModel(s.gemini.apiKey, pref) || (pref === 'flash' ? 'automatic, Flash' : 'automatic, Flash-Lite')})`;
    }
    case 'openai': {
      const preset = s.openai.preset !== 'custom' ? OPENAI_PRESETS[s.openai.preset].label : isLocalUrl(s.openai.baseUrl) ? 'a service on this computer' : hostOf(s.openai.baseUrl) || 'an OpenAI-compatible service';
      return s.openai.model ? `${preset} (${s.openai.model})` : preset;
    }
    default:
      return 'no AI service';
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

/** Does data leave this computer with the current provider, and to whom? */
export type AiPrivacy = 'local' | 'claude' | 'google' | 'third-party' | 'none';

export function providerPrivacy(p: AiProviderId | null, s: AiSettings = settings): AiPrivacy {
  if (p === 'webllm') return 'local';
  if (p === 'claude') return 'claude';
  if (p === 'gemini') return 'google';
  if (p === 'openai') return isLocalUrl(s.openai.baseUrl) ? 'local' : 'third-party';
  return 'none';
}

/** How many bytes of prompt the current provider takes comfortably. */
export function aiPromptBudget(s: AiSettings = settings): number {
  const p = effectiveProvider(s);
  if (p === 'webllm') return WEBLLM_PROMPT_BUDGET_BYTES;
  if (p === 'openai') {
    if (s.openai.preset !== 'custom') return OPENAI_PRESETS[s.openai.preset].budget;
    return isLocalUrl(s.openai.baseUrl) ? 10_000 : DEFAULT_PROMPT_BUDGET_BYTES;
  }
  return DEFAULT_PROMPT_BUDGET_BYTES;
}

/** Is the chosen provider set up enough to try? (Makes no request to an AI service.) */
async function providerReady(p: AiProviderId | null, s: AiSettings): Promise<boolean> {
  switch (p) {
    case 'claude':
      return claudeSampleAvailable();
    case 'gemini':
      return !!sanitizeApiKey(s.gemini.apiKey);
    case 'openai':
      return !!normaliseBaseUrl(s.openai.baseUrl) && !!s.openai.model.trim();
    case 'webllm':
      return (await detectWebGpu()).ok;
    default:
      return false;
  }
}

/** True when a provider is configured and usable here (no request is sent to any AI service). */
export async function aiAvailable(): Promise<boolean> {
  return providerReady(effectiveProvider(), settings);
}

// ---------- status subscription ----------

export interface AiStatus {
  provider: AiProviderId | null;
  /** 'unknown' while checking. */
  ready: 'unknown' | 'yes' | 'no';
  label: string;
  privacy: AiPrivacy;
  /** On-device only: WebGPU check and whether the model is already downloaded. */
  webgpu?: WebGpuStatus;
  modelCached?: boolean;
}

function initialStatus(): AiStatus {
  const p = effectiveProvider();
  return { provider: p, ready: p ? 'unknown' : 'no', label: providerLabel(p), privacy: providerPrivacy(p) };
}

let status: AiStatus = initialStatus();
const listeners = new Set<() => void>();
let refreshSeq = 0;

export function getAiStatus(): AiStatus {
  return status;
}

export function subscribeAi(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setStatus(next: AiStatus) {
  status = next;
  for (const l of [...listeners]) l();
}

/** Re-check the provider (after settings change, or once at start). Resolves to the new status. */
export async function refreshAiStatus(): Promise<AiStatus> {
  const seq = ++refreshSeq;
  const s = settings;
  const p = effectiveProvider(s);
  const base = { provider: p, label: providerLabel(p, s), privacy: providerPrivacy(p, s) };
  if (status.provider !== p || status.label !== base.label) setStatus({ ...base, ready: p ? 'unknown' : 'no' });
  const ok = await providerReady(p, s);
  const extra: Partial<AiStatus> = {};
  if (p === 'webllm') {
    extra.webgpu = await detectWebGpu();
    extra.modelCached = extra.webgpu.ok ? await isWebLlmCached(s.webllm.model) : false;
  }
  if (seq === refreshSeq) setStatus({ ...base, ...extra, ready: ok ? 'yes' : 'no' });
  return status;
}

let started = false;
/** Start the first status check (idempotent). Also follows settings changed in another tab. */
export function startAiStatus(): void {
  if (started) return;
  started = true;
  void refreshAiStatus();
  try {
    window.addEventListener('storage', (e) => {
      if (e.key === AI_SETTINGS_KEY) {
        settings = loadAiSettings();
        notifySettings();
        void refreshAiStatus();
      }
    });
  } catch {
    /* no window (tests) */
  }
}

// ---------- asking ----------

export interface AiAskOptions {
  /** Called with the whole text so far, as it streams in. */
  onText?: (text: string) => void;
  signal?: AbortSignal;
  /** Ask for a JSON reply (JSON mode where the provider has one). */
  json?: boolean;
  /** Claude only: model size. */
  modelTier?: 'quick' | 'default' | 'complex';
  maxTokens?: number;
}

/** Remove "thinking" blocks some models emit (<think>...</think>), including an unfinished one while streaming. */
export function stripThinking(text: string): string {
  let t = text.replace(/<think>[\s\S]*?<\/think>\s*/g, '');
  const open = t.indexOf('<think>');
  if (open >= 0) t = t.slice(0, open);
  return t;
}

function wrapError(e: any, signal?: AbortSignal): AiUnavailableError {
  if (signal?.aborted) return new AiUnavailableError('cancelled', 'Stopped.');
  if (e instanceof AiUnavailableError) return e;
  return new AiUnavailableError('unavailable', 'The AI service could not answer.', e?.message);
}

/** Ask the current provider for text. Rejects AiError with a stable `code` (see aiErrorMessage). */
export async function askAI(prompt: string, opts: AiAskOptions = {}): Promise<string> {
  const s = settings;
  const p = effectiveProvider(s);
  const onText = opts.onText ? (t: string) => opts.onText!(stripThinking(t)) : undefined;
  try {
    switch (p) {
      case 'claude':
        return await askClaude(prompt, { onText: opts.onText, signal: opts.signal, modelTier: opts.modelTier });
      case 'gemini':
        return await askGemini({ apiKey: s.gemini.apiKey, model: s.gemini.model }, prompt, {
          onText,
          signal: opts.signal,
          json: opts.json,
          maxTokens: opts.maxTokens,
          // JSON requests are batches (coding suggestions): keep to Flash-Lite's larger free allowance.
          prefer: opts.json ? 'lite' : geminiPreference(s.gemini.model),
          // The saved model was retired or mistyped and another answered: switch the setting to automatic.
          // (Not for a busy or rate-limited model: that one may work again later.)
          onModelFallback: (_model, reason) => {
            if (reason === 'bad_model') saveAiSettings({ gemini: { ...settings.gemini, model: DEFAULT_GEMINI_MODEL } });
          },
        });
      case 'openai':
        try {
          return stripThinking(await askOpenAiCompatible({ baseUrl: s.openai.baseUrl, apiKey: s.openai.apiKey, model: s.openai.model }, prompt, { onText, signal: opts.signal, json: opts.json, maxTokens: opts.maxTokens }));
        } catch (e) {
          // A program on this computer: point to the guided check instead of "check your internet".
          if (e instanceof AiUnavailableError && e.code === 'network' && isLocalUrl(s.openai.baseUrl) && !opts.signal?.aborted) throw new AiUnavailableError('local_unreachable', e.message, e.detail);
          throw e;
        }
      case 'webllm':
        return stripThinking(await askWebLlm(s.webllm.model, prompt, { onText, signal: opts.signal, json: opts.json, maxTokens: opts.maxTokens ?? WEBLLM_MAX_TOKENS }));
      default:
        throw new AiUnavailableError('not_configured', 'AI help is not set up.');
    }
  } catch (e) {
    throw logError('ai', wrapError(e, opts.signal), { op: 'ask' });
  }
}

/**
 * Parse JSON from a model reply, tolerantly: the whole reply, else a fenced ```json block, else the
 * span from the first { or [ to the last } or ]. Throws AiError('invalid_json') when nothing parses.
 */
export function extractJson(text: string): unknown {
  const t = stripThinking(text).trim();
  const tryParse = (s: string): { ok: true; v: unknown } | { ok: false } => {
    try {
      return { ok: true, v: JSON.parse(s) };
    } catch {
      return { ok: false };
    }
  };
  if (t) {
    const whole = tryParse(t);
    if (whole.ok) return whole.v;
    for (const m of t.matchAll(/```[a-zA-Z]*\s*\n?([\s\S]*?)```/g)) {
      const r = tryParse(m[1].trim());
      if (r.ok) return r.v;
    }
    const spans: Array<[number, number]> = [];
    const o = t.indexOf('{');
    const a = t.indexOf('[');
    if (o >= 0) spans.push([o, t.lastIndexOf('}')]);
    if (a >= 0) spans.push([a, t.lastIndexOf(']')]);
    spans.sort((x, y) => x[0] - y[0]);
    for (const [start, end] of spans) {
      if (end <= start) continue;
      const r = tryParse(t.slice(start, end + 1));
      if (r.ok) return r.v;
    }
  }
  throw new AiUnavailableError('invalid_json', 'The reply was not valid JSON.');
}

/** Ask for JSON. Describe the exact shape in the prompt; validate the fields you use. */
export async function askAIJson<T = unknown>(prompt: string, opts: AiAskOptions = {}): Promise<T> {
  if (effectiveProvider() === 'claude') {
    try {
      return await askClaudeJson<T>(prompt, { signal: opts.signal, modelTier: opts.modelTier });
    } catch (e) {
      throw logError('ai', wrapError(e, opts.signal), { op: 'ask-json' });
    }
  }
  const text = await askAI(prompt, { ...opts, json: true });
  if (opts.signal?.aborted) throw new AiUnavailableError('cancelled', 'Stopped.');
  return extractJson(text) as T;
}

/** Send a tiny prompt to check the setup. Resolves to the reply; rejects AiError. */
export async function testAiConnection(signal?: AbortSignal): Promise<string> {
  const reply = await askAI('Reply with the single word OK.', { signal, modelTier: 'quick', maxTokens: effectiveProvider() === 'webllm' ? 16 : undefined });
  return reply.trim();
}

// ---------- messages ----------

const SETTINGS_HINT = 'AI > AI assistant settings';

/** Plain-language message for an AI error code. */
export function aiErrorMessage(code: string): string {
  switch (code) {
    case 'not_configured':
      return `AI help is not set up yet. Choose a free option in ${SETTINGS_HINT}.`;
    case 'not_granted':
      return 'AI assistance was not allowed for this page. You can keep coding manually.';
    case 'invalid_key':
      return `The AI service did not accept the key. Copy the whole key again into ${SETTINGS_HINT}, or create a new one.`;
    case 'rate_limited':
      return 'Too many AI requests at once, or the free allowance is used up for now. Wait a minute, then try again.';
    case 'network':
      return 'Could not reach the AI service, although this computer seems to be online. Something may be blocking it: an ad or privacy blocker, antivirus web protection, a company or university firewall, or a VPN. Turn these off for this site or try another network. For a service on your own computer, check that it is running and accepts requests from this page.';
    case 'offline':
      return 'This computer is offline. Connect to the internet, then try again.';
    case 'timeout':
      return 'The AI service did not answer in time. It may be busy, or the connection is slow. Try again in a minute.';
    case 'overloaded':
      return 'The AI service is overloaded right now (too many users). Socius already tried again once. Wait a minute and try again.';
    case 'region':
      return 'Google does not offer the free Gemini API where your internet connection appears to be (it said "User location is not supported"). If you use a VPN or proxy, turn it off or choose a server in your own country, then test again. Otherwise choose the on-device option or another service.';
    case 'api_disabled':
      return 'This key belongs to a Google Cloud project where the Gemini API (the Generative Language API) is turned off. Easiest fix: create a new key in Google AI Studio (aistudio.google.com/apikey) rather than the Cloud Console. Or turn on the Generative Language API for that project, wait a few minutes, and test again.';
    case 'referrer_blocked':
      return `This key has website restrictions that do not include Socius. In Google Cloud Console, open APIs & Services > Credentials, click the key, and under Website restrictions add ${siteRestriction()} (or set Application restrictions to None). Or create a new key in Google AI Studio.`;
    case 'key_restricted':
      return 'This key is restricted so that it cannot use the Gemini API from this browser (API or IP address restrictions). In Google Cloud Console > APIs & Services > Credentials, allow the Generative Language API for the key, or create a new key in Google AI Studio.';
    case 'key_suspended':
      return 'Google has suspended this key or its project. Create a new key in Google AI Studio, or check the project in Google Cloud Console.';
    case 'key_not_accepted':
      return 'Google did not accept this key. Check that you copied the whole key (use the copy button in AI Studio). If the key is new, wait a few minutes and test again; otherwise create a new key in Google AI Studio. Some new Google accounts have a known problem with keys that start with "AQ.": if it persists, try a key from a different Google Cloud project.';
    case 'bad_key_format':
      return `The key contains characters that cannot be sent (for example curly quotes or hidden characters copied from a document). Paste it again into ${SETTINGS_HINT}, copied straight from Google AI Studio.`;
    case 'permission':
      return `The service did not let this key use the model. Set Model to Automatic in ${SETTINGS_HINT} so Socius picks a model your key may use, or create a new key.`;
    case 'no_free_quota':
      return `Your key has no free allowance for the Gemini models Socius tried (Google set their free limit to 0, which happens for Pro and preview models and in some countries). Set Model to Automatic in ${SETTINGS_HINT} so Socius can pick a free model, or turn on billing for the key in Google AI Studio.`;
    case 'payment_required':
      return 'The service says the account has no credit for this model. Choose a free model (on OpenRouter, one whose name ends in ":free") or add credit with the service.';
    case 'max_tokens':
      return 'The AI used up its answer length (probably on thinking) before writing any text. Try again, or with fewer items at once.';
    case 'empty_reply':
      return `The AI sent an empty answer. Try again. If it keeps happening, set Model to Automatic in ${SETTINGS_HINT} so Socius picks another model.`;
    case 'recitation':
      return 'The AI stopped because its answer repeated published text too closely (a copyright filter). Try again, or rephrase the request.';
    case 'malformed_call':
      return 'The AI sent an instruction Socius could not read. Try again.';
    case 'endpoint_missing':
    case 'field_unsupported':
    case 'thinking_unsupported':
      return `Google's AI service did not accept the request format. Socius may need an update: in ${SETTINGS_HINT}, click Test connection, then Copy details, and send the report with Help > Send feedback.`;
    case 'cancelled':
      return 'Stopped.';
    case 'invalid_json':
      return 'The AI replied in an unexpected format. Try again, or with fewer items.';
    case 'webgpu_unavailable':
      return `This browser cannot run the on-device model: it needs WebGPU and a usable graphics chip (a recent Chrome or Edge on a desktop or laptop). ${SETTINGS_HINT} explains what is missing on this computer, or choose Google Gemini there.`;
    case 'model_download_failed':
      return 'Could not download the model: check your connection, or a firewall/extension may block huggingface.co (the model files) or raw.githubusercontent.com (the model program). Then try again: finished parts are kept.';
    case 'model_storage_full':
      return 'Not enough free disk space for the browser to keep the model. Free some space (or choose the Small and fast model), then try again.';
    case 'webgpu_out_of_memory':
      return 'The graphics chip ran out of memory while loading the model. Choose the Small and fast model, close other tabs and programs, then try again.';
    case 'webgpu_f16':
      return 'The graphics chip could not run this version of the model. Try again: Socius switches to a compatible version.';
    case 'local_forbidden':
      return `The AI program on this computer refused requests from this website. Allow the website in it (for Ollama, add this site's address to OLLAMA_ORIGINS; in LM Studio, turn on Enable CORS), then open ${SETTINGS_HINT} and click Test connection.`;
    case 'local_unreachable':
      return `Could not reach the AI program on this computer (such as Ollama or LM Studio). Open ${SETTINGS_HINT} and click Test connection: it checks each step and shows how to fix it.`;
    case 'too_large':
      return 'The request was too long for this AI model. Try fewer items, or a model that accepts more text.';
    case 'bad_model':
      return `The AI service did not recognise the model name or address. Check them in ${SETTINGS_HINT}.`;
    case 'bad_request':
      return `The AI service could not process the request. Check the model name in ${SETTINGS_HINT}.`;
    case 'blocked':
      return 'The AI service declined to answer because of its content filter. Try other excerpts or another provider.';
    default:
      return `The AI service is not available right now. Try again later, or choose another option in ${SETTINGS_HINT}.`;
  }
}

/** The pattern to add to a Google key's website restrictions for this site. */
function siteRestriction(): string {
  try {
    if (typeof location !== 'undefined' && /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)) return `${location.origin}/*`;
  } catch {
    /* no location */
  }
  return 'https://hackhead95.github.io/*';
}

/** Message for a caught error, with the service's own words when they help. */
export function aiErrorText(e: unknown): string {
  const err = e as { code?: string; detail?: string; daily?: boolean; perMinute?: boolean; retryAfterMs?: number; tried?: string[]; host?: string; keyKind?: string; api?: string } | null;
  const code = err?.code ?? 'unavailable';
  let base = aiErrorMessage(code);
  const detail = err?.detail?.trim();
  // Google's daily limits reset at midnight Pacific time; say so only for Gemini.
  const google = !!err?.keyKind || !!err?.api || /googleapis\.com$/.test(err?.host ?? '') || (!err?.host && effectiveProvider() === 'gemini');
  if (code === 'rate_limited' && err?.daily)
    base = google
      ? `The free daily allowance for this key is used up. It starts again at midnight Pacific time (morning in Europe, early afternoon in India). Try again then, or choose another option in ${SETTINGS_HINT}.`
      : `The service's free daily allowance is used up. Try again tomorrow, or choose another model or option in ${SETTINGS_HINT}.`;
  else if (code === 'rate_limited' && err?.perMinute) base = 'The free per-minute limit was reached. Wait a minute, then try again.';
  if (code === 'rate_limited' && !err?.daily && err?.retryAfterMs) base += ` The service asked to wait ${Math.ceil(err.retryAfterMs / 1000)} seconds.`;
  if (code === 'network' && err?.host) base += ` (Address: ${err.host}.)`;
  if (err?.keyKind === 'aiza' && ['invalid_key', 'key_not_accepted', 'permission', 'key_restricted', 'api_disabled'].includes(code))
    base += ' Note: Google is retiring older keys that start with "AIza" during September 2026. A new key from Google AI Studio (it starts with "AQ.") usually fixes this.';
  if (err?.tried && err.tried.length > 1 && ['bad_model', 'permission', 'no_free_quota', 'rate_limited', 'overloaded', 'unavailable'].includes(code)) base += ` Models tried: ${err.tried.join(', ')}.`;
  if (detail && ['model_download_failed', 'model_storage_full', 'webgpu_out_of_memory'].includes(code)) return `${base} (Details: ${detail})`;
  if (detail && ['bad_request', 'bad_model', 'unavailable', 'too_large', 'permission', 'blocked', 'endpoint_missing', 'field_unsupported', 'thinking_unsupported'].includes(code)) return `${base} The service said: ${detail}`;
  return base;
}
