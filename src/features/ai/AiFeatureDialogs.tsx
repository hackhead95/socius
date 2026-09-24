// App-wide AI entry points: the "do this first" dialog, the result picker for Explain a result, and
// the AI chip in the top bar with its popover.
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../core/store';
import { getAiSettings, OPENAI_PRESETS, type AiStatus } from '../../platform/ai';
import { Modal } from '../../ui/Modal';
import { loadSample } from '../project/fileActions';
import { useCodingUi } from '../coding/uiStore';
import { formatItemTime } from '../output/reportHtml';
import { AI_FEATURES, aiFeature, aiFeatureBlocker, currentAiContext, explainableOutputs, isAiFeatureId, runAiFeature, startExplain, type AiFeatureId, type AiPrereqAction } from './features';
import { openAiSettings, useAiStatus } from './hooks';
import './ai.css';

const ACTION_LABEL: Record<AiPrereqAction, string> = {
  'open-crosstabs': 'Open Crosstabs',
  'load-sample': 'Load the sample survey',
  'import-survey': 'Import answers from a survey question',
  'import-docs': 'Import documents',
  'load-interviews': 'Load sample interviews',
  'open-coding': 'Open Text coding',
  'suggest-codebook': 'Suggest a codebook',
  'open-responses': 'Open the Responses view',
};

function doAction(a: AiPrereqAction) {
  const st = useStore.getState();
  switch (a) {
    case 'open-crosstabs':
      st.openDialog({ kind: 'procedure', id: 'crosstabs' });
      return;
    case 'load-sample':
      st.closeDialog();
      void loadSample();
      return;
    case 'import-survey':
      st.setTab('coding');
      st.openDialog({ kind: 'coding', id: 'import-survey' });
      return;
    case 'import-docs':
      st.setTab('coding');
      st.openDialog({ kind: 'coding', id: 'import' });
      return;
    case 'load-interviews':
      st.openDialog({ kind: 'coding', id: 'load-samples' });
      return;
    case 'open-coding':
      st.closeDialog();
      st.setTab('coding');
      return;
    case 'open-responses':
      st.closeDialog();
      useCodingUi.getState().set({ view: 'responses' });
      st.setTab('coding');
      return;
    case 'suggest-codebook':
      st.closeDialog();
      void runAiFeature('codebook');
      return;
  }
}

/** "Explain a result needs a result first" and similar: what to do before an AI feature can start. */
export function AiPrereqDialog({ params, onClose }: { params?: Record<string, unknown>; onClose: () => void }) {
  const id: AiFeatureId = isAiFeatureId(params?.feature) ? params.feature : 'explain';
  useStore((s) => s.coding); // re-check when the project changes
  useStore((s) => s.outputs);
  const blocker = aiFeatureBlocker(id, currentAiContext());
  const f = aiFeature(id);
  return (
    <Modal
      title={blocker?.title ?? f.label}
      subtitle={f.label}
      size="narrow"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Close</button>
          {blocker ? (
            blocker.actions.map((a, i) => (
              <button key={a} className={`btn ${i === 0 ? 'btn-primary' : ''}`} onClick={() => doAction(a)}>{ACTION_LABEL[a]}</button>
            ))
          ) : (
            <button className="btn btn-primary" onClick={() => { onClose(); void runAiFeature(id); }}>{f.label}</button>
          )}
        </>
      }
    >
      <div className="stack" style={{ fontSize: 'var(--fs-sm)' }}>
        <p>{blocker ? blocker.message : `Ready: ${f.label} can start now.`}</p>
        <p className="help">Once it has something to work with, {f.label} {f.does}</p>
      </div>
    </Modal>
  );
}

