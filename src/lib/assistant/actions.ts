// Applying what the assistant proposed, only ever from a user's click. Transforms go through the
// store's mutateDataset (so Edit > Undo reverses them) and are logged like the Transform dialogs.
import type { OutputItem } from '../../core/output';
import type { AppState } from '../../core/store';
import { remember } from '../../features/analysis/varUtils';
import { transformLogItem } from '../transform';
import { buildTransform } from './tools/transform';
import type { Proposal } from './types';

type StoreApi = Pick<AppState, 'dataset' | 'mutateDataset' | 'addOutput' | 'toast' | 'openDialog' | 'outputs'>;

export interface ApplyResult {
  ok: boolean;
  message: string;
}

/** Apply a proposal against the data as it is now. */
export function applyProposal(p: Proposal, store: () => StoreApi): ApplyResult {
  const st = store();
  if (p.kind === 'dialog') {
    if (!st.dataset) return { ok: false, message: 'Open a dataset first.' };
    // Only variables that still exist; the dialog drops unknown ids anyway.
    const slots = Object.fromEntries(Object.entries(p.slots).map(([k, ids]) => [k, ids.filter((id) => st.dataset!.variables.some((v) => v.id === id))]));
    remember(p.procedureId, { slots, options: p.options });
    st.openDialog({ kind: 'procedure', id: p.procedureId });
    return { ok: true, message: 'Opened the dialog.' };
  }
  if (!st.dataset) return { ok: false, message: 'Open a dataset first.' };
  let built: ReturnType<typeof buildTransform>;
  try {
    built = buildTransform(st.dataset, p.spec);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  const res = built.result;
  const name = st.dataset.name;
  st.mutateDataset(() => res.dataset, { label: `Assistant: ${transformName(p.spec, built.target)}` });
  st.addOutput(transformLogItem(res, name), { focus: false });
  st.toast(`${res.summary} Undo with Edit > Undo.`, 'success');
  for (const w of res.warnings.slice(0, 3)) st.toast(w, 'warning');
  return { ok: true, message: res.summary };
}

/** Add an analysis the assistant ran to the Output tab (a fresh id, so adding twice keeps both). */
export function addToOutput(item: OutputItem, store: () => Pick<AppState, 'addOutput' | 'outputs'>, focus = true): string {
  const st = store();
  const existing = st.outputs.find((o) => o.id === item.id);
  const copy: OutputItem = existing ? { ...item, id: `${item.id}_${Date.now().toString(36)}`, createdAt: Date.now() } : { ...item, createdAt: Date.now() };
  st.addOutput(copy, { focus });
  return copy.id;
}

/** The menu words for a proposed transform, for Edit > Undo ("Undo Assistant: Compute variable trust_mean"). */
function transformName(spec: Extract<Proposal, { kind: 'transform' }>['spec'], target: string): string {
  switch (spec.kind) {
    case 'compute':
      return `Compute variable ${target}`.trim();
    case 'recode':
      return `Recode into different variables ${target}`.trim();
    case 'reverse':
      return 'Reverse-code items';
    case 'scale':
      return `Create scale ${target}`.trim();
    default:
      return 'Transform';
  }
}
