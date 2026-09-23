// Global app store (zustand). One active dataset, the output log, and the text-coding project.
// Dataset updates are immutable: every mutation produces a new Dataset object with version+1 and
// copies only the columns it changes, which makes undo cheap.

import { create } from 'zustand';
import type { Column, Dataset, Variable } from './types';
import { emptyColumn } from './types';
import type { OutputItem } from './output';
import type { CodingProject } from './coding-types';
import { emptyCodingProject } from './coding-types';

export type MainTab = 'data' | 'variables' | 'output' | 'coding';

/** A request to open a dialog. The DialogHost (app shell) maps kinds to components. */
export type DialogRequest =
  | { kind: 'procedure'; id: string }
  | { kind: 'transform'; id: string; params?: Record<string, unknown> }
  | { kind: 'file'; id: string; params?: Record<string, unknown> }
  | { kind: 'coding'; id: string; params?: Record<string, unknown> }
  | { kind: 'custom'; id: string; params?: Record<string, unknown> };

export interface Toast {
  id: number;
  tone: 'info' | 'success' | 'warning' | 'error';
  text: string;
}

const HISTORY_LIMIT = 40;

export interface AppState {
  dataset: Dataset | null;
  /** Undo/redo stacks of previous dataset states. */
  past: Dataset[];
  future: Dataset[];

  outputs: OutputItem[];
  coding: CodingProject;

  tab: MainTab;
  dialog: DialogRequest | null;
  /** Data View shows value labels instead of codes. */
  showValueLabels: boolean;
  /** Output item to scroll to / highlight. */
  focusOutputId: string | null;
  toasts: Toast[];

  // dataset
  setDataset: (ds: Dataset | null) => void;
  /** Apply a change; `fn` returns the new dataset (build it immutably). Records undo history. */
  mutateDataset: (fn: (ds: Dataset) => Dataset, opts?: { noHistory?: boolean }) => void;
  setCell: (row: number, varId: string, value: number | string) => void;
  updateVariable: (varId: string, patch: Partial<Variable>) => void;
  /** Insert a variable (with optional column data) at index (default: end). */
  addVariable: (v: Variable, column?: Column, index?: number) => void;
  deleteVariables: (varIds: string[]) => void;
  moveVariable: (varId: string, toIndex: number) => void;
  insertCases: (at: number, count: number) => void;
  deleteCases: (rows: number[]) => void;
  setWeight: (varId: string | null) => void;
  setFilter: (varId: string | null) => void;
  undo: () => void;
  redo: () => void;

  // output
  addOutput: (item: OutputItem) => void;
  removeOutput: (id: string) => void;
  clearOutputs: () => void;
  moveOutput: (id: string, toIndex: number) => void;

  // coding
  updateCoding: (fn: (c: CodingProject) => CodingProject) => void;
  setCoding: (c: CodingProject) => void;

