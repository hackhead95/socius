---
id: src/features/project/persistence.ts
type: module
file: src/features/project/persistence.ts
area: features/project
---

# src/features/project/persistence.ts

*Module* · area [[features - project|features/project]] · 157 lines

> Browser persistence: autosaved session and recent projects in IndexedDB, small prefs in localStorage. Every access is wrapped: storage can be missing, blocked or throw (private windows, the Artifact sandbox), and the app must work without it.

## Imports
- [[projectFile.ts]] · type-only
- [[errorlog.ts]] · value

## Calls
- [[errorlog.ts#logError|logError()]]
- [[errorlog.ts#logWarn|logWarn()]]

## Imported by
- [[App.tsx]] · value
- [[CommandPalette.tsx]] · value
- [[ui-store.ts]] · value
- [[Welcome.tsx]] · value
- [[fileActions.ts]] · value
- [[FileDialogs.tsx]] · value

## Types
RecentEntry (line 14) · SessionRecord (line 80)

## Private helpers
DB_NAME (line 8) · DB_VERSION (line 9) · SESSION_STORE (line 10) · RECENT_STORE (line 11) · RECENT_LIMIT (line 12) · dbPromise (line 26) · openDb() (line 28) · tx() (line 53)

## Symbols

### saveSession
*function* · line 88 · exported
> Save the working state (structured clone keeps typed arrays as-is). Returns false if storage is unavailable.
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Writes: [[socius-session|socius/session]]
- Used in: [[App.tsx]]

### loadSession
*function* · line 94 · exported
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Reads: [[socius-session|socius/session]]
- Used in: [[App.tsx]]

### clearSession
*function* · line 100 · exported
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Writes: [[socius-session|socius/session]]
- Used in: [[fileActions.ts]]

### listRecent
*function* · line 104 · exported
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Reads: [[socius-recent|socius/recent]]
- Used in: [[Welcome.tsx]], [[FileDialogs.tsx]]

### loadRecent
*function* · line 112 · exported
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Reads: [[socius-recent|socius/recent]]
- Used in: [[fileActions.ts]]

### addRecent
*function* · line 118 · exported
> Remember a project under its name (replacing an older entry with the same name).
- Calls: [[persistence.ts#listRecent|listRecent()]], [[persistence.ts]]
- Uses: [[persistence.ts]]
- Writes: [[socius-recent|socius/recent]]
- Used in: [[fileActions.ts]]

### removeRecent
*function* · line 134 · exported
- Calls: [[persistence.ts]]
- Uses: [[persistence.ts]]
- Writes: [[socius-recent|socius/recent]]
- Used in: [[FileDialogs.tsx]]

### readPref
*function* · line 140 · exported
> ---------- localStorage prefs ----------
- Used in: [[CommandPalette.tsx]], [[ui-store.ts]]

### writePref
*function* · line 148 · exported
- Calls: [[errorlog.ts#logWarn|logWarn()]]
- Used in: [[CommandPalette.tsx]], [[ui-store.ts]]
