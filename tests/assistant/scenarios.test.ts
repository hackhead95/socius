// Evaluation suite for the Socius assistant: realistic research questions on the bundled sample survey,
// answered by a scripted fake model through the real agent loop, real tools and the real store.
// Checks which tools are called with which arguments, that the numbers passed back to the model match
// Socius's own procedures, the guardrails (disabled case access, proposals never applied silently),
// and the loop's limits (errors, rate limits, Stop, round limit, budget).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { emptyCodingProject, type CodingProject } from '../../src/core/coding-types';
import type { OutputItem, OutputTable } from '../../src/core/output';
import { defaultOptions } from '../../src/core/procedure';
import { useStore } from '../../src/core/store';
import type { Dataset } from '../../src/core/types';
import { importFile } from '../../src/lib/io';
import { procedures } from '../../src/procedures';
import { runAgent, fitMessages, type HostedDriver, type NativeDriver, type RunInput, type TextDriver } from '../../src/lib/assistant/agent';
import { addToOutput, applyProposal } from '../../src/lib/assistant/actions';
import { systemPrompt, compactSystemPrompt } from '../../src/lib/assistant/prompt';
import { RateLimiter } from '../../src/lib/assistant/rate-limit';
import { allTools, compactTools } from '../../src/lib/assistant/tools';
import { DEFAULT_PERMISSIONS, type AppSnapshot, type AssistantPermissions, type Proposal } from '../../src/lib/assistant/types';
import { selectCasesTransform } from '../../src/lib/transform';
import { buildWorkedExample } from '../../src/lib/coding/example';
import { codeByAttribute } from '../../src/lib/coding/analysis';
import { descendantIds } from '../../src/lib/coding/tree';
import { AiUnavailableError } from '../../src/platform/claude';
import type { ChatMessage, ModelTurn, ToolResultMsg, ToolTurnOptions } from '../../src/platform/ai-tools';
import { useAssistantChat } from '../../src/features/assistant/chat-store';
import { retryLast, runArtifact, sendMessage, stopAssistant } from '../../src/features/assistant/controller';

const SAV = fileURLToPath(new URL('../../src/samples/urban_trust_survey.sav', import.meta.url));
let base: Dataset;

beforeAll(async () => {
  base = (await importFile('urban_trust_survey.sav', new Uint8Array(readFileSync(SAV)))).dataset;
});

// ---------- helpers ----------

function vid(ds: Dataset, name: string): string {
  const v = ds.variables.find((x) => x.name === name);
  if (!v) throw new Error(`no variable ${name}`);
  return v.id;
}

/** Run a procedure exactly as its dialog does (the reference the assistant must match). */
function runProc(ds: Dataset, id: string, slots: Record<string, string[]>, opts: Record<string, unknown> = {}): OutputItem {
  const def = procedures.find((p) => p.id === id)!;
  const s = Object.fromEntries(Object.entries(slots).map(([k, names]) => [k, names.map((n) => vid(ds, n))]));
  return def.run(ds, s, { ...defaultOptions(def), ...opts });
}

const apaOf = (item: OutputItem) => (item.blocks.find((b) => b.kind === 'text' && b.style === 'apa') as { text: string } | undefined)?.text ?? '';
const tableOf = (item: OutputItem, title: string) => (item.blocks.find((b) => b.kind === 'table' && b.table.title === title) as { table: OutputTable } | undefined)?.table;

type Step = (s: { messages: ChatMessage[]; results: ToolResultMsg[]; opts: ToolTurnOptions; round: number }) => ModelTurn | Promise<ModelTurn>;

interface FakeModel extends NativeDriver {
  calls: ToolTurnOptions[];
}

/** A scripted model: step i answers request i (the last step repeats). */
function fakeModel(steps: Step[], budget = { maxPromptBytes: 90_000, maxToolResultBytes: 9_000 }): FakeModel {
  const calls: ToolTurnOptions[] = [];
  let i = 0;
  const d: FakeModel = {
    kind: 'native',
    name: 'fake',
    budget,
    calls,
    turn: async (opts) => {
      calls.push({ ...opts, messages: [...opts.messages] });
      const lastTool = [...opts.messages].reverse().find((m) => m.role === 'tool') as Extract<ChatMessage, { role: 'tool' }> | undefined;
      const round = i++;
      return steps[Math.min(round, steps.length - 1)]({ messages: opts.messages, results: lastTool?.results ?? [], opts, round });
    },
  };
  return d;
}

let seq = 0;
const call = (...cs: Array<[string, Record<string, unknown>]>): ModelTurn => ({ text: '', toolCalls: cs.map(([name, args]) => ({ id: `call_${++seq}`, name, args })) });
const say = (text: string): ModelTurn => ({ text, toolCalls: [] });

function snap(ds: Dataset | null, extra: Partial<AppSnapshot> = {}): AppSnapshot {
  return { dataset: ds, outputs: [], coding: emptyCodingProject(), tab: 'data', ...extra };
}

