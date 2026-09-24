// Read-only dataset tools: overview (dictionary + data-quality flags), variable summaries, and
// individual cases (only when the user allows it). Missing values, filter and weight follow
// src/core/data.ts exactly as the procedures do.
import {
  activeCaseMask, caseWeights, categoryLabel, formatCell, formatRawValue, getVariable, isDateFormat, isUserMissing, selectCases, valueLabelFor,
} from '../../../core/data';
import type { Dataset, Variable } from '../../../core/types';
import { exploreStats } from '../../stats/descriptives';
import { frequencyTable, type FreqEntry } from '../../stats/frequencies';
import { closestNames, missingText, num, pct, trimToBytes, valueLabelsText } from '../format';
import type { AgentTool, ToolContext, ToolOutput } from '../types';

export const NO_DATA = 'No dataset is open. Tell the user how to open one: File > Open data file... (SPSS .sav/.zsav, CSV or Excel), or File > Load sample survey to practise.';
export const STATS_OFF =
  'DISABLED: The user has switched off "Variable information and summary statistics" under "What the assistant can see", so you cannot read the dataset. Say so, and explain they can switch it on in the assistant panel if they want help with their data.';

/** Resolve variable names (case-insensitive). Unknown names get "did you mean" suggestions. */
export function resolveVariables(ds: Dataset, names: unknown): { vars: Variable[]; errors: string[] } {
  const list = Array.isArray(names) ? names : typeof names === 'string' ? names.split(/[\s,]+/) : [];
  const vars: Variable[] = [];
  const errors: string[] = [];
  const all = ds.variables.map((v) => v.name);
  for (const raw of list) {
    const name = String(raw ?? '').trim();
    if (!name) continue;
    const v = getVariable(ds, name);
    if (v && !vars.includes(v)) vars.push(v);
    else if (!v) {
      const near = closestNames(name, all);
      errors.push(`There is no variable named "${name}".${near.length ? ` Did you mean ${near.join(', ')}?` : ''}`);
    }
  }
  return { vars, errors };
}

function ctxData(ctx: ToolContext): { ds: Dataset } | { out: ToolOutput } {
  const ds = ctx.state().dataset;
  if (!ds) return { out: { text: NO_DATA, summary: 'No dataset is open', ok: false } };
  if (!ctx.permissions.stats) return { out: { text: STATS_OFF, summary: 'Reading the data is switched off', ok: false } };
  return { ds };
}

/** Status line: cases, filter, weight. */
export function caseStatus(ds: Dataset): string {
  const mask = activeCaseMask(ds);
  let inUse = 0;
  for (let i = 0; i < ds.nCases; i++) inUse += mask[i];
  const parts = [`${ds.nCases.toLocaleString('en-US')} cases`];
  const fv = ds.filterVarId ? ds.variables.find((v) => v.id === ds.filterVarId) : null;
  parts.push(fv ? `FILTER ON (by ${fv.name}): ${inUse.toLocaleString('en-US')} of ${ds.nCases.toLocaleString('en-US')} cases are used in analyses` : 'no filter (all cases used)');
  const wv = ds.weightVarId ? ds.variables.find((v) => v.id === ds.weightVarId) : null;
  if (wv) {
    const w = caseWeights(ds);
    let sw = 0;
    for (let i = 0; i < ds.nCases; i++) if (mask[i]) sw += w[i];
    parts.push(`WEIGHTED by ${wv.name} (sum of weights of cases in use = ${num(sw, 1)}; counts and statistics are weighted, like SPSS WEIGHT BY)`);
  } else parts.push('not weighted');
  return parts.join('; ');
}

const MISSING_WORDS = /(don.?t know|dont know|\bdk\b|refus|no answer|not applicable|\bn\/?a\b|missing|not asked|skipped|can.?t say|prefer not)/i;
const SENTINELS = new Set([-99, -9, -8, -1, 97, 98, 99, 997, 998, 999, 9999, 99999, 999999]);

interface VarScan {
  nValid: number;
  nUserMissing: number;
  nSysmis: number;
  distinct: number;
  min: number;
  max: number;
  sentinelsSeen: number[];
  numericStrings: boolean;
}

