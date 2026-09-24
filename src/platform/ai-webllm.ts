// On-device AI with WebLLM (@mlc-ai/web-llm): a small language model runs on this computer's graphics
// chip through WebGPU. Nothing leaves the computer. The first use downloads the model weights, which the
// browser then keeps in its cache.
//
// The package is large (several MB), so it is only ever loaded with a dynamic import, on first use. In
// the single-file Claude artifact build it is left out entirely: vite aliases the package to a stub in
// `--mode artifact`, and the MODE check below lets the bundler drop the import.

import type { MLCEngine } from '@mlc-ai/web-llm';
import { AiUnavailableError } from './claude';

export interface WebLlmModelChoice {
  /** Model id for GPUs with 16-bit float shaders (most recent GPUs). */
  id: string;
  /** Fallback id for GPUs without the shader-f16 feature. */
  id32: string;
  label: string;
  detail: string;
  /** Approximate download, for the user. */
  download: string;
  /** Graphics memory needed, from the package's model list (16-bit files). */
  vramMB: number;
  /** Graphics memory needed by the 32-bit fallback files. */
  vramMB32: number;
}

// Ids checked against prebuiltAppConfig in @mlc-ai/web-llm 0.2.85 (tests/platform/webllm.test.ts).
export const WEBLLM_MODELS: WebLlmModelChoice[] = [
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    id32: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
    label: 'Small and fast',
    detail: 'Qwen 2.5, 1.5 billion parameters. Works on most laptops with a recent browser.',
    download: 'about 1 GB',
    vramMB: 1630,
    vramMB32: 1889,
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    id32: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    label: 'Better quality',
    detail: 'Llama 3.2, 3 billion parameters. Slower, needs a computer with more graphics memory.',
    download: 'about 1.8 GB',
    vramMB: 2264,
    vramMB32: 2952,
  },
];

export const DEFAULT_WEBLLM_MODEL = WEBLLM_MODELS[0].id;
/** Both models have a 4,096-token context window: keep prompts small and leave room for the reply. */
export const WEBLLM_PROMPT_BUDGET_BYTES = 7_000;
export const WEBLLM_MAX_TOKENS = 1_500;

/** False in the Claude artifact build, where the on-device option is not offered. */
export const WEBLLM_IN_BUILD = import.meta.env.MODE !== 'artifact';

export function webLlmChoice(id: string): WebLlmModelChoice {
  return WEBLLM_MODELS.find((m) => m.id === id || m.id32 === id) ?? WEBLLM_MODELS[0];
}

// ---------- module loading (injectable for tests) ----------

type WebLlmModule = Pick<typeof import('@mlc-ai/web-llm'), 'MLCEngine' | 'hasModelInCache' | 'deleteModelAllInfoInCache'>;

const defaultLoader = (): Promise<WebLlmModule> =>
  import.meta.env.MODE === 'artifact'
    ? Promise.reject(new AiUnavailableError('unavailable', 'The on-device model is not part of this build.'))
    : import('@mlc-ai/web-llm');

let loader: () => Promise<WebLlmModule> = defaultLoader;
let modPromise: Promise<WebLlmModule> | null = null;

function loadModule(): Promise<WebLlmModule> {
  if (!modPromise) modPromise = loader().catch((e) => {
    modPromise = null;
    throw e;
  });
  return modPromise;
}

// ---------- WebGPU detection ----------

/** WebLLM's own minimum adapter limits (detectGPUDevice in @mlc-ai/web-llm 0.2.x). */
const MIN_LIMITS: Array<[string, number, string]> = [
  ['maxBufferSize', 1 << 28, 'buffer size'],
  ['maxStorageBufferBindingSize', 1 << 27, 'storage buffer size'],
  ['maxComputeWorkgroupStorageSize', 32 << 10, 'workgroup memory'],
  ['maxStorageBuffersPerShaderStage', 10, 'storage buffers per shader'],
];

export interface WebGpuStatus {
  ok: boolean;
  /**
   * Why not:
   * - 'no_api': this browser has no WebGPU at all (older browsers, Firefox and Safari on many systems).
   * - 'insecure': the page is not a secure (https or localhost) page, where browsers hide WebGPU.
   * - 'no_adapter': the browser has WebGPU but found no graphics chip it may use (hardware acceleration
   *   turned off, the graphics driver on the browser's block list, or turned off by the organisation).
   * - 'limits': there is a graphics chip, but it is too limited for the model.
   * - 'error': asking for the graphics chip failed.
   * - 'build': the on-device option is not part of this build.
   */
  reason: 'no_api' | 'insecure' | 'no_adapter' | 'limits' | 'error' | 'build' | null;
  /** 16-bit float shaders available (picks the q4f16 model files). */
  f16: boolean;
  /** Only a software ("fallback") adapter: it works, but runs on the processor and is very slow. */
  software?: boolean;
  /** Graphics chip vendor and architecture, when the browser says (for diagnostics). */
  adapter?: string;
  /** Technical detail for 'limits' and 'error'. */
  detail?: string;
}

