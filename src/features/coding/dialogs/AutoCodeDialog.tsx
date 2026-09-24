// Auto-coding with keyword / regex rules: edit rules per code, preview matches in context, apply.

import { useMemo, useState } from 'react';
import { Modal } from '../../../ui/Modal';
import { useStore } from '../../../core/store';
import { findRuleMatches, parseRules, rulesFromText, type AutoScope, type RuleMatch } from '../../../lib/coding/rules';
import { addSegmentsBulk, canUndo, undoCoding, updateCode } from '../actions';
import { useOrderedCodes, plural, toast } from '../hooks';
import { Swatch } from '../ui';

type Sources = 'all' | 'document' | 'response' | 'uncoded';

export function AutoCodeDialog(props: { onClose: () => void }) {
  const project = useStore((s) => s.coding);
  const nodes = useOrderedCodes();
  const [codeId, setCodeId] = useState<string>(() => nodes.find((n) => n.code.rules?.length)?.code.id ?? nodes[0]?.code.id ?? '');
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(project.codes.map((c) => [c.id, (c.rules ?? []).join('\n')])));
  const hasResponses = project.docs.some((d) => d.kind === 'response');
  const hasDocuments = project.docs.some((d) => d.kind === 'document');
  const [scope, setScope] = useState<AutoScope>(hasDocuments && !hasResponses ? 'sentence' : 'text');
  const [sources, setSources] = useState<Sources>('all');
  const [matches, setMatches] = useState<RuleMatch[] | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [applied, setApplied] = useState<number | null>(null);

  const withRules = nodes.filter((n) => rulesFromText(drafts[n.code.id] ?? '').length);
  const current = project.codes.find((c) => c.id === codeId);
  const parsed = useMemo(() => parseRules(rulesFromText(drafts[codeId] ?? '')), [drafts, codeId]);
  const docMap = useMemo(() => new Map(project.docs.map((d) => [d.id, d])), [project.docs]);
  const codeMap = useMemo(() => new Map(project.codes.map((c) => [c.id, c])), [project.codes]);

  const saveRules = () => {
    for (const c of project.codes) {
      const next = rulesFromText(drafts[c.id] ?? '');
      const prev = c.rules ?? [];
      if (next.join('\n') !== prev.join('\n')) updateCode(c.id, { rules: next.length ? next : undefined });
    }
  };

  const preview = () => {
    saveRules();
    const codedDocs = new Set(project.segments.filter((s) => s.coder === project.activeCoder).map((s) => s.docId));
    const docs = project.docs.filter((d) => (sources === 'all' ? true : sources === 'uncoded' ? d.kind === 'response' && !codedDocs.has(d.id) : d.kind === sources));
    const codes = project.codes.map((c) => ({ ...c, rules: rulesFromText(drafts[c.id] ?? '') }));
    const m = findRuleMatches(docs, codes, scope, project.segments, project.activeCoder).filter((x) => !x.alreadyCoded);
    setMatches(m);
    setExcluded(new Set());
    setApplied(null);
  };

  const apply = () => {
    if (!matches) return;
    const chosen = matches.filter((_, i) => !excluded.has(i));
    const n = addSegmentsBulk(`Auto-coding (${plural(chosen.length, 'passage')})`, chosen.map((m) => ({ docId: m.docId, codeId: m.codeId, start: m.start, end: m.end, origin: 'auto-rule' as const })));
    setApplied(n);
    setMatches(null);
    toast(`Auto-coding added ${plural(n, 'segment')}. Use Undo in the coding toolbar to take it back.`, 'success');
  };

  const byCode = useMemo(() => {
    const m = new Map<string, number>();
    matches?.forEach((x, i) => !excluded.has(i) && m.set(x.codeId, (m.get(x.codeId) ?? 0) + 1));
    return m;
  }, [matches, excluded]);

  const nChosen = matches ? matches.length - excluded.size : 0;

  return (
    <Modal
      title="Auto-code with keyword rules"
      subtitle="Find passages by keywords or patterns, check them in context, then code them in one step."
      size="wide"
      onClose={() => {
        saveRules();
        props.onClose();
      }}
      footer={
        <>
          {applied !== null && canUndo() ? (
            <button className="btn" onClick={() => { const l = undoCoding(); if (l) toast(`Undone: ${l}`, 'info'); setApplied(null); }}>
              Undo auto-coding
            </button>
          ) : null}
          <span className="spacer" />
          <button className="btn" onClick={() => { saveRules(); props.onClose(); }}>Close</button>
          {matches ? (
            <button className="btn btn-primary" disabled={!nChosen} onClick={apply}>Code {plural(nChosen, 'passage')}</button>
          ) : (
            <button className="btn btn-primary" disabled={!withRules.length || !project.docs.length} onClick={preview}>Preview matches</button>
          )}
        </>
      }
    >
      {!project.codes.length ? (
        <div className="cw-empty-small help">Create codes first, then give them keyword rules here.</div>
      ) : matches === null ? (
        <div className="cw-autocode">
          <div className="cw-autocode-codes" role="listbox" aria-label="Codes">
            {nodes.map((n) => {
              const k = rulesFromText(drafts[n.code.id] ?? '').length;
              return (
                <button key={n.code.id} role="option" aria-selected={codeId === n.code.id} className={`cw-autocode-code ${codeId === n.code.id ? 'is-active' : ''}`} style={{ paddingLeft: 8 + n.depth * 12 }} onClick={() => setCodeId(n.code.id)}>
                  <Swatch color={n.code.color} />
                  <span className="cw-codename-text" title={n.code.name}>{n.code.name}</span>
                  {k ? <span className="badge badge-accent">{k}</span> : null}
                </button>
              );
            })}
          </div>
          <div className="stack">
            {current ? (
              <div className="field">
                <label htmlFor="cw-rules">Rules for “{current.name}” (one per line)</label>
                <textarea id="cw-rules" className="textarea mono" rows={7} value={drafts[codeId] ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [codeId]: e.target.value }))} placeholder={'job\nunemploy*\nwork permit\n/\\b(salary|wages?)\\b/i'} autoFocus />
                <span className="help">Plain words match whole words, ignoring case; * matches any ending (migra* finds migrant, migration); several words form a phrase; /pattern/i is a regular expression; lines starting with # are notes.</span>
                {parsed.filter((r) => r.error).map((r, i) => <span key={i} className="help" style={{ color: 'var(--bad)' }}>{r.source}: {r.error}</span>)}
              </div>
            ) : null}
            <div className="cw-form-grid">
              <div className="field">
                <label htmlFor="cw-scope">What gets coded</label>
                <select id="cw-scope" className="select" value={scope} onChange={(e) => setScope(e.target.value as AutoScope)}>
                  <option value="text">the whole response or document</option>
                  <option value="sentence">the sentence with the match</option>
                  <option value="paragraph">the paragraph with the match</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="cw-sources">Search in</label>
                <select id="cw-sources" className="select" value={sources} onChange={(e) => setSources(e.target.value as Sources)}>
                  <option value="all">all sources</option>
                  {hasDocuments ? <option value="document">documents only</option> : null}
                  {hasResponses ? <option value="response">open-ended responses only</option> : null}
                  {hasResponses ? <option value="uncoded">responses you have not coded yet</option> : null}
                </select>
              </div>
            </div>
            <p className="help">
              {withRules.length ? `${plural(withRules.length, 'code')} with rules will be run. ` : 'No code has rules yet. '}New segments are marked as auto-coded and belong to {project.activeCoder}. Passages already coded with the same code are skipped.
            </p>
            {applied !== null ? <div className="callout callout-good">Added {plural(applied, 'segment')}. Review them in Retrieve, or undo below.</div> : null}
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="row">
            <b>{plural(matches.length, 'passage')} found</b>
            {[...byCode.entries()].map(([id, n]) => (
              <span key={id} className="badge"><Swatch color={codeMap.get(id)?.color ?? '#999'} /> {codeMap.get(id)?.name} {n}</span>
            ))}
            <span className="spacer" />
            <button className="btn btn-sm btn-ghost" onClick={() => setMatches(null)}>Back to rules</button>
            <button className="btn btn-sm" onClick={() => setExcluded(excluded.size ? new Set() : new Set(matches.map((_, i) => i)))}>{excluded.size ? 'Select all' : 'Select none'}</button>
          </div>
          {!matches.length ? <div className="cw-empty-small help">No new passages match these rules.</div> : null}
          <div className="cw-matches">
            {matches.slice(0, 1000).map((m, i) => {
              const d = docMap.get(m.docId)!;
              const c = codeMap.get(m.codeId);
              return (
                <label key={i} className={`cw-match ${excluded.has(i) ? 'is-off' : ''}`}>
                  <input type="checkbox" checked={!excluded.has(i)} onChange={() => setExcluded((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })} />
                  <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                    <span className="row" style={{ gap: 6 }}>
                      <Swatch color={c?.color ?? '#999'} />
                      <b>{c?.name}</b>
                      <span className="help">{d.name} · rule: {m.rules.join(', ')}</span>
                    </span>
                    <span className="cw-match-text">{contextWithHits(d.text, m)}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {matches.length > 1000 ? <p className="help">Showing the first 1,000 of {matches.length.toLocaleString()} passages; all selected passages will be coded.</p> : null}
        </div>
      )}
    </Modal>
  );
}

/** The unit text (shortened around the hits) with matched words marked. */
function contextWithHits(text: string, m: RuleMatch) {
  const MAX = 320;
  let s = m.start, e = m.end;
  if (e - s > MAX) {
    const h = m.hits[0];
    s = Math.max(m.start, h.start - 120);
    e = Math.min(m.end, s + MAX);
  }
  const parts: React.ReactNode[] = [];
  let cur = s;
  for (const h of m.hits) {
    if (h.end <= s || h.start >= e) continue;
    const a = Math.max(h.start, cur), b = Math.min(h.end, e);
    if (a > cur) parts.push(text.slice(cur, a));
    if (b > a) parts.push(<mark key={a}>{text.slice(a, b)}</mark>);
    cur = Math.max(cur, b);
  }
  if (cur < e) parts.push(text.slice(cur, e));
  return (
    <>
      {s > m.start ? '… ' : ''}
      {parts}
      {e < m.end ? ' …' : ''}
    </>
  );
}
