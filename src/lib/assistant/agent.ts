// The assistant's tool-calling loop, provider-agnostic. Three driver kinds:
// - native : the model returns tool calls (Gemini, OpenAI-compatible); we run them (in parallel when
//            several come in one turn) and send the results back, up to `maxRounds` rounds.
// - hosted : Claude's `sample` capability runs the rounds itself and calls our tools.
// - text   : a strict JSON action protocol for models without reliable tool calling (on-device).
// Limits: rounds per question, a byte budget per request (old tool results are shortened first),
// per-minute pacing and one back-off on rate limits, Stop through an AbortSignal.
import { AiUnavailableError } from '../../platform/claude';
import type { ChatMessage, ClaudeTool, ModelTurn, ToolCall, ToolSpec, ToolTurnOptions, ToolAiError } from '../../platform/ai-tools';
import { isToolsUnsupported } from '../../platform/ai-tools';
import { byteLength, trimToBytes } from './format';
import { buildJsonPrompt, parseAction, partialAnswer, type TranscriptEntry } from './json-protocol';
import { abortableSleep, limiterFor, type RateLimiter } from './rate-limit';
import type { AgentTool, Artifact, ToolContext, TraceStep } from './types';
import { checkArgs } from './validate';

export interface AgentBudget {
  /** Largest request (system prompt + conversation + tool results), in bytes. */
  maxPromptBytes: number;
  /** Largest single tool result, in bytes. */
  maxToolResultBytes: number;
  maxOutputTokens?: number;
}

interface DriverBase {
  /** Short name, e.g. "gemini". */
  name: string;
  budget: AgentBudget;
  /** Client-side pacing (free tiers). */
  perMinute?: number;
  /** Key for the pacing window (provider + account). */
  rateKey?: string;
  /** Use the short system prompt and tool list. */
  compact?: boolean;
}

export interface NativeDriver extends DriverBase {
  kind: 'native';
  turn: (opts: ToolTurnOptions) => Promise<ModelTurn>;
  /** Used instead when the service turns out not to support tool calling. */
  fallback?: () => TextDriver;
}

export interface HostedDriver extends DriverBase {
  kind: 'hosted';
  run: (opts: { turns: Array<{ role: 'user' | 'assistant'; content: string }>; tools: ClaudeTool[]; signal?: AbortSignal; onText?: (t: string) => void }) => Promise<{ text: string; truncated?: boolean }>;
}

export interface TextDriver extends DriverBase {
  kind: 'text';
  complete: (prompt: string, opts: { signal?: AbortSignal; json: boolean; maxTokens?: number; onText?: (t: string) => void }) => Promise<string>;
}

export type Driver = NativeDriver | HostedDriver | TextDriver;

export interface AgentEvents {
  /** The answer text so far (streams; may reset to '' when a turn turns out to be a tool round). */
  onText?: (text: string) => void;
  /** A trace step started or changed (same id = update). */
  onStep?: (step: TraceStep) => void;
  onArtifact?: (a: Artifact) => void;
}

export interface RunInput {
  driver: Driver;
  system: string;
  history: ChatMessage[];
  user: string;
  tools: AgentTool[];
  ctx: ToolContext;
  signal?: AbortSignal;
  events?: AgentEvents;
  maxRounds?: number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  limiter?: RateLimiter;
}

export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  ok: boolean;
  result: string;
}

export interface RunResult {
  text: string;
  history: ChatMessage[];
  steps: TraceStep[];
  artifacts: Artifact[];
  toolCalls: ToolCallRecord[];
  rounds: number;
  requests: number;
  limitReached: boolean;
  truncated?: boolean;
}

export const MAX_ROUNDS = 8;
const LIMIT_NOTE =
  'You have used all the tool steps available for this question. Do not call tools now: answer with what you found, say what you could not check, and suggest how to continue.';

let stepSeq = 0;
const stepId = () => `step_${++stepSeq}`;

function cancelledError() {
  return new AiUnavailableError('cancelled', 'Stopped.');
}

/** Tool specs for the provider (name, description, parameters). */
export function toolSpecs(tools: AgentTool[]): ToolSpec[] {
  return tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters }));
}

class Runner {
  steps: TraceStep[] = [];
  artifacts: Artifact[] = [];
  toolCalls: ToolCallRecord[] = [];
  requests = 0;
  constructor(private input: RunInput) {}

