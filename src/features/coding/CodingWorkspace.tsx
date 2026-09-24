// The Text coding tab: sources, reading view / responses table / analysis views, and the codebook.

import { useCallback, useEffect, useMemo } from 'react';
import { useStore } from '../../core/store';
import { aiAvailable } from '../../platform/host';
import { canUndo, loadWorkedExample, setActiveCoder, undoCoding } from './actions';
import { canBuildWorkedExample } from '../../lib/coding/example';
import { plural, toast } from './hooks';
import { useCodingUi, openLocalDialog, type CodingView } from './uiStore';
import { SourcesPanel } from './SourcesPanel';
import { CodebookPanel } from './CodebookPanel';
import { Reader } from './Reader';
import { ResponsesView } from './ResponsesView';
import { RetrievalView } from './RetrievalView';
import { AnalyseView } from './AnalyseView';
import { ReliabilityView } from './ReliabilityView';
import { MemosView } from './MemosView';
import { CodingDialog } from './CodingDialog';
import { MenuButton } from './ui';
import './coding.css';

const VIEWS: Array<{ id: CodingView; label: string }> = [
  { id: 'documents', label: 'Documents' },
  { id: 'responses', label: 'Responses' },
  { id: 'retrieve', label: 'Retrieve' },
  { id: 'analyse', label: 'Analyse' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'memos', label: 'Memos' },
];

export function CodingWorkspace() {
  const docs = useStore((s) => s.coding.docs);
  const coders = useStore((s) => s.coding.coders);
  const activeCoder = useStore((s) => s.coding.activeCoder);
  const coding = useStore((s) => s.coding);
  const dataset = useStore((s) => s.dataset);
  const { view, activeDocId, dialog, ai, history, showAllCoders, set } = useCodingUi();

  // Is AI help offered here? (A capability check, not a request to Claude.)
  useEffect(() => {
    if (ai !== 'unknown') return;
    let alive = true;
    void aiAvailable().then((ok) => alive && set({ ai: ok ? 'yes' : 'no' }));
    return () => {
      alive = false;
    };
  }, [ai, set]);

  const nDocuments = useMemo(() => docs.filter((d) => d.kind === 'document').length, [docs]);
  const nResponses = docs.length - nDocuments;
  const activeDoc = docs.find((d) => d.id === activeDocId) ?? null;

  // Pick a sensible first view/document.
  useEffect(() => {
    if (view === 'documents' && !activeDoc) {
      const first = docs.find((d) => d.kind === 'document');
      if (first) set({ activeDocId: first.id });
      else if (nResponses) set({ view: 'responses' });
    }
  }, [view, activeDoc, docs, nResponses, set]);

  const undoable = history.length > 0 && canUndo();
  const undoLabel = undoable ? history[history.length - 1].label : '';
  const doUndo = useCallback(() => {
    const l = undoCoding();
    toast(l ? `Undone: ${l}` : 'Nothing to undo in Text coding.', 'info');
  }, []);

  // Ctrl/Cmd+Z undoes the last coding change while this tab is open (text fields keep their own undo).
  // When Text coding has nothing to undo, the key passes through to the app (dataset undo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'z') return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (!canUndo()) return;
      e.preventDefault();
      e.stopPropagation();
      doUndo();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [doUndo]);

  const closeLocal = useCallback(() => set({ dialog: null }), [set]);
  const empty = docs.length === 0;
  const showSources = view === 'documents' && !empty;
  const showCodebook = (view === 'documents' || view === 'responses' || view === 'retrieve') && !(empty && !coding.codes.length);

  return (
    <div className={`cw ${showSources ? 'has-sources' : ''} ${showCodebook ? 'has-codebook' : ''}`}>
      <div className="cw-toolbar">
        <div className="tabs cw-viewtabs" role="tablist" aria-label="Text coding views">
          {VIEWS.map((v) => (
            <button key={v.id} role="tab" className="tab" aria-selected={view === v.id} onClick={() => set({ view: v.id })}>
              {v.label}
              {v.id === 'responses' && nResponses ? <span className="cw-tabcount">{nResponses.toLocaleString()}</span> : null}
              {v.id === 'documents' && nDocuments ? <span className="cw-tabcount">{nDocuments}</span> : null}
            </button>
          ))}
        </div>
        <div className="row cw-actions">
          <MenuButton
            label={<span>Coder: <b>{activeCoder}</b></span>}
            className="btn-sm"
            title="Who is coding"
            items={[
              ...coders.map((c) => ({ label: c === activeCoder ? `${c} (coding now)` : `Code as ${c}`, disabled: c === activeCoder, onSelect: () => setActiveCoder(c) })),
              { label: showAllCoders ? 'Show only my segments' : 'Show all coders’ segments', separator: true, onSelect: () => set({ showAllCoders: !showAllCoders }) },
              { label: 'Manage coders…', onSelect: () => openLocalDialog('coders') },
            ]}
          />
          <button className="btn btn-sm" disabled={!undoable} onClick={doUndo} title={undoable ? `Undo: ${undoLabel} (Ctrl+Z)` : 'Nothing to undo'}>
            Undo
          </button>
          <MenuButton
            label="Import"
            className="btn-sm"
            items={[
              { label: 'Documents and files…', onSelect: () => openLocalDialog('import', { tab: 'files' }) },
              { label: 'Paste text…', onSelect: () => openLocalDialog('import', { tab: 'paste' }) },
              { label: 'Open-ended answers from the dataset…', disabled: !dataset, onSelect: () => openLocalDialog('import', { tab: 'survey' }) },
              { label: 'Sample interviews…', onSelect: () => openLocalDialog('import', { tab: 'samples' }) },
            ]}
          />
          <button className="btn btn-sm" onClick={() => openLocalDialog('auto-code')} disabled={!coding.codes.length}>
            Auto-code
          </button>
          {ai === 'yes' ? (
            <MenuButton
              label="AI suggestions"
              className="btn-sm"
              items={[
                { label: 'Suggest a codebook…', disabled: empty, onSelect: () => openLocalDialog('ai-codebook') },
                { label: 'Suggest codes for responses…', disabled: !nResponses || !coding.codes.length, onSelect: () => openLocalDialog('ai-suggest') },
                { label: 'Summarise a code…', disabled: !coding.segments.length, onSelect: () => set({ view: 'retrieve' }) },
              ]}
            />
          ) : null}
          <MenuButton
            label="Export"
            className="btn-sm"
            items={[
              { label: 'Codes to dataset variables…', disabled: !nResponses || !dataset, onSelect: () => openLocalDialog('export-dataset') },
              { label: 'Coded segments (Excel, CSV)…', separator: true, disabled: !coding.segments.length, onSelect: () => openLocalDialog('export', { tab: 'segments' }) },
              { label: 'Qualitative report (Word, HTML)…', disabled: !coding.codes.length, onSelect: () => openLocalDialog('export', { tab: 'report' }) },
              { label: 'Codebook…', onSelect: () => openLocalDialog('export', { tab: 'codebook' }) },
            ]}
          />
        </div>
      </div>
      {ai === 'no' && (view === 'responses' || view === 'retrieve') && !empty ? (
        <div className="cw-ainote">AI suggestions are available when Socius runs as a Claude artifact.</div>
      ) : null}

      <div className="cw-main">
        {showSources ? <SourcesPanel /> : null}
        <main className="cw-center" aria-label="Coding area">
          {empty && (view === 'documents' || view === 'responses') ? (
            <Welcome hasDataset={!!dataset} offerExample={!coding.codes.length && canBuildWorkedExample(dataset)} />
          ) : view === 'documents' ? (
            activeDoc ? (
              <Reader key={activeDoc.id} doc={activeDoc} />
            ) : (
              <div className="cw-center-empty empty">
                <h3>{nDocuments ? 'Choose a document' : 'No documents yet'}</h3>
                <p>{nDocuments ? 'Pick a source on the left to read and code it.' : 'Import interview transcripts or field notes, or code your open-ended responses in the Responses view.'}</p>
              </div>
            )
          ) : view === 'responses' ? (
            <ResponsesView />
          ) : view === 'retrieve' ? (
            <RetrievalView />
          ) : view === 'analyse' ? (
            <AnalyseView />
          ) : view === 'reliability' ? (
            <ReliabilityView />
          ) : (
            <MemosView />
          )}
        </main>
        {showCodebook ? <CodebookPanel quickKeys={view === 'responses'} /> : null}
      </div>

      {dialog ? <CodingDialog id={dialog.id} params={dialog.params} onClose={closeLocal} /> : null}
    </div>
  );
}

