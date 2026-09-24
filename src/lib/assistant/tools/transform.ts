// propose_transform: compute, recode, reverse-code or build a scale into NEW variables, using the
// same transform engine as the Transform menu. The tool only previews; the user applies it with a
// button, which re-runs it on the data as it is at that moment and records it for Undo.
import { activeCaseMask, formatCell, getVariable, isMissingValue, isUserMissing } from '../../../core/data';
import type { Dataset, ValueLabel, Variable } from '../../../core/types';
import { newId } from '../../../core/types';
import {
  computeVariable, createScale, recodeDifferent, reverseCode, type RecodeFrom, type RecodeRule, type RecodeTo, type TransformResult,
} from '../../transform';
import { exploreStats } from '../../stats/descriptives';
import { closestNames, num, trimToBytes } from '../format';
import type { AgentTool, Proposal, ToolContext, ToolOutput, TransformSpec } from '../types';
import { NO_DATA, STATS_OFF, resolveVariables } from './data';

export class ProposalError extends Error {}

function parseNumber(s: string): number | null {
  const n = Number(s.trim());
  return s.trim() !== '' && Number.isFinite(n) ? n : null;
}

const unquote = (s: string) => s.trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1');

/** "5", "1 thru 3", "lowest thru 29", "65 thru highest", "missing", "sysmis", "else", "'text'". */
export function parseFrom(raw: string, type: 'numeric' | 'string'): RecodeFrom {
  const t = String(raw ?? '').trim();
  const low = t.toLowerCase();
  if (low === 'else' || low === 'all other values') return { kind: 'else' };
  if (low === 'missing') return { kind: 'missing' };
  if (low === 'sysmis' || low === 'system-missing') return { kind: 'sysmis' };
  if (type === 'string') return { kind: 'value', value: unquote(t) };
  const m = /^(lowest|lo|-?[\d.]+)\s*(?:thru|through|to|-)\s*(highest|hi|-?[\d.]+)$/i.exec(t);
  if (m) {
    const lo = /^lo/i.test(m[1]) ? null : parseNumber(m[1]);
    const hi = /^hi/i.test(m[2]) ? null : parseNumber(m[2]);
    if (lo === null && hi === null) return { kind: 'else' };
    if (lo === null && hi !== null) return { kind: 'lowest', hi };
    if (hi === null && lo !== null) return { kind: 'highest', lo };
    return { kind: 'range', lo: lo!, hi: hi! };
  }
  const n = parseNumber(t);
  if (n === null) throw new ProposalError(`Cannot read the old value "${t}". Use a number, "a thru b", "lowest thru b", "a thru highest", "missing", "sysmis" or "else".`);
  return { kind: 'value', value: n };
}

export function parseTo(raw: string, outType: 'numeric' | 'string'): RecodeTo {
  const t = String(raw ?? '').trim();
  const low = t.toLowerCase();
  if (low === 'sysmis' || low === 'system-missing' || low === 'missing') return { kind: 'sysmis' };
  if (low === 'copy') return { kind: 'copy' };
  if (outType === 'string') return { kind: 'value', value: unquote(t) };
  const n = parseNumber(t);
  if (n === null) throw new ProposalError(`Cannot read the new value "${t}". Use a number, "sysmis" or "copy".`);
  return { kind: 'value', value: n };
}

function requireVar(ds: Dataset, name: string): Variable {
  const v = getVariable(ds, name);
  if (!v) {
    const near = closestNames(name, ds.variables.map((x) => x.name));
    throw new ProposalError(`There is no variable named "${name}".${near.length ? ` Did you mean ${near.join(', ')}?` : ''}`);
  }
  return v;
}

function requireNewName(ds: Dataset, name: string | undefined): string {
  const n = (name ?? '').trim();
  if (!n) throw new ProposalError('Give a name for the new variable in "target".');
  if (getVariable(ds, n)) throw new ProposalError(`A variable named ${n} already exists. The assistant only creates new variables; choose another name (e.g. ${n}_new).`);
  return n;
}

