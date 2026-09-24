// Analysis tools: the procedure catalogue (generated from the live registry), running a real
// procedure on the live dataset without touching the Output tab, proposing a prefilled dialog, and
// reading results the user already has.
import { categoryLabel, distinctValues, activeCaseMask } from '../../../core/data';
import type { OutputItem } from '../../../core/output';
import { defaultOptions, type OptionDef, type OptionValues, type ProcedureDef, type SlotValues } from '../../../core/procedure';
import type { Dataset, Variable } from '../../../core/types';
import { newId } from '../../../core/types';
import { procedures, getProcedure } from '../../../procedures';
import { measureWarning, optionInactive, typeProblem, validate } from '../../../features/analysis/varUtils';
import { closestNames, outputItemText, trimToBytes } from '../format';
import type { AgentTool, ToolContext, ToolOutput } from '../types';
import { NO_DATA, STATS_OFF, caseStatus, resolveVariables } from './data';
import type { JsonSchema } from '../../../platform/ai-tools';

/** Where a procedure lives in the menus, e.g. "Analyze > Compare Means > Independent-Samples T Test". */
export function menuPath(def: ProcedureDef): string {
  return def.menu === 'Graphs' ? `Graphs > ${def.title}` : `Analyze > ${def.menu} > ${def.title}`;
}

const MEASURE_WORD = { nominal: 'nominal', ordinal: 'ordinal', scale: 'scale' } as const;

function slotLine(def: ProcedureDef): string {
  return def.slots
    .map((s) => {
      const count = s.max === 1 ? (s.min ? '1' : '0-1') : s.max === Infinity ? `${s.min}+` : `${s.min}-${s.max}`;
      const kinds = [s.types?.length === 1 ? s.types[0] : '', s.measures ? s.measures.map((m) => MEASURE_WORD[m]).join('/') : ''].filter(Boolean).join(', ');
      return `${s.key} "${s.label}" (${count}${kinds ? `; ${kinds}` : ''})`;
    })
    .join('; ');
}

function optionLine(o: OptionDef): string {
  switch (o.type) {
    case 'checkbox':
      return `${o.key} (true/false, default ${o.default}): ${o.label}`;
    case 'select':
      return `${o.key} (one of ${o.choices.map((c) => c.value).join('|')}, default ${o.default}): ${o.label}`;
    case 'number':
      return `${o.key} (number, default ${o.default}${o.min !== undefined ? `, min ${o.min}` : ''}${o.max !== undefined ? `, max ${o.max}` : ''}): ${o.label}`;
    case 'text':
      return `${o.key} (text, default "${o.default}"): ${o.label}`;
    case 'groupPair':
      return `${o.key} (two values of the ${o.slot} variable, e.g. "1,2"; filled in automatically when it has exactly two groups): ${o.label}`;
    case 'valueList':
      return `${o.key} (list of values of the ${o.slot} variable, e.g. "1,3,2"): ${o.label}`;
  }
}

/** The whole catalogue (compact) or one procedure in detail. Generated from the registry at run time. */
export function catalogueText(procId?: string): string {
  if (procId) {
    const def = getProcedure(procId);
    if (!def) return `Unknown procedure "${procId}". Valid ids: ${procedures.map((p) => p.id).join(', ')}.`;
    return [
      `${def.id}: ${def.title} (${menuPath(def)})`,
      def.description,
      def.guidance ? `Guidance: ${def.guidance}` : '',
      `Variable slots: ${slotLine(def)}`,
      def.options.length ? `Options:\n${def.options.map((o) => `- ${optionLine(o)}`).join('\n')}` : 'No options.',
    ].filter(Boolean).join('\n');
  }
  return [
    'Analyses in Socius (id: title, menu path. description. Slots: key "label" (count; type/measures)). Call list_analyses with procedure_id for the options of one.',
    ...procedures.map((p) => `- ${p.id}: ${p.title} (${menuPath(p)}). ${p.description} Slots: ${slotLine(p)}`),
  ].join('\n');
}

function listAnalyses(args: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const id = typeof args.procedure_id === 'string' && args.procedure_id.trim() ? args.procedure_id.trim() : undefined;
  return { text: trimToBytes(catalogueText(id), ctx.maxResultBytes), summary: id ? `Read the options of ${getProcedure(id)?.title ?? id}` : 'Looked at the list of analyses' };
}

// ---------- arguments -> slots and options ----------

/** All slot keys across procedures (for the schema). */
export function allSlotKeys(): string[] {
  const keys = new Set<string>();
  for (const p of procedures) for (const s of p.slots) keys.add(s.key);
  return [...keys];
}

function toList(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split(/[,;]\s*|\s+/).filter(Boolean);
  if (v === null || v === undefined) return [];
  return [v];
}

