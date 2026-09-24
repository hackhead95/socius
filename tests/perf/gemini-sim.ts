// A simulated Google Gemini API with realistic latencies and free-tier limits, for the AI timing
// harness (tests/perf/ai-latency.test.ts). Runs on vitest's fake clock, so "seconds" cost nothing.
//
// What it models (from the owner's logs and docs/research/gemini-auth-keys-and-interactions-api.md):
// - GET /v1beta/models: one round trip plus a large JSON body.
// - POST /v1beta/interactions: a round trip, then "thinking" (depends on the model family and the
//   requested thinking_level; Google's default for Gemini 3 Flash is medium), then text at the model's
//   speed. Streamed requests get their headers after the round trip and text events as they are
//   generated; non-streamed requests get everything at the end.
// - Free-tier per-minute limits per model (Flash 5, Flash-Lite 15 by default): an extra request gets
//   the 429 body Google sends ("limit: 5 requests per minute ... Please retry in 11s").
// - An optional scripted model for tool calls (the assistant).

export type Family = 'flash' | 'lite';
export const familyOf = (model: string): Family => (/lite/i.test(model) ? 'lite' : 'flash');

export interface SimReply {
  text?: string;
  calls?: Array<{ name: string; args: Record<string, unknown> }>;
}

export interface SimRequest {
  kind: 'list' | 'generate';
  model?: string;
  stream?: boolean;
  thinking?: string;
  status: number;
  start: number;
  headers?: number;
  firstText?: number;
  end?: number;
  tools?: boolean;
}

export interface SimOptions {
  models?: string[];
  rttMs?: number;
  listMs?: number;
  rpm?: Partial<Record<Family, number>>;
  /** Thinking time by family and level. */
  thinkMs?: (family: Family, level: string) => number;
  tokPerSec?: Partial<Record<Family, number>>;
  /** Prefill cost per KB of input. */
  msPerInputKB?: number;
  answer?: (req: { model: string; body: any; prompt: string; system: string; steps: any[] }) => SimReply;
}

const DEFAULT_THINK: Record<Family, Record<string, number>> = {
  flash: { minimal: 350, low: 1600, medium: 4200, high: 9000 },
  lite: { minimal: 150, low: 600, medium: 1800, high: 4000 },
};

export function now(): number {
  return Date.now();
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, Math.round(ms))));
}

