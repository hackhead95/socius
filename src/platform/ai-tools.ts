// Tool calling ("function calling") for the Socius assistant, next to the plain-text adapters.
//
// - Google Gemini: native `functionDeclarations`; several functionCall parts per turn; results go back
//   as functionResponse parts. The model's own parts (including Gemini 3 "thought signatures") are
//   replayed exactly as received, which Gemini requires for multi-step tool use.
// - OpenAI-compatible services: `tools` / `tool_calls` / role "tool" messages, streamed or not.
// - Claude inside the claude.ai viewer: the `sample` capability runs the tool rounds itself; we pass
//   page functions in `tools`.
// The on-device model is weak at tool calling, so the assistant talks to it with a strict JSON action
// protocol instead (src/lib/assistant/json-protocol.ts); nothing here is needed for it.
//
// Everything is provider-neutral at the edges: ChatMessage in, ModelTurn out.

import { AiUnavailableError, useCapability } from './claude';
import { GEMINI_BASE, geminiBlocked, geminiModelName, httpErrorCode, normaliseBaseUrl, readSse, resolveGeminiModel, type GeminiConfig, type OpenAiConfig } from './ai-http';

// ---------- neutral types ----------

/** The small JSON Schema subset every provider accepts. */
export interface JsonSchema {
  type: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array';
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: string[];
}

export interface ToolSpec {
  name: string;
  description: string;
  /** Always an object schema; may have no properties (a tool without arguments). */
  parameters: JsonSchema;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  /** Set when the model sent arguments that were not valid JSON. */
  argsError?: string;
}

export interface ToolResultMsg {
  callId: string;
  name: string;
  content: string;
}

export type ChatMessage =
  | { role: 'user'; text: string }
  /** `raw` is the provider's own form of the turn (Gemini parts), replayed verbatim when present. */
  | { role: 'assistant'; text: string; toolCalls?: ToolCall[]; raw?: { provider: string; parts: unknown[] } }
  | { role: 'tool'; results: ToolResultMsg[] };

export interface ModelTurn {
  text: string;
  toolCalls: ToolCall[];
  raw?: { provider: string; parts: unknown[] };
  finishReason?: string;
}

export interface ToolTurnOptions {
  system: string;
  messages: ChatMessage[];
  tools: ToolSpec[];
  /** 'none' asks for a plain answer (tools stay declared so the history stays valid). */
  toolChoice?: 'auto' | 'none';
  signal?: AbortSignal;
  /** Text of this turn so far, as it streams. */
  onText?: (text: string) => void;
  maxTokens?: number;
  temperature?: number;
}

export interface BuiltToolRequest {
  url: string;
  init: { method: 'POST'; headers: Record<string, string>; body: string };
}

/** Extra fields on a rate-limit error: how long the service asked us to wait, and whether a daily quota ran out. */
export interface RateLimitInfo {
  retryAfterMs?: number;
  daily?: boolean;
}

export type ToolAiError = AiUnavailableError & RateLimitInfo;

// ---------- helpers ----------

function isAbort(e: any, signal?: AbortSignal): boolean {
  return !!signal?.aborted || e?.name === 'AbortError';
}

const cancelled = () => new AiUnavailableError('cancelled', 'Stopped.');

/** "21s", "1.5s", "300ms" -> milliseconds. */
export function parseDelay(s: string): number | undefined {
  const m = /^\s*([\d.]+)\s*(ms|s)?\s*$/i.exec(s);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return undefined;
  return Math.round((m[2]?.toLowerCase() === 'ms' ? n : n * 1000));
}

