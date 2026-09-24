// Analysis of the coding: frequencies, co-occurrence, codes by attribute, word frequencies, KWIC.

import { useDeferredValue, useMemo, useState } from 'react';
import { useStore } from '../../core/store';
import type { TextDoc } from '../../core/coding-types';
import { attributeKeys, codeByAttribute, codeFrequencies, cooccurrence, type CooccurrenceMode } from '../../lib/coding/analysis';
import { bigramFrequencies, kwic, wordFrequencies } from '../../lib/coding/text';
import { codeByAttributeOutput, cooccurrenceOutput, frequenciesOutput, kwicOutput, wordFrequencyOutput } from '../../lib/coding/outputs';
import { descendantIds } from '../../lib/coding/tree';
import { useOrderedCodes, useVisibleSegments, plural, saveCsv } from './hooks';
import { useCodingUi, jumpTo, type AnalyseTab } from './uiStore';
import { Bar, Swatch } from './ui';

const TABS: Array<{ id: AnalyseTab; label: string }> = [
  { id: 'frequencies', label: 'Code frequencies' },
  { id: 'cooccurrence', label: 'Co-occurrence' },
  { id: 'attribute', label: 'Codes by attribute' },
  { id: 'words', label: 'Word frequencies' },
  { id: 'kwic', label: 'Keyword in context' },
];

