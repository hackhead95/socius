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
  /** Graphics memory needed, from the package's model list. */
  vramMB: number;
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
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    id32: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    label: 'Better quality',
    detail: 'Llama 3.2, 3 billion parameters. Slower, needs a computer with more graphics memory.',
    download: 'about 1.8 GB',
    vramMB: 2264,
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

export interface WebGpuStatus {
  ok: boolean;
  /** 'no_api': the browser has no WebGPU; 'no_adapter': it has, but no usable graphics chip; 'build': not in this build. */
  reason: 'no_api' | 'no_adapter' | 'build' | null;
  /** 16-bit float shaders available (picks the q4f16 model files). */
  f16: boolean;
}

let gpuPromise: Promise<WebGpuStatus> | null = null;

export function detectWebGpu(): Promise<WebGpuStatus> {
  if (!gpuPromise) {
    gpuPromise = (async (): Promise<WebGpuStatus> => {
      if (!WEBLLM_IN_BUILD) return { ok: false, reason: 'build', f16: false };
      const gpu = (globalThis as any).navigator?.gpu;
      if (!gpu || typeof gpu.requestAdapter !== 'function') return { ok: false, reason: 'no_api', f16: false };
      try {
        const adapter = await gpu.requestAdapter();
        if (!adapter) return { ok: false, reason: 'no_adapter', f16: false };
        return { ok: true, reason: null, f16: !!adapter.features?.has?.('shader-f16') };
      } catch {
        return { ok: false, reason: 'no_adapter', f16: false };
      }
    })();
  }
  return gpuPromise;
}

/** The model id to load on this computer for a chosen model. */
export async function resolveModelId(choiceId: string): Promise<string> {
  const c = webLlmChoice(choiceId);
  const gpu = await detectWebGpu();
  return gpu.f16 ? c.id : c.id32;
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

// ---------- engine ----------

type EngineLike = Pick<MLCEngine, 'reload' | 'unload' | 'interruptGenerate' | 'chat'>;

let engine: EngineLike | null = null;
let loadedModel: string | null = null;
let loading: { modelId: string; promise: Promise<EngineLike> } | null = null;

function isAbortError(e: any): boolean {
  return e?.name === 'AbortError' || /abort/i.test(String(e?.message ?? ''));
}

function loadErrorCode(e: any): string {
  const msg = `${e?.name ?? ''} ${e?.message ?? ''}`;
  if (/quota|storage|space/i.test(msg)) return 'model_download_failed';
  if (/webgpu|adapter|device/i.test(msg) && !/fetch|network|download/i.test(msg)) return 'webgpu_unavailable';
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
      setState({ phase: 'error', progress: 0, text: String(e?.message ?? e) });
      throw new AiUnavailableError(loadErrorCode(e), 'The on-device model could not be loaded.', e?.message);
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
  const modelId = await resolveModelId(choiceId);
  const eng = await ensureEngine(modelId, opts.signal);
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
  await ensureEngine(await resolveModelId(choiceId), signal);
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
