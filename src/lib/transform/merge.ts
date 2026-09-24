// Merge Files: Add Cases (ADD FILES) and Add Variables (MATCH FILES).

import type { Column, Dataset, ValueLabel, Variable } from '../../core/types';
import { newId } from '../../core/types';
import { uniqueVarName } from '../../core/data';
import { bump, fmtN, newNumericVar, plural, type TransformResult } from './dsops';
import { lines, q, varList } from './syntax';

export class MergeError extends Error {}

function emptyValue(type: Variable['type']): number | string {
  return type === 'numeric' ? NaN : '';
}

function mergeLabels(a: ValueLabel[], b: ValueLabel[]): ValueLabel[] {
  const out = a.slice();
  const key = (v: number | string) => (typeof v === 'string' ? 's:' + v.trimEnd() : 'n:' + v);
  const have = new Set(a.map((l) => key(l.value)));
  for (const l of b) if (!have.has(key(l.value))) out.push(l);
  return out;
}

export interface VariablePairing {
  paired: Array<{ active: Variable; other: Variable }>;
  onlyActive: Variable[];
  onlyOther: Variable[];
  /** Same name but different type (kept apart). */
  typeConflicts: Array<{ active: Variable; other: Variable }>;
}

export function pairVariables(active: Dataset, other: Dataset): VariablePairing {
  const byName = new Map(other.variables.map((v) => [v.name.toLowerCase(), v] as const));
  const res: VariablePairing = { paired: [], onlyActive: [], onlyOther: [], typeConflicts: [] };
  const used = new Set<string>();
  for (const a of active.variables) {
    const o = byName.get(a.name.toLowerCase());
    if (!o) res.onlyActive.push(a);
    else if (o.type !== a.type) {
      res.typeConflicts.push({ active: a, other: o });
      res.onlyActive.push(a);
    } else {
      res.paired.push({ active: a, other: o });
      used.add(o.id);
    }
  }
  for (const o of other.variables) if (!used.has(o.id)) res.onlyOther.push(o);
  return res;
}

export interface AddCasesOptions {
  /** Keep variables that exist in only one of the files (default true, like ADD FILES). */
  keepUnpaired?: boolean;
  /** Name of a 0/1 indicator variable marking cases from the second file. */
  sourceVar?: string;
  otherName?: string;
}

export function addCases(active: Dataset, other: Dataset, opts: AddCasesOptions = {}): TransformResult {
  const keepUnpaired = opts.keepUnpaired ?? true;
  const pairing = pairVariables(active, other);
  const nA = active.nCases, nB = other.nCases, n = nA + nB;
  const warnings: string[] = [];
  const otherToActive = new Map(pairing.paired.map((p) => [p.other.id, p.active] as const));
  const pairedActiveIds = new Set(pairing.paired.map((p) => p.active.id));
  const variables: Variable[] = [];
  const columns: Record<string, Column> = {};

  const fill = (type: Variable['type'], srcA: Column | null, srcB: Column | null): Column => {
    if (type === 'numeric') {
      const c = new Float64Array(n).fill(NaN);
      if (srcA) c.set(srcA as Float64Array, 0);
      if (srcB) c.set(srcB as Float64Array, nA);
      return c;
    }
    const c = new Array<string>(n).fill('');
    if (srcA) for (let i = 0; i < nA; i++) c[i] = (srcA as string[])[i];
    if (srcB) for (let i = 0; i < nB; i++) c[nA + i] = (srcB as string[])[i];
    return c;
  };

  for (const a of active.variables) {
    const isPaired = pairedActiveIds.has(a.id);
    if (!isPaired && !keepUnpaired) continue;
    const p = pairing.paired.find((x) => x.active.id === a.id);
    const nv: Variable = p
      ? {
          ...a,
          width: a.type === 'string' ? Math.max(a.width, p.other.width) : a.width,
          format: a.type === 'string' ? `A${Math.max(a.width, p.other.width)}` : a.format,
          valueLabels: mergeLabels(a.valueLabels, p.other.valueLabels),
          label: a.label || p.other.label,
        }
      : a;
    variables.push(nv);
    columns[a.id] = fill(a.type, active.columns[a.id], p ? other.columns[p.other.id] : null);
  }
  const tmp = { ...active, variables } as Dataset;
  if (keepUnpaired) {
    for (const o of other.variables) {
      if (otherToActive.has(o.id)) continue;
      const conflict = pairing.typeConflicts.find((c) => c.other.id === o.id);
      const name = uniqueVarName(tmp, o.name);
      if (conflict) warnings.push(`${o.name} is ${o.type} in the second file but ${conflict.active.type} here, so it was added as ${name}.`);
      const nv: Variable = { ...o, id: newId('v'), name };
      tmp.variables.push(nv);
      columns[nv.id] = fill(o.type, null, other.columns[o.id]);
    }
  } else if (pairing.onlyActive.length + pairing.onlyOther.length) {
    warnings.push(`Dropped ${plural(pairing.onlyActive.length + pairing.onlyOther.length, 'variable')} found in only one file.`);
  }
  let srcName = '';
  if (opts.sourceVar && opts.sourceVar.trim()) {
    srcName = uniqueVarName(tmp, opts.sourceVar.trim());
    const c = new Float64Array(n);
    for (let i = nA; i < n; i++) c[i] = 1;
    const nv = newNumericVar(srcName, {
      label: 'Case source',
      decimals: 0,
      width: 1,
      measure: 'nominal',
      valueLabels: [
        { value: 0, label: active.name || 'Active file' },
        { value: 1, label: opts.otherName || other.name || 'Added file' },
      ],
    });
    tmp.variables.push(nv);
    columns[nv.id] = c;
  }
  const keptIds = new Set(tmp.variables.map((v) => v.id));
  const next = bump(active, {
    variables: tmp.variables,
    columns,
    nCases: n,
    weightVarId: active.weightVarId && keptIds.has(active.weightVarId) ? active.weightVarId : null,
    filterVarId: active.filterVarId && keptIds.has(active.filterVarId) ? active.filterVarId : null,
  });
  const fileRef = q(opts.otherName ?? other.name);
  const syntax = lines(
    `ADD FILES /FILE=*\n  /FILE=${fileRef}${srcName ? `\n  /IN=${srcName}` : ''}${!keepUnpaired ? `\n  /KEEP=${varList(pairing.paired.map((p) => p.active.name))}` : ''}.`,
    'EXECUTE.',
  );
  return {
    dataset: next,
    title: 'Merge Files: Add Cases',
    syntax,
    summary: `Added ${plural(nB, 'case')} from ${opts.otherName ?? other.name}: ${plural(pairing.paired.length, 'variable')} matched by name, now ${fmtN(n)} cases.`,
    warnings,
  };
}

