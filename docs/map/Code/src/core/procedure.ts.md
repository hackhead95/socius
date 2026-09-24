---
id: src/core/procedure.ts
type: module
file: src/core/procedure.ts
area: core
---

# src/core/procedure.ts

*Module* · area [[core]] · 75 lines

> Declarative procedure definitions. A statistics module registers a ProcedureDef; the UI renders a generic dialog from `slots` + `options`, then calls `run`. This keeps statistics and UI decoupled.

## Imports
- [[output.ts]] · type-only
- [[core/types.ts]] · type-only

## Tested by
- [[scenarios.test.ts]] · import
- [[proc-cases.ts]] · import
- [[proc-harness.ts]] · import
- [[procedures-oracle.fuzz.test.ts]] · import
- [[procedures.fuzz.test.ts]] · import
- [[dialog-ui.test.tsx]] · import
- [[dialog.test.ts]] · import
- [[graphs.test.ts]] · import
- [[stats-core/procedures.test.ts]] · import
- [[sample-survey.test.ts]] · import
- [[stats-models/procedures.test.ts]] · import
- [[separation.test.ts]] · import

## Imported by
- [[menus.ts]] · type-only
- [[ProcedureDialog.tsx]] · type-only
- [[varUtils.ts]] · type-only, value
- [[tools/analysis.ts]] · value
- [[assistant/types.ts]] · type-only
- [[core/common.ts]] · type-only
- [[correlations.ts]] · type-only
- [[core/crosstabs.ts]] · type-only
- [[core/descriptives.ts]] · type-only
- [[core/frequencies.ts]] · type-only
- [[core/index.ts]] · type-only
- [[core/nonparametric.ts]] · type-only
- [[oneway.ts]] · type-only
- [[ttests.ts]] · type-only
- [[graphs/index.ts]] · type-only
- [[procedures/index.ts]] · type-only
- [[binary.ts]] · type-only
- [[models/common.ts]] · type-only
- [[models/factor.ts]] · type-only
- [[models/index.ts]] · type-only
- [[linear.ts]] · type-only
- [[nomreg.ts]] · type-only
- [[plum.ts]] · type-only
- [[models/reliability.ts]] · type-only
- [[scenarios.test.ts]] · value
- [[proc-cases.ts]] · type-only
- [[proc-harness.ts]] · type-only, value
- [[procedures-oracle.fuzz.test.ts]] · value
- [[procedures.fuzz.test.ts]] · type-only, value
- [[dialog-ui.test.tsx]] · type-only
- [[dialog.test.ts]] · dynamic, type-only
- [[graphs.test.ts]] · value
- [[stats-core/procedures.test.ts]] · value
- [[sample-survey.test.ts]] · value
- [[stats-models/procedures.test.ts]] · value
- [[separation.test.ts]] · value

## Types
ProcedureMenu (line 7) · VarSlot (line 18) · OptionDef (line 31) · OptionValues (line 44) · SlotValues (line 46) · ProcedureDef (line 48)

## Symbols

### defaultOptions
*function* · line 67 · exported
> Fill option defaults.
- Used in: [[varUtils.ts]], [[tools/analysis.ts]], [[scenarios.test.ts]], [[proc-harness.ts]], [[procedures-oracle.fuzz.test.ts]], [[procedures.fuzz.test.ts]], [[graphs.test.ts]], [[stats-core/procedures.test.ts]], [[sample-survey.test.ts]], [[stats-models/procedures.test.ts]], [[separation.test.ts]]
