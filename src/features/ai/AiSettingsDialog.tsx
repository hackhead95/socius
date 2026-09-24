// "AI assistant" settings: choose where AI help runs (Claude inside the artifact, a model on this
// computer, Google Gemini with a free key, or another OpenAI-compatible service), enter keys, test the
// connection, and read what each choice means for participants' privacy.
// Settings are saved in this browser as you type; they never go into project files or exports.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Modal } from '../../ui/Modal';
import {
  GEMINI_AUTO_FLASH, GEMINI_KEY_URL, OPENAI_PRESETS, claudePresent, effectiveProvider, forgetAiKey, getAiSettings, refreshAiStatus, saveAiSettings, subscribeAiSettings,
  type AiProviderId, type OpenAiPreset,
} from '../../platform/ai';
import { runConnectionCheck, type ConnectionCheck } from '../../platform/ai-diagnose';
import { WEBLLM_IN_BUILD } from '../../platform/ai-webllm';
import { isLocalServiceUrl } from '../../platform/ai-local';
import { geminiKeyWarning, geminiModelName, geminiPreference, lastResolvedGeminiModel, normaliseBaseUrl, sanitizeApiKey } from '../../platform/ai-http';
import { ConnectionChecklist } from './ConnectionChecklist';
import { AiPrivacyNotice } from './AiBits';
import { useAiSettingsDialog, useAiStatus } from './hooks';
import { LocalSetup } from './LocalSetup';
import { WebLlmSetup } from './WebLlmSetup';
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

// 'running' / 'done': the step-by-step check (ConnectionChecklist); 'ok': a program on this computer
// answered its own guided check (LocalSetup).
type TestState = { phase: 'idle' } | { phase: 'running'; check: ConnectionCheck | null } | { phase: 'done'; check: ConnectionCheck } | { phase: 'ok'; reply: string };

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
  // Set when a change should be tested at once (a model chosen from the service's list).
  const retestOnChange = useRef(false);
  useEffect(() => {
    if (retestOnChange.current) {
      retestOnChange.current = false;
      void runTest();
    } else {
      testAbort.current?.abort();
      setTest({ phase: 'idle' });
    }
  }, [setupKey]);

  const choose = (id: AiProviderId) => saveAiSettings({ provider: id });

  const runTest = async () => {
    testAbort.current?.abort();
    const ctrl = new AbortController();
    testAbort.current = ctrl;
    setTest({ phase: 'running', check: null });
    const check = await runConnectionCheck({ signal: ctrl.signal, onUpdate: (c) => testAbort.current === ctrl && setTest({ phase: 'running', check: c }) });
    if (testAbort.current !== ctrl) return;
    setTest({ phase: 'done', check });
    if (check.ok) void refreshAiStatus();
  };

  const useModel = (model: string) => {
    retestOnChange.current = true;
    saveAiSettings({ openai: { ...getAiSettings().openai, model } });
  };

  const canTest = status.ready === 'yes';
  const check = test.phase === 'running' || test.phase === 'done' ? test.check : null;
  const connected = test.phase === 'ok' || (test.phase === 'done' && test.check.ok);
  // A program on this computer has its own step-by-step Test connection (LocalSetup).
  const localService = provider === 'openai' && isLocalServiceUrl(settings.openai.baseUrl);

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
        {provider === 'webllm' ? <WebLlmSetup /> : null}
        {provider === 'gemini' ? <GeminiSection onChoiceChange={() => setTest({ phase: 'idle' })} /> : null}
        {provider === 'openai' ? <OpenAiSection onLocalConnected={(reply) => setTest({ phase: 'ok', reply })} /> : null}
        {!provider ? <p className="help">Choose an option above. Everything else in Socius works without AI.</p> : null}

        <AiPrivacyNotice provider={provider} host={provider === 'openai' ? hostLabel(settings.openai.baseUrl) : undefined} />

        {provider && !localService ? (
          <div className="ai-test row">
            <button className="btn" disabled={!canTest || test.phase === 'running'} onClick={runTest} title={canTest ? 'Send a one-word test message' : 'Finish the set-up above first'}>
              {test.phase === 'running' ? 'Testing…' : 'Test connection'}
            </button>
            {test.phase === 'running' ? <button className="btn btn-ghost btn-sm" onClick={() => testAbort.current?.abort()}>Stop</button> : null}
            <span className="ai-test-result" role="status" aria-live="polite">
              {test.phase === 'running' ? <span className="help">Checking step by step…</span> : null}
              {test.phase === 'ok' ? <span className="ai-ok">Connected. The AI answered{test.reply ? `: "${test.reply.slice(0, 40)}"` : ''}.</span> : null}
              {test.phase === 'done' && test.check.ok ? (
                <span className="ai-ok">
                  Connected{test.check.model ? ` to ${test.check.model}` : ''}. The AI answered{test.check.reply ? `: "${test.check.reply.slice(0, 40)}"` : ''}.
                </span>
              ) : null}
              {test.phase === 'done' && !test.check.ok ? (
                <span className="text-bad">{test.check.error?.code === 'cancelled' ? 'Stopped.' : 'Not connected. The steps below show where it failed and what to do.'}</span>
              ) : null}
              {test.phase === 'idle' && !canTest && status.ready === 'no' ? <span className="help">Finish the set-up above, then test it.</span> : null}
            </span>
          </div>
        ) : null}
        {check && !localService ? <ConnectionChecklist check={check} onUseModel={provider === 'openai' ? useModel : undefined} /> : null}
        {connected ? <ReadyPanel intent={intent} onClose={onClose} /> : null}
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

