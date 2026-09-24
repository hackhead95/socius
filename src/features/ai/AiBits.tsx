// Small pieces shown wherever AI help is offered: the set-up button ("Set up AI", the one wording for
// every set-up prompt; it opens the same AI assistant settings dialog as AI > AI assistant settings), the "what will be sent where" note,
// the privacy notice and the on-device download progress.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { getAiSettings, providerPrivacy, type AiPrivacy, type AiProviderId, type AiStatus } from '../../platform/ai';
import { getAiActivity, stageLabel, subscribeAiActivity, type AiActivity } from '../../platform/ai-timing';
import { copyToClipboard } from '../../platform/host';
import { webLlmChoice } from '../../platform/ai-webllm';
import { openAiSettings, useAiStatus, useWebLlmState } from './hooks';
import './ai.css';

/** The one wording for a contextual set-up prompt (AI not set up yet). */
export const SET_UP_AI = 'Set up AI';
/** The menu wording of AI > AI assistant settings, used by contextual shortcuts when AI is set up. */
export const AI_SETTINGS_LABEL = 'AI assistant settings';

export function AiSetupButton({ intent }: { intent?: string }) {
  return (
    <button type="button" className="btn btn-sm ai-setup-btn" onClick={() => openAiSettings(intent)}>
      {SET_UP_AI}
    </button>
  );
}

/**
 * Before anything is sent: which provider will receive what, and where it goes.
 * `what` is a phrase like "150 excerpts"; `when` names the button, e.g. "When you click Suggest codes".
 */
export function AiProviderNote({ what, when, status: given }: { what: string; when?: string; status?: AiStatus }) {
  const live = useAiStatus();
  const status = given ?? live;
  if (!status.provider) return null;
  const local = status.privacy === 'local';
  const firstDownload = status.provider === 'webllm' && status.modelCached === false;
  const lead = when ? <>{when}, <b>{what}</b></> : <b>{cap(what)}</b>;
  return (
    <p className="help ai-note" data-privacy={status.privacy}>
      {local ? (
        <>
          {lead} will be read by <b>{status.label}</b>. Nothing leaves this computer.
        </>
      ) : (
        <>
          {lead} will be sent to <b>{status.label}</b>. Anonymise names and places first if the data is confidential.
        </>
      )}
      {firstDownload ? <> The first use downloads the model ({webLlmChoice(getAiSettings().webllm.model).download}).</> : null}{' '}
      <button type="button" className="linkish" onClick={openAiSettings}>{AI_SETTINGS_LABEL}</button>
    </p>
  );
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Research-ethics privacy notice for a provider. */
export function AiPrivacyNotice({ provider, host }: { provider: AiProviderId | null; host?: string }) {
  const privacy: AiPrivacy = provider ? providerPrivacy(provider) : 'none';
  if (privacy === 'none') return null;
  if (privacy === 'local')
    return (
      <div className="callout callout-good ai-privacy" data-privacy="local">
        <b>Private: nothing leaves your computer.</b>{' '}
        {provider === 'webllm'
          ? 'The model runs inside this browser, on your own graphics chip. After the one-time download it works offline. Recommended for confidential interviews and for data your consent forms say must not be shared.'
          : 'The service runs on your own computer, so excerpts stay on it (as long as the address points to this computer).'}
      </div>
    );
  if (privacy === 'google')
    return (
      <div className="callout callout-warn ai-privacy" data-privacy="google">
        <b>The excerpts you send go to Google.</b> On the free tier, Google may use what you send to improve its products, and human reviewers may read it. Do not send identifiable or confidential data: anonymise excerpts first (names, places, employers, rare details), and check that your participants' consent and your ethics approval allow sharing data with an outside service. Consider the on-device option for sensitive material.
      </div>
    );
  if (privacy === 'claude')
    return (
      <div className="callout callout-info ai-privacy" data-privacy="claude">
        <b>The excerpts you send go to Anthropic</b> through your Claude account, under your Claude plan's terms. Anonymise excerpts first and check that your consent forms and ethics approval allow it.
      </div>
    );
  return (
    <div className="callout callout-warn ai-privacy" data-privacy="third-party">
      <b>The excerpts you send go to {host || 'the service you choose'}.</b> Check its terms on how it uses and keeps data before sending interview material. Anonymise excerpts first, and make sure your consent forms and ethics approval allow sharing with an outside service.
    </div>
  );
}

/**
 * A "Details" link under an AI error message: shows the diagnostic report (see aiErrorReport in
 * platform/ai-diagnose.ts; it never contains a key) with a Copy details button, for asking for help.
 */
export function AiErrorDetails({ report }: { report?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  if (!report) return null;
  return (
    <span className="ai-err-details">
      <button type="button" className="linkish" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide details' : 'Details'}
      </button>
      {open ? (
        <span className="ai-err-details-box">
          <pre className="ai-preview-text">{report}</pre>
          <button type="button" className="btn btn-sm" onClick={async () => setCopied((await copyToClipboard(report)) ? 'ok' : 'fail')}>
            {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Could not copy: select the text instead' : 'Copy details'}
          </button>
        </span>
      ) : null}
    </span>
  );
}

/** The current AI activity (the newest, or the newest of one kind: "assistant", "explain"...). */
export function useAiActivity(op?: string): AiActivity | null {
  return useSyncExternalStore(
    subscribeAiActivity,
    () => getAiActivity(op),
    () => null,
  );
}

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * What the AI is doing right now, with the time so far: "Waiting for Google · 3 s", "Thinking · 2 s",
 * or a countdown for a free-tier limit: "Waiting 11 s for Google's free limit...". Only the stage is
 * announced to screen readers (not every second).
 */
export function AiActivityLine({ op, fallback }: { op?: string; fallback?: string }) {
  const act = useAiActivity(op);
  const [, tick] = useState(0);
  const running = !!act?.active;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [running, act?.id]);
  if (!act || !act.active) return fallback ? <span className="help">{fallback}</span> : null;
  const now = nowMs();
  const secs = Math.max(0, Math.floor((now - act.startedAt) / 1000));
  const left = act.stage === 'limit' && act.waitUntil ? Math.max(0, Math.ceil((act.waitUntil - now) / 1000)) : undefined;
  const label = left !== undefined ? stageLabel('limit', act.provider, left) : act.label;
  const spoken = act.stage === 'limit' ? (act.provider === 'gemini' ? "Waiting for Google's free limit" : "Waiting for the service's limit") : act.label;
  return (
    <span className="ai-activity help" data-stage={act.stage} data-testid="ai-activity">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only" role="status" aria-live="polite">{spoken}</span>
      <span aria-hidden="true" className="ai-activity-label">{label}</span>
      {act.stage !== 'limit' ? <span aria-hidden="true" className="ai-activity-time num">· {secs} s</span> : null}
    </span>
  );
}

/** Download / load progress of the on-device model, shown while a request is waiting for it; otherwise what the AI is doing. */
export function AiLoadProgress({ onCancel, activity = true }: { onCancel?: () => void; activity?: boolean }) {
  const st = useWebLlmState();
  if (st.phase !== 'loading') return activity ? <AiActivityLine /> : null;
  const pct = Math.round(st.progress * 100);
  return (
    <div className="ai-progress" aria-live="polite">
      <div className="row">
        <span className="help">Preparing the on-device model: {pct}%. The first time, this downloads the model; later it loads from the browser's cache.</span>
        <span className="spacer" />
        {onCancel ? <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button> : null}
      </div>
      <div className="ai-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Model download">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