let gpuPromise: Promise<WebGpuStatus> | null = null;

export function detectWebGpu(): Promise<WebGpuStatus> {
  if (!gpuPromise) {
    gpuPromise = (async (): Promise<WebGpuStatus> => {
      if (!WEBLLM_IN_BUILD) return { ok: false, reason: 'build', f16: false };
      const g = globalThis as any;
      const gpu = g.navigator?.gpu;
      if (!gpu || typeof gpu.requestAdapter !== 'function') {
        // Browsers only offer WebGPU on secure pages (https or localhost).
        return { ok: false, reason: g.isSecureContext === false ? 'insecure' : 'no_api', f16: false };
      }
      let adapter: any;
      try {
        adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
      } catch (e: any) {
        return { ok: false, reason: 'error', f16: false, detail: String(e?.message ?? e) };
      }
      if (!adapter) return { ok: false, reason: 'no_adapter', f16: false };
      const info = adapter.info ?? {};
      const name = [info.vendor, info.architecture, info.description].filter((x: unknown) => typeof x === 'string' && x).join(' ');
      const base: WebGpuStatus = { ok: true, reason: null, f16: !!adapter.features?.has?.('shader-f16') };
      if (name) base.adapter = name;
      if (info.isFallbackAdapter === true || adapter.isFallbackAdapter === true) base.software = true;
      const limits = adapter.limits;
      if (limits) {
        const short = MIN_LIMITS.filter(([k, min]) => typeof limits[k] === 'number' && limits[k] < min);
        if (short.length) return { ...base, ok: false, reason: 'limits', detail: short.map(([k, min, label]) => `${label} ${limits[k]} < ${min}`).join(', ') };
      }
      return base;
    })();
  }
  return gpuPromise;
}

/**
 * Free space the browser will give this site, in MB (quota minus usage), or null when it does not say.
 * A private window often has a tiny quota.
 */
export async function storageFreeMB(): Promise<number | null> {
  try {
    const est = await (globalThis as any).navigator?.storage?.estimate?.();
    if (!est || typeof est.quota !== 'number') return null;
    return Math.max(0, Math.round((est.quota - (est.usage ?? 0)) / 1e6));
  } catch {
    return null;
  }
}

/** Ask the browser to keep the downloaded model when disk space runs low (best effort, never throws). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return !!(await (globalThis as any).navigator?.storage?.persist?.());
  } catch {
    return false;
  }
}

/** Memory this computer reports (Chrome and Edge only, rounded, at most 8 or so), or null. */
export function deviceMemoryGB(): number | null {
  const m = (globalThis as any).navigator?.deviceMemory;
  return typeof m === 'number' && m > 0 ? m : null;
}

/** Suggest the smaller model when this computer reports little memory. */
export function suggestSmallerModel(choiceId: string, memGB = deviceMemoryGB()): boolean {
  return memGB !== null && memGB < 8 && webLlmChoice(choiceId).id !== WEBLLM_MODELS[0].id;
}

/** The model id to load on this computer for a chosen model. */
export async function resolveModelId(choiceId: string): Promise<string> {
  const c = webLlmChoice(choiceId);
  const gpu = await detectWebGpu();
  return gpu.f16 ? c.id : c.id32;
}

/** After the engine reported that 16-bit shaders are missing after all: use the 32-bit model files from now on. */
async function disableF16(): Promise<void> {
  const gpu = await detectWebGpu();
  gpuPromise = Promise.resolve({ ...gpu, f16: false });
}

// ---------- load state (for progress bars) ----------

export interface WebLlmState {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  /** Model being loaded or loaded. */
  modelId: string | null;
  /** 0..1 while loading. */
  progress: number;
  text: string;
}

let state: WebLlmState = { phase: 'idle', modelId: null, progress: 0, text: '' };
const listeners = new Set<() => void>();

export function getWebLlmState(): WebLlmState {
  return state;
}

