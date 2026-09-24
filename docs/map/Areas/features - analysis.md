---
id: "area:features/analysis"
type: area
area: features/analysis
---

# Area: features/analysis

4 files, 1233 lines.

## Depends on (module imports)
- [[core]]: 9
- [[features - output|features/output]]: 2
- [[procedures]]: 2
- [[platform]]: 1
- [[ui]]: 1

## Used by areas
- [[Areas/app|app]]: 2
- [[lib - assistant|lib/assistant]]: 2

## Files
- [[procedure.worker.ts]]: Runs a built-in procedure off the main thread so the page stays responsive during long analyses. The dialog posts { id, dataset, slots, opti…
- [[ProcedureDialog.tsx]]: Generic analysis dialog rendered from a ProcedureDef: variable list on the left, target boxes (slots) on the right, options grouped in tabs,…
- [[runProcedure.ts]]: Running a procedure from its dialog without freezing the page. Small analyses run directly (they finish in milliseconds and need no copy of …
- [[varUtils.ts]]: Pure helpers for the procedure dialog: slot suitability, placement, validation, remembered state.

## Components
[[DialogBody|<DialogBody>]] · [[GroupPairField|<GroupPairField>]] · [[HoverCard|<HoverCard>]] · [[OptionField|<OptionField>]] · [[ProcedureDialog|<ProcedureDialog>]] · [[ValueListField|<ValueListField>]] · [[VarIcon|<VarIcon>]]
