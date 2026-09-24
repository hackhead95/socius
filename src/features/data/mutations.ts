// Immutable dataset edits used by the Data View and Variable View (all go through mutateDataset).

import type { Column, Dataset, Variable, VarType } from '../../core/types';
import { makeVariable, newId } from '../../core/types';
import { formatRawValue, isDateFormat, uniqueVarName } from '../../core/data';
import { parseCellInput, parseDateText } from './gridEdit';
import { utf8ByteLength } from '../../lib/io/encoding';
import { variableNameFor } from '../../lib/io/infer';

/** Longest string SPSS can store (bytes). */
const MAX_STRING_WIDTH = 32767;

function bump(ds: Dataset, patch: Partial<Dataset>): Dataset {
  return { ...ds, ...patch, version: ds.version + 1 };
}

/** Next free default name VAR00001, VAR00002, ... */
export function defaultVarName(ds: Dataset): string {
  const taken = new Set(ds.variables.map((v) => v.name.toLowerCase()));
  for (let i = 1; ; i++) {
    const n = `VAR${String(i).padStart(5, '0')}`;
    if (!taken.has(n.toLowerCase())) return n;
  }
}

export function newDefaultVariable(ds: Dataset, type: VarType = 'numeric'): Variable {
  return type === 'string'
    ? makeVariable({ name: defaultVarName(ds), type: 'string', width: 24, measure: 'nominal', columns: 12 })
    : makeVariable({ name: defaultVarName(ds), type: 'numeric', width: 8, decimals: 2, measure: 'scale' });
}

/** Grow the dataset to at least `n` cases (new cells missing). */
function growCases(ds: Dataset, n: number, columns: Record<string, Column>): void {
  if (n <= ds.nCases) return;
  for (const v of ds.variables) {
    const col = columns[v.id] ?? ds.columns[v.id];
    if (col instanceof Float64Array) {
      const c = new Float64Array(n).fill(NaN);
      c.set(col);
      columns[v.id] = c;
    } else {
      columns[v.id] = [...col, ...new Array<string>(n - col.length).fill('')];
    }
  }
}

export interface CellWrite {
  row: number;
  col: number; // variable index; == variables.length means "new variable"
  text: string;
}

export interface WriteReport {
  dataset: Dataset;
  rejected: number;
  addedCases: number;
  addedVars: number;
  /** Names of string variables that were widened so the new text fits. */
  widened: string[];
}

/**
 * Write a block of typed/pasted texts. Rows past the end add cases; columns past the end add
 * variables (numeric if every value in that column is a number, else string).
 */
export function writeTexts(ds: Dataset, writes: CellWrite[]): WriteReport {
  if (!writes.length) return { dataset: ds, rejected: 0, addedCases: 0, addedVars: 0, widened: [] };
  let variables = ds.variables;
  const nVars = ds.variables.length;
  const maxCol = Math.max(...writes.map((w) => w.col));
  let working: Dataset = ds;
  const columns: Record<string, Column> = {};
  if (maxCol >= nVars) {
    variables = ds.variables.slice();
    const tmp: Dataset = { ...ds, variables };
    for (let c = nVars; c <= maxCol; c++) {
      const texts = writes.filter((w) => w.col === c).map((w) => w.text.trim()).filter((t) => t !== '' && t !== '.');
      const numeric = texts.every((t) => Number.isFinite(Number(t.replace(/,/g, ''))));
      const v = newDefaultVariable(tmp, numeric ? 'numeric' : 'string');
      if (!numeric) {
        const w = Math.min(255, Math.max(8, ...texts.map((t) => t.length)));
        v.width = w;
        v.format = `A${w}`;
      } else if (texts.every((t) => Number.isInteger(Number(t.replace(/,/g, ''))))) {
        v.decimals = 0;
        v.format = 'F8.0';
      }
      variables.push(v);
      columns[v.id] = numeric ? new Float64Array(ds.nCases).fill(NaN) : new Array<string>(ds.nCases).fill('');
    }
    working = { ...ds, variables, columns: { ...ds.columns, ...columns } };
  }
  // Widen existing string variables so typed or pasted text is never cut off silently.
  const need = new Map<number, number>();
  for (const w of writes) {
    if (w.col >= nVars || variables[w.col].type !== 'string') continue;
    const b = Math.min(MAX_STRING_WIDTH, utf8ByteLength(w.text));
    if (b > variables[w.col].width && b > (need.get(w.col) ?? 0)) need.set(w.col, b);
  }
  const widened: string[] = [];
  if (need.size) {
    if (variables === ds.variables) variables = ds.variables.slice();
    for (const [c, width] of need) {
      const v = variables[c];
      variables[c] = { ...v, width, format: `A${width}`, columns: Math.max(v.columns, Math.min(width, 40)) };
      widened.push(v.name);
    }
  }
  const maxRow = Math.max(...writes.map((w) => w.row));
  const nCases = Math.max(ds.nCases, maxRow + 1);
  const cols: Record<string, Column> = {};
  growCases(working, nCases, cols);
  let rejected = 0;
  const copied = new Set<string>();
  for (const w of writes) {
    const v = variables[w.col];
    let col = cols[v.id] ?? working.columns[v.id];
    if (!copied.has(v.id)) {
      col = col instanceof Float64Array ? new Float64Array(col) : col.slice();
      copied.add(v.id);
    }
    cols[v.id] = col;
    const r = parseCellInput(v, w.text);
    if (!r.ok) {
      rejected++;
      continue;
    }
    if (col instanceof Float64Array) col[w.row] = r.value as number;
    else col[w.row] = r.value as string;
  }
  const next = bump(ds, { variables, columns: { ...working.columns, ...cols }, nCases });
  return { dataset: next, rejected, addedCases: nCases - ds.nCases, addedVars: variables.length - nVars, widened };
}