/** Error for a failed HTTP response, with the rate-limit details Gemini and OpenAI-style services send. */
export async function toolErrorFromResponse(res: Response): Promise<ToolAiError> {
  let message = '';
  let retryAfterMs: number | undefined;
  let daily = false;
  let text = '';
  try {
    text = await res.text();
  } catch {
    /* no body */
  }
  try {
    const j = JSON.parse(text);
    const e = Array.isArray(j) ? j[0]?.error : j?.error;
    message = (typeof e === 'string' ? e : e?.message) ?? j?.message ?? text;
    const details: any[] = Array.isArray(e?.details) ? e.details : [];
    const reason = details.map((d) => d?.reason).filter(Boolean).join(' ');
    if (reason) message = `${message} (${reason})`;
    for (const d of details) {
      if (typeof d?.retryDelay === 'string') retryAfterMs = parseDelay(d.retryDelay) ?? retryAfterMs;
      for (const v of Array.isArray(d?.violations) ? d.violations : []) if (/per ?day/i.test(`${v?.quotaId ?? ''} ${v?.quotaMetric ?? ''}`)) daily = true;
    }
    if (typeof e?.failed_generation === 'string') message = `${message} (tool_use_failed)`;
  } catch {
    message = text;
  }
  const header = res.headers?.get?.('retry-after');
  if (header && retryAfterMs === undefined) retryAfterMs = parseDelay(header);
  if (retryAfterMs === undefined) {
    const m = /(?:try again|retry) in ([\d.]+\s*(?:ms|s))/i.exec(message);
    if (m) retryAfterMs = parseDelay(m[1].replace(/\s+/g, ''));
  }
  if (/per ?day|daily/i.test(message)) daily = true;
  const code = httpErrorCode(res.status, String(message));
  const err = new AiUnavailableError(code, `The AI service answered ${res.status}.`, String(message).slice(0, 300) || undefined) as ToolAiError;
  if (code === 'rate_limited') {
    err.retryAfterMs = retryAfterMs;
    err.daily = daily;
  }
  return err;
}

async function sendRequest(req: BuiltToolRequest, signal?: AbortSignal): Promise<Response> {
  if (signal?.aborted) throw cancelled();
  let res: Response;
  try {
    res = await fetch(req.url, { ...req.init, signal });
  } catch (e: any) {
    if (isAbort(e, signal)) throw cancelled();
    throw new AiUnavailableError('network', 'Could not reach the AI service.', e?.message);
  }
  if (!res.ok) throw await toolErrorFromResponse(res);
  return res;
}

async function readJson(res: Response, signal?: AbortSignal): Promise<any> {
  try {
    return await res.json();
  } catch (e: any) {
    if (isAbort(e, signal)) throw cancelled();
    throw new AiUnavailableError('unavailable', 'The AI service sent an unreadable reply.');
  }
}

/** Read an SSE body, handing each parsed JSON payload to `onData`. */
async function readJsonEvents(res: Response, onData: (data: any) => void, signal?: AbortSignal): Promise<void> {
  if (!res.body) return;
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
        if (data?.error) {
          const msg = String(data.error.message ?? '');
          throw new AiUnavailableError(httpErrorCode(Number(data.error.code) || 500, msg), 'The AI service reported an error.', msg);
        }
        onData(data);
      },
      signal,
    );
  } catch (e: any) {
    if (e instanceof AiUnavailableError) throw e;
    if (isAbort(e, signal)) throw cancelled();
    throw new AiUnavailableError('network', 'The connection to the AI service was interrupted.', e?.message);
  }
}

function parseArgs(raw: unknown): { args: Record<string, unknown>; error?: string } {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return { args: raw as Record<string, unknown> };
  if (typeof raw !== 'string' || !raw.trim()) return { args: {} };
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object' && !Array.isArray(v)) return { args: v };
    return { args: {}, error: 'The arguments were not a JSON object.' };
  } catch {
    return { args: {}, error: 'The arguments were not valid JSON.' };
  }
}

let callSeq = 0;
function newCallId(): string {
  callSeq = (callSeq + 1) % 1_000_000;
  return `call_${Date.now().toString(36)}_${callSeq}`;
}

// ---------- Gemini ----------

/** Gemini's OpenAPI-style schema: upper-case types, no empty object schemas. */
export function toGeminiSchema(s: JsonSchema): Record<string, unknown> {
  const out: Record<string, unknown> = { type: s.type.toUpperCase() };
  if (s.description) out.description = s.description;
  if (s.enum) out.enum = s.enum;
  if (s.type === 'array' && s.items) out.items = toGeminiSchema(s.items);
  if (s.type === 'object') {
    const props = Object.entries(s.properties ?? {});
    if (props.length) {
      out.properties = Object.fromEntries(props.map(([k, v]) => [k, toGeminiSchema(v)]));
      if (s.required?.length) out.required = s.required;
    }
  }
  return out;
}

