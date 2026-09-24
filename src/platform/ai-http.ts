// AI over HTTP: Google Gemini (native generateContent API) and any OpenAI-compatible chat
// completions service (Groq, OpenRouter, a local Ollama or LM Studio, ...). Browser fetch only; the
// user's own key goes straight from this page to the service, never anywhere else.

import { AiUnavailableError } from './claude';

export interface HttpAskOptions {
  onText?: (text: string) => void;
  signal?: AbortSignal;
  json?: boolean;
  maxTokens?: number;
}

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

// ---------- request building ----------

export interface BuiltRequest {
  url: string;
  init: { method: 'POST'; headers: Record<string, string>; body: string };
}

export function geminiModelName(model: string): string {
  return model.trim().replace(/^models\//, '') || 'gemini-2.5-flash';
}

export function buildGeminiRequest(cfg: GeminiConfig, prompt: string, opts: { stream: boolean; json?: boolean; maxTokens?: number }): BuiltRequest {
  const model = encodeURIComponent(geminiModelName(cfg.model));
  const url = `${GEMINI_BASE}/models/${model}:${opts.stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`;
  const generationConfig: Record<string, unknown> = { temperature: 0.4 };
  if (opts.json) generationConfig.responseMimeType = 'application/json';
  if (opts.maxTokens) generationConfig.maxOutputTokens = opts.maxTokens;
  return {
    url,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey.trim() },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig }),
    },
  };
}

/** Base URL without a trailing slash or a pasted "/chat/completions". */
export function normaliseBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
}

export function buildOpenAiRequest(cfg: OpenAiConfig, prompt: string, opts: { stream: boolean; json?: boolean; maxTokens?: number }): BuiltRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.apiKey.trim()) headers.Authorization = `Bearer ${cfg.apiKey.trim()}`;
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

// ---------- response parsing ----------

/** Text of a Gemini generateContent response (or one streamed chunk). Thought parts are skipped. */
export function geminiText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.filter((p: any) => typeof p?.text === 'string' && !p.thought).map((p: any) => p.text).join('');
}

/** Gemini returns 200 with no text when a request is blocked by its safety filter. */
export function geminiBlocked(data: any): boolean {
  if (data?.promptFeedback?.blockReason) return true;
  const fr = data?.candidates?.[0]?.finishReason;
  return fr === 'SAFETY' || fr === 'PROHIBITED_CONTENT' || fr === 'BLOCKLIST' || fr === 'SPII';
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

// ---------- errors ----------

/** Map an HTTP error status (and the service's message) to a stable AI error code. */
export function httpErrorCode(status: number, message: string): string {
  const m = message.toLowerCase();
  if (status === 401 || status === 403) return 'invalid_key';
  if (status === 400 && /api[ _-]?key|api_key_invalid|unauthori[sz]ed|authentication/.test(m)) return 'invalid_key';
  if (status === 429) return 'rate_limited';
  if (status === 413 || (status === 400 && /context length|context window|too long|too large|maximum context|token limit/.test(m))) return 'too_large';
  if (status === 404) return 'bad_model';
  if (status === 400) return 'bad_request';
  return 'unavailable';
}

async function errorFromResponse(res: Response): Promise<AiUnavailableError> {
  let message = '';
  try {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      const e = Array.isArray(j) ? j[0]?.error : j?.error;
      message = (typeof e === 'string' ? e : e?.message) ?? j?.message ?? text;
      const reason = Array.isArray(e?.details) ? e.details.map((d: any) => d?.reason).filter(Boolean).join(' ') : '';
      if (reason) message = `${message} (${reason})`;
    } catch {
      message = text;
    }
  } catch {
    /* no body */
  }
  const code = httpErrorCode(res.status, String(message));
  return new AiUnavailableError(code, `The AI service answered ${res.status}.`, String(message).slice(0, 300) || undefined);
}

function isAbort(e: any, signal?: AbortSignal): boolean {
  return !!signal?.aborted || e?.name === 'AbortError';
}

async function send(req: BuiltRequest, signal?: AbortSignal): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(req.url, { ...req.init, signal });
  } catch (e: any) {
    if (isAbort(e, signal)) throw new AiUnavailableError('cancelled', 'Stopped.');
    throw new AiUnavailableError('network', 'Could not reach the AI service.', e?.message);
  }
  if (!res.ok) throw await errorFromResponse(res);
  return res;
}

async function streamText(res: Response, pick: (data: any) => string, opts: HttpAskOptions, check?: (data: any) => void): Promise<string> {
  if (!res.body) return '';
  let text = '';
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
        if (data?.error) throw new AiUnavailableError(httpErrorCode(Number(data.error.code) || 500, String(data.error.message ?? '')), 'The AI service reported an error.', String(data.error.message ?? ''));
        check?.(data);
        const piece = pick(data);
        if (piece) {
          text += piece;
          opts.onText?.(text);
        }
      },
      opts.signal,
    );
  } catch (e: any) {
    if (e instanceof AiUnavailableError) throw e;
    if (isAbort(e, opts.signal)) throw new AiUnavailableError('cancelled', 'Stopped.');
    throw new AiUnavailableError('network', 'The connection to the AI service was interrupted.', e?.message);
  }
  return text;
}

// ---------- providers ----------

export async function askGemini(cfg: GeminiConfig, prompt: string, opts: HttpAskOptions = {}): Promise<string> {
  if (!cfg.apiKey.trim()) throw new AiUnavailableError('not_configured', 'No Gemini key.');
  const stream = !!opts.onText;
  const res = await send(buildGeminiRequest(cfg, prompt, { stream, json: opts.json, maxTokens: opts.maxTokens }), opts.signal);
  let blocked = false;
  let text: string;
  if (stream) {
    text = await streamText(res, geminiText, opts, (d) => {
      if (geminiBlocked(d)) blocked = true;
    });
  } else {
    let data: any;
    try {
      data = await res.json();
    } catch (e: any) {
      if (isAbort(e, opts.signal)) throw new AiUnavailableError('cancelled', 'Stopped.');
      throw new AiUnavailableError('unavailable', 'The AI service sent an unreadable reply.');
    }
    blocked = geminiBlocked(data);
    text = geminiText(data);
  }
  if (!text && blocked) throw new AiUnavailableError('blocked', 'The request was blocked by the service.');
  return text;
}

export async function askOpenAiCompatible(cfg: OpenAiConfig, prompt: string, opts: HttpAskOptions = {}): Promise<string> {
  if (!cfg.baseUrl.trim() || !cfg.model.trim()) throw new AiUnavailableError('not_configured', 'The service is not set up.');
  const stream = !!opts.onText;
  const res = await send(buildOpenAiRequest(cfg, prompt, { stream, json: opts.json, maxTokens: opts.maxTokens }), opts.signal);
  if (stream) return streamText(res, openAiDelta, opts);
  try {
    return openAiText(await res.json());
  } catch (e: any) {
    if (isAbort(e, opts.signal)) throw new AiUnavailableError('cancelled', 'Stopped.');
    throw new AiUnavailableError('unavailable', 'The AI service sent an unreadable reply.');
  }
}
