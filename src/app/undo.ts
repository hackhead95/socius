// Undo and Redo follow the tab you are in (Edit > Undo / Redo, Ctrl+Z / Ctrl+Y, the top-bar icons):
// - Text coding: the last coding change (codes, passages, memos, sources), nothing else.
// - Output: the last deleted result, if there is one; otherwise the last data change.
// - Data View and Variable View: the last data change.
// The menu label says what will be undone ("Undo rename of age", "Undo code passage").
import { useStore, changeLabelOf, type MainTab } from '../core/store';
import type { Dataset, Variable } from '../core/types';
import { useCodingUi } from '../features/coding/uiStore';
import { redoCoding, redoLabel as codingRedoLabel, undoCoding, undoLabel as codingUndoLabel } from '../features/coding/actions';

export type UndoScope = 'coding' | 'output' | 'data';

export interface UndoStep {
  scope: UndoScope;
  /** What the step does, for the menu: "Undo rename of age". */
  label: string;
}

const MAX_NAME = 24;
/** A name short enough for a menu label, or null (the caller then says "a variable"). */
const short = (s: string) => (s.length <= MAX_NAME ? s : null);
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

function sameProps(a: Variable, b: Variable): boolean {
  if (a === b) return true;
  const keys: Array<keyof Variable> = ['name', 'label', 'type', 'width', 'decimals', 'format', 'measure', 'align', 'role', 'columns'];
  if (keys.some((k) => a[k] !== b[k])) return false;
  return JSON.stringify([a.valueLabels, a.missing]) === JSON.stringify([b.valueLabels, b.missing]);
}

/**
 * Describe the change from `before` to `after` in a few words, for "Undo ..." and "Redo ...".
 * Uses the name the change was given (mutateDataset's `label`) when there is one.
 */
export function describeDatasetChange(before: Dataset, after: Dataset): string {
  const named = changeLabelOf(after);
  if (named) return named;
  if (before.name !== after.name && before.variables === after.variables && before.columns === after.columns) return 'rename of the dataset';
  if (before.filterVarId !== after.filterVarId) return after.filterVarId ? 'Select cases' : 'turning the filter off';
  if (before.weightVarId !== after.weightVarId) return after.weightVarId ? 'Weight cases' : 'turning weighting off';
  const beforeIds = new Map(before.variables.map((v) => [v.id, v]));
  const afterIds = new Map(after.variables.map((v) => [v.id, v]));
  const added = after.variables.filter((v) => !beforeIds.has(v.id));
  const removed = before.variables.filter((v) => !afterIds.has(v.id));
  if (before.nCases !== after.nCases) {
    if (added.length || removed.length) return 'data change';
    const k = Math.abs(after.nCases - before.nCases);
    return after.nCases > before.nCases ? `inserting ${plural(k, 'case')}` : `deleting ${plural(k, 'case')}`;
  }
  if (added.length && !removed.length) {
    const name = added.length === 1 ? short(added[0].name) : null;
    return added.length === 1 ? (name ? `new variable ${name}` : 'new variable') : `${added.length} new variables`;
  }
  if (removed.length && !added.length) {
    const name = removed.length === 1 ? short(removed[0].name) : null;
    return removed.length === 1 ? (name ? `deleting ${name}` : 'deleting a variable') : `deleting ${removed.length} variables`;
  }
  if (added.length || removed.length) return 'data change';
  const changed = after.variables.filter((v) => !sameProps(beforeIds.get(v.id)!, v));
  if (changed.length === 1) {
    const old = beforeIds.get(changed[0].id)!;
    if (old.name !== changed[0].name) return short(old.name) ? `rename of ${old.name}` : 'rename of a variable';
    return short(old.name) ? `changes to ${old.name}` : 'changes to a variable';
  }
  if (changed.length > 1) return `changes to ${changed.length} variables`;
  if (before.variables.some((v, i) => after.variables[i]?.id !== v.id)) return 'moving variables';
  const edited = after.variables.filter((v) => before.columns[v.id] !== after.columns[v.id]);
  if (edited.length === 1) return short(edited[0].name) ? `edit in ${edited[0].name}` : 'edit in a variable';
  if (edited.length > 1) return `changes to values in ${edited.length} variables`;
  return 'data change';
}

