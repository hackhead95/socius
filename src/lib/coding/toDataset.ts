// Mixed-methods bridge: turn codes applied to open-ended responses into 0/1 dataset variables.

import type { CodeDef, CodedSegment, TextDoc } from '../../core/coding-types';
import type { Dataset, Variable } from '../../core/types';
import { makeVariable } from '../../core/types';
import { uniqueVarName } from '../../core/data';

/**
 * Variable attributes recording where an exported code variable came from. The .sav export writes
 * them as SPSS custom variable attributes, so the link survives saving and reopening the data.
 */
export const CODE_ATTR = 'socius.code';
export const SOURCE_ATTR = 'socius.source';
/** CODE_ATTR value of the "number of codes mentioned" variable. */
export const COUNT_CODE = '#count';

export type ExportMode = 'update' | 'new';

export interface CodeVariablePlan {
  variable: Variable;
  column: Float64Array;
  codeId: string | null;
  /** Cases marked 1 (mentioned). */
  nMentioned: number;
  /**
   * Id of an existing variable previously exported from the same code and question whose values
   * this plan overwrites in place (mode 'update'); null for a new variable.
   */
  replaces: string | null;
}

export interface CodeVariableBuild {
  plans: CodeVariablePlan[];
  /**
   * Existing variables that were created earlier from the same codes and question (whatever the
   * mode), so the caller can offer to update them instead of adding copies.
   */
  previous: Variable[];
  /** Responses linked to a case in this dataset. */
  nLinked: number;
  /** Responses whose case index or text no longer matches the dataset (skipped). */
  nMismatched: number;
}

/** Suggested variable name stem for a code: "c_" + a sanitised, shortened name. */
export function codeVarStem(name: string): string {
  const ascii = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  let stem = ascii;
  if (stem.length > 24) {
    stem = stem.slice(0, 24);
    const cut = stem.lastIndexOf('_');
    stem = cut >= 12 ? stem.slice(0, cut) : stem;
  }
  return `c_${stem || 'code'}`;
}

/**
 * The numeric variable previously exported from `codeId` (or COUNT_CODE) for the question
 * `sourceVarId`, identified by its origin attributes. The last one wins when there are several.
 */
export function findExportedVariable(ds: Dataset, codeId: string, sourceVarId: string): Variable | undefined {
  let found: Variable | undefined;
  for (const v of ds.variables)
    if (v.type === 'numeric' && v.attributes?.[CODE_ATTR] === codeId && v.attributes?.[SOURCE_ATTR] === sourceVarId && ds.columns[v.id] instanceof Float64Array) found = v;
  return found;
}

/**
 * Build one numeric 0/1 variable per code for response documents linked to `ds` (TextDoc.caseIndex,
 * TextDoc.varId). Cases with a response get 0 or 1; cases without a response are system-missing.
 * A response is linked only when its variable exists and the case's current answer still matches
 * the response text (so deleted or re-sorted cases are not mislabelled).
 * Optionally adds a count variable (number of the chosen codes mentioned). With `members`, a theme's
 * variable is 1 when the theme or any of its sub-codes was applied.
 *
 * Every variable records its origin (CODE_ATTR, SOURCE_ATTR attributes). With `mode: 'update'`,
 * a code already exported from the same question overwrites that variable's values in place
 * (name, label and other metadata the user may have edited are kept) instead of adding a copy.
 */
