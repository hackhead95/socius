---
id: src/features/errorlog/update.ts
type: module
file: src/features/errorlog/update.ts
area: features/errorlog
---

# src/features/errorlog/update.ts

*Module* · area [[features - errorlog|features/errorlog]] · 113 lines

> "Socius was updated" notice. After a new version is published, a tab that is still open on the old version asks for code files (chunks) that no longer exist; the browser then fails to load them ("Failed to fetch dynamically imported module", Vite's `vite:preloadError`). Instead of a broken feature, the app shows a calm banner with a Reload button (UpdateBanner.tsx). A reload is remembered for a...

## Imports
- [[react]] · value

## Reads
- [[socius.reloadedForUpdate]]

## Tested by
- [[errorlog-install.test.tsx]] · import

## Imported by
- [[App.tsx]] · value
- [[install.ts]] · value
- [[UpdateBanner.tsx]] · value
- [[errorlog-install.test.tsx]] · value

## Types
UpdateNotice (line 10)

## Private helpers
RELOAD_KEY (line 12) · LOOP_MS (line 13) · notice (line 15) · listeners (line 16) · notify() (line 18) · CHUNK_RE (line 29) · reloadedRecently() (line 44) · beforeReload (line 67) · subscribe() (line 97)

## Symbols

### isChunkLoadError
*function* · line 32 · exported
> True when `err` is a failure to load one of Socius's code files (typical after an update).
- Uses: [[update.ts]]
- Used in: [[install.ts]], [[errorlog-install.test.tsx]]

### showUpdateNotice
*function* · line 54 · exported
> A code file failed to load: show the banner (once; calling again changes nothing).
- Calls: [[update.ts]]
- Uses: [[update.ts]]
- Used in: [[install.ts]]

### dismissUpdateNotice
*function* · line 61 · exported
- Calls: [[update.ts]]
- Uses: [[update.ts]]
- Used in: [[UpdateBanner.tsx]]

### setBeforeReload
*function* · line 70 · exported
> Work to finish before reloading (the app shell registers "save the session now").
- Uses: [[update.ts]]
- Used in: [[App.tsx]]

### reloadForUpdate
*function* · line 79 · exported
> Reload the page to get the new version (remembered, so a failing reload does not loop). The latest work is saved first (the banner promises it is autosaved; a change made a moment ago may not be yet), waiting at most two seconds.
- Calls: [[update.ts]]
- Uses: [[update.ts]]
- Writes: [[socius.reloadedForUpdate]]
- Used in: [[UpdateBanner.tsx]]

### getUpdateNotice
*function* · line 93 · exported
- Uses: [[update.ts]]
- Used in: [[errorlog-install.test.tsx]]

### useUpdateNotice
*hook* · line 104 · exported · note: [[useUpdateNotice|useUpdateNotice()]]
- Uses: [[update.ts]]
- Used in: [[UpdateBanner.tsx]]

### __resetUpdateNoticeForTests
*function* · line 109 · exported
> Test hook.
- Calls: [[update.ts]]
- Uses: [[update.ts]]
- Used in: [[errorlog-install.test.tsx]]
