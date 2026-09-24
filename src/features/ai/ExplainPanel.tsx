// The "Explain with AI" panel under an Output item: first what will be sent and to whom, then the
// streamed explanation with Stop, Copy, Add to output and a hand-over to the Socius assistant.
import { useEffect, useMemo, useRef } from 'react';
import type { OutputItem } from '../../core/output';
import { aiPromptBudget } from '../../platform/ai';
import { copyToClipboard } from '../../platform/host';
import { useStore } from '../../core/store';
import { openAssistant } from '../assistant/open';
import { AiActivityLine, AiErrorDetails, AiLoadProgress, AiProviderNote, SET_UP_AI } from './AiBits';
import { AiText } from './AiText';
import { buildExplainPrompt, byteLength, plainText } from './explainPrompt';
import { useExplain } from './explainStore';
import { openAiSettings, useAiStatus } from './hooks';
import './ai.css';

export function ExplainPanel({ item }: { item: OutputItem }) {
  const panel = useExplain((s) => s.panels[item.id]);
  const ai = useAiStatus();
  const ref = useRef<HTMLDivElement>(null);
  const preview = useMemo(() => (panel?.phase === 'confirm' ? buildExplainPrompt(item, { budgetBytes: aiPromptBudget() }) : null), [panel?.phase, item, ai.provider, ai.label]);

  // Bring the panel into view when it opens.
  const open = !!panel;
  useEffect(() => {
    if (open) requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }, [open]);

  if (!panel) return null;
  const ex = useExplain.getState();
  const discuss = () => openAssistant({ outputId: item.id, prompt: 'Help me understand this result', send: true });
  const kb = preview ? Math.max(1, Math.round(byteLength(preview.prompt) / 1024)) : 0;

  return (
    <section ref={ref} className="ai-explain" aria-label={`AI explanation of ${item.title}`} data-phase={panel.phase}>
      <div className="ai-explain-head">
        <span className="ai-badge" aria-hidden="true">AI</span>
        <b>{panel.phase === 'confirm' ? 'Explain this result with AI' : 'AI explanation'}</b>
        {panel.phase !== 'confirm' ? <span className="ai-explain-label">AI-generated: check against the tables</span> : null}
        <span className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => ex.close(item.id)} aria-label="Close the explanation" title="Close">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
        </button>
      </div>

      {panel.phase === 'confirm' && preview ? (
        <div className="stack ai-explain-body">
          <p className="help">
            The AI explains what was tested, what the numbers mean for your research question, whether the warnings matter, how to report the result, and what not to conclude from it.
          </p>
          {ai.ready === 'yes' ? (
            <AiProviderNote when="When you click Explain" what="the tables, Socius's summary, the APA sentence and the warnings of this result (no individual answers)" />
          ) : ai.ready === 'no' ? (
            <p className="help">
              AI help is not set up yet.{' '}
              <button type="button" className="linkish" onClick={() => { ex.setPending(item.id); openAiSettings('explain'); }}>{SET_UP_AI}</button>
            </p>
          ) : (
            <p className="help">Checking the AI set-up…</p>
          )}
          <details className="ai-preview">
            <summary>What will be sent ({kb} KB)</summary>
            <pre className="ai-preview-text">{preview.prompt}</pre>
            {preview.context.omitted.length ? (
              <p className="help">Not sent: {preview.context.omitted.join('; ')}.</p>
            ) : null}
          </details>
          <div className="row ai-explain-actions">
            <button type="button" className="btn btn-primary btn-sm" disabled={ai.ready !== 'yes'} onClick={() => void ex.run(item)}>Explain</button>
            <button type="button" className="btn btn-sm" onClick={() => ex.close(item.id)}>Cancel</button>
            <span className="spacer" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={discuss} title="Open the Socius assistant with this result">Discuss with the assistant</button>
          </div>
        </div>
      ) : (
        <div className="stack ai-explain-body" aria-live="polite" aria-busy={panel.phase === 'running'}>
          {panel.phase === 'running' && !panel.text ? (
            <>
              <AiLoadProgress onCancel={() => ex.stop(item.id)} activity={false} />
              <p className="help ai-explain-wait"><AiActivityLine op="explain" fallback="Reading the result…" /></p>
            </>
          ) : null}
          {panel.text ? <AiText text={panel.text} className="ai-explain-text" /> : null}
          {panel.error ? <p className={panel.phase === 'error' ? 'text-bad' : 'help'}>{panel.error}</p> : null}
          {panel.phase === 'error' ? <AiErrorDetails report={panel.errorReport} /> : null}
          {panel.provider ? <p className="help">Written by {panel.provider}. It can be wrong: check every number against the tables above.</p> : null}
          <div className="row ai-explain-actions">
            {panel.phase === 'running' ? (
              <button type="button" className="btn btn-sm" onClick={() => ex.stop(item.id)}>Stop</button>
            ) : panel.phase === 'error' ? (
              <button type="button" className="btn btn-sm btn-primary" onClick={() => void ex.run(item)}>Try again</button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={!panel.text}
                  onClick={async () => {
                    const ok = await copyToClipboard(plainText(panel.text));
                    useStore.getState().toast(ok ? 'Explanation copied' : 'Could not copy. Select the text and copy it instead.', ok ? 'success' : 'error');
                  }}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={!panel.text}
                  onClick={() => {
                    if (ex.addToOutput(item.id)) useStore.getState().toast('Added to the output as an AI-generated note.', 'success');
                  }}
                >
                  Add to output
                </button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => void ex.run(item)}>Explain again</button>
              </>
            )}
            <span className="spacer" />
            {panel.phase !== 'running' ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={discuss} title="Open the Socius assistant with this result">Discuss with the assistant</button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