export type AddVariablesOptions =
  | { mode: 'order'; otherName?: string }
  | {
      mode: 'key';
      /** Key variable name (must exist in both files with the same type). */
      key: string;
      /** The second file is a lookup table: many active cases may share one key. */
      lookup?: boolean;
      /** Also add cases whose key exists only in the second file (default true for one-to-one). */
      keepUnmatchedOther?: boolean;
      otherName?: string;
    };

export function addVariables(active: Dataset, other: Dataset, opts: AddVariablesOptions): TransformResult {
  const warnings: string[] = [];
  const activeNames = new Set(active.variables.map((v) => v.name.toLowerCase()));
  const keyName = opts.mode === 'key' ? opts.key.toLowerCase() : null;
  const incoming = other.variables.filter((v) => v.name.toLowerCase() !== keyName && !activeNames.has(v.name.toLowerCase()));
  const dup = other.variables.filter((v) => v.name.toLowerCase() !== keyName && activeNames.has(v.name.toLowerCase()));
  if (dup.length) warnings.push(`Skipped ${plural(dup.length, 'variable')} that already exist here: ${dup.slice(0, 8).map((v) => v.name).join(', ')}${dup.length > 8 ? ', ...' : ''}.`);
  if (!incoming.length) throw new MergeError('The second file has no new variables to add (all its variable names already exist here).');
  const otherName = opts.otherName ?? other.name;

  // rowMap[i] = row of `other` for result row i (or -1); activeRow[i] = row of active (or -1).
  let activeRow: Int32Array;
  let rowMap: Int32Array;
  let keyFill: { varId: string; values: Array<number | string> } | null = null;
  let matched = 0;

  if (opts.mode === 'order') {
    const n = Math.max(active.nCases, other.nCases);
    activeRow = new Int32Array(n).map((_, i) => (i < active.nCases ? i : -1));
    rowMap = new Int32Array(n).map((_, i) => (i < other.nCases ? i : -1));
    matched = Math.min(active.nCases, other.nCases);
    if (active.nCases !== other.nCases)
      warnings.push(`The files have different numbers of cases (${fmtN(active.nCases)} and ${fmtN(other.nCases)}). Cases were matched by position.`);
  } else {
    const ka = active.variables.find((v) => v.name.toLowerCase() === keyName);
    const kb = other.variables.find((v) => v.name.toLowerCase() === keyName);
    if (!ka) throw new MergeError(`The key variable ${opts.key} is not in the active file.`);
    if (!kb) throw new MergeError(`The key variable ${opts.key} is not in the second file.`);
    if (ka.type !== kb.type) throw new MergeError(`${opts.key} is ${ka.type} in one file and ${kb.type} in the other. Convert one so they match.`);
    const norm = (x: number | string) => (typeof x === 'string' ? x.trimEnd() : x);
    const isEmpty = (x: number | string) => (typeof x === 'string' ? x.trim() === '' : Number.isNaN(x));
    const colB = other.columns[kb.id];
    const map = new Map<number | string, number>();
    let dupB = 0;
    for (let j = 0; j < other.nCases; j++) {
      const k = colB[j];
      if (isEmpty(k)) continue;
      const kk = norm(k);
      if (map.has(kk)) dupB++;
      else map.set(kk, j);
    }
    if (dupB) warnings.push(`${plural(dupB, 'case')} in the second file repeat a key that appeared earlier; the first case with each key was used.`);
    const colA = active.columns[ka.id];
    const seenA = new Map<number | string, number>();
    let dupA = 0;
    const rowsA: number[] = [];
    const rowsB: number[] = [];
    const usedB = new Set<number>();
    for (let i = 0; i < active.nCases; i++) {
      const k = colA[i];
      let j = -1;
      if (!isEmpty(k)) {
        const kk = norm(k);
        seenA.set(kk, (seenA.get(kk) ?? 0) + 1);
        if ((seenA.get(kk) ?? 0) > 1) dupA++;
        j = map.get(kk) ?? -1;
        if (j >= 0 && !opts.lookup && usedB.has(j)) j = -1;
      }
      if (j >= 0) {
        matched++;
        usedB.add(j);
      }
      rowsA.push(i);
      rowsB.push(j);
    }
    if (dupA && !opts.lookup)
      warnings.push(`${plural(dupA, 'case')} in the active file repeat a key; only the first was matched. If many cases share a key, treat the second file as a lookup table.`);
    const keepOther = opts.keepUnmatchedOther ?? !opts.lookup;
    const extraKeys: Array<number | string> = [];
    if (keepOther) {
      for (let j = 0; j < other.nCases; j++) {
        if (usedB.has(j) || isEmpty(colB[j])) continue;
        if (map.get(norm(colB[j])) !== j) continue;
        rowsA.push(-1);
        rowsB.push(j);
        extraKeys.push(colB[j]);
      }
    }
    activeRow = Int32Array.from(rowsA);
    rowMap = Int32Array.from(rowsB);
    if (extraKeys.length) {
      keyFill = { varId: ka.id, values: extraKeys };
      warnings.push(`Added ${plural(extraKeys.length, 'case')} whose key exists only in the second file.`);
    }
  }

  const n = activeRow.length;
  const columns: Record<string, Column> = {};
  const identity = n === active.nCases && activeRow.every((r, i) => r === i);
  for (const v of active.variables) {
    const src = active.columns[v.id];
    if (identity) {
      columns[v.id] = src;
      continue;
    }
    if (src instanceof Float64Array) {
      const c = new Float64Array(n);
      for (let i = 0; i < n; i++) c[i] = activeRow[i] >= 0 ? src[activeRow[i]] : NaN;
      columns[v.id] = c;
    } else {
      const c = new Array<string>(n);
      for (let i = 0; i < n; i++) c[i] = activeRow[i] >= 0 ? src[activeRow[i]] : '';
      columns[v.id] = c;
    }
  }
  if (keyFill) {
    const c = columns[keyFill.varId];
    let k = 0;
    for (let i = 0; i < n; i++) if (activeRow[i] < 0) (c as Array<number | string>)[i] = keyFill.values[k++] as never;
  }
  const newVars: Variable[] = [];
  for (const v of incoming) {
    const nv: Variable = { ...v, id: newId('v') };
    const src = other.columns[v.id];
    if (src instanceof Float64Array) {
      const c = new Float64Array(n);
      for (let i = 0; i < n; i++) c[i] = rowMap[i] >= 0 ? src[rowMap[i]] : NaN;
      columns[nv.id] = c;
    } else {
      const c = new Array<string>(n);
      for (let i = 0; i < n; i++) c[i] = rowMap[i] >= 0 ? src[rowMap[i]] : (emptyValue('string') as string);
      columns[nv.id] = c;
    }
    newVars.push(nv);
  }
  const next = bump(active, { variables: [...active.variables, ...newVars], columns, nCases: n });
  const fileRef = q(otherName);
  const syntax =
    opts.mode === 'order'
      ? `MATCH FILES /FILE=*\n  /FILE=${fileRef}.\nEXECUTE.`
      : lines(
          `* Both files must be sorted by ${opts.key} for SPSS.`,
          `MATCH FILES /FILE=*\n  /${opts.lookup ? 'TABLE' : 'FILE'}=${fileRef}\n  /BY ${opts.key}.`,
          'EXECUTE.',
        );
  return {
    dataset: next,
    title: 'Merge Files: Add Variables',
    syntax,
    summary: `Added ${plural(newVars.length, 'variable')} from ${otherName}${opts.mode === 'key' ? `, matched on ${opts.key} (${fmtN(matched)} of ${fmtN(active.nCases)} cases matched)` : ' by case order'}.`,
    warnings,
  };
}