function geminiDeclarations(tools: ToolSpec[]) {
  return tools.map((t) => {
    const hasProps = Object.keys(t.parameters.properties ?? {}).length > 0;
    return hasProps ? { name: t.name, description: t.description, parameters: toGeminiSchema(t.parameters) } : { name: t.name, description: t.description };
  });
}

/** Gemini `contents` for a neutral conversation. */
export function geminiContents(messages: ChatMessage[]): Array<{ role: 'user' | 'model'; parts: unknown[] }> {
  const out: Array<{ role: 'user' | 'model'; parts: unknown[] }> = [];
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', parts: [{ text: m.text }] });
    else if (m.role === 'assistant') {
      if (m.raw?.provider === 'gemini' && m.raw.parts.length) out.push({ role: 'model', parts: m.raw.parts });
      else {
        const parts: unknown[] = [];
        if (m.text) parts.push({ text: m.text });
        for (const c of m.toolCalls ?? []) parts.push({ functionCall: { name: c.name, args: c.args } });
        if (parts.length) out.push({ role: 'model', parts });
      }
    } else {
      out.push({
        role: 'user',
        parts: m.results.map((r) => ({ functionResponse: { name: r.name, response: { result: r.content } } })),
      });
    }
  }
  return out;
}

export function buildGeminiToolRequest(cfg: GeminiConfig, opts: ToolTurnOptions & { stream: boolean }): BuiltToolRequest {
  const model = encodeURIComponent(geminiModelName(cfg.model));
  const url = `${GEMINI_BASE}/models/${model}:${opts.stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`;
  const generationConfig: Record<string, unknown> = { temperature: opts.temperature ?? 0.3 };
  if (opts.maxTokens) generationConfig.maxOutputTokens = opts.maxTokens;
  const body: Record<string, unknown> = {
    contents: geminiContents(opts.messages),
    generationConfig,
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
  if (opts.tools.length) {
    body.tools = [{ functionDeclarations: geminiDeclarations(opts.tools) }];
    body.toolConfig = { functionCallingConfig: { mode: opts.toolChoice === 'none' ? 'NONE' : 'AUTO' } };
  }
  return {
    url,
    init: { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey.trim() }, body: JSON.stringify(body) },
  };
}

/** Collects Gemini parts from one reply or from streamed chunks into a ModelTurn. */
export class GeminiTurnAccumulator {
  parts: any[] = [];
  finishReason?: string;
  blocked = false;
  add(data: any) {
    if (geminiBlocked(data)) this.blocked = true;
    const cand = data?.candidates?.[0];
    if (cand?.finishReason) this.finishReason = cand.finishReason;
    const parts = cand?.content?.parts;
    if (Array.isArray(parts)) for (const p of parts) this.parts.push(p);
  }
  text(): string {
    return this.parts.filter((p) => typeof p?.text === 'string' && !p.thought).map((p) => p.text).join('');
  }
  turn(): ModelTurn {
    const toolCalls: ToolCall[] = [];
    for (const p of this.parts) {
      const fc = p?.functionCall;
      if (!fc || typeof fc.name !== 'string') continue;
      const { args, error } = parseArgs(fc.args);
      toolCalls.push({ id: typeof fc.id === 'string' && fc.id ? fc.id : newCallId(), name: fc.name, args, ...(error ? { argsError: error } : {}) });
    }
    return { text: this.text(), toolCalls, raw: { provider: 'gemini', parts: this.parts }, finishReason: this.finishReason };
  }
}

