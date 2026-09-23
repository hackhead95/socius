// Coding actions: every change to the coding project goes through `commit`, which records an undo
// entry (Text coding has its own undo, separate from the dataset's).

import { useStore } from '../../core/store';
import type { CodeDef, CodedSegment, CodingProject, Memo, TextDoc } from '../../core/coding-types';
import { newId } from '../../core/types';
import { addSegmentMerged, subtractRange, trimRange } from '../../lib/coding/segments';
import { nextCodeColor } from '../../lib/coding/palette';
import { canReparent, descendantIds } from '../../lib/coding/tree';
import { useCodingUi } from './uiStore';

const HISTORY_LIMIT = 40;

/**
 * Apply a change to the coding project with an undo entry. Entries with the same `key` pushed
 * back to back are coalesced (typing in a memo makes one undo step).
 */
export function commit(label: string, fn: (c: CodingProject) => CodingProject, key?: string): void {
  const before = useStore.getState().coding;
  const after = fn(before);
  if (after === before) return;
  useStore.getState().setCoding(after);
  const ui = useCodingUi.getState();
  let history = ui.history;
  const top = history[history.length - 1];
  if (top && top.after !== before) history = []; // project replaced outside the coding tab
  if (key && top && top.key === key && top.after === before) history = [...history.slice(0, -1), { ...top, after }];
  else history = [...history, { label, before, after, key }].slice(-HISTORY_LIMIT);
  ui.set({ history });
}

export function canUndo(): boolean {
  const { history } = useCodingUi.getState();
  const top = history[history.length - 1];
  return !!top && top.after === useStore.getState().coding;
}

/** Undo the last coding change. Returns its label, or null when there is nothing to undo. */
export function undoCoding(): string | null {
  const ui = useCodingUi.getState();
  const top = ui.history[ui.history.length - 1];
  if (!top || top.after !== useStore.getState().coding) {
    if (top) ui.set({ history: [] });
    return null;
  }
  useStore.getState().setCoding(top.before);
  ui.set({ history: ui.history.slice(0, -1) });
  return top.label;
}

const coder = () => useStore.getState().coding.activeCoder;

function touchRecent(codeId: string) {
  const ui = useCodingUi.getState();
  ui.set({ recentCodeIds: [codeId, ...ui.recentCodeIds.filter((x) => x !== codeId)].slice(0, 9) });
}

// ---------- Documents ----------

export function addDocs(docs: TextDoc[], label = 'Import sources'): void {
  if (!docs.length) return;
  commit(label, (c) => ({ ...c, docs: [...c.docs, ...docs] }));
}

export function renameDoc(docId: string, name: string): void {
  const n = name.trim();
  if (!n) return;
  commit('Rename source', (c) => ({ ...c, docs: c.docs.map((d) => (d.id === docId ? { ...d, name: n } : d)) }));
}

export function setDocAttributes(docId: string, attributes: Record<string, string>): void {
  commit('Edit attributes', (c) => ({ ...c, docs: c.docs.map((d) => (d.id === docId ? { ...d, attributes } : d)) }), `attr:${docId}`);
}

export function deleteDocs(docIds: string[]): void {
  const drop = new Set(docIds);
  commit(docIds.length === 1 ? 'Delete source' : `Delete ${docIds.length} sources`, (c) => ({
    ...c,
    docs: c.docs.filter((d) => !drop.has(d.id)),
    segments: c.segments.filter((s) => !drop.has(s.docId)),
    memos: c.memos.map((m) => (m.docId && drop.has(m.docId) ? { ...m, docId: undefined } : m)),
  }));
  const ui = useCodingUi.getState();
  if (ui.activeDocId && drop.has(ui.activeDocId)) ui.set({ activeDocId: null, pending: null });
}

// ---------- Codes ----------

export function createCode(name: string, parentId: string | null = null, extra: Partial<CodeDef> = {}): CodeDef {
  const codes = useStore.getState().coding.codes;
  const code: CodeDef = {
    id: newId('code'),
    name: name.trim() || 'New code',
    description: '',
    color: nextCodeColor(codes.map((c) => c.color)),
    parentId,
    createdAt: Date.now(),
    ...extra,
  };
  commit(`Create code "${code.name}"`, (c) => ({ ...c, codes: [...c.codes, code] }));
  return code;
}

export function updateCode(id: string, patch: Partial<CodeDef>): void {
  commit('Edit code', (c) => ({ ...c, codes: c.codes.map((x) => (x.id === id ? { ...x, ...patch, id } : x)) }), `code:${id}`);
}