  get signal() {
    return this.input.signal;
  }

  step(s: Omit<TraceStep, 'id'> & { id?: string }): TraceStep {
    const full: TraceStep = { ...s, id: s.id ?? stepId() };
    const i = this.steps.findIndex((x) => x.id === full.id);
    if (i >= 0) this.steps[i] = full;
    else this.steps.push(full);
    this.input.events?.onStep?.(full);
    return full;
  }

  async sleep(ms: number) {
    try {
      await (this.input.sleep ?? abortableSleep)(ms, this.signal);
    } catch {
      throw cancelledError();
    }
    if (this.signal?.aborted) throw cancelledError();
  }

  limiter(): RateLimiter | null {
    const d = this.input.driver;
    if (this.input.limiter) return this.input.limiter;
    return d.perMinute ? limiterFor(d.rateKey ?? d.name, d.perMinute) : null;
  }

  /** Pace requests, send, and back off once on a rate limit. */
  async request<T>(fn: () => Promise<T>): Promise<T> {
    const lim = this.limiter();
    for (let attempt = 0; ; attempt++) {
      if (this.signal?.aborted) throw cancelledError();
      if (lim) {
        const wait = lim.waitMs();
        if (wait > 0) {
          const s = this.step({ kind: 'wait', label: `Pausing ${Math.ceil(wait / 1000)} s to stay within the free tier's limit of ${lim.perMinute} requests a minute`, status: 'running' });
          await this.sleep(wait);
          this.step({ ...s, status: 'done' });
        }
        lim.record();
      }
      this.requests++;
      try {
        return await fn();
      } catch (e) {
        if (this.signal?.aborted) throw cancelledError();
        const err = e as ToolAiError;
        if (err?.code === 'rate_limited' && !err.daily && attempt === 0) {
          const ms = Math.min(60_000, Math.max(2_000, err.retryAfterMs ?? 20_000));
          const s = this.step({ kind: 'wait', label: `The AI service is busy or the free per-minute allowance is used up. Waiting ${Math.ceil(ms / 1000)} s, then trying once more`, status: 'running' });
          await this.sleep(ms);
          this.step({ ...s, status: 'done' });
          continue;
        }
        if (err?.code === 'rate_limited' && err.daily) {
          throw Object.assign(new AiUnavailableError('rate_limited', 'Daily quota used up.', 'The free daily allowance for this key is used up. It resets tomorrow (Pacific time); you can also choose another AI option in AI > AI assistant settings.'), { daily: true });
        }
        if (err?.code === 'malformed_call' && attempt === 0) continue;
        throw e;
      }
    }
  }

  report(a: Artifact) {
    this.artifacts.push(a);
    this.input.events?.onArtifact?.(a);
  }

  /** Run one tool call: validate arguments, run, trim, record, report. */
  /** `collect`: gather artifacts there (to report them in call order) instead of reporting at once. */
  async execute(call: { name: string; args: Record<string, unknown>; argsError?: string }, collect?: Artifact[]): Promise<string> {
    const tool = this.input.tools.find((t) => t.name === call.name);
    const label = tool ? safeLabel(tool, call.args) : `Unknown tool ${call.name}`;
    const s = this.step({ kind: 'tool', label, tool: call.name, args: call.args, status: 'running' });
    let text: string;
    let ok = true;
    let summary: string | undefined;
    if (!tool) {
      text = `Error: there is no tool named "${call.name}". Available tools: ${this.input.tools.map((t) => t.name).join(', ')}.`;
      ok = false;
    } else if (call.argsError) {
      text = `Error: ${call.argsError} Send the arguments as a JSON object matching the tool's parameters.`;
      ok = false;
    } else {
      const { args, errors } = checkArgs(tool.parameters, call.args);
      if (errors.length) {
        text = `Error: invalid arguments for ${tool.name}: ${errors.join(' ')}`;
        ok = false;
      } else {
        try {
          const out = await tool.run(args, { ...this.input.ctx, maxResultBytes: this.input.driver.budget.maxToolResultBytes, signal: this.signal });
          text = out.text;
          ok = out.ok !== false;
          summary = out.summary;
          for (const a of out.artifacts ?? []) {
            if (collect) collect.push(a);
            else this.report(a);
          }
        } catch (e) {
          text = `Error: ${tool.name} failed: ${(e as Error)?.message ?? String(e)}`;
          ok = false;
        }
      }
    }
    text = trimToBytes(text, this.input.driver.budget.maxToolResultBytes);
    this.toolCalls.push({ name: call.name, args: call.args, ok, result: text });
    this.step({ ...s, label: summary ?? label, status: ok ? 'done' : 'error', detail: ok ? undefined : firstLine(text) });
    return text;
  }
}

