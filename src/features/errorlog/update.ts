// "Socius was updated" notice. After a new version is published, a tab that is still open on the old
// version asks for code files (chunks) that no longer exist; the browser then fails to load them
// ("Failed to fetch dynamically imported module", Vite's `vite:preloadError`). Instead of a broken
// feature, the app shows a calm banner with a Reload button (UpdateBanner.tsx).
//
// A reload is remembered for a minute in sessionStorage: if loading fails again right after reloading,
// the banner says to check the connection instead of offering the same reload in a loop.
import { useSyncExternalStore } from 'react';

export type UpdateNotice = null | 'updated' | 'still-failing';

const RELOAD_KEY = 'socius.reloadedForUpdate';
const LOOP_MS = 60_000;

let notice: UpdateNotice = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const l of [...listeners]) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

/** Messages browsers use when a module script (a code chunk) cannot be loaded. */
const CHUNK_RE = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError|Loading (?:CSS )?chunk [\w-]+ failed/i;

/** True when `err` is a failure to load one of Socius's code files (typical after an update). */
export function isChunkLoadError(err: unknown): boolean {
  try {
    if (!err) return false;
    const e = err as { name?: unknown; message?: unknown };
    if (e.name === 'ChunkLoadError') return true;
    const msg = typeof err === 'string' ? err : typeof e.message === 'string' ? e.message : '';
    return CHUNK_RE.test(msg);
  } catch {
    return false;
  }
}

function reloadedRecently(now = Date.now()): boolean {
  try {
    const t = Number(sessionStorage.getItem(RELOAD_KEY) ?? '');
    return Number.isFinite(t) && t > 0 && now - t < LOOP_MS;
  } catch {
    return false;
  }
}

/** A code file failed to load: show the banner (once; calling again changes nothing). */
export function showUpdateNotice(): void {
  const next: UpdateNotice = reloadedRecently() ? 'still-failing' : 'updated';
  if (notice === next) return;
  notice = next;
  notify();
}

export function dismissUpdateNotice(): void {
  if (notice === null) return;
  notice = null;
  notify();
}

let beforeReload: (() => Promise<unknown>) | null = null;

/** Work to finish before reloading (the app shell registers "save the session now"). */
export function setBeforeReload(fn: (() => Promise<unknown>) | null): void {
  beforeReload = fn;
}

/**
 * Reload the page to get the new version (remembered, so a failing reload does not loop). The latest
 * work is saved first (the banner promises it is autosaved; a change made a moment ago may not be yet),
 * waiting at most two seconds.
 */
export async function reloadForUpdate(): Promise<void> {
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* storage blocked: reload anyway */
  }
  try {
    if (beforeReload) await Promise.race([beforeReload(), new Promise((r) => setTimeout(r, 2000))]);
  } catch {
    /* reload anyway */
  }
  window.location.reload();
}

export function getUpdateNotice(): UpdateNotice {
  return notice;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useUpdateNotice(): UpdateNotice {
  return useSyncExternalStore(subscribe, () => notice, () => null);
}

/** Test hook. */
export function __resetUpdateNoticeForTests(): void {
  notice = null;
  notify();
}