/** Match a user/model value (code, or label text) to a value of the variable. */
function parseVarValue(ds: Dataset, v: Variable, raw: unknown): number | string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (v.type === 'numeric') {
    const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (Number.isFinite(n)) return n;
    const t = String(raw).trim().toLowerCase();
    const byLabel = v.valueLabels.find((l) => l.label.toLowerCase() === t);
    return byLabel ? (byLabel.value as number) : null;
  }
  return String(raw);
}

interface Prepared {
  def: ProcedureDef;
  slots: SlotValues;
  options: OptionValues;
  errors: string[];
  notes: string[];
  names: Record<string, string[]>;
}

/** Turn tool arguments into dialog slots/options, with helpful errors and automatic group pairs. */
export function prepareProcedure(ds: Dataset, args: Record<string, unknown>): Prepared | { error: string } {
  const id = String(args.procedure_id ?? '').trim();
  const def = getProcedure(id);
  if (!def) {
    const near = closestNames(id, procedures.map((p) => p.id));
    return { error: `Unknown procedure_id "${id}".${near.length ? ` Did you mean ${near.join(', ')}?` : ''} Call list_analyses for the list.` };
  }
  const errors: string[] = [];
  const notes: string[] = [];
  const slots: SlotValues = {};
  const names: Record<string, string[]> = {};
  const given = (args.variables && typeof args.variables === 'object' && !Array.isArray(args.variables) ? args.variables : {}) as Record<string, unknown>;
  for (const key of Object.keys(given)) {
    if (!def.slots.some((s) => s.key === key) && toList(given[key]).length) errors.push(`${def.title} has no slot "${key}". Its slots are: ${slotLine(def)}.`);
  }
  for (const s of def.slots) {
    const { vars, errors: errs } = resolveVariables(ds, toList(given[s.key]));
    errors.push(...errs);
    slots[s.key] = vars.map((v) => v.id);
    names[s.key] = vars.map((v) => v.name);
    for (const v of vars) {
      const tp = typeProblem(s, v);
      if (tp) errors.push(tp);
      const mw = measureWarning(s, v);
      if (mw) notes.push(mw);
    }
  }
  // Options
  const options = defaultOptions(def);
  const rawOpts = args.options;
  const pairs: Array<[string, unknown]> = Array.isArray(rawOpts)
    ? rawOpts.filter((o) => o && typeof o === 'object').map((o: any) => [String(o.key ?? o.name ?? ''), o.value] as [string, unknown])
    : rawOpts && typeof rawOpts === 'object'
      ? Object.entries(rawOpts as Record<string, unknown>)
      : [];
  const byId = new Map(ds.variables.map((v) => [v.id, v]));
  for (const [key, value] of pairs) {
    const o = def.options.find((x) => x.key === key) ?? def.options.find((x) => x.key.toLowerCase() === key.toLowerCase());
    if (!o) {
      errors.push(`${def.title} has no option "${key}". Valid options: ${def.options.map((x) => x.key).join(', ') || 'none'}.`);
      continue;
    }
    switch (o.type) {
      case 'checkbox': {
        const t = String(value).trim().toLowerCase();
        options[o.key] = value === true || ['true', 'yes', '1', 'on'].includes(t);
        break;
      }
      case 'number': {
        const n = Number(value);
        if (Number.isFinite(n)) options[o.key] = n;
        else errors.push(`Option ${o.key} needs a number.`);
        break;
      }
      case 'select': {
        const t = String(value).trim();
        const c = o.choices.find((ch) => ch.value === t) ?? o.choices.find((ch) => ch.value.toLowerCase() === t.toLowerCase() || ch.label.toLowerCase() === t.toLowerCase());
        if (c) options[o.key] = c.value;
        else errors.push(`Option ${o.key} must be one of: ${o.choices.map((ch) => ch.value).join(', ')}.`);
        break;
      }
      case 'text':
        options[o.key] = String(value ?? '');
        break;
      case 'groupPair':
      case 'valueList': {
        const v = byId.get(slots[o.slot]?.[0] ?? '');
        if (!v) break;
        const vals = toList(value).map((x) => parseVarValue(ds, v, x));
        if (vals.some((x) => x === null)) errors.push(`Option ${o.key}: use values of ${v.name} (${v.valueLabels.map((l) => `${l.value}=${l.label}`).join(', ') || 'see describe_variables'}).`);
        else options[o.key] = vals;
        break;
      }
    }
  }
  // Group pairs: fill in automatically when the grouping variable has exactly two groups in use.
  for (const o of def.options) {
    if (o.type !== 'groupPair' || optionInactive(o, options)) continue;
    const cur = options[o.key];
    if (Array.isArray(cur) && cur.length === 2) continue;
    const v = byId.get(slots[o.slot]?.[0] ?? '');
    if (!v) continue;
    const mask = activeCaseMask(ds);
    const rows: number[] = [];
    for (let i = 0; i < ds.nCases; i++) if (mask[i]) rows.push(i);
    const vals = distinctValues(ds, v, rows);
    if (vals.length === 2) {
      options[o.key] = vals;
      notes.push(`Groups compared: ${vals.map((x) => `${x} = ${categoryLabel(v, x)}`).join(' and ')}.`);
    } else if (vals.length > 2) {
      errors.push(
        `${v.name} has ${vals.length} groups (${vals.slice(0, 10).map((x) => `${x} = ${categoryLabel(v, x)}`).join(', ')}). Choose two with options [{"key": "${o.key}", "value": "a,b"}], or compare all groups with One-Way ANOVA (oneway-anova) or Kruskal-Wallis (kruskal-wallis).`,
      );
    } else errors.push(`${v.name} has fewer than two groups among the cases in use.`);
  }
  if (!errors.length) errors.push(...validate(def, ds, slots, options));
  return { def, slots, options, errors, notes, names };
}

