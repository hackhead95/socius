// Source list: documents with search, coded/uncoded and attribute filters, segment counts.

import { useMemo, useState } from 'react';
import { useStore } from '../../core/store';
import { attributeKeys, attributeValues, constantAttributeKeys, orderedAttributes } from '../../lib/coding/analysis';
import { deleteDocs } from './actions';
import { useSegmentIndex, plural } from './hooks';
import { useCodingUi, openLocalDialog } from './uiStore';
import { ConfirmDialog } from '../../ui/Modal';
import { MenuButton } from './ui';

export function SourcesPanel() {
  const docs = useStore((s) => s.coding.docs);
  const segIndex = useSegmentIndex();
  const { activeDocId, docSearch, docFilter, docAttr, set } = useCodingUi();
  const [confirm, setConfirm] = useState<{ ids: string[]; label: string } | null>(null);

  const documents = useMemo(() => docs.filter((d) => d.kind === 'document'), [docs]);
  const nResponses = docs.length - documents.length;
  const attrKeys = useMemo(() => attributeKeys(documents), [documents]);
  const constant = useMemo(() => constantAttributeKeys(documents), [documents]);
  const attrValues = useMemo(() => (docAttr ? attributeValues(documents, docAttr.key) : []), [documents, docAttr]);

  const shown = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    return documents.filter((d) => {
      const n = segIndex.get(d.id)?.length ?? 0;
      if (docFilter === 'coded' && !n) return false;
      if (docFilter === 'uncoded' && n) return false;
      if (docAttr && docAttr.value && (d.attributes?.[docAttr.key] ?? '') !== docAttr.value) return false;
      if (q && !d.name.toLowerCase().includes(q) && !d.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [documents, docSearch, docFilter, docAttr, segIndex]);

  return (
    <section className="cw-panel cw-sources" aria-label="Sources">
      <div className="cw-panel-head">
        <h3>Sources</h3>
        <span className="badge">{documents.length}</span>
        <span className="spacer" />
        <button className="btn btn-sm" onClick={() => openLocalDialog('import')}>
          Import
        </button>
      </div>
      <div className="cw-panel-tools">
        <input className="input input-sm" placeholder="Search names and text" value={docSearch} onChange={(e) => set({ docSearch: e.target.value })} aria-label="Search sources" />
        <div className="row" style={{ gap: 6 }}>
          <select className="select input-sm" value={docFilter} onChange={(e) => set({ docFilter: e.target.value as any })} aria-label="Coding status">
            <option value="all">All</option>
            <option value="coded">Coded</option>
            <option value="uncoded">Not coded yet</option>
          </select>
          {attrKeys.length ? (
            <select
              className="select input-sm"
              value={docAttr?.key ?? ''}
              onChange={(e) => set({ docAttr: e.target.value ? { key: e.target.value, value: '' } : null })}
              aria-label="Filter by attribute"
            >
              <option value="">Any attribute</option>
              {attrKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          ) : null}
          {docAttr ? (
            <select className="select input-sm" value={docAttr.value} onChange={(e) => set({ docAttr: { key: docAttr.key, value: e.target.value } })} aria-label={`Value of ${docAttr.key}`}>
              <option value="">Any value</option>
              {attrValues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>
      <div className="cw-panel-body cw-doclist" role="list">
        {nResponses > 0 ? (
          <button className="cw-docitem cw-docitem-resp" onClick={() => set({ view: 'responses' })} role="listitem">
            <span className="cw-docname">Open-ended responses</span>
            <span className="cw-docmeta">{plural(nResponses, 'response')} · open the table</span>
          </button>
        ) : null}
        {shown.map((d) => {
          const n = segIndex.get(d.id)?.length ?? 0;
          return (
            <div key={d.id} className={`cw-docitem ${d.id === activeDocId ? 'is-active' : ''}`} role="listitem">
              <button className="cw-docbtn" onClick={() => set({ activeDocId: d.id, view: 'documents' })} aria-current={d.id === activeDocId ? 'true' : undefined}>
                <span className="cw-docname">{d.name}</span>
                <span className="cw-docmeta">
                  {n ? plural(n, 'segment') : 'Not coded yet'}
                  {docSummary(orderedAttributes(d.attributes, constant).filter(([k]) => !constant.has(k)))}
                </span>
              </button>
              <MenuButton
                label={<span className="sr-only">Actions for {d.name}</span>}
                className="btn-ghost btn-sm cw-docmenu"
                title="Rename or delete"
                items={[
                  { label: 'Rename or edit attributes', onSelect: () => openLocalDialog('doc-edit', { docId: d.id }) },
                  { label: 'Delete', danger: true, onSelect: () => setConfirm({ ids: [d.id], label: d.name }) },
                ]}
              />
            </div>
          );
        })}
        {!documents.length ? (
          <div className="cw-empty-small">
            <p>No documents yet.</p>
            <p className="help">Import interview transcripts (.docx, .txt), paste text, or load the sample interviews.</p>
          </div>
        ) : !shown.length ? (
          <div className="cw-empty-small help">No sources match these filters.</div>
        ) : null}
      </div>
      {shown.length > 1 && shown.length < documents.length ? (
        <div className="cw-panel-foot">
          <button className="btn btn-ghost btn-sm cw-danger" onClick={() => setConfirm({ ids: shown.map((d) => d.id), label: `${shown.length} filtered sources` })}>
            Delete {shown.length} filtered sources
          </button>
        </div>
      ) : null}
      {confirm ? (
        <ConfirmDialog
          title="Delete source?"
          danger
          confirmLabel="Delete"
          message={
            <>
              Delete <b>{confirm.label}</b> and all coding on {confirm.ids.length === 1 ? 'it' : 'them'}? You can undo this with Undo in the coding toolbar.
            </>
          }
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            deleteDocs(confirm.ids);
            setConfirm(null);
          }}
        />
      ) : null}
    </section>
  );
}

/** Up to three distinguishing attribute values for the source list ("58, Woman, Kolkata"). */
function docSummary(entries: Array<[string, string]>): string {
  const vals = entries.map(([, v]) => v.trim()).filter((v) => v && v.length <= 40).slice(0, 3);
  return vals.length ? ` · ${vals.join(', ')}` : '';
}