/** One Gemini turn with tools. Picks the model automatically (and falls back once from a retired name). */
export async function askGeminiTools(cfg: GeminiConfig, opts: ToolTurnOptions): Promise<ModelTurn> {
  if (!cfg.apiKey.trim()) throw new AiUnavailableError('not_configured', 'No Gemini key.');
  const stream = !!opts.onText;
  const explicit = !!geminiModelName(cfg.model);
  let model = await resolveGeminiModel(cfg, opts.signal);
  let res: Response;
  try {
    res = await sendRequest(buildGeminiToolRequest({ ...cfg, model }, { ...opts, stream }), opts.signal);
  } catch (e) {
    if (!(e instanceof AiUnavailableError) || e.code !== 'bad_model') throw e;
    const fallback = await resolveGeminiModel({ ...cfg, model: '' }, opts.signal, !explicit);
    if (fallback === model) throw e;
    model = fallback;
    res = await sendRequest(buildGeminiToolRequest({ ...cfg, model }, { ...opts, stream }), opts.signal);
  }
  const acc = new GeminiTurnAccumulator();
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
    );
  } else acc.add(await readJson(res, opts.signal));
  const turn = acc.turn();
  if (!turn.text && !turn.toolCalls.length) {
    if (acc.blocked) throw new AiUnavailableError('blocked', 'The request was blocked by the service.');
    if (turn.finishReason === 'MALFORMED_FUNCTION_CALL') throw new AiUnavailableError('malformed_call', 'The model sent a tool call that could not be read.', turn.finishReason);
  }
  return turn;
}

// ---------- OpenAI-compatible ----------

export function openAiMessages(system: string, messages: ChatMessage[]): unknown[] {
  const out: unknown[] = [];
  if (system) out.push({ role: 'system', content: system });
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', content: m.text });
    else if (m.role === 'assistant') {
      const msg: Record<string, unknown> = { role: 'assistant', content: m.text || (m.toolCalls?.length ? null : '') };
      if (m.toolCalls?.length) msg.tool_calls = m.toolCalls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.args) } }));
      out.push(msg);
    } else for (const r of m.results) out.push({ role: 'tool', tool_call_id: r.callId, content: r.content });
  }
  return out;
}

export function buildOpenAiToolRequest(cfg: OpenAiConfig, opts: ToolTurnOptions & { stream: boolean }): BuiltToolRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.apiKey.trim()) headers.Authorization = `Bearer ${cfg.apiKey.trim()}`;
  const body: Record<string, unknown> = {
    model: cfg.model.trim(),
    messages: openAiMessages(opts.system, opts.messages),
    temperature: opts.temperature ?? 0.3,
    stream: opts.stream,
  };
  if (opts.tools.length) {
    body.tools = opts.tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: { ...t.parameters, properties: t.parameters.properties ?? {} } } }));
    body.tool_choice = opts.toolChoice === 'none' ? 'none' : 'auto';
  }
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  return { url: `${normaliseBaseUrl(cfg.baseUrl)}/chat/completions`, init: { method: 'POST', headers, body: JSON.stringify(body) } };
}

/** Parse a non-streamed chat completion into a ModelTurn. */
export function parseOpenAiTurn(data: any): ModelTurn {
  const c = data?.choices?.[0];
  const msg = c?.message ?? {};
  const text = typeof msg.content === 'string' ? msg.content : '';
  const toolCalls: ToolCall[] = [];
  for (const tc of Array.isArray(msg.tool_calls) ? msg.tool_calls : []) {
    const name = tc?.function?.name;
    if (typeof name !== 'string' || !name) continue;
    const { args, error } = parseArgs(tc.function.arguments);
    toolCalls.push({ id: typeof tc.id === 'string' && tc.id ? tc.id : newCallId(), name, args, ...(error ? { argsError: error } : {}) });
  }
  return { text, toolCalls, finishReason: c?.finish_reason };
}

/** Accumulates streamed chat-completion deltas (text and tool-call fragments, keyed by index). */
export class OpenAiStreamAccumulator {
  text = '';
  finishReason?: string;
  private calls = new Map<number, { id: string; name: string; args: string }>();
  add(data: any) {
    const c = data?.choices?.[0];
    if (!c) return;
    if (c.finish_reason) this.finishReason = c.finish_reason;
    const d = c.delta ?? {};
    if (typeof d.content === 'string') this.text += d.content;
    for (const tc of Array.isArray(d.tool_calls) ? d.tool_calls : []) {
      const idx = typeof tc.index === 'number' ? tc.index : this.calls.size;
      const cur = this.calls.get(idx) ?? { id: '', name: '', args: '' };
      if (typeof tc.id === 'string' && tc.id) cur.id = tc.id;
      if (typeof tc.function?.name === 'string') cur.name += tc.function.name;
      if (typeof tc.function?.arguments === 'string') cur.args += tc.function.arguments;
      else if (tc.function?.arguments && typeof tc.function.arguments === 'object') cur.args = JSON.stringify(tc.function.arguments);
      this.calls.set(idx, cur);
    }
  }
  turn(): ModelTurn {
    const toolCalls: ToolCall[] = [];
    for (const [, c] of [...this.calls.entries()].sort((a, b) => a[0] - b[0])) {
      if (!c.name) continue;
      const { args, error } = parseArgs(c.args);
      toolCalls.push({ id: c.id || newCallId(), name: c.name, args, ...(error ? { argsError: error } : {}) });
    }
    return { text: this.text, toolCalls, finishReason: this.finishReason };
  }
}

