// Starts the error log for the running app (called once from main.tsx):
// - context for every entry: main tab, dataset size, AI provider and model (sizes and ids only);
// - the open project's names and labels, which the log removes from anything it stores;
// - uncaught errors and unhandled promise rejections.
import { useStore } from '../../core/store';
import { effectiveProvider, getAiSettings } from '../../platform/ai';
import { lastResolvedGeminiModel } from '../../platform/ai-http';
import { AiUnavailableError } from '../../platform/claude';
import { logError, setLogContextProvider, setSensitiveTermsProvider, type LogArea } from '../../platform/errorlog';
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
      logError(areaOf(err), err, { op: 'uncaught error' });
    });
    window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
      logError(areaOf(ev.reason), ev.reason ?? 'Unhandled promise rejection', { op: 'unhandled promise rejection' });
    });
  } catch {
    /* no window (tests) */
  }
}
