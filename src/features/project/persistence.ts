// Browser persistence: autosaved session and recent projects in IndexedDB, small prefs in
// localStorage. Every access is wrapped: storage can be missing, blocked or throw (private windows,
// the Artifact sandbox), and the app must work without it.

import type { ProjectState } from './projectFile';
import { logError, logInfo, logWarn } from '../../platform/errorlog';
import { onStorageFreed } from '../../platform/ai-storage';

const DB_NAME = 'socius';
const DB_VERSION = 1;
const SESSION_STORE = 'session';
const RECENT_STORE = 'recent';
const RECENT_LIMIT = 8;

export interface RecentEntry {
  id: string;
  name: string;
  savedAt: number;
  nCases: number;
  nVars: number;
}

interface RecentRecord extends RecentEntry {
  state: ProjectState;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(SESSION_STORE)) db.createObjectStore(SESSION_STORE);
        if (!db.objectStoreNames.contains(RECENT_STORE)) db.createObjectStore(RECENT_STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        logWarn('storage', req.error ?? 'The browser database could not be opened.', { op: 'open database' });
        resolve(null);
      };
      req.onblocked = () => resolve(null);
      setTimeout(() => resolve(null), 2500);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** A full browser storage quota (QuotaExceededError, legacy code 22). */
export function isQuotaError(e: unknown): boolean {
  const x = e as { name?: unknown; code?: unknown; message?: unknown } | null;
  return !!x && (x.name === 'QuotaExceededError' || x.code === 22 || /quota/i.test(String(x.message ?? '')));
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void, opts: { onQuota?: (e: unknown) => void } = {}): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const t = db.transaction(store, mode);
          const s = t.objectStore(store);
          const req = fn(s);
          let result: T | null = null;
          if (req) req.onsuccess = () => (result = req.result as T);
          let quotaReported = false;
          t.oncomplete = () => resolve(result);
          // A failed request is followed by the transaction's abort, which settles the promise (resolving
          // here already would lose a quota error, reported only on the abort in Chrome).
          t.onerror = (ev: Event) => {
            const err = (ev?.target as IDBRequest | null)?.error ?? t.error;
            if (opts.onQuota && isQuotaError(err) && !quotaReported) {
              quotaReported = true;
              opts.onQuota(err);
            }
          };
          // A full disk or storage quota aborts the transaction: log it (autosave did not happen).
          t.onabort = () => {
            if (quotaReported || (opts.onQuota && isQuotaError(t.error))) {
              if (!quotaReported) opts.onQuota?.(t.error);
              quotaReported = true;
            } else if (t.error?.name === 'QuotaExceededError') logError('storage', t.error, { op: `${mode} ${store}` });
            else logWarn('storage', t.error ?? 'A browser storage write was cancelled.', { op: `${mode} ${store}` });
            resolve(null);
          };
        } catch (e) {
          if (opts.onQuota && isQuotaError(e)) opts.onQuota(e);
          else logWarn('storage', e, { op: `${mode} ${store}` });
          resolve(null);
        }
      }),
  );
}

export interface SessionRecord {
  savedAt: number;
  state: ProjectState;
  /** The data had changes not saved in a project file (so a restored session still asks before replacing it). */
  modified?: boolean;
}

// ---------- autosave when the browser's storage is full ----------
//
// When a save fails because the storage quota is full (for example after downloading on-device AI
// models; every site on hackhead95.github.io shares one quota), autosave pauses instead of failing every
// 1.5 s: the latest state is kept in memory and tried again after 15 s, then 30 s, 60 s and every 2
// minutes, and at once when Socius frees space (a downloaded model deleted). The first failure is logged
// once; the app shows one banner (see getAutosaveState). The first successful save resumes autosave.

export interface AutosaveState {
  /** Saving failed because browser storage is full; autosave is paused. */
  paused: boolean;
  /** Failed saves since the pause started. */
  failures: number;
  since: number | null;
}

const PROBE_FIRST_MS = 15_000;
const PROBE_MAX_MS = 120_000;

let autosave: AutosaveState = { paused: false, failures: 0, since: null };
const autosaveListeners = new Set<() => void>();
let pending: { state: ProjectState; modified: boolean } | null = null;
let probeTimer: ReturnType<typeof setTimeout> | null = null;
let probeDelay = PROBE_FIRST_MS;
let quotaLogged = false;
let totalQuotaFailures = 0;

export function getAutosaveState(): AutosaveState {
  return autosave;
}

export function subscribeAutosave(fn: () => void): () => void {
  autosaveListeners.add(fn);
  return () => {
    autosaveListeners.delete(fn);
  };
}

function setAutosave(next: AutosaveState): void {
  autosave = next;
  for (const l of [...autosaveListeners]) {
    try {
      l();
    } catch {
      /* a listener failed */
    }
  }
}

function scheduleProbe(): void {
  if (probeTimer) return;
  const delay = probeDelay;
  probeDelay = Math.min(PROBE_MAX_MS, probeDelay * 2);
  probeTimer = setTimeout(() => {
    probeTimer = null;
    void retryAutosaveNow();
  }, delay);
}

