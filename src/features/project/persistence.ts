// Browser persistence: autosaved session and recent projects in IndexedDB, small prefs in
// localStorage. Every access is wrapped: storage can be missing, blocked or throw (private windows,
// the Artifact sandbox), and the app must work without it.

import type { ProjectState } from './projectFile';

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
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
      setTimeout(() => resolve(null), 2500);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | null> {
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
          t.oncomplete = () => resolve(result);
          t.onerror = () => resolve(null);
          t.onabort = () => resolve(null);
        } catch {
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

/** Save the working state (structured clone keeps typed arrays as-is). Returns false if storage is unavailable. */
export async function saveSession(state: ProjectState, modified = false): Promise<boolean> {
  const rec: SessionRecord = { savedAt: Date.now(), state, modified };
  const ok = await tx(SESSION_STORE, 'readwrite', (s) => s.put(rec, 'current'));
  return ok !== null;
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
  } catch {
    /* storage unavailable: preference is kept for this visit only */
  }
}
