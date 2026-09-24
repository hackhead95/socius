// API keys: kept in this tab (sessionStorage) unless "Remember this key on this computer" is ticked
// (localStorage, which every site on hackhead95.github.io can read); keys saved by earlier versions keep
// working and show as remembered; the "Automatic: Flash" setting of earlier versions becomes Flash-Lite
// once, with a note; keys never reach the error log or reports.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AI_SESSION_KEYS, AI_SETTINGS_KEY, __reloadAiSettings, dismissAiNotice, forgetAiKey, getAiSettings, parseAiSettings, saveAiSettings, setRememberKey, storedAiSettings,
} from '../../src/platform/ai';
import { aiErrorReport } from '../../src/platform/ai-diagnose';
import { __resetErrorLogForTests, formatReport, getLog, logError } from '../../src/platform/errorlog';
import { memoryStorage } from './helpers';

const KEY = 'AQ.Ab8RN6LsecretKeyForTests_abcdefghijklmnopqrstuvwxyz0123';
let local: ReturnType<typeof memoryStorage>;
let session: ReturnType<typeof memoryStorage>;

beforeEach(() => {
  local = memoryStorage();
  session = memoryStorage();
  vi.stubGlobal('localStorage', local);
  vi.stubGlobal('sessionStorage', session);
  __reloadAiSettings();
  __resetErrorLogForTests();
});

afterEach(() => vi.unstubAllGlobals());

const storedKey = () => JSON.parse(local.data.get(AI_SETTINGS_KEY) ?? '{}').gemini?.apiKey;

describe('where keys are kept', () => {
  it('a new key stays in this tab only by default (not in localStorage)', () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: KEY, model: '' } });
    expect(getAiSettings().remember.gemini).toBe(false);
    expect(storedKey()).toBe('');
    expect(local.data.get(AI_SETTINGS_KEY)).not.toContain(KEY);
    expect(JSON.parse(session.data.get(AI_SESSION_KEYS)!).gemini).toBe(KEY);
    // A reload of the same tab keeps it.
    __reloadAiSettings();
    expect(getAiSettings().gemini.apiKey).toBe(KEY);
    // A new tab (empty sessionStorage) does not have it.
    vi.stubGlobal('sessionStorage', memoryStorage());
    __reloadAiSettings();
    expect(getAiSettings().gemini.apiKey).toBe('');
    expect(getAiSettings().provider).toBe('gemini');
  });

  it('"Remember this key" keeps it in localStorage; unticking removes it from there', () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: KEY, model: '' } });
    setRememberKey('gemini', true);
    expect(storedKey()).toBe(KEY);
    vi.stubGlobal('sessionStorage', memoryStorage());
    __reloadAiSettings();
    expect(getAiSettings().gemini.apiKey).toBe(KEY);
    expect(getAiSettings().remember.gemini).toBe(true);
    setRememberKey('gemini', false);
    expect(storedKey()).toBe('');
    expect(getAiSettings().gemini.apiKey).toBe(KEY); // still usable in this tab
  });

  it('keys saved by earlier versions keep working and show as remembered', () => {
    local.setItem(AI_SETTINGS_KEY, JSON.stringify({ provider: 'gemini', gemini: { apiKey: KEY, model: '' }, openai: { preset: 'groq', apiKey: 'gsk_old', model: 'm' } }));
    __reloadAiSettings();
    const s = getAiSettings();
    expect(s.gemini.apiKey).toBe(KEY);
    expect(s.remember).toEqual({ gemini: true, openai: true });
    // Saving again keeps them where they were.
    saveAiSettings({ provider: 'gemini' });
    expect(storedKey()).toBe(KEY);
    expect(JSON.parse(local.data.get(AI_SETTINGS_KEY)!).v).toBe(2);
  });

  it('Forget key removes it from localStorage and from this tab', () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: KEY, model: '' }, remember: { gemini: true, openai: false } });
    forgetAiKey('gemini');
    expect(storedKey()).toBe('');
    expect(session.data.get(AI_SESSION_KEYS)).toBeUndefined();
    __reloadAiSettings();
    expect(getAiSettings().gemini.apiKey).toBe('');
  });

  it('storedAiSettings leaves out keys that are not remembered', () => {
    const s = parseAiSettings(JSON.stringify({ v: 2, provider: 'openai', openai: { preset: 'groq', apiKey: 'gsk_x', model: 'm' }, remember: { gemini: false, openai: false } }));
    expect(storedAiSettings(s)).toMatchObject({ v: 2, openai: { apiKey: '' } });
  });

  it('keys never reach the error log or error reports', () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: KEY, model: '' } });
    logError('ai', Object.assign(new Error(`request with key ${KEY} failed`), { code: 'invalid_key', detail: `x-goog-api-key: ${KEY}` }));
    expect(formatReport()).not.toContain(KEY);
    expect(aiErrorReport({ code: 'invalid_key', detail: `key=${KEY}` })).not.toContain(KEY);
  });
});