async function scenario(driver: NativeDriver | TextDriver | HostedDriver, user: string, o: { snapshot?: AppSnapshot; permissions?: AssistantPermissions; history?: ChatMessage[]; focusOutput?: OutputItem; extra?: Partial<RunInput> } = {}) {
  const snapshot = o.snapshot ?? snap(base);
  const permissions = o.permissions ?? { ...DEFAULT_PERMISSIONS };
  const pctx = { snapshot, permissions, focusOutput: o.focusOutput, providerLabel: 'Fake model' };
  const system = driver.compact ? compactSystemPrompt(pctx) : systemPrompt(pctx);
  const steps: string[] = [];
  const artifacts: unknown[] = [];
  const res = await runAgent({
    driver,
    system,
    history: o.history ?? [],
    user,
    tools: driver.compact ? compactTools(snapshot.tab) : allTools(),
    ctx: { state: () => snapshot, permissions, maxResultBytes: driver.budget.maxToolResultBytes },
    events: { onStep: (s) => steps.push(`${s.status}:${s.label}`), onArtifact: (a) => artifacts.push(a) },
    sleep: async () => undefined,
    ...o.extra,
  });
  return { res, system, steps, artifacts };
}

// ---------- scenarios ----------

describe('Scenario 1: "Describe my data"', () => {
  it('looks at the overview, then key variables; the numbers match Descriptives', async () => {
    const model = fakeModel([
      () => call(['get_dataset_overview', {}]),
      ({ results }) => {
        expect(results[0].content).toContain('640 cases');
        expect(results[0].content).toContain('no filter');
        expect(results[0].content).toMatch(/trust1 "Most people in this neighbourhood can be trusted" \[numeric, ordinal\]/);
        expect(results[0].content).toContain('missing codes: 8, 9');
        return call(['describe_variables', { names: ['hh_income', 'life_sat', 'trust5'] }]);
      },
      ({ results }) => {
        const mean = /hh_income[\s\S]*?Mean = ([\d.]+)/.exec(results[0].content)![1];
        return say(`## Your data\n640 respondents. Mean household income is ${mean} INR (Descriptives).`);
      },
    ]);
    const { res, system } = await scenario(model, 'Describe my dataset');
    expect(res.toolCalls.map((c) => c.name)).toEqual(['get_dataset_overview', 'describe_variables']);
    // The reference: Descriptives on hh_income (user-missing 999999 excluded).
    const ref = runProc(base, 'descriptives', { variables: ['hh_income'] });
    const row = tableOf(ref, 'Descriptive Statistics')!.rows[0];
    const mean = row.find((c) => typeof c.v === 'number' && c.v > 1000 && c.v < 100000 && c.fmt !== 'int')!.v as number;
    expect(res.text).toContain(String(+mean.toFixed(3)));
    expect(res.toolCalls[1].result).toContain('999999 (Refused): 33');
    expect(res.toolCalls[1].result).toMatch(/strongly skewed/);
    // The system prompt carries the guardrails and the live context.
    expect(system).toContain('Never invent numbers');
    expect(system).toContain('Dataset "urban_trust_survey"');
    expect(system).toContain('**Analyze > Compare Means > Independent-Samples T Test**');
  });
});

describe('Scenario 2: "Which test for trust5 by gender?"', () => {
  it('inspects measurement levels and categories before recommending anything', async () => {
    const model = fakeModel([
      () => call(['describe_variables', { names: 'trust5, gender' }]), // a string list is accepted
      ({ results }) => {
        const r = results[0].content;
        const ordinal = /trust5 .*\[numeric, ordinal\]/.test(r);
        const threeGroups = /3 = Other \/ prefer to self-describe: 19/.test(r);
        return say(ordinal && threeGroups ? 'trust5 is ordinal and gender has 3 groups (one with 19 people): use Kruskal-Wallis H (Analyze > Nonparametric Tests), or Crosstabs.' : 'unexpected');
      },
    ]);
    const { res } = await scenario(model, 'Which test should I use to compare trust5 by gender?');
    expect(res.toolCalls[0]).toMatchObject({ name: 'describe_variables', ok: true });
    expect(res.text).toMatch(/Kruskal-Wallis/);
    expect(res.toolCalls.some((c) => c.name === 'run_analysis')).toBe(false);
  });
});

describe('Scenario 3: crosstab and interpret', () => {
  it('runs Crosstabs on the live data; the chi-square matches the procedure; Add to Output is a separate click', async () => {
    const model = fakeModel([
      () => call(['run_analysis', { procedure_id: 'crosstabs', variables: { rows: ['gender'], columns: ['trust5'] } }]),
      ({ results }) => {
        const apa = /APA sentence: (.*)/.exec(results[0].content)![1];
        return say(`Women feel less safe after dark. ${apa} (Crosstabs of gender by trust5)`);
      },
    ]);
    const { res, artifacts } = await scenario(model, 'Is gender related to feeling safe after dark (trust5)?');
    const ref = runProc(base, 'crosstabs', { rows: ['gender'], columns: ['trust5'] });
    expect(res.text).toContain(apaOf(ref));
    expect(apaOf(ref)).toContain('χ²(8, N = 630) = 35.02');
    expect(res.toolCalls[0].result).toContain('3 cells (20.0%) have expected count less than 5');
    expect(artifacts).toHaveLength(1);
    // Not in the Output tab until the user clicks.
    const outputs: OutputItem[] = [];
    const store = () => ({ outputs, addOutput: (i: OutputItem) => void outputs.push(i) });
    expect(outputs).toHaveLength(0);
    addToOutput((artifacts[0] as { item: OutputItem }).item, store as never);
    expect(outputs).toHaveLength(1);
    expect(apaOf(outputs[0])).toBe(apaOf(ref));
  });
});

