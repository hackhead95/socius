// The assistant panel: header (provider, what it can see, clear, close), the conversation with
// activity traces and action cards, the composer, and the privacy line.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useStore } from '../../core/store';
import { openAiSettings, useAiStatus } from '../ai/hooks';
import { AI_SETTINGS_LABEL, SET_UP_AI } from '../ai/AiBits';
import type { Proposal, TraceStep } from '../../lib/assistant/types';
import { useAssistantChat, type ArtifactEntry, type ChatEntry } from './chat-store';
import { copyAnswer, dismissArtifact, retryLast, runArtifact, sendMessage, stopAssistant, appSnapshot } from './controller';
import { AsIcon } from './icons';
import { Markdown } from './Markdown';
import { useAssistantUi } from './open';
import { starterPrompts } from './starters';

const MIN_W = 340;

function maxWidth(): number {
  return Math.max(MIN_W, Math.min(960, Math.floor(window.innerWidth * 0.7)));
}

export function AssistantPanel({ onClose }: { onClose: () => void }) {
  const status = useAiStatus();
  const entries = useAssistantChat((s) => s.entries);
  const running = useAssistantChat((s) => s.running);
  const width = useAssistantChat((s) => s.width);
  const [seeOpen, setSeeOpen] = useState(false);
  const eyeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const configured = !!status.provider && status.ready !== 'no';

  // Keep the newest message in view while it streams, unless the user scrolled up to read.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [entries]);
  const onScroll = () => {
    const el = bodyRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Publish the panel width so toasts can sit to its left.
  useEffect(() => {
    const apply = () => document.documentElement.style.setProperty('--as-panel-w', `${Math.min(width, maxWidth())}px`);
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [width]);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      if (seeOpen) {
        setSeeOpen(false);
        e.stopPropagation();
        eyeRef.current?.focus();
        return;
      }
      if (running) return;
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <aside className="as-panel" role="complementary" aria-label="Assistant" style={{ width: Math.min(width, maxWidth()) }} onKeyDown={onKeyDown} data-testid="assistant-panel">
      <ResizeHandle />
      <header className="as-head">
        <span className="as-title">
          <AsIcon name="assistant" />
          Assistant
        </span>
        {configured ? (
          <span className="as-provider" title={`Answers use ${status.label}`}>{status.label}</span>
        ) : (
          <button type="button" className="btn btn-sm btn-primary" onClick={openAiSettings}>
            {SET_UP_AI}
          </button>
        )}
        <span className="spacer" />
        <div className="as-see-wrap">
          <button ref={eyeRef} type="button" className={`btn btn-ghost btn-icon ${seeOpen ? 'btn-toggle-on' : ''}`} aria-expanded={seeOpen} aria-haspopup="dialog" title="What the assistant can see" aria-label="What the assistant can see" onClick={() => setSeeOpen((o) => !o)}>
            <AsIcon name="eye" />
          </button>
          {seeOpen ? <SeeMenu onClose={() => setSeeOpen(false)} /> : null}
        </div>
        <button type="button" className="btn btn-ghost btn-icon" title="Clear conversation" aria-label="Clear conversation" disabled={!entries.length} onClick={() => useAssistantChat.getState().clear()}>
          <AsIcon name="clear" />
        </button>
        <button type="button" className="btn btn-ghost btn-icon" title="Close (Esc)" aria-label="Close assistant" onClick={onClose}>
          <AsIcon name="close" />
        </button>
      </header>
      <div className="as-body" ref={bodyRef} onScroll={onScroll} aria-live="polite" aria-busy={running}>
        {!entries.length ? <Empty configured={configured} /> : entries.map((e, i) => <Entry key={e.id} entry={e} last={i === entries.length - 1} />)}
      </div>
      <Composer inputRef={inputRef}>
        <p className="as-privacy" data-testid="assistant-privacy">
          {configured ? (
            <>
              Answers use <b>{status.label}</b>. Only what is listed under 'What the assistant can see' is sent.
              {status.privacy === 'local' ? ' Nothing leaves this computer.' : ''}
            </>
          ) : (
            <>No AI service is set up yet, so nothing is sent anywhere. Only what is listed under 'What the assistant can see' will be sent.</>
          )}
        </p>
      </Composer>
    </aside>
  );
}

function ResizeHandle() {
  const setWidth = useAssistantChat((s) => s.setWidth);
  const width = useAssistantChat((s) => s.width);
  const drag = useRef<{ x: number; w: number } | null>(null);
  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    drag.current = { x: e.clientX, w: Math.min(width, maxWidth()) };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    setWidth(Math.max(MIN_W, Math.min(maxWidth(), drag.current.w + (drag.current.x - e.clientX))));
  };
  const onUp = () => {
    drag.current = null;
  };
  const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setWidth(Math.max(MIN_W, Math.min(maxWidth(), Math.min(width, maxWidth()) + (e.key === 'ArrowLeft' ? 40 : -40))));
  };
  return (
    <button
      type="button"
      className="as-resize"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the assistant panel"
      aria-valuenow={Math.round(width)}
      aria-valuemin={MIN_W}
      aria-valuemax={maxWidth()}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={onKey}
    />
  );
}