export function geminiSim(o: SimOptions = {}) {
  const models = o.models ?? ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview', 'text-embedding-005'];
  const rtt = o.rttMs ?? 280;
  const rpm: Record<Family, number> = { flash: 5, lite: 15, ...(o.rpm ?? {}) };
  const tps: Record<Family, number> = { flash: 140, lite: 260, ...(o.tokPerSec ?? {}) };
  const think = o.thinkMs ?? ((f: Family, level: string) => DEFAULT_THINK[f][level] ?? DEFAULT_THINK[f].medium);
  const used = new Map<string, number[]>();
  const log: SimRequest[] = [];
  const t0 = now();

  /** Pretend `n` requests to `model` were made just now (the owner clicked Test several times). */
  function preuse(model: string, n: number, agoMs = 0) {
    const list = used.get(model) ?? [];
    for (let i = 0; i < n; i++) list.push(now() - agoMs);
    used.set(model, list);
  }

  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  async function handle(url: string, init: RequestInit): Promise<Response> {
    const method = (init?.method ?? 'GET').toUpperCase();
    const signal = init?.signal ?? undefined;
    const rec: SimRequest = { kind: method === 'GET' ? 'list' : 'generate', status: 0, start: now() - t0 };
    log.push(rec);
    const aborted = () => {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    };
    if (method === 'GET') {
      await wait(rtt + (o.listMs ?? 120));
      aborted();
      rec.status = 200;
      rec.headers = rec.end = now() - t0;
      return json(200, { models: models.map((m) => ({ name: `models/${m}`, supportedGenerationMethods: ['generateContent', 'countTokens'] })) });
    }
    const body = JSON.parse(String(init.body ?? '{}'));
    const model: string = body.model ?? /models\/([^:]+)/.exec(url)?.[1] ?? '';
    rec.model = model;
    rec.stream = !!body.stream;
    rec.tools = Array.isArray(body.tools) && body.tools.length > 0;
    const fam = familyOf(model);
    const level: string = body.generation_config?.thinking_level ?? 'medium';
    rec.thinking = body.generation_config?.thinking_level ?? '(default)';
    // Free-tier per-minute limit per model.
    const list = (used.get(model) ?? []).filter((t) => now() - t < 60_000);
    used.set(model, list);
    if (list.length >= rpm[fam]) {
      await wait(rtt);
      aborted();
      const retry = Math.max(1, Math.ceil((60_000 - (now() - list[0])) / 1000));
      rec.status = 429;
      rec.headers = rec.end = now() - t0;
      const message = `Rate limit exceeded for model ${model} (limit: ${rpm[fam]} requests per minute on Free Tier). Please retry in ${retry}s`;
      return json(429, [
        {
          error: {
            code: 429,
            message,
            status: 'RESOURCE_EXHAUSTED',
            details: [
              { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests', quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier', quotaDimensions: { location: 'global', model }, quotaValue: String(rpm[fam]) }] },
              { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: `${retry}s` },
            ],
          },
        },
      ]);
    }
    list.push(now());
    const input = body.input;
    const steps: any[] = typeof input === 'string' ? [{ type: 'user_input', content: [{ type: 'text', text: input }] }] : Array.isArray(input) ? input : [];
    let prompt = '';
    for (let i = steps.length - 1; i >= 0; i--)
      if (steps[i]?.type === 'user_input') {
        prompt = (steps[i].content ?? []).map((c: any) => c.text ?? '').join('');
        break;
      }
    const system = String(body.system_instruction ?? '');
    const reply: SimReply = o.answer?.({ model, body, prompt, system, steps }) ?? { text: 'OK' };
    const inKB = (String(init.body ?? '').length) / 1024;
    const thinkMs = think(fam, level) + inKB * (o.msPerInputKB ?? 6);
    const text = reply.text ?? '';
    const tokens = Math.max(1, Math.ceil(text.length / 4));
    const genMs = (tokens / tps[fam]) * 1000;
    const outSteps: any[] = [];
    if (reply.calls?.length) for (const [i, c] of reply.calls.entries()) outSteps.push({ type: 'function_call', id: `fc_${log.length}_${i}`, name: c.name, arguments: c.args });
    else outSteps.push({ type: 'model_output', content: [{ type: 'text', text }] });
    const status = reply.calls?.length ? 'requires_action' : 'completed';
    if (!body.stream) {
      await wait(rtt + thinkMs + (reply.calls?.length ? 80 : genMs));
      aborted();
      rec.status = 200;
      rec.headers = rec.firstText = rec.end = now() - t0;
      return json(200, { id: `int_${log.length}`, status, steps: [{ type: 'thought', signature: 'sig' }, ...outSteps] });
    }
    // Streamed: headers after the round trip, then events as they are generated.
    await wait(rtt);
    aborted();
    rec.status = 200;
    rec.headers = now() - t0;
    const enc = new TextEncoder();
    const ev = (x: unknown) => enc.encode(`data: ${JSON.stringify(x)}\n\n`);
    const chunks = reply.calls?.length ? [] : text.match(/[\s\S]{1,80}/g) ?? [''];
    const stream = new ReadableStream<Uint8Array>({
      async start(c) {
        try {
          c.enqueue(ev({ event_type: 'interaction.created', interaction: { id: `int_${log.length}`, status: 'in_progress' } }));
          await wait(thinkMs);
          c.enqueue(ev({ event_type: 'step.start', index: 0, step: { type: 'thought' } }));
          c.enqueue(ev({ event_type: 'step.delta', index: 0, delta: { type: 'thought_signature', signature: 'sig' } }));
          c.enqueue(ev({ event_type: 'step.stop', index: 0 }));
          if (reply.calls?.length) {
            reply.calls.forEach((call, i) => {
              const idx = i + 1;
              c.enqueue(ev({ event_type: 'step.start', index: idx, step: { type: 'function_call', id: `fc_${log.length}_${i}`, name: call.name, arguments: {} } }));
              c.enqueue(ev({ event_type: 'step.delta', index: idx, delta: { type: 'arguments_delta', arguments: JSON.stringify(call.args) } }));
              c.enqueue(ev({ event_type: 'step.stop', index: idx }));
            });
            await wait(80);
          } else {
            c.enqueue(ev({ event_type: 'step.start', index: 1, step: { type: 'model_output', content: [] } }));
            for (const [i, piece] of chunks.entries()) {
              if (i) await wait((20 / tps[fam]) * 1000);
              if (i === 0) rec.firstText = now() - t0;
              c.enqueue(ev({ event_type: 'step.delta', index: 1, delta: { type: 'text', text: piece } }));
            }
            c.enqueue(ev({ event_type: 'step.stop', index: 1 }));
          }
          c.enqueue(ev({ event_type: 'interaction.completed', interaction: { id: `int_${log.length}`, status } }));
          c.enqueue(enc.encode('data: [DONE]\n\n'));
          rec.end = now() - t0;
          c.close();
        } catch (e) {
          c.error(e);
        }
      },
    });
    return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
  }

  const fetchFn = async (url: string | URL | Request, init?: RequestInit) => handle(String(url), init ?? {});
  return { fetch: fetchFn, log, preuse, used };
}
