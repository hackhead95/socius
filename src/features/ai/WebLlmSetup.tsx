// AI assistant settings > On this computer: whether this browser can run the on-device model (and
// exactly why not), the model choice, and the one-time download with progress, cancel and retry.

import { useEffect, useRef, useState } from 'react';
import { aiErrorText, getAiSettings, refreshAiStatus, saveAiSettings } from '../../platform/ai';
import {
  WEBLLM_MODELS, deleteWebLlmModel, describeWebLlmProgress, detectWebGpu, deviceMemoryGB, prepareWebLlm, requestPersistentStorage, storageFreeMB, suggestSmallerModel, type WebGpuStatus,
} from '../../platform/ai-webllm';
import { detectBrowser, detectOs } from '../../platform/ai-local';
import { useAiStatus, useWebLlmState } from './hooks';
import './ai-local.css';

const SITE = 'https://hackhead95.github.io/socius/';

/** Why this browser cannot run the model, in plain words, for each detection result. */
export function gpuProblem(gpu: WebGpuStatus, browser = detectBrowser(), os = detectOs()): string {
  const linux = os === 'linux' ? ' On Linux, the most reliable choice is Ollama on this computer (under Other service).' : '';
  const settingsPath = browser.name === 'Edge' ? 'edge://settings/system' : 'chrome://settings/system';
  const gpuPage = browser.name === 'Edge' ? 'edge://gpu' : 'chrome://gpu';
  switch (gpu.reason) {
    case 'insecure':
      return `This page was not opened over a secure address (https), and browsers only offer WebGPU on secure pages. Open Socius at ${SITE}.`;
    case 'no_api':
      if (browser.family === 'firefox') return `Firefox offers WebGPU on Windows (version 141 and later) and recent macOS, not yet on Linux. Use a recent Chrome or Edge on Windows or macOS.${linux}`;
      if (browser.family === 'safari') return 'Safari offers WebGPU from Safari 26 (macOS 26 Tahoe) on. Update Safari, or use a recent Chrome or Edge.';
      if (browser.family === 'chromium' && browser.version > 0 && browser.version < 113) return `This version of ${browser.name} (${browser.version}) is too old for WebGPU. Update it (version 113 or later).`;
      return `This browser does not offer WebGPU, or it has been turned off (in chrome://flags, or by your organisation). Use a recent Chrome or Edge.${linux}`;
    case 'no_adapter':
      return `This browser has WebGPU, but did not offer a graphics chip to use. Usually: graphics acceleration is turned off (${settingsPath}, "Use graphics acceleration when available"), the graphics driver is on the browser's block list (open ${gpuPage} and look at the WebGPU line), or your organisation has turned it off. Update the graphics driver, turn graphics acceleration on, and restart the browser.${os === 'linux' ? ' Chrome on Linux offers WebGPU only for some graphics chips (recent Intel, or NVIDIA on Wayland).' : ''}${linux}`;
    case 'limits':
      return `The graphics chip is too limited for the model (${gpu.detail ?? 'limits too low'}). Try another computer, or update the graphics driver.`;
    case 'error':
      return `The browser could not open the graphics chip (${gpu.detail ?? 'unknown error'}). Restart the browser and try again.`;
    case 'build':
      return 'The on-device model is not part of this version of Socius.';
    default:
      return '';
  }
}