describe('Scenario 4: t-test life_sat by migrant', () => {
  it('fills in the two groups automatically and passes back the same t, df and d as the dialog', async () => {
    const model = fakeModel([
      () => call(['run_analysis', { procedure_id: 'ttest-independent', variables: { variables: ['life_sat'], group: ['migrant'] } }]),
      ({ results }) => say(/t\(628\) = 4\.51, p < \.001, d = 0\.36/.test(results[0].content) ? 'People born in the city are more satisfied, t(628) = 4.51, p < .001, d = 0.36 (small).' : 'mismatch'),
    ]);
    const { res } = await scenario(model, 'Do migrants differ in life satisfaction?');
    const ref = runProc(base, 'ttest-independent', { variables: ['life_sat'], group: ['migrant'] }, { groups: [0, 1] });
    expect(res.toolCalls[0].result).toContain(apaOf(ref));
    expect(res.toolCalls[0].result).toContain('Groups compared: 0 = Born in this city and 1 = Migrated');
    expect(res.text).toContain('t(628) = 4.51');
  });

  it('asks for two groups (or suggests ANOVA / Kruskal-Wallis) when the grouping variable has three', async () => {
    const model = fakeModel([() => call(['run_analysis', { procedure_id: 'ttest-independent', variables: { variables: ['life_sat'], group: ['gender'] } }]), () => say('Gender has three groups; use One-Way ANOVA.')]);
    const { res } = await scenario(model, 't-test life_sat by gender');
    expect(res.toolCalls[0].ok).toBe(false);
    expect(res.toolCalls[0].result).toMatch(/gender has 3 groups.*One-Way ANOVA \(oneway-anova\) or Kruskal-Wallis/);
  });
});

describe('Scenario 5: regression with dummies', () => {
  it('runs Linear Regression with categorical predictors dummy-coded; R squared matches', async () => {
    const args = { procedure_id: 'models.linear', variables: { dependent: ['life_sat'], block1: ['age', 'gender', 'migrant', 'educ'] }, options: [{ key: 'reference', value: 'first' }] };
    const model = fakeModel([() => call(['run_analysis', args]), () => say('Done.')]);
    const { res } = await scenario(model, 'Which factors predict life satisfaction? Use age, gender, migrant and education.');
    const ref = runProc(base, 'models.linear', { dependent: ['life_sat'], block1: ['age', 'gender', 'migrant', 'educ'] }, { reference: 'first' });
    const out = res.toolCalls[0].result;
    expect(res.toolCalls[0].ok).toBe(true);
    expect(out).toContain(apaOf(ref));
    expect(out).toMatch(/Woman/); // a dummy for gender = Woman (reference: first category)
    expect(out).toContain('Coefficients');
  });
});

