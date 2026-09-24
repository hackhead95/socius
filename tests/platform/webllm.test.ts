// On-device adapter with a mocked WebLLM engine. (WebGPU and the model download cannot run in the
// headless test browser or in node, so the real engine is not exercised here.)
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WEBLLM_MODELS, __setWebLlmLoader, askWebLlm, deleteWebLlmModel, detectWebGpu, getWebLlmState, isWebLlmCached, prepareWebLlm, resolveModelId, subscribeWebLlm,
} from '../../src/platform/ai-webllm';
import { __reloadAiSettings, askAIJson, refreshAiStatus, saveAiSettings } from '../../src/platform/ai';
import { memoryStorage } from './helpers';

const F16 = { ok: true, reason: null, f16: true } as const;

interface MockOpts {
  /** Chunks the model streams. */
  reply?: string[];
  /** reload(): progress steps, then resolve, or throw this. */
  loadError?: Error;
  /** reload() waits until unload() is called (to test cancelling a download). */
  hang?: boolean;
  cached?: boolean;
}

function mockModule(o: MockOpts = {}) {
  const log: string[] = [];
  const requests: any[] = [];
  let progressCb: ((r: { progress: number; text: string; timeElapsed: number }) => void) | undefined;
  class MLCEngine {
    private release: (() => void) | null = null;
    constructor(cfg: any) {
      progressCb = cfg?.initProgressCallback;
      log.push('new');
    }
    async reload(id: string) {
      log.push(`reload:${id}`);
      progressCb?.({ progress: 0.25, text: 'Fetching param cache[1/4]', timeElapsed: 1 });
      progressCb?.({ progress: 0.75, text: 'Fetching param cache[3/4]', timeElapsed: 2 });
      if (o.hang) await new Promise<void>((r) => (this.release = r));
      if (o.loadError) throw o.loadError;
      progressCb?.({ progress: 1, text: 'Finish loading', timeElapsed: 3 });
    }
    async unload() {
      log.push('unload');
      this.release?.();
    }
    async interruptGenerate() {
      log.push('interrupt');
    }
    chat = {
      completions: {
        create: async (req: any) => {
          requests.push(req);
          const chunks = o.reply ?? ['O', 'K'];
          return (async function* () {
            for (const c of chunks) yield { choices: [{ delta: { content: c } }] };
          })();
        },
      },
    };
  }
  const mod = {
    MLCEngine,
    hasModelInCache: vi.fn(async () => !!o.cached),
    deleteModelAllInfoInCache: vi.fn(async () => undefined),
  };
  return { mod, log, requests };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  __reloadAiSettings();
});

afterEach(() => {
  __setWebLlmLoader(null);
  vi.unstubAllGlobals();
});

describe('model list', () => {
  it('uses model ids that exist in the installed @mlc-ai/web-llm prebuilt config', () => {
    const src = readFileSync('node_modules/@mlc-ai/web-llm/lib/index.js', 'utf8');
    for (const m of WEBLLM_MODELS) {
      expect(src).toContain(`model_id: "${m.id}"`);
      expect(src).toContain(`model_id: "${m.id32}"`);
    }
    expect(WEBLLM_MODELS[0].id).toBe('Qwen2.5-1.5B-Instruct-q4f16_1-MLC');
    expect(WEBLLM_MODELS[1].id).toBe('Llama-3.2-3B-Instruct-q4f16_1-MLC');
  });
});

describe('WebGPU detection', () => {
  it('reports a missing API, a missing adapter, and 16-bit float support', async () => {
    __setWebLlmLoader(null);
    vi.stubGlobal('navigator', {});
    expect(await detectWebGpu()).toEqual({ ok: false, reason: 'no_api', f16: false });
    __setWebLlmLoader(null);
    vi.stubGlobal('navigator', { gpu: { requestAdapter: async () => null } });
    expect(await detectWebGpu()).toEqual({ ok: false, reason: 'no_adapter', f16: false });
    __setWebLlmLoader(null);
    vi.stubGlobal('navigator', { gpu: { requestAdapter: async () => ({ features: new Set(['shader-f16']) }) } });
    expect(await detectWebGpu()).toEqual({ ok: true, reason: null, f16: true });
    expect(await resolveModelId(WEBLLM_MODELS[0].id)).toBe('Qwen2.5-1.5B-Instruct-q4f16_1-MLC');
    __setWebLlmLoader(null);
    vi.stubGlobal('navigator', { gpu: { requestAdapter: async () => ({ features: new Set() }) } });
    expect(await resolveModelId(WEBLLM_MODELS[1].id)).toBe('Llama-3.2-3B-Instruct-q4f32_1-MLC');
  });

  it('without WebGPU, asking fails with webgpu_unavailable and the package is never loaded', async () => {
    const loader = vi.fn(async () => mockModule().mod);
    __setWebLlmLoader(loader, { ok: false, reason: 'no_api', f16: false });
    await expect(askWebLlm(WEBLLM_MODELS[0].id, 'hi')).rejects.toMatchObject({ code: 'webgpu_unavailable' });
    expect(loader).not.toHaveBeenCalled();
  });
});

