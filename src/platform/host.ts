// Host abstraction. The app runs in three places:
// 1. Inside a claude.ai Artifact viewer (sandboxed iframe): plain <a download> is blocked, so files
//    go through the `downloads` capability; Claude can be asked via the `sample` capability.
// 2. A normal static host (GitHub Pages, `npm run preview`, a saved file): anchor downloads work,
//    AI features are unavailable.
// 3. Tests (node): nothing here is called.
//
// Everything that saves a file or asks Claude MUST go through this module.

type ClaudeUse = { use: (name: string) => Promise<any> };

function claudeGlobal(): ClaudeUse | null {
  const c = (globalThis as any).claude;
  return c && typeof c.use === 'function' ? (c as ClaudeUse) : null;
}

const capCache = new Map<string, Promise<any>>();
function useCapability(name: string): Promise<any> {
  const c = claudeGlobal();
  if (!c) return Promise.resolve(null);
  if (!capCache.has(name)) capCache.set(name, c.use(name).catch(() => null));
  return capCache.get(name)!;
}

/** Extensions the artifact `downloads` capability accepts. Others must be wrapped in a .zip. */
export const ARTIFACT_SAFE_EXTENSIONS = new Set([
  'gif', 'png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'txt', 'json', 'md',
  'docx', 'pptx', 'epub', 'csv', 'ttf', 'html', 'svg', 'pdf', 'xlsx', 'zip',
]);

export function isInArtifactViewer(): boolean {
  return !!claudeGlobal() && window.parent !== window;
}

export type SaveOutcome = 'saved' | 'declined' | 'unavailable' | 'error';

/**
 * Save a file for the user. In the artifact viewer, uses the downloads capability (the viewer
 * confirms); files with extensions the viewer does not accept (e.g. .sav) are zipped first.
 * Elsewhere, triggers a normal browser download.
 */
export async function saveFile(filename: string, data: Blob | Uint8Array | string, mime = 'application/octet-stream'): Promise<SaveOutcome> {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mime });
  if (isInArtifactViewer()) {
    const downloads = await useCapability('downloads');
    if (downloads) {
      let name = filename;
      let payload: Blob = blob;
      const ext = (filename.split('.').pop() ?? '').toLowerCase();
      if (!ARTIFACT_SAFE_EXTENSIONS.has(ext)) {
        const { zipSync } = await import('fflate');
        const bytes = new Uint8Array(await blob.arrayBuffer());
        payload = new Blob([zipSync({ [filename]: bytes }) as BlobPart], { type: 'application/zip' });
        name = filename + '.zip';
      }
      try {
        await downloads.save({ filename: name, data: payload });
        return 'saved';
      } catch (e: any) {
        if (e?.code === 'declined') return 'declined';
        if (e?.code === 'rate_limited') return 'error';
        return 'unavailable';
      }
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    return 'saved';
  } catch {
    return 'error';
  }
}

/** Copy text (and optionally HTML, for pasting formatted tables into Word). Must be called from a click handler. */
export async function copyToClipboard(text: string, html?: string): Promise<boolean> {
  try {
    if (html && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        }),
      ]);
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

// ---------- Ask Claude (artifact `sample` capability) ----------

export interface AskOptions {
  onText?: (text: string) => void;
  signal?: AbortSignal;
  modelTier?: 'quick' | 'default' | 'complex';
}

export class AiUnavailableError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** True if AI assistance can be offered in this view (resolves within ~10 s at worst). */
export async function aiAvailable(): Promise<boolean> {
  return !!(await useCapability('sample'));
}

/** Ask Claude for text. Rejects AiUnavailableError (code: not_granted, rate_limited, unavailable, cancelled, ...). */
export async function askClaude(prompt: string, opts: AskOptions = {}): Promise<string> {
  const sample = await useCapability('sample');
  if (!sample) throw new AiUnavailableError('unavailable', 'AI assistance is only available when this app is opened as a Claude artifact.');
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
export async function askClaudeJson<T = unknown>(prompt: string, opts: AskOptions = {}): Promise<T> {
  const sample = await useCapability('sample');
  if (!sample) throw new AiUnavailableError('unavailable', 'AI assistance is only available when this app is opened as a Claude artifact.');
  try {
    return (await sample.json(prompt, { signal: opts.signal, modelTier: opts.modelTier ?? 'default' })) as T;
  } catch (e: any) {
    throw new AiUnavailableError(e?.code ?? 'unavailable', e?.message ?? 'Claude could not answer.');
  }
}

export function aiErrorMessage(code: string): string {
  switch (code) {
    case 'not_granted': return 'AI assistance was not allowed for this page. You can keep coding manually.';
    case 'rate_limited': return 'Too many AI requests at once. Wait a moment, then try again.';
    case 'cancelled': return 'Stopped.';
    case 'invalid_json': return 'Claude replied in an unexpected format. Try again with fewer items.';
    default: return 'AI assistance is not available here. It works when the app is opened as a Claude artifact.';
  }
}
