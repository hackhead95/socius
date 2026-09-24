---
id: "src/features/output/viewPrefs.ts#useOutputPrefs"
type: store
file: src/features/output/viewPrefs.ts
line: 29
area: features/output
---

# useOutputPrefs

*Store* · defined in [[viewPrefs.ts]] (line 29) · area [[features - output|features/output]]

- **Exported:** yes

## Keys and who touches them
| key | written by | read by |
|---|---|---|
| [[showInterpretations]] | 1 ([[OutputViewer\|<OutputViewer>]]) | 4 |
| [[showSyntax]] | 1 ([[OutputViewer\|<OutputViewer>]]) | 4 |
| [[tableStyle]] | 1 ([[OutputViewer\|<OutputViewer>]]) | 4 |

## Actions
| action | writes | callers |
|---|---|---|
| [[useOutputPrefs/set()\|set()]] |  | 1 |

## Writes
- [[socius.output.prefs]]

## State keys
- [[showInterpretations|useOutputPrefs.showInterpretations]]
- [[showSyntax|useOutputPrefs.showSyntax]]
- [[tableStyle|useOutputPrefs.tableStyle]]

## Actions
- [[useOutputPrefs/set()|useOutputPrefs.set()]]

## Called by
- [[BlockView|<BlockView>]]
- [[OutputItemView|<OutputItemView>]]
- [[OutputViewer|<OutputViewer>]]

## Used by
- [[output/actions.ts#exportAllOutput|exportAllOutput()]]
