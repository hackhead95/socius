---
id: src/features/analysis/procedure.worker.ts
type: module
file: src/features/analysis/procedure.worker.ts
area: features/analysis
---

# src/features/analysis/procedure.worker.ts

*Module* · area [[features - analysis|features/analysis]] · 10 lines

> Runs a built-in procedure off the main thread so the page stays responsive during long analyses. The dialog posts { id, dataset, slots, options }; the worker answers { ok: true, item } or { ok: false, message, name }. See runProcedure.ts for when the worker is used and the fallback.

## Imports
- [[runProcedure.ts]] · value

## Calls
- [[runProcedure.ts#handleRunRequest|handleRunRequest()]]
