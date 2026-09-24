---
id: src/features/analysis/runProcedure.ts
type: module
file: src/features/analysis/runProcedure.ts
area: features/analysis
---

# src/features/analysis/runProcedure.ts

*Module* · area [[features - analysis|features/analysis]] · 130 lines

> Running a procedure from its dialog without freezing the page. Small analyses run directly (they finish in milliseconds and need no copy of the data). Larger ones run in a Web Worker (procedure.worker.ts): the dataset is copied to the worker, the procedure runs there, and the finished OutputItem (plain JSON) comes back. The dialog shows elapsed time and can stop a background run. When a worker ...

## Imports
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[procedures/index.ts]] · value

## Tested by
- [[fuzz-fixes.test.ts]] · import

## Imported by
- [[procedure.worker.ts]] · value
- [[ProcedureDialog.tsx]] · value
- [[fuzz-fixes.test.ts]] · value

## Types
RunRequest (line 14) · RunResponse (line 21) · ProcedureRun (line 47)

## Private helpers
runDirect() (line 63) · makeWorker() (line 71)

## Symbols

### handleRunRequest
*function* · line 24 · exported
> The worker's side: run the procedure and report the result or the error message.
- Calls: [[procedures/index.ts#getProcedure|getProcedure()]]
- Used in: [[procedure.worker.ts]], [[fuzz-fixes.test.ts]]

### BACKGROUND_MIN_CELLS
*const* · line 36 · exported
> Data cells (cases x variables used) from which a run goes to the worker.

### runsInBackground
*function* · line 39 · exported
> Whether this run is worth doing in the background.
- Uses: [[procedures/index.ts#procedures|procedures]], [[runProcedure.ts#BACKGROUND_MIN_CELLS|BACKGROUND_MIN_CELLS]]
- Used in: [[fuzz-fixes.test.ts]]

### StoppedError
*class* · line 56 · exported
- Used in: [[ProcedureDialog.tsx]]

### startProcedureRun
*function* · line 77 · exported
> Start a run: in a worker when that is worthwhile and possible, otherwise directly.
- Calls: [[runProcedure.ts#StoppedError|StoppedError]], [[runProcedure.ts#runsInBackground|runsInBackground()]], [[runProcedure.ts]]
- Used in: [[ProcedureDialog.tsx]], [[fuzz-fixes.test.ts]]
