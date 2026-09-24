// Timing for AI requests: where the time goes (model list, waiting for the service, thinking, writing,
// waits for free-tier limits, retries), for three uses:
// - the progress line shown while waiting ("Waiting for Google · 3 s", "Waiting 11 s for Google's free
//   limit..."), through getAiActivity / subscribeAiActivity;
// - an info entry in Help > Error log (area `ai`) when a request finishes: stages and milliseconds only,
//   never prompt or answer text;
// - the "Timing" lines in Copy details (ai-diagnose.ts).
//
// One AiTiming follows one user action (a Test connection, one explanation, one assistant question with
// all its tool rounds, one batch of coding suggestions). Pass it down through the `timing` options.

import { logInfo } from './errorlog';

export type AiStage = 'starting' | 'choosing' | 'waiting' | 'thinking' | 'writing' | 'limit' | 'retry' | 'tools' | 'loading' | 'done' | 'failed';

export type TimingEventKind = 'list' | 'list-cached' | 'request' | 'headers' | 'first-text' | 'wait' | 'retry' | 'fallback' | 'tools' | 'done' | 'failed';

export interface TimingEvent {
  /** Milliseconds since the action started. */
  t: number;
  kind: TimingEventKind;
  model?: string;
  api?: string;
  status?: number;
  /** Duration (request until headers, a wait...). */
  ms?: number;
  note?: string;
}

/** What the progress line shows. */
export interface AiActivity {
  id: number;
  op: string;
  stage: AiStage;
  /** Plain-English stage, e.g. "Waiting for Google". */
  label: string;
  /** performance.now()-style start, for the elapsed time. */
  startedAt: number;
  /** For a free-limit wait: when it ends (same clock as startedAt). */
  waitUntil?: number;
  model?: string;
  provider?: string;
  active: boolean;
}

const clock = (): number => {
  try {
    return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
  } catch {
    return Date.now();
  }
};

/** "Google" for Gemini, "the AI service" otherwise (used in stage labels). */
function serviceName(provider?: string): string {
  if (provider === 'gemini') return 'Google';
  if (provider === 'webllm') return 'the on-device model';
  if (provider === 'claude') return 'Claude';
  return 'the AI service';
}

