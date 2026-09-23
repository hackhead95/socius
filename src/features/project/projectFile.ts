// Socius project file (<name>.socius.json): dataset + output log + text-coding project + UI prefs.
// Numeric columns are stored as base64 of their raw little-endian float64 bytes, so every value
// (including system-missing NaN) round-trips exactly. Non-finite numbers elsewhere (NaN cells in
// output tables, -Infinity "LO" in missing ranges) are encoded as {"$n": "NaN"} since JSON has no NaN.

import type { Column, Dataset, Variable } from '../../core/types';
import type { OutputItem } from '../../core/output';
import type { CodingProject } from '../../core/coding-types';
import { emptyCodingProject } from '../../core/coding-types';
import type { MainTab } from '../../core/store';

export const PROJECT_FORMAT = 'socius-project';
export const PROJECT_VERSION = 1;
export const APP_VERSION = '0.1.0';

export interface ProjectUi {
  showValueLabels: boolean;
  tab: MainTab;
}

export interface ProjectState {
  dataset: Dataset | null;
  outputs: OutputItem[];
  coding: CodingProject;
  ui: ProjectUi;
}

export class ProjectError extends Error {}

const LITTLE_ENDIAN = new Uint8Array(new Float64Array([1]).buffer)[7] === 0x3f;

export function float64ToBase64(a: Float64Array): string {
  let bytes: Uint8Array;
  if (LITTLE_ENDIAN) bytes = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  else {
    bytes = new Uint8Array(a.length * 8);
    const dv = new DataView(bytes.buffer);
    for (let i = 0; i < a.length; i++) dv.setFloat64(i * 8, a[i], true);
  }
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH) as unknown as number[]);
  return btoa(bin);
}

export function base64ToFloat64(b64: string, expectedLength: number): Float64Array {
  let bin: string;
  try {
    bin = atob(b64);
  } catch {
    throw new ProjectError('A data column in the project is damaged (invalid base64).');
  }
  if (bin.length !== expectedLength * 8) throw new ProjectError(`A data column has ${bin.length / 8} values but the dataset has ${expectedLength} cases.`);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (LITTLE_ENDIAN) return new Float64Array(bytes.buffer);
  const dv = new DataView(bytes.buffer);
  const out = new Float64Array(expectedLength);
  for (let i = 0; i < expectedLength; i++) out[i] = dv.getFloat64(i * 8, true);
  return out;
}

type EncodedColumn = { t: 'f64'; b64: string } | { t: 'str'; v: string[] };

function replacer(_key: string, value: unknown) {
  if (typeof value === 'number' && !Number.isFinite(value)) return { $n: String(value) };
  return value;
}

function reviver(_key: string, value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    if (typeof o.$n === 'string' && Object.keys(o).length === 1) return Number(o.$n);
  }
  return value;
}

export function serializeProject(state: ProjectState): string {
  let dataset: unknown = null;
  if (state.dataset) {
    const ds = state.dataset;
    const columns: Record<string, EncodedColumn> = {};
    for (const v of ds.variables) {
      const c = ds.columns[v.id];
      columns[v.id] = c instanceof Float64Array ? { t: 'f64', b64: float64ToBase64(c) } : { t: 'str', v: c };
    }
    dataset = { ...ds, columns };
  }
  const doc = {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    app: `Socius ${APP_VERSION}`,
    savedAt: new Date().toISOString(),
    dataset,
    outputs: state.outputs,
    coding: state.coding,
    ui: state.ui,
  };
  return JSON.stringify(doc, replacer);
}

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

function checkVariable(v: unknown, i: number): Variable {
  if (!isObj(v)) throw new ProjectError(`Variable ${i + 1} in the project is not readable.`);
  if (typeof v.id !== 'string' || typeof v.name !== 'string') throw new ProjectError(`Variable ${i + 1} has no id or name.`);
  if (v.type !== 'numeric' && v.type !== 'string') throw new ProjectError(`Variable ${v.name} has an unknown type.`);
  const missing = isObj(v.missing) ? v.missing : { discrete: [] };
  return {
    id: v.id,
    name: v.name,
    label: typeof v.label === 'string' ? v.label : '',
    type: v.type,
    width: typeof v.width === 'number' ? v.width : 8,
    decimals: typeof v.decimals === 'number' ? v.decimals : v.type === 'string' ? 0 : 2,
    format: typeof v.format === 'string' ? v.format : v.type === 'string' ? `A${v.width ?? 8}` : 'F8.2',
    measure: v.measure === 'nominal' || v.measure === 'ordinal' || v.measure === 'scale' ? v.measure : v.type === 'string' ? 'nominal' : 'scale',
    role: typeof v.role === 'string' ? (v.role as Variable['role']) : 'input',
    align: v.align === 'left' || v.align === 'right' || v.align === 'center' ? v.align : v.type === 'string' ? 'left' : 'right',
    columns: typeof v.columns === 'number' ? v.columns : 8,
    valueLabels: Array.isArray(v.valueLabels) ? (v.valueLabels as Variable['valueLabels']).filter((l) => isObj(l) && typeof l.label === 'string') : [],
    missing: {
      discrete: Array.isArray(missing.discrete) ? (missing.discrete as Array<number | string>) : [],
      ...(isObj(missing.range) && typeof missing.range.lo === 'number' && typeof missing.range.hi === 'number'
        ? { range: { lo: missing.range.lo, hi: missing.range.hi } }
        : {}),
    },
    ...(isObj(v.attributes) ? { attributes: v.attributes as Record<string, string> } : {}),
  };
}