export function subscribeWebLlm(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setState(patch: Partial<WebLlmState>) {
  state = { ...state, ...patch };
  for (const l of [...listeners]) l();
}

/** What the progress bar is doing, in plain words (the package reports downloading, then preparing the graphics chip). */
export function describeWebLlmProgress(s: Pick<WebLlmState, 'progress' | 'text'>): string {
  const pct = Math.round(Math.max(0, Math.min(1, s.progress)) * 100);
  const t = s.text ?? '';
  if (/^Fetching param cache/i.test(t)) {
    const mb = t.match(/(\d+)\s*MB fetched/i);
    return `Downloading the model: ${pct}%${mb ? ` (${mb[1]} MB so far)` : ''}`;
  }
  if (/^Loading model from cache/i.test(t)) return `Loading the model from this browser's storage: ${pct}%`;
  if (/shader/i.test(t)) return `Preparing the graphics chip: ${pct}%`;
  if (/^Finish loading/i.test(t)) return 'Almost ready…';
  return 'Starting: fetching the model settings and program…';
}

// ---------- engine ----------

type EngineLike = Pick<MLCEngine, 'reload' | 'unload' | 'interruptGenerate' | 'chat'>;

let engine: EngineLike | null = null;
let loadedModel: string | null = null;
let loading: { modelId: string; promise: Promise<EngineLike> } | null = null;

function isAbortError(e: any): boolean {
  return e?.name === 'AbortError' || /abort/i.test(String(e?.message ?? ''));
}

/**
 * Stable error code for a failed model load. The package's own messages are technical; these codes
 * map to plain-language messages in aiErrorMessage (src/platform/ai.ts).
 */
export function loadErrorCode(e: any): string {
  const name = String(e?.name ?? '');
  const msg = `${name} ${e?.message ?? ''}`;
  if (name === 'ShaderF16SupportError' || /shader-f16/i.test(msg)) return 'webgpu_f16';
  if (name === 'WebGPUNotAvailableError' || name === 'WebGPUNotFoundError') return 'webgpu_unavailable';
  if (name === 'QuotaExceededError' || /quota|not enough (storage|space)|disk (is )?full|storage.*(full|exceed)/i.test(msg)) return 'model_storage_full';
  if (name === 'DeviceLostError' || /device (was )?lost|out of memory|\boom\b|allocation failed/i.test(msg)) return 'webgpu_out_of_memory';
  if (/cannot fetch|failed to fetch|networkerror|network error|load failed|request failed|err_|fetch|download|status (4|5)\d\d|\b(403|404|429|5\d\d)\b/i.test(msg)) return 'model_download_failed';
  if (/webgpu|compatible gpu|adapter|requestdevice|cannot initialize runtime|maxbuffersize|maxstoragebuffer|featuresupport/i.test(msg)) return 'webgpu_unavailable';
  return 'model_download_failed';
}

/** Load (downloading on first use) the model. Aborting the signal cancels the download. */
export async function ensureEngine(modelId: string, signal?: AbortSignal): Promise<EngineLike> {
  if (engine && loadedModel === modelId && !loading) return engine;
  if (loading && loading.modelId === modelId) return waitWithSignal(loading.promise, signal);
  const gpu = await detectWebGpu();
  if (!gpu.ok) throw new AiUnavailableError('webgpu_unavailable', 'WebGPU is not available in this browser.');
  if (signal?.aborted) throw new AiUnavailableError('cancelled', 'Stopped.');
  const promise = (async () => {
    let mod: WebLlmModule;
    try {
      mod = await loadModule();
    } catch (e: any) {
      throw e instanceof AiUnavailableError ? e : new AiUnavailableError('unavailable', 'Could not load the on-device AI software.', e?.message);
    }
    if (!engine) {
      engine = new mod.MLCEngine({
        initProgressCallback: (r) => {
          if (state.phase === 'loading') setState({ progress: Math.max(0, Math.min(1, r.progress)), text: r.text });
        },
      });
    }
    loadedModel = null;
    setState({ phase: 'loading', modelId, progress: 0, text: '' });
    const eng = engine;
    const onAbort = () => void eng.unload().catch(() => undefined);
    signal?.addEventListener('abort', onAbort);
    try {
      await eng.reload(modelId);
    } catch (e: any) {
      if (signal?.aborted || isAbortError(e)) {
        setState({ phase: 'idle', modelId: null, progress: 0, text: '' });
        throw new AiUnavailableError('cancelled', 'Stopped.');
      }
      const code = loadErrorCode(e);
      // A 16-bit shader problem is retried with the 32-bit model files (see loadChoice): not an error yet.
      setState(code === 'webgpu_f16' ? { phase: 'idle', modelId: null, progress: 0, text: '' } : { phase: 'error', progress: 0, text: String(e?.message ?? e) });
      throw new AiUnavailableError(code, 'The on-device model could not be loaded.', String(e?.message ?? e).slice(0, 300));
    } finally {
      signal?.removeEventListener('abort', onAbort);
    }
    // reload() returns quietly when unload() aborted it.
    if (signal?.aborted) {
      setState({ phase: 'idle', modelId: null, progress: 0, text: '' });
      throw new AiUnavailableError('cancelled', 'Stopped.');
    }
    loadedModel = modelId;
    setState({ phase: 'ready', modelId, progress: 1, text: '' });
    return eng;
  })();
  loading = { modelId, promise };
  try {
    return await promise;
  } finally {
    if (loading?.promise === promise) loading = null;
  }
}

function waitWithSignal<T>(p: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return p;
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new AiUnavailableError('cancelled', 'Stopped.'));
    if (signal.aborted) return onAbort();
    signal.addEventListener('abort', onAbort, { once: true });
    p.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

export interface WebLlmAskOptions {
  onText?: (text: string) => void;
  signal?: AbortSignal;
  json?: boolean;
  maxTokens?: number;
}

/** Ask the on-device model. Always streams internally so Stop can interrupt generation. */
export async function askWebLlm(choiceId: string, prompt: string, opts: WebLlmAskOptions = {}): Promise<string> {
  const eng = await loadChoice(choiceId, opts.signal);
  if (opts.signal?.aborted) throw new AiUnavailableError('cancelled', 'Stopped.');
  const onAbort = () => void eng.interruptGenerate();
  opts.signal?.addEventListener('abort', onAbort);
  let text = '';
  try {
    const chunks = await eng.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: opts.maxTokens ?? WEBLLM_MAX_TOKENS,
      stream: true,
      ...(opts.json ? { response_format: { type: 'json_object' as const } } : {}),
    });
    for await (const c of chunks) {
      const piece = c.choices?.[0]?.delta?.content ?? '';
      if (piece) {
        text += piece;
        opts.onText?.(text);
      }
    }
  } catch (e: any) {
    if (opts.signal?.aborted) throw new AiUnavailableError('cancelled', 'Stopped.');
    const msg = `${e?.name ?? ''} ${e?.message ?? ''}`;
    if (/context ?window|context length|prompt.*(long|exceed)/i.test(msg)) throw new AiUnavailableError('too_large', 'The request is too long for the on-device model.', e?.message);
    if (/device.*lost|webgpu/i.test(msg)) {
      loadedModel = null;
      setState({ phase: 'idle', modelId: null });
      throw new AiUnavailableError('webgpu_unavailable', 'The graphics chip stopped responding.', e?.message);
    }
    throw new AiUnavailableError('unavailable', 'The on-device model could not answer.', e?.message);
  } finally {
    opts.signal?.removeEventListener('abort', onAbort);
  }
  if (opts.signal?.aborted) throw new AiUnavailableError('cancelled', 'Stopped.');
  return text;
}

