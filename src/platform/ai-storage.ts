// Browser storage for Socius: how much this site uses and where (the on-device AI models, projects and
// autosave, the error log), deleting downloaded AI models, and checking free space before a download.
//
// Every GitHub Pages site on hackhead95.github.io shares one browser origin, and so one storage quota:
// "usage" includes other sites there. The on-device models are kept by @mlc-ai/web-llm 0.2.85 in Cache
// Storage (its default `cacheBackend: "cache"`), in three caches: "webllm/model" (weights, tensor-cache.json,
// tokenizer files at https://huggingface.co/mlc-ai/<model id>/resolve/main/...), "webllm/config"
// (mlc-chat-config.json) and "webllm/wasm" (the model program, from raw.githubusercontent.com). With the
// "indexeddb" backend the same names are IndexedDB databases; "tvmjs-cos-hash-meta" belongs to its
// experimental cross-origin cache. All are handled here without loading the (large) package itself.
//
// Nothing here throws: storage can be missing or blocked (private windows, the Artifact viewer).

import { WEBLLM_MODELS, type WebLlmModelChoice } from './ai-webllm-models';

export const WEBLLM_CACHES = ['webllm/model', 'webllm/config', 'webllm/wasm'];
const OTHER_WEBLLM = ['tvmjs-cos-hash-meta'];

export interface StorageEstimate {
  /** Bytes used by this origin (all sites at this address), or null when the browser does not say. */
  usage: number | null;
  quota: number | null;
  /** Chrome's breakdown (caches, indexedDB...), when given. */
  details?: Record<string, number>;
}

export async function estimateStorage(): Promise<StorageEstimate> {
  try {
    const est: any = await (globalThis as any).navigator?.storage?.estimate?.();
    if (!est) return { usage: null, quota: null };
    return {
      usage: typeof est.usage === 'number' ? est.usage : null,
      quota: typeof est.quota === 'number' ? est.quota : null,
      details: est.usageDetails && typeof est.usageDetails === 'object' ? { ...est.usageDetails } : undefined,
    };
  } catch {
    return { usage: null, quota: null };
  }
}

/** Free space the browser will give this site, in bytes (quota minus usage), or null. */
export function freeBytes(e: StorageEstimate): number | null {
  return e.quota !== null && e.usage !== null ? Math.max(0, e.quota - e.usage) : null;
}

/** Has the browser promised to keep this site's data when disk space runs low? null: cannot tell. */
export async function storagePersisted(): Promise<boolean | null> {
  try {
    const fn = (globalThis as any).navigator?.storage?.persisted;
    return typeof fn === 'function' ? !!(await fn.call((globalThis as any).navigator.storage)) : null;
  } catch {
    return null;
  }
}

/** Ask the browser to keep this site's data (best effort; some browsers ask the user). */
export async function requestPersist(): Promise<boolean> {
  try {
    const st = (globalThis as any).navigator?.storage;
    return typeof st?.persist === 'function' ? !!(await st.persist()) : false;
  } catch {
    return false;
  }
}

// ---------- downloaded models ----------

export interface StoredModel {
  /** Model id as in the file addresses (e.g. Qwen2.5-1.5B-Instruct-q4f16_1-MLC). */
  id: string;
  /** Socius's name for it ("Small and fast"), when it is one of Socius's models. */
  label?: string;
  bytes: number;
  files: number;
  /** All weight files listed in tensor-cache.json are present (false: partly downloaded). */
  complete: boolean | null;
}

export interface WebLlmStorage {
  models: StoredModel[];
  /** Model programs and other files not tied to one model. */
  otherBytes: number;
  totalBytes: number;
  /** Cache or database names found. */
  stores: string[];
}

function hasCaches(): boolean {
  try {
    return typeof caches !== 'undefined' && typeof caches.keys === 'function';
  } catch {
    return false;
  }
}

