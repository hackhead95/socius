---
id: "area:core"
type: area
area: core
---

# Area: core

6 files, 1125 lines.

## Used by areas
- [[procedures]]: 65
- [[features - coding|features/coding]]: 34
- [[lib - transform|lib/transform]]: 22
- [[lib - coding|lib/coding]]: 21
- [[features - data|features/data]]: 20
- [[lib - assistant|lib/assistant]]: 19
- [[Areas/app|app]]: 17
- [[features - transform|features/transform]]: 14
- [[features - charts|features/charts]]: 11
- [[features - output|features/output]]: 11
- [[lib - io|lib/io]]: 11
- [[features - project|features/project]]: 9
- [[features - ai|features/ai]]: 8
- [[features - analysis|features/analysis]]: 6
- [[features - assistant|features/assistant]]: 5
- [[features - errorlog|features/errorlog]]: 4
- [[ui]]: 2
- [[samples]]: 1

## Files
- [[coding-types.ts]]: Qualitative text-coding project model (lives in the main store, saved with the project).
- [[core/data.ts]]: Shared data-access semantics. Statistics procedures, transforms, the grid and exporters must all use these so missing values, filters and we…
- [[output.ts]]: Output model. Every analysis produces one OutputItem made of blocks (tables, charts, text). Procedures build these; the Output viewer render…
- [[procedure.ts]]: Declarative procedure definitions. A statistics module registers a ProcedureDef; the UI renders a generic dialog from `slots` + `options`, t…
- [[store.ts]]: Global app store (zustand). One active dataset, the output log, and the text-coding project. Dataset updates are immutable: every mutation p…
- [[core/types.ts]]: Core data model. Mirrors the SPSS dictionary closely so .sav files round-trip without loss. Storage rules (every module relies on these): - …

## Stores
[[useStore]]
