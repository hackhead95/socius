// The Text coding tab: sources, reading view / responses table / analysis views, and the codebook.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../../core/store';
import { useAiStatus, openAiSettings } from '../ai/hooks';
import { SET_UP_AI } from '../ai/AiBits';
import { aiFeature } from '../ai/features';
import { canUndo, loadWorkedExample, setActiveCoder, undoCoding } from './actions';
import { canBuildWorkedExample, describeCodebookSize } from '../../lib/coding/example';
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
import { MenuButton, useScrollEdges } from './ui';
import { codingMenuLabel } from './menu';
import { UNDO_CODING_LABEL } from './exampleGuide';
import { modKey } from '../../app/shortcuts';
import './coding.css';

export const CODING_VIEWS: Array<{ id: CodingView; label: string }> = [
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
  const { view, viewPicked, activeDocId, dialog, history, showAllCoders, set } = useCodingUi();
  // Is AI help set up? (A settings check, not a request to any AI service.)
  const ai = useAiStatus();

  const nDocuments = useMemo(() => docs.filter((d) => d.kind === 'document').length, [docs]);
  const nResponses = docs.length - nDocuments;
  const activeDoc = docs.find((d) => d.id === activeDocId) ?? null;

  // Pick a sensible first view/document. An empty Documents view gives way to Responses only while
  // it is the default; once the researcher clicks the Documents tab it stays open, with its empty
  // state and import buttons (UI-002: the tab used to snap back to Responses with no message).
  useEffect(() => {
    if (view === 'documents' && !activeDoc) {
      const first = docs.find((d) => d.kind === 'document');
      if (first) set({ activeDocId: first.id });
      else if (nResponses && !viewPicked) set({ view: 'responses' });
    }
  }, [view, viewPicked, activeDoc, docs, nResponses, set]);

  // Phone widths: the view tabs scroll sideways. Fade the side with more tabs and keep the current
  // tab in view (UI-023).
  const tabs = useScrollEdges<HTMLDivElement>();
  const tabsEl = tabs.ref;
  const lastView = useRef(view);
  useEffect(() => {
    if (lastView.current === view) return;
    lastView.current = view;
    const el = tabsEl.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [view, tabsEl]);

  const undoable = history.length > 0 && canUndo();
  const undoLabel = undoable ? history[history.length - 1].label : '';
  const doUndo = useCallback(() => {
    const l = undoCoding();
    toast(l ? `Undone: ${l}` : 'Nothing to undo in Text coding.', 'info');
  }, []);
  // Ctrl/Cmd+Z and Edit > Undo follow the tab: here they undo coding changes (src/app/undo.ts).

  const closeLocal = useCallback(() => set({ dialog: null }), [set]);
  const empty = docs.length === 0;
  const showSources = view === 'documents' && !empty;
  const showCodebook = (view === 'documents' || view === 'responses' || view === 'retrieve') && !(empty && !coding.codes.length);

  return (
    <div className={`cw ${showSources ? 'has-sources' : ''} ${showCodebook ? 'has-codebook' : ''}`}>
      <div className="cw-toolbar">
        <div className={`cw-viewtabs-wrap ${tabs.left ? 'more-left' : ''} ${tabs.right ? 'more-right' : ''}`}>
          <div ref={tabs.ref} className="tabs cw-viewtabs" role="tablist" aria-label="Text coding views">
            {CODING_VIEWS.map((v) => {
              const needsCoders = v.id === 'reliability' && coders.length < 2;
              return (
                <button
                  key={v.id}
                  role="tab"
                  className="tab"
                  aria-selected={view === v.id}
                  title={needsCoders ? 'Intercoder reliability compares two coders. Add a second coder with Coder > Coders... first.' : undefined}
                  onClick={() => set({ view: v.id, viewPicked: true })}
                >
                  {v.label}
                  {v.id === 'responses' && nResponses ? <span className="cw-tabcount">{nResponses.toLocaleString()}</span> : null}
                  {v.id === 'documents' && nDocuments ? <span className="cw-tabcount">{nDocuments}</span> : null}
                  {needsCoders ? <span className="cw-tabcount cw-tabneeds">needs 2 coders</span> : null}
                </button>
              );
            })}
          </div>
        </div>
        {/* Toolbar buttons are contextual shortcuts: where they mirror a menu command (Text coding or
            AI menu), they use the menu's wording (docs/NAVIGATION.md). */}
        <div className="row cw-actions">
          <MenuButton
            label={<span>Coder: <b>{activeCoder}</b></span>}
            className="btn-sm"
            title="Who is coding"
            items={[
              ...coders.map((c) => ({
                label: c === activeCoder ? `${c} (coding now)` : `Code as ${c}`,
                disabled: c === activeCoder,
                disabledReason: `You are already coding as ${c}. Choose another coder to switch, or add one with Coders...`,
                onSelect: () => setActiveCoder(c),
              })),
              { label: showAllCoders ? 'Show only my segments' : 'Show all coders’ segments', separator: true, onSelect: () => set({ showAllCoders: !showAllCoders }) },
              { label: 'Coders...', onSelect: () => openLocalDialog('coders') },
            ]}
          />
          <button className="btn btn-sm" disabled={!undoable} onClick={doUndo} title={undoable ? `Undo: ${undoLabel} (${modKey()}+Z, or Edit > Undo)` : 'Nothing to undo in Text coding'}>
            {UNDO_CODING_LABEL}
          </button>
          <MenuButton
            label="Import"
            className="btn-sm"
            items={[
              { label: codingMenuLabel('import'), onSelect: () => openLocalDialog('import', { tab: 'files' }) },
              { label: 'Paste text...', onSelect: () => openLocalDialog('import', { tab: 'paste' }) },
              { label: codingMenuLabel('import-survey'), disabled: !dataset, disabledReason: 'Open a dataset with an open-ended (text) question first.', onSelect: () => openLocalDialog('import', { tab: 'survey' }) },
              { label: codingMenuLabel('load-samples'), onSelect: () => openLocalDialog('load-samples') },
            ]}
          />
          <button className="btn btn-sm" onClick={() => openLocalDialog('auto-code')} disabled={!coding.codes.length} title={coding.codes.length ? 'Auto-code with keyword rules' : 'Auto-code with keyword rules: create a code first'}>
            Auto-code
          </button>
          <div className="cw-ai-group" role="group" aria-label="AI help">
          <MenuButton
            label={<><span className="ai-badge" aria-hidden="true">AI</span> AI suggestions</>}
            className="btn-sm"
            disabled={ai.ready === 'no'}
            title={ai.ready === 'no' ? `AI help is not set up yet. Click ${SET_UP_AI} next to this button.` : 'The coding features of the AI menu: suggest a codebook, suggest codes, summarise a code'}
            items={[
              { label: aiFeature('codebook').menuLabel, disabled: empty, disabledReason: 'Import documents or open-ended answers first.', onSelect: () => openLocalDialog('ai-codebook') },
              {
                label: aiFeature('suggest').menuLabel,
                disabled: !nResponses || !coding.codes.length,
                disabledReason: !nResponses ? 'Import open-ended answers first.' : 'Create at least one code first.',
                onSelect: () => openLocalDialog('ai-suggest'),
              },
              { label: aiFeature('summarise').menuLabel, disabled: !coding.segments.length, disabledReason: 'Code some passages first.', onSelect: () => set({ view: 'retrieve' }) },
            ]}
          />
          {ai.ready === 'no' ? (
            <button type="button" className="btn btn-sm btn-ghost cw-ai-setup" title="Optional: AI can draft a codebook and suggest codes for you to review." onClick={() => openAiSettings()}>{SET_UP_AI}</button>
          ) : null}
          </div>
          <MenuButton
            label="Export"
            className="btn-sm"
            items={[
              {
                label: codingMenuLabel('export-dataset'),
                disabled: !nResponses || !dataset,
                disabledReason: !dataset ? 'Open the dataset the answers came from first.' : 'Needs open-ended answers imported from the dataset.',
                onSelect: () => openLocalDialog('export-dataset'),
              },
              { label: codingMenuLabel('export'), hint: 'Excel, CSV', separator: true, disabled: !coding.segments.length, disabledReason: 'Code some passages first.', onSelect: () => openLocalDialog('export', { tab: 'segments' }) },
              { label: codingMenuLabel('export-report'), hint: 'Word, HTML', disabled: !coding.codes.length, disabledReason: 'Create at least one code first.', onSelect: () => openLocalDialog('export', { tab: 'report' }) },
              { label: codingMenuLabel('export-codebook'), hint: 'Word, CSV, JSON', onSelect: () => openLocalDialog('export', { tab: 'codebook' }) },
            ]}
          />
        </div>
      </div>
      {/* No separate "Optional: AI can..." banner: with the greyed AI suggestions button and the Set up AI
          link beside it, that made three AI prompts in one row (QA exploratory finding). The link's
          tooltip carries the sentence. */}
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
                <p>{nDocuments ? 'Pick a source on the left to read and code it.' : `Documents are interview transcripts and field notes. This project has ${nResponses ? 'only open-ended responses so far, which you code in the Responses view' : 'none yet'}.`}</p>
                {!nDocuments ? (
                  <div className="row" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => openLocalDialog('import', { tab: 'files' })}>{codingMenuLabel('import')}</button>
                    <button className="btn btn-sm" onClick={() => openLocalDialog('load-samples')}>{codingMenuLabel('load-samples')}</button>
                    {nResponses ? <button className="btn btn-sm" onClick={() => set({ view: 'responses', viewPicked: true })}>Go to Responses</button> : null}
                  </div>
                ) : null}
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
  // Short on purpose (UI-018): what to do next is in the note above the answers, which stays until
  // it is hidden, and in the memo "About this worked example". The code count is the codebook's.
  toast(`Example loaded: ${plural(ex.docs.length, 'answer')} and ${describeCodebookSize(ex.codes)}. The note above the answers says what to do next.`, 'success');
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
        <button className="cw-welcome-card" onClick={() => openLocalDialog('load-samples')}>
          <b>Load sample interviews</b>
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