function scan(ds: Dataset, v: Variable, mask: Uint8Array): VarScan {
  const col = ds.columns[v.id];
  let nValid = 0, nUser = 0, nSys = 0, min = Infinity, max = -Infinity;
  const seen = new Set<number | string>();
  const sentinels = new Set<number>();
  let allNumeric = true, nonEmpty = 0;
  for (let i = 0; i < ds.nCases; i++) {
    if (!mask[i]) continue;
    const x = col[i];
    if (typeof x === 'number') {
      if (Number.isNaN(x)) nSys++;
      else if (isUserMissing(v.missing, x)) nUser++;
      else {
        nValid++;
        if (seen.size <= 1000) seen.add(x);
        if (x < min) min = x;
        if (x > max) max = x;
        if (SENTINELS.has(x)) sentinels.add(x);
      }
    } else {
      const t = x.trimEnd();
      if (isUserMissing(v.missing, x)) nUser++;
      else if (t === '') nSys++;
      else {
        nValid++;
        nonEmpty++;
        if (seen.size <= 1000) seen.add(t);
        if (allNumeric && !/^\s*-?\d+(\.\d+)?\s*$/.test(t)) allNumeric = false;
      }
    }
  }
  return { nValid, nUserMissing: nUser, nSysmis: nSys, distinct: seen.size, min, max, sentinelsSeen: [...sentinels].sort((a, b) => a - b), numericStrings: v.type === 'string' && nonEmpty > 0 && allNumeric };
}

/** Data-quality flags for one variable (plain language, for the model to pass on). */
export function variableFlags(v: Variable, s: VarScan, nActive: number): string[] {
  const flags: string[] = [];
  const declared = (x: number | string) => isUserMissing(v.missing, x);
  const undeclaredLabels = v.valueLabels.filter((l) => MISSING_WORDS.test(l.label) && !declared(l.value));
  if (undeclaredLabels.length)
    flags.push(`value label(s) ${undeclaredLabels.map((l) => `${l.value}="${l.label}"`).join(', ')} look like missing-data codes but are NOT declared missing, so they are counted as real answers`);
  if (v.type === 'numeric') {
    const sent = s.sentinelsSeen.filter((x) => !declared(x) && !(v.valueLabels.some((l) => l.value === x) && !MISSING_WORDS.test(valueLabelFor(v, x) ?? '')));
    // A sentinel far above the other values (e.g. 99 on a 1-5 item, 999999 for income) is suspicious.
    if (sent.length && (s.max >= 97 || s.min <= -1) && s.distinct > 1) flags.push(`contains ${sent.join(', ')}, which is often a missing-data code; check whether it should be declared missing`);
    if (v.measure === 'scale' && v.valueLabels.length >= 2 && s.distinct <= 7 && v.valueLabels.length >= s.distinct - 1) flags.push(`set as scale, but it has ${s.distinct} labelled categories; ordinal or nominal may fit better`);
    const looksLikeId = (s.distinct === s.nValid || s.distinct > 1000) && s.nValid > 20 && /(^|_)(id|no|num|serial|key)$|\bid\b|identifier|respondent|serial/i.test(`${v.name} ${v.label}`);
    if (looksLikeId) flags.push('looks like an ID variable (every value unique); do not analyse it, and remove it before sharing data if it can identify people');
    else if (v.measure !== 'scale' && !v.valueLabels.length && s.distinct > 15 && !isDateFormat(v.format)) flags.push(`set as ${v.measure}, but it has ${s.distinct}+ distinct unlabelled values; scale may fit better`);
  } else if (s.numericStrings) flags.push('a string variable whose answers are all numbers; convert it to numeric (Variable View, Type) to use it in statistics');
  if (s.nValid === 0 && nActive > 0) flags.push('has no valid values');
  else if (s.distinct === 1) flags.push('has only one value (constant)');
  const miss = s.nUserMissing + s.nSysmis;
  if (nActive > 0 && miss / nActive >= 0.2) flags.push(`${pct((100 * miss) / nActive)} missing`);
  return flags;
}