function exploreExample() {
  const ex = loadWorkedExample();
  if (!ex) {
    toast('The worked example needs the sample survey with its open-ended question q_challenge.', 'warning');
    return;
  }
  const pct = Math.round((100 * ex.nCoded) / ex.docs.length);
  const nCodes = ex.codes.filter((c) => c.parentId).length;
  toast(
    `Example loaded: ${plural(ex.docs.length, 'answer')} to q_challenge and ${plural(nCodes, 'starter code')}. ` +
      `Keyword rules coded ${ex.nCoded.toLocaleString()} answers (${pct}%), so review them. ` +
      'Then try Analyse > Codes by attribute, or Export > Codes to dataset variables and run a Crosstab by gender. Undo removes the example.',
    'success',
  );
}

function Welcome({ hasDataset, offerExample }: { hasDataset: boolean; offerExample: boolean }) {
  return (
    <div className="cw-welcome">
      <div className="eyebrow">Text coding</div>
      <h2>Code interviews and open-ended answers</h2>
      <p>
        Build a codebook of themes, highlight passages in transcripts, code survey responses row by row, then compare themes across groups or turn them into variables for your statistics.
      </p>
      <div className="cw-welcome-grid">
        {offerExample ? (
          <button className="cw-welcome-card is-featured" onClick={exploreExample}>
            <span className="cw-welcome-tag">Example</span>
            <b>Explore a worked example</b>
            <span>Load the sample survey’s answers about neighbourhood problems with a starter codebook, already coded by keyword rules for you to review.</span>
          </button>
        ) : null}
        <button className="cw-welcome-card" onClick={() => openLocalDialog('import', { tab: 'files' })}>
          <b>Import documents</b>
          <span>Word (.docx) or text transcripts, field notes, or a CSV/Excel file of responses.</span>
        </button>
        <button className="cw-welcome-card" onClick={() => openLocalDialog('import', { tab: 'survey' })} disabled={!hasDataset}>
          <b>Open-ended answers</b>
          <span>{hasDataset ? 'One response per respondent from a string variable in your dataset, with their characteristics.' : 'Open a dataset first, then bring in the answers to an open question.'}</span>
        </button>
        <button className="cw-welcome-card" onClick={() => openLocalDialog('import', { tab: 'samples' })}>
          <b>Sample interviews</b>
          <span>Practice on bundled fictional transcripts.</span>
        </button>
        <button className="cw-welcome-card" onClick={() => openLocalDialog('import', { tab: 'paste' })}>
          <b>Paste text</b>
          <span>Paste a transcript, or a list with one response per line.</span>
        </button>
      </div>
      <p className="help">Everything stays in your browser. Save the project from the File menu to keep your coding.</p>
    </div>
  );
}

