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
  /** Optional button in the toast ("Undo", "Show"). Choosing it runs `run` and dismisses the toast. */
  action?: { label: string; run: () => void };
}

const HISTORY_LIMIT = 40;
/** Memory the undo history may hold on top of the current data (columns shared between states count once). */
const HISTORY_BYTES = 700 * 1024 * 1024;

function columnBytes(c: Column): number {
  return c instanceof Float64Array ? c.byteLength : c.length * 24;
}

/**
 * Drop the oldest undo states once the columns they alone hold pass HISTORY_BYTES. Sorting or
 * deleting cases in a 100,000 x 200 file copies every column (160 MB), so 40 steps would exhaust memory.
 * Always keeps at least the most recent state.
 */
export function trimHistory(states: Dataset[], current: Dataset | null, budget = HISTORY_BYTES): Dataset[] {
  const seen = new Set<Column>(current ? Object.values(current.columns) : []);
  let bytes = 0;
  for (let i = states.length - 1; i >= 0; i--) {
    for (const c of Object.values(states[i].columns)) {
      if (seen.has(c)) continue;
      seen.add(c);
      bytes += columnBytes(c);
    }
    if (bytes > budget && i < states.length - 1) return states.slice(i + 1);
  }
  return states;
}

/** A result removed from the Output tab, remembered so Undo (in the Output tab) can bring it back. */
export interface OutputDeletion {
  item: OutputItem;
  /** Its position in the output list when it was removed. */
  index: number;
}

const OUTPUT_UNDO_LIMIT = 20;

/**
 * Optional names of dataset changes, keyed by the dataset state the change produced (so Edit > Undo
 * can say "Undo Recode"). Changes without a name are described by comparing the two states
 * (src/app/undo.ts). A WeakMap, so it never keeps old states alive.
 */
const changeLabels = new WeakMap<Dataset, string>();

/** The name given to the change that produced `ds` (see `mutateDataset`'s `label`), if any. */
export function changeLabelOf(ds: Dataset | null | undefined): string | undefined {
  return ds ? changeLabels.get(ds) : undefined;
}

export interface AppState {
  dataset: Dataset | null;
  /** Undo/redo stacks of previous dataset states. */
  past: Dataset[];
  future: Dataset[];

  outputs: OutputItem[];
  /** Results deleted from Output (newest last), for Undo in the Output tab; and deletions undone, for Redo. */
  outputUndo: OutputDeletion[];
  outputRedo: OutputDeletion[];
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
  /**
   * Apply a change; `fn` returns the new dataset (build it immutably). Records undo history.
   * `label` names the change for Edit > Undo / Redo ("Recode", "Rename age"); optional.
   */
  mutateDataset: (fn: (ds: Dataset) => Dataset, opts?: { noHistory?: boolean; label?: string }) => void;
  setCell: (row: number, varId: string, value: number | string) => void;
  updateVariable: (varId: string, patch: Partial<Variable>) => void;
  /** Insert a variable (with optional column data) at index (default: end). */
  addVariable: (v: Variable, column?: Column, index?: number) => void;
  deleteVariables: (varIds: string[]) => void;
  moveVariable: (varId: string, toIndex: number) => void;
  insertCases: (at: number, count: number) => void;
  deleteCases: (rows: number[]) => void;
  // Weighting and filtering are transforms (Data > Weight cases..., Select cases..., the dataset-bar
  // chips and Turn weighting/filter off all go through weightCases / selectCasesTransform and
  // applyTransform), so they get SPSS syntax in Output and a named undo step. No store shortcut.
  undo: () => void;
  redo: () => void;

  // output
  /** Append an output item. By default it is focused and the Output tab opens; pass `{ focus: false }` to log quietly. */
  addOutput: (item: OutputItem, opts?: { focus?: boolean }) => void;
  /** Remove one result; Undo in the Output tab brings it back (`restoreOutput`). */
  removeOutput: (id: string) => void;
  clearOutputs: () => void;
  /** Bring back the last deleted result. Returns false when there is none. */
  restoreOutput: () => boolean;
  /** Delete again the result that `restoreOutput` brought back. Returns false when there is none. */
  redeleteOutput: () => boolean;
  moveOutput: (id: string, toIndex: number) => void;