function overview(args: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const got = ctxData(ctx);
  if ('out' in got) return got.out;
  const { ds } = got;
  const mask = activeCaseMask(ds);
  let nActive = 0;
  for (let i = 0; i < ds.nCases; i++) nActive += mask[i];
  const search = typeof args.search === 'string' ? args.search.trim().toLowerCase() : '';
  const offset = Math.max(0, Math.floor(Number(args.offset) || 0));
  const vars = search ? ds.variables.filter((v) => v.name.toLowerCase().includes(search) || v.label.toLowerCase().includes(search)) : ds.variables;
  const head = [
    `Dataset "${ds.name}"${ds.source?.fileName ? ` (file ${ds.source.fileName})` : ''}${ds.fileLabel ? `, file label "${ds.fileLabel}"` : ''}.`,
    caseStatus(ds) + '.',
    `${ds.variables.length} variables${search ? `; ${vars.length} match "${search}"` : ''}. "valid" = non-missing answers among cases in use (unweighted count).`,
    'Format: name "label" [type, measure] valid n | value labels | declared missing codes | FLAGS (possible problems).',
    '',
  ];
  const lines: string[] = [];
  const issues: string[] = [];
  let shown = 0;
  let budgetLeft = ctx.maxResultBytes - 600;
  for (let k = offset; k < vars.length; k++) {
    const v = vars[k];
    const s = scan(ds, v, mask);
    const flags = variableFlags(v, s, nActive);
    const bits = [`${v.name}${v.label ? ` "${v.label.slice(0, 90)}"` : ''} [${v.type}, ${v.measure}] valid ${s.nValid}`];
    const vl = valueLabelsText(v, 8);
    if (vl) bits.push(`labels: ${vl}`);
    const mt = missingText(v);
    if (mt) bits.push(`missing codes: ${mt}${s.nUserMissing ? ` (${s.nUserMissing} cases)` : ''}`);
    if (v.type === 'numeric' && v.measure === 'scale' && s.nValid) bits.push(isDateFormat(v.format) ? `dates ${formatRawValue(v, s.min)} to ${formatRawValue(v, s.max)}` : `range ${num(s.min)} to ${num(s.max)}`);
    if (ds.weightVarId === v.id) bits.push('THIS IS THE WEIGHT VARIABLE');
    if (ds.filterVarId === v.id) bits.push('THIS IS THE FILTER VARIABLE');
    if (flags.length) {
      bits.push(`FLAGS: ${flags.join('; ')}`);
      issues.push(`${v.name}: ${flags.join('; ')}`);
    }
    const line = bits.join(' | ');
    budgetLeft -= line.length + 1;
    if (budgetLeft < 0 && shown > 0) break;
    lines.push(line);
    shown++;
  }
  const end = offset + shown;
  const tail: string[] = [];
  if (end < vars.length) tail.push(`\nShowing variables ${offset + 1}-${end} of ${vars.length}. Call get_dataset_overview again with offset=${end} (or search="...") for the rest.`);
  const text = trimToBytes([...head, ...lines, ...tail].join('\n'), ctx.maxResultBytes);
  return { text, summary: `Looked at the dataset overview (${ds.variables.length} variables, ${ds.nCases} cases)${issues.length ? `; ${issues.length} possible issue${issues.length === 1 ? '' : 's'}` : ''}` };
}

// ---------- describe variables ----------

function freqEntries(ds: Dataset, v: Variable): FreqEntry[] {
  const mask = activeCaseMask(ds);
  const w = caseWeights(ds);
  const col = ds.columns[v.id];
  const out: FreqEntry[] = [];
  for (let i = 0; i < ds.nCases; i++) {
    if (!mask[i] || !(w[i] > 0)) continue;
    const x = col[i];
    const kind: FreqEntry['kind'] = typeof x === 'number' && Number.isNaN(x) ? 'system' : isUserMissing(v.missing, x) ? 'user' : 'valid';
    out.push({ value: x, weight: w[i], kind });
  }
  return out;
}