function safeLabel(t: AgentTool, args: Record<string, unknown>): string {
  try {
    return t.label(args);
  } catch {
    return t.name;
  }
}

function firstLine(s: string): string {
  const l = s.split('\n')[0];
  return l.length > 200 ? l.slice(0, 200) + '...' : l;
}

// ---------- conversation budget (native) ----------

const REMOVED = '[Earlier result removed to save space. Call the tool again if you need it.]';

function messagesBytes(system: string, msgs: ChatMessage[], toolsBytes: number): number {
  let n = byteLength(system) + toolsBytes;
  for (const m of msgs) {
    if (m.role === 'user') n += byteLength(m.text) + 20;
    else if (m.role === 'assistant') n += byteLength(m.text) + byteLength(JSON.stringify(m.toolCalls ?? [])) + 20;
    else for (const r of m.results) n += byteLength(r.content) + 60;
  }
  return n;
}

/** Index of the first message of the latest exchange (the last user text message). */
function lastExchangeStart(msgs: ChatMessage[]): number {
  for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].role === 'user') return i;
  return 0;
}

/**
 * Make the conversation fit: shorten old tool results, then drop the oldest exchanges, then shorten
 * the current exchange's earlier results. Never breaks call/result pairs.
 */
export function fitMessages(system: string, msgs: ChatMessage[], maxBytes: number, toolsBytes = 0): ChatMessage[] {
  let out = msgs.map((m) => (m.role === 'tool' ? { ...m, results: m.results.map((r) => ({ ...r })) } : m));
  const over = () => messagesBytes(system, out, toolsBytes) > maxBytes;
  if (!over()) return out;
  const cur = lastExchangeStart(out);
  for (let i = 0; i < cur && over(); i++) {
    const m = out[i];
    if (m.role === 'tool') for (const r of m.results) r.content = REMOVED;
  }
  while (over()) {
    const c = lastExchangeStart(out);
    if (c === 0) break;
    // Drop the oldest exchange (a user message and everything up to the next user message).
    let end = 1;
    while (end < out.length && out[end].role !== 'user') end++;
    out = out.slice(end);
  }
  if (over()) {
    const toolIdx = out.map((m, i) => (m.role === 'tool' ? i : -1)).filter((i) => i >= 0);
    for (const i of toolIdx.slice(0, -1)) {
      if (!over()) break;
      for (const r of (out[i] as Extract<ChatMessage, { role: 'tool' }>).results) r.content = trimToBytes(r.content, 600);
    }
    const last = toolIdx[toolIdx.length - 1];
    if (last !== undefined && over()) {
      const excess = messagesBytes(system, out, toolsBytes) - maxBytes;
      const m = out[last] as Extract<ChatMessage, { role: 'tool' }>;
      const each = Math.max(400, Math.floor((m.results.reduce((a, r) => a + byteLength(r.content), 0) - excess) / m.results.length));
      for (const r of m.results) r.content = trimToBytes(r.content, each);
    }
  }
  return out;
}

// ---------- native loop ----------