describe('engine', () => {
  it('loads once with progress, streams replies, and reuses the loaded model', async () => {
    const m = mockModule({ reply: ['{"co', 'des":[]}'] });
    const loader = vi.fn(async () => m.mod);
    __setWebLlmLoader(loader, F16);
    const phases: string[] = [];
    const unsub = subscribeWebLlm(() => phases.push(`${getWebLlmState().phase}:${getWebLlmState().progress}`));
    const seen: string[] = [];
    const text = await askWebLlm(WEBLLM_MODELS[0].id, 'propose a codebook', { json: true, onText: (t) => seen.push(t) });
    unsub();
    expect(text).toBe('{"codes":[]}');
    expect(seen).toEqual(['{"co', '{"codes":[]}']);
    expect(phases).toEqual(['loading:0', 'loading:0.25', 'loading:0.75', 'loading:1', 'ready:1']);
    expect(m.requests[0]).toMatchObject({ stream: true, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: 'propose a codebook' }] });
    expect(m.requests[0].max_tokens).toBeGreaterThan(0);
    await askWebLlm(WEBLLM_MODELS[0].id, 'again');
    expect(m.requests[1].response_format).toBeUndefined();
    expect(m.log.filter((l) => l.startsWith('reload'))).toEqual(['reload:Qwen2.5-1.5B-Instruct-q4f16_1-MLC']);
    expect(loader).toHaveBeenCalledTimes(1);
    // Switching model reloads the same engine.
    await askWebLlm(WEBLLM_MODELS[1].id, 'x');
    expect(m.log).toEqual(['new', 'reload:Qwen2.5-1.5B-Instruct-q4f16_1-MLC', 'reload:Llama-3.2-3B-Instruct-q4f16_1-MLC']);
  });

  it('cancelling a download unloads the engine and rejects cancelled', async () => {
    const m = mockModule({ hang: true });
    __setWebLlmLoader(async () => m.mod, F16);
    const ctrl = new AbortController();
    const p = prepareWebLlm(WEBLLM_MODELS[0].id, ctrl.signal);
    await vi.waitFor(() => expect(getWebLlmState().progress).toBe(0.75));
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ code: 'cancelled' });
    expect(m.log).toContain('unload');
    expect(getWebLlmState().phase).toBe('idle');
  });

  it('a failed download is model_download_failed', async () => {
    const m = mockModule({ loadError: new Error('NetworkError when attempting to fetch resource') });
    __setWebLlmLoader(async () => m.mod, F16);
    await expect(askWebLlm(WEBLLM_MODELS[0].id, 'hi')).rejects.toMatchObject({ code: 'model_download_failed' });
    expect(getWebLlmState().phase).toBe('error');
  });

  it('stopping generation interrupts the engine', async () => {
    const m = mockModule();
    __setWebLlmLoader(async () => m.mod, F16);
    await prepareWebLlm(WEBLLM_MODELS[0].id);
    const ctrl = new AbortController();
    const p = askWebLlm(WEBLLM_MODELS[0].id, 'hi', { signal: ctrl.signal, onText: () => ctrl.abort() });
    await expect(p).rejects.toMatchObject({ code: 'cancelled' });
    expect(m.log).toContain('interrupt');
  });

  it('cache check and delete use the package helpers', async () => {
    const m = mockModule({ cached: true });
    __setWebLlmLoader(async () => m.mod, F16);
    expect(await isWebLlmCached(WEBLLM_MODELS[0].id)).toBe(true);
    await deleteWebLlmModel(WEBLLM_MODELS[0].id);
    expect(m.mod.deleteModelAllInfoInCache).toHaveBeenCalledWith('Qwen2.5-1.5B-Instruct-q4f16_1-MLC');
  });

  it('works through the provider layer: status and tolerant JSON', async () => {
    const m = mockModule({ reply: ['Here is the codebook:\n', '{"codes":[{"name":"Water"}]}'], cached: false });
    __setWebLlmLoader(async () => m.mod, F16);
    saveAiSettings({ provider: 'webllm' });
    const st = await refreshAiStatus();
    expect(st).toMatchObject({ provider: 'webllm', ready: 'yes', privacy: 'local', modelCached: false });
    expect(await askAIJson('x')).toEqual({ codes: [{ name: 'Water' }] });
  });
});