export function moveCode(id: string, parentId: string | null, beforeId?: string | null): boolean {
  const codes = useStore.getState().coding.codes;
  if (!canReparent(codes, id, parentId)) return false;
  commit('Move code', (c) => {
    const list = c.codes.slice();
    const i = list.findIndex((x) => x.id === id);
    if (i < 0) return c;
    const [moved] = list.splice(i, 1);
    const updated = { ...moved, parentId };
    let at = beforeId ? list.findIndex((x) => x.id === beforeId) : -1;
    if (at < 0) at = list.length;
    list.splice(at, 0, updated);
    return { ...c, codes: list };
  });
  return true;
}

/** Delete a code, its sub-codes (or lift them to the parent) and their segments. */
export function deleteCode(id: string, opts: { keepChildren: boolean }): void {
  commit('Delete code', (c) => {
    const target = c.codes.find((x) => x.id === id);
    if (!target) return c;
    const removed = new Set<string>([id, ...(opts.keepChildren ? [] : descendantIds(c.codes, id))]);
    return {
      ...c,
      codes: c.codes.filter((x) => !removed.has(x.id)).map((x) => (x.parentId === id ? { ...x, parentId: target.parentId } : x)),
      segments: c.segments.filter((s) => !removed.has(s.codeId)),
      memos: c.memos.map((m) => (m.codeId && removed.has(m.codeId) ? { ...m, codeId: undefined } : m)),
    };
  });
  const ui = useCodingUi.getState();
  ui.set({ selectedCodeId: ui.selectedCodeId === id ? null : ui.selectedCodeId, recentCodeIds: ui.recentCodeIds.filter((x) => x !== id) });
}

/** Merge code `fromId` into `intoId`: segments move (merging overlaps), sub-codes move, `fromId` is deleted. */
export function mergeCode(fromId: string, intoId: string): void {
  if (fromId === intoId) return;
  commit('Merge codes', (c) => {
    const from = c.codes.find((x) => x.id === fromId);
    const into = c.codes.find((x) => x.id === intoId);
    if (!from || !into) return c;
    let segments = c.segments.filter((s) => s.codeId !== fromId);
    for (const s of c.segments.filter((x) => x.codeId === fromId)) segments = addSegmentMerged(segments, { ...s, codeId: intoId }).segments;
    // If the target sits under the merged code, lift the merged code's children to its parent (no cycles).
    const intoIsDescendant = descendantIds(c.codes, fromId).includes(intoId);
    const childParent = intoIsDescendant ? from.parentId : intoId;
    const mergedInto: CodeDef = {
      ...into,
      parentId: into.parentId === fromId ? from.parentId : into.parentId,
      description: into.description || from.description,
      rules: [...new Set([...(into.rules ?? []), ...(from.rules ?? [])])],
    };
    return {
      ...c,
      codes: c.codes
        .filter((x) => x.id !== fromId)
        .map((x) => (x.id === intoId ? mergedInto : x.parentId === fromId ? { ...x, parentId: childParent } : x)),
      segments,
      memos: c.memos.map((m) => (m.codeId === fromId ? { ...m, codeId: intoId } : m)),
    };
  });
  const ui = useCodingUi.getState();
  if (ui.selectedCodeId === fromId) ui.set({ selectedCodeId: intoId });
}

export function replaceCodebook(codes: CodeDef[], label: string): void {
  commit(label, (c) => ({ ...c, codes }));
}

// ---------- Segments ----------

/** Code a passage (merges with overlapping segments of the same code by the same coder). */
export function applyCode(docId: string, codeId: string, start: number, end: number, origin: CodedSegment['origin'] = 'manual'): CodedSegment | null {
  const doc = useStore.getState().coding.docs.find((d) => d.id === docId);
  if (!doc) return null;
  const r = doc.kind === 'response' && start === 0 && end === doc.text.length ? { start, end } : trimRange(doc.text, start, end);
  if (!r) return null;
  let created: CodedSegment | null = null;
  commit('Code passage', (c) => {
    const res = addSegmentMerged(c.segments, { id: newId('seg'), docId, codeId, start: r.start, end: r.end, coder: coder(), origin, createdAt: Date.now() });
    created = res.segment;
    return { ...c, segments: res.segments };
  });
  touchRecent(codeId);
  return created;
}

/** Remove a code from part of a passage (active coder only). */
export function uncodeRange(docId: string, codeId: string, start: number, end: number): void {
  commit('Remove code from passage', (c) => ({ ...c, segments: subtractRange(c.segments, docId, codeId, c.activeCoder, start, end, () => newId('seg')) }));
}

export function removeSegment(segId: string): void {
  commit('Remove coding', (c) => ({ ...c, segments: c.segments.filter((s) => s.id !== segId) }));
}

