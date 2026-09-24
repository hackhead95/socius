// Case-level operations: Select Cases (filter or delete), Sort Cases, Weight Cases.

import type { Dataset, Variable } from '../../core/types';
import { isUserMissing, uniqueVarName } from '../../core/data';
import { compileExpression } from './evaluate';
import { ExprError } from './expr';
import { addVariable, bump, fmtN, newNumericVar, plural, replaceVariable, takeRows, type TransformResult } from './dsops';
import { lines, q } from './syntax';

export class CasesError extends Error {
  pos?: number;
  end?: number;
  constructor(message: string, pos?: number, end?: number) {
    super(message);
    this.pos = pos;
    this.end = end;
  }
}

/** Small seeded PRNG (mulberry32): same seed, same sample. */
export function seededRandom(seed: number): () => number {
  let a = (Math.floor(seed) >>> 0) || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SelectMethod =
  | { kind: 'all' }
  | { kind: 'if'; condition: string }
  | { kind: 'percent'; percent: number; seed: number }
  | { kind: 'exact'; n: number; ofFirst: number; seed: number }
  | { kind: 'range'; from: number; to: number }
  | { kind: 'variable'; varId: string };

export type SelectOutput = 'filter' | 'delete';

/**
 * Selection per case: 1 selected, 0 not selected, NaN when the condition is missing (not selected).
 */
export function selectionValues(ds: Dataset, method: SelectMethod): Float64Array {
  const n = ds.nCases;
  const out = new Float64Array(n);
  switch (method.kind) {
    case 'all':
      out.fill(1);
      break;
    case 'if': {
      let c;
      try {
        c = compileExpression(ds, method.condition);
      } catch (e) {
        if (e instanceof ExprError) throw new CasesError(e.message, e.pos, e.end);
        throw e;
      }
      if (c.type !== 'num') throw new CasesError('The condition must be a comparison such as age >= 18, not text.', 0, method.condition.length);
      for (let i = 0; i < n; i++) {
        const x = c.evaluate(i) as number;
        out[i] = Number.isNaN(x) ? NaN : x !== 0 ? 1 : 0;
      }
      break;
    }
    case 'percent': {
      if (!(method.percent > 0 && method.percent < 100)) throw new CasesError('Enter a percentage between 0 and 100.');
      const rnd = seededRandom(method.seed);
      const p = method.percent / 100;
      for (let i = 0; i < n; i++) out[i] = rnd() < p ? 1 : 0;
      break;
    }
    case 'exact': {
      const N = Math.min(Math.floor(method.ofFirst), n);
      const k = Math.floor(method.n);
      if (!(N >= 1)) throw new CasesError('"From the first" must be at least 1 case.');
      if (!(k >= 1 && k <= N)) throw new CasesError(`Choose between 1 and ${fmtN(N)} cases.`);
      // Sequential sampling (the algorithm SPSS's generated syntax uses): each case is taken with
      // probability (still needed) / (still available), giving exactly k of the first N.
      const rnd = seededRandom(method.seed);
      let need = k, avail = N;
      for (let i = 0; i < n; i++) {
        if (i < N) {
          const take = rnd() * avail < need ? 1 : 0;
          out[i] = take;
          need -= take;
          avail--;
        } else out[i] = 0;
      }
      break;
    }
    case 'range': {
      const a = Math.floor(method.from), b = Math.floor(method.to);
      if (!(a >= 1 && b >= a)) throw new CasesError('Enter a first case of at least 1 and a last case after it.');
      for (let i = 0; i < n; i++) out[i] = i + 1 >= a && i + 1 <= b ? 1 : 0;
      break;
    }
    case 'variable': {
      const v = ds.variables.find((x) => x.id === method.varId);
      if (!v || v.type !== 'numeric') throw new CasesError('Choose a numeric filter variable.');
      const col = ds.columns[v.id] as Float64Array;
      for (let i = 0; i < n; i++) out[i] = Number.isNaN(col[i]) || isUserMissing(v.missing, col[i]) ? NaN : col[i] !== 0 ? 1 : 0;
      break;
    }
  }
  return out;
}

function describeMethod(ds: Dataset, m: SelectMethod): { text: string; filterExpr: string; syntaxPrefix: string[] } {
  switch (m.kind) {
    case 'all': return { text: 'all cases', filterExpr: '1', syntaxPrefix: [] };
    case 'if': return { text: m.condition.trim(), filterExpr: m.condition.trim(), syntaxPrefix: [] };
    case 'percent': return {
      text: `approximately ${m.percent}% of cases (seed ${m.seed})`,
      filterExpr: `(UNIFORM(1)<=${m.percent / 100})`,
      syntaxPrefix: [`SET SEED=${m.seed}.`],
    };
    case 'exact': return {
      text: `exactly ${m.n} from the first ${m.ofFirst} cases (seed ${m.seed})`,
      filterExpr: '',
      syntaxPrefix: [`SET SEED=${m.seed}.`],
    };
    case 'range': return { text: `cases ${m.from} to ${m.to}`, filterExpr: `($CASENUM >= ${m.from} AND $CASENUM <= ${m.to})`, syntaxPrefix: [] };
    case 'variable': {
      const v = ds.variables.find((x) => x.id === m.varId);
      return { text: `cases where ${v?.name} is not 0 or missing`, filterExpr: v?.name ?? '', syntaxPrefix: [] };
    }
  }
}

export const FILTER_VAR_NAME = 'filter_$';

export function selectCasesTransform(ds: Dataset, method: SelectMethod, output: SelectOutput): TransformResult {
  if (method.kind === 'all') {
    return {
      dataset: bump(ds, { filterVarId: null }),
      title: 'Select Cases',
      syntax: 'FILTER OFF.\nUSE ALL.\nEXECUTE.',
      summary: `All ${fmtN(ds.nCases)} cases are used again (filter off).`,
      warnings: [],
    };
  }
  const sel = selectionValues(ds, method);
  let nSel = 0;
  for (let i = 0; i < sel.length; i++) if (sel[i] === 1) nSel++;
  const d = describeMethod(ds, method);
  const exactSyntax =
    method.kind === 'exact'
      ? [
          'DO IF $CASENUM=1.',
          `COMPUTE #s_$_1=${method.n}.`,
          `COMPUTE #s_$_2=${Math.min(method.ofFirst, ds.nCases)}.`,
          'END IF.',
          `DO IF $CASENUM<=${Math.min(method.ofFirst, ds.nCases)}.`,
          'COMPUTE filter_$=UNIFORM(1)*#s_$_2 < #s_$_1.',
          'COMPUTE #s_$_1=#s_$_1 - filter_$.',
          'COMPUTE #s_$_2=#s_$_2 - 1.',
          'ELSE.',
          'COMPUTE filter_$=0.',
          'END IF.',
        ]
      : null;

  if (output === 'delete') {
    if (nSel === 0) throw new CasesError('No cases match, so deleting the others would leave an empty file.');
    const keep: number[] = [];
    for (let i = 0; i < sel.length; i++) if (sel[i] === 1) keep.push(i);
    const next = takeRows(ds, keep);
    const syntax =
      method.kind === 'variable'
        ? `SELECT IF (${d.filterExpr} ~= 0 AND NOT MISSING(${d.filterExpr})).\nEXECUTE.`
        : exactSyntax
          ? lines(...d.syntaxPrefix, ...exactSyntax, 'SELECT IF filter_$.', 'EXECUTE.')
          : lines(...d.syntaxPrefix, `SELECT IF ${d.filterExpr.startsWith('(') ? d.filterExpr : `(${d.filterExpr})`}.`, 'EXECUTE.');
    return {
      dataset: next,
      title: 'Select Cases',
      syntax,
      summary: `Kept ${fmtN(nSel)} of ${fmtN(ds.nCases)} cases (${d.text}); deleted ${plural(ds.nCases - nSel, 'case')}.`,
      warnings: [],
    };
  }

  if (method.kind === 'variable') {
    return {
      dataset: bump(ds, { filterVarId: method.varId }),
      title: 'Select Cases',
      syntax: `FILTER BY ${d.filterExpr}.\nEXECUTE.`,
      summary: `Filter on: ${fmtN(nSel)} of ${fmtN(ds.nCases)} cases selected (${d.text}).`,
      warnings: [],
    };
  }

  const label = `${d.text} (FILTER)`.slice(0, 255);
  const existing = ds.variables.find((v) => v.name.toLowerCase() === FILTER_VAR_NAME);
  const def: Partial<Variable> = {
    label,
    decimals: 0,
    width: 1,
    format: 'F1.0',
    measure: 'nominal',
    columns: 8,
    valueLabels: [
      { value: 0, label: 'Not selected' },
      { value: 1, label: 'Selected' },
    ],
    missing: { discrete: [] },
  };
  let next: Dataset;
  let varId: string;
  let fname: string;
  if (existing && existing.type === 'numeric') {
    next = replaceVariable(ds, { ...existing, ...def, id: existing.id, name: existing.name, type: 'numeric' }, sel);
    varId = existing.id;
    fname = existing.name;
  } else {
    // filter_$ is taken by a string variable: use the next free name (never a duplicate).
    fname = existing ? uniqueVarName(ds, FILTER_VAR_NAME) : FILTER_VAR_NAME;
    const nv = newNumericVar(fname, def);
    next = addVariable(ds, nv, sel);
    varId = nv.id;
  }
  next = { ...next, filterVarId: varId };
  const rename = (line: string) => line.split(FILTER_VAR_NAME).join(fname);
  const syntax = lines(
    'USE ALL.',
    ...d.syntaxPrefix,
    ...(exactSyntax ? exactSyntax.map(rename) : [`COMPUTE ${fname}=${d.filterExpr.startsWith('(') ? d.filterExpr : `(${d.filterExpr})`}.`]),
    `VARIABLE LABELS ${fname} ${q(label)}.`,
    `VALUE LABELS ${fname} 0 'Not selected' 1 'Selected'.`,
    `FORMATS ${fname} (F1.0).`,
    `FILTER BY ${fname}.`,
    'EXECUTE.',
  );
  return {
    dataset: next,
    title: 'Select Cases',
    syntax,
    summary: `Filter on: ${fmtN(nSel)} of ${fmtN(ds.nCases)} cases selected (${d.text}). Unselected cases stay in the file.`,
    warnings: [],
  };
}

// ---------- Sort ----------

export interface SortKey {
  varId: string;
  dir: 'asc' | 'desc';
}

/** Stable multi-key sort order. System-missing sorts lowest (first when ascending), as in SPSS. */
export function sortOrder(ds: Dataset, keys: SortKey[]): Uint32Array {
  const n = ds.nCases;
  const order = new Uint32Array(n);
  for (let i = 0; i < n; i++) order[i] = i;
  const cols = keys.map((k) => ({ col: ds.columns[k.varId], sign: k.dir === 'asc' ? 1 : -1 }));
  const arr = Array.from(order);
  arr.sort((a, b) => {
    for (const { col, sign } of cols) {
      let c = 0;
      if (col instanceof Float64Array) {
        const x = col[a], y = col[b];
        const xn = Number.isNaN(x), yn = Number.isNaN(y);
        c = xn && yn ? 0 : xn ? -1 : yn ? 1 : x < y ? -1 : x > y ? 1 : 0;
      } else {
        const x = col[a].trimEnd(), y = col[b].trimEnd();
        c = x < y ? -1 : x > y ? 1 : 0;
      }
      if (c) return c * sign;
    }
    return a - b;
  });
  return Uint32Array.from(arr);
}

export function sortCases(ds: Dataset, keys: SortKey[]): TransformResult {
  if (!keys.length) throw new CasesError('Choose at least one variable to sort by.');
  const order = sortOrder(ds, keys);
  const next = takeRows(ds, order);
  const names = keys.map((k) => {
    const v = ds.variables.find((x) => x.id === k.varId)!;
    return `${v.name} (${k.dir === 'asc' ? 'A' : 'D'})`;
  });
  return {
    dataset: next,
    title: 'Sort Cases',
    syntax: `SORT CASES BY ${names.join(' ')}.`,
    summary: `Sorted ${fmtN(ds.nCases)} cases by ${names.join(', ')}.`,
    warnings: [],
  };
}

// ---------- Weight ----------

export interface WeightCheck {
  negative: number;
  zero: number;
  missing: number;
  fractional: number;
  sum: number;
  valid: number;
}

export function checkWeightVariable(ds: Dataset, varId: string): WeightCheck {
  const v = ds.variables.find((x) => x.id === varId);
  if (!v || v.type !== 'numeric') throw new CasesError('The weight variable must be numeric.');
  const col = ds.columns[v.id] as Float64Array;
  const r: WeightCheck = { negative: 0, zero: 0, missing: 0, fractional: 0, sum: 0, valid: 0 };
  for (let i = 0; i < col.length; i++) {
    const x = col[i];
    if (Number.isNaN(x) || isUserMissing(v.missing, x)) r.missing++;
    else if (x < 0) r.negative++;
    else if (x === 0) r.zero++;
    else {
      r.valid++;
      r.sum += x;
      if (!Number.isInteger(x)) r.fractional++;
    }
  }
  return r;
}

export function weightWarnings(c: WeightCheck): string[] {
  const w: string[] = [];
  if (c.negative) w.push(`${plural(c.negative, 'case')} ${c.negative === 1 ? 'has' : 'have'} a negative weight and will be left out of analyses.`);
  if (c.missing) w.push(`${plural(c.missing, 'case')} ${c.missing === 1 ? 'has' : 'have'} a missing weight and will be left out.`);
  if (c.zero) w.push(`${plural(c.zero, 'case')} ${c.zero === 1 ? 'has' : 'have'} weight 0 and will be left out.`);
  return w;
}

export function weightCases(ds: Dataset, varId: string | null): TransformResult {
  if (!varId) {
    return { dataset: bump(ds, { weightVarId: null }), title: 'Weight Cases', syntax: 'WEIGHT OFF.', summary: 'Weighting is off: every case counts once.', warnings: [] };
  }
  const v = ds.variables.find((x) => x.id === varId)!;
  const c = checkWeightVariable(ds, varId);
  if (!c.valid) throw new CasesError(`${v.name} has no positive values, so it cannot be used as a weight.`);
  return {
    dataset: bump(ds, { weightVarId: varId }),
    title: 'Weight Cases',
    syntax: `WEIGHT BY ${v.name}.`,
    summary: `Cases are weighted by ${v.name} (weighted N = ${c.sum.toLocaleString('en-US', { maximumFractionDigits: 1 })}).`,
    warnings: weightWarnings(c),
  };
}
