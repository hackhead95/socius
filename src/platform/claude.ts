// The claude.ai Artifact runtime: the `claude` global and its capabilities (`downloads`, `sample`).
// Only present when the app is opened as a Claude artifact. Everything here is a no-op elsewhere.

type ClaudeUse = { use: (name: string) => Promise<any> };

export function claudeGlobal(): ClaudeUse | null {
  const c = (globalThis as any).claude;
  return c && typeof c.use === 'function' ? (c as ClaudeUse) : null;
}

const capCache = new Map<string, Promise<any>>();
export function useCapability(name: string): Promise<any> {
  const c = claudeGlobal();
  if (!c) return Promise.resolve(null);
  if (!capCache.has(name)) capCache.set(name, c.use(name).catch(() => null));
  return capCache.get(name)!;
}

/** Test hook: forget cached capability lookups. */
export function __resetCapabilityCache(): void {
  capCache.clear();
}

export function isInArtifactViewer(): boolean {
  return !!claudeGlobal() && typeof window !== 'undefined' && window.parent !== window;
}

/** An AI request failed. `code` is stable (see aiErrorMessage in ./ai); `detail` is the service's own words. */
export class AiUnavailableError extends Error {
  code: string;
  detail?: string;
  constructor(code: string, message: string, detail?: string) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

export interface ClaudeAskOptions {
  onText?: (text: string) => void;
  signal?: AbortSignal;
  modelTier?: 'quick' | 'default' | 'complex';
}

/** True when the `sample` capability (ask Claude) is granted in this view. */
export async function claudeSampleAvailable(): Promise<boolean> {
  return !!(await useCapability('sample'));
}

/** Ask Claude for text. Rejects AiUnavailableError (code: not_granted, rate_limited, unavailable, cancelled, ...). */
export async function askClaude(prompt: string, opts: ClaudeAskOptions = {}): Promise<string> {
  const sample = await useCapability('sample');
  if (!sample) throw new AiUnavailableError('unavailable', 'Claude is only available when this app is opened as a Claude artifact.');
  try {
    const r = await sample(prompt, {
      signal: opts.signal,
      modelTier: opts.modelTier ?? 'default',
      onText: opts.onText ? ({ text }: { text: string }) => opts.onText!(text) : undefined,
    });
    return r.text as string;
  } catch (e: any) {
    throw new AiUnavailableError(e?.code ?? 'unavailable', e?.message ?? 'Claude could not answer.');
  }
}

/** Ask Claude for JSON. Describe the exact shape in the prompt; validate the fields you use. */
export async function askClaudeJson<T = unknown>(prompt: string, opts: ClaudeAskOptions = {}): Promise<T> {
  const sample = await useCapability('sample');
  if (!sample) throw new AiUnavailableError('unavailable', 'Claude is only available when this app is opened as a Claude artifact.');
  try {
    return (await sample.json(prompt, { signal: opts.signal, modelTier: opts.modelTier ?? 'default' })) as T;
  } catch (e: any) {
    throw new AiUnavailableError(e?.code ?? 'unavailable', e?.message ?? 'Claude could not answer.');
  }
}