export function stageLabel(stage: AiStage, provider?: string, waitSec?: number): string {
  const who = serviceName(provider);
  switch (stage) {
    case 'starting':
      return 'Starting';
    case 'choosing':
      return 'Choosing model';
    case 'waiting':
      return `Waiting for ${who}`;
    case 'thinking':
      return 'Thinking';
    case 'writing':
      return 'Writing';
    case 'limit':
      return provider === 'gemini' ? `Waiting ${waitSec ?? 0} s for Google's free limit...` : `Waiting ${waitSec ?? 0} s for the service's limit...`;
    case 'retry':
      return `${cap(who)} is busy: trying again`;
    case 'tools':
      return 'Looking at your data';
    case 'loading':
      return 'Loading the on-device model';
    case 'done':
      return 'Done';
    case 'failed':
      return 'Stopped';
  }
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

let seq = 0;
const active = new Map<number, AiTiming>();
const recent: AiTiming[] = [];
const listeners = new Set<() => void>();
let snapshot: AiActivity | null = null;
let byOp = new Map<string, AiActivity>();

function publish(): void {
  const list = [...active.values()];
  const cur = list[list.length - 1];
  snapshot = cur ? cur.activity() : null;
  byOp = new Map();
  for (const t of list) byOp.set(t.op, t.activity());
  for (const l of [...listeners]) {
    try {
      l();
    } catch {
      /* a listener failed */
    }
  }
}

export class AiTiming {
  readonly id = ++seq;
  readonly startedAt = clock();
  readonly events: TimingEvent[] = [];
  stage: AiStage = 'starting';
  provider?: string;
  model?: string;
  waitUntil?: number;
  firstTextMs?: number;
  doneMs?: number;
  ok?: boolean;
  requests = 0;
  lists = 0;
  waitedMs = 0;
  retries = 0;
  private waitSec?: number;

  constructor(
    readonly op: string,
    provider?: string,
  ) {
    this.provider = provider;
  }

  elapsed(): number {
    return Math.round(clock() - this.startedAt);
  }

  mark(kind: TimingEventKind, extra: Omit<TimingEvent, 't' | 'kind'> = {}): void {
    const e: TimingEvent = { t: this.elapsed(), kind, ...extra };
    this.events.push(e);
    if (this.events.length > 200) this.events.splice(0, this.events.length - 200);
    if (kind === 'request') this.requests++;
    if (kind === 'list') this.lists++;
    if (kind === 'retry') this.retries++;
    if (extra.model && (kind === 'request' || kind === 'headers')) this.model = extra.model;
  }

  setStage(stage: AiStage, waitMs?: number): void {
    if (this.doneMs !== undefined) return;
    // Text already showing: later requests of the same action (the assistant's next round) keep "Writing" only while text streams.
    this.stage = stage;
    this.waitUntil = stage === 'limit' && waitMs ? clock() + waitMs : undefined;
    this.waitSec = stage === 'limit' && waitMs ? Math.ceil(waitMs / 1000) : undefined;
    if (active.has(this.id)) publish();
  }

  /** The first words of the answer arrived. */
  firstText(): void {
    if (this.firstTextMs === undefined) {
      this.firstTextMs = this.elapsed();
      this.mark('first-text');
    }
    if (this.stage !== 'writing') this.setStage('writing');
  }

  /** Wait `ms` for a service limit, showing a countdown. Rejects when the signal aborts. */
  async waitFor(ms: number, note: string, signal?: AbortSignal, sleep?: (ms: number, signal?: AbortSignal) => Promise<void>): Promise<void> {
    const prev = this.stage;
    this.mark('wait', { ms: Math.round(ms), note });
    this.setStage('limit', ms);
    const t = clock();
    try {
      await (sleep ?? defaultSleep)(ms, signal);
    } finally {
      this.waitedMs += Math.round(clock() - t);
      this.waitUntil = undefined;
      if (this.stage === 'limit') this.setStage(prev === 'limit' ? 'waiting' : prev);
    }
  }

  activity(): AiActivity {
    return {
      id: this.id,
      op: this.op,
      stage: this.stage,
      label: stageLabel(this.stage, this.provider, this.waitSec),
      startedAt: this.startedAt,
      waitUntil: this.waitUntil,
      model: this.model,
      provider: this.provider,
      active: this.doneMs === undefined,
    };
  }

  /** Finish: log one info entry (no content) and keep it for Copy details. Idempotent. */
  finish(ok: boolean, error?: { code?: string } | null): void {
    if (this.doneMs !== undefined) return;
    this.doneMs = this.elapsed();
    this.ok = ok;
    this.mark(ok ? 'done' : 'failed', error?.code ? { note: error.code } : {});
    this.stage = ok ? 'done' : 'failed';
    active.delete(this.id);
    recent.push(this);
    if (recent.length > 12) recent.shift();
    if (error?.code !== 'cancelled') logInfo('ai', this.summary(), { op: `timing:${this.op}`, provider: this.provider, model: this.model, ms: this.doneMs });
    publish();
  }

  /** One line: "explain: first text 1.2 s, done 4.3 s; 1 request, 0 model lists, waited 0 s". */
  summary(): string {
    const s = (ms?: number) => (ms === undefined ? '-' : `${(ms / 1000).toFixed(1)} s`);
    const parts = [
      `${this.op}${this.ok === false ? ' (failed)' : ''}:`,
      this.firstTextMs !== undefined ? `first text ${s(this.firstTextMs)},` : '',
      `done ${s(this.doneMs ?? this.elapsed())};`,
      `${this.requests} request${this.requests === 1 ? '' : 's'}`,
      this.lists ? `, ${this.lists} model list${this.lists === 1 ? '' : 's'}` : '',
      this.retries ? `, ${this.retries} retr${this.retries === 1 ? 'y' : 'ies'}` : '',
      this.waitedMs ? `, waited ${s(this.waitedMs)} for limits` : '',
      this.model ? ` (${this.model})` : '',
    ];
    return parts.filter(Boolean).join(' ').replace(/ ,/g, ',').replace(/\s+/g, ' ').trim();
  }

  /** The timeline, for Copy details. */
  lines(): string[] {
    return [
      `Timing: ${this.summary()}`,
      ...this.events.map((e) => {
        const bits = [e.model, e.api, e.status ? `HTTP ${e.status}` : '', e.ms !== undefined ? `${e.ms} ms` : '', e.note].filter(Boolean).join(', ');
        return `  +${String(e.t).padStart(6)} ms  ${e.kind}${bits ? ` (${bits})` : ''}`;
      }),
    ];
  }
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(Object.assign(new Error('Stopped.'), { code: 'cancelled' }));
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, Math.max(0, ms));
    const onAbort = () => {
      clearTimeout(t);
      reject(Object.assign(new Error('Stopped.'), { code: 'cancelled' }));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Start timing a user action. Shown as the current AI activity until finish(). */
export function startAiTiming(op: string, provider?: string): AiTiming {
  const t = new AiTiming(op, provider);
  active.set(t.id, t);
  publish();
  return t;
}

/**
 * The newest unfinished AI action (for progress lines), or null; with `op`, the newest of that kind
 * ("assistant", "explain"...). Same object until something changes.
 */
export function getAiActivity(op?: string): AiActivity | null {
  return op ? byOp.get(op) ?? null : snapshot;
}

/** The progress of one action by id (or null once finished). */
export function getAiActivityById(id: number | null | undefined): AiActivity | null {
  if (!id) return null;
  return active.get(id)?.activity() ?? null;
}

export function subscribeAiActivity(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Finished actions, newest last (for Copy details). */
export function recentAiTimings(): AiTiming[] {
  return recent.slice();
}

/** Test hook. */
export function __resetAiTimings(): void {
  active.clear();
  recent.length = 0;
  snapshot = null;
  byOp = new Map();
}
