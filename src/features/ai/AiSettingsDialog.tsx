// "AI assistant" settings: choose where AI help runs (Claude inside the artifact, a model on this
// computer, Google Gemini with a free key, or another OpenAI-compatible service), enter keys, test the
// connection, and read what each choice means for participants' privacy.
// Settings are saved in this browser as you type; they never go into project files or exports.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Modal } from '../../ui/Modal';
import {
  GEMINI_KEY_URL, OPENAI_PRESETS, aiErrorText, claudePresent, effectiveProvider, forgetAiKey, getAiSettings, refreshAiStatus, saveAiSettings, subscribeAiSettings, testAiConnection,
  type AiProviderId, type OpenAiPreset,
} from '../../platform/ai';
import { WEBLLM_IN_BUILD, WEBLLM_MODELS, deleteWebLlmModel, detectWebGpu, prepareWebLlm, type WebGpuStatus } from '../../platform/ai-webllm';
import { lastResolvedGeminiModel, normaliseBaseUrl } from '../../platform/ai-http';
import { AiPrivacyNotice } from './AiBits';
import { useAiSettingsDialog, useAiStatus, useWebLlmState } from './hooks';
import { AI_FEATURES, aiFeature, isAiFeatureId, runAiFeature, type AiFeatureId } from './features';
import { useExplain } from './explainStore';
import './ai.css';

interface Choice {
  id: AiProviderId;
  title: string;
  tag?: string;
  pros: string;
  cons: string;
}

function choices(): Choice[] {
  const list: Choice[] = [];
  if (claudePresent())
    list.push({ id: 'claude', title: 'Claude', tag: 'Built in here', pros: 'Nothing to set up: uses your Claude account.', cons: 'Excerpts go to Anthropic under your Claude plan.' });
  if (WEBLLM_IN_BUILD)
    list.push({ id: 'webllm', title: 'On this computer', tag: 'Free, private', pros: 'Nothing leaves your computer. Works offline after a one-time download.', cons: 'Downloads 1 to 2 GB, needs a recent Chrome or Edge, and is slower and less accurate than online models.' });
  list.push({ id: 'gemini', title: 'Google Gemini', tag: 'Free key', pros: 'Good quality and fast. The key is free with a Google account.', cons: 'Excerpts go to Google, which may use free-tier data to improve its products.' });
  list.push({ id: 'openai', title: 'Other service', tag: 'Advanced', pros: 'Groq, OpenRouter, or a model on your own computer (Ollama, LM Studio).', cons: 'Needs a key or a local setup. Check each service\'s terms.' });
  return list;
}

export function AiSettingsHost() {
  const open = useAiSettingsDialog((s) => s.open);
  const intent = useAiSettingsDialog((s) => s.intent);
  const set = useAiSettingsDialog((s) => s.set);
  return open ? <AiSettingsDialog intent={isAiFeatureId(intent) ? intent : null} onClose={() => set(false)} /> : null;
}

type TestState = { phase: 'idle' } | { phase: 'running' } | { phase: 'ok'; reply: string } | { phase: 'error'; message: string };