/** The model id in a file address: https://huggingface.co/mlc-ai/<id>/resolve/main/... */
export function modelIdFromUrl(url: string): string | null {
  const m = /huggingface\.co\/(?:[^/]+)\/([^/]+)\/resolve\//.exec(url);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Socius model choice for a model id or a model program (wasm) address. */
function choiceFor(idOrUrl: string): WebLlmModelChoice | undefined {
  return WEBLLM_MODELS.find((c) => idOrUrl.includes(c.id) || idOrUrl.includes(c.id32) || (c.libs ?? []).some((l) => idOrUrl.includes(l)));
}

async function responseBytes(res: Response | undefined): Promise<number> {
  if (!res) return 0;
  const n = Number(res.headers?.get?.('content-length'));
  if (Number.isFinite(n) && n > 0) return n;
  try {
    return (await res.clone().blob()).size;
  } catch {
    return 0;
  }
}

/** What the on-device AI has stored in this browser (Cache Storage), per model. */
export async function listWebLlmStorage(): Promise<WebLlmStorage> {
  const out: WebLlmStorage = { models: [], otherBytes: 0, totalBytes: 0, stores: [] };
  if (!hasCaches()) return out;
  let names: string[] = [];
  try {
    names = (await caches.keys()).filter((n) => WEBLLM_CACHES.includes(n) || OTHER_WEBLLM.includes(n) || /^webllm\//.test(n));
  } catch {
    return out;
  }
  out.stores = names;
  const byModel = new Map<string, StoredModel & { tensorList?: string[]; urls: Set<string> }>();
  for (const name of names) {
    let cache: Cache;
    let reqs: readonly Request[];
    try {
      cache = await caches.open(name);
      reqs = await cache.keys();
    } catch {
      continue;
    }
    for (const req of reqs) {
      let bytes = 0;
      let res: Response | undefined;
      try {
        res = await cache.match(req);
        bytes = await responseBytes(res);
      } catch {
        bytes = 0;
      }
      out.totalBytes += bytes;
      const lib = name === 'webllm/wasm' ? choiceFor(req.url) : undefined;
      const id = modelIdFromUrl(req.url) ?? (lib ? (/q4f32/.test(req.url) ? lib.id32 : lib.id) : null);
      if (!id) {
        out.otherBytes += bytes;
        continue;
      }
      let m = byModel.get(id);
      if (!m) byModel.set(id, (m = { id, label: choiceFor(id)?.label, bytes: 0, files: 0, complete: null, urls: new Set() }));
      m.bytes += bytes;
      m.files++;
      m.urls.add(req.url);
      if (/tensor-cache\.json$/.test(req.url) && res) {
        try {
          const j = await res.clone().json();
          const recs = Array.isArray(j?.records) ? j.records : [];
          m.tensorList = recs.map((r: any) => new URL(String(r.dataPath), req.url).href);
        } catch {
          /* unreadable list */
        }
      }
    }
  }
  for (const m of byModel.values()) {
    const complete = m.tensorList ? m.tensorList.every((u) => m.urls.has(u)) : false;
    out.models.push({ id: m.id, label: m.label, bytes: m.bytes, files: m.files, complete: m.tensorList || m.files ? complete : null });
  }
  out.models.sort((a, b) => b.bytes - a.bytes);
  return out;
}

const freedListeners = new Set<() => void>();

/** Called after Socius freed browser storage (a model deleted), e.g. so autosave can try again at once. */
export function onStorageFreed(fn: () => void): () => void {
  freedListeners.add(fn);
  return () => {
    freedListeners.delete(fn);
  };
}

export function notifyStorageFreed(): void {
  for (const l of [...freedListeners]) {
    try {
      l();
    } catch {
      /* a listener failed */
    }
  }
}

/** Delete one model's files (weights, tokenizer, settings, and its program) from every web-llm cache. Returns bytes freed (estimated). */
export async function deleteStoredModel(id: string): Promise<number> {
  if (!hasCaches()) return 0;
  const choice = choiceFor(id);
  let freed = 0;
  for (const name of WEBLLM_CACHES) {
    try {
      if (!(await caches.has(name))) continue;
      const cache = await caches.open(name);
      for (const req of await cache.keys()) {
        const mid = modelIdFromUrl(req.url);
        const mine = mid === id || (!mid && name === 'webllm/wasm' && !!choice && choiceFor(req.url) === choice && req.url.includes(/q4f32/.test(id) ? 'q4f32' : 'q4f16'));
        if (!mine) continue;
        freed += await responseBytes(await cache.match(req));
        await cache.delete(req);
      }
    } catch {
      /* keep going */
    }
  }
  notifyStorageFreed();
  return freed;
}

/** Delete every downloaded on-device model (all web-llm caches and databases). */
export async function deleteAllStoredModels(): Promise<void> {
  if (hasCaches()) {
    try {
      for (const n of await caches.keys()) if (WEBLLM_CACHES.includes(n) || OTHER_WEBLLM.includes(n) || /^webllm\//.test(n)) await caches.delete(n);
    } catch {
      /* ignore */
    }
  }
  try {
    const idb: any = (globalThis as any).indexedDB;
    const dbs: Array<{ name?: string }> = typeof idb?.databases === 'function' ? await idb.databases() : [];
    for (const d of dbs) if (d.name && (WEBLLM_CACHES.includes(d.name) || /^webllm\//.test(d.name))) idb.deleteDatabase(d.name);
  } catch {
    /* ignore */
  }
  notifyStorageFreed();
}

// ---------- the rest of Socius's storage ----------

/** Bytes Socius keeps in localStorage (settings, error log...), counted as UTF-16. */
export function localStorageBytes(prefix = 'socius.'): { total: number; errorLog: number } {
  let total = 0;
  let errorLog = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const n = (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2;
      total += n;
      if (k === 'socius.errorlog') errorLog = n;
    }
  } catch {
    /* unavailable */
  }
  return { total, errorLog };
}

/** Human size: "1.6 GB", "420 MB", "12 KB". */
export function formatBytes(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return 'unknown';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} MB`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} KB`;
  return `${Math.round(n)} bytes`;
}

// ---------- before a download ----------

/** Space kept free beyond the model itself, so autosave and other data still fit. */
export const SAFETY_MARGIN_BYTES = 300e6;

export interface SpaceCheck {
  ok: boolean;
  /** Bytes the download still needs (the model's size minus what is already stored). */
  need: number;
  free: number | null;
  /** Other models that could be deleted to make room. */
  others: StoredModel[];
}

/** Is there room to download this model (its size, less parts already stored, plus 10% and a margin)? */
export async function checkSpaceFor(modelId: string, sizeBytes: number, est?: StorageEstimate, stored?: WebLlmStorage): Promise<SpaceCheck> {
  const e = est ?? (await estimateStorage());
  const s = stored ?? (await listWebLlmStorage());
  const have = s.models.find((m) => m.id === modelId)?.bytes ?? 0;
  const need = Math.max(0, sizeBytes - have);
  const free = freeBytes(e);
  const others = s.models.filter((m) => m.id !== modelId);
  if (free === null) return { ok: true, need, free, others };
  return { ok: need === 0 || free >= need * 1.1 + SAFETY_MARGIN_BYTES, need, free, others };
}
