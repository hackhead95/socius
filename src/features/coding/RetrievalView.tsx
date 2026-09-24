// Code retrieval: every segment coded with a code, with source, attributes and context.

import { useMemo, useRef, useState } from 'react';
import { useStore } from '../../core/store';
import { copyToClipboard } from '../../platform/host';
import { aiErrorMessage, aiErrorText, aiPromptBudget, askAI } from '../../platform/ai';
import { useAiStatus } from '../ai/hooks';
import { AiLoadProgress, AiProviderNote } from '../ai/AiBits';
import { attributeKeys, attributeValues, constantAttributeKeys, orderedAttributes } from '../../lib/coding/analysis';
import { codePath, descendantIds } from '../../lib/coding/tree';
import { originLabel, segmentTable } from '../../lib/coding/exports';
import { buildSummaryPrompt, spreadSample } from '../../lib/coding/ai';
import { createMemo } from './actions';
import { useOrderedCodes, useVisibleSegments, saveCsv, saveXlsx, safeFileName, toast, plural } from './hooks';
import { useCodingUi, jumpTo } from './uiStore';
import { Swatch } from './ui';

const PAGE = 200;

export function RetrievalView() {
  const project = useStore((s) => s.coding);
  const nodes = useOrderedCodes();
  const visible = useVisibleSegments();
  const { selectedCodeId, set } = useCodingUi();
  const ai = useAiStatus();
  const [inclSub, setInclSub] = useState(true);
  const [attrKey, setAttrKey] = useState('');
  const [attrVal, setAttrVal] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [summary, setSummary] = useState<{ text: string; running: boolean; error?: string; used?: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const code = project.codes.find((c) => c.id === selectedCodeId) ?? null;
  const docs = useMemo(() => new Map(project.docs.map((d) => [d.id, d])), [project.docs]);
  const attrKeysList = useMemo(() => attributeKeys(project.docs), [project.docs]);
  // Per kind of source: attributes shared by every interview (a study title) are not shown on quotes.
  const constant = useMemo(() => ({ document: constantAttributeKeys(project.docs.filter((d) => d.kind === 'document')), response: constantAttributeKeys(project.docs.filter((d) => d.kind === 'response')) }), [project.docs]);
  const shownAttrs = (d: (typeof project.docs)[number]) => orderedAttributes(d.attributes, constant[d.kind]).filter(([k]) => !constant[d.kind].has(k));
  const attrVals = useMemo(() => (attrKey ? attributeValues(project.docs, attrKey) : []), [project.docs, attrKey]);

  const segs = useMemo(() => {
    if (!code) return [];
    const ids = new Set([code.id, ...(inclSub ? descendantIds(project.codes, code.id) : [])]);
    return visible
      .filter((s) => ids.has(s.codeId) && docs.has(s.docId))
      .filter((s) => !attrKey || !attrVal || docs.get(s.docId)!.attributes?.[attrKey] === attrVal)
      .sort((a, b) => docs.get(a.docId)!.name.localeCompare(docs.get(b.docId)!.name, undefined, { numeric: true }) || a.start - b.start);
  }, [code, inclSub, visible, docs, attrKey, attrVal, project.codes]);

  const nSources = useMemo(() => new Set(segs.map((s) => s.docId)).size, [segs]);

  const quoteText = (s: (typeof segs)[number]) => docs.get(s.docId)!.text.slice(s.start, s.end).replace(/\s+/g, ' ').trim();

  const copyAll = async () => {
    const text = segs.map((s) => `"${quoteText(s)}" (${docs.get(s.docId)!.name})`).join('\n\n');
    const ok = await copyToClipboard(text);
    toast(ok ? `Copied ${plural(segs.length, 'quote')}` : 'Could not copy. Select the text and copy it instead.', ok ? 'success' : 'error');
  };

  const exportRows = () => segmentTable(project, segs);

  const summarise = async () => {
    if (!code) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const quotes = spreadSample(segs, 80).map((s) => {
      const d = docs.get(s.docId)!;
      const a = shownAttrs(d).slice(0, 3);
      return { source: `${d.name}${a.length ? `; ${a.map(([k, v]) => `${k} ${v}`).join(', ')}` : ''}`, text: quoteText(s) };
    });
    const { prompt, used } = buildSummaryPrompt(code, quotes, { budgetBytes: aiPromptBudget() });
    setSummary({ text: '', running: true, used });
    try {
      const text = await askAI(prompt, { signal: ctrl.signal, onText: (t) => setSummary((cur) => (cur ? { ...cur, text: t } : cur)) });
      setSummary({ text, running: false, used });
    } catch (e: any) {
      setSummary((cur) => ({ text: cur?.text ?? '', running: false, error: ctrl.signal.aborted ? aiErrorMessage('cancelled') : aiErrorText(e), used }));
    }
  };

  if (!project.codes.length) {
    return (
      <div className="cw-center-empty empty">
        <h3>No codes yet</h3>
        <p>Create codes in the codebook and code some text, then retrieve every passage coded with a code here.</p>
      </div>
    );
  }

  return (
    <div className="cw-view cw-retrieve">
      <div className="cw-view-tools">
        <select className="select" value={selectedCodeId ?? ''} onChange={(e) => { set({ selectedCodeId: e.target.value || null }); setLimit(PAGE); setSummary(null); }} aria-label="Code">
          <option value="">Choose a code…</option>
          {nodes.map((n) => (
            <option key={n.code.id} value={n.code.id}>
              {'  '.repeat(n.depth)}
              {n.code.name}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={inclSub} onChange={(e) => setInclSub(e.target.checked)} />
          Include sub-codes
        </label>
        {attrKeysList.length ? (
          <>
            <select className="select input-sm" value={attrKey} onChange={(e) => { setAttrKey(e.target.value); setAttrVal(''); }} aria-label="Filter by attribute">
              <option value="">Any attribute</option>
              {attrKeysList.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            {attrKey ? (
              <select className="select input-sm" value={attrVal} onChange={(e) => setAttrVal(e.target.value)} aria-label={`Value of ${attrKey}`}>
                <option value="">Any value</option>
                {attrVals.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : null}
          </>
        ) : null}
      </div>

      {!code ? (
        <div className="cw-empty-small help">Choose a code here or click one in the codebook.</div>
      ) : (
        <>
          <div className="cw-retrieve-head">
            <div>
              <h2 className="row" style={{ gap: 8 }}>
                <Swatch color={code.color} size={12} />
                {codePath(project.codes, code.id)}
              </h2>
              {code.description ? <p className="cw-codedesc">{code.description}</p> : null}
              <p className="help">
                {plural(segs.length, 'segment')} from {plural(nSources, 'source')}
              </p>
              {ai.ready === 'yes' && segs.length && !summary ? <AiProviderNote when="When you click Summarise this code" what={`up to ${plural(Math.min(segs.length, 80), 'segment')}`} /> : null}
            </div>
            <div className="row">
              <button className="btn btn-sm" onClick={copyAll} disabled={!segs.length}>Copy quotes</button>
              <button className="btn btn-sm" disabled={!segs.length} onClick={() => { const t = exportRows(); void saveCsv(`${safeFileName(code.name)} segments.csv`, t.header, t.rows); }}>Export CSV</button>
              <button className="btn btn-sm" disabled={!segs.length} onClick={() => { const t = exportRows(); void saveXlsx(`${safeFileName(code.name)} segments.xlsx`, code.name, t.header, t.rows); }}>Export Excel</button>
              {ai.ready === 'yes' ? (
                <button className="btn btn-sm btn-primary" disabled={!segs.length || summary?.running} onClick={summarise}>Summarise this code</button>
              ) : null}
            </div>
          </div>

          {summary ? (
            <div className="cw-ai-summary callout callout-info" aria-live="polite">
              <div className="row">
                <b>AI summary of “{code.name}”</b>
                <span className="help">{summary.used ? `from ${plural(summary.used, 'segment')}` : ''}</span>
                <span className="spacer" />
                {summary.running ? (
                  <button className="btn btn-sm" onClick={() => abortRef.current?.abort()}>Stop</button>
                ) : (
                  <>
                    <button className="btn btn-sm" disabled={!summary.text} onClick={async () => { const ok = await copyToClipboard(summary.text); toast(ok ? 'Summary copied' : 'Could not copy', ok ? 'success' : 'error'); }}>Copy</button>
                    <button className="btn btn-sm" disabled={!summary.text} onClick={() => { createMemo({ title: `Summary: ${code.name}`, text: summary.text, codeId: code.id }); toast('Saved as a memo on this code', 'success'); }}>Save as memo</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setSummary(null)}>Close</button>
                  </>
                )}
              </div>
              {summary.running && !summary.text ? <AiLoadProgress onCancel={() => abortRef.current?.abort()} /> : null}
              {summary.text ? <div className="cw-ai-text">{summary.text}</div> : summary.running ? <div className="help">Reading the segments…</div> : null}
              {summary.error ? <div className="help" style={{ color: 'var(--bad)' }}>{summary.error}</div> : null}
              <div className="help">Check every quote against the source before you use it.</div>
            </div>
          ) : null}

          <ol className="cw-quotes">
            {segs.slice(0, limit).map((s) => {
              const d = docs.get(s.docId)!;
              const c = project.codes.find((x) => x.id === s.codeId);
              return (
                <li key={s.id} className="cw-quote" style={{ borderLeftColor: c?.color }}>
                  <blockquote>{quoteText(s)}</blockquote>
                  <div className="cw-quote-meta">
                    <b>{d.name}</b>
                    {shownAttrs(d).slice(0, 4).map(([k, v]) => <span key={k} className="cw-attr" title={`${k}: ${v}`}>{k}: {v}</span>)}
                    {c && c.id !== code.id ? <span className="cw-attr">{c.name}</span> : null}
                    <span className="faint">{s.coder} · {originLabel(s.origin)}</span>
                    <span className="spacer" />
                    <button className="btn btn-ghost btn-sm" onClick={() => jumpTo(d.id, s.start, s.end)}>Show in context</button>
                    <button className="btn btn-ghost btn-sm" onClick={async () => { const ok = await copyToClipboard(`"${quoteText(s)}" (${d.name})`); toast(ok ? 'Quote copied' : 'Could not copy', ok ? 'success' : 'error'); }}>Copy</button>
                  </div>
                  {s.memo ? <div className="cw-quote-memo">Memo: {s.memo}</div> : null}
                </li>
              );
            })}
          </ol>
          {segs.length > limit ? (
            <button className="btn" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, segs.length - limit)} more</button>
          ) : null}
          {!segs.length ? <div className="cw-empty-small help">Nothing is coded with this code yet{attrVal ? ' for this attribute value' : ''}.</div> : null}
        </>
      )}
    </div>
  );
}
