---
id: src/lib/transform/aggregate.ts
type: module
file: src/lib/transform/aggregate.ts
area: lib/transform
---

# src/lib/transform/aggregate.ts

*Module* · area [[lib - transform|lib/transform]] · 204 lines

> AGGREGATE: summaries per group of break variables, added to the active file or as a new dataset.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only, value
- [[dsops.ts]] · value
- [[syntax.ts]] · value

## Imported by
- [[transform/index.ts]] · re-export

## Types
AggFunction (line 9) · AggItem (line 25) · AggregateSpec (line 33)

## Private helpers
isCount() (line 50) · labelOf() (line 52) · STRING_FUNCTIONS_TEXT (line 55)

## Symbols

### AGG_FUNCTIONS
*const* · line 11 · exported
- Used in: [[MergeDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[data-fixes.test.ts]]

### AggregateError
*class* · line 41 · exported
- Used in: [[transforms-ops.fuzz.test.ts]], [[data-fixes.test.ts]]

### STRING_AGG_FUNCTIONS
*const* · line 44 · exported
> Functions that work on string (text) variables, as in SPSS AGGREGATE.
- Used in: [[MergeDialogs.tsx]], [[data-fixes.test.ts]]

### aggNeedsSource
*function* · line 47 · exported
> Functions that need a source variable (all except the group counts N and NU).
- Used in: [[MergeDialogs.tsx]]

### aggregate
*function* · line 57 · exported
- Calls: [[aggregate.ts#AggregateError|AggregateError]], [[aggregate.ts#aggNeedsSource|aggNeedsSource()]], [[aggregate.ts]], [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#caseWeights|caseWeights()]], [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#validateVarName|validateVarName()]], [[core/types.ts#makeDataset|makeDataset()]], [[core/types.ts#newId|newId()]], [[dsops.ts#bump|bump()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[dsops.ts#plural|plural()]], [[syntax.ts#lines|lines()]], [[syntax.ts#q|q()]], [[syntax.ts#varList|varList()]]
- Uses: [[aggregate.ts#AGG_FUNCTIONS|AGG_FUNCTIONS]], [[aggregate.ts#STRING_AGG_FUNCTIONS|STRING_AGG_FUNCTIONS]], [[aggregate.ts]]
- Used in: [[MergeDialogs.tsx]], [[findings-repro.test.ts]], [[transforms-ops.fuzz.test.ts]], [[data-fixes.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]