export function setSegmentMemo(segId: string, memo: string): void {
  commit('Edit segment memo', (c) => ({ ...c, segments: c.segments.map((s) => (s.id === segId ? { ...s, memo: memo || undefined } : s)) }), `segmemo:${segId}`);
}

/** Whole-response coding: toggle `codeId` on each doc for the active coder. `mode` forces on/off. */
export function setWholeResponseCode(docIds: string[], codeId: string, mode: 'toggle' | 'on' | 'off' = 'toggle', origin: CodedSegment['origin'] = 'manual'): void {
  const ids = new Set(docIds);
  commit(docIds.length > 1 ? `Code ${docIds.length} responses` : 'Code response', (c) => {
    const me = c.activeCoder;
    const has = new Set(c.segments.filter((s) => ids.has(s.docId) && s.codeId === codeId && s.coder === me).map((s) => s.docId));
    // Toggle: if every doc already has the code, remove it; otherwise add it where missing.
    const turnOn = mode === 'toggle' ? docIds.some((d) => !has.has(d)) : mode === 'on';
    if (!turnOn) return { ...c, segments: c.segments.filter((s) => !(ids.has(s.docId) && s.codeId === codeId && s.coder === me)) };
    const docs = new Map(c.docs.map((d) => [d.id, d]));
    const now = Date.now();
    const add: CodedSegment[] = [];
    for (const id of docIds) {
      if (has.has(id)) continue;
      const d = docs.get(id);
      if (!d || !d.text.length) continue;
      add.push({ id: newId('seg'), docId: id, codeId, start: 0, end: d.text.length, coder: me, origin, createdAt: now });
    }
    return add.length ? { ...c, segments: [...c.segments, ...add] } : c;
  });
  touchRecent(codeId);
}

/** Add many segments at once (auto-coding, accepted AI suggestions). Returns how many were added. */
export function addSegmentsBulk(label: string, segs: Array<Omit<CodedSegment, 'id' | 'createdAt' | 'coder'> & { coder?: string }>): number {
  let added = 0;
  commit(label, (c) => {
    let segments = c.segments;
    const now = Date.now();
    for (const s of segs) {
      const before = segments.length;
      segments = addSegmentMerged(segments, { ...s, id: newId('seg'), coder: s.coder ?? c.activeCoder, createdAt: now }).segments;
      if (segments.length > before) added++;
    }
    return added ? { ...c, segments } : c;
  });
  return added;
}

// ---------- Coders ----------

export function addCoder(name: string): boolean {
  const n = name.trim();
  const c = useStore.getState().coding;
  if (!n || c.coders.some((x) => x.toLowerCase() === n.toLowerCase())) return false;
  commit('Add coder', (p) => ({ ...p, coders: [...p.coders, n] }));
  return true;
}

export function renameCoder(oldName: string, name: string): boolean {
  const n = name.trim();
  const c = useStore.getState().coding;
  if (!n || (n.toLowerCase() !== oldName.toLowerCase() && c.coders.some((x) => x.toLowerCase() === n.toLowerCase()))) return false;
  commit('Rename coder', (p) => ({
    ...p,
    coders: p.coders.map((x) => (x === oldName ? n : x)),
    activeCoder: p.activeCoder === oldName ? n : p.activeCoder,
    segments: p.segments.map((s) => (s.coder === oldName ? { ...s, coder: n } : s)),
  }));
  return true;
}

export function removeCoder(name: string): void {
  commit('Remove coder', (p) => {
    const coders = p.coders.filter((x) => x !== name);
    if (!coders.length) return p;
    return { ...p, coders, activeCoder: p.activeCoder === name ? coders[0] : p.activeCoder, segments: p.segments.filter((s) => s.coder !== name) };
  });
}

export function setActiveCoder(name: string): void {
  useStore.getState().updateCoding((p) => ({ ...p, activeCoder: name, coders: p.coders.includes(name) ? p.coders : [...p.coders, name] }));
}

// ---------- Memos ----------

export function createMemo(partial: Partial<Memo> = {}): Memo {
  const now = Date.now();
  const memo: Memo = { id: newId('memo'), title: partial.title ?? 'Untitled memo', text: partial.text ?? '', codeId: partial.codeId, docId: partial.docId, createdAt: now, updatedAt: now };
  commit('New memo', (c) => ({ ...c, memos: [memo, ...c.memos] }));
  return memo;
}

export function updateMemo(id: string, patch: Partial<Memo>): void {
  commit('Edit memo', (c) => ({ ...c, memos: c.memos.map((m) => (m.id === id ? { ...m, ...patch, id, updatedAt: Date.now() } : m)) }), `memo:${id}`);
}

export function deleteMemo(id: string): void {
  commit('Delete memo', (c) => ({ ...c, memos: c.memos.filter((m) => m.id !== id) }));
}
