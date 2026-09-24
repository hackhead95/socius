// AI assistant settings > Other service, when the address is a program on this computer (Ollama,
// LM Studio, or another local OpenAI-compatible server): set-up steps for this operating system and
// website, and a Test connection that checks each step in turn (running? allows this website? browser
// permission? model installed? answered?) and says how to fix the one that failed.
// The checking logic is in src/platform/ai-local.ts.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getAiSettings, saveAiSettings } from '../../platform/ai';
import {
  SAFARI_LOCAL_BLOCKED, addressAdvice, detectBrowser, detectOs, lmStudioCorsFix, localDiagnostics, localKind, ollamaOriginsFix, pullCommand, runLocalCheck, siteOrigin, STEP_TITLES,
  type FixStep, type LocalCheckResult, type LocalOs, type LocalStep, type StepStatus,
} from '../../platform/ai-local';
import { copyToClipboard } from '../../platform/host';
import './ai-local.css';

/** A command or value with a Copy button. */
export function CopyLine({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState<'idle' | 'ok' | 'fail'>('idle');
  useEffect(() => {
    if (done === 'idle') return;
    const t = setTimeout(() => setDone('idle'), 2000);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <div className="ai-copy">
      <code className="ai-copy-text">{text}</code>
      <button type="button" className="btn btn-sm" onClick={async () => setDone((await copyToClipboard(text)) ? 'ok' : 'fail')} aria-label={`${label}: ${text}`}>
        {done === 'ok' ? 'Copied' : done === 'fail' ? 'Select and copy' : label}
      </button>
    </div>
  );
}

function FixList({ steps }: { steps: FixStep[] }) {
  return (
    <ol className="ai-fix">
      {steps.map((s, i) => (
        <li key={i}>
          {s.text}
          {s.copy ? <CopyLine text={s.copy} /> : null}
        </li>
      ))}
    </ol>
  );
}

/** How to let Ollama accept this website, with a switch between Windows, macOS and Linux. */
export function OllamaOriginsFix() {
  const detected = detectOs();
  const [os, setOs] = useState<LocalOs>(detected === 'other' ? 'windows' : detected);
  const origin = siteOrigin();
  const fixes = ollamaOriginsFix(origin);
  const fix = fixes.find((f) => f.os === os) ?? fixes[0];
  return (
    <div className="ai-origins" data-os={fix.os}>
      <p className="ai-origins-lead">
        Tell Ollama to accept this website, <code>{origin}</code>, by setting <code>OLLAMA_ORIGINS</code> and restarting Ollama.
      </p>
      <div className="ai-os" role="group" aria-label="Your computer">
        {fixes.map((f) => (
          <button key={f.os} type="button" className={`btn btn-sm ${f.os === fix.os ? 'is-on' : ''}`} aria-pressed={f.os === fix.os} onClick={() => setOs(f.os)}>
            {f.label}{f.os === detected ? ' (this computer)' : ''}
          </button>
        ))}
      </div>
      <FixList steps={fix.steps} />
      <p className="help">
        Type the address exactly, with no path and no spaces. Only add websites you trust: any website listed there can use your Ollama. If OLLAMA_ORIGINS already lists other addresses, separate them with commas and no spaces.
      </p>
    </div>
  );
}

const STATUS_LABEL: Record<StepStatus, string> = { pending: 'Not checked yet', running: 'Checking', ok: 'Passed', fail: 'Failed', warn: 'Check this', skip: 'Skipped' };

function StepRow({ step, children }: { step: LocalStep; children?: ReactNode }) {
  return (
    <li className="ai-check-step" data-step={step.id} data-status={step.status}>
      <span className="ai-check-icon" aria-hidden="true" />
      <div className="ai-check-body">
        <div className="ai-check-title">
          {step.title} <span className="sr-only">({STATUS_LABEL[step.status]})</span>
        </div>
        {step.detail ? <div className="ai-check-detail">{step.detail}</div> : null}
        {step.fix?.length ? <FixList steps={step.fix} /> : null}
        {step.showOriginsFix ? <OllamaOriginsFix /> : null}
        {children}
      </div>
    </li>
  );
}

function setupSteps(kind: ReturnType<typeof localKind>, model: string) {
  if (kind === 'ollama')
    return (
      <ol>
        <li>
          Install Ollama from <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer">ollama.com</a> and open it.
        </li>
        <li>
          Download the model once (about 2 GB for llama3.2), in a terminal:
          <CopyLine text={pullCommand(model)} />
        </li>
        <li>
          Let Ollama accept this website (<code>{siteOrigin()}</code>). Test connection shows the exact steps for your computer if this is still needed.
        </li>
        <li>In Chrome or Edge, if the browser asks whether this site may connect to apps or devices on your computer, click <b>Allow</b>.</li>
        <li>Click <b>Test connection</b>.</li>
      </ol>
    );
  if (kind === 'lmstudio')
    return (
      <ol>
        <li>In LM Studio, download and load a model.</li>
        {lmStudioCorsFix().slice(0, 3).map((s, i) => <li key={i}>{s.text}</li>)}
        <li>In Chrome or Edge, if the browser asks whether this site may connect to apps or devices on your computer, click <b>Allow</b>.</li>
        <li>Click <b>Test connection</b>. It lists the loaded models so you can pick one.</li>
      </ol>
    );
  return (
    <ol>
      <li>Start the program and note its address (ending in /v1) and model name.</li>
      <li>Turn on CORS in the program and allow <code>{siteOrigin()}</code>.</li>
      <li>Click <b>Test connection</b>.</li>
    </ol>
  );
}

/** Set-up steps and the guided connection check for a program on this computer. */
export function LocalSetup({ onConnected }: { onConnected?: (reply: string) => void }) {
  const o = getAiSettings().openai;
  const kind = localKind(o.preset, o.baseUrl);
  const [result, setResult] = useState<LocalCheckResult | null>(null);
  const [running, setRunning] = useState(false);
  const [streamed, setStreamed] = useState('');
  const [copied, setCopied] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const advice = addressAdvice(o.baseUrl, kind);

  useEffect(() => () => abort.current?.abort(), []);
  // A different address or program makes an earlier result stale (a model switch keeps the list).
  useEffect(() => {
    abort.current?.abort();
    setResult(null);
  }, [o.baseUrl, o.preset, o.apiKey]);

  const run = async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setRunning(true);
    setStreamed('');
    const cfg = getAiSettings().openai;
    try {
      const r = await runLocalCheck(cfg, { signal: ctrl.signal, onUpdate: (x) => !ctrl.signal.aborted && setResult(x), onText: (t) => !ctrl.signal.aborted && setStreamed(t) });
      if (ctrl.signal.aborted) return;
      setResult(r);
      if (r.ok) onConnected?.(r.reply);
    } catch {
      /* stopped */
    } finally {
      if (abort.current === ctrl) setRunning(false);
    }
  };

  const copyDetails = async () => {
    setCopied(await copyToClipboard(localDiagnostics(getAiSettings().openai, result)));
    setTimeout(() => setCopied(false), 2000);
  };

  const models = result?.models ?? [];
  const pickValue = result?.matchedModel ?? (models.some((m) => m.id === o.model) ? o.model : '');

  return (
    <section className="stack ai-local" aria-label="Program on this computer">
      {detectBrowser().family === 'safari' ? <div className="callout callout-warn ai-local-safari">{SAFARI_LOCAL_BLOCKED}</div> : null}
      {advice ? (
        <div className="callout callout-warn ai-local-advice">
          {advice.why}{' '}
          {advice.suggested ? (
            <button type="button" className="btn btn-sm" onClick={() => saveAiSettings({ openai: { ...getAiSettings().openai, baseUrl: advice.suggested } })}>
              Use {advice.suggested}
            </button>
          ) : null}
        </div>
      ) : null}
      <details className="ai-steps ai-local-steps" open={!result?.ok}>
        <summary>
          <b>{kind === 'ollama' ? 'Set up Ollama' : kind === 'lmstudio' ? 'Set up LM Studio' : 'Set up the program'}</b>
        </summary>
        {setupSteps(kind, o.model)}
      </details>

      <div className="row ai-local-actions">
        <button type="button" className="btn btn-primary" disabled={running} onClick={run}>
          {running ? 'Testing…' : 'Test connection'}
        </button>
        {running ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => abort.current?.abort()}>Stop</button> : null}
        <span className="spacer" />
        <button type="button" className="btn btn-sm btn-ghost" onClick={copyDetails} title="Copy a report of this check (without your key) to paste into a help request">
          {copied ? 'Copied' : 'Copy details'}
        </button>
      </div>

      {result ? (
        <ol className="ai-check" aria-label="Connection check" aria-live="polite">
          {result.steps.map((s) => (
            <StepRow key={s.id} step={s}>
              {s.id === 'model' && models.length ? (
                <div className="field ai-local-pick">
                  <label htmlFor="ai-local-model">Installed models</label>
                  <select
                    id="ai-local-model"
                    className="select mono"
                    value={pickValue}
                    onChange={(e) => {
                      saveAiSettings({ openai: { ...getAiSettings().openai, model: e.target.value } });
                      void run();
                    }}
                  >
                    {pickValue ? null : <option value="">Choose a model…</option>}
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id}{m.size ? ` (${(m.size / 1e9).toFixed(1)} GB)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {s.id === 'answer' && s.status === 'running' && streamed ? <div className="ai-check-detail mono">{streamed.slice(0, 80)}</div> : null}
            </StepRow>
          ))}
        </ol>
      ) : (
        <p className="help">Test connection checks, one by one: {Object.values(STEP_TITLES).map((t) => t.replace(/\?$/, '').toLowerCase()).join('; ')}.</p>
      )}
      {result?.suggestedBaseUrl ? (
        <div className="callout callout-warn ai-local-switch">
          The program answered at {result.suggestedBaseUrl}, not at the address above.{' '}
          <button type="button" className="btn btn-sm" onClick={() => saveAiSettings({ openai: { ...getAiSettings().openai, baseUrl: result.suggestedBaseUrl! } })}>
            Use {result.suggestedBaseUrl}
          </button>
        </div>
      ) : null}
      {result?.ok ? <p className="ai-ok" role="status">Connected. {kind === 'ollama' ? 'Ollama' : kind === 'lmstudio' ? 'LM Studio' : 'The program'} answered with {result.matchedModel ?? o.model}.</p> : null}
    </section>
  );
}