export function buildCodeVariables(
  ds: Dataset,
  codes: CodeDef[],
  docs: TextDoc[],
  segments: CodedSegment[],
  codeIds: string[],
  opts: {
    sourceVarId?: string;
    coder?: string | null;
    countVariable?: boolean;
    countName?: string;
    /** Theme variables: code id -> the codes that count for it (the theme and its sub-codes). */
    members?: Record<string, string[]>;
    /** 'update' overwrites variables exported earlier from the same code and question; 'new' (default) adds copies. */
    mode?: ExportMode;
  } = {},
): CodeVariableBuild {
  const linked = new Map<string, number>(); // docId -> case index
  let nMismatched = 0;
  for (const d of docs) {
    if (d.kind !== 'response' || d.caseIndex === undefined || !d.varId) continue;
    if (opts.sourceVarId && d.varId !== opts.sourceVarId) continue;
    const col = ds.columns[d.varId];
    const i = d.caseIndex;
    if (!col || col instanceof Float64Array || i < 0 || i >= ds.nCases || col[i].trim() !== d.text.trim()) {
      nMismatched++;
      continue;
    }
    linked.set(d.id, i);
  }
  // The question the variables come from: the chosen one, or the only one among linked responses.
  let source = opts.sourceVarId ?? null;
  if (!source) {
    const vs = new Set<string>();
    for (const d of docs) if (linked.has(d.id)) vs.add(d.varId!);
    source = vs.size === 1 ? [...vs][0] : null;
  }
  const previousOf = (codeId: string) => (source ? findExportedVariable(ds, codeId, source) : undefined);
  const origin = (codeId: string): Record<string, string> => (source ? { [CODE_ATTR]: codeId, [SOURCE_ATTR]: source } : { [CODE_ATTR]: codeId });
  const previous: Variable[] = [];
  const update = opts.mode === 'update';
  const hasAnswer = new Uint8Array(ds.nCases);
  for (const i of linked.values()) hasAnswer[i] = 1;
  const mentioned = new Map<string, Set<number>>();
  for (const s of segments) {
    if (opts.coder && s.coder !== opts.coder) continue;
    const i = linked.get(s.docId);
    if (i === undefined) continue;
    const set = mentioned.get(s.codeId) ?? new Set<number>();
    set.add(i);
    mentioned.set(s.codeId, set);
  }
  // Names must be unique against the dataset AND against each other.
  let scratch: Dataset = { ...ds, variables: ds.variables.slice() };
  const reserve = (base: string): string => {
    const name = uniqueVarName(scratch, base);
    scratch = { ...scratch, variables: [...scratch.variables, makeVariable({ name })] };
    return name;
  };
  const valueLabels = [
    { value: 0, label: 'Not mentioned' },
    { value: 1, label: 'Mentioned' },
  ];
  const plans: CodeVariablePlan[] = [];
  const counts = new Float64Array(ds.nCases).fill(NaN);
  for (let i = 0; i < ds.nCases; i++) if (hasAnswer[i]) counts[i] = 0;
  for (const codeId of codeIds) {
    const code = codes.find((c) => c.id === codeId);
    if (!code) continue;
    const col = new Float64Array(ds.nCases).fill(NaN);
    const group = opts.members?.[codeId];
    const set = new Set<number>();
    for (const id of group ?? [codeId]) for (const i of mentioned.get(id) ?? []) set.add(i);
    // The count adds each chosen code once, by its own coding (a theme's sub-codes are counted
    // as themselves, not again through the theme).
    const own = mentioned.get(codeId);
    for (let i = 0; i < ds.nCases; i++) {
      if (!hasAnswer[i]) continue;
      col[i] = set.has(i) ? 1 : 0;
      if (own?.has(i)) counts[i] += 1;
    }
    const prev = previousOf(codeId);
    if (prev) previous.push(prev);
    const variable =
      update && prev
        ? { ...prev, attributes: { ...prev.attributes, coding_code: code.name, ...origin(codeId) } }
        : makeVariable({
            name: reserve(codeVarStem(code.name)),
            label: (group && group.length > 1 ? `${code.name} (theme, incl. sub-codes)` : code.name).slice(0, 250),
            type: 'numeric',
            width: 1,
            decimals: 0,
            format: 'F1.0',
            measure: 'nominal',
            valueLabels,
            columns: 8,
            attributes: { coding_code: code.name, ...origin(codeId) },
          });
    plans.push({ variable, column: col, codeId, nMentioned: set.size, replaces: update && prev ? prev.id : null });
  }
  if (opts.countVariable && plans.length) {
    const prev = previousOf(COUNT_CODE);
    if (prev) previous.push(prev);
    const variable =
      update && prev
        ? { ...prev, attributes: { ...prev.attributes, ...origin(COUNT_CODE) } }
        : makeVariable({
            name: reserve(opts.countName || 'c_count'),
            label: 'Number of codes mentioned',
            type: 'numeric',
            width: 3,
            decimals: 0,
            format: 'F3.0',
            measure: 'scale',
            columns: 8,
            attributes: origin(COUNT_CODE),
          });
    let n = 0;
    for (let i = 0; i < ds.nCases; i++) if (counts[i] > 0) n++;
    plans.push({ variable, column: counts, codeId: null, nMentioned: n, replaces: update && prev ? prev.id : null });
  }
  return { plans, previous, nLinked: linked.size, nMismatched };
}

/**
 * Apply a build to the dataset in one immutable update (one undo step): variables that replace an
 * earlier export get their values (and origin attributes) overwritten where they are; new
 * variables are inserted after `afterVarId` (or at the end).
 */
export function applyCodeVariables(ds: Dataset, plans: CodeVariablePlan[], afterVarId?: string | null): Dataset {
  const variables = ds.variables.slice();
  const columns = { ...ds.columns };
  const at = afterVarId ? variables.findIndex((v) => v.id === afterVarId) : -1;
  let insert = at >= 0 ? at + 1 : variables.length;
  for (const p of plans) {
    const idx = p.replaces ? variables.findIndex((v) => v.id === p.replaces) : -1;
    if (idx >= 0) {
      variables[idx] = { ...p.variable, id: p.replaces! };
      columns[p.replaces!] = p.column;
    } else {
      variables.splice(insert++, 0, p.variable);
      columns[p.variable.id] = p.column;
    }
  }
  return { ...ds, variables, columns, version: ds.version + 1 };
}
