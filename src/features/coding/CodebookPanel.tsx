// Codebook panel: hierarchical codes with counts, drag to reparent/reorder, quick actions.

import { useMemo, useState } from 'react';
import { useStore } from '../../core/store';
import type { CodeDef } from '../../core/coding-types';
import { canReparent, descendantIds } from '../../lib/coding/tree';
import { CODE_PALETTE } from '../../lib/coding/palette';
import { ConfirmDialog } from '../../ui/Modal';
import { applyCode, createCode, createMemo, deleteCode, moveCode, updateCode } from './actions';
import { useOrderedCodes, useVisibleSegments, toast, plural } from './hooks';
import { useCodingUi, openLocalDialog } from './uiStore';
import { MenuButton, Floating } from './ui';

export function CodebookPanel(props: { quickKeys?: boolean }) {
  const codes = useStore((s) => s.coding.codes);
  const nodes = useOrderedCodes();
  const segments = useVisibleSegments();
  const { selectedCodeId, collapsed, set, pending } = useCodingUi();
  const [filter, setFilter] = useState('');
  const [drag, setDrag] = useState<{ id: string; over: string | null; pos: 'before' | 'after' | 'inside' | 'root' } | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ code: CodeDef; keepChildren: boolean } | null>(null);
  const [colorFor, setColorFor] = useState<{ id: string; anchor: { left: number; top: number; bottom: number } } | null>(null);
  const [newName, setNewName] = useState('');

  const counts = useMemo(() => {
    const seg = new Map<string, number>();
    const docs = new Map<string, Set<string>>();
    for (const s of segments) {
      seg.set(s.codeId, (seg.get(s.codeId) ?? 0) + 1);
      const d = docs.get(s.codeId) ?? new Set<string>();
      d.add(s.docId);
      docs.set(s.codeId, d);
    }
    return { seg, docs };
  }, [segments]);

  const childCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of codes) if (c.parentId) m.set(c.parentId, (m.get(c.parentId) ?? 0) + 1);
    return m;
  }, [codes]);

  const q = filter.trim().toLowerCase();
  const visible = useMemo(() => {
    if (q) return nodes.filter((n) => n.code.name.toLowerCase().includes(q) || n.code.description.toLowerCase().includes(q));
    const hidden = new Set<string>();
    for (const n of nodes) if (collapsed[n.code.id]) for (const d of descendantIds(codes, n.code.id)) hidden.add(d);
    return nodes.filter((n) => !hidden.has(n.code.id));
  }, [nodes, q, collapsed, codes]);

  const quickIndex = useMemo(() => new Map(nodes.slice(0, 9).map((n, i) => [n.code.id, i + 1])), [nodes]);

  const onRowClick = (c: CodeDef) => {
    if (pending) {
      applyCode(pending.docId, c.id, pending.start, pending.end);
      window.getSelection()?.removeAllRanges();
      set({ pending: null, selectedCodeId: c.id });
      return;
    }
    set({ selectedCodeId: selectedCodeId === c.id ? null : c.id });
  };

  const onDrop = () => {
    if (!drag) return;
    const { id, over, pos } = drag;
    setDrag(null);
    if (pos === 'root') {
      moveCode(id, null, null);
      return;
    }
    if (!over || over === id) return;
    const target = codes.find((c) => c.id === over);
    if (!target) return;
    let ok: boolean;
    if (pos === 'inside') ok = moveCode(id, target.id, null);
    else if (pos === 'before') ok = moveCode(id, target.parentId, target.id);
    else {
      const idx = codes.findIndex((c) => c.id === over);
      const nextSibling = codes.slice(idx + 1).find((c) => c.parentId === target.parentId && c.id !== id);
      ok = moveCode(id, target.parentId, nextSibling?.id ?? null);
    }
    if (!ok) toast('A code cannot be moved inside one of its own sub-codes.', 'warning');
  };

  const addTop = () => {
    const n = newName.trim();
    if (!n) {
      openLocalDialog('code-edit', {});
      return;
    }
    if (codes.some((c) => c.name.toLowerCase() === n.toLowerCase())) {
      toast(`A code named "${n}" already exists.`, 'warning');
      return;
    }
    const c = createCode(n);
    setNewName('');
    set({ selectedCodeId: c.id });
  };

  return (
    <section className="cw-panel cw-codebook" aria-label="Codebook">
      <div className="cw-panel-head">
        <h3>Codebook</h3>
        <span className="badge">{codes.length}</span>
        <span className="spacer" />
        <MenuButton
          label="More"
          className="btn-sm"
          items={[
            { label: 'New code with details…', onSelect: () => openLocalDialog('code-edit', {}) },
            { label: 'Auto-code with keyword rules…', onSelect: () => openLocalDialog('auto-code') },
            { label: 'Suggest a codebook with AI…', onSelect: () => openLocalDialog('ai-codebook') },
            { label: 'Import codebook (JSON, CSV)…', separator: true, onSelect: () => openLocalDialog('export', { tab: 'codebook' }) },
            { label: 'Export codebook (Word, CSV, JSON)…', onSelect: () => openLocalDialog('export', { tab: 'codebook' }) },
          ]}
        />
      </div>
      <div className="cw-panel-tools">
        <form
          className="row cw-newcode"
          onSubmit={(e) => {
            e.preventDefault();
            addTop();
          }}
        >
          <input className="input input-sm" placeholder="New code name" value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="New code name" />
          <button className="btn btn-sm btn-primary" type="submit">
            Add
          </button>
        </form>
        {codes.length > 8 ? <input className="input input-sm" placeholder="Filter codes" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter codes" /> : null}
        {pending ? <div className="cw-applyhint">Click a code to apply it to the selected text.</div> : null}
      </div>
      <div className="cw-panel-body cw-tree" role="tree" aria-label="Codes" data-popover-safe>
        {visible.map((n) => {
          const c = n.code;
          const kids = childCount.get(c.id) ?? 0;
          const segN = counts.seg.get(c.id) ?? 0;
          const docN = counts.docs.get(c.id)?.size ?? 0;
          const isOver = drag?.over === c.id;
          return (
            <div
              key={c.id}
              role="treeitem"
              aria-level={n.depth + 1}
              aria-selected={selectedCodeId === c.id}
              aria-expanded={kids ? !collapsed[c.id] : undefined}
              className={`cw-code ${selectedCodeId === c.id ? 'is-selected' : ''} ${isOver ? `drop-${drag!.pos}` : ''} ${drag?.id === c.id ? 'is-dragging' : ''}`}
              style={{ paddingLeft: 6 + n.depth * 16 }}
              draggable={!q}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', c.name);
                setDrag({ id: c.id, over: null, pos: 'inside' });
              }}
              onDragEnd={() => setDrag(null)}
              onDragOver={(e) => {
                if (!drag || drag.id === c.id) return;
                e.preventDefault();
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const y = (e.clientY - r.top) / r.height;
                const pos = y < 0.25 ? 'before' : y > 0.75 ? 'after' : 'inside';
                const allowed = canReparent(codes, drag.id, pos === 'inside' ? c.id : c.parentId);
                if (!allowed) return;
                if (drag.over !== c.id || drag.pos !== pos) setDrag({ ...drag, over: c.id, pos });
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop();
              }}
            >
              {kids ? (
                <button className="cw-caretbtn" aria-label={collapsed[c.id] ? `Expand ${c.name}` : `Collapse ${c.name}`} onClick={() => set({ collapsed: { ...collapsed, [c.id]: !collapsed[c.id] } })}>
                  {collapsed[c.id] ? '▸' : '▾'}
                </button>
              ) : (
                <span className="cw-caretbtn" aria-hidden />
              )}
              <button
                className="cw-swatchbtn"
                style={{ background: c.color }}
                aria-label={`Change colour of ${c.name}`}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setColorFor({ id: c.id, anchor: { left: r.left, top: r.top, bottom: r.bottom } });
                }}
              />
              <button className="cw-codename" onClick={() => onRowClick(c)} onDoubleClick={() => openLocalDialog('code-edit', { codeId: c.id })} title={c.description || c.name}>
                <span className="cw-codename-text">{c.name}</span>
              </button>
              {props.quickKeys && quickIndex.has(c.id) ? <span className="kbd cw-qk">{quickIndex.get(c.id)}</span> : null}
              <span className="cw-codecount num" title={`${segN} segments in ${docN} sources`}>
                {segN}
                <span className="faint"> · {docN}</span>
              </span>
              <MenuButton
                label={<span className="sr-only">Actions for {c.name}</span>}
                className="btn-ghost btn-sm cw-rowmenu"
                title="Code actions"
                items={[
                  { label: 'Edit definition and rules…', onSelect: () => openLocalDialog('code-edit', { codeId: c.id }) },
                  { label: 'Add sub-code…', onSelect: () => openLocalDialog('code-edit', { parentId: c.id }) },
                  { label: 'Retrieve coded segments', onSelect: () => set({ selectedCodeId: c.id, view: 'retrieve' }) },
                  { label: 'Write a memo on this code', onSelect: () => { createMemo({ title: `Memo on ${c.name}`, codeId: c.id }); set({ view: 'memos' }); } },
                  { label: 'Move to top level', disabled: !c.parentId, onSelect: () => moveCode(c.id, null, null) },
                  { label: 'Merge into another code…', onSelect: () => openLocalDialog('merge-code', { codeId: c.id }) },
                  { label: 'Delete…', danger: true, separator: true, onSelect: () => setConfirmDel({ code: c, keepChildren: true }) },
                ]}
              />
            </div>
          );
        })}
        {codes.length === 0 ? (
          <div className="cw-empty-small">
            <p>No codes yet.</p>
            <p className="help">Type a name above, or select text in a document and create a code from the popover.</p>
          </div>
        ) : null}
        {drag ? (
          <div
            className={`cw-rootdrop ${drag.pos === 'root' ? 'is-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (drag.pos !== 'root') setDrag({ ...drag, over: null, pos: 'root' });
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop();
            }}
          >
            Drop here to make it a top-level theme
          </div>
        ) : null}
      </div>
      <div className="cw-panel-foot help">Counts: segments · sources. Drag a code onto another to make it a sub-code.</div>

      {colorFor ? (
        <Floating anchor={colorFor.anchor} onClose={() => setColorFor(null)} label="Code colour" width={196}>
          <div className="cw-palette">
            {CODE_PALETTE.map((col) => (
              <button
                key={col}
                className="cw-palette-sw"
                style={{ background: col }}
                aria-label={`Colour ${col}`}
                onClick={() => {
                  updateCode(colorFor.id, { color: col });
                  setColorFor(null);
                }}
              />
            ))}
          </div>
        </Floating>
      ) : null}

      {confirmDel ? (
        <ConfirmDialog
          title={`Delete "${confirmDel.code.name}"?`}
          danger
          confirmLabel="Delete code"
          message={
            <div className="stack" style={{ gap: 8 }}>
              <span>
                This removes the code and its {plural(counts.seg.get(confirmDel.code.id) ?? 0, 'coded segment')}. You can undo this with Undo in the coding toolbar.
              </span>
              {childCount.get(confirmDel.code.id) ? (
                <label className="check">
                  <input type="checkbox" checked={confirmDel.keepChildren} onChange={(e) => setConfirmDel({ ...confirmDel, keepChildren: e.target.checked })} />
                  Keep its sub-codes (move them up one level)
                </label>
              ) : null}
            </div>
          }
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => {
            deleteCode(confirmDel.code.id, { keepChildren: confirmDel.keepChildren });
            setConfirmDel(null);
          }}
        />
      ) : null}
    </section>
  );
}
