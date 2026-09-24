// Small pieces shown wherever AI help is offered: the set-up button, the "what will be sent where" note,
// the privacy notice and the on-device download progress.
import { getAiSettings, providerPrivacy, type AiPrivacy, type AiProviderId, type AiStatus } from '../../platform/ai';
import { webLlmChoice } from '../../platform/ai-webllm';
import { openAiSettings, useAiStatus, useWebLlmState } from './hooks';
import './ai.css';

export function AiSetupButton({ label = 'Set up free AI help' }: { label?: string }) {
  return (
    <button type="button" className="btn btn-sm ai-setup-btn" onClick={openAiSettings}>
      {label}
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
      <button type="button" className="linkish" onClick={openAiSettings}>Change</button>
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

/** Download / load progress of the on-device model, shown while a request is waiting for it. */
export function AiLoadProgress({ onCancel }: { onCancel?: () => void }) {
  const st = useWebLlmState();
  if (st.phase !== 'loading') return null;
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
