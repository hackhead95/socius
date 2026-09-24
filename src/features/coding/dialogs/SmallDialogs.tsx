// Code editor, merge, source editor and coder management dialogs.

import { useMemo, useState } from 'react';
import { ConfirmDialog, Modal } from '../../../ui/Modal';
import { useStore } from '../../../core/store';
import { CODE_PALETTE, nextCodeColor, normaliseHex } from '../../../lib/coding/palette';
import { canReparent, codePath } from '../../../lib/coding/tree';
import { parseRules, rulesFromText } from '../../../lib/coding/rules';
import { addCoder, commit, createCode, deleteCode, mergeCode, removeCoder, renameCoder, renameDoc, setActiveCoder, setDocAttributes } from '../actions';
import { useOrderedCodes, toast, plural } from '../hooks';
import { useCodingUi } from '../uiStore';

export function CodeEditDialog(props: { codeId?: string; parentId?: string; onClose: () => void }) {
  const codes = useStore((s) => s.coding.codes);
  const segments = useStore((s) => s.coding.segments);
  const nodes = useOrderedCodes();
  const existing = codes.find((c) => c.id === props.codeId);
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(existing?.color ?? nextCodeColor(codes.map((c) => c.color)));
  const [hex, setHex] = useState(existing?.color ?? '');
  const [parentId, setParentId] = useState<string | null>(existing ? existing.parentId : (props.parentId ?? null));
  const [description, setDescription] = useState(existing?.description ?? '');
  const [inclusion, setInclusion] = useState(existing?.inclusion ?? '');
  const [exclusion, setExclusion] = useState(existing?.exclusion ?? '');
  const [example, setExample] = useState(existing?.example ?? '');
  const [rules, setRules] = useState((existing?.rules ?? []).join('\n'));
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const parsed = useMemo(() => parseRules(rulesFromText(rules)), [rules]);
  const ruleErrors = parsed.filter((r) => r.error);
  const nSegs = existing ? segments.filter((s) => s.codeId === existing.id).length : 0;

  const save = () => {
    const n = name.trim();
    if (!n) return setError('Give the code a name.');
    if (codes.some((c) => c.id !== existing?.id && c.name.trim().toLowerCase() === n.toLowerCase() && c.parentId === parentId)) return setError(`There is already a code named "${n}" at this level.`);
    if (existing && !canReparent(codes, existing.id, parentId)) return setError('A code cannot be placed under one of its own sub-codes.');
    const patch = {
      name: n,
      color,
      parentId,
      description: description.trim(),
      inclusion: inclusion.trim() || undefined,
      exclusion: exclusion.trim() || undefined,
      example: example.trim() || undefined,
      rules: rulesFromText(rules).length ? rulesFromText(rules) : undefined,
    };
    if (existing) commit('Edit code', (c) => ({ ...c, codes: c.codes.map((x) => (x.id === existing.id ? { ...x, ...patch } : x)) }));
    else {
      const c = createCode(n, parentId, patch);
      useCodingUi.getState().set({ selectedCodeId: c.id });
    }
    props.onClose();
  };

  return (
    <Modal
      title={existing ? `Edit code: ${existing.name}` : props.parentId ? 'New sub-code' : 'New code'}
      subtitle={existing ? `${plural(nSegs, 'coded segment')}` : 'A clear definition with inclusion and exclusion criteria keeps coding consistent across coders.'}
      onClose={props.onClose}
      footer={
        <>
          {existing ? (
            <>
              <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
              <button className="btn" onClick={() => { props.onClose(); useCodingUi.getState().set({ dialog: { id: 'merge-code', params: { codeId: existing.id } } }); }}>Merge into…</button>
            </>
          ) : null}
          <span className="spacer" />
          <button className="btn" onClick={props.onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>{existing ? 'Save' : 'Create code'}</button>
        </>
      }
    >
      <form className="stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="cw-form-grid">
          <div className="field">
            <label htmlFor="cw-cname">Name</label>
            <input id="cw-cname" className="input" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} autoFocus />
          </div>
          <div className="field">
            <label htmlFor="cw-cparent">Theme (parent code)</label>
            <select id="cw-cparent" className="select" value={parentId ?? ''} onChange={(e) => setParentId(e.target.value || null)}>
              <option value="">None (top-level theme)</option>
              {nodes
                .filter((n) => !existing || canReparent(codes, existing.id, n.code.id))
                .map((n) => <option key={n.code.id} value={n.code.id}>{'  '.repeat(n.depth)}{n.code.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <span className="label">Colour</span>
          <div className="row" style={{ gap: 6 }}>
            {CODE_PALETTE.map((c) => (
              <button type="button" key={c} className={`cw-palette-sw ${color === c ? 'is-active' : ''}`} style={{ background: c }} aria-label={`Colour ${c}`} aria-pressed={color === c} onClick={() => { setColor(c); setHex(c); }} />
            ))}
            <input className="input input-sm" style={{ width: 90 }} value={hex} placeholder="#hex" aria-label="Custom colour (hex)" onChange={(e) => { setHex(e.target.value); const n = normaliseHex(e.target.value); if (n) setColor(n); }} />
            <span className="cw-hl-sample" style={{ background: `color-mix(in srgb, ${color} var(--cw-hl), transparent)`, boxShadow: `inset 0 -2px 0 ${color}` }}>Sample highlight</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="cw-cdesc">Definition</label>
          <textarea id="cw-cdesc" className="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this code captures" />
        </div>
        <div className="cw-form-grid">
          <div className="field">
            <label htmlFor="cw-cinc">Include when</label>
            <textarea id="cw-cinc" className="textarea" rows={2} value={inclusion} onChange={(e) => setInclusion(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cw-cexc">Exclude when</label>
            <textarea id="cw-cexc" className="textarea" rows={2} value={exclusion} onChange={(e) => setExclusion(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="cw-cex">Example</label>
          <textarea id="cw-cex" className="textarea" rows={2} value={example} onChange={(e) => setExample(e.target.value)} placeholder="A typical quote" />
        </div>
        <div className="field">
          <label htmlFor="cw-crules">Auto-coding rules (one per line)</label>
          <textarea id="cw-crules" className="textarea mono" rows={3} value={rules} onChange={(e) => setRules(e.target.value)} placeholder={'rent\nlandlord*\n/evict(ed|ion)?/i'} />
          <span className="help">Plain words match whole words, case-insensitive; * is a wildcard; several words make a phrase; /pattern/i is a regular expression. Run them from Auto-code.</span>
          {ruleErrors.map((r, i) => <span key={i} className="help" style={{ color: 'var(--bad)' }}>{r.source}: {r.error}</span>)}
        </div>
        {error ? <div className="callout callout-bad">{error}</div> : null}
        <button type="submit" hidden />
      </form>
      {confirmDelete && existing ? (
        <ConfirmDialog
          title={`Delete "${existing.name}"?`}
          danger
          confirmLabel="Delete code"
          message={`This removes the code and its ${plural(nSegs, 'coded segment')}. Sub-codes move up one level. You can undo this with Undo in the coding toolbar.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteCode(existing.id, { keepChildren: true });
            props.onClose();
          }}
        />
      ) : null}
    </Modal>
  );
}

export function MergeCodeDialog(props: { codeId: string; onClose: () => void }) {
  const codes = useStore((s) => s.coding.codes);
  const segments = useStore((s) => s.coding.segments);
  const nodes = useOrderedCodes();
  const from = codes.find((c) => c.id === props.codeId);
  const [into, setInto] = useState('');
  if (!from) return null;
  const n = segments.filter((s) => s.codeId === from.id).length;
  return (
    <Modal
      title={`Merge "${from.name}" into another code`}
      size="narrow"
      onClose={props.onClose}
      footer={
        <>
          <button className="btn" onClick={props.onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!into}
            onClick={() => {
              mergeCode(from.id, into);
              toast(`Merged "${from.name}" into "${codes.find((c) => c.id === into)?.name}".`, 'success');
              props.onClose();
            }}
          >
            Merge
          </button>
        </>
      }
    >
      <div className="stack">
        <p style={{ fontSize: 'var(--fs-sm)' }}>
          Its {plural(n, 'segment')} move to the chosen code (overlapping passages are joined), its sub-codes move under it, and "{from.name}" is removed.
        </p>
        <div className="field">
          <label htmlFor="cw-into">Merge into</label>
          <select id="cw-into" className="select" value={into} onChange={(e) => setInto(e.target.value)} autoFocus>
            <option value="">Choose a code…</option>
            {nodes.filter((x) => x.code.id !== from.id).map((x) => <option key={x.code.id} value={x.code.id}>{codePath(codes, x.code.id)}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}

export function DocEditDialog(props: { docId: string; onClose: () => void }) {
  const doc = useStore((s) => s.coding.docs.find((d) => d.id === props.docId));
  const [name, setName] = useState(doc?.name ?? '');
  const [rows, setRows] = useState<Array<[string, string]>>(() => Object.entries(doc?.attributes ?? {}));
  if (!doc) return null;
  const save = () => {
    if (name.trim() && name.trim() !== doc.name) renameDoc(doc.id, name);
    const attrs: Record<string, string> = {};
    for (const [k, v] of rows) if (k.trim() && v.trim()) attrs[k.trim()] = v.trim();
    if (JSON.stringify(attrs) !== JSON.stringify(doc.attributes ?? {})) setDocAttributes(doc.id, attrs);
    props.onClose();
  };
  return (
    <Modal
      title="Source details"
      onClose={props.onClose}
      footer={
        <>
          <button className="btn" onClick={props.onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </>
      }
    >
      <form className="stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="field">
          <label htmlFor="cw-dname">Name</label>
          <input id="cw-dname" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <span className="label">Attributes</span>
          <span className="help">Characteristics of the participant or setting (gender, age group, site, interview date). Used for filtering and codes-by-attribute tables.</span>
          {rows.map(([k, v], i) => (
            <div key={i} className="row" style={{ flexWrap: 'nowrap' }}>
              <input className="input input-sm" placeholder="Attribute" value={k} onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} aria-label="Attribute name" />
              <input className="input input-sm" placeholder="Value" value={v} onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} aria-label="Attribute value" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} aria-label="Remove attribute">×</button>
            </div>
          ))}
          <div>
            <button type="button" className="btn btn-sm" onClick={() => setRows((r) => [...r, ['', '']])}>Add attribute</button>
          </div>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export function CodersDialog(props: { onClose: () => void }) {
  const coders = useStore((s) => s.coding.coders);
  const active = useStore((s) => s.coding.activeCoder);
  const segments = useStore((s) => s.coding.segments);
  const showAll = useCodingUi((s) => s.showAllCoders);
  const setUi = useCodingUi((s) => s.set);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ from: string; to: string } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of segments) m.set(s.coder, (m.get(s.coder) ?? 0) + 1);
    return m;
  }, [segments]);
  return (
    <Modal title="Coders" subtitle="For intercoder reliability, each coder codes the same sources independently." onClose={props.onClose} footer={<button className="btn btn-primary" onClick={props.onClose}>Done</button>}>
      <div className="stack">
        <table className="table">
          <thead>
            <tr><th>Coder</th><th className="num">Segments</th><th /></tr>
          </thead>
          <tbody>
            {coders.map((c) => (
              <tr key={c}>
                <td>
                  {editing?.from === c ? (
                    <form className="row" onSubmit={(e) => { e.preventDefault(); if (!renameCoder(c, editing.to)) toast('That name is empty or already used.', 'warning'); setEditing(null); }}>
                      <input className="input input-sm" value={editing.to} onChange={(e) => setEditing({ from: c, to: e.target.value })} autoFocus aria-label="Coder name" />
                      <button className="btn btn-sm" type="submit">Save</button>
                    </form>
                  ) : (
                    <span className="row" style={{ gap: 6 }}>{c}{c === active ? <span className="badge badge-accent">coding now</span> : null}</span>
                  )}
                </td>
                <td className="num">{counts.get(c) ?? 0}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {c !== active ? <button className="btn btn-sm" onClick={() => setActiveCoder(c)}>Code as {c}</button> : null}{' '}
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ from: c, to: c })}>Rename</button>{' '}
                  {coders.length > 1 ? <button className="btn btn-ghost btn-sm cw-danger" onClick={() => setConfirm(c)}>Remove</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (addCoder(newName)) { setNewName(''); setUi({ showAllCoders: false }); toast('Coder added. Other coders’ segments are now hidden while you code, so coding stays independent.', 'info'); } else toast('That name is empty or already used.', 'warning'); }}>
          <input className="input" placeholder="New coder name" value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="New coder name" />
          <button className="btn" type="submit">Add coder</button>
        </form>
        <label className="check">
          <input type="checkbox" checked={!showAll} onChange={(e) => setUi({ showAllCoders: !e.target.checked })} />
          Show only the active coder’s segments (blind coding)
        </label>
      </div>
      {confirm ? (
        <ConfirmDialog
          title={`Remove ${confirm}?`}
          danger
          confirmLabel="Remove coder"
          message={`This also deletes their ${plural(counts.get(confirm) ?? 0, 'coded segment')}. You can undo this with Undo in the coding toolbar.`}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { removeCoder(confirm); setConfirm(null); }}
        />
      ) : null}
    </Modal>
  );
}