export function describeVariable(ds: Dataset, v: Variable, allowValues: boolean): string {
  const weighted = !!ds.weightVarId;
  const lines: string[] = [`## ${v.name}${v.label ? ` "${v.label}"` : ''} [${v.type}, ${v.measure}]`];
  const ft = frequencyTable(freqEntries(ds, v));
  const nTxt = (x: number) => (weighted ? x.toFixed(1) : String(Math.round(x)));
  const missParts = ft.missing.map((m) => `${m.value === null ? 'system-missing' : `${m.value}${valueLabelFor(v, m.value) ? ` (${valueLabelFor(v, m.value)})` : ''}`}: ${nTxt(m.count)}`);
  lines.push(`Valid N = ${nTxt(ft.validTotal)}${weighted ? ' (weighted)' : ''}; missing = ${nTxt(ft.missingTotal)} (${pct(ft.total ? (100 * ft.missingTotal) / ft.total : 0)})${missParts.length ? ` [${missParts.join(', ')}]` : ''}.`);
  const categorical = v.type === 'numeric' && (v.measure !== 'scale' || (v.valueLabels.length >= 2 && ft.valid.length <= 12));
  if (v.type === 'numeric') {
    const sel = selectCases(ds, [v.id]);
    const col = ds.columns[v.id] as Float64Array;
    const x = Float64Array.from(sel.rows, (i) => col[i]);
    if (x.length) {
      const e = exploreStats(x, weighted ? sel.weights : undefined);
      const skewNote = Math.abs(e.skewness) >= 1 ? ' (strongly skewed)' : Math.abs(e.skewness) >= 0.5 ? ' (moderately skewed)' : '';
      lines.push(
        `Mean = ${num(e.mean)}, SD = ${num(e.sd)}, median = ${num(e.median)}, min = ${num(e.min)}, max = ${num(e.max)}, skewness = ${num(e.skewness)} (SE ${num(e.seSkewness)})${skewNote}, kurtosis = ${num(e.kurtosis)}${categorical && v.measure !== 'scale' ? ' (codes treated as numbers; use with care for categorical variables)' : ''}.`,
      );
    }
  }
  if (categorical || v.type === 'string') {
    const freeText = v.type === 'string' && ft.valid.length > 30 && ft.valid.length > 0.5 * Math.max(1, ft.validTotal);
    if (v.type === 'string') lines.push(`${ft.valid.length} distinct non-empty answers.`);
    if (freeText && !allowValues) lines.push('These look like free-text answers; individual answers are not shown because reading individual cases is switched off. Suggest Text coding > Import open-ended answers from dataset... to code them.');
    else {
      const rows = v.type === 'string' || ft.valid.length > 25 ? [...ft.valid].sort((a, b) => b.count - a.count).slice(0, v.type === 'string' ? 10 : 25) : ft.valid;
      lines.push(`${v.type === 'string' || ft.valid.length > 25 ? 'Most common values' : 'Frequencies'} (value = label: ${weighted ? 'weighted count' : 'count'}, valid %):`);
      for (const r of rows) {
        const label = typeof r.value === 'string' ? r.value.slice(0, 80) : categoryLabel(v, r.value);
        const code = typeof r.value === 'number' && valueLabelFor(v, r.value) ? `${r.value} = ` : '';
        lines.push(`- ${code}${label}: ${nTxt(r.count)} (${pct(r.validPercent)})`);
      }
      if (rows.length < ft.valid.length) lines.push(`- ... ${ft.valid.length - rows.length} more values`);
      const small = ft.valid.filter((r) => r.count < 5);
      if (v.type === 'numeric' && small.length && ft.valid.length <= 25) lines.push(`Note: ${small.length} categor${small.length === 1 ? 'y has' : 'ies have'} fewer than 5 cases; consider merging categories before crosstabs or group comparisons.`);
    }
    const unused = v.valueLabels.filter((l) => !isUserMissing(v.missing, l.value) && !ft.valid.some((r) => r.value === l.value));
    if (unused.length && unused.length <= 6) lines.push(`Labelled but never used: ${unused.map((l) => `${l.value}=${l.label}`).join('; ')}.`);
  }
  return lines.join('\n');
}

function describe(args: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const got = ctxData(ctx);
  if ('out' in got) return got.out;
  const { ds } = got;
  const { vars, errors } = resolveVariables(ds, args.names);
  if (!vars.length) return { text: errors.join('\n') || 'Give the variable names to describe in "names".', ok: false, summary: 'Could not find the variables' };
  const limited = vars.slice(0, 12);
  const parts = [caseStatus(ds) + '.', ...limited.map((v) => describeVariable(ds, v, ctx.permissions.cases)), ...errors];
  if (vars.length > limited.length) parts.push(`(Only the first 12 variables are described; ask again for ${vars.slice(12).map((v) => v.name).join(', ')}.)`);
  return { text: trimToBytes(parts.join('\n\n'), ctx.maxResultBytes), summary: `Looked at ${limited.map((v) => v.name).join(', ')}` };
}

// ---------- individual cases ----------

