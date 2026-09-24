---
id: src/features/output/viewPrefs.ts
type: module
file: src/features/output/viewPrefs.ts
area: features/output
---

# src/features/output/viewPrefs.ts

*Module* · area [[features - output|features/output]] · 44 lines

> Output viewer preferences (per browser, remembered across sessions when storage is available).

## Imports
- [[output/format.ts]] · type-only
- [[zustand]] · value

## Reads
- [[socius.output.prefs]]

## Tested by
- [[figures.test.tsx]] · import

## Imported by
- [[output/actions.ts]] · value
- [[OutputViewer.tsx]] · value
- [[figures.test.tsx]] · dynamic

## Private helpers
KEY (line 12) · load() (line 14)

## Symbols

### useOutputPrefs
*store* · line 29 · exported · note: [[useOutputPrefs]]
- Calls: [[viewPrefs.ts]]
- Uses: [[viewPrefs.ts]]
- Writes: [[socius.output.prefs]]
- Used in: [[OutputViewer.tsx]], [[output/actions.ts]]