function outputPhrase(title: string): string {
  return short(title) ? `deleting ${title}` : 'deleting a result';
}

function codingPhrase(label: string): string {
  return label.length <= 40 ? lowerFirst(label) : 'coding change';
}

function liveOutputUndo() {
  const { outputs, outputUndo } = useStore.getState();
  for (let i = outputUndo.length - 1; i >= 0; i--) if (!outputs.some((o) => o.id === outputUndo[i].item.id)) return outputUndo[i];
  return null;
}

function liveOutputRedo() {
  const { outputs, outputRedo } = useStore.getState();
  const last = outputRedo[outputRedo.length - 1];
  return last && outputs.some((o) => o.id === last.item.id) ? last : null;
}

/** What Undo would do in the current tab, or null when there is nothing to undo there. */
export function undoStep(tab: MainTab = useStore.getState().tab): UndoStep | null {
  if (tab === 'coding') {
    const l = codingUndoLabel();
    return l ? { scope: 'coding', label: `Undo ${codingPhrase(l)}` } : null;
  }
  if (tab === 'output') {
    const d = liveOutputUndo();
    if (d) return { scope: 'output', label: `Undo ${outputPhrase(d.item.title)}` };
  }
  const { past, dataset } = useStore.getState();
  if (!past.length || !dataset) return null;
  return { scope: 'data', label: `Undo ${describeDatasetChange(past[past.length - 1], dataset)}` };
}

/** What Redo would do in the current tab, or null when there is nothing to redo there. */
export function redoStep(tab: MainTab = useStore.getState().tab): UndoStep | null {
  if (tab === 'coding') {
    const l = codingRedoLabel();
    return l ? { scope: 'coding', label: `Redo ${codingPhrase(l)}` } : null;
  }
  if (tab === 'output') {
    const d = liveOutputRedo();
    if (d) return { scope: 'output', label: `Redo ${outputPhrase(d.item.title)}` };
  }
  const { future, dataset } = useStore.getState();
  if (!future.length || !dataset) return null;
  return { scope: 'data', label: `Redo ${describeDatasetChange(dataset, future[0])}` };
}

/** Tooltip for a disabled Undo or Redo, per tab. */
export function nothingTo(what: 'undo' | 'redo', tab: MainTab = useStore.getState().tab): string {
  if (tab === 'coding') return `Nothing to ${what} in Text coding. Data changes are undone from Data View or Variable View.`;
  if (tab === 'output') return `Nothing to ${what}: no deleted results and no data changes`;
  return `Nothing to ${what}`;
}

/** Undo in the current tab. Returns the step it undid, or null. */
export function runUndo(): UndoStep | null {
  const step = undoStep();
  if (!step) return null;
  const st = useStore.getState();
  if (step.scope === 'coding') {
    const l = undoCoding();
    if (l) st.toast(`Undone: ${l}`, 'info');
  } else if (step.scope === 'output') st.restoreOutput();
  else st.undo();
  return step;
}

/** Redo in the current tab. Returns the step it redid, or null. */
export function runRedo(): UndoStep | null {
  const step = redoStep();
  if (!step) return null;
  const st = useStore.getState();
  if (step.scope === 'coding') {
    const l = redoCoding();
    if (l) st.toast(`Redone: ${l}`, 'info');
  } else if (step.scope === 'output') st.redeleteOutput();
  else st.redo();
  return step;
}

/** Undo and Redo for the current tab, kept up to date (menus, top bar). */
export function useUndoRedo(): { undo: UndoStep | null; redo: UndoStep | null; tab: MainTab } {
  const tab = useStore((s) => s.tab);
  // Subscribe to everything the steps depend on; the steps themselves are computed below.
  useStore((s) => s.dataset);
  useStore((s) => s.past);
  useStore((s) => s.future);
  useStore((s) => s.outputs);
  useStore((s) => s.outputUndo);
  useStore((s) => s.outputRedo);
  useStore((s) => s.coding);
  useCodingUi((s) => s.history);
  useCodingUi((s) => s.future);
  return { undo: undoStep(tab), redo: redoStep(tab), tab };
}