type GeminiChoice = '' | 'auto-flash' | 'custom';

function GeminiSection({ onChoiceChange }: { onChoiceChange?: () => void }) {
  const s = getAiSettings();
  const explicit = geminiModelName(s.gemini.model);
  const [customOpen, setCustomOpen] = useState(!!explicit);
  const choice: GeminiChoice = explicit || customOpen ? 'custom' : geminiPreference(s.gemini.model) === 'flash' ? 'auto-flash' : '';
  const warning = geminiKeyWarning(s.gemini.apiKey);
  const now = lastResolvedGeminiModel(s.gemini.apiKey, geminiPreference(s.gemini.model));
  const setChoice = (c: GeminiChoice) => {
    setCustomOpen(c === 'custom');
    if (c !== 'custom') saveAiSettings({ gemini: { ...s.gemini, model: c === 'auto-flash' ? GEMINI_AUTO_FLASH : '' } });
    onChoiceChange?.();
  };
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
          <li>Copy the key with its copy button (new keys start with <span className="mono">AQ.</span>) and paste it below. It stays in this browser.</li>
        </ol>
      </div>
      <div className="ai-grid">
        <div className="stack" style={{ gap: 4 }}>
          <KeyField id="ai-gemini-key" value={s.gemini.apiKey} onChange={(v) => saveAiSettings({ gemini: { ...s.gemini, apiKey: sanitizeApiKey(v) } })} placeholder="Paste your key" />
          {warning ? <span className="help ai-key-warn" role="note">{warning}</span> : null}
        </div>
        <div className="field">
          <label htmlFor="ai-gemini-choice">Model</label>
          <select id="ai-gemini-choice" className="select" value={choice} onChange={(e) => setChoice(e.target.value as GeminiChoice)}>
            <option value="">Automatic: Flash-Lite (most free requests per day)</option>
            <option value="auto-flash">Automatic: Flash (better answers, fewer free requests)</option>
            <option value="custom">A model I type…</option>
          </select>
          {choice === 'custom' ? (
            <input id="ai-gemini-model" className="input mono" aria-label="Gemini model name" value={explicit} placeholder="for example gemini-3.8-flash" onChange={(e) => saveAiSettings({ gemini: { ...s.gemini, model: e.target.value.trim() } })} spellCheck={false} />
          ) : null}
          <span className="help">
            {choice === 'custom'
              ? 'Google retires old model names; if this one stops working, Socius switches to automatic.'
              : `Socius picks the newest ${choice === 'auto-flash' ? 'Flash' : 'Flash-Lite'} model your key can use${now ? ` (now ${now})` : ''}, and another if that one is not available. Flash-Lite allows many more free requests per day; the Socius assistant and coding suggestions always use it.`}
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

function OpenAiSection({ onLocalConnected }: { onLocalConnected?: (reply: string) => void }) {
  const s = getAiSettings();
  const o = s.openai;
  const preset = OPENAI_PRESETS[o.preset];
  const setPreset = (p: OpenAiPreset) => {
    const info = OPENAI_PRESETS[p];
    saveAiSettings({ openai: { ...o, preset: p, baseUrl: info.baseUrl || o.baseUrl, model: info.model || (p === 'custom' ? o.model : '') } });
  };
  const local = isLocalServiceUrl(o.baseUrl);
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
      {local ? <LocalSetup onConnected={onLocalConnected} /> : null}
    </section>
  );
}