export const CASES_OFF =
  'DISABLED: Reading individual cases is switched off. Explain to the user that you can only see summaries, and that they can switch on "Individual cases" under "What the assistant can see" in the assistant panel if they are comfortable sending raw rows to the AI service (check consent and ethics approval first). Offer a summary-based alternative.';

function cases(args: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const got = ctxData(ctx);
  if ('out' in got) return got.out;
  if (!ctx.permissions.cases) return { text: CASES_OFF, summary: 'Individual cases are switched off', ok: false };
  const { ds } = got;
  const { vars, errors } = resolveVariables(ds, args.variables);
  if (!vars.length) return { text: errors.join('\n') || 'Give the variables to show in "variables".', ok: false, summary: 'Could not find the variables' };
  const use = vars.slice(0, 10);
  const limit = Math.max(1, Math.min(30, Math.floor(Number(args.limit) || 10)));
  const mask = activeCaseMask(ds);
  let rows: number[] = [];
  if (Array.isArray(args.rows) && args.rows.length) rows = args.rows.map((r) => Math.floor(Number(r)) - 1).filter((r) => r >= 0 && r < ds.nCases);
  else for (let i = 0; i < ds.nCases && rows.length < limit; i++) if (mask[i]) rows.push(i);
  rows = rows.slice(0, limit);
  const header = ['case', ...use.map((v) => v.name)].join(' | ');
  const body = rows.map((i) => [String(i + 1), ...use.map((v) => {
    const x = ds.columns[v.id][i];
    const t = formatCell(v, x, true);
    const miss = typeof x === 'number' && Number.isNaN(x) ? '(sysmis)' : isUserMissing(v.missing, x) ? ' (missing code)' : '';
    return (t || '') + miss;
  })].join(' | '));
  const text = [
    `Individual cases (case = row number in Data View; ${ds.filterVarId ? 'filtered-out cases are skipped unless asked by row' : 'no filter'}). Treat as confidential; do not repeat identifying details.`,
    header,
    ...body,
    ...errors,
  ].join('\n');
  return { text: trimToBytes(text, ctx.maxResultBytes), summary: `Read ${rows.length} case${rows.length === 1 ? '' : 's'} (${use.map((v) => v.name).join(', ')})` };
}

export const dataTools: AgentTool[] = [
  {
    name: 'get_dataset_overview',
    kind: 'read',
    compact: true,
    description:
      'The open dataset: name, number of cases, filter and weight status, and every variable with its label, type, measurement level, value labels, declared missing codes, number of valid answers and possible data problems (FLAGS). Call this first for any question about the data.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional: only variables whose name or label contains this text.' },
        offset: { type: 'integer', description: 'Optional: skip this many variables (for large files).' },
      },
    },
    label: (a) => (a.search ? `Searched variables for "${String(a.search)}"` : 'Looked at the dataset overview'),
    run: overview,
  },
  {
    name: 'describe_variables',
    kind: 'read',
    compact: true,
    description:
      'Summary statistics for up to 12 variables, with the same missing-value, filter and weight rules as Socius analyses. Scale variables: N, missing, mean, SD, median, min, max, skewness. Categorical: frequency table with labels and valid %. Strings: most common values. Use before choosing or interpreting a test.',
    parameters: {
      type: 'object',
      properties: { names: { type: 'array', items: { type: 'string' }, description: 'Variable names, e.g. ["trust5", "gender"].' } },
      required: ['names'],
    },
    label: (a) => `Looked at ${Array.isArray(a.names) ? a.names.join(', ') : 'variables'}`,
    run: describe,
  },
  {
    name: 'get_cases',
    kind: 'read',
    description:
      'Individual case values (raw rows) for up to 10 variables and 30 cases. Only works when the user has switched on "Individual cases"; otherwise it says it is disabled. Prefer summary tools; use this only when the question is about specific cases (outliers, data entry errors).',
    parameters: {
      type: 'object',
      properties: {
        variables: { type: 'array', items: { type: 'string' }, description: 'Variable names.' },
        rows: { type: 'array', items: { type: 'integer' }, description: 'Optional case numbers (1-based, as in Data View).' },
        limit: { type: 'integer', description: 'How many cases, at most 30 (default 10).' },
      },
      required: ['variables'],
    },
    label: (a) => `Read individual cases${Array.isArray(a.variables) ? ` (${a.variables.join(', ')})` : ''}`,
    run: cases,
  },
];