/** Try the paused autosave again now (after space was freed). Resolves true when it saved. */
export async function retryAutosaveNow(): Promise<boolean> {
  if (probeTimer) {
    clearTimeout(probeTimer);
    probeTimer = null;
  }
  if (retrying) return retrying;
  const p = pending;
  if (!p) return !autosave.paused;
  pending = null;
  retrying = writeSession(p.state, p.modified).finally(() => (retrying = null));
  return retrying;
}

let retrying: Promise<boolean> | null = null;

async function writeSession(state: ProjectState, modified: boolean): Promise<boolean> {
  const rec: SessionRecord = { savedAt: Date.now(), state, modified };
  let quota: unknown = null;
  const ok = await tx(SESSION_STORE, 'readwrite', (s) => s.put(rec, 'current'), { onQuota: (e) => (quota = e ?? true) });
  if (quota) {
    totalQuotaFailures++;
    if (!quotaLogged) {
      quotaLogged = true;
      logError('storage', quota, { op: 'autosave paused (browser storage full)' });
    }
    // Keep the newest state, unless a newer one arrived while this one was being written.
    if (!pending) pending = { state, modified };
    setAutosave({ paused: true, failures: autosave.failures + 1, since: autosave.since ?? Date.now() });
    scheduleProbe();
    return false;
  }
  if (ok !== null && autosave.paused) {
    logInfo('storage', `Autosave resumed after ${autosave.failures} save${autosave.failures === 1 ? '' : 's'} failed because browser storage was full`, { op: 'autosave resumed' });
    probeDelay = PROBE_FIRST_MS;
    setAutosave({ paused: false, failures: 0, since: null });
  }
  return ok !== null;
}

/** Save the working state (structured clone keeps typed arrays as-is). Returns false if storage is unavailable or full. */
export async function saveSession(state: ProjectState, modified = false): Promise<boolean> {
  if (autosave.paused) {
    // Paused: remember the newest state and let the scheduled retry save it (no write every 1.5 s).
    pending = { state, modified };
    scheduleProbe();
    return false;
  }
  return writeSession(state, modified);
}

onStorageFreed(() => {
  if (!autosave.paused) return;
  // Browsers update their storage accounting a moment after files are deleted: if this try still
  // fails, try again soon (2 s, 4 s, 8 s...) rather than after the long pause.
  probeDelay = 2_000;
  void retryAutosaveNow();
});

/** Test hook. */
export function __resetAutosaveForTests(): void {
  if (probeTimer) clearTimeout(probeTimer);
  probeTimer = null;
  pending = null;
  probeDelay = PROBE_FIRST_MS;
  quotaLogged = false;
  totalQuotaFailures = 0;
  autosave = { paused: false, failures: 0, since: null };
  dbPromise = null;
}

/** Saves that failed because storage was full, this session (for reports). */
export function quotaFailureCount(): number {
  return totalQuotaFailures;
}

export async function loadSession(): Promise<SessionRecord | null> {
  const rec = await tx<SessionRecord>(SESSION_STORE, 'readonly', (s) => s.get('current'));
  if (!rec || !rec.state) return null;
  return rec;
}

export async function clearSession(): Promise<void> {
  await tx(SESSION_STORE, 'readwrite', (s) => s.delete('current'));
}

export async function listRecent(): Promise<RecentEntry[]> {
  const all = await tx<RecentRecord[]>(RECENT_STORE, 'readonly', (s) => s.getAll());
  if (!all) return [];
  return all
    .map(({ id, name, savedAt, nCases, nVars }) => ({ id, name, savedAt, nCases, nVars }))
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function loadRecent(id: string): Promise<ProjectState | null> {
  const rec = await tx<RecentRecord>(RECENT_STORE, 'readonly', (s) => s.get(id));
  return rec?.state ?? null;
}

/** Remember a project under its name (replacing an older entry with the same name). */
export async function addRecent(name: string, state: ProjectState): Promise<void> {
  const existing = await listRecent();
  const same = existing.find((e) => e.name === name);
  const rec: RecentRecord = {
    id: same?.id ?? `r_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
    savedAt: Date.now(),
    nCases: state.dataset?.nCases ?? 0,
    nVars: state.dataset?.variables.length ?? 0,
    state,
  };
  await tx(RECENT_STORE, 'readwrite', (s) => s.put(rec));
  const stale = [...existing.filter((e) => e.id !== rec.id)].slice(RECENT_LIMIT - 1);
  for (const e of stale) await tx(RECENT_STORE, 'readwrite', (s) => s.delete(e.id));
}

export async function removeRecent(id: string): Promise<void> {
  await tx(RECENT_STORE, 'readwrite', (s) => s.delete(id));
}

// ---------- localStorage prefs ----------

export function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(`socius.${key}`);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(`socius.${key}`);
    else window.localStorage.setItem(`socius.${key}`, value);
  } catch (e) {
    logWarn('storage', e, { op: 'save preference' });
    /* storage unavailable: preference is kept for this visit only */
  }
}
