// On-device adapter with a mocked WebLLM engine. (WebGPU and the model download cannot run in the
// headless test browser or in node, so the real engine is not exercised here.)
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WEBLLM_MODELS, __setWebLlmLoader, askWebLlm, deleteWebLlmModel, describeWebLlmProgress, detectWebGpu, getWebLlmState, isWebLlmCached, loadErrorCode, prepareWebLlm, resolveModelId,
  storageFreeMB, subscribeWebLlm, suggestSmallerModel,
} from '../../src/platform/ai-webllm';
import { __reloadAiSettings, aiErrorText, askAIJson, refreshAiStatus, saveAiSettings } from '../../src/platform/ai';
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

  it('explains the exact state: insecure page, too-limited chip, software-only adapter, failing request', async () => {
    __setWebLlmLoader(null);
    vi.stubGlobal('isSecureContext', false);
    vi.stubGlobal('navigator', {});
    expect(await detectWebGpu()).toMatchObject({ ok: false, reason: 'insecure' });
    vi.stubGlobal('isSecureContext', true);
    const good = { maxBufferSize: 1 << 30, maxStorageBufferBindingSize: 1 << 30, maxComputeWorkgroupStorageSize: 32768, maxStorageBuffersPerShaderStage: 10 };
    const opts: any[] = [];
    __setWebLlmLoader(null);
    vi.stubGlobal('navigator', { gpu: { requestAdapter: async (o: any) => (opts.push(o), { features: new Set(), limits: { ...good, maxStorageBuffersPerShaderStage: 8 } }) } });
    expect(await detectWebGpu()).toMatchObject({ ok: false, reason: 'limits', detail: 'storage buffers per shader 8 < 10' });
    expect(opts[0]).toEqual({ powerPreference: 'high-performance' });
    __setWebLlmLoader(null);
    vi.stubGlobal('navigator', { gpu: { requestAdapter: async () => ({ features: new Set(), limits: good, info: { vendor: 'google', architecture: 'swiftshader', isFallbackAdapter: true } }) } });
    expect(await detectWebGpu()).toEqual({ ok: true, reason: null, f16: false, software: true, adapter: 'google swiftshader' });
    __setWebLlmLoader(null);
    vi.stubGlobal('navigator', { gpu: { requestAdapter: async () => { throw new Error('WebGPU is disabled by policy'); } } });
    expect(await detectWebGpu()).toMatchObject({ ok: false, reason: 'error', detail: 'WebGPU is disabled by policy' });
  });

  it('reads the storage the browser will give this site', async () => {
    vi.stubGlobal('navigator', { storage: { estimate: async () => ({ quota: 3e9, usage: 1e9 }) } });
    expect(await storageFreeMB()).toBe(2000);
    vi.stubGlobal('navigator', {});
    expect(await storageFreeMB()).toBeNull();
  });

  it('suggests the smaller model on computers that report little memory', () => {
    expect(suggestSmallerModel(WEBLLM_MODELS[1].id, 4)).toBe(true);
    expect(suggestSmallerModel(WEBLLM_MODELS[1].id, 8)).toBe(false);
    expect(suggestSmallerModel(WEBLLM_MODELS[0].id, 2)).toBe(false);
    expect(suggestSmallerModel(WEBLLM_MODELS[1].id, null)).toBe(false);
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

  it('maps the package\'s load errors to clear messages', () => {
    expect(loadErrorCode(new TypeError('Failed to fetch'))).toBe('model_download_failed');
    expect(loadErrorCode(new Error("Failed to execute 'add' on 'Cache': Request failed"))).toBe('model_download_failed');
    expect(loadErrorCode(new Error('Cannot fetch https://huggingface.co/mlc-ai/x/resolve/main/mlc-chat-config.json'))).toBe('model_download_failed');
    expect(loadErrorCode(Object.assign(new Error('The WebGPU device was lost while loading the model. This issue often occurs due to running out of memory (OOM).'), { name: 'DeviceLostError' }))).toBe('webgpu_out_of_memory');
    expect(loadErrorCode(Object.assign(new Error('Quota exceeded.'), { name: 'QuotaExceededError' }))).toBe('model_storage_full');
    expect(loadErrorCode(Object.assign(new Error('This model requires WebGPU extension shader-f16'), { name: 'ShaderF16SupportError' }))).toBe('webgpu_f16');
    expect(loadErrorCode(new Error('Unable to find a compatible GPU.'))).toBe('webgpu_unavailable');
    expect(loadErrorCode(Object.assign(new Error('Cannot find WebGPU in the environment'), { name: 'WebGPUNotFoundError' }))).toBe('webgpu_unavailable');
    expect(aiErrorText({ code: 'model_download_failed', detail: 'TypeError: Failed to fetch' })).toMatch(/^Could not download the model: check your connection, or a firewall\/extension may block huggingface\.co/);
  });

  it('retries with the 32-bit model files when 16-bit shaders turn out to be missing', async () => {
    const m = mockModule();
    const orig = m.mod.MLCEngine.prototype.reload;
    m.mod.MLCEngine.prototype.reload = async function (this: any, id: string) {
      if (id.includes('q4f16')) {
        m.log.push(`reload:${id}`);
        throw Object.assign(new Error('This model requires WebGPU extension shader-f16, which is not enabled in this browser.'), { name: 'ShaderF16SupportError' });
      }
      return orig.call(this, id);
    };
    __setWebLlmLoader(async () => m.mod, F16);
    await prepareWebLlm(WEBLLM_MODELS[0].id);
    expect(m.log.filter((l) => l.startsWith('reload'))).toEqual(['reload:Qwen2.5-1.5B-Instruct-q4f16_1-MLC', 'reload:Qwen2.5-1.5B-Instruct-q4f32_1-MLC']);
    expect(getWebLlmState()).toMatchObject({ phase: 'ready', modelId: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC' });
    expect((await detectWebGpu()).f16).toBe(false);
  });

  it('describes download progress in plain words', () => {
    expect(describeWebLlmProgress({ progress: 0, text: '' })).toMatch(/^Starting/);
    expect(describeWebLlmProgress({ progress: 0.3, text: 'Fetching param cache[3/40]: 512MB fetched. 30% completed, 12 secs elapsed.' })).toBe('Downloading the model: 30% (512 MB so far)');
    expect(describeWebLlmProgress({ progress: 0.5, text: 'Loading model from cache[20/40]: 800MB loaded.' })).toBe("Loading the model from this browser's storage: 50%");
    expect(describeWebLlmProgress({ progress: 0.9, text: 'Loading GPU shader modules[90/100]: 90% completed' })).toBe('Preparing the graphics chip: 90%');
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
