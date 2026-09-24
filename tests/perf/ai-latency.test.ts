// AI timing harness: where does the time go in Test connection, Explain with AI, the Socius assistant
// and coding suggestions? Runs the real code (settings, model choice, pacing, the agent loop, real
// assistant tools on the sample survey) against a simulated Gemini with realistic latencies and the
// free tier's per-minute limits (tests/perf/gemini-sim.ts), on vitest's fake clock.
//
// Prints a table (set AI_TIMING_OUT=/path.json to also save it) and asserts the targets: first text
// within about 2 s, rate limits waited out instead of failing, no model list on a warm start.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStorage } from '../platform/helpers';
import { geminiSim, type SimOptions, type SimReply } from './gemini-sim';
import type { Dataset } from '../../src/core/types';

const SAV = fileURLToPath(new URL('../../src/samples/urban_trust_survey.sav', import.meta.url));
const KEY = 'AQ.Ab8RN6LfakeHarnessKey_abcdefghijklmnopqrstuvwxyz0123456789';

let base: Dataset;
let store: ReturnType<typeof memoryStorage>;

interface Row {
  scenario: string;
  outcome: string;
  firstText?: number;
  done: number;
  lists: number;
  generates: number;
  limited: number;
  thinking: string;
}
const rows: Row[] = [];

beforeAll(async () => {
  const { importFile } = await import('../../src/lib/io');
  base = (await importFile('urban_trust_survey.sav', new Uint8Array(readFileSync(SAV)))).dataset;
});