export function AnalyseView() {
  const tab = useCodingUi((s) => s.analyseTab);
  const set = useCodingUi((s) => s.set);
  const allDocs = useStore((s) => s.coding.docs);
  const dataset = useStore((s) => s.dataset);
  const hasBoth = allDocs.some((d) => d.kind === 'document') && allDocs.some((d) => d.kind === 'response');
  // Open-ended questions the responses come from (one entry per string variable or imported file).
  const questions = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of allDocs) if (d.kind === 'response') m.set(d.varId ?? '', (m.get(d.varId ?? '') ?? 0) + 1);
    return [...m.entries()].map(([varId, n]) => ({ varId, n, label: dataset?.variables.find((v) => v.id === varId)?.name ?? (varId ? 'an earlier import' : 'imported file') }));
  }, [allDocs, dataset]);
  const stored = useCodingUi((s) => s.analyseSources);
  const valid = stored === 'all' || stored === 'document' || stored === 'response' || (stored.startsWith('q:') && questions.length > 1 && questions.some((q) => `q:${q.varId}` === stored));
  const kind = valid ? stored : 'all';
  const docs = useMemo(
    () => (kind === 'all' ? allDocs : kind.startsWith('q:') ? allDocs.filter((d) => d.kind === 'response' && (d.varId ?? '') === kind.slice(2)) : allDocs.filter((d) => d.kind === kind)),
    [allDocs, kind],
  );
  const onlyResponses = kind === 'response' || kind.startsWith('q:') || (!hasBoth && allDocs[0]?.kind === 'response');
  const unitLabel = onlyResponses ? 'responses' : kind === 'document' || !hasBoth ? 'documents' : 'sources';
  // Answers to several questions pooled: a respondent counts once per question answered.
  const pooledQuestions = questions.length > 1 && (kind === 'all' || kind === 'response');

  return (
    <div className="cw-analyse">
      <div className="tabs" role="tablist" aria-label="Analysis">
        {TABS.map((t) => (
          <button key={t.id} role="tab" className="tab" aria-selected={tab === t.id} onClick={() => set({ analyseTab: t.id })}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="cw-view">
      {hasBoth || questions.length > 1 ? (
        <div className="cw-view-tools">
          <label className="label" htmlFor="cw-kind">Sources</label>
          <select id="cw-kind" className="select input-sm" value={kind} onChange={(e) => set({ analyseSources: e.target.value })}>
            <option value="all">{hasBoth ? 'Documents and responses' : 'All responses'}</option>
            {hasBoth ? <option value="document">Documents only</option> : null}
            {hasBoth ? <option value="response">Open-ended responses only</option> : null}
            {questions.length > 1 ? questions.map((q) => <option key={q.varId} value={`q:${q.varId}`}>Responses to {q.label} ({q.n.toLocaleString()})</option>) : null}
          </select>
        </div>
      ) : null}
      {pooledQuestions && (tab === 'frequencies' || tab === 'attribute' || tab === 'cooccurrence') ? (
        <div className="callout callout-warn">
          Answers to {questions.length} questions are counted together, so a respondent who answered more than one counts once per answer and percentages mix the questions. Choose one question under Sources.
        </div>
      ) : null}
      {!allDocs.length ? (
        <div className="cw-center-empty empty">
          <h3>Nothing to analyse yet</h3>
          <p>Import documents or open-ended responses and code them first.</p>
        </div>
      ) : tab === 'frequencies' ? (
        <Frequencies docs={docs} unitLabel={unitLabel} />
      ) : tab === 'cooccurrence' ? (
        <Cooccurrence docs={docs} unitLabel={unitLabel} />
      ) : tab === 'attribute' ? (
        <ByAttribute docs={docs} unitLabel={unitLabel} />
      ) : tab === 'words' ? (
        <Words docs={docs} unitLabel={unitLabel} />
      ) : (
        <Kwic docs={docs} />
      )}
      </div>
    </div>
  );
}

function SendButton({ make, disabled }: { make: () => import('../../core/output').OutputItem; disabled?: boolean }) {
  const addOutput = useStore((s) => s.addOutput);
  const dsName = useStore((s) => s.dataset?.name);
  return (
    <button className="btn btn-sm btn-primary" disabled={disabled} onClick={() => addOutput({ ...make(), datasetName: dsName })}>
      Send to Output
    </button>
  );
}

function Frequencies({ docs, unitLabel }: { docs: TextDoc[]; unitLabel: string }) {
  const codes = useStore((s) => s.coding.codes);
  const nodes = useOrderedCodes();
  const segs = useVisibleSegments();
  const f = useMemo(() => codeFrequencies(nodes.map((n) => n.code), docs, segs), [nodes, docs, segs]);
  const depth = useMemo(() => new Map(nodes.map((n) => [n.code.id, n.depth])), [nodes]);
  const hasSub = codes.some((c) => c.parentId);
  if (!codes.length) return <div className="cw-empty-small help">No codes yet.</div>;
  const scope = `${plural(f.nDocs, unitLabel.replace(/s$/, ''), unitLabel)}`;
  return (
    <div className="stack">
      <div className="row">
        <p className="help">
          {f.nCodedDocs.toLocaleString()} of {scope} have at least one code.
        </p>
        <span className="spacer" />
        <button
          className="btn btn-sm"
          onClick={() =>
            void saveCsv(
              'code frequencies.csv',
              ['Code', 'Segments', unitLabel, `% of ${unitLabel}`, `${unitLabel} incl. sub-codes`, '% incl. sub-codes'],
              f.rows.map((r) => [codes.find((c) => c.id === r.codeId)?.name ?? '', r.segments, r.docs, Number(r.pctDocs.toFixed(2)), r.docsInclSub, Number(r.pctDocsInclSub.toFixed(2))]),
            )
          }
        >
          Export CSV
        </button>
        <SendButton make={() => frequenciesOutput(nodes.map((n) => n.code), f.rows, f.nDocs, f.nCodedDocs, { unitLabel, depthOf: (id) => depth.get(id) ?? 0, scopeNote: scope })} />
      </div>
      <div className="scroll-x">
        <table className="table cw-ftable">
          <thead>
            <tr>
              <th>Code</th>
              <th className="num">Segments</th>
              <th className="num">{cap(unitLabel)}</th>
              <th className="num">% of {unitLabel}</th>
              <th className="cw-barcol" aria-hidden />
              {hasSub ? <th className="num">Incl. sub-codes</th> : null}
            </tr>
          </thead>
          <tbody>
            {f.rows.map((r) => {
              const c = nodes.find((n) => n.code.id === r.codeId)!;
              return (
                <tr key={r.codeId}>
                  <td style={{ paddingLeft: 10 + c.depth * 16 }}>
                    <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      <Swatch color={c.code.color} />
                      {c.code.name}
                    </span>
                  </td>
                  <td className="num">{r.segments}</td>
                  <td className="num">{r.docs}</td>
                  <td className="num">{r.pctDocs.toFixed(1)}%</td>
                  <td className="cw-barcol">
                    <Bar pct={r.pctDocs} color={c.code.color} />
                  </td>
                  {hasSub ? <td className="num">{r.docsInclSub !== r.docs ? `${r.docsInclSub} (${r.pctDocsInclSub.toFixed(1)}%)` : ''}</td> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cooccurrence({ docs, unitLabel }: { docs: TextDoc[]; unitLabel: string }) {
  const nodes = useOrderedCodes();
  const segs = useVisibleSegments();
  const [mode, setMode] = useState<CooccurrenceMode>('document');
  const [level, setLevel] = useState<'used' | 'top'>('used');
  const allCodes = useStore((s) => s.coding.codes);
  const used = useMemo(() => new Set(segs.map((s) => s.codeId)), [segs]);
  // Top-level themes include their sub-codes (a theme is "used" when any of its sub-codes is).
  const members = useMemo(() => (level === 'top' ? Object.fromEntries(nodes.filter((n) => n.depth === 0).map((n) => [n.code.id, [n.code.id, ...descendantIds(allCodes, n.code.id)]])) : undefined), [level, nodes, allCodes]);
  const codes = useMemo(
    () => nodes.filter((n) => (level === 'used' ? used.has(n.code.id) : n.depth === 0 && members![n.code.id].some((id) => used.has(id)))).map((n) => n.code).slice(0, 40),
    [nodes, used, level, members],
  );
  const m = useMemo(() => cooccurrence(codes.map((c) => c.id), docs, segs, mode, members), [codes, docs, segs, mode, members]);
  const max = Math.max(1, ...m.flatMap((r, i) => r.filter((_, j) => j !== i)));
  if (codes.length < 2) return <div className="cw-empty-small help">Code at least two different codes to see how they occur together.</div>;
  return (
    <div className="stack">
      <div className="row">
        <select className="select input-sm" value={mode} onChange={(e) => setMode(e.target.value as CooccurrenceMode)} aria-label="Co-occurrence measure">
          <option value="document">Same {unitLabel.replace(/s$/, '')}</option>
          <option value="overlap">Overlapping segments</option>
        </select>
        <select className="select input-sm" value={level} onChange={(e) => setLevel(e.target.value as any)} aria-label="Codes to include">
          <option value="used">All codes in use</option>
          <option value="top">Themes (sub-codes counted in their theme)</option>
        </select>
        <span className="spacer" />
        <SendButton make={() => cooccurrenceOutput(codes, m, mode, `${docs.length} ${unitLabel}${level === 'top' ? '; sub-codes counted in their theme' : ''}`)} />
      </div>
      <p className="help">
        {mode === 'document'
          ? `Each cell counts the ${unitLabel} coded with both codes. The diagonal shows how many are coded with each code.`
          : 'Each cell counts pairs of segments with these two codes that overlap in the text. The diagonal shows the number of segments.'}
      </p>
      <div className="scroll-x">
        <table className="cw-heat">
          <thead>
            <tr>
              <th />
              {codes.map((c) => (
                <th key={c.id} className="cw-heat-col" title={c.name}>
                  <span>{c.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.map((r, i) => (
              <tr key={r.id}>
                <th className="cw-heat-row">
                  <Swatch color={r.color} /> {r.name}
                </th>
                {m[i].map((v, j) => (
                  <td
                    key={j}
                    className={i === j ? 'cw-heat-diag num' : 'num'}
                    style={i === j ? undefined : { background: v ? `color-mix(in srgb, var(--accent) ${Math.round(10 + 70 * (v / max))}%, var(--surface))` : undefined, color: v / max > 0.55 ? 'var(--accent-text)' : undefined }}
                    title={`${r.name} and ${codes[j].name}: ${v}`}
                  >
                    {v || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ByAttribute({ docs, unitLabel }: { docs: TextDoc[]; unitLabel: string }) {
  const nodes = useOrderedCodes();
  const segs = useVisibleSegments();
  const keys = useMemo(() => attributeKeys(docs), [docs]);
  const [key, setKey] = useState('');
  const k = keys.includes(key) ? key : keys[0] ?? '';
  const allCodes = useStore((s) => s.coding.codes);
  const dataset = useStore((s) => s.dataset);
  const used = useMemo(() => new Set(segs.map((s) => s.codeId)), [segs]);
  // Themes (codes with sub-codes) count a source when the theme or any of its sub-codes is applied.
  const members = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const n of nodes) {
      const d = descendantIds(allCodes, n.code.id);
      if (d.length) m[n.code.id] = [n.code.id, ...d];
    }
    return m;
  }, [nodes, allCodes]);
  const codes = useMemo(() => nodes.filter((n) => (members[n.code.id] ?? [n.code.id]).some((id) => used.has(id))).map((n) => n.code), [nodes, used, members]);
  const depth = useMemo(() => new Map(nodes.map((n) => [n.code.id, n.depth])), [nodes]);
  // Groups in the order of the dataset's value labels (Man, Woman, Other...) when the attribute came from it.
  const valueOrder = useMemo(() => {
    const v = dataset?.variables.find((x) => x.name === k);
    return v?.valueLabels.length ? [...v.valueLabels].sort((a, b) => Number(a.value) - Number(b.value) || String(a.value).localeCompare(String(b.value))).map((l) => l.label) : undefined;
  }, [dataset, k]);
  const r = useMemo(() => (k ? codeByAttribute(codes.map((c) => c.id), docs, segs, k, valueOrder, members) : null), [codes, docs, segs, k, valueOrder, members]);
  if (!keys.length) return <div className="cw-empty-small help">None of these sources have attributes. Import responses with attributes (gender, city...) or add attributes to documents.</div>;
  if (!codes.length || !r) return <div className="cw-empty-small help">Code some text first.</div>;
  return (
    <div className="stack">
      <div className="row">
        <label className="label" htmlFor="cw-attr">Attribute</label>
        <select id="cw-attr" className="select input-sm" value={k} onChange={(e) => setKey(e.target.value)}>
          {keys.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <span className="spacer" />
        <SendButton make={() => codeByAttributeOutput(codes.map((c) => (members[c.id] ? { ...c, name: `${c.name} (with sub-codes)` } : c)), k, r, unitLabel)} />
      </div>
      {r.values.length > 20 ? <div className="callout callout-warn">This attribute has {r.values.length} different values. Tables are easier to read with a grouping attribute (gender, region, age group).</div> : null}
      <div className="scroll-x">
        <table className="table cw-ftable">
          <thead>
            <tr>
              <th rowSpan={2}>Code</th>
              {r.values.map((v, j) => (
                <th key={v} colSpan={2} className="num" style={{ textAlign: 'center' }}>
                  {v} <span className="faint">(n = {r.bases[j]})</span>
                </th>
              ))}
            </tr>
            <tr>
              {r.values.flatMap((v) => [
                <th key={`${v}c`} className="num">Count</th>,
                <th key={`${v}p`} className="num">Col %</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {codes.map((c, i) => (
              <tr key={c.id}>
                <td style={{ paddingLeft: 10 + (depth.get(c.id) ?? 0) * 16 }}>
                  <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    <Swatch color={c.color} />
                    {c.name}
                    {members[c.id] ? <span className="faint" title="Counts sources coded with this theme or any of its sub-codes">with sub-codes</span> : null}
                  </span>
                </td>
                {r.values.flatMap((v, j) => [
                  <td key={`${v}c`} className="num">{r.counts[i][j]}</td>,
                  <td key={`${v}p`} className="num">{r.colPct[i][j].toFixed(1)}%</td>,
                ])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="help">
        Column % = share of the {unitLabel} in that group coded with the code.{r.nMissing ? ` ${r.nMissing} ${unitLabel} without a value for ${k} are left out.` : ''} To test differences, use Export codes to dataset and run Crosstabs.
      </p>
    </div>
  );
}

function Words({ docs, unitLabel }: { docs: TextDoc[]; unitLabel: string }) {
  const project = useStore((s) => s.coding);
  const nodes = useOrderedCodes();
  const segs = useVisibleSegments();
  const set = useCodingUi((s) => s.set);
  const [stop, setStop] = useState(true);
  const [minLen, setMinLen] = useState(3);
  const [bigrams, setBigrams] = useState(false);
  const [source, setSource] = useState('');
  const [extra, setExtra] = useState('');
  const [top, setTop] = useState(50);

  const texts = useMemo(() => {
    if (!source) return docs.map((d) => d.text);
    const ids = new Set([source, ...descendantIds(project.codes, source)]);
    const byId = new Map(docs.map((d) => [d.id, d]));
    return segs.filter((s) => ids.has(s.codeId) && byId.has(s.docId)).map((s) => byId.get(s.docId)!.text.slice(s.start, s.end));
  }, [docs, source, segs, project.codes]);
  const deferredExtra = useDeferredValue(extra);
  const opts = { removeStopwords: stop, minLength: minLen, extraStopwords: deferredExtra.split(/[\s,]+/).filter(Boolean) };
  const words = useMemo(() => wordFrequencies(texts, opts), [texts, stop, minLen, deferredExtra]);
  const pairs = useMemo(() => (bigrams ? bigramFrequencies(texts, opts) : null), [texts, stop, minLen, deferredExtra, bigrams]);
  const maxCount = words[0]?.count ?? 1;
  const scopeNote = source ? `Text coded with ${project.codes.find((c) => c.id === source)?.name ?? ''}` : `${docs.length.toLocaleString()} ${unitLabel}`;
  return (
    <div className="stack">
      <div className="cw-view-tools">
        <select className="select input-sm" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Text to count">
          <option value="">All text</option>
          {nodes.map((n) => <option key={n.code.id} value={n.code.id}>Coded with: {n.code.name}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} /> Leave out common English words</label>
        <label className="check">
          Min. length
          <input className="input input-sm" type="number" min={1} max={20} value={minLen} onChange={(e) => setMinLen(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} style={{ width: 56 }} />
        </label>
        <label className="check"><input type="checkbox" checked={bigrams} onChange={(e) => setBigrams(e.target.checked)} /> Word pairs</label>
        <input className="input input-sm" placeholder="Also leave out (comma separated)" value={extra} onChange={(e) => setExtra(e.target.value)} aria-label="Extra words to leave out" style={{ minWidth: 200 }} />
        <span className="spacer" />
        <SendButton make={() => wordFrequencyOutput(words, pairs, texts.length, scopeNote, top)} />
      </div>
      <p className="help">
        {plural(texts.length, 'text')} · {plural(words.length, 'distinct word')}. Click a word to see it in context. Words in any script are counted (Bengali, Hindi and others); the stopword list is English only.
      </p>
      <div className={`cw-words ${pairs ? 'has-pairs' : ''}`}>
        <WordTable title="Words" list={words.slice(0, top)} max={maxCount} nTexts={texts.length} onPick={(w) => set({ kwicQuery: w, analyseTab: 'kwic' })} />
        {pairs ? <WordTable title="Word pairs" list={pairs.slice(0, top)} max={pairs[0]?.count ?? 1} nTexts={texts.length} onPick={(w) => set({ kwicQuery: w, analyseTab: 'kwic' })} /> : null}
      </div>
      {words.length > top ? <button className="btn btn-sm" onClick={() => setTop((t) => t + 50)}>Show more</button> : null}
    </div>
  );
}

function WordTable(props: { title: string; list: Array<{ term: string; count: number; docs: number }>; max: number; nTexts: number; onPick: (w: string) => void }) {
  return (
    <table className="table cw-ftable">
      <thead>
        <tr>
          <th>{props.title}</th>
          <th className="num">Count</th>
          <th className="num">Texts</th>
          <th className="cw-barcol" aria-hidden />
        </tr>
      </thead>
      <tbody>
        {props.list.map((w) => (
          <tr key={w.term}>
            <td>
              <button className="cw-linkbtn" onClick={() => props.onPick(w.term)}>{w.term}</button>
            </td>
            <td className="num">{w.count}</td>
            <td className="num">{w.docs}</td>
            <td className="cw-barcol"><Bar pct={(100 * w.count) / props.max} /></td>
          </tr>
        ))}
        {!props.list.length ? <tr><td colSpan={4} className="help">No words to show.</td></tr> : null}
      </tbody>
    </table>
  );
}

function Kwic({ docs }: { docs: TextDoc[] }) {
  const query = useCodingUi((s) => s.kwicQuery);
  const set = useCodingUi((s) => s.set);
  const [ctx, setCtx] = useState(60);
  const deferred = useDeferredValue(query);
  const lines = useMemo(() => kwic(docs.map((d) => d.text), deferred, { window: ctx }), [docs, deferred, ctx]);
  const withSource = useMemo(() => lines.map((l) => ({ ...l, source: docs[l.docIndex].name })), [lines, docs]);
  const nDocs = useMemo(() => new Set(lines.map((l) => l.docIndex)).size, [lines]);
  return (
    <div className="stack">
      <div className="cw-view-tools">
        <input
          className="input"
          autoFocus
          placeholder="Word or phrase, * as wildcard (e.g. migra*)"
          value={query}
          onChange={(e) => set({ kwicQuery: e.target.value })}
          aria-label="Search term"
          style={{ minWidth: 260, flex: 1 }}
        />
        <label className="check">
          Context
          <select className="select input-sm" value={ctx} onChange={(e) => setCtx(Number(e.target.value))}>
            <option value={40}>short</option>
            <option value={60}>medium</option>
            <option value={120}>long</option>
          </select>
        </label>
        <button className="btn btn-sm" disabled={!lines.length} onClick={() => void saveCsv(`kwic ${query.trim()}.csv`, ['Source', 'Left context', 'Keyword', 'Right context'], withSource.map((l) => [l.source, l.left, l.match, l.right]))}>Export CSV</button>
        <SendButton disabled={!lines.length} make={() => kwicOutput(query.trim(), withSource)} />
      </div>
      {query.trim() ? <p className="help">{plural(lines.length, 'match', 'matches')} in {plural(nDocs, 'source')}. Click a line to open it in context.</p> : <p className="help">Type a word to see every place it is used, with the words around it.</p>}
      <div className="cw-kwic" role="list">
        {withSource.slice(0, 500).map((l, i) => (
          <button key={i} className="cw-kwic-line" role="listitem" onClick={() => jumpTo(docs[l.docIndex].id, l.start, l.end)}>
            <span className="cw-kwic-src">{l.source}</span>
            <span className="cw-kwic-left">{l.left}</span>
            <mark className="cw-kwic-hit">{l.match}</mark>
            <span className="cw-kwic-right">{l.right}</span>
          </button>
        ))}
      </div>
      {lines.length > 500 ? <p className="help">Showing the first 500 matches. Export CSV to get all of them.</p> : null}
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