function describeRun(p: Prepared): string {
  const lists = p.def.slots.map((s) => p.names[s.key] ?? []).filter((l) => l.length);
  if (!lists.length) return p.def.title;
  return `${p.def.title}: ${lists.map((l) => l.join(', ')).join(' by ')}`;
}

function needData(ctx: ToolContext): Dataset | ToolOutput {
  const ds = ctx.state().dataset;
  if (!ds) return { text: NO_DATA, ok: false, summary: 'No dataset is open' };
  if (!ctx.permissions.stats) return { text: STATS_OFF, ok: false, summary: 'Reading the data is switched off' };
  return ds;
}

async function runAnalysis(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolOutput> {
  const ds = needData(ctx);
  if (!('variables' in ds)) return ds;
  const p = prepareProcedure(ds, args);
  if ('error' in p) return { text: p.error, ok: false, summary: 'Could not run: unknown analysis' };
  if (p.errors.length) return { text: `Could not run ${p.def.title}:\n- ${p.errors.join('\n- ')}`, ok: false, summary: `Could not run ${p.def.title}` };
  // Let the UI paint the "running" step before a long computation.
  await new Promise((r) => setTimeout(r, 0));
  if (ctx.signal?.aborted) return { text: 'Stopped.', ok: false };
  let item: OutputItem;
  try {
    item = p.def.run(ds, p.slots, p.options);
  } catch (e) {
    return { text: `${p.def.title} failed: ${(e as Error).message}`, ok: false, summary: `${p.def.title} failed` };
  }
  item = { ...item, id: item.id || newId('out') };
  const text = [
    `Ran ${describeRun(p)} on the live data (${caseStatus(ds)}). This result is NOT in the Output tab yet; the user can add it with the button under your answer. Found in Socius at ${menuPath(p.def)}.`,
    p.notes.length ? `Notes: ${p.notes.join(' ')}` : '',
    outputItemText(item, { maxRows: 30 }),
  ].filter(Boolean).join('\n\n');
  return { text: trimToBytes(text, ctx.maxResultBytes, 'Tables were cut to save space.'), summary: `Ran ${describeRun(p)}`, artifacts: [{ kind: 'output', item }] };
}

function openDialog(args: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const ds = needData(ctx);
  if (!('variables' in ds)) return ds;
  const p = prepareProcedure(ds, args);
  if ('error' in p) return { text: p.error, ok: false, summary: 'Could not prepare the dialog' };
  // Missing variables are fine here: the user finishes the dialog. Only reject impossible input.
  const hard = p.errors.filter((e) => !/^Add (a|at least)/.test(e) && !/^Choose the two groups/.test(e) && !/groups \(/.test(e));
  if (hard.length) return { text: `Could not prepare ${p.def.title}:\n- ${hard.join('\n- ')}`, ok: false, summary: `Could not prepare ${p.def.title}` };
  const proposal = { id: newId('prop'), kind: 'dialog' as const, title: `Open ${p.def.title}`, summary: `${describeRun(p)}. Opens ${menuPath(p.def)} with these settings so the user can check them and click Run.`, procedureId: p.def.id, slots: p.slots, options: p.options };
  return {
    text: `A button "Open ${p.def.title}" is now shown under your answer. Nothing happens until the user clicks it; the dialog then opens prefilled (${describeRun(p)}) and the user clicks Run.${p.errors.length ? ` Still to fill in: ${p.errors.join(' ')}` : ''}`,
    summary: `Prepared the ${p.def.title} dialog`,
    artifacts: [{ kind: 'proposal', proposal }],
  };
}

// ---------- outputs the user already has ----------

function listOutputs(_args: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const outs = ctx.state().outputs;
  if (!outs.length) return { text: 'The Output tab is empty: the user has not run any analysis yet.', summary: 'The Output tab is empty' };
  const lines = outs.map((o, i) => `${i + 1}. id ${o.id}: ${o.title}${o.procedure === 'transform' ? ' (data change log)' : ''}, ${new Date(o.createdAt).toLocaleString('en-GB')}`);
  return { text: trimToBytes(`Output tab (oldest first, ${outs.length} items):\n${lines.join('\n')}`, ctx.maxResultBytes), summary: `Looked at the Output tab (${outs.length} items)` };
}

function getOutput(args: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const outs = ctx.state().outputs;
  if (!outs.length) return { text: 'The Output tab is empty.', ok: false, summary: 'The Output tab is empty' };
  const id = typeof args.id === 'string' ? args.id.trim() : '';
  let item = id ? outs.find((o) => o.id === id) : undefined;
  if (!item && id) {
    const n = Number(id);
    if (Number.isInteger(n) && n >= 1 && n <= outs.length) item = outs[n - 1];
  }
  if (!item && id) return { text: `No output item with id "${id}". Call list_outputs.`, ok: false, summary: 'Output item not found' };
  if (!item) item = [...outs].reverse().find((o) => o.procedure !== 'transform') ?? outs[outs.length - 1];
  return { text: trimToBytes(outputItemText(item, { maxRows: 40, syntax: true }), ctx.maxResultBytes), summary: `Read "${item.title}" from the Output tab` };
}

const OPTIONS_SCHEMA: JsonSchema = {
  type: 'array',
  description: 'Options that differ from the defaults, e.g. [{"key": "expected", "value": "true"}]. See list_analyses with procedure_id.',
  items: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] },
};

