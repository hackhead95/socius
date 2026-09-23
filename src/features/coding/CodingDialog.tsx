// Dialog router for the "Text coding" menu (rendered by the app shell's DialogHost for store dialogs
// of kind 'coding') and for dialogs opened inside the workspace.

import { useEffect } from 'react';
import { useStore } from '../../core/store';
import { newId } from '../../core/types';
import { sampleTranscripts } from '../../samples';
import { normaliseText } from '../../lib/coding/importers';
import { aiAvailable } from '../../platform/host';
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

/** AI dialogs appear only when AI is available; otherwise explain once. */
function AiGate({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ai = useCodingUi((s) => s.ai);
  useEffect(() => {
    if (ai !== 'unknown') return;
    let alive = true;
    void aiAvailable().then((ok) => alive && useCodingUi.getState().set({ ai: ok ? 'yes' : 'no' }));
    return () => {
      alive = false;
    };
  }, [ai]);
  if (ai === 'yes') return <>{children}</>;
  return (
    <Modal title="AI suggestions" size="narrow" onClose={onClose} footer={<button className="btn btn-primary" onClick={onClose}>Close</button>}>
      <p style={{ fontSize: 'var(--fs-sm)' }}>{ai === 'unknown' ? 'Checking whether AI suggestions are available…' : 'AI suggestions are available when Socius runs as a Claude artifact. Everything else in Text coding works here as usual.'}</p>
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
