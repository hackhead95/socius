// Starts the error log for the running app (called once from main.tsx):
// - context for every entry: main tab, dataset size, AI provider and model (sizes and ids only);
// - the open project's names and labels, which the log removes from anything it stores;
// - uncaught errors and unhandled promise rejections;
// - resources that fail to load (scripts and stylesheets as warnings, images as info);
// - code files of an older version that no longer exist after an update (Vite's `vite:preloadError`,
//   "Failed to fetch dynamically imported module"): logged as a warning, and a calm banner offers a
//   reload (update.ts, UpdateBanner.tsx);
// - `reactRootErrorOptions` for createRoot (main.tsx): errors React reports at the root.
import { useStore } from '../../core/store';
import { effectiveProvider, getAiSettings } from '../../platform/ai';
import { lastResolvedGeminiModel } from '../../platform/ai-http';
import { AiUnavailableError } from '../../platform/claude';
import { componentStackText, logError, logInfo, logWarn, redact, setLogContextProvider, setSensitiveTermsProvider, type LogArea } from '../../platform/errorlog';
import { isChunkLoadError, showUpdateNotice } from './update';
import type { Dataset } from '../../core/types';
import type { CodingProject } from '../../core/coding-types';

const MAX_TERMS = 5000;

function datasetSize(ds: Dataset | null): string {
  if (!ds) return 'none';
  return `${ds.nCases.toLocaleString('en-US')} cases x ${ds.variables.length.toLocaleString('en-US')} variables`;
}

function aiModel(): { provider: string; model?: string } {
  const p = effectiveProvider();
  const s = getAiSettings();
  switch (p) {
    case 'gemini':
      return { provider: p, model: s.gemini.model || lastResolvedGeminiModel(s.gemini.apiKey) || 'automatic' };
    case 'openai':
      return { provider: `${p}:${s.openai.preset}`, model: s.openai.model || undefined };
    case 'webllm':
      return { provider: p, model: s.webllm.model };
    case 'claude':
      return { provider: p };
    default:
      return { provider: 'none' };
  }
}

/** Everything in the project that a user typed or a file brought in, as terms to keep out of the log. */
export function projectTerms(ds: Dataset | null, coding: CodingProject | null): string[] {
  const out: string[] = [];
  const push = (v: unknown) => {
    if (out.length < MAX_TERMS && typeof v === 'string' && v.trim().length >= 3) out.push(v.trim().slice(0, 200));
  };
  if (ds) {
    push(ds.name);
    push(ds.fileLabel);
    for (const v of ds.variables) push(v.name);
    for (const v of ds.variables) push(v.label);
    for (const v of ds.variables) {
      for (const vl of v.valueLabels ?? []) {
        push(vl.label);
        push(typeof vl.value === 'string' ? vl.value : undefined);
      }
    }
  }
  if (coding) {
    for (const c of coding.codes) push(c.name);
    for (const d of coding.docs) push(d.name);
    for (const m of coding.memos) push(m.title);
    for (const c of coding.coders) push(c);
    for (const d of coding.docs) for (const [k, v] of Object.entries(d.attributes ?? {})) {
      push(k);
      push(v);
    }
  }
  return out;
}

let cache: { ds: unknown; coding: unknown; terms: string[] } | null = null;

function currentTerms(): string[] {
  const s = useStore.getState();
  if (!cache || cache.ds !== s.dataset || cache.coding !== s.coding) cache = { ds: s.dataset, coding: s.coding, terms: projectTerms(s.dataset, s.coding) };
  return cache.terms;
}

/** Which area an uncaught error belongs to, from its message. */
function areaOf(err: unknown): LogArea {
  const msg = String((err as { message?: unknown } | null)?.message ?? err ?? '');
  if (/Failed to fetch|NetworkError|Load failed|dynamically imported module|Importing a module script failed|Loading chunk/i.test(msg)) return 'network';
  if (/QuotaExceeded|quota/i.test(msg) || (err as { name?: unknown } | null)?.name === 'QuotaExceededError') return 'storage';
  if (err instanceof AiUnavailableError) return 'ai';
  return 'ui';
}

/** A code file of an older version could not be loaded: log it calmly and offer the reload. */
export function onChunkLoadError(err: unknown, op: string): void {
  logWarn('network', err ?? 'A code file could not be loaded', { op });
  showUpdateNotice();
}