beforeEach(() => {
  store = memoryStorage();
  vi.stubGlobal('localStorage', store);
  vi.stubGlobal('sessionStorage', memoryStorage());
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

afterAll(() => {
  const fmt = (ms?: number) => (ms === undefined ? '   -' : `${(ms / 1000).toFixed(1).padStart(5)} s`);
  const lines = [
    'scenario'.padEnd(58) + 'outcome'.padEnd(26) + 'first text  done      lists gens 429s thinking',
    ...rows.map((r) => r.scenario.padEnd(58) + r.outcome.slice(0, 25).padEnd(26) + `${fmt(r.firstText)}   ${fmt(r.done)}   ${String(r.lists).padStart(3)} ${String(r.generates).padStart(4)} ${String(r.limited).padStart(4)}  ${r.thinking}`),
  ];
  console.log(`\nAI timing harness (simulated Gemini, fake clock)\n${lines.join('\n')}\n`);
  if (process.env.AI_TIMING_OUT) writeFileSync(process.env.AI_TIMING_OUT, JSON.stringify(rows, null, 2));
});

/** Run a promise to completion on the fake clock: let real work settle, then jump to the next timer. */
async function settle<T>(p: Promise<T>): Promise<{ value?: T; error?: any }> {
  let done = false;
  let value: T | undefined;
  let error: any;
  p.then(
    (v) => {
      done = true;
      value = v;
    },
    (e) => {
      done = true;
      error = e;
    },
  );
  for (let i = 0; i < 20_000 && !done; i++) {
    for (let k = 0; k < 4 && !done; k++) await new Promise((r) => setImmediate(r));
    if (done) break;
    if (vi.getTimerCount() > 0) await vi.advanceTimersToNextTimerAsync();
  }
  if (!done) throw new Error('did not finish');
  return { value, error };
}

async function fresh(settings: Record<string, unknown>) {
  store.setItem('socius.ai', JSON.stringify(settings));
  const ai = await import('../../src/platform/ai');
  const http = await import('../../src/platform/ai-http');
  const pace = await import('../../src/platform/ai-pace');
  http.__resetGeminiState();
  pace.__resetPace();
  ai.__reloadAiSettings();
  return ai;
}

function install(o: SimOptions) {
  const sim = geminiSim(o);
  vi.stubGlobal('fetch', vi.fn(sim.fetch));
  return sim;
}

function record(scenario: string, sim: ReturnType<typeof geminiSim>, t0: number, r: { error?: any }, firstText?: number, extra = '') {
  const gens = sim.log.filter((x) => x.kind === 'generate');
  const row: Row = {
    scenario,
    outcome: r.error ? `failed: ${r.error.code ?? r.error.message}` : `ok${extra}`,
    firstText: firstText !== undefined ? firstText - t0 : undefined,
    done: Date.now() - t0,
    lists: sim.log.filter((x) => x.kind === 'list').length,
    generates: gens.filter((x) => x.status !== 429).length,
    limited: gens.filter((x) => x.status === 429).length,
    thinking: [...new Set(gens.map((x) => `${x.model?.replace('gemini-', '')}:${x.thinking}`))].join(', '),
  };
  rows.push(row);
  return row;
}

const EXPLAIN_PROMPT = `You explain statistical results to a sociology student.\n\n${'Table: Crosstabulation of trust by gender, counts and column percentages. '.repeat(80)}\n\nExplain this result.`;
const EXPLANATION = 'This crosstab compares how much people trust their neighbours across genders. '.repeat(30);

const explainAnswer: SimOptions['answer'] = ({ prompt }) => (/single word OK/.test(prompt) ? { text: 'OK' } : { text: EXPLANATION });

// ---------- Test connection ----------

describe('Test connection', () => {
  it("owner's case: Automatic Flash, Flash already used 5 times this minute", async () => {
    await fresh({ provider: 'gemini', gemini: { apiKey: KEY, model: 'auto-flash' } });
    const sim = install({ answer: explainAnswer });
    sim.preuse('gemini-3.8-flash', 5);
    const { runConnectionCheck } = await import('../../src/platform/ai-diagnose');
    const t0 = Date.now();
    const r = await settle(runConnectionCheck());
    const row = record('Test connection: saved "auto-flash", Flash at its 5/min limit', sim, t0, { error: r.value?.ok ? undefined : r.value?.error });
    // After the change the saved Flash preference becomes Flash-Lite, which has room: connected.
    expect(r.value?.ok).toBe(true);
    expect(row.done).toBeLessThan(3_000);
  });

  it('default setting, cold page', async () => {
    await fresh({ provider: 'gemini', gemini: { apiKey: KEY, model: '' } });
    const sim = install({ answer: explainAnswer });
    const { runConnectionCheck } = await import('../../src/platform/ai-diagnose');
    const t0 = Date.now();
    const r = await settle(runConnectionCheck());
    const row = record('Test connection: default, cold page', sim, t0, { error: r.value?.ok ? undefined : r.value?.error });
    expect(r.value?.ok).toBe(true);
    expect(row.done).toBeLessThan(2_000);
  });

  it('explicit Flash chosen, at its limit: waits with a countdown, then connects', async () => {
    await fresh({ v: 2, provider: 'gemini', gemini: { apiKey: KEY, model: 'auto-flash' } });
    const sim = install({ answer: explainAnswer });
    // As in the owner's log: the limit frees up in 11 s.
    sim.preuse('gemini-3.8-flash', 5, 49_000);
    const { runConnectionCheck } = await import('../../src/platform/ai-diagnose');
    const timing = await import('../../src/platform/ai-timing');
    const labels = new Set<string>();
    const unsub = timing.subscribeAiActivity(() => {
      const a = timing.getAiActivity();
      if (a) labels.add(a.label.replace(/\d+ s/, 'N s'));
    });
    const t0 = Date.now();
    const r = await settle(runConnectionCheck());
    unsub();
    record('Test connection: Flash chosen after the change, at its limit', sim, t0, { error: r.value?.ok ? undefined : r.value?.error });
    expect(r.value?.ok).toBe(true);
    expect([...labels].some((l) => /Waiting N s for Google's free limit/.test(l))).toBe(true);
  });
});

// ---------- Explain with AI ----------

describe('Explain with AI', () => {
  for (const [label, model, warm] of [
    ['Explain: default, first AI use ever', '', 'no'],
    ['Explain: default, new page load (AI used yesterday)', '', 'reload'],
    ['Explain: default, warm (second request)', '', 'yes'],
    ['Explain: Flash chosen, warm', 'auto-flash', 'yes'],
  ] as const) {
    it(label, async () => {
      const ai = await fresh({ v: 2, provider: 'gemini', gemini: { apiKey: KEY, model } });
      const sim = install({ answer: explainAnswer });
      if (warm !== 'no') await settle(ai.askAI('Reply with the single word OK.'));
      if (warm === 'reload') {
        const http = await import('../../src/platform/ai-http');
        const pace = await import('../../src/platform/ai-pace');
        http.__resetGeminiState({ reload: true });
        pace.__resetPace();
        ai.__reloadAiSettings();
      }
      sim.log.length = 0;
      let first: number | undefined;
      const t0 = Date.now();
      const r = await settle(ai.askAI(EXPLAIN_PROMPT, { onText: () => (first ??= Date.now()) }));
      const row = record(label, sim, t0, r, first);
      expect(r.error).toBeUndefined();
      if (warm !== 'no') expect(row.lists).toBe(0);
      // First words on screen quickly: Flash-Lite within 1.5 s, Flash (low thinking) within 2.5 s.
      expect(row.firstText!).toBeLessThan(model ? 2_500 : 1_500);
    });
  }
});

// ---------- the Socius assistant ----------

const NEEDS: Record<string, Array<{ name: string; args: Record<string, unknown> }>> = {
  describe: [
    { name: 'get_dataset_overview', args: {} },
    { name: 'describe_variables', args: { names: ['trust5', 'gender', 'life_sat'] } },
  ],
  related: [
    { name: 'get_dataset_overview', args: {} },
    { name: 'run_analysis', args: { procedure_id: 'crosstabs', variables: { rows: ['gender'], columns: ['trust5'] } } },
  ],
};

/** A model that needs certain tool results before answering; it reads an overview already in the system prompt. */
const assistantAnswer: SimOptions['answer'] = ({ prompt, system, steps }) => {
  const kind = /related/i.test(prompt) ? 'related' : 'describe';
  const lastUser = steps.map((s) => s.type).lastIndexOf('user_input');
  const have = new Set(steps.slice(lastUser).filter((s) => s.type === 'function_result').map((s) => s.name));
  if (/Already looked up for this question/.test(system) && /dataset overview/i.test(system)) have.add('get_dataset_overview');
  const missing = NEEDS[kind].filter((c) => !have.has(c.name));
  if (missing.length) return { calls: [missing[0]] } satisfies SimReply;
  return { text: 'The sample has 640 respondents. Trust in neighbours differs a little by gender. '.repeat(12) };
};

async function askAssistant(question: string) {
  const { useStore } = await import('../../src/core/store');
  const { useAssistantChat } = await import('../../src/features/assistant/chat-store');
  const { sendMessage } = await import('../../src/features/assistant/controller');
  useStore.setState({ dataset: base });
  let first: number | undefined;
  const unsub = useAssistantChat.subscribe((s) => {
    const last = s.entries[s.entries.length - 1];
    if (first === undefined && last?.role === 'assistant' && last.text) first = Date.now();
  });
  const t0 = Date.now();
  const r = await settle(sendMessage(question));
  unsub();
  const last = useAssistantChat.getState().entries.at(-1)!;
  return { t0, first, r, entry: last, reset: () => useAssistantChat.setState({ entries: [], history: [], running: false, controller: null }) };
}

describe('Socius assistant', () => {
  for (const [label, q] of [
    ['Assistant: "Describe my dataset", cold page', 'Describe my dataset'],
    ['Assistant: "Is trust related to gender?", cold page', 'Is trust related to gender?'],
  ] as const) {
    it(label, async () => {
      await fresh({ v: 2, provider: 'gemini', gemini: { apiKey: KEY, model: '' } });
      const sim = install({ answer: assistantAnswer });
      const { t0, first, r, entry, reset } = await askAssistant(q);
      const row = record(label, sim, t0, { error: entry.status === 'error' ? { code: entry.error } : r.error }, first, ` (${sim.log.filter((x) => x.kind === 'generate' && x.status === 200).length} rounds)`);
      reset();
      expect(entry.status).toBe('done');
      expect(row.generates).toBeLessThanOrEqual(2);
      expect(row.done).toBeLessThan(4_000);
    });
  }

  it('Assistant: 4 questions in a row with Flash chosen (5/min free limit)', async () => {
    await fresh({ v: 2, provider: 'gemini', gemini: { apiKey: KEY, model: 'auto-flash' } });
    const sim = install({ answer: assistantAnswer });
    let firstT0 = 0;
    let lastEntry: any;
    for (let i = 0; i < 4; i++) {
      const res = await askAssistant(i % 2 ? 'Is trust related to gender?' : 'Describe my dataset');
      if (!i) firstT0 = res.t0;
      lastEntry = res.entry;
      expect(res.entry.status).toBe('done');
      res.reset();
    }
    record('Assistant: 4 questions in a row, Flash chosen', sim, firstT0, { error: lastEntry.status === 'error' ? { code: lastEntry.error } : undefined });
  });
});

// ---------- coding suggestions ----------

describe('Coding suggestions (JSON batches)', () => {
  it('Coding: 20 batches of suggestions (more than 15 a minute)', async () => {
    const ai = await fresh({ v: 2, provider: 'gemini', gemini: { apiKey: KEY, model: '' } });
    const sim = install({ answer: () => ({ text: JSON.stringify({ suggestions: Array.from({ length: 12 }, (_, i) => ({ id: `r${i + 1}`, codes: ['c1', 'c2'] })) }) }) });
    const t0 = Date.now();
    let error: any;
    let done = 0;
    for (let b = 0; b < 20; b++) {
      const r = await settle(ai.askAIJson(`Code these answers, batch ${b}. ${'Answer text. '.repeat(300)}`));
      if (r.error) {
        error = r.error;
        break;
      }
      done++;
    }
    record('Coding: 20 suggestion batches, default', sim, t0, { error }, undefined, ` (${done} batches)`);
    expect(error).toBeUndefined();
    expect(done).toBe(20);
  });
});