export async function askOpenAiTools(cfg: OpenAiConfig, opts: ToolTurnOptions): Promise<ModelTurn> {
  if (!cfg.baseUrl.trim() || !cfg.model.trim()) throw new AiUnavailableError('not_configured', 'The service is not set up.');
  const stream = !!opts.onText;
  const res = await sendRequest(buildOpenAiToolRequest(cfg, { ...opts, stream }), opts.signal);
  if (!stream) return parseOpenAiTurn(await readJson(res, opts.signal));
  const acc = new OpenAiStreamAccumulator();
  let last = '';
  await readJsonEvents(
    res,
    (d) => {
      acc.add(d);
      if (acc.text && acc.text !== last) {
        last = acc.text;
        opts.onText?.(acc.text);
      }
    },
    opts.signal,
  );
  return acc.turn();
}

/** Did an OpenAI-compatible service refuse because the model or server cannot do tool calling? */
export function isToolsUnsupported(e: unknown): boolean {
  const err = e as { code?: string; detail?: string } | null;
  if (!err || (err.code !== 'bad_request' && err.code !== 'unavailable')) return false;
  return /(does not support|doesn't support|not support(ed)?|unsupported|unknown|unrecognized|invalid).{0,40}(tool|function)|(tool|function).{0,40}(not supported|unsupported)/i.test(err.detail ?? '');
}

// ---------- Claude (claude.ai viewer, `sample` capability) ----------

export interface ClaudeTool {
  name: string;
  description: string;
  inputSchema?: { type: 'object'; properties?: Record<string, unknown>; required?: string[] };
  execute: (input: Record<string, unknown>, context: { signal: AbortSignal }) => unknown;
}

/** True when this viewer lets the page offer tools to Claude. */
export async function claudeToolsAvailable(): Promise<boolean> {
  const sample = await useCapability('sample');
  if (!sample || typeof sample.limits !== 'function') return false;
  try {
    const lim = await sample.limits();
    return !!lim?.tools;
  } catch {
    return false;
  }
}

/**
 * Ask Claude with page tools. `turns` must start and end on a user turn; standing instructions go in
 * the first user turn (there is no system role). Claude runs the tool rounds; the promise resolves with
 * the text of every round.
 */
export async function askClaudeTools(
  turns: Array<{ role: 'user' | 'assistant'; content: string }>,
  opts: { tools: ClaudeTool[]; signal?: AbortSignal; onText?: (text: string) => void; modelTier?: 'quick' | 'default' | 'complex' },
): Promise<{ text: string; truncated: boolean }> {
  const sample = await useCapability('sample');
  if (!sample) throw new AiUnavailableError('unavailable', 'Claude is only available when this app is opened as a Claude artifact.');
  try {
    const r = await sample(turns, {
      signal: opts.signal,
      modelTier: opts.modelTier ?? 'default',
      tools: opts.tools,
      onText: opts.onText ? ({ text }: { text: string }) => opts.onText!(text) : undefined,
    });
    return { text: String(r?.text ?? ''), truncated: !!r?.truncated };
  } catch (e: any) {
    const code = e?.code === 'upstream_error' ? 'unavailable' : e?.code === 'prompt_too_large' ? 'too_large' : e?.code === 'refused' ? 'blocked' : e?.code ?? 'unavailable';
    const err = new AiUnavailableError(code, e?.message ?? 'Claude could not answer.') as AiUnavailableError & { partial?: string };
    if (typeof e?.text === 'string') err.partial = e.text;
    throw err;
  }
}
