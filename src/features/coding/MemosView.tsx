// Memos: project memos and memos linked to a code or a source.

import { useMemo, useState } from 'react';
import { useStore } from '../../core/store';
import { ConfirmDialog } from '../../ui/Modal';
import { copyToClipboard } from '../../platform/host';
import { createMemo, deleteMemo, updateMemo } from './actions';
import { useOrderedCodes, toast, saveAndReport } from './hooks';
import { useCodingUi } from './uiStore';
import { Swatch } from './ui';

export function MemosView() {
  const memos = useStore((s) => s.coding.memos);
  const codes = useStore((s) => s.coding.codes);
  const docs = useStore((s) => s.coding.docs);
  const nodes = useOrderedCodes();
  const set = useCodingUi((s) => s.set);
  const [activeId, setActiveId] = useState<string | null>(memos[0]?.id ?? null);
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...memos].sort((a, b) => b.updatedAt - a.updatedAt).filter((m) => !t || m.title.toLowerCase().includes(t) || m.text.toLowerCase().includes(t));
  }, [memos, q]);
  const memo = memos.find((m) => m.id === activeId) ?? shown[0] ?? null;
  const documents = useMemo(() => docs.filter((d) => d.kind === 'document'), [docs]);

  const linkLabel = (m: (typeof memos)[number]) => {
    if (m.codeId) return `Code: ${codes.find((c) => c.id === m.codeId)?.name ?? ''}`;
    if (m.docId) return `Source: ${docs.find((d) => d.id === m.docId)?.name ?? ''}`;
    return 'Project memo';
  };

  const exportAll = () => {
    const text = [...memos]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((m) => `# ${m.title}\n${linkLabel(m)} · ${new Date(m.updatedAt).toLocaleString()}\n\n${m.text}`)
      .join('\n\n---\n\n');
    void saveAndReport('memos.md', text, 'text/markdown;charset=utf-8');
  };

  return (
    <div className="cw-view cw-memos">
      <div className="cw-memo-list">
        <div className="row">
          <button className="btn btn-sm btn-primary" onClick={() => setActiveId(createMemo().id)}>New memo</button>
          <span className="spacer" />
          <button className="btn btn-sm" disabled={!memos.length} onClick={exportAll}>Export all</button>
        </div>
        <input className="input input-sm" placeholder="Search memos" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search memos" />
        <div role="list" className="cw-memo-items">
          {shown.map((m) => (
            <button key={m.id} role="listitem" className={`cw-memo-item ${memo?.id === m.id ? 'is-active' : ''}`} onClick={() => setActiveId(m.id)}>
              <span className="cw-docname">{m.title || 'Untitled memo'}</span>
              <span className="cw-docmeta">{linkLabel(m)} · {new Date(m.updatedAt).toLocaleDateString()}</span>
            </button>
          ))}
          {!memos.length ? <p className="help">Memos hold your analytic thinking: emerging ideas, decisions about codes, reflections on an interview.</p> : null}
        </div>
      </div>
      <div className="cw-memo-editor">
        {memo ? (
          <>
            <input className="input cw-memo-title" value={memo.title} onChange={(e) => updateMemo(memo.id, { title: e.target.value })} aria-label="Memo title" />
            <div className="row">
              <label className="label" htmlFor="cw-memo-link">Linked to</label>
              <select
                id="cw-memo-link"
                className="select input-sm"
                value={memo.codeId ? `c:${memo.codeId}` : memo.docId ? `d:${memo.docId}` : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  updateMemo(memo.id, { codeId: v.startsWith('c:') ? v.slice(2) : undefined, docId: v.startsWith('d:') ? v.slice(2) : undefined });
                }}
              >
                <option value="">Whole project</option>
                <optgroup label="Codes">
                  {nodes.map((n) => <option key={n.code.id} value={`c:${n.code.id}`}>{'  '.repeat(n.depth)}{n.code.name}</option>)}
                </optgroup>
                {documents.length ? (
                  <optgroup label="Documents">
                    {documents.map((d) => <option key={d.id} value={`d:${d.id}`}>{d.name}</option>)}
                  </optgroup>
                ) : null}
                {memo.docId && !documents.some((d) => d.id === memo.docId) ? <option value={`d:${memo.docId}`}>{docs.find((d) => d.id === memo.docId)?.name}</option> : null}
              </select>
              {memo.codeId ? (
                <button className="btn btn-ghost btn-sm" onClick={() => set({ selectedCodeId: memo.codeId!, view: 'retrieve' })}>
                  <Swatch color={codes.find((c) => c.id === memo.codeId)?.color ?? 'transparent'} /> Open code
                </button>
              ) : memo.docId ? (
                <button className="btn btn-ghost btn-sm" onClick={() => set({ activeDocId: memo.docId!, view: 'documents' })}>Open source</button>
              ) : null}
              <span className="spacer" />
              <button className="btn btn-ghost btn-sm" onClick={async () => { const ok = await copyToClipboard(memo.text); toast(ok ? 'Memo copied' : 'Could not copy', ok ? 'success' : 'error'); }}>Copy</button>
              <button className="btn btn-ghost btn-sm cw-danger" onClick={() => setConfirm(memo.id)}>Delete</button>
            </div>
            <textarea className="textarea cw-memo-text" value={memo.text} placeholder="Write your memo…" onChange={(e) => updateMemo(memo.id, { text: e.target.value })} aria-label="Memo text" />
            <div className="help">Saved as you type · last edited {new Date(memo.updatedAt).toLocaleString()}</div>
          </>
        ) : (
          <div className="cw-center-empty empty">
            <h3>No memo selected</h3>
            <p>Create a memo to record ideas while you code.</p>
          </div>
        )}
      </div>
      {confirm ? (
        <ConfirmDialog
          title="Delete memo?"
          danger
          confirmLabel="Delete"
          message="This memo will be deleted. You can undo this with Undo in the coding toolbar."
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            deleteMemo(confirm);
            setConfirm(null);
            setActiveId(null);
          }}
        />
      ) : null}
    </div>
  );
}
