---
id: src/lib/transform/aggregate.ts
type: module
file: src/lib/transform/aggregate.ts
area: lib/transform
---

# src/lib/transform/aggregate.ts

*Module* · area [[lib - transform|lib/transform]] · 166 lines

> AGGREGATE: summaries per group of break variables, added to the active file or as a new dataset.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only, value
- [[dsops.ts]] · value
- [[syntax.ts]] · value

## Imported by
- [[transform/index.ts]] · re-export

## Types
AggFunction (line 9) · AggItem (line 23) · AggregateSpec (line 31)

## Symbols

### AGG_FUNCTIONS
*const* · line 11 · exported
- Used in: [[MergeDialogs.tsx]], [[transforms-ops.fuzz.test.ts]]

### AggregateError
*class* · line 39 · exported
- Used in: [[transforms-ops.fuzz.test.ts]]

### aggregate
*function* · line 41 · exported
- Calls: [[aggregate.ts#AggregateError|AggregateError]], [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#caseWeights|caseWeights()]], [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#validateVarName|validateVarName()]], [[core/types.ts#makeDataset|makeDataset()]], [[core/types.ts#newId|newId()]], [[dsops.ts#bump|bump()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[dsops.ts#plural|plural()]], [[syntax.ts#lines|lines()]], [[syntax.ts#q|q()]], [[syntax.ts#varList|varList()]]
- Uses: [[aggregate.ts#AGG_FUNCTIONS|AGG_FUNCTIONS]]
- Used in: [[MergeDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]