function SeeMenu({ onClose }: { onClose: () => void }) {
  const p = useAssistantChat((s) => s.permissions);
  const set = useAssistantChat((s) => s.setPermission);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    ref.current?.querySelector('input')?.focus();
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  return (
    <div className="as-see" role="dialog" aria-label="What the assistant can see" ref={ref}>
      <h3>What the assistant can see</h3>
      <label className="check">
        <input type="checkbox" checked={p.stats} onChange={(e) => set('stats', e.target.checked)} />
        <span>Variable information and summary statistics</span>
      </label>
      <p className="as-see-note">Names, labels, value labels, missing codes, counts, means and analysis results. No individual answers.</p>
      <label className="check">
        <input type="checkbox" checked={p.cases} onChange={(e) => set('cases', e.target.checked)} data-testid="see-cases" />
        <span>Individual cases</span>
      </label>
      <p className={`as-see-note ${p.cases ? 'as-see-warn' : ''}`}>
        {p.cases ? 'On: raw rows (up to 30 at a time) may be sent to the AI service. Check your consent forms and ethics approval. Switches off again when you reload.' : 'Off. When on, raw rows are sent to the AI service. Use only with anonymised data your ethics approval allows you to share.'}
      </p>
      <label className="check">
        <input type="checkbox" checked={p.texts} onChange={(e) => set('texts', e.target.checked)} />
        <span>Excerpts from coded texts</span>
      </label>
      <p className="as-see-note">Quotes from Text coding documents and responses. Anonymise names and places first.</p>
    </div>
  );
}