describe('Scenario 6: reliability of the trust items', () => {
  it('surfaces the trust3 reverse-coding warning, then proposes a reverse-code that only applies on click', async () => {
    const model = fakeModel([
      () => call(['run_analysis', { procedure_id: 'models.reliability', variables: { items: ['trust1', 'trust2', 'trust3', 'trust4', 'trust5'] } }]),
      ({ results }) => {
        expect(results[0].content).toMatch(/WARNING: trust3 correlates negatively/);
        return call(['propose_transform', { kind: 'reverse', items: ['trust3'] }]);
      },
      ({ results }) => say(results[0].content.startsWith('PROPOSED, NOT APPLIED') ? 'trust3 is worded negatively. Check the preview and click Apply to create trust3_r.' : 'bad'),
    ]);
    const store = testStore(base);
    const { res, artifacts } = await scenario(model, 'Is my trust scale reliable?');
    expect(res.toolCalls[0].result).toMatch(/Cronbach's Alpha[\s\S]*\.315/);
    const p = (artifacts.find((a: any) => a.kind === 'proposal') as { proposal: Proposal }).proposal;
    expect(p.kind).toBe('transform');
    expect(store.get().dataset).toBe(base); // nothing changed yet
    const r = applyProposal(p, store.api);
    expect(r.ok).toBe(true);
    const after = store.get().dataset!;
    expect(after.variables.some((v) => v.name === 'trust3_r')).toBe(true);
    expect(store.get().outputs.at(-1)?.procedure).toBe('transform');
    store.undo();
    expect(store.get().dataset).toBe(base);
  });
});

describe('Scenario 7: weighted vs unweighted', () => {
  it('reports weighted counts when a weight is on, matching Frequencies with WEIGHT BY wt', async () => {
    const weighted: Dataset = { ...base, weightVarId: vid(base, 'wt') };
    const model = fakeModel([() => call(['describe_variables', { names: ['gender'] }]), () => say('ok')]);
    const { res, system } = await scenario(model, 'How many women are there?', { snapshot: snap(weighted) });
    expect(system).toMatch(/WEIGHTED by wt/);
    const out = res.toolCalls[0].result;
    expect(out).toContain('(weighted)');
    const ref = runProc(weighted, 'frequencies', { variables: ['gender'] });
    const t = ref.blocks.find((b) => b.kind === 'table' && b.table.rows.some((r) => r.some((c) => c.v === 'Woman'))) as { table: OutputTable };
    const row = t.table.rows.find((r) => r.some((c) => c.v === 'Woman'))!;
    const count = row.find((c) => typeof c.v === 'number')!.v as number;
    expect(out).toContain(`2 = Woman: ${count.toFixed(1)}`);
    // Unweighted, the same question gives whole-number counts.
    const model2 = fakeModel([() => call(['describe_variables', { names: ['gender'] }]), () => say('ok')]);
    const { res: res2 } = await scenario(model2, 'How many women are there?');
    expect(res2.toolCalls[0].result).toContain('2 = Woman: 295 (46.1%)');
  });
});

describe('Scenario 8: filter active', () => {
  it('says the filter is on and analyses only the selected cases', async () => {
    const filtered = selectCasesTransform(base, { kind: 'if', condition: 'gender = 2' }, 'filter').dataset;
    const model = fakeModel([() => call(['get_dataset_overview', {}], ['run_analysis', { procedure_id: 'frequencies', variables: { variables: ['trust5'] } }]), () => say('ok')]);
    const { res, system } = await scenario(model, 'Describe trust5', { snapshot: snap(filtered) });
    expect(system).toMatch(/FILTER ON \(by filter_\$\): 295 of 640 cases/);
    expect(res.toolCalls[0].result).toContain('FILTER ON');
    expect(res.toolCalls[0].result).toContain('THIS IS THE FILTER VARIABLE');
    const ref = runProc(filtered, 'frequencies', { variables: ['trust5'] });
    expect(res.toolCalls[1].result).toContain(`Cases: ${ref.caseNote}`);
  });
});

describe('Scenario 9: missing-value codes 8 and 9', () => {
  it('excludes declared codes from valid N, and flags them when they are not declared', async () => {
    const model = fakeModel([() => call(['describe_variables', { names: ['trust1'] }]), () => say('ok')]);
    const { res } = await scenario(model, 'How many did not answer trust1?');
    expect(res.toolCalls[0].result).toMatch(/missing = \d+ .*\[8 \(Don't know\): \d+, 9 \(Refused\): \d+\]/);
    expect(res.toolCalls[0].result).not.toMatch(/- 8 = Don't know/);
    const undeclared: Dataset = { ...base, variables: base.variables.map((v) => (v.name === 'trust1' ? { ...v, missing: { discrete: [] } } : v)) };
    const model2 = fakeModel([() => call(['get_dataset_overview', {}]), () => say('ok')]);
    const { res: res2 } = await scenario(model2, 'Which variables need cleaning?', { snapshot: snap(undeclared) });
    expect(res2.toolCalls[0].result).toMatch(/trust1 .*FLAGS: value label\(s\) 8="Don't know", 9="Refused" look like missing-data codes but are NOT declared missing/);
  });
});

describe('Scenario 10: individual cases are off by default', () => {
  it('get_cases returns a disabled message and no values; with permission it returns rows', async () => {
    const model = fakeModel([() => call(['get_cases', { variables: ['age', 'hh_income'], limit: 5 }]), ({ results }) => say(results[0].content.startsWith('DISABLED') ? 'I cannot see individual cases; you can switch them on under "What the assistant can see".' : 'x')]);
    const { res, system } = await scenario(model, 'Show me the first five respondents');
    expect(system).toContain('individual cases OFF');
    expect(res.toolCalls[0].result).toMatch(/^DISABLED/);
    expect(res.toolCalls[0].result).not.toMatch(/\b(43|19|35)\b/); // no ages leak
    expect(res.text).toContain('What the assistant can see');
    const model2 = fakeModel([() => call(['get_cases', { variables: ['age'], limit: 3 }]), () => say('ok')]);
    const { res: res2 } = await scenario(model2, 'Show me three cases', { permissions: { ...DEFAULT_PERMISSIONS, cases: true } });
    expect(res2.toolCalls[0].result).toMatch(/case \| age\n1 \| 43\n2 \| 19\n3 \| 35/);
  });
});

describe('Scenario 11: a how-do-I question', () => {
  it('answers from the guide via search_help, with the exact menu path', async () => {
    const model = fakeModel([() => call(['search_help', { query: 'How do I weight my data?' }]), ({ results }) => say(results[0].content.includes('**Data > Weight cases**') ? 'Choose **Data > Weight cases**, pick wt, click OK.' : 'no')]);
    const { res } = await scenario(model, 'How do I weight my data?', { snapshot: snap(null) });
    expect(res.toolCalls[0].result).toContain('Weight cases');
    expect(res.text).toContain('**Data > Weight cases**');
  });
});

describe('Scenario 12: proposing a recode', () => {
  it('previews agegrp with checks and syntax; the store is untouched until Apply; Apply is undoable', async () => {
    const store = testStore(base);
    const rules = [
      { from: 'missing', to: 'sysmis' },
      { from: 'lowest thru 29', to: '1' },
      { from: '30 thru 44', to: '2' },
      { from: '45 thru 64', to: '3' },
      { from: '65 thru highest', to: '4' },
    ];
    const model = fakeModel([() => call(['propose_transform', { kind: 'recode', source: 'age', target: 'agegrp', label: 'Age group', rules, value_labels: [{ value: '1', label: '18-29' }, { value: '4', label: '65 and over' }] }]), () => say('Check the preview, then click Apply.')]);
    const { res, artifacts } = await scenario(model, 'Recode age into four groups', { snapshot: snap(store.get().dataset) });
    const out = res.toolCalls[0].result;
    expect(out).toMatch(/^PROPOSED, NOT APPLIED/);
    expect(out).toContain('RECODE age (MISSING=SYSMIS) (LOWEST THRU 29=1) (30 THRU 44=2) (45 THRU 64=3) (65 THRU HIGHEST=4) INTO agegrp.');
    expect(out).toContain('agegrp: 623 cases in use get a value');
    expect(out).not.toContain('CHECK:');
    expect(store.get().dataset).toBe(base);
    expect(store.get().dataset!.variables.some((v) => v.name === 'agegrp')).toBe(false);
    const p = (artifacts[0] as { proposal: Extract<Proposal, { kind: 'transform' }> }).proposal;
    expect(p.preview.columns).toEqual(['Case', 'age', 'agegrp (new)']);
    expect(p.preview.rows[1]).toEqual(['2', '19', '1 (18-29)']);
    expect(applyProposal(p, store.api).ok).toBe(true);
    const ag = store.get().dataset!.variables.find((v) => v.name === 'agegrp')!;
    expect(ag.label).toBe('Age group');
    store.undo();
    expect(store.get().dataset!.variables.some((v) => v.name === 'agegrp')).toBe(false);
  });

  it('warns when rules miss valid values or turn missing codes into answers; never overwrites a variable', async () => {
    const model = fakeModel([
      () => call(['propose_transform', { kind: 'recode', source: 'trust1', target: 'trust1_hi', rules: [{ from: '4 thru 5', to: '1' }, { from: 'else', to: '0' }] }], ['propose_transform', { kind: 'compute', target: 'age', expression: 'age + 1' }]),
      () => say('ok'),
    ]);
    const { res } = await scenario(model, 'Make a high-trust dummy');
    expect(res.toolCalls[0].result).toMatch(/CHECK: \d+ cases with a declared missing code in trust1 \(8, 9\) got a valid value/);
    expect(res.toolCalls[1].ok).toBe(false);
    expect(res.toolCalls[1].result).toMatch(/already exists.*only creates new variables/);
  });
});

describe('Scenario 13: tool errors are returned to the model, which recovers', () => {
  it('unknown tool, unknown analysis, misspelt variable and missing arguments come back as clear errors', async () => {
    const model = fakeModel([
      () => call(['delete_everything', {}], ['run_analysis', { procedure_id: 'chi-square', variables: { rows: ['gender'] } }], ['describe_variables', { names: ['trust_5'] }], ['run_analysis', { variables: {} }]),
      ({ results }) => {
        expect(results).toHaveLength(4);
        expect(results[0].content).toMatch(/no tool named "delete_everything"/);
        expect(results[1].content).toMatch(/procedure_id must be one of/);
        expect(results[2].content).toMatch(/no variable named "trust_5"\. Did you mean trust5/);
        expect(results[3].content).toMatch(/procedure_id is required/);
        return call(['run_analysis', { procedure_id: 'crosstabs', variables: { rows: ['gender'], columns: ['trust5'], group: ['x'] } }]);
      },
      ({ results }) => {
        expect(results[0].content).toMatch(/Crosstabs has no slot "group"/);
        return say('Recovered.');
      },
    ]);
    const { res, steps } = await scenario(model, 'Run a chi-square');
    expect(res.text).toBe('Recovered.');
    expect(res.toolCalls.filter((c) => !c.ok)).toHaveLength(5);
    expect(steps.filter((s) => s.startsWith('error:')).length).toBeGreaterThanOrEqual(5);
  });
});

describe('Scenario 14: rate limits', () => {
  it('backs off once on 429 with the service delay, then continues', async () => {
    let n = 0;
    const slept: number[] = [];
    const model = fakeModel([
      () => {
        if (n++ === 0) throw Object.assign(new AiUnavailableError('rate_limited', '429'), { retryAfterMs: 5000, daily: false });
        return say('Here you are.');
      },
    ]);
    const { res, steps } = await scenario(model, 'hello', { extra: { sleep: async (ms) => void slept.push(ms) } });
    expect(res.text).toBe('Here you are.');
    expect(slept).toEqual([5000]);
    expect(steps.some((s) => /Waiting 5 s/.test(s))).toBe(true);
  });

  it('a used-up daily quota fails at once with a clear message', async () => {
    const model = fakeModel([
      () => {
        throw Object.assign(new AiUnavailableError('rate_limited', '429'), { daily: true });
      },
    ]);
    await expect(scenario(model, 'hello')).rejects.toMatchObject({ code: 'rate_limited', daily: true, detail: expect.stringMatching(/daily allowance/) });
  });

  it('paces requests to the free-tier limit per minute', async () => {
    let now = 0;
    const limiter = new RateLimiter(2, () => now);
    const slept: number[] = [];
    const model = fakeModel([() => call(['list_outputs', {}]), () => call(['list_outputs', {}]), () => say('done')]);
    const { steps } = await scenario(model, 'x', { extra: { limiter, sleep: async (ms) => { slept.push(ms); now += ms; } } });
    expect(slept).toHaveLength(1);
    expect(slept[0]).toBeGreaterThan(59_000);
    expect(steps.some((s) => /limit of 2 requests a minute/.test(s))).toBe(true);
  });
});

describe('Scenario 15: Stop', () => {
  it('aborting while the model is thinking rejects with "cancelled" and changes nothing', async () => {
    const ctl = new AbortController();
    const model = fakeModel([
      ({ opts }) =>
        new Promise<ModelTurn>((_, reject) => {
          opts.signal?.addEventListener('abort', () => reject(new AiUnavailableError('cancelled', 'Stopped.')));
        }),
    ]);
    setTimeout(() => ctl.abort(), 5);
    await expect(scenario(model, 'Describe my data', { extra: { signal: ctl.signal } })).rejects.toMatchObject({ code: 'cancelled' });
  });

  it('aborting between rounds stops before running the requested tools', async () => {
    const ctl = new AbortController();
    const model = fakeModel([
      () => {
        ctl.abort();
        return call(['propose_transform', { kind: 'compute', target: 'x2', expression: 'age * 2' }]);
      },
    ]);
    const art: unknown[] = [];
    await expect(scenario(model, 'x', { extra: { signal: ctl.signal, events: { onArtifact: (a) => art.push(a) } } })).rejects.toMatchObject({ code: 'cancelled' });
    expect(art).toHaveLength(0);
  });
});

describe('Scenario 16: limits of the loop', () => {
  it('after 8 tool rounds the model must answer (tools off, limit note in the prompt)', async () => {
    const model = fakeModel([({ opts }) => (opts.toolChoice === 'none' ? say('Summary of what I found.') : call(['list_outputs', {}]))]);
    const { res } = await scenario(model, 'Keep checking');
    expect(model.calls).toHaveLength(9);
    expect(model.calls[8].toolChoice).toBe('none');
    expect(model.calls[8].system).toContain('You have used all the tool steps');
    expect(res.limitReached).toBe(true);
    expect(res.rounds).toBe(8);
  });

  it('runs several tool calls from one turn together and returns the results in order', async () => {
    const model = fakeModel([
      () => call(['describe_variables', { names: ['trust5'] }], ['run_analysis', { procedure_id: 'crosstabs', variables: { rows: ['area'], columns: ['vote'] } }], ['list_outputs', {}]),
      ({ results }) => say(results.map((r) => r.name).join(',')),
    ]);
    const { res } = await scenario(model, 'parallel');
    expect(res.text).toBe('describe_variables,run_analysis,list_outputs');
    expect(model.calls[1].messages.filter((m) => m.role === 'tool')).toHaveLength(1);
  });

  it('keeps each request within the byte budget: long results are trimmed and old ones removed first', async () => {
    const model = fakeModel([() => call(['list_analyses', {}]), () => say('ok')], { maxPromptBytes: 30_000, maxToolResultBytes: 1_500 });
    const { res } = await scenario(model, 'What can Socius do?');
    expect(new TextEncoder().encode(res.toolCalls[0].result).length).toBeLessThanOrEqual(1_500);
    expect(res.toolCalls[0].result).toMatch(/cut to save space/);
    const big = 'x'.repeat(8_000);
    const msgs: ChatMessage[] = [
      { role: 'user', text: 'old question' },
      { role: 'assistant', text: '', toolCalls: [{ id: 'a', name: 'get_dataset_overview', args: {} }] },
      { role: 'tool', results: [{ callId: 'a', name: 'get_dataset_overview', content: big }] },
      { role: 'assistant', text: 'old answer' },
      { role: 'user', text: 'new question' },
      { role: 'assistant', text: '', toolCalls: [{ id: 'b', name: 'get_dataset_overview', args: {} }] },
      { role: 'tool', results: [{ callId: 'b', name: 'get_dataset_overview', content: big }] },
    ];
    const fitted = fitMessages('sys', msgs, 10_000);
    expect((fitted[2] as any).results[0].content).toMatch(/Earlier result removed/);
    expect((fitted[6] as any).results[0].content).toBe(big); // the current exchange is kept whole
  });
});

describe('Scenario 17: qualitative coding', () => {
  function project(): CodingProject {
    const ex = buildWorkedExample(base, 'Coder 1');
    return { ...emptyCodingProject(), docs: ex.docs, codes: ex.codes, segments: ex.segments, memos: [ex.memo] };
  }

  it('summarises themes from the codebook and quotes, and compares codes by gender with the same counts as Codes by attribute', async () => {
    const coding = project();
    const top = coding.codes.find((c) => !c.parentId)!;
    const model = fakeModel([
      () => call(['list_codes', {}], ['codes_by_attribute', { attribute: 'gender' }]),
      () => call(['get_coded_segments', { code: top.name, limit: 3 }]),
      () => say('Themes summarised.'),
    ]);
    const { res } = await scenario(model, 'Summarise the main themes and compare by gender', { snapshot: snap(base, { coding, tab: 'coding' }) });
    expect(res.toolCalls[0].result).toContain(`- ${top.name}:`);
    const tops = coding.codes.filter((c) => !c.parentId);
    const members = Object.fromEntries(tops.map((c) => [c.id, [c.id, ...descendantIds(coding.codes, c.id)]]));
    const ref = codeByAttribute(tops.map((c) => c.id), coding.docs, coding.segments, 'gender', undefined, members);
    const j = ref.values.indexOf('Woman');
    expect(res.toolCalls[1].result).toContain(`- ${tops[0].name}:`);
    expect(res.toolCalls[1].result).toContain(`Woman ${ref.counts[0][j]} (${ref.colPct[0][j].toFixed(1)}%)`);
    expect(res.toolCalls[2].result).toMatch(/^Code "/);
    expect(res.toolCalls[2].result.split('\n- [').length - 1).toBe(3);
  });

  it('does not read excerpts when "Excerpts from coded texts" is off', async () => {
    const coding = project();
    const model = fakeModel([() => call(['get_coded_segments', { code: coding.codes[0].name }], ['search_text', { query: 'water' }]), () => say('ok')]);
    const { res } = await scenario(model, 'Quotes please', { snapshot: snap(base, { coding, tab: 'coding' }), permissions: { ...DEFAULT_PERMISSIONS, texts: false } });
    expect(res.toolCalls.every((c) => c.result.startsWith('DISABLED'))).toBe(true);
  });
});

describe('Scenario 18: explaining a result from the Output tab', () => {
  it('puts the output item into the context and can read it with get_output', async () => {
    const item = { ...runProc(base, 'oneway-anova', { dependents: ['life_sat'], factor: ['city'] }), id: 'out_anova' };
    const model = fakeModel([() => call(['get_output', {}]), () => say('explained')]);
    const { res, system } = await scenario(model, 'Explain my latest result', { snapshot: snap(base, { outputs: [item], tab: 'output' }), focusOutput: item });
    expect(system).toContain('The result the user is asking about');
    expect(system).toContain(apaOf(item));
    expect(res.toolCalls[0].result).toContain(apaOf(item));
    expect(res.toolCalls[0].result).toContain('SPSS syntax');
  });
});

describe('Scenario 19: the on-device model uses the JSON action protocol', () => {
  it('repairs one malformed reply, runs the tool, streams and returns the answer', async () => {
    const prompts: string[] = [];
    const replies = ['Sure! Let me look at your data.', '{"tool": "describe_variables", "args": {"names": ["life_sat"]}}', '{"answer": "Mean life satisfaction is 6.089 (Describe variables)."}'];
    const streamed: string[] = [];
    const driver: TextDriver = {
      kind: 'text',
      name: 'webllm',
      compact: true,
      budget: { maxPromptBytes: 6_500, maxToolResultBytes: 1_200 },
      complete: async (prompt, o) => {
        prompts.push(prompt);
        const r = replies[prompts.length - 1];
        o.onText?.(r.slice(0, 20));
        return r;
      },
    };
    const { res } = await scenario(driver, 'What is the average life satisfaction?', { extra: { events: { onText: (t) => streamed.push(t) } } });
    expect(prompts).toHaveLength(3);
    expect(prompts[1]).toContain('That reply was not valid');
    expect(prompts[2]).toMatch(/Tool result: .*life_sat/s);
    expect(prompts.every((p) => new TextEncoder().encode(p).length <= 6_500 + 800)).toBe(true);
    expect(res.toolCalls[0].result).toContain('Mean = 6.089');
    expect(res.text).toBe('Mean life satisfaction is 6.089 (Describe variables).');
    expect(streamed).toContain('Mean life satisfaction is 6.089 (Describe variables).');
  });
});

describe('Scenario 20: Claude in the viewer runs the tool rounds itself', () => {
  it('passes instructions as the first user turn and executes page tools', async () => {
    let turnsSeen: Array<{ role: string; content: string }> = [];
    const driver: HostedDriver = {
      kind: 'hosted',
      name: 'claude',
      budget: { maxPromptBytes: 56_000, maxToolResultBytes: 12_000 },
      run: async ({ turns, tools }) => {
        turnsSeen = turns;
        const t = tools.find((x) => x.name === 'run_analysis')!;
        const r = String(await t.execute({ procedure_id: 'correlations', variables: { variables: ['age', 'life_sat'] } }, { signal: new AbortController().signal }));
        return { text: /Pearson/.test(r) ? 'Age and life satisfaction: see the correlation.' : 'no' };
      },
    };
    const { res, steps } = await scenario(driver, 'Is age related to life satisfaction?', { history: [{ role: 'user', text: 'hi' }, { role: 'assistant', text: 'Hello!' }] });
    expect(turnsSeen[0].role).toBe('user');
    expect(turnsSeen[0].content).toContain('Never invent numbers');
    expect(turnsSeen.map((t) => t.role)).toEqual(['user', 'user', 'assistant', 'user']);
    expect(res.text).toMatch(/correlation/);
    expect(steps.some((s) => s.startsWith('done:Ran Bivariate Correlations'))).toBe(true);
  });
});

// ---------- the panel controller with the real app store ----------

describe('Controller: the store only changes on the user\'s click', () => {
  beforeEach(() => {
    useAssistantChat.getState().clear();
    useStore.getState().setDataset(base);
    useStore.setState({ outputs: [] });
  });

  it('a whole conversation with a proposal and an analysis leaves data and outputs unchanged until the buttons are clicked', async () => {
    const model = fakeModel([
      () => call(['run_analysis', { procedure_id: 'frequencies', variables: { variables: ['vote'] } }], ['propose_transform', { kind: 'scale', items: ['trust1', 'trust2', 'trust4', 'trust5'], target: 'trust4i', label: 'Trust (4 items)' }]),
      () => say('Here is the scale proposal.'),
    ]);
    const before = useStore.getState().dataset;
    await sendMessage('Build a trust scale', { driver: model });
    const chat = useAssistantChat.getState();
    const reply = chat.entries.at(-1)!;
    expect(reply.status).toBe('done');
    expect(reply.text).toBe('Here is the scale proposal.');
    expect(reply.steps.map((s) => s.status)).toEqual(['done', 'done']);
    expect(reply.artifacts.map((a) => a.artifact.kind)).toEqual(['output', 'proposal']);
    expect(useStore.getState().dataset).toBe(before);
    expect(useStore.getState().outputs).toHaveLength(0);
    // Click "Add this analysis to Output"
    runArtifact(reply.id, reply.artifacts[0].id);
    expect(useStore.getState().outputs).toHaveLength(1);
    expect(useStore.getState().dataset).toBe(before);
    // Click "Apply"
    runArtifact(reply.id, reply.artifacts[1].id);
    expect(useStore.getState().dataset!.variables.some((v) => v.name === 'trust4i')).toBe(true);
    useStore.getState().undo();
    expect(useStore.getState().dataset).toBe(before);
    // Follow-up questions carry the model-side history.
    expect(useAssistantChat.getState().history.filter((m) => m.role === 'user')).toHaveLength(1);
  });

  it('Stop marks the answer stopped, Retry asks again, and an unconfigured AI gives the set-up message', async () => {
    const model = fakeModel([
      ({ opts }) =>
        new Promise<ModelTurn>((_, reject) => opts.signal?.addEventListener('abort', () => reject(new AiUnavailableError('cancelled', 'Stopped.')))),
    ]);
    const p = sendMessage('Describe my data', { driver: model });
    await new Promise((r) => setTimeout(r, 5));
    expect(useAssistantChat.getState().running).toBe(true);
    stopAssistant();
    await p;
    expect(useAssistantChat.getState().entries.at(-1)!.status).toBe('stopped');
    await retryLast({ driver: fakeModel([() => say('Second try.')]) });
    const es = useAssistantChat.getState().entries;
    expect(es.filter((e) => e.role === 'user')).toHaveLength(1);
    expect(es.at(-1)!.text).toBe('Second try.');
    await sendMessage('Hello', { driver: null });
    expect(useAssistantChat.getState().entries.at(-1)!.error).toMatch(/AI help is not set up yet/);
  });
});

// A minimal store with the same undo semantics as the app (used where a fresh store per test is easier).
function testStore(ds: Dataset) {
  let state = { dataset: ds as Dataset | null, past: [] as Dataset[], outputs: [] as OutputItem[] };
  const api = () => ({
    dataset: state.dataset,
    outputs: state.outputs,
    mutateDataset: (fn: (d: Dataset) => Dataset) => {
      const next = fn(state.dataset!);
      state = { ...state, past: [...state.past, state.dataset!], dataset: next };
    },
    addOutput: (i: OutputItem) => {
      state = { ...state, outputs: [...state.outputs, i] };
    },
    toast: () => undefined,
    openDialog: () => undefined,
  });
  return {
    api: api as never,
    get: () => state,
    undo: () => {
      state = { ...state, dataset: state.past.at(-1)!, past: state.past.slice(0, -1) };
    },
  };
}
