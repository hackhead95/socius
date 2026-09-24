// AGGREGATE: summaries per group of break variables, added to the active file or as a new dataset.

import type { Column, Dataset, Variable } from '../../core/types';
import { makeDataset, newId } from '../../core/types';
import { activeCaseMask, caseWeights, isMissingValue, validateVarName } from '../../core/data';
import { bump, newNumericVar, plural, type TransformResult } from './dsops';
import { lines, q, varList } from './syntax';

export type AggFunction = 'mean' | 'sum' | 'n' | 'nu' | 'nvalid' | 'nmiss' | 'min' | 'max' | 'sd' | 'first' | 'last';

export const AGG_FUNCTIONS: Array<{ id: AggFunction; label: string; spss: string }> = [
  { id: 'mean', label: 'Mean', spss: 'MEAN' },
  { id: 'sum', label: 'Sum', spss: 'SUM' },
  { id: 'n', label: 'Number of cases (weighted)', spss: 'N' },
  { id: 'nu', label: 'Number of cases (unweighted)', spss: 'NU' },
  { id: 'nvalid', label: 'Number of valid values', spss: 'N' },
  { id: 'nmiss', label: 'Number of missing values', spss: 'NMISS' },
  { id: 'min', label: 'Minimum', spss: 'MIN' },
  { id: 'max', label: 'Maximum', spss: 'MAX' },
  { id: 'sd', label: 'Standard deviation', spss: 'SD' },
  { id: 'first', label: 'First value', spss: 'FIRST' },
  { id: 'last', label: 'Last value', spss: 'LAST' },
];

export interface AggItem {
  /** Source variable (not needed for n / nu). */
  sourceId?: string;
  fn: AggFunction;
  name: string;
  label?: string;
}

export interface AggregateSpec {
  breakIds: string[];
  items: AggItem[];
  output: 'add' | 'new';
  /** Name for the new dataset (output 'new'). */
  newName?: string;
}

export class AggregateError extends Error {}

/** Functions that work on string (text) variables, as in SPSS AGGREGATE. */
export const STRING_AGG_FUNCTIONS: readonly AggFunction[] = ['first', 'last', 'min', 'max', 'nvalid', 'nmiss'];

/** Functions that need a source variable (all except the group counts N and NU). */
export const aggNeedsSource = (fn: AggFunction) => fn !== 'n' && fn !== 'nu';

/** Functions whose result is a count (numeric, whatever the source type). */
const isCount = (fn: AggFunction) => fn === 'n' || fn === 'nu' || fn === 'nvalid' || fn === 'nmiss';

const labelOf = (fn: AggFunction) => AGG_FUNCTIONS.find((f) => f.id === fn)!.label;

/** "First value, Last value, Minimum, Maximum, Number of valid values or Number of missing values". */
const STRING_FUNCTIONS_TEXT = STRING_AGG_FUNCTIONS.map(labelOf).map((l, i, a) => (i === a.length - 1 ? `or ${l}` : l)).join(', ').replace(', or ', ' or ');