async function runNative(r: Runner, input: RunInput, driver: NativeDriver): Promise<RunResult> {
  const maxRounds = input.maxRounds ?? MAX_ROUNDS;
  const specs = toolSpecs(input.tools);
  const toolsBytes = byteLength(JSON.stringify(specs));
  let messages: ChatMessage[] = [...input.history, { role: 'user', text: input.user }];
  let rounds = 0;
  let limitReached = false;
  for (;;) {
    const final = rounds >= maxRounds;
    if (final) limitReached = true;
    const system = final ? `${input.system}\n\n${LIMIT_NOTE}` : input.system;
    messages = fitMessages(system, messages, driver.budget.maxPromptBytes, toolsBytes);
    let streamed = '';
    const turn = await r.request(() =>
      driver.turn({
        system,
        messages,
        tools: specs,
        toolChoice: final ? 'none' : 'auto',
        signal: input.signal,
        maxTokens: driver.budget.maxOutputTokens,
        onText: (t) => {
          streamed = t;
          input.events?.onText?.(t);
        },
      }),
    );
    if (input.signal?.aborted) throw cancelledError();
    const calls = final ? [] : turn.toolCalls;
    if (calls.length) {
      rounds++;
      // Text written before tool calls is the model thinking aloud: keep it in the trace, not the answer.
      const aside = turn.text.trim();
      if (aside) r.step({ kind: 'note', label: aside.length > 240 ? aside.slice(0, 240) + '...' : aside, status: 'done' });
      if (streamed) input.events?.onText?.('');
      messages.push({ role: 'assistant', text: turn.text, toolCalls: calls, raw: turn.raw });
      const found: Artifact[][] = calls.map(() => []);
      const results = await Promise.all(calls.map((c: ToolCall, i) => r.execute(c, found[i])));
      if (input.signal?.aborted) throw cancelledError();
      for (const list of found) for (const a of list) r.report(a);
      messages.push({ role: 'tool', results: calls.map((c, i) => ({ callId: c.id, name: c.name, content: results[i] })) });
      continue;
    }
    let text = turn.text.trim();
    if (!text) {
      if (turn.toolCalls.length) text = 'I used all the steps I can take for one question before finishing. Ask me to continue, or narrow the question.';
      else throw new AiUnavailableError('empty', 'The AI service returned an empty answer.', turn.finishReason ? `Finish reason: ${turn.finishReason}` : undefined);
    }
    input.events?.onText?.(text);
    // Keep the model's own form of the answer for faithful replay (Gemini thought signatures).
    messages.push({ role: 'assistant', text, raw: turn.toolCalls.length ? undefined : turn.raw });
    return { text, history: messages, steps: r.steps, artifacts: r.artifacts, toolCalls: r.toolCalls, rounds, requests: r.requests, limitReached, truncated: turn.finishReason === 'MAX_TOKENS' || turn.finishReason === 'length' };
  }
}

// ---------- hosted loop (Claude) ----------

/** User/assistant text turns from the neutral history (tool rounds are not replayed). */
export function textTurns(history: ChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  const out: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const m of history) {
    if (m.role === 'user' && m.text.trim()) out.push({ role: 'user', content: m.text });
    else if (m.role === 'assistant' && m.text.trim() && !m.toolCalls?.length) out.push({ role: 'assistant', content: m.text });
  }
  return out;
}

async function runHosted(r: Runner, input: RunInput, driver: HostedDriver): Promise<RunResult> {
  const maxCalls = (input.maxRounds ?? MAX_ROUNDS) * 3;
  let calls = 0;
  const tools: ClaudeTool[] = input.tools.map((t) => ({
    name: t.name,
    description: t.description.slice(0, 1000),
    inputSchema: { type: 'object', properties: (t.parameters.properties ?? {}) as Record<string, unknown>, required: t.parameters.required },
    execute: async (args) => {
      if (++calls > maxCalls) throw new Error(LIMIT_NOTE);
      return r.execute({ name: t.name, args: (args ?? {}) as Record<string, unknown> });
    },
  }));
  const instructions = `${input.system}\n\n(These are your standing instructions from Socius. The conversation follows.)`;
  let history = textTurns(input.history);
  const fit = () => byteLength(instructions) + history.reduce((a, t) => a + byteLength(t.content), 0) + byteLength(input.user) <= driver.budget.maxPromptBytes;
  while (!fit() && history.length) history = history.slice(2);
  const turns = [{ role: 'user' as const, content: instructions }, ...history, { role: 'user' as const, content: input.user }];
  const res = await r.request(() => driver.run({ turns, tools, signal: input.signal, onText: (t) => input.events?.onText?.(t) }));
  const text = res.text.trim();
  if (!text) throw new AiUnavailableError('empty', 'The AI service returned an empty answer.');
  input.events?.onText?.(text);
  const newHistory: ChatMessage[] = [...input.history, { role: 'user', text: input.user }, { role: 'assistant', text }];
  return { text, history: newHistory, steps: r.steps, artifacts: r.artifacts, toolCalls: r.toolCalls, rounds: r.toolCalls.length ? 1 : 0, requests: r.requests, limitReached: calls > maxCalls, truncated: res.truncated };
}