function variablesSchema(): JsonSchema {
  const props: Record<string, JsonSchema> = {};
  for (const k of allSlotKeys()) props[k] = { type: 'array', items: { type: 'string' } };
  return {
    type: 'object',
    description: 'Variable names per slot of the chosen procedure, e.g. {"rows": ["gender"], "columns": ["trust5"]}. Slot keys are listed by list_analyses.',
    properties: props,
  };
}

export function analysisTools(): AgentTool[] {
  const ids = procedures.map((p) => p.id);
  return [
    {
      name: 'list_analyses',
      kind: 'read',
      description: 'The analyses Socius offers (ids, menu paths, variable slots with allowed types and measurement levels). With procedure_id: that analysis in detail with all options and defaults.',
      parameters: { type: 'object', properties: { procedure_id: { type: 'string', description: 'Optional procedure id for full details.' } } },
      label: (a) => (a.procedure_id ? `Looked up the options of ${getProcedure(String(a.procedure_id))?.title ?? String(a.procedure_id)}` : 'Looked at the list of analyses'),
      run: listAnalyses,
    },
    {
      name: 'run_analysis',
      kind: 'read',
      compact: true,
      description:
        'Run a Socius analysis on the live data exactly as its dialog would (same missing values, filter, weight) and read the SPSS-style tables, warnings, interpretation and APA sentence. It does not change anything and does not add to the Output tab (the user gets an "Add to Output" button). Use it to answer questions about relationships and differences with real numbers.',
      parameters: {
        type: 'object',
        properties: {
          procedure_id: { type: 'string', enum: ids, description: 'Which analysis, e.g. "crosstabs", "ttest-independent", "models.linear".' },
          variables: variablesSchema(),
          options: OPTIONS_SCHEMA,
        },
        required: ['procedure_id', 'variables'],
      },
      label: (a) => `Running ${getProcedure(String(a.procedure_id))?.title ?? String(a.procedure_id ?? 'an analysis')}`,
      run: runAnalysis,
    },
    {
      name: 'open_analysis_dialog',
      kind: 'action',
      description:
        'Offer the user a button that opens the real analysis dialog prefilled with these variables and options, so they can review and click Run themselves. Use when the user wants to run it themselves or learn where it is.',
      parameters: {
        type: 'object',
        properties: { procedure_id: { type: 'string', enum: ids }, variables: variablesSchema(), options: OPTIONS_SCHEMA },
        required: ['procedure_id'],
      },
      label: (a) => `Prepared the ${getProcedure(String(a.procedure_id))?.title ?? 'analysis'} dialog`,
      run: openDialog,
    },
    {
      name: 'list_outputs',
      kind: 'read',
      description: 'The results already in the Output tab (id, title, time), oldest first.',
      parameters: { type: 'object', properties: {} },
      label: () => 'Looked at the Output tab',
      run: listOutputs,
    },
    {
      name: 'get_output',
      kind: 'read',
      description: 'One result from the Output tab as text (tables, warnings, interpretation, APA sentence, syntax). Without id: the latest analysis.',
      parameters: { type: 'object', properties: { id: { type: 'string', description: 'Output item id from list_outputs (optional).' } } },
      label: () => 'Read a result from the Output tab',
      run: getOutput,
    },
  ];
}
