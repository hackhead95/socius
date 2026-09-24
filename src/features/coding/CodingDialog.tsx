// Dialog router for the "Text coding" menu (and the coding AI features started from the AI menu) (rendered by the app shell's DialogHost for store dialogs
// of kind 'coding') and for dialogs opened inside the workspace.

import { useEffect } from 'react';
import { useStore } from '../../core/store';
import { newId } from '../../core/types';
import { sampleTranscripts } from '../../samples';
import { normaliseText } from '../../lib/coding/importers';
import { useAiStatus } from '../ai/hooks';
import { AiSetupButton } from '../ai/AiBits';
import { Modal } from '../../ui/Modal';
import { addDocs } from './actions';
import { plural, toast } from './hooks';
import { useCodingUi, type AnalyseTab, type CodingView } from './uiStore';
import { ImportDialog } from './dialogs/ImportDialog';
import { AutoCodeDialog } from './dialogs/AutoCodeDialog';
import { ExportDialog, ExportToDatasetDialog } from './dialogs/ExportDialogs';
import { AiCodebookDialog, AiSuggestDialog } from './dialogs/AiDialogs';
import { CodeEditDialog, CodersDialog, DocEditDialog, MergeCodeDialog } from './dialogs/SmallDialogs';

const ANALYSE: Record<string, AnalyseTab> = {
  frequencies: 'frequencies',
  cooccurrence: 'cooccurrence',
  attribute: 'attribute',
  words: 'words',
  kwic: 'kwic',
};

/** Switches the workspace view, then closes (for menu items that are views, not dialogs). */
function ViewSwitch({ target, onClose }: { target: string; onClose: () => void }) {
  useEffect(() => {
    const ui = useCodingUi.getState();
    if (ANALYSE[target]) ui.set({ view: 'analyse', analyseTab: ANALYSE[target] });
    else ui.set({ view: target as CodingView });
    useStore.getState().setTab('coding');
    onClose();
  }, [target, onClose]);
  return null;
}

function LoadSamples({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const existing = new Set(useStore.getState().coding.docs.filter((d) => d.kind === 'document').map((d) => d.name));
    const fresh = sampleTranscripts.filter((t) => !existing.has(t.name));
    if (!sampleTranscripts.length) toast('No sample interviews are bundled in this build.', 'warning');
    else if (!fresh.length) toast('The sample interviews are already loaded.', 'info');
    else {
      const now = Date.now();
      const docs = fresh.map((t, i) => ({ id: newId('doc'), name: t.name, kind: 'document' as const, text: normaliseText(t.text), attributes: { ...t.attributes }, createdAt: now + i }));
      addDocs(docs, 'Load sample interviews');
      useCodingUi.getState().set({ view: 'documents', activeDocId: docs[0].id });
      toast(`Loaded ${plural(docs.length, 'sample interview')}.`, 'success');
    }
    useStore.getState().setTab('coding');
    onClose();
  }, [onClose]);
  return null;
}

/** AI dialogs open when an AI provider is ready; otherwise explain the free options and offer set-up. */
function AiGate({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ai = useAiStatus();
  if (ai.ready === 'yes') return <>{children}</>;
  const chosen = ai.provider && ai.provider !== 'claude';
  return (
    <Modal
      title="AI suggestions"
      size="narrow"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Close</button>
          {ai.ready === 'no' ? <AiSetupButton /> : null}
        </>
      }
    >
      <div className="stack" style={{ fontSize: 'var(--fs-sm)' }}>
        {ai.ready === 'unknown' ? (
          <p>Checking whether AI help is ready…</p>
        ) : chosen ? (
          <p>The AI option you chose ({ai.label}) is not ready yet. Finish its set-up in AI assistant settings, or choose another option.</p>
        ) : (
          <>
            <p>AI help is optional and not set up yet. There are two free options:</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><b>On this computer:</b> a model runs in your browser and nothing leaves your computer. Best for confidential interviews.</li>
              <li><b>Google Gemini:</b> paste a free key from Google. Faster and better, but excerpts go to Google, so anonymise first.</li>
            </ul>
            <p className="help">Everything else in Text coding works without AI.</p>
          </>
        )}
      </div>
    </Modal>
  );
}

export function CodingDialog(props: { id: string; params?: Record<string, unknown>; onClose: () => void }) {
  const { id, params, onClose } = props;
  const p = params ?? {};
  if (id.startsWith('view:')) return <ViewSwitch target={id.slice(5)} onClose={onClose} />;
  switch (id) {
    case 'import':
      return <ImportDialog onClose={onClose} initialTab={(p.tab as any) ?? 'files'} />;
    case 'import-survey':
      return <ImportDialog onClose={onClose} initialTab="survey" />;
    case 'load-samples':
      return <LoadSamples onClose={onClose} />;
    case 'auto-code':
      return <AutoCodeDialog onClose={onClose} />;
    case 'ai-codebook':
      return (
        <AiGate onClose={onClose}>
          <AiCodebookDialog onClose={onClose} />
        </AiGate>
      );
    case 'ai-suggest':
      return (
        <AiGate onClose={onClose}>
          <AiSuggestDialog onClose={onClose} docIds={p.docIds as string[] | undefined} />
        </AiGate>
      );
    case 'export':
      return <ExportDialog onClose={onClose} initialTab={(p.tab as any) ?? 'segments'} />;
    case 'export-report':
      return <ExportDialog onClose={onClose} initialTab="report" />;
    case 'export-codebook':
      return <ExportDialog onClose={onClose} initialTab="codebook" />;
    case 'export-dataset':
      return <ExportToDatasetDialog onClose={onClose} />;
    case 'code-edit':
      return <CodeEditDialog onClose={onClose} codeId={p.codeId as string | undefined} parentId={p.parentId as string | undefined} />;
    case 'merge-code':
      return <MergeCodeDialog onClose={onClose} codeId={p.codeId as string} />;
    case 'doc-edit':
      return <DocEditDialog onClose={onClose} docId={p.docId as string} />;
    case 'coders':
      return <CodersDialog onClose={onClose} />;
    default:
      return null;
  }
}
