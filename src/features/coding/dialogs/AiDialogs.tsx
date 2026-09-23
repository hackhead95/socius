// AI-assisted coding (only offered when running as a Claude artifact). Every request starts with a
// click; suggestion runs are sequential batches with progress and a Stop button.

import { useMemo, useRef, useState } from 'react';
import { Modal } from '../../../ui/Modal';
import { useStore } from '../../../core/store';
import type { CodeDef } from '../../../core/coding-types';
import { newId } from '../../../core/types';
import { askClaudeJson, aiErrorMessage } from '../../../platform/host';
import { buildCodebookPrompt, buildSuggestBatches, parseCodeSuggestions, parseCodebookSuggestions, spreadSample, type CodebookSuggestion } from '../../../lib/coding/ai';
import { splitParagraphs } from '../../../lib/coding/text';
import { nextCodeColor } from '../../../lib/coding/palette';
import { addSegmentsBulk, replaceCodebook } from '../actions';
import { useCodeMap, plural, toast } from '../hooks';
import { CodeChip } from '../ui';

export function AiCodebookDialog(props: { onClose: () => void }) {
  const project = useStore((s) => s.coding);
  const hasResponses = project.docs.some((d) => d.kind === 'response');
  const hasDocs = project.docs.some((d) => d.kind === 'document');
  const [source, setSource] = useState<'response' | 'document'>(hasResponses ? 'response' : 'document');
  const [focus, setFocus] = useState('');
  const [state, setState] = useState<{ running: boolean; error?: string; used?: number }>({ running: false });
  const [items, setItems] = useState<Array<CodebookSuggestion & { pick: boolean }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  const excerpts = useMemo(() => {
    if (source === 'response') return spreadSample(project.docs.filter((d) => d.kind === 'response').map((d) => d.text), 150);
    const paras: string[] = [];
    for (const d of project.docs.filter((x) => x.kind === 'document')) for (const p of splitParagraphs(d.text)) if (d.text.slice(p.start, p.end).length > 60) paras.push(d.text.slice(p.start, p.end));
    return spreadSample(paras, 150);
  }, [project.docs, source]);

  const run = async () => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const { prompt, used } = buildCodebookPrompt(excerpts, { researchQuestion: focus, existing: project.codes.map((c) => c.name) });
    setState({ running: true, used });
    setItems([]);
    try {
      const raw = await askClaudeJson(prompt, { signal: ctrl.signal, modelTier: 'complex' });
      const parsed = parseCodebookSuggestions(raw);
      setItems(parsed.map((p) => ({ ...p, pick: true })));
      setState({ running: false, used, error: parsed.length ? undefined : 'Claude did not suggest any codes. Try again, or add a research focus.' });
    } catch (e: any) {
      setState({ running: false, used, error: aiErrorMessage(e?.code ?? 'unavailable') });
    }
  };

  const add = () => {
    const picked = items.filter((i) => i.pick);
    let codes = project.codes.slice();
    const byName = (n: string) => codes.find((c) => c.name.trim().toLowerCase() === n.trim().toLowerCase());
    const ensure = (name: string, extra: Partial<CodeDef> = {}, parentId: string | null = null): CodeDef => {
      const found = byName(name);
      if (found) return found;
      const c: CodeDef = { id: newId('code'), name: name.trim(), description: '', color: nextCodeColor(codes.map((x) => x.color)), parentId, createdAt: Date.now(), ...extra };
      codes = [...codes, c];
      return c;
    };
    for (const p of picked.filter((x) => !x.parent)) ensure(p.name, { description: p.description, inclusion: p.inclusion || undefined, exclusion: p.exclusion || undefined, example: p.examples[0] });
    for (const p of picked.filter((x) => x.parent)) {
      const parent = ensure(p.parent!);
      ensure(p.name, { description: p.description, inclusion: p.inclusion || undefined, exclusion: p.exclusion || undefined, example: p.examples[0] }, parent.id);
    }
    const added = codes.length - project.codes.length;
    replaceCodebook(codes, 'Add suggested codes');
    toast(`Added ${plural(added, 'code')} to the codebook. Edit the definitions as your analysis develops.`, 'success');
    props.onClose();
  };

  return (
    <Modal
      title="Suggest a codebook"
      subtitle="Claude reads a sample of your data and proposes inductive codes. You decide which to keep."
      size="wide"
      onClose={() => { abortRef.current?.abort(); props.onClose(); }}
      footer={
        <>
          <span className="help">{excerpts.length ? `${plural(Math.min(excerpts.length, state.used ?? excerpts.length), 'excerpt')} will be sent to Claude.` : ''}</span>
          <span className="spacer" />
          {state.running ? <button className="btn" onClick={() => abortRef.current?.abort()}>Stop</button> : null}
          {items.length ? (
            <button className="btn btn-primary" disabled={!items.some((i) => i.pick)} onClick={add}>Add {plural(items.filter((i) => i.pick).length, 'code')}</button>
          ) : (
            <button className="btn btn-primary" disabled={state.running || !excerpts.length} onClick={run}>{state.running ? 'Reading…' : 'Suggest codes'}</button>
          )}
        </>
      }
    >
      <div className="stack">
        <div className="cw-form-grid">
          {hasResponses && hasDocs ? (
            <div className="field">
              <label htmlFor="cw-aisrc">Read</label>
              <select id="cw-aisrc" className="select" value={source} onChange={(e) => setSource(e.target.value as any)}>
                <option value="response">up to 150 open-ended responses</option>
                <option value="document">up to 150 paragraphs from documents</option>
              </select>
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="cw-aifocus">Research question or focus (optional)</label>
            <input id="cw-aifocus" className="input" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. how migrant workers find housing" />
          </div>
        </div>
        {!excerpts.length ? <div className="callout callout-info">Import documents or responses first.</div> : null}
        {state.error ? <div className="callout callout-bad">{state.error}</div> : null}
        {state.running ? <p className="help" aria-live="polite">Claude is reading the excerpts. This can take up to a minute.</p> : null}
        {items.length ? (
          <>
            <div className="row">
              <b>{plural(items.length, 'suggested code')}</b>
              <span className="spacer" />
              <button className="btn btn-sm btn-ghost" onClick={run} disabled={state.running}>Suggest again</button>
            </div>
            <div className="cw-suggest-list">
              {items.map((it, i) => (
                <label key={i} className={`cw-suggest ${it.pick ? '' : 'is-off'}`}>
                  <input type="checkbox" checked={it.pick} onChange={(e) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, pick: e.target.checked } : x)))} />
                  <span className="stack" style={{ gap: 4, minWidth: 0 }}>
                    <span className="row" style={{ gap: 6 }}>
                      <input className="input input-sm" value={it.name} onChange={(e) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Code name" />
                      {it.parent ? <span className="badge">under {it.parent}</span> : null}
                    </span>
                    {it.description ? <span>{it.description}</span> : null}
                    {it.inclusion ? <span className="help"><b>Include:</b> {it.inclusion}</span> : null}
                    {it.exclusion ? <span className="help"><b>Exclude:</b> {it.exclusion}</span> : null}
                    {it.examples.map((q, k) => <span key={k} className="cw-suggest-quote">“{q}”</span>)}
                  </span>
                </label>
              ))}
            </div>
            <p className="help">Suggestions are a starting point for your own reading, not findings. Check example quotes against the data.</p>
          </>
        ) : null}
      </div>
    </Modal>
  );
}

