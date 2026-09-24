---
id: "area:core"
type: area
area: core
---

# Area: core

7 files, 1218 lines.

## Used by areas
- [[procedures]]: 69
- [[features - coding|features/coding]]: 35
- [[lib - coding|lib/coding]]: 22
- [[lib - transform|lib/transform]]: 22
- [[Areas/app|app]]: 21
- [[features - data|features/data]]: 20
- [[lib - assistant|lib/assistant]]: 19
- [[features - output|features/output]]: 15
- [[features - transform|features/transform]]: 14
- [[features - charts|features/charts]]: 11
- [[lib - io|lib/io]]: 11
- [[features - project|features/project]]: 10
- [[features - ai|features/ai]]: 9
- [[features - analysis|features/analysis]]: 9
- [[features - assistant|features/assistant]]: 5
- [[features - errorlog|features/errorlog]]: 5
- [[ui]]: 2
- [[samples]]: 1

## Files
- [[coding-types.ts]]: Qualitative text-coding project model (lives in the main store, saved with the project).
- [[core/data.ts]]: Shared data-access semantics. Statistics procedures, transforms, the grid and exporters must all use these so missing values, filters and we…
- [[format-date.ts]]: One way to show dates and times everywhere in the app (Output, memos, exports, recent files). Locale-aware for English: the month is always …
- [[output.ts]]: Output model. Every analysis produces one OutputItem made of blocks (tables, charts, text). Procedures build these; the Output viewer render…
- [[procedure.ts]]: Declarative procedure definitions. A statistics module registers a ProcedureDef; the UI renders a generic dialog from `slots` + `options`, t…
- [[store.ts]]: Global app store (zustand). One active dataset, the output log, and the text-coding project. Dataset updates are immutable: every mutation p…
- [[core/types.ts]]: Core data model. Mirrors the SPSS dictionary closely so .sav files round-trip without loss. Storage rules (every module relies on these): - …

## Stores
[[useStore]]
