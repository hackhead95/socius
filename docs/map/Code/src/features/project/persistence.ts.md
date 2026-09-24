---
id: src/features/project/persistence.ts
type: module
file: src/features/project/persistence.ts
area: features/project
---

# src/features/project/persistence.ts

*Module* · area [[features - project|features/project]] · 305 lines

> Browser persistence: autosaved session and recent projects in IndexedDB, small prefs in localStorage. Every access is wrapped: storage can be missing, blocked or throw (private windows, the Artifact sandbox), and the app must work without it.

## Imports
- [[projectFile.ts]] · type-only
- [[ai-storage.ts]] · value
- [[errorlog.ts]] · value

## Calls
- [[errorlog.ts#logError|logError()]]
- [[errorlog.ts#logInfo|logInfo()]]
- [[errorlog.ts#logWarn|logWarn()]]
- [[ai-storage.ts#onStorageFreed|onStorageFreed()]]

## Writes
- [[socius-session|socius/session]]

## Tested by
- [[storage.test.ts]] · import

## Imported by
- [[App.tsx]] · value
- [[CommandPalette.tsx]] · value
- [[ui-store.ts]] · value
- [[Welcome.tsx]] · value
- [[StorageManager.tsx]] · value
- [[fileActions.ts]] · value
- [[FileDialogs.tsx]] · value
- [[storage.test.ts]] · dynamic

## Types
RecentEntry (line 15) · SessionRecord (line 100) · AutosaveState (line 115)

## Private helpers
DB_NAME (line 9) · DB_VERSION (line 10) · SESSION_STORE (line 11) · RECENT_STORE (line 12) · RECENT_LIMIT (line 13) · dbPromise (line 27) · openDb() (line 29) · tx() (line 60) · PROBE_FIRST_MS (line 123) · PROBE_MAX_MS (line 124) · autosave (line 126) · autosaveListeners (line 127) · pending (line 128) · probeTimer (line 129) · probeDelay (line 130) · quotaLogged (line 131) · totalQuotaFailures (line 132) · setAutosave() (line 145) · scheduleProbe() (line 156) · retrying (line 180) · writeSession() (line 182)

## Symbols

### isQuotaError
*function* · line 55 · exported
> A full browser storage quota (QuotaExceededError, legacy code 22).

### getAutosaveState
*function* · line 134 · exported
- Uses: [[persistence.ts]]
- Used in: [[StorageManager.tsx]]

### subscribeAutosave
*function* · line 138 · exported
- Uses: [[persistence.ts]]
- Used in: [[StorageManager.tsx]]

### retryAutosaveNow
*function* · line 167 · exported
> Try the paused autosave again now (after space was freed). Resolves true when it saved.
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Used in: [[StorageManager.tsx]]

### saveSession
*function* · line 207 · exported
> Save the working state (structured clone keeps typed arrays as-is). Returns false if storage is unavailable or full.
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Used in: [[App.tsx]]

### __resetAutosaveForTests
*function* · line 226 · exported
> Test hook.
- Uses: [[persistence.ts]]

### quotaFailureCount
*function* · line 238 · exported
> Saves that failed because storage was full, this session (for reports).
- Uses: [[persistence.ts]]

### loadSession
*function* · line 242 · exported
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Reads: [[socius-session|socius/session]]
- Used in: [[App.tsx]]

### clearSession
*function* · line 248 · exported
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Writes: [[socius-session|socius/session]]
- Used in: [[fileActions.ts]]

### listRecent
*function* · line 252 · exported
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Reads: [[socius-recent|socius/recent]]
- Used in: [[Welcome.tsx]], [[FileDialogs.tsx]]

### loadRecent
*function* · line 260 · exported
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Reads: [[socius-recent|socius/recent]]
- Used in: [[fileActions.ts]]

### addRecent
*function* · line 266 · exported
> Remember a project under its name (replacing an older entry with the same name).
- Calls: [[persistence.ts#listRecent|listRecent()]], [[persistence.ts]]
- Uses: [[persistence.ts]]
- Writes: [[socius-recent|socius/recent]]
- Used in: [[fileActions.ts]]

### removeRecent
*function* · line 282 · exported
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Writes: [[socius-recent|socius/recent]]
- Used in: [[FileDialogs.tsx]]

### readPref
*function* · line 288 · exported
> ---------- localStorage prefs ----------
- Used in: [[CommandPalette.tsx]], [[ui-store.ts]]

### writePref
*function* · line 296 · exported
- Calls: [[errorlog.ts#logWarn|logWarn()]]
- Used in: [[CommandPalette.tsx]], [[ui-store.ts]]