/**
 * Does the first pasted row look like column headings (as when copying a table from Excel)? True when
 * every heading is non-empty text that is not a number and at least one column below holds numbers.
 */
export function looksLikeHeader(grid: string[][]): boolean {
  if (grid.length < 2) return false;
  const head = grid[0].map((t) => t.trim());
  const isNum = (t: string) => t !== '' && Number.isFinite(Number(t.replace(/,/g, '')));
  if (!head.length || head.some((t) => t === '' || isNum(t))) return false;
  if (new Set(head.map((t) => t.toLowerCase())).size !== head.length) return false;
  return head.some((_, j) => {
    const below = grid.slice(1).map((r) => (r[j] ?? '').trim()).filter((t) => t !== '');
    return below.length > 0 && below.every(isNum);
  });
}

/** Rename variables from `start` on after pasted headings (invalid names are made valid; the heading becomes the label). */
export function nameVariablesFromHeader(ds: Dataset, start: number, headings: string[]): Dataset {
  const variables = ds.variables.slice();
  const taken: Dataset = { ...ds, variables: variables.slice(0, start) };
  headings.forEach((h, k) => {
    const i = start + k;
    if (!variables[i]) return;
    const text = h.trim();
    const name = variableNameFor(taken, text);
    variables[i] = { ...variables[i], name, label: name === text ? variables[i].label : text.slice(0, 255) };
    taken.variables.push(variables[i]);
  });
  for (let i = start + headings.length; i < variables.length; i++) taken.variables.push(variables[i]);
  return { ...ds, variables };
}

/** Clear a rectangle (sysmis for numbers, empty for text). */
export function clearRange(ds: Dataset, r0: number, r1: number, c0: number, c1: number): Dataset {
  const cols: Record<string, Column> = {};
  for (let c = c0; c <= Math.min(c1, ds.variables.length - 1); c++) {
    const v = ds.variables[c];
    const src = ds.columns[v.id];
    const copy = src instanceof Float64Array ? new Float64Array(src) : src.slice();
    for (let r = r0; r <= Math.min(r1, ds.nCases - 1); r++) {
      if (copy instanceof Float64Array) copy[r] = NaN;
      else copy[r] = '';
    }
    cols[v.id] = copy;
  }
  return bump(ds, { columns: { ...ds.columns, ...cols } });
}

/** Keep the SPSS format family (F, COMMA, DOLLAR, DATE...) while changing width/decimals. */
export function formatWith(v: Pick<Variable, 'format' | 'type'>, width: number, decimals: number): string {
  if (v.type === 'string') return `A${width}`;
  const m = /^([A-Z]+)/i.exec(v.format);
  const fam = (m?.[1] ?? 'F').toUpperCase();
  if (isDateFormat(fam)) return `${fam}${width}`;
  return `${fam}${width}.${decimals}`;
}