/** Choose which Output result to explain (newest first). */
export function ExplainPickDialog({ onClose }: { onClose: () => void }) {
  const outputs = useStore((s) => s.outputs);
  const items = explainableOutputs(outputs).slice().reverse();
  return (
    <Modal title="Explain a result" subtitle="Choose a result. You will see what will be sent before anything goes to the AI." onClose={onClose} footer={<button className="btn" onClick={onClose}>Cancel</button>}>
      {items.length ? (
        <ul className="ai-pick-list">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                className="ai-pop-item ai-pick-item"
                onClick={() => {
                  onClose();
                  startExplain(it.id);
                }}
              >
                <b>{it.title}</b>
                <span>{[formatItemTime(it.createdAt), it.caseNote].filter(Boolean).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="help">There are no results to explain yet. Run an analysis from the Analyze menu first.</p>
      )}
    </Modal>
  );
}

/** Short provider name for the chip ("Gemini", "Groq", "On device"). */
export function shortProviderName(st: AiStatus): string {
  switch (st.provider) {
    case 'claude':
      return 'Claude';
    case 'webllm':
      return 'On device';
    case 'gemini':
      return 'Gemini';
    case 'openai': {
      const p = getAiSettings().openai.preset;
      return p === 'custom' ? 'Custom' : OPENAI_PRESETS[p].label.replace(/ on this computer$/, '');
    }
    default:
      return '';
  }
}

/** The AI features as a list of buttons (chip popover). */
function FeatureButtons({ onPick }: { onPick: () => void }) {
  return (
    <div className="ai-pop-list" role="list">
      {AI_FEATURES.map((f) => (
        <button
          key={f.id}
          type="button"
          role="listitem"
          className="ai-pop-item"
          onClick={() => {
            onPick();
            void runAiFeature(f.id);
          }}
        >
          <b>{f.label}</b>
          <span>{f.does.charAt(0).toUpperCase() + f.does.slice(1)}</span>
        </button>
      ))}
    </div>
  );
}

/** Top-bar chip: AI ready (provider) or not set up; opens a popover with what AI can do. */
export function AiChip() {
  const st = useAiStatus();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener('mousedown', down, true);
    window.addEventListener('keydown', key);
    ref.current?.querySelector<HTMLButtonElement>('.ai-pop button')?.focus();
    return () => {
      window.removeEventListener('mousedown', down, true);
      window.removeEventListener('keydown', key);
    };
  }, [open]);
  const name = shortProviderName(st);
  const chosenNotReady = st.provider && st.ready === 'no';
  const statusText = st.ready === 'yes' ? `AI help: ready (${st.label})` : st.ready === 'unknown' ? 'AI help: checking' : chosenNotReady ? `AI help: ${st.label} is not ready` : 'AI help: not set up';
  return (
    <div className="ai-chip-wrap" ref={ref}>
      <button ref={btnRef} type="button" className="ai-chip" data-ready={st.ready} aria-haspopup="dialog" aria-expanded={open} aria-label={statusText} title={statusText} onClick={() => setOpen((o) => !o)}>
        <span className="ai-chip-dot" aria-hidden="true" />
        AI
        <span className="ai-chip-provider">{st.ready === 'yes' ? name : st.ready === 'unknown' ? '' : 'not set up'}</span>
      </button>
      {open ? (
        <div className="ai-pop" role="dialog" aria-label="AI help">
          <p className="ai-pop-status">
            {st.ready === 'yes' ? (
              <>Ready: <b>{st.label}</b>. Nothing is sent until you click a button that asks the AI.</>
            ) : chosenNotReady ? (
              <>The AI option you chose (<b>{st.label}</b>) is not ready yet. Finish its set-up in settings.</>
            ) : (
              <><b>AI help is not set up.</b> It is optional and free: a model on this computer, or a free Google Gemini key.</>
            )}
          </p>
          <FeatureButtons onPick={() => setOpen(false)} />
          <div className="ai-pop-foot">
            <button
              type="button"
              className={`btn btn-sm ${st.ready === 'yes' ? '' : 'btn-primary'}`}
              onClick={() => {
                setOpen(false);
                openAiSettings();
              }}
            >
              {st.ready === 'yes' ? 'AI assistant settings' : 'Set up AI help'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
