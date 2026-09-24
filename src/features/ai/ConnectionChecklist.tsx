// The result of AI assistant settings > Test connection: one line per step with a tick or a cross,
// the plain-English reason and what to do when a step fails, a model picker when an online service does
// not offer the typed model, and "Copy details" (a report for support that never contains the key).
import { useMemo, useState } from 'react';
import { connectionReport, type CheckState, type ConnectionCheck } from '../../platform/ai-diagnose';
import { copyToClipboard } from '../../platform/host';
import './ai.css';

const STATE_WORDS: Record<CheckState, string> = {
  pending: 'waiting',
  running: 'checking',
  ok: 'passed',
  warn: 'warning',
  fail: 'failed',
  skip: 'not checked',
};

function StepIcon({ state }: { state: CheckState }) {
  const common = { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true, className: 'ai-check-icon' } as const;
  switch (state) {
    case 'ok':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="m4.8 8.2 2.1 2.1 4.3-4.6" fill="none" stroke="var(--surface)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'fail':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="m5.5 5.5 5 5m0-5-5 5" fill="none" stroke="var(--surface)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'warn':
      return (
        <svg {...common}>
          <path d="M8 1.5 15 14H1z" fill="currentColor" />
          <path d="M8 6v4" stroke="var(--surface)" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="12" r="0.9" fill="var(--surface)" />
        </svg>
      );
    case 'running':
      return (
        <svg {...common} className="ai-check-icon ai-check-spin">
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
          <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'skip':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5.2 8h5.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
  }
}

/** The step list, the failure explanation and the support report. */
export function ConnectionChecklist({ check, onUseModel }: { check: ConnectionCheck; onUseModel?: (model: string) => void }) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [pick, setPick] = useState('');
  const report = useMemo(() => (check.running ? '' : connectionReport(check)), [check]);
  const failed = !check.running && !check.ok && !!check.error && check.error.code !== 'cancelled';
  const models = check.models ?? [];

  const copy = async () => {
    setCopied((await copyToClipboard(report)) ? 'ok' : 'fail');
  };

  return (
    <section className="ai-check" aria-label="Connection check" data-result={check.running ? 'running' : check.ok ? 'ok' : 'fail'}>
      <ol className="ai-check-steps">
        {check.steps.map((s, i) => (
          <li key={s.id} className="ai-check-step" data-step={s.id} data-state={s.state}>
            <StepIcon state={s.state} />
            <span className="ai-check-text">
              <span className="ai-check-label">
                {check.steps.length > 1 ? `${i + 1}. ` : ''}
                {s.label}
                <span className="sr-only">: {STATE_WORDS[s.state]}</span>
              </span>
              {s.detail ? <span className="ai-check-detail">{s.detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>

      {failed ? (
        <div className="callout callout-bad ai-check-error" role="alert">
          <p className="ai-check-reason">{check.error!.message}</p>
          {models.length && onUseModel ? (
            <div className="row ai-check-models">
              <label htmlFor="ai-check-model">Models this service offers:</label>
              <select id="ai-check-model" className="select" value={pick || models[0]} onChange={(e) => setPick(e.target.value)}>
                {models.slice(0, 200).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => onUseModel(pick || models[0])}>Use this model</button>
            </div>
          ) : null}
          <div className="row ai-check-actions">
            <button type="button" className="btn btn-sm" onClick={copy}>{copied === 'ok' ? 'Copied' : 'Copy details'}</button>
            <span className="help">
              {copied === 'fail' ? 'Could not copy: open Show details and copy the text instead.' : 'A report for asking for help: what was checked and what the service answered. It never includes your key.'}
            </span>
          </div>
          <details className="ai-preview ai-check-details">
            <summary>Show details</summary>
            <pre className="ai-preview-text ai-check-report">{report}</pre>
          </details>
        </div>
      ) : null}

      {!check.running && !failed && report ? (
        <details className="ai-preview ai-check-details">
          <summary>Details</summary>
          <pre className="ai-preview-text ai-check-report">{report}</pre>
          <button type="button" className="btn btn-sm btn-ghost" onClick={copy}>{copied === 'ok' ? 'Copied' : 'Copy details'}</button>
        </details>
      ) : null}
    </section>
  );
}