function Empty({ configured }: { configured: boolean }) {
  const tab = useStore((s) => s.tab);
  const ds = useStore((s) => s.dataset);
  const outputs = useStore((s) => s.outputs);
  const coding = useStore((s) => s.coding);
  const prompts = starterPrompts({ tab, dataset: ds, outputs, coding });
  return (
    <div className="as-empty">
      <h2>Ask about your research</h2>
      <p>
        I can read the data you open (variable information and summaries), run analyses, explain results, suggest the right test, prepare recodes for you to check, and help with coded interviews. I only change your data when you click Apply.
      </p>
      {!configured ? (
        <div className="callout callout-info as-setup">
          <span>To start, choose a free AI option: Google Gemini with your own free key, or a model that runs on this computer.</span>
          <span>
            <button type="button" className="btn btn-sm btn-primary" onClick={openAiSettings}>{SET_UP_AI}</button>
          </span>
        </div>
      ) : null}
      <div className="as-starters" role="list" aria-label="Suggested questions">
        {prompts.map((p) => (
          <button key={p} type="button" role="listitem" className="as-starter" onClick={() => void sendMessage(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function Entry({ entry, last }: { entry: ChatEntry; last: boolean }) {
  if (entry.role === 'divider') return <div className="as-divider">{entry.text}</div>;
  if (entry.role === 'user')
    return (
      <div className="as-msg-user">
        {entry.about ? <span className="as-about">About: {entry.about}</span> : null}
        <div className="as-bubble">{entry.text}</div>
      </div>
    );
  return <AssistantMessage entry={entry} last={last} />;
}

function stepClass(s: TraceStep) {
  return s.status === 'error' ? 'as-step-error' : s.kind === 'wait' ? 'as-step-wait' : '';
}

function AssistantMessage({ entry, last }: { entry: ChatEntry; last: boolean }) {
  const [copied, setCopied] = useState(false);
  const live = entry.status === 'pending' || entry.status === 'streaming';
  const running = entry.steps.filter((s) => s.status === 'running');
  const tools = entry.steps.filter((s) => s.kind !== 'note' || s.status !== 'running');
  const visible = entry.artifacts.filter((a) => a.state !== 'dismissed');
  return (
    <div className="as-msg-assistant" data-testid="assistant-message" data-status={entry.status}>
      {tools.length ? (
        <details className="as-trace">
          <summary>
            <AsIcon name="chevron" size={12} />
            {live ? 'Working' : 'What I did'} ({tools.length} step{tools.length === 1 ? '' : 's'})
          </summary>
          <ol>
            {tools.map((s) => (
              <li key={s.id} className={stepClass(s)}>
                {s.label}
                {s.status === 'running' ? '...' : ''}
                {s.detail ? `: ${s.detail}` : ''}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      {live && running.length ? (
        <div className="as-live">
          <span className="spinner" aria-hidden="true" />
          <span>{running[running.length - 1].label}...</span>
        </div>
      ) : null}
      {entry.text ? <Markdown text={entry.text} /> : live ? <Typing /> : null}
      {entry.truncated ? <p className="as-note">The answer was cut short by the length limit. Ask "continue" for the rest.</p> : null}
      {visible.map((a) => (
        <ArtifactCard key={a.id} entryId={entry.id} a={a} />
      ))}
      {entry.status === 'error' ? (
        <div className="callout callout-bad as-error" role="alert">
          <span>{entry.error}</span>
          <span className="as-actions">
            <button type="button" className="btn btn-sm" onClick={() => void retryLast()}>
              <AsIcon name="retry" size={14} /> Retry
            </button>
            {/set up|settings|key|model|allowance/i.test(entry.error ?? '') ? (
              <button type="button" className="btn btn-sm" onClick={openAiSettings}>{AI_SETTINGS_LABEL}</button>
            ) : null}
          </span>
        </div>
      ) : null}
      {entry.status === 'stopped' ? (
        <div className="as-actions">
          <span className="as-note">Stopped.</span>
          {last ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => void retryLast()}>
              <AsIcon name="retry" size={14} /> Retry
            </button>
          ) : null}
        </div>
      ) : null}
      {entry.status === 'done' ? (
        <div className="as-actions">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={async () => {
              if (await copyAnswer(entry.text)) {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }
            }}
          >
            <AsIcon name={copied ? 'check' : 'copy'} size={14} /> {copied ? 'Copied' : 'Copy answer'}
          </button>
          {last ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => void retryLast()}>
              <AsIcon name="retry" size={14} /> Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Typing() {
  return (
    <span className="as-typing" aria-label="Thinking">
      <span />
      <span />
      <span />
    </span>
  );
}

function ArtifactCard({ entryId, a }: { entryId: string; a: ArtifactEntry }) {
  if (a.artifact.kind === 'output') {
    const item = a.artifact.item;
    return (
      <div className="as-card" data-testid="assistant-output-card">
        <div className="as-card-head">
          <AsIcon name="table" />
          <span>{item.title}</span>
        </div>
        {item.caseNote ? <p>{item.caseNote}</p> : null}
        <div className="as-actions">
          {a.state === 'done' ? (
            <span className="as-card-done">
              <AsIcon name="check" size={14} /> {a.note}
            </span>
          ) : (
            <button type="button" className="btn btn-sm" onClick={() => runArtifact(entryId, a.id)}>
              Add this analysis to Output
            </button>
          )}
        </div>
      </div>
    );
  }
  return <ProposalCard entryId={entryId} a={a} p={a.artifact.proposal} />;
}

function ProposalCard({ entryId, a, p }: { entryId: string; a: ArtifactEntry; p: Proposal }) {
  const done = a.state === 'done';
  if (p.kind === 'dialog')
    return (
      <div className="as-card" data-testid="assistant-dialog-card">
        <div className="as-card-head">
          <AsIcon name="dialog" />
          <span>{p.title}</span>
        </div>
        <p>{p.summary}</p>
        <div className="as-actions">
          <button type="button" className="btn btn-sm btn-primary" onClick={() => runArtifact(entryId, a.id)}>
            Open dialog
          </button>
          {done ? <span className="as-card-done"><AsIcon name="check" size={14} /> {a.note}</span> : null}
          {a.state === 'failed' ? <span className="as-card-failed">{a.note}</span> : null}
        </div>
      </div>
    );
  return (
    <div className="as-card as-card-proposal" data-testid="assistant-proposal-card">
      <div className="as-card-head">
        <AsIcon name="wand" />
        <span>Proposed change: {p.title}</span>
      </div>
      <p>{p.summary} Nothing changes until you click Apply.</p>
      {p.warnings.length ? (
        <ul className="as-card-warn">
          {p.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      ) : null}
      {p.preview.rows.length ? (
        <div className="as-table-wrap" tabIndex={0} role="region" aria-label="Preview of the first cases">
          <table className="as-table">
            <thead>
              <tr>{p.preview.columns.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {p.preview.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <details>
        <summary>SPSS syntax</summary>
        <pre>{p.syntax}</pre>
      </details>
      <div className="as-actions">
        {done ? (
          <span className="as-card-done">
            <AsIcon name="check" size={14} /> {a.note}
          </span>
        ) : (
          <>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => runArtifact(entryId, a.id)}>
              Apply
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => dismissArtifact(entryId, a.id)}>
              Dismiss
            </button>
          </>
        )}
        {a.state === 'failed' ? <span className="as-card-failed">{a.note}</span> : null}
      </div>
    </div>
  );
}

function Composer({ inputRef, children }: { inputRef: React.RefObject<HTMLTextAreaElement | null>; children?: ReactNode }) {
  const draft = useAssistantChat((s) => s.draft);
  const setDraft = useAssistantChat((s) => s.setDraft);
  const running = useAssistantChat((s) => s.running);
  const focusId = useAssistantChat((s) => s.focusOutputId);
  const focusTitle = useStore((s) => (focusId ? s.outputs.find((o) => o.id === focusId)?.title : undefined));
  const ds = useStore((s) => s.dataset);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(160, el.scrollHeight + 2)}px`;
  }, [draft, inputRef]);

  const send = () => {
    if (!draft.trim() || running) return;
    void sendMessage(draft);
  };
  const placeholder = ds ? `Ask about ${ds.name}, a test, a result or how to do something...` : 'Ask how to do something in Socius...';
  return (
    <div className="as-foot">
      {focusId && focusTitle ? (
        <span className="as-about-chip">
          <span>About: {focusTitle}</span>
          <button type="button" aria-label="Do not attach this result" title="Do not attach this result" onClick={() => useAssistantChat.getState().setFocusOutput(null)}>
            <AsIcon name="close" size={12} />
          </button>
        </span>
      ) : null}
      <div className="as-compose">
        <textarea
          ref={inputRef}
          className="textarea"
          rows={1}
          value={draft}
          placeholder={placeholder}
          aria-label="Message to the assistant"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
        />
        {running ? (
          <button type="button" className="btn" onClick={stopAssistant} aria-label="Stop">
            <AsIcon name="stop" size={14} /> Stop
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={send} disabled={!draft.trim()} aria-label="Send">
            <AsIcon name="send" size={14} /> Send
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/** For tests and callers: the current context the panel would send (no request is made). */
export function currentContext() {
  return { snapshot: appSnapshot(), permissions: useAssistantChat.getState().permissions, open: useAssistantUi.getState().open };
}