/** Download (or load from the browser cache) without asking anything. */
export async function prepareWebLlm(choiceId: string, signal?: AbortSignal): Promise<void> {
  await loadChoice(choiceId, signal);
}

/**
 * Load the right files for a chosen model. The GPU check says whether 16-bit shaders exist; if the
 * engine finds out otherwise while loading, switch to the 32-bit files once and try again.
 */
async function loadChoice(choiceId: string, signal?: AbortSignal): Promise<EngineLike> {
  try {
    return await ensureEngine(await resolveModelId(choiceId), signal);
  } catch (e: any) {
    if (e?.code !== 'webgpu_f16') throw e;
    await disableF16();
    return ensureEngine(await resolveModelId(choiceId), signal);
  }
}

/** Is the model already in the browser cache? (No download.) */
export async function isWebLlmCached(choiceId: string): Promise<boolean> {
  const gpu = await detectWebGpu();
  if (!gpu.ok) return false;
  try {
    const mod = await loadModule();
    return await mod.hasModelInCache(await resolveModelId(choiceId));
  } catch {
    return false;
  }
}

/** Remove the model files from the browser cache to free disk space. */
export async function deleteWebLlmModel(choiceId: string): Promise<void> {
  const modelId = await resolveModelId(choiceId);
  if (engine && loadedModel === modelId) {
    await engine.unload().catch(() => undefined);
    loadedModel = null;
    setState({ phase: 'idle', modelId: null, progress: 0, text: '' });
  }
  const mod = await loadModule();
  await mod.deleteModelAllInfoInCache(modelId);
}

/** Test hook: replace the package loader (and forget the engine, GPU check and state). */
export function __setWebLlmLoader(fn: (() => Promise<unknown>) | null, gpu?: WebGpuStatus): void {
  loader = (fn as (() => Promise<WebLlmModule>) | null) ?? defaultLoader;
  modPromise = null;
  engine = null;
  loadedModel = null;
  loading = null;
  gpuPromise = gpu ? Promise.resolve(gpu) : null;
  state = { phase: 'idle', modelId: null, progress: 0, text: '' };
}