/** What failed to load, for a capture-phase `error` event on an element (null when it is not a resource). */
export function describeResourceError(target: EventTarget | null): { level: 'warn' | 'info'; message: string } | null {
  if (!target || typeof Element === 'undefined' || !(target instanceof Element)) return null;
  const tag = target.tagName.toLowerCase();
  const attr = (n: string) => target.getAttribute(n) ?? '';
  let url = '';
  let kind = '';
  if (tag === 'script') {
    url = (target as HTMLScriptElement).src || attr('src');
    kind = 'a script';
  } else if (tag === 'link') {
    const rel = attr('rel').toLowerCase();
    url = (target as HTMLLinkElement).href || attr('href');
    kind = /stylesheet/.test(rel) ? 'a stylesheet' : /modulepreload|preload/.test(rel) ? 'a preloaded file' : /icon/.test(rel) ? 'an icon' : 'a linked file';
  } else if (tag === 'img' || tag === 'image') {
    url = (target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src || attr('src') || attr('href');
    kind = 'an image';
  } else if (tag === 'video' || tag === 'audio' || tag === 'source' || tag === 'track') {
    url = attr('src');
    kind = 'a media file';
  } else return null;
  const important = tag === 'script' || (tag === 'link' && /stylesheet|modulepreload|preload/.test(attr('rel').toLowerCase()));
  // Only the path of the page's own files; other addresses keep their host (redact drops the query).
  let where = url;
  try {
    const u = new URL(url, typeof location !== 'undefined' ? location.href : undefined);
    where = typeof location !== 'undefined' && u.origin === location.origin ? u.pathname : `${u.origin}${u.pathname}`;
    if (u.protocol === 'data:' || u.protocol === 'blob:') where = `(${u.protocol.replace(':', '')} address)`;
  } catch {
    /* keep as is: redact cleans it */
  }
  return { level: important ? 'warn' : 'info', message: `Could not load ${kind}: ${redact(where, 200) || '(no address)'}` };
}

/**
 * Options for createRoot (main.tsx). Errors caught by Socius's own error boundaries are logged there
 * (with the boundary's name), so onCaughtError logs only what other boundaries catch. The component
 * stack is kept to component names.
 */
export const reactRootErrorOptions = {
  onCaughtError(error: unknown, info: { componentStack?: string; errorBoundary?: unknown }): void {
    const boundary = info?.errorBoundary as { logsOwnErrors?: boolean } | null | undefined;
    if (!boundary?.logsOwnErrors) logError(isChunkLoadError(error) ? 'network' : 'ui', error, { op: 'react caught error' }, componentStackText(info?.componentStack));
    if (isChunkLoadError(error)) showUpdateNotice();
    try {
      console.error(error);
    } catch {
      /* no console */
    }
  },
  onUncaughtError(error: unknown, info: { componentStack?: string }): void {
    logError('ui', error, { op: 'react uncaught error' }, componentStackText(info?.componentStack));
    if (isChunkLoadError(error)) showUpdateNotice();
    // React's default: report it like any uncaught error (the window listener sees the same object once).
    try {
      if (typeof reportError === 'function') reportError(error);
      else console.error(error);
    } catch {
      /* ignore */
    }
  },
  onRecoverableError(error: unknown, info: { componentStack?: string }): void {
    logWarn('ui', error, { op: 'react recovered' }, componentStackText(info?.componentStack));
    try {
      console.warn(error);
    } catch {
      /* no console */
    }
  },
};

let installed = false;

/** Start the error log (idempotent). */
export function installErrorLog(): void {
  if (installed) return;
  installed = true;
  setLogContextProvider(() => {
    const s = useStore.getState();
    // The open dialog (a code id such as transform/compute) says what was running, unless the caller says.
    return { tab: s.tab, dataset: datasetSize(s.dataset), op: s.dialog ? `${s.dialog.kind}/${s.dialog.id}` : undefined, ...aiModel() };
  });
  setSensitiveTermsProvider(currentTerms);
  try {
    window.addEventListener('error', (ev: ErrorEvent) => {
      // Cross-origin scripts (browser extensions) report only "Script error." with nothing to act on.
      const err = ev.error ?? (ev.message && ev.message !== 'Script error.' ? ev.message : null);
      if (!err) return;
      if (isChunkLoadError(err)) return onChunkLoadError(err, 'uncaught error');
      logError(areaOf(err), err, { op: 'uncaught error' });
    });
    window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
      if (isChunkLoadError(ev.reason)) return onChunkLoadError(ev.reason, 'unhandled promise rejection');
      logError(areaOf(ev.reason), ev.reason ?? 'Unhandled promise rejection', { op: 'unhandled promise rejection' });
    });
    // Resources (script, stylesheet, image) that fail to load: their error events do not bubble, so
    // listen in the capture phase. Runtime errors (target is the window) are handled above.
    window.addEventListener(
      'error',
      (ev: Event) => {
        if (ev.target === window) return;
        const r = describeResourceError(ev.target);
        if (!r) return;
        if (r.level === 'warn') logWarn('network', r.message, { op: 'resource load' });
        else logInfo('network', r.message, { op: 'resource load' });
      },
      true,
    );
    // Vite: a code file (chunk) needed by a part of the app could not be loaded, typically because a
    // new version was published while this tab was open. Not prevented: the caller's own error
    // handling still runs (a toast, not a crash); the banner offers the reload.
    window.addEventListener('vite:preloadError', (ev: Event) => {
      onChunkLoadError((ev as Event & { payload?: unknown }).payload, 'vite:preloadError');
    });
  } catch {
    /* no window (tests) */
  }
}