  // coding (changes go through src/features/coding/actions.ts, which records coding undo)
  setCoding: (c: CodingProject) => void;

  // ui
  setTab: (t: MainTab) => void;
  openDialog: (d: DialogRequest) => void;
  closeDialog: () => void;
  setShowValueLabels: (b: boolean) => void;
  toast: (text: string, tone?: Toast['tone'], opts?: { action?: Toast['action']; ms?: number }) => void;
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
  outputUndo: [],
  outputRedo: [],
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
    if (opts?.label) changeLabels.set(withVersion, opts.label);
    if (opts?.noHistory) set({ dataset: withVersion });
    else set({ dataset: withVersion, past: trimHistory([...get().past, cur].slice(-HISTORY_LIMIT), withVersion), future: [] });
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

  addOutput: (item, opts) =>
    set(
      opts?.focus === false
        ? { outputs: [...get().outputs, item] }
        : { outputs: [...get().outputs, item], focusOutputId: item.id, tab: 'output' },
    ),
  removeOutput: (id) => {
    const outputs = get().outputs;
    const index = outputs.findIndex((o) => o.id === id);
    if (index < 0) return;
    set({
      outputs: outputs.filter((o) => o.id !== id),
      outputUndo: [...get().outputUndo, { item: outputs[index], index }].slice(-OUTPUT_UNDO_LIMIT),
      outputRedo: [],
    });
  },
  clearOutputs: () => set({ outputs: [], outputUndo: [], outputRedo: [] }),
  restoreOutput: () => {
    const { outputs, outputUndo, outputRedo } = get();
    // Skip entries already brought back another way (the Output tab's own "Undo" toast).
    const stack = outputUndo.filter((d) => !outputs.some((o) => o.id === d.item.id));
    const last = stack[stack.length - 1];
    if (!last) {
      if (stack.length !== outputUndo.length) set({ outputUndo: stack });
      return false;
    }
    const outs = outputs.slice();
    outs.splice(Math.min(last.index, outs.length), 0, last.item);
    set({ outputs: outs, outputUndo: stack.slice(0, -1), outputRedo: [...outputRedo, last], focusOutputId: last.item.id });
    return true;
  },
  redeleteOutput: () => {
    const { outputs, outputUndo, outputRedo } = get();
    const last = outputRedo[outputRedo.length - 1];
    if (!last || !outputs.some((o) => o.id === last.item.id)) {
      if (last) set({ outputRedo: [] });
      return false;
    }
    const index = outputs.findIndex((o) => o.id === last.item.id);
    set({ outputs: outputs.filter((o) => o.id !== last.item.id), outputRedo: outputRedo.slice(0, -1), outputUndo: [...outputUndo, { item: last.item, index }] });
    return true;
  },
  moveOutput: (id, toIndex) => {
    const outs = get().outputs.slice();
    const from = outs.findIndex((o) => o.id === id);
    if (from < 0) return;
    const [o] = outs.splice(from, 1);
    outs.splice(Math.max(0, Math.min(toIndex, outs.length)), 0, o);
    set({ outputs: outs });
  },

  setCoding: (c) => set({ coding: c }),

  setTab: (t) => set({ tab: t }),
  openDialog: (d) => set({ dialog: d }),
  closeDialog: () => set({ dialog: null }),
  setShowValueLabels: (b) => set({ showValueLabels: b }),
  toast: (text, tone = 'info', opts) => {
    const id = ++toastSeq;
    // The same message again (weighting on, off, on...) replaces the old one instead of stacking.
    const rest = get().toasts.filter((t) => t.text !== text);
    set({ toasts: [...rest, { id, tone, text, action: opts?.action }] });
    // A toast with a button stays long enough to use it.
    setTimeout(() => get().dismissToast(id), opts?.ms ?? (tone === 'error' ? 8000 : opts?.action ? 8000 : 4500));
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

// Opening a project or starting fresh replaces the data and the output together (with a fresh undo
// history); deleted results of the previous work must not come back into the new one.
useStore.subscribe((s, prev) => {
  if (s.outputs !== prev.outputs && s.dataset !== prev.dataset && s.past.length === 0 && (s.outputUndo.length || s.outputRedo.length)) {
    useStore.setState({ outputUndo: [], outputRedo: [] });
  }
});