export function aggregate(ds: Dataset, spec: AggregateSpec): TransformResult & { newDataset?: Dataset } {
  if (!spec.items.length) throw new AggregateError('Add at least one summary (for example the mean of income).');
  const breaks = spec.breakIds.map((id) => ds.variables.find((v) => v.id === id)!);
  const mask = activeCaseMask(ds);
  const w = caseWeights(ds);
  // group key per case
  const keyOf = (i: number) => breaks.map((b) => { const x = ds.columns[b.id][i]; return typeof x === 'string' ? 's' + x.trimEnd() : Number.isNaN(x) ? 'm' : 'n' + x; }).join('\u0001');
  const groups = new Map<string, number[]>();
  const order: string[] = [];
  const groupOfCase = new Array<string>(ds.nCases);
  for (let i = 0; i < ds.nCases; i++) {
    const k = keyOf(i);
    groupOfCase[i] = k;
    if (!mask[i]) continue;
    if (!groups.has(k)) {
      groups.set(k, []);
      order.push(k);
    }
    groups.get(k)!.push(i);
  }
  const names = new Set<string>();
  const probe = spec.output === 'add' ? ds : makeDataset({ name: 'x', variables: breaks });
  for (const it of spec.items) {
    const err = validateVarName(probe, it.name.trim());
    if (err) throw new AggregateError(`${it.name || 'Summary name'}: ${err}`);
    if (names.has(it.name.trim().toLowerCase())) throw new AggregateError(`The name ${it.name} is used twice.`);
    names.add(it.name.trim().toLowerCase());
    if (aggNeedsSource(it.fn)) {
      const v = ds.variables.find((x) => x.id === it.sourceId);
      if (!v) throw new AggregateError(`Choose a source variable for ${it.name}.`);
      if (v.type !== 'numeric' && !STRING_AGG_FUNCTIONS.includes(it.fn))
        throw new AggregateError(`${v.name} is a string (text) variable, so its ${labelOf(it.fn).toLowerCase()} cannot be computed. For text, use ${STRING_FUNCTIONS_TEXT}.`);
    }
  }
  const summarize = (it: AggItem, rows: number[]): number | string => {
    if (it.fn === 'n') return rows.reduce((s, i) => s + (w[i] > 0 ? w[i] : 0), 0);
    if (it.fn === 'nu') return rows.length;
    const v = ds.variables.find((x) => x.id === it.sourceId)!;
    const col = ds.columns[v.id];
    if (it.fn === 'nvalid' || it.fn === 'nmiss') {
      // SPSS N(var) / NMISS(var): weighted counts of the cases with a valid / a missing value.
      let k = 0;
      for (const i of rows) if (w[i] > 0 && isMissingValue(v, col[i]) === (it.fn === 'nmiss')) k += w[i];
      return k;
    }
    const valid = rows.filter((i) => w[i] > 0 && !isMissingValue(v, col[i]));
    const empty = v.type === 'numeric' ? NaN : '';
    if (it.fn === 'first') return valid.length ? col[valid[0]] : empty;
    if (it.fn === 'last') return valid.length ? col[valid[valid.length - 1]] : empty;
    if (!valid.length) return empty;
    if (it.fn === 'min' || it.fn === 'max') {
      // A loop, not Math.min(...values): spreading a large group overflows the call stack.
      const sign = it.fn === 'min' ? -1 : 1;
      if (v.type === 'string') {
        const sc = col as string[];
        let best = sc[valid[0]].trimEnd();
        for (const i of valid) {
          const x = sc[i].trimEnd();
          if (sign < 0 ? x < best : x > best) best = x;
        }
        return best;
      }
      const nc = col as Float64Array;
      let best = nc[valid[0]];
      for (const i of valid) if (sign < 0 ? nc[i] < best : nc[i] > best) best = nc[i];
      return best;
    }
    const nc = col as Float64Array;
    let sw = 0, sx = 0;
    for (const i of valid) { sw += w[i]; sx += w[i] * nc[i]; }
    if (it.fn === 'sum') return sx;
    const mean = sx / sw;
    if (it.fn === 'mean') return mean;
    let ss = 0;
    for (const i of valid) ss += w[i] * (nc[i] - mean) ** 2;
    return sw > 1 ? Math.sqrt(ss / (sw - 1)) : NaN;
  };
  const results = new Map<string, Array<number | string>>();
  for (const k of order) results.set(k, spec.items.map((it) => summarize(it, groups.get(k)!)));

  const itemVar = (it: AggItem): Variable => {
    const src = it.sourceId ? ds.variables.find((x) => x.id === it.sourceId) : undefined;
    const fnLabel = labelOf(it.fn);
    const label = it.label || (src ? `${fnLabel} of ${src.label || src.name}` : fnLabel);
    if (src && src.type === 'string' && !isCount(it.fn)) return { ...src, id: newId('v'), name: it.name.trim(), label };
    const dec = isCount(it.fn) ? (ds.weightVarId && it.fn !== 'nu' ? 2 : 0) : it.fn === 'first' || it.fn === 'last' || it.fn === 'min' || it.fn === 'max' ? src?.decimals ?? 2 : 2;
    return newNumericVar(it.name.trim(), { label, decimals: dec, measure: 'scale', valueLabels: (it.fn === 'first' || it.fn === 'last') && src ? src.valueLabels : [] });
  };
  const fnSyn = spec.items
    .map((it) => {
      const f = AGG_FUNCTIONS.find((x) => x.id === it.fn)!.spss;
      const src = it.sourceId ? ds.variables.find((x) => x.id === it.sourceId)?.name : '';
      return `  /${it.name.trim()}=${f}${src ? `(${src})` : ''}`;
    })
    .join('\n');
  const breakSyn = breaks.length ? `\n  /BREAK=${varList(breaks.map((b) => b.name))}` : '';

  if (spec.output === 'add') {
    const vars = spec.items.map(itemVar);
    const columns: Record<string, Column> = { ...ds.columns };
    vars.forEach((nv, j) => {
      if (nv.type === 'numeric') {
        const c = new Float64Array(ds.nCases).fill(NaN);
        for (let i = 0; i < ds.nCases; i++) { const r = results.get(groupOfCase[i]); if (r) c[i] = r[j] as number; }
        columns[nv.id] = c;
      } else {
        const c = new Array<string>(ds.nCases).fill('');
        for (let i = 0; i < ds.nCases; i++) { const r = results.get(groupOfCase[i]); if (r) c[i] = r[j] as string; }
        columns[nv.id] = c;
      }
    });
    return {
      dataset: bump(ds, { variables: [...ds.variables, ...vars], columns }),
      title: 'Aggregate',
      syntax: `AGGREGATE\n  /OUTFILE=* MODE=ADDVARIABLES${breakSyn}\n${fnSyn}.`,
      summary: `Added ${plural(vars.length, 'group summary', 'group summaries')} (${vars.map((v) => v.name).join(', ')}) over ${plural(order.length, 'group')}.`,
      warnings: [],
    };
  }

  const n = order.length;
  const variables: Variable[] = [];
  const columns: Record<string, Column> = {};
  breaks.forEach((b) => {
    const nv: Variable = { ...b, id: newId('v') };
    const src = ds.columns[b.id];
    const first = order.map((k) => groups.get(k)![0]);
    columns[nv.id] = src instanceof Float64Array ? Float64Array.from(first.map((i) => src[i])) : first.map((i) => src[i]);
    variables.push(nv);
  });
  spec.items.forEach((it, j) => {
    const nv = itemVar(it);
    const vals = order.map((k) => results.get(k)![j]);
    columns[nv.id] = nv.type === 'numeric' ? Float64Array.from(vals as number[]) : (vals as string[]);
    variables.push(nv);
  });
  const newDs = makeDataset({ name: spec.newName?.trim() || `${ds.name} (aggregated)`, variables, columns, nCases: n, source: { kind: 'new' } });
  return {
    dataset: ds,
    newDataset: newDs,
    title: 'Aggregate',
    syntax: lines(`AGGREGATE\n  /OUTFILE=${q(newDs.name)}${breakSyn}\n${fnSyn}.`),
    summary: `Created a new dataset "${newDs.name}" with ${plural(n, 'case')} (one per group) and ${plural(variables.length, 'variable')}.`,
    warnings: [],
  };
}

