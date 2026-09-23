// Mixed-methods bridge: turn codes applied to open-ended responses into 0/1 dataset variables.

import type { CodeDef, CodedSegment, TextDoc } from '../../core/coding-types';
import type { Dataset, Variable } from '../../core/types';
import { makeVariable } from '../../core/types';
import { uniqueVarName } from '../../core/data';

export interface CodeVariablePlan {
  variable: Variable;
  column: Float64Array;
  codeId: string | null;
  /** Cases marked 1 (mentioned). */
  nMentioned: number;
}

export interface CodeVariableBuild {
  plans: CodeVariablePlan[];
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
 * Build one numeric 0/1 variable per code for response documents linked to `ds` (TextDoc.caseIndex,
 * TextDoc.varId). Cases with a response get 0 or 1; cases without a response are system-missing.
 * A response is linked only when its variable exists and the case's current answer still matches
 * the response text (so deleted or re-sorted cases are not mislabelled).
 * Optionally adds a count variable (number of the chosen codes mentioned).
 */
export function buildCodeVariables(
  ds: Dataset,
  codes: CodeDef[],
  docs: TextDoc[],
  segments: CodedSegment[],
  codeIds: string[],
  opts: { sourceVarId?: string; coder?: string | null; countVariable?: boolean; countName?: string } = {},
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
    const set = mentioned.get(codeId) ?? new Set<number>();
    for (let i = 0; i < ds.nCases; i++) {
      if (!hasAnswer[i]) continue;
      const v = set.has(i) ? 1 : 0;
      col[i] = v;
      counts[i] += v;
    }
    const variable = makeVariable({
      name: reserve(codeVarStem(code.name)),
      label: code.name.slice(0, 250),
      type: 'numeric',
      width: 1,
      decimals: 0,
      format: 'F1.0',
      measure: 'nominal',
      valueLabels,
      columns: 8,
      attributes: { coding_code: code.name },
    });
    plans.push({ variable, column: col, codeId, nMentioned: set.size });
  }
  if (opts.countVariable && plans.length) {
    const variable = makeVariable({
      name: reserve(opts.countName || 'c_count'),
      label: 'Number of codes mentioned',
      type: 'numeric',
      width: 3,
      decimals: 0,
      format: 'F3.0',
      measure: 'scale',
      columns: 8,
    });
    let n = 0;
    for (let i = 0; i < ds.nCases; i++) if (counts[i] > 0) n++;
    plans.push({ variable, column: counts, codeId: null, nMentioned: n });
  }
  return { plans, nLinked: linked.size, nMismatched };
}