interface RowSuggestion {
  docId: string;
  codeIds: string[];
  /** Codes the user kept for this row. */
  keep: Set<string>;
  status: 'pending' | 'accepted' | 'rejected';
}

export function AiSuggestDialog(props: { onClose: () => void; docIds?: string[] }) {
  const project = useStore((s) => s.coding);
  const codeMap = useCodeMap();
  const [scope, setScope] = useState<'uncoded' | 'all' | 'selected'>(props.docIds?.length ? 'selected' : 'uncoded');
  const [maxN, setMaxN] = useState(200);
  const [rows, setRows] = useState<RowSuggestion[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number; running: boolean; error?: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const targets = useMemo(() => {
    const coded = new Set(project.segments.filter((s) => s.coder === project.activeCoder).map((s) => s.docId));
    const resp = project.docs.filter((d) => d.kind === 'response');
    const list = scope === 'selected' && props.docIds ? resp.filter((d) => props.docIds!.includes(d.id)) : scope === 'uncoded' ? resp.filter((d) => !coded.has(d.id)) : resp;
    return list.slice(0, maxN);
  }, [project.docs, project.segments, project.activeCoder, scope, props.docIds, maxN]);

  const codes = project.codes;
  const batches = useMemo(() => buildSuggestBatches(codes, targets.map((d, i) => ({ id: `r${i + 1}`, text: d.text }))), [codes, targets]);
  const docText = useMemo(() => new Map(project.docs.map((d) => [d.id, d])), [project.docs]);

  const run = async () => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const idToDoc = new Map(targets.map((d, i) => [`r${i + 1}`, d.id]));
    setRows([]);
    setProgress({ done: 0, total: batches.length, running: true });
    for (let b = 0; b < batches.length; b++) {
      if (ctrl.signal.aborted) break;
      try {
        const raw = await askClaudeJson(batches[b].prompt, { signal: ctrl.signal, modelTier: 'default' });
        const m = parseCodeSuggestions(raw, batches[b].ids, codes);
        const add: RowSuggestion[] = [];
        for (const id of batches[b].ids) {
          const docId = idToDoc.get(id)!;
          const cids = m.get(id) ?? [];
          if (cids.length) add.push({ docId, codeIds: cids, keep: new Set(cids), status: 'pending' });
        }
        setRows((r) => [...r, ...add]);
        setProgress({ done: b + 1, total: batches.length, running: b + 1 < batches.length });
      } catch (e: any) {
        const code = ctrl.signal.aborted ? 'cancelled' : (e?.code ?? 'unavailable');
        setProgress({ done: b, total: batches.length, running: false, error: aiErrorMessage(code) });
        return;
      }
    }
    if (ctrl.signal.aborted) setProgress((p) => (p ? { ...p, running: false, error: aiErrorMessage('cancelled') } : p));
  };

  const accept = (which: RowSuggestion[]) => {
    const segs = which.flatMap((r) => {
      const d = docText.get(r.docId);
      if (!d) return [];
      return [...r.keep].map((codeId) => ({ docId: r.docId, codeId, start: 0, end: d.text.length, origin: 'ai-suggested' as const }));
    });
    const n = addSegmentsBulk(`Accept AI suggestions (${plural(which.length, 'response')})`, segs);
    const ids = new Set(which.map((r) => r.docId));
    setRows((rs) => rs.map((r) => (ids.has(r.docId) ? { ...r, status: 'accepted' } : r)));
    toast(`Added ${plural(n, 'segment')} marked as AI suggestions.`, 'success');
  };

  const pending = rows.filter((r) => r.status === 'pending' && r.keep.size);

  return (
    <Modal
      title="Suggest codes for responses"
      subtitle="Claude applies your existing codebook to open-ended responses. You review every suggestion before it is added."
      size="wide"
      onClose={() => { abortRef.current?.abort(); props.onClose(); }}
      footer={
        <>
          {progress?.running ? <button className="btn" onClick={() => abortRef.current?.abort()}>Stop</button> : null}
          <span className="spacer" />
          {pending.length ? <button className="btn btn-primary" onClick={() => accept(pending)}>Accept all {plural(pending.length, 'response')}</button> : null}
          {!rows.length && !progress?.running ? (
            <button className="btn btn-primary" disabled={!codes.length || !targets.length} onClick={run}>
              Suggest codes for {plural(targets.length, 'response')}
            </button>
          ) : null}
        </>
      }
    >
      <div className="stack">
        {!codes.length ? <div className="callout callout-info">Build a codebook first (by hand or with Suggest a codebook). Suggestions only use codes that exist.</div> : null}
        {!rows.length && !progress?.running ? (
          <div className="cw-form-grid">
            <div className="field">
              <label htmlFor="cw-sscope">Responses</label>
              <select id="cw-sscope" className="select" value={scope} onChange={(e) => setScope(e.target.value as any)}>
                <option value="uncoded">not yet coded by {project.activeCoder}</option>
                <option value="all">all responses</option>
                {props.docIds?.length ? <option value="selected">the {props.docIds.length} selected</option> : null}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cw-smax">At most</label>
              <select id="cw-smax" className="select" value={maxN} onChange={(e) => setMaxN(Number(e.target.value))}>
                {[50, 100, 200, 500, 1000, 2000].map((n) => <option key={n} value={n}>{n} responses</option>)}
              </select>
            </div>
          </div>
        ) : null}
        {!rows.length && !progress?.running ? (
          <p className="help">
            {plural(targets.length, 'response')} in {plural(batches.length, 'request')} to Claude, sent one after another. You can stop at any time and keep what has arrived. Accepted codes are marked as AI suggestions and belong to {project.activeCoder}.
          </p>
        ) : null}
        {progress ? (
          <div className="stack" style={{ gap: 4 }} aria-live="polite">
            <div className="row">
              <span className="help">
                {progress.running ? `Batch ${progress.done + 1} of ${progress.total}…` : `${progress.done} of ${progress.total} batches done.`} {plural(rows.length, 'response')} with suggestions.
              </span>
            </div>
            <div className="cw-progress"><span style={{ width: `${(100 * progress.done) / Math.max(1, progress.total)}%` }} /></div>
            {progress.error ? <div className="callout callout-warn">{progress.error}</div> : null}
          </div>
        ) : null}
        {rows.length ? (
          <div className="cw-suggest-rows">
            {rows.map((r, i) => {
              const d = docText.get(r.docId);
              if (!d) return null;
              return (
                <div key={r.docId} className={`cw-suggest-row is-${r.status}`}>
                  <div className="cw-suggest-text">
                    <b>{d.name}</b> {d.text}
                  </div>
                  <div className="cw-suggest-codes">
                    {r.codeIds.map((cid) => {
                      const c = codeMap.get(cid);
                      if (!c) return null;
                      const on = r.keep.has(cid);
                      return (
                        <button
                          key={cid}
                          className="cw-chip-toggle"
                          aria-pressed={on}
                          disabled={r.status !== 'pending'}
                          onClick={() => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, keep: toggle(x.keep, cid) } : x)))}
                          title={on ? 'Click to leave this code out' : 'Click to keep this code'}
                        >
                          <CodeChip code={c} small muted={!on} />
                        </button>
                      );
                    })}
                    {r.status === 'pending' ? (
                      <span className="row" style={{ gap: 4 }}>
                        <button className="btn btn-sm" disabled={!r.keep.size} onClick={() => accept([r])}>Accept</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, status: 'rejected' } : x)))}>Reject</button>
                      </span>
                    ) : (
                      <span className={`badge ${r.status === 'accepted' ? 'badge-good' : ''}`}>{r.status === 'accepted' ? 'Accepted' : 'Rejected'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function toggle(s: Set<string>, id: string): Set<string> {
  const n = new Set(s);
  if (n.has(id)) n.delete(id);
  else n.add(id);
  return n;
}