// ---------- JSON protocol loop ----------

function transcriptFrom(history: ChatMessage[]): TranscriptEntry[] {
  return textTurns(history).map((t) => ({ kind: t.role, text: t.content }));
}

async function runText(r: Runner, input: RunInput, driver: TextDriver): Promise<RunResult> {
  const maxRounds = input.maxRounds ?? MAX_ROUNDS;
  const transcript: TranscriptEntry[] = [...transcriptFrom(input.history), { kind: 'user', text: input.user }];
  let rounds = 0;
  let limitReached = false;
  const ask = async (prompt: string) =>
    r.request(() =>
      driver.complete(prompt, {
        signal: input.signal,
        json: true,
        maxTokens: driver.budget.maxOutputTokens,
        onText: (raw) => {
          const p = partialAnswer(raw);
          if (p !== null) input.events?.onText?.(p);
        },
      }),
    );
  for (;;) {
    const final = rounds >= maxRounds;
    if (final) limitReached = true;
    const nudge = final ? `${LIMIT_NOTE} Reply with {"answer": "..."}.` : '';
    const prompt = buildJsonPrompt(input.system, input.tools, transcript, driver.budget.maxPromptBytes, nudge);
    let raw = await ask(prompt);
    let action = parseAction(raw, input.tools);
    if (action.kind === 'invalid') {
      // One repair attempt with the exact problem.
      r.step({ kind: 'note', label: 'The model replied in the wrong format; asking it to correct itself', status: 'done' });
      const fixed = await ask(`${prompt}\n${raw.slice(0, 600)}\n\nThat reply was not valid: ${action.error} Reply again with ONLY one JSON object, either {"tool": "...", "args": {...}} or {"answer": "..."}.\n\nYour JSON reply:`);
      const again = parseAction(fixed, input.tools);
      if (again.kind === 'invalid') {
        // A plain-text reply is still a usable answer; anything else is an error.
        const plain = raw.trim();
        if (plain && !/^[[{]/.test(plain)) action = { kind: 'answer', answer: plain };
        else throw new AiUnavailableError('invalid_json', 'The AI replied in an unexpected format.');
      } else {
        action = again;
        raw = fixed;
      }
    }
    if (action.kind === 'tool' && !final) {
      rounds++;
      const result = await r.execute({ name: action.tool, args: action.args });
      if (input.signal?.aborted) throw cancelledError();
      input.events?.onText?.('');
      transcript.push({ kind: 'call', text: JSON.stringify({ tool: action.tool, args: action.args }) });
      transcript.push({ kind: 'result', text: result });
      continue;
    }
    const text = action.kind === 'answer' ? action.answer : 'I used all the steps I can take for one question. Ask me to continue, or narrow the question.';
    input.events?.onText?.(text);
    const history: ChatMessage[] = [...input.history, { role: 'user', text: input.user }, { role: 'assistant', text }];
    return { text, history, steps: r.steps, artifacts: r.artifacts, toolCalls: r.toolCalls, rounds, requests: r.requests, limitReached };
  }
}

/** Answer one user message, using tools as needed. Rejects AiUnavailableError (code 'cancelled' on Stop). */
export async function runAgent(input: RunInput): Promise<RunResult> {
  const r = new Runner(input);
  const d = input.driver;
  try {
    if (d.kind === 'hosted') return await runHosted(r, input, d);
    if (d.kind === 'text') return await runText(r, input, d);
    try {
      return await runNative(r, input, d);
    } catch (e) {
      // The service cannot do tool calling (some local models): continue with the JSON protocol.
      if (d.fallback && isToolsUnsupported(e) && !r.toolCalls.length) {
        r.step({ kind: 'note', label: 'This model does not support tool calling; switching to a simpler way of using tools', status: 'done' });
        return await runText(r, input, d.fallback());
      }
      throw e;
    }
  } catch (e) {
    for (const s of r.steps) if (s.status === 'running') r.step({ ...s, status: 'error', detail: input.signal?.aborted ? 'Stopped' : undefined });
    if (input.signal?.aborted) throw cancelledError();
    throw e;
  }
}