function checkDataset(raw: unknown): Dataset {
  if (!isObj(raw)) throw new ProjectError('The dataset in this project is not readable.');
  const nCases = raw.nCases;
  if (typeof nCases !== 'number' || nCases < 0 || !Number.isInteger(nCases)) throw new ProjectError('The dataset has no valid case count.');
  if (!Array.isArray(raw.variables)) throw new ProjectError('The dataset has no variable list.');
  const variables = raw.variables.map(checkVariable);
  const encCols = isObj(raw.columns) ? raw.columns : {};
  const columns: Record<string, Column> = {};
  const names = new Set<string>();
  for (const v of variables) {
    const key = v.name.toLowerCase();
    if (names.has(key)) throw new ProjectError(`The variable name ${v.name} appears twice.`);
    names.add(key);
    const c = encCols[v.id];
    if (!isObj(c)) throw new ProjectError(`The data for variable ${v.name} is missing from the project.`);
    if (c.t === 'f64') {
      if (v.type !== 'numeric') throw new ProjectError(`Variable ${v.name} is text but its data is numeric.`);
      if (typeof c.b64 !== 'string') throw new ProjectError(`The data for ${v.name} is damaged.`);
      columns[v.id] = base64ToFloat64(c.b64, nCases);
    } else if (c.t === 'str') {
      if (v.type !== 'string') throw new ProjectError(`Variable ${v.name} is numeric but its data is text.`);
      if (!Array.isArray(c.v) || c.v.length !== nCases) throw new ProjectError(`The data for ${v.name} does not have ${nCases} values.`);
      columns[v.id] = (c.v as unknown[]).map((x) => (typeof x === 'string' ? x : x == null ? '' : String(x)));
    } else throw new ProjectError(`The data for ${v.name} has an unknown encoding.`);
  }
  const ids = new Set(variables.map((v) => v.id));
  return {
    id: typeof raw.id === 'string' ? raw.id : `ds_${Date.now().toString(36)}`,
    name: typeof raw.name === 'string' ? raw.name : 'Untitled',
    fileLabel: typeof raw.fileLabel === 'string' ? raw.fileLabel : '',
    variables,
    columns,
    nCases,
    weightVarId: typeof raw.weightVarId === 'string' && ids.has(raw.weightVarId) ? raw.weightVarId : null,
    filterVarId: typeof raw.filterVarId === 'string' && ids.has(raw.filterVarId) ? raw.filterVarId : null,
    documents: Array.isArray(raw.documents) ? (raw.documents as string[]).filter((d) => typeof d === 'string') : [],
    source: isObj(raw.source) ? (raw.source as Dataset['source']) : { kind: 'project' },
    version: 0,
  };
}

function checkCoding(raw: unknown): CodingProject {
  if (!isObj(raw)) return emptyCodingProject();
  const base = emptyCodingProject();
  const arr = <T,>(x: unknown, fallback: T[]): T[] => (Array.isArray(x) ? (x as T[]) : fallback);
  return {
    codes: arr(raw.codes, base.codes),
    docs: arr(raw.docs, base.docs),
    segments: arr(raw.segments, base.segments),
    memos: arr(raw.memos, base.memos),
    coders: arr<string>(raw.coders, base.coders).filter((c) => typeof c === 'string').length ? arr<string>(raw.coders, base.coders) : base.coders,
    activeCoder: typeof raw.activeCoder === 'string' ? raw.activeCoder : base.activeCoder,
  };
}

/** Parse and validate a project file. Throws ProjectError with a message a user can act on. */
export function parseProject(text: string): ProjectState {
  let doc: unknown;
  try {
    doc = JSON.parse(text, reviver);
  } catch {
    throw new ProjectError('This file is not a Socius project: it is not valid JSON. It may be damaged or cut short.');
  }
  if (!isObj(doc) || doc.format !== PROJECT_FORMAT)
    throw new ProjectError('This file is not a Socius project. Open data files (.sav, .csv, .xlsx) with File > Open data file.');
  if (typeof doc.version !== 'number' || doc.version > PROJECT_VERSION)
    throw new ProjectError('This project was saved by a newer version of Socius. Open it in the newer version, or re-save it there.');
  const dataset = doc.dataset == null ? null : checkDataset(doc.dataset);
  const outputs = Array.isArray(doc.outputs)
    ? (doc.outputs as OutputItem[]).filter((o) => isObj(o) && typeof o.id === 'string' && Array.isArray(o.blocks))
    : [];
  const uiRaw = isObj(doc.ui) ? doc.ui : {};
  const tab = uiRaw.tab === 'data' || uiRaw.tab === 'variables' || uiRaw.tab === 'output' || uiRaw.tab === 'coding' ? uiRaw.tab : 'data';
  return {
    dataset,
    outputs,
    coding: checkCoding(doc.coding),
    ui: { showValueLabels: uiRaw.showValueLabels !== false, tab },
  };
}

/** File name for saving: "<dataset name>.socius.json" with unsafe characters removed. */
export function projectFileName(name: string): string {
  const base = (name || 'project').replace(/\.socius\.json$/i, '').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'project';
  return `${base}.socius.json`;
}