/** Run a transform spec on a dataset (pure). Throws ProposalError or the engine's own errors. */
export function buildTransform(ds: Dataset, spec: TransformSpec): { result: TransformResult; target: string; sources: Variable[] } {
  switch (spec.kind) {
    case 'compute': {
      const target = requireNewName(ds, spec.target);
      if (!spec.expression?.trim()) throw new ProposalError('Give the expression, e.g. MEAN.4(trust1, trust2, trust3_r, trust4, trust5).');
      const result = computeVariable(ds, { target, label: spec.label, expression: spec.expression, condition: spec.condition });
      const words = new Set((`${spec.expression} ${spec.condition ?? ''}`.match(/[A-Za-z@#$][\w.@#$]*/g) ?? []).map((w) => w.toLowerCase()));
      const sources = ds.variables.filter((v) => words.has(v.name.toLowerCase())).slice(0, 6);
      return { result, target, sources };
    }
    case 'recode': {
      const src = requireVar(ds, spec.source);
      const target = requireNewName(ds, spec.target);
      if (!Array.isArray(spec.rules) || !spec.rules.length) throw new ProposalError('Give the recode rules, e.g. [{"from": "lowest thru 29", "to": "1"}, ...].');
      const outNumericVals = spec.rules.every((r) => ['sysmis', 'system-missing', 'missing', 'copy'].includes(String(r.to).trim().toLowerCase()) || parseNumber(String(r.to)) !== null);
      const outType: 'numeric' | 'string' = outNumericVals ? 'numeric' : 'string';
      const rules: RecodeRule[] = spec.rules.map((r) => ({ from: parseFrom(String(r.from), src.type), to: parseTo(String(r.to), outType) }));
      const valueLabels: ValueLabel[] = (spec.valueLabels ?? [])
        .map((l) => ({ value: outType === 'numeric' ? Number(l.value) : String(l.value), label: String(l.label ?? '') }))
        .filter((l) => l.label && (outType === 'string' || Number.isFinite(l.value as number)));
      const result = recodeDifferent(ds, { targets: [{ sourceId: src.id, name: target, label: spec.label }], rules, outType, valueLabels, width: outType === 'string' ? 40 : undefined });
      return { result, target, sources: [src] };
    }
    case 'reverse': {
      const { vars, errors } = resolveVariables(ds, spec.items);
      if (errors.length) throw new ProposalError(errors.join(' '));
      if (!vars.length) throw new ProposalError('List the items to reverse in "items".');
      const suffix = spec.suffix ?? '_r';
      for (const v of vars) if (getVariable(ds, v.name + suffix)) throw new ProposalError(`${v.name + suffix} already exists; it may already be reversed. Use it, or choose another suffix.`);
      const result = reverseCode(ds, { varIds: vars.map((v) => v.id), mode: 'new', suffix });
      return { result, target: vars.map((v) => v.name + suffix).join(', '), sources: vars };
    }
    case 'scale': {
      const target = requireNewName(ds, spec.target);
      const { vars, errors } = resolveVariables(ds, spec.items);
      if (errors.length) throw new ProposalError(errors.join(' '));
      if (vars.length < 2) throw new ProposalError('A scale needs at least two items.');
      const minValid = spec.minValid ?? Math.max(1, Math.ceil(vars.length * 0.75));
      const result = createScale(ds, { itemIds: vars.map((v) => v.id), method: spec.method ?? 'mean', minValid, name: target, label: spec.label });
      return { result, target, sources: vars };
    }
  }
}

/** First rows of the source variables and the new variable(s), for the proposal card. */
function preview(ds: Dataset, res: TransformResult, sources: Variable[], targetNames: string[], n = 6): { columns: string[]; rows: string[][] } {
  const next = res.dataset;
  const targets = targetNames.map((t) => getVariable(next, t)).filter((v): v is Variable => !!v);
  const mask = activeCaseMask(ds);
  const rows: string[][] = [];
  for (let i = 0; i < ds.nCases && rows.length < n; i++) {
    if (!mask[i]) continue;
    const cell = (d: Dataset, v: Variable) => {
      const x = d.columns[v.id][i];
      if (typeof x === 'number' && Number.isNaN(x)) return '.';
      const t = formatCell(v, x, false);
      const l = v.valueLabels.find((vl) => vl.value === x)?.label;
      return l ? `${t} (${l})` : t;
    };
    rows.push([String(i + 1), ...sources.slice(0, 5).map((v) => cell(ds, v)), ...targets.map((v) => cell(next, v))]);
  }
  return { columns: ['Case', ...sources.slice(0, 5).map((v) => v.name), ...targets.map((v) => `${v.name} (new)`)], rows };
}

/** Checks the model should hear about: values that fell through, missing codes turned into answers. */
function checks(ds: Dataset, spec: TransformSpec, res: TransformResult, sources: Variable[], targetNames: string[]): string[] {
  const out: string[] = [];
  const next = res.dataset;
  const mask = activeCaseMask(ds);
  for (const t of targetNames) {
    const nv = getVariable(next, t);
    if (!nv) continue;
    const col = next.columns[nv.id];
    let valid = 0, lost = 0, missingBecameValid = 0;
    const vals: number[] = [];
    for (let i = 0; i < ds.nCases; i++) {
      if (!mask[i]) continue;
      const y = col[i];
      const yMissing = typeof y === 'number' ? Number.isNaN(y) : y === '';
      if (!yMissing) {
        valid++;
        if (typeof y === 'number') vals.push(y);
      }
      if (spec.kind === 'recode' && sources[0]) {
        const x = ds.columns[sources[0].id][i];
        if (yMissing && !isMissingValue(sources[0], x)) lost++;
        if (!yMissing && isUserMissing(sources[0].missing, x)) missingBecameValid++;
      }
    }
    let line = `${t}: ${valid} cases in use get a value`;
    if (vals.length) {
      const e = exploreStats(vals);
      line += ` (mean ${num(e.mean)}, min ${num(e.min)}, max ${num(e.max)})`;
    }
    out.push(line + '.');
    if (lost) out.push(`CHECK: ${lost} cases have a valid value in ${sources[0].name} that no rule covers, so they become missing in ${t}. Add a rule if that is not intended.`);
    if (missingBecameValid) out.push(`CHECK: ${missingBecameValid} cases with a declared missing code in ${sources[0].name} (${sources[0].missing.discrete.join(', ')}) got a valid value in ${t}. Put a "missing" -> "sysmis" rule first.`);
  }
  return out;
}

function propose(args: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const ds = ctx.state().dataset;
  if (!ds) return { text: NO_DATA, ok: false, summary: 'No dataset is open' };
  if (!ctx.permissions.stats) return { text: STATS_OFF, ok: false, summary: 'Reading the data is switched off' };
  const kind = String(args.kind ?? '').toLowerCase();
  const str = (k: string) => (typeof args[k] === 'string' ? (args[k] as string) : undefined);
  let spec: TransformSpec;
  switch (kind) {
    case 'compute':
      spec = { kind: 'compute', target: str('target') ?? '', label: str('label'), expression: str('expression') ?? '', condition: str('condition') };
      break;
    case 'recode': {
      const rules = Array.isArray(args.rules) ? (args.rules as any[]).map((r) => ({ from: String(r?.from ?? ''), to: String(r?.to ?? '') })) : [];
      const valueLabels = Array.isArray(args.value_labels) ? (args.value_labels as any[]).map((l) => ({ value: String(l?.value ?? ''), label: String(l?.label ?? '') })) : undefined;
      spec = { kind: 'recode', source: str('source') ?? '', target: str('target') ?? '', label: str('label'), rules, valueLabels };
      break;
    }
    case 'reverse':
      spec = { kind: 'reverse', items: Array.isArray(args.items) ? args.items.map(String) : [], suffix: str('suffix') };
      break;
    case 'scale':
      spec = {
        kind: 'scale', items: Array.isArray(args.items) ? args.items.map(String) : [], target: str('target') ?? '', label: str('label'),
        method: args.method === 'sum' ? 'sum' : 'mean', minValid: Number.isFinite(Number(args.min_valid)) && Number(args.min_valid) > 0 ? Math.floor(Number(args.min_valid)) : undefined,
      };
      break;
    default:
      return { text: 'kind must be one of compute, recode, reverse, scale.', ok: false, summary: 'Could not prepare the change' };
  }
  let built: ReturnType<typeof buildTransform>;
  try {
    built = buildTransform(ds, spec);
  } catch (e) {
    return { text: `Could not prepare this change: ${(e as Error).message}`, ok: false, summary: 'Could not prepare the change' };
  }
  const { result, target, sources } = built;
  const targetNames = target.split(', ');
  const prev = preview(ds, result, sources, targetNames);
  const notes = checks(ds, spec, result, sources, targetNames);
  const proposal: Proposal = {
    id: newId('prop'),
    kind: 'transform',
    title: result.title,
    summary: result.summary,
    syntax: result.syntax,
    warnings: [...result.warnings, ...notes.filter((n) => n.startsWith('CHECK:')).map((n) => n.slice(7))],
    preview: prev,
    spec,
    target,
  };
  const text = [
    `PROPOSED, NOT APPLIED: ${result.summary} The user sees a card with a preview and the SPSS syntax and must click Apply; it can be undone with Edit > Undo. Tell the user to check the preview and click Apply. Do not say it has been done.`,
    ...notes,
    `SPSS syntax:\n${result.syntax}`,
    `Preview (first cases in use):\n${[prev.columns.join(' | '), ...prev.rows.map((r) => r.join(' | '))].join('\n')}`,
  ].join('\n');
  return { text: trimToBytes(text, ctx.maxResultBytes), summary: `Proposed: ${result.summary}`, artifacts: [{ kind: 'proposal', proposal }] };
}

export const transformTools: AgentTool[] = [
  {
    name: 'propose_transform',
    kind: 'action',
    description:
      'Propose a data change that creates NEW variables: kind "compute" (target, expression, optional condition; SPSS expression syntax such as MEAN.4(a, b, c) or (x - 32) / 1.8), "recode" (source, target, rules [{from, to}] with from = "5" | "1 thru 3" | "lowest thru 29" | "65 thru highest" | "missing" | "sysmis" | "else" and to = number | "sysmis" | "copy"; optional value_labels), "reverse" (items; creates <item>_r), or "scale" (items, target, method mean|sum, min_valid). Nothing changes until the user clicks Apply on the preview card.',
    parameters: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['compute', 'recode', 'reverse', 'scale'] },
        target: { type: 'string', description: 'Name of the new variable.' },
        label: { type: 'string', description: 'Variable label for the new variable.' },
        expression: { type: 'string' },
        condition: { type: 'string', description: 'Optional IF condition for compute, e.g. age >= 18.' },
        source: { type: 'string', description: 'Variable to recode.' },
        rules: { type: 'array', items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } }, required: ['from', 'to'] } },
        value_labels: { type: 'array', items: { type: 'object', properties: { value: { type: 'string' }, label: { type: 'string' } }, required: ['value', 'label'] } },
        items: { type: 'array', items: { type: 'string' } },
        method: { type: 'string', enum: ['mean', 'sum'] },
        min_valid: { type: 'integer' },
      },
      required: ['kind'],
    },
    label: (a) => `Prepared a ${String(a.kind ?? 'data')} proposal${a.target ? ` for ${String(a.target)}` : ''}`,
    run: propose,
  },
];