  // ui
  setTab: (t: MainTab) => void;
  openDialog: (d: DialogRequest) => void;
  closeDialog: () => void;
  setShowValueLabels: (b: boolean) => void;
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 0;

function bump(ds: Dataset, patch: Partial<Dataset>): Dataset {
  return { ...ds, ...patch, version: ds.version + 1 };
}

export const useStore = create<AppState>((set, get) => ({
  dataset: null,
  past: [],
  future: [],
  outputs: [],
  coding: emptyCodingProject(),
  tab: 'data',
  dialog: null,
  showValueLabels: true,
  focusOutputId: null,
  toasts: [],

  setDataset: (ds) => set({ dataset: ds, past: [], future: [] }),

  mutateDataset: (fn, opts) => {
    const cur = get().dataset;
    if (!cur) return;
    const next = fn(cur);
    if (next === cur) return;
    const withVersion = next.version === cur.version ? { ...next, version: cur.version + 1 } : next;
    if (opts?.noHistory) set({ dataset: withVersion });
    else set({ dataset: withVersion, past: [...get().past, cur].slice(-HISTORY_LIMIT), future: [] });
  },

  setCell: (row, varId, value) =>
    get().mutateDataset((ds) => {
      const col = ds.columns[varId];
      if (!col || row < 0 || row >= ds.nCases) return ds;
      let copy: Column;
      if (col instanceof Float64Array) {
        copy = new Float64Array(col);
        copy[row] = typeof value === 'number' ? value : value === '' ? NaN : Number(value);
      } else {
        copy = col.slice();
        copy[row] = String(value);
      }
      return bump(ds, { columns: { ...ds.columns, [varId]: copy } });
    }),

  updateVariable: (varId, patch) =>
    get().mutateDataset((ds) => {
      const idx = ds.variables.findIndex((v) => v.id === varId);
      if (idx < 0) return ds;
      const old = ds.variables[idx];
      const nv = { ...old, ...patch, id: old.id };
      let columns = ds.columns;
      // Type change converts the column.
      if (patch.type && patch.type !== old.type) {
        const col = ds.columns[varId];
        let conv: Column;
        if (patch.type === 'numeric') {
          const src = col as string[];
          conv = new Float64Array(ds.nCases);
          for (let i = 0; i < ds.nCases; i++) {
            const t = (src[i] ?? '').trim();
            const n = t === '' ? NaN : Number(t);
            conv[i] = Number.isFinite(n) ? n : NaN;
          }
          nv.valueLabels = old.valueLabels
            .map((vl) => ({ value: Number(vl.value), label: vl.label }))
            .filter((vl) => Number.isFinite(vl.value as number));
          nv.missing = { discrete: old.missing.discrete.map(Number).filter(Number.isFinite) };
        } else {
          const src = col as Float64Array;
          conv = Array.from(src, (x) => (Number.isNaN(x) ? '' : String(x)));
          nv.valueLabels = old.valueLabels.map((vl) => ({ value: String(vl.value), label: vl.label }));
          nv.missing = { discrete: old.missing.discrete.map(String) };
        }
        columns = { ...ds.columns, [varId]: conv };
      }
      const variables = ds.variables.slice();
      variables[idx] = nv;
      return bump(ds, { variables, columns });
    }),

  addVariable: (v, column, index) =>
    get().mutateDataset((ds) => {
      const variables = ds.variables.slice();
      variables.splice(index ?? variables.length, 0, v);
      const col = column ?? emptyColumn(v.type, ds.nCases);
      return bump(ds, { variables, columns: { ...ds.columns, [v.id]: col } });
    }),

  deleteVariables: (varIds) =>
    get().mutateDataset((ds) => {
      const drop = new Set(varIds);
      const columns = { ...ds.columns };
      for (const id of varIds) delete columns[id];
      return bump(ds, {
        variables: ds.variables.filter((v) => !drop.has(v.id)),
        columns,
        weightVarId: ds.weightVarId && drop.has(ds.weightVarId) ? null : ds.weightVarId,
        filterVarId: ds.filterVarId && drop.has(ds.filterVarId) ? null : ds.filterVarId,
      });
    }),

  moveVariable: (varId, toIndex) =>
    get().mutateDataset((ds) => {
      const from = ds.variables.findIndex((v) => v.id === varId);
      if (from < 0) return ds;
      const variables = ds.variables.slice();
      const [v] = variables.splice(from, 1);
      variables.splice(Math.max(0, Math.min(toIndex, variables.length)), 0, v);
      return bump(ds, { variables });
    }),

  insertCases: (at, count) =>
    get().mutateDataset((ds) => {
      const n = ds.nCases + count;
      const columns: Record<string, Column> = {};
      for (const v of ds.variables) {
        const col = ds.columns[v.id];
        if (col instanceof Float64Array) {
          const c = new Float64Array(n).fill(NaN);
          c.set(col.subarray(0, at), 0);
          c.set(col.subarray(at), at + count);
          columns[v.id] = c;
        } else {
          columns[v.id] = [...col.slice(0, at), ...new Array<string>(count).fill(''), ...col.slice(at)];
        }
      }
      return bump(ds, { columns, nCases: n });
    }),

  deleteCases: (rows) =>
    get().mutateDataset((ds) => {
      const drop = new Set(rows);
      const keep: number[] = [];
      for (let i = 0; i < ds.nCases; i++) if (!drop.has(i)) keep.push(i);
      const columns: Record<string, Column> = {};
      for (const v of ds.variables) {
        const col = ds.columns[v.id];
        if (col instanceof Float64Array) {
          const c = new Float64Array(keep.length);
          for (let i = 0; i < keep.length; i++) c[i] = col[keep[i]];
          columns[v.id] = c;
        } else columns[v.id] = keep.map((i) => col[i]);
      }
      return bump(ds, { columns, nCases: keep.length });
    }),

  setWeight: (varId) => get().mutateDataset((ds) => bump(ds, { weightVarId: varId })),
  setFilter: (varId) => get().mutateDataset((ds) => bump(ds, { filterVarId: varId })),

  undo: () => {
    const { past, dataset, future } = get();
    if (!past.length || !dataset) return;
    set({ dataset: past[past.length - 1], past: past.slice(0, -1), future: [dataset, ...future].slice(0, HISTORY_LIMIT) });
  },
  redo: () => {
    const { past, dataset, future } = get();
    if (!future.length || !dataset) return;
    set({ dataset: future[0], future: future.slice(1), past: [...past, dataset].slice(-HISTORY_LIMIT) });
  },

  addOutput: (item) => set({ outputs: [...get().outputs, item], focusOutputId: item.id, tab: 'output' }),
  removeOutput: (id) => set({ outputs: get().outputs.filter((o) => o.id !== id) }),
  clearOutputs: () => set({ outputs: [] }),
  moveOutput: (id, toIndex) => {
    const outs = get().outputs.slice();
    const from = outs.findIndex((o) => o.id === id);
    if (from < 0) return;
    const [o] = outs.splice(from, 1);
    outs.splice(Math.max(0, Math.min(toIndex, outs.length)), 0, o);
    set({ outputs: outs });
  },

  updateCoding: (fn) => set({ coding: fn(get().coding) }),
  setCoding: (c) => set({ coding: c }),

  setTab: (t) => set({ tab: t }),
  openDialog: (d) => set({ dialog: d }),
  closeDialog: () => set({ dialog: null }),
  setShowValueLabels: (b) => set({ showValueLabels: b }),
  toast: (text, tone = 'info') => {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts, { id, tone, text }] });
    setTimeout(() => get().dismissToast(id), tone === 'error' ? 8000 : 4500);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