export function AiSettingsDialog({ onClose, intent = null }: { onClose: () => void; intent?: AiFeatureId | null }) {
  const settings = useSyncExternalStore(subscribeAiSettings, getAiSettings, getAiSettings);
  const status = useAiStatus();
  const provider = effectiveProvider(settings);
  const [test, setTest] = useState<TestState>({ phase: 'idle' });
  const testAbort = useRef<AbortController | null>(null);
  const list = choices();

  useEffect(() => () => testAbort.current?.abort(), []);
  // Any change to the settings makes an earlier test result stale.
  // Clear an old test result when the set-up changes (but not when the model switches to automatic
  // on its own after a retired model name, which happens during a successful test).
  const setupKey = JSON.stringify({ ...settings, gemini: { apiKey: settings.gemini.apiKey } });
  useEffect(() => setTest({ phase: 'idle' }), [setupKey]);

  const choose = (id: AiProviderId) => saveAiSettings({ provider: id });

  const runTest = async () => {
    testAbort.current?.abort();
    const ctrl = new AbortController();
    testAbort.current = ctrl;
    setTest({ phase: 'running' });
    try {
      const reply = await testAiConnection(ctrl.signal);
      setTest({ phase: 'ok', reply });
      void refreshAiStatus();
    } catch (e) {
      setTest({ phase: 'error', message: aiErrorText(e) });
    }
  };

  const canTest = status.ready === 'yes';

  return (
    <Modal
      title="AI assistant"
      subtitle="Optional help: ask the Socius assistant, explain a result in plain language, suggest a codebook, suggest codes for open-ended answers, summarise a code. Nothing is sent until you click a button that asks the AI."
      size="wide"
      onClose={() => {
        testAbort.current?.abort();
        onClose();
      }}
      footer={
        <>
          <span className="help">Saved in this browser only, never in project files.</span>
          <span className="spacer" />
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </>
      }
    >
      <div className="stack ai-settings">
        {intent ? (
          <div className="callout callout-info ai-intent" role="note">
            <b>{aiFeature(intent).label}</b> needs AI help, which is not set up yet. Once it is, {aiFeature(intent).label} {aiFeature(intent).does} Choose an option below, then click Test connection.
          </div>
        ) : null}
        <fieldset className="ai-choices">
          <legend className="eyebrow">Where should the AI run?</legend>
          {list.map((c) => (
            <label key={c.id} className={`ai-choice ${provider === c.id ? 'is-on' : ''}`}>
              <input type="radio" name="ai-provider" value={c.id} checked={provider === c.id} onChange={() => choose(c.id)} />
              <span className="ai-choice-body">
                <span className="ai-choice-title">
                  {c.title}
                  {c.tag ? <span className={`badge ${c.id === 'webllm' ? 'badge-good' : ''}`}>{c.tag}</span> : null}
                </span>
                <span className="ai-choice-line"><b>Good:</b> {c.pros}</span>
                <span className="ai-choice-line"><b>But:</b> {c.cons}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {provider === 'claude' ? <p className="help">No set-up needed. Claude's usage limits for your account apply.</p> : null}
        {provider === 'webllm' ? <WebLlmSection /> : null}
        {provider === 'gemini' ? <GeminiSection /> : null}
        {provider === 'openai' ? <OpenAiSection /> : null}
        {!provider ? <p className="help">Choose an option above. Everything else in Socius works without AI.</p> : null}

        <AiPrivacyNotice provider={provider} host={provider === 'openai' ? hostLabel(settings.openai.baseUrl) : undefined} />

        {provider ? (
          <div className="ai-test row">
            <button className="btn" disabled={!canTest || test.phase === 'running'} onClick={runTest} title={canTest ? 'Send a one-word test message' : 'Finish the set-up above first'}>
              {test.phase === 'running' ? 'Testing…' : 'Test connection'}
            </button>
            {test.phase === 'running' ? <button className="btn btn-ghost btn-sm" onClick={() => testAbort.current?.abort()}>Stop</button> : null}
            <span className="ai-test-result" role="status" aria-live="polite">
              {test.phase === 'ok' ? (
                <span className="ai-ok">
                  Connected{provider === 'gemini' ? ` to ${settings.gemini.model || lastResolvedGeminiModel(settings.gemini.apiKey) || 'Gemini'}` : ''}. The AI answered{test.reply ? `: "${test.reply.slice(0, 40)}"` : ''}.
                </span>
              ) : null}
              {test.phase === 'error' ? <span className="text-bad">{test.message}</span> : null}
              {test.phase === 'idle' && !canTest && status.ready === 'no' ? <span className="help">Finish the set-up above, then test it.</span> : null}
            </span>
          </div>
        ) : null}
        {test.phase === 'ok' ? <ReadyPanel intent={intent} onClose={onClose} /> : null}
        <p className="help">
          AI suggestions are a starting point for your own reading, not findings. Check every suggested code and quote against the data, and report in your methods section that AI assistance was used and how.
        </p>
      </div>
    </Modal>
  );
}

/** After a successful test: one button per AI feature that closes settings and starts it. */
function ReadyPanel({ intent, onClose }: { intent: AiFeatureId | null; onClose: () => void }) {
  const list = intent ? [aiFeature(intent), ...AI_FEATURES.filter((f) => f.id !== intent)] : AI_FEATURES;
  return (
    <section className="ai-ready" aria-label="AI is ready">
      <span className="ai-ready-title">AI is ready. Try it:</span>
      <div className="ai-ready-actions">
        {list.map((f, i) => (
          <button
            key={f.id}
            type="button"
            className={`btn btn-sm ${i === 0 ? 'btn-primary' : ''}`}
            title={f.does.charAt(0).toUpperCase() + f.does.slice(1)}
            onClick={() => {
              if (f.id !== 'explain') useExplain.getState().setPending(null);
              onClose();
              void runAiFeature(f.id);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <span className="help">Each one shows what will be sent before anything goes to the AI.</span>
    </section>
  );
}

function hostLabel(url: string): string {
  try {
    return new URL(normaliseBaseUrl(url)).host;
  } catch {
    return '';
  }
}

function KeyField({ id, value, onChange, placeholder, optional }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; optional?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>API key{optional ? ' (if the service needs one)' : ''}</label>
      <div className="row ai-key-row">
        <input
          id={id}
          className="input mono"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="button" className="btn btn-sm" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-controls={id}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

function GeminiSection() {
  const s = getAiSettings();
  return (
    <section className="stack ai-section" aria-label="Google Gemini set-up">
      <div className="ai-steps">
        <b>Get a free key in 1 minute</b>
        <ol>
          <li>
            Open{' '}
            <a href={GEMINI_KEY_URL} target="_blank" rel="noopener noreferrer">Google AI Studio</a>{' '}
            and sign in with a Google account.
          </li>
          <li>Click <b>Create API key</b> (accept the terms if asked).</li>
          <li>Copy the key and paste it below. It stays in this browser.</li>
        </ol>
      </div>
      <div className="ai-grid">
        <KeyField id="ai-gemini-key" value={s.gemini.apiKey} onChange={(v) => saveAiSettings({ gemini: { ...s.gemini, apiKey: v } })} placeholder="Paste your key" />
        <div className="field">
          <label htmlFor="ai-gemini-model">Model</label>
          <input id="ai-gemini-model" className="input mono" value={s.gemini.model} placeholder="Automatic" onChange={(e) => saveAiSettings({ gemini: { ...s.gemini, model: e.target.value.trim() } })} spellCheck={false} />
          <span className="help">
            Leave empty and Socius picks the newest free Flash model your key can use
            {lastResolvedGeminiModel(s.gemini.apiKey) ? ` (now ${lastResolvedGeminiModel(s.gemini.apiKey)})` : ''}. Google retires old model names, so only type one if you need a specific model.
          </span>
        </div>
      </div>
      {s.gemini.apiKey ? (
        <div className="row">
          <button className="btn btn-sm btn-ghost" onClick={() => forgetAiKey('gemini')}>Forget key</button>
          <span className="help">Removes the key from this browser. Use this on a shared computer.</span>
        </div>
      ) : null}
    </section>
  );
}

function OpenAiSection() {
  const s = getAiSettings();
  const o = s.openai;
  const preset = OPENAI_PRESETS[o.preset];
  const setPreset = (p: OpenAiPreset) => {
    const info = OPENAI_PRESETS[p];
    saveAiSettings({ openai: { ...o, preset: p, baseUrl: info.baseUrl || o.baseUrl, model: info.model || (p === 'custom' ? o.model : '') } });
  };
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(o.baseUrl);
  return (
    <section className="stack ai-section" aria-label="Other service set-up">
      <div className="ai-grid">
        <div className="field">
          <label htmlFor="ai-oa-preset">Service</label>
          <select id="ai-oa-preset" className="select" value={o.preset} onChange={(e) => setPreset(e.target.value as OpenAiPreset)}>
            {(Object.keys(OPENAI_PRESETS) as OpenAiPreset[]).map((k) => <option key={k} value={k}>{OPENAI_PRESETS[k].label}</option>)}
          </select>
          <span className="help">
            {preset.note}
            {preset.keyUrl ? <> <a href={preset.keyUrl} target="_blank" rel="noopener noreferrer">Get a key</a>.</> : null}
          </span>
        </div>
        <div className="field">
          <label htmlFor="ai-oa-url">Base URL</label>
          <input id="ai-oa-url" className="input mono" value={o.baseUrl} onChange={(e) => saveAiSettings({ openai: { ...o, baseUrl: e.target.value.trim() } })} placeholder="https://.../v1" spellCheck={false} />
        </div>
        <KeyField id="ai-oa-key" value={o.apiKey} onChange={(v) => saveAiSettings({ openai: { ...o, apiKey: v } })} optional={local} />
        <div className="field">
          <label htmlFor="ai-oa-model">Model</label>
          <input id="ai-oa-model" className="input mono" value={o.model} onChange={(e) => saveAiSettings({ openai: { ...o, model: e.target.value.trim() } })} placeholder="model name" spellCheck={false} />
        </div>
      </div>
      {o.apiKey ? (
        <div className="row">
          <button className="btn btn-sm btn-ghost" onClick={() => forgetAiKey('openai')}>Forget key</button>
          <span className="help">Removes the key from this browser.</span>
        </div>
      ) : null}
    </section>
  );
}

function WebLlmSection() {
  const s = getAiSettings();
  const status = useAiStatus();
  const load = useWebLlmState();
  const [gpu, setGpu] = useState<WebGpuStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

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
    try {
      await prepareWebLlm(s.webllm.model, ctrl.signal);
    } catch (e: any) {
      if (e?.code !== 'cancelled') setErr(aiErrorText(e));
    } finally {
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

  return (
    <section className="stack ai-section" aria-label="On-device model set-up">
      <div className="ai-gpu" data-ok={gpu ? String(gpu.ok) : 'unknown'}>
        {!gpu ? (
          <span className="help">Checking whether this browser can run a model…</span>
        ) : gpu.ok ? (
          <span className="ai-ok">This browser supports WebGPU, so it can run the model.</span>
        ) : (
          <div className="callout callout-warn">
            <b>This browser cannot run the on-device model.</b>{' '}
            {gpu.reason === 'no_adapter'
              ? 'It has WebGPU, but no usable graphics chip was found (it may be turned off, or the computer is too old).'
              : 'It needs WebGPU, which this browser does not offer.'}{' '}
            Use a recent Chrome or Edge on a Windows, Mac or ChromeOS desktop or laptop (Safari and Firefox support is still limited, and phones usually lack the memory). Or choose <b>Google Gemini</b> above, with anonymised excerpts.
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
              <span className="ai-choice-line">{m.detail} Needs about {Math.round(m.vramMB / 100) / 10} GB of graphics memory.</span>
            </span>
          </label>
        ))}
      </fieldset>
      {gpu?.ok ? (
        <div className="stack" style={{ gap: 6 }}>
          <div className="row">
            {status.modelCached ? (
              <>
                <span className="ai-ok">Downloaded. The model loads from this browser's cache.</span>
                <span className="spacer" />
                <button className="btn btn-sm btn-ghost" disabled={loading} onClick={remove}>Remove downloaded model</button>
              </>
            ) : (
              <>
                <button className="btn" disabled={loading} onClick={download}>Download model ({chosen.download})</button>
                <span className="help">One time only. The browser keeps it for next time. You can also skip this: the first AI request downloads it.</span>
              </>
            )}
          </div>
          {loading ? (
            <div className="ai-progress" aria-live="polite">
              <div className="row">
                <span className="help">{pct < 100 ? `Downloading and preparing: ${pct}%` : 'Almost ready…'}</span>
                <span className="spacer" />
                <button className="btn btn-sm" onClick={() => abort.current?.abort()} disabled={!abort.current}>Cancel</button>
              </div>
              <div className="ai-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Model download">
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>
          ) : null}
          {load.phase === 'ready' && load.modelId ? <span className="help">The model is loaded and ready.</span> : null}
          {err ? <div className="callout callout-bad">{err}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