export function WebLlmSetup() {
  const s = getAiSettings();
  const status = useAiStatus();
  const load = useWebLlmState();
  const [gpu, setGpu] = useState<WebGpuStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [freeMB, setFreeMB] = useState<number | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    let alive = true;
    void storageFreeMB().then((m) => alive && setFreeMB(m));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void detectWebGpu().then((g) => alive && setGpu(g));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => () => abort.current?.abort(), []);

  const download = async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setErr(null);
    void requestPersistentStorage();
    try {
      await prepareWebLlm(s.webllm.model, ctrl.signal);
    } catch (e: any) {
      if (e?.code !== 'cancelled') setErr(aiErrorText(e));
    } finally {
      // The 16-bit check may have changed during loading.
      void detectWebGpu().then(setGpu);
      void refreshAiStatus();
    }
  };

  const remove = async () => {
    setErr(null);
    try {
      await deleteWebLlmModel(s.webllm.model);
    } catch (e) {
      setErr(aiErrorText(e));
    }
    void refreshAiStatus();
  };

  const loading = load.phase === 'loading';
  const pct = Math.round(load.progress * 100);
  const chosen = WEBLLM_MODELS.find((m) => m.id === s.webllm.model) ?? WEBLLM_MODELS[0];
  const mem = deviceMemoryGB();
  const f16 = gpu?.f16 ?? true;

  return (
    <section className="stack ai-section" aria-label="On-device model set-up">
      <div className="ai-gpu" data-ok={gpu ? String(gpu.ok) : 'unknown'} data-reason={gpu?.reason ?? ''}>
        {!gpu ? (
          <span className="help">Checking whether this browser can run a model…</span>
        ) : gpu.ok && gpu.software ? (
          <div className="callout callout-warn">
            <b>Only a software graphics adapter is available.</b> The model would run on the processor instead of a graphics chip, which is very slow (minutes per answer). Turn on graphics acceleration in the browser settings and restart it, or choose <b>Google Gemini</b> above.
          </div>
        ) : gpu.ok ? (
          <span className="ai-ok">This browser supports WebGPU, so it can run the model{gpu.adapter ? ` (graphics chip: ${gpu.adapter})` : ''}.</span>
        ) : (
          <div className="callout callout-warn">
            <b>This browser cannot run the on-device model.</b> {gpuProblem(gpu)} Or choose <b>Google Gemini</b> above, with anonymised excerpts.
          </div>
        )}
      </div>
      <fieldset className="ai-models">
        <legend className="eyebrow">Model</legend>
        {WEBLLM_MODELS.map((m) => (
          <label key={m.id} className={`ai-choice ai-choice-sm ${s.webllm.model === m.id ? 'is-on' : ''}`}>
            <input type="radio" name="ai-webllm-model" checked={s.webllm.model === m.id} disabled={loading} onChange={() => saveAiSettings({ webllm: { model: m.id } })} />
            <span className="ai-choice-body">
              <span className="ai-choice-title">{m.label} <span className="badge">download {m.download}</span></span>
              <span className="ai-choice-line">{m.detail} Needs about {Math.round((f16 ? m.vramMB : m.vramMB32) / 100) / 10} GB of graphics memory.</span>
            </span>
          </label>
        ))}
      </fieldset>
      {gpu?.ok && suggestSmallerModel(s.webllm.model, mem) ? (
        <div className="callout callout-info ai-lowmem">
          This computer reports about {mem} GB of memory. <b>{WEBLLM_MODELS[0].label}</b> is more likely to work on it.{' '}
          <button type="button" className="btn btn-sm" disabled={loading} onClick={() => saveAiSettings({ webllm: { model: WEBLLM_MODELS[0].id } })}>Use {WEBLLM_MODELS[0].label}</button>
        </div>
      ) : null}
      {gpu?.ok && !status.modelCached && freeMB !== null && freeMB < (f16 ? chosen.vramMB : chosen.vramMB32) * 1.2 ? (
        <div className="callout callout-warn ai-storage">
          The browser can store only about {Math.round(freeMB / 100) / 10} GB more for this site, which may not be enough for this model. Free some disk space, or use a normal window (private windows allow very little).
        </div>
      ) : null}
      {gpu?.ok ? (
        <div className="stack" style={{ gap: 6 }}>
          <div className="row">
            {status.modelCached ? (
              <>
                <span className="ai-ok">Downloaded. The model loads from this browser's storage.</span>
                <span className="spacer" />
                <button className="btn btn-sm btn-ghost" disabled={loading} onClick={remove}>Remove downloaded model</button>
              </>
            ) : (
              <>
                <button className="btn" disabled={loading} onClick={download}>{err ? 'Try the download again' : `Download model (${chosen.download})`}</button>
                <span className="help">One time only. The browser keeps it for next time. You can also skip this: the first AI request downloads it.</span>
              </>
            )}
          </div>
          {loading ? (
            <div className="ai-progress" aria-live="polite">
              <div className="row">
                <span className="help ai-progress-text">{describeWebLlmProgress(load)}</span>
                <span className="spacer" />
                <button className="btn btn-sm" onClick={() => abort.current?.abort()} disabled={!abort.current}>Cancel</button>
              </div>
              <div className="ai-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Model download">
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>
          ) : null}
          {load.phase === 'ready' && load.modelId ? <span className="help">The model is loaded and ready.</span> : null}
          {err ? <div className="callout callout-bad" role="alert">{err}</div> : null}
          {gpu ? (
            <details className="help">
              <summary>Technical details</summary>
              <ul className="ai-gpu-facts">
                <li>Graphics chip: {gpu.adapter || 'not named by the browser'}{gpu.software ? ' (software)' : ''}</li>
                <li>16-bit shaders: {gpu.f16 ? 'yes' : 'no, so the 32-bit model files are used'}</li>
                <li>Memory reported by the browser: {mem ? `${mem} GB` : 'not reported'}</li>
                <li>Storage available to this site: {freeMB !== null ? `about ${Math.round(freeMB / 100) / 10} GB` : 'not reported'}</li>
                <li>Files come from huggingface.co (model) and raw.githubusercontent.com (program).</li>
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