describe('Automatic Flash from earlier versions', () => {
  it('becomes Flash-Lite once, with a note; Flash chosen after the change is kept', () => {
    const old = parseAiSettings(JSON.stringify({ provider: 'gemini', gemini: { apiKey: KEY, model: 'auto-flash' } }));
    expect(old.gemini.model).toBe('');
    expect(old.notice).toBe('flash-to-lite');
    const now = parseAiSettings(JSON.stringify({ v: 2, provider: 'gemini', gemini: { apiKey: KEY, model: 'auto-flash' } }));
    expect(now.gemini.model).toBe('auto-flash');
    expect(now.notice).toBeNull();
  });

  it('the note is dismissed for good; choosing Flash again survives a reload', () => {
    local.setItem(AI_SETTINGS_KEY, JSON.stringify({ provider: 'gemini', gemini: { apiKey: KEY, model: 'auto-flash' } }));
    __reloadAiSettings();
    expect(getAiSettings().notice).toBe('flash-to-lite');
    dismissAiNotice();
    saveAiSettings({ gemini: { ...getAiSettings().gemini, model: 'auto-flash' } });
    __reloadAiSettings();
    expect(getAiSettings().notice).toBeNull();
    expect(getAiSettings().gemini.model).toBe('auto-flash');
  });
});

describe('AI status follows the last check (UI-003) and expected failures are warnings (UI-021)', () => {
  it('a typed key is "not tested"; a failed check is "failed" with the reason; a success is "ok"; a new key is untested again', async () => {
    const ai = await import('../../src/platform/ai');
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: KEY, model: '' } });
    await ai.refreshAiStatus();
    expect(ai.getAiStatus()).toMatchObject({ ready: 'yes', connection: 'untested' });
    ai.recordAiConnection(false, { code: 'invalid_key' });
    expect(ai.getAiStatus()).toMatchObject({ connection: 'failed', connectionError: expect.stringMatching(/did not accept the key/) });
    // A rate limit means the key works; Stop says nothing.
    ai.recordAiConnection(false, { code: 'cancelled' });
    expect(ai.getAiStatus().connection).toBe('failed');
    ai.recordAiConnection(false, { code: 'rate_limited' });
    expect(ai.getAiStatus().connection).toBe('ok');
    // Remembered (as a hash of the set-up, never the key) after a reload.
    expect(local.data.get('socius.ai.check')).not.toContain(KEY);
    __reloadAiSettings();
    await ai.refreshAiStatus();
    expect(ai.getAiStatus().connection).toBe('ok');
    saveAiSettings({ gemini: { apiKey: `${KEY}X`, model: '' } });
    await ai.refreshAiStatus();
    expect(ai.getAiStatus().connection).toBe('untested');
  });

  it('wrong key, no connection or a limit are warnings; malformed requests and unexplained failures are errors', async () => {
    const { aiErrorIsAppFault, logAiError } = await import('../../src/platform/ai');
    for (const code of ['invalid_key', 'network', 'offline', 'rate_limited', 'overloaded', 'region', 'key_not_accepted', 'timeout']) expect(aiErrorIsAppFault({ code }), code).toBe(false);
    for (const code of ['bad_request', 'field_unsupported', 'endpoint_missing', 'unavailable']) expect(aiErrorIsAppFault({ code }), code).toBe(true);
    expect(aiErrorIsAppFault(new TypeError('x'))).toBe(true);
    logAiError(Object.assign(new Error('Could not reach the AI service.'), { code: 'network' }), { op: 'test-connection' });
    expect(getLog()[0]).toMatchObject({ level: 'warn', area: 'ai' });
  });
});