/** Change type and/or format with sensible data conversion (dates parse from text, numbers format to text). */
export function changeType(ds: Dataset, varId: string, type: VarType, format: string, width: number, decimals: number): Dataset {
  const idx = ds.variables.findIndex((v) => v.id === varId);
  if (idx < 0) return ds;
  const old = ds.variables[idx];
  const nv: Variable = { ...old, type, format, width, decimals: type === 'string' ? 0 : decimals };
  let col = ds.columns[varId];
  if (type !== old.type) {
    if (type === 'numeric') {
      const src = col as string[];
      const out = new Float64Array(ds.nCases);
      const date = isDateFormat(format);
      for (let i = 0; i < ds.nCases; i++) {
        const t = (src[i] ?? '').trim();
        if (t === '') out[i] = NaN;
        else if (date) out[i] = parseDateText(t, format) ?? NaN;
        else {
          const n = Number(t.replace(/,/g, ''));
          out[i] = Number.isFinite(n) ? n : NaN;
        }
      }
      col = out;
      nv.valueLabels = old.valueLabels.map((l) => ({ value: Number(l.value), label: l.label })).filter((l) => Number.isFinite(l.value));
      nv.missing = { discrete: old.missing.discrete.map(Number).filter(Number.isFinite) };
      nv.align = 'right';
      if (nv.measure === 'nominal' && !nv.valueLabels.length) nv.measure = 'scale';
    } else {
      const src = col as Float64Array;
      // Labels and missing codes must be converted exactly like the data ("1.00", not "1"), or they stop matching.
      const asText = (x: number) => formatRawValue(old, x).trim().slice(0, width);
      col = Array.from(src, (x) => (Number.isNaN(x) ? '' : asText(x)));
      nv.valueLabels = old.valueLabels.map((l) => ({ value: typeof l.value === 'number' ? asText(l.value) : l.value, label: l.label }));
      nv.missing = { discrete: old.missing.discrete.map((d) => (typeof d === 'number' ? asText(d) : d)).slice(0, 3) };
      nv.align = 'left';
      nv.measure = 'nominal';
    }
  } else if (type === 'string' && width < old.width) {
    col = (col as string[]).map((s) => s.slice(0, width));
  }
  const variables = ds.variables.slice();
  variables[idx] = nv;
  return bump(ds, { variables, columns: { ...ds.columns, [varId]: col } });
}

/** Duplicate variables (with data) right after each original, named <name>_copy. */
export function duplicateVariables(ds: Dataset, ids: string[]): Dataset {
  let variables = ds.variables.slice();
  const columns = { ...ds.columns };
  for (const id of ids) {
    const i = variables.findIndex((v) => v.id === id);
    if (i < 0) continue;
    const v = variables[i];
    const tmp = { ...ds, variables } as Dataset;
    const nv: Variable = { ...v, id: newId('v'), name: uniqueVarName(tmp, `${v.name}_copy`), valueLabels: v.valueLabels.slice(), missing: { ...v.missing, discrete: v.missing.discrete.slice() } };
    const src = ds.columns[v.id];
    columns[nv.id] = src instanceof Float64Array ? new Float64Array(src) : src.slice();
    variables = [...variables.slice(0, i + 1), nv, ...variables.slice(i + 1)];
  }
  return bump(ds, { variables, columns });
}

export type CopyProp = 'valueLabels' | 'missing' | 'measure' | 'format' | 'label' | 'display' | 'role';

export const COPY_PROPS: Array<{ id: CopyProp; label: string; defaultOn: boolean }> = [
  { id: 'valueLabels', label: 'Value labels', defaultOn: true },
  { id: 'missing', label: 'Missing values', defaultOn: true },
  { id: 'measure', label: 'Measure', defaultOn: true },
  { id: 'format', label: 'Width and decimals', defaultOn: false },
  { id: 'display', label: 'Columns and alignment', defaultOn: false },
  { id: 'role', label: 'Role', defaultOn: false },
  { id: 'label', label: 'Variable label', defaultOn: false },
];

/** Copy chosen properties from one variable to others of the same type. */
export function copyProperties(ds: Dataset, sourceId: string, targetIds: string[], props: CopyProp[]): Dataset {
  const src = ds.variables.find((v) => v.id === sourceId);
  if (!src) return ds;
  const targets = new Set(targetIds);
  const variables = ds.variables.map((v) => {
    if (!targets.has(v.id) || v.id === src.id || v.type !== src.type) return v;
    const nv: Variable = { ...v };
    if (props.includes('valueLabels')) nv.valueLabels = src.valueLabels.map((l) => ({ ...l }));
    if (props.includes('missing')) nv.missing = { discrete: src.missing.discrete.slice(), ...(src.missing.range ? { range: { ...src.missing.range } } : {}) };
    if (props.includes('measure')) nv.measure = src.measure;
    if (props.includes('format')) {
      nv.width = src.width;
      nv.decimals = src.decimals;
      nv.format = src.format;
    }
    if (props.includes('display')) {
      nv.columns = src.columns;
      nv.align = src.align;
    }
    if (props.includes('role')) nv.role = src.role;
    if (props.includes('label')) nv.label = src.label;
    return nv;
  });
  return bump(ds, { variables });
}
