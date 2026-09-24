---
id: src/lib/transform/cases.ts
type: module
file: src/lib/transform/cases.ts
area: lib/transform
---

# src/lib/transform/cases.ts

*Module* · area [[lib - transform|lib/transform]] · 347 lines

> Case-level operations: Select Cases (filter or delete), Sort Cases, Weight Cases.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[dsops.ts]] · value
- [[evaluate.ts]] · value
- [[expr.ts]] · value
- [[syntax.ts]] · value

## Imported by
- [[transform/index.ts]] · re-export

## Types
SelectMethod (line 32) · SelectOutput (line 40) · SortKey (line 247) · WeightCheck (line 296)

## Private helpers
describeMethod() (line 110)

## Symbols

### CasesError
*class* · line 10 · exported
- Used in: [[CasesDialogs.tsx]], [[transforms-ops.fuzz.test.ts]]

### seededRandom
*function* · line 21 · exported
> Small seeded PRNG (mulberry32): same seed, same sample.

### selectionValues
*function* · line 45 · exported
> Selection per case: 1 selected, 0 not selected, NaN when the condition is missing (not selected).
- Calls: [[cases.ts#CasesError|CasesError]], [[cases.ts#seededRandom|seededRandom()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[dsops.ts#fmtN|fmtN()]], [[evaluate.ts#compileExpression|compileExpression()]]
- Uses: [[expr.ts#ExprError|ExprError]]
- Used in: [[CasesDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[transforms.test.ts]]

### FILTER_VAR_NAME
*const* · line 132 · exported

### selectCasesTransform
*function* · line 134 · exported
- Calls: [[cases.ts#CasesError|CasesError]], [[cases.ts#selectionValues|selectionValues()]], [[cases.ts]], [[core/data.ts#uniqueVarName|uniqueVarName()]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#bump|bump()]], [[dsops.ts#fmtN|fmtN()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[dsops.ts#plural|plural()]], [[dsops.ts#replaceVariable|replaceVariable()]], [[dsops.ts#takeRows|takeRows()]], [[syntax.ts#lines|lines()]], [[syntax.ts#q|q()]]
- Uses: [[cases.ts#FILTER_VAR_NAME|FILTER_VAR_NAME]]
- Used in: [[CasesDialogs.tsx]], [[transform/common.tsx]], [[scenarios.test.ts]], [[findings-repro.test.ts]], [[transforms-ops.fuzz.test.ts]], [[data-fixes.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]

### sortOrder
*function* · line 253 · exported
> Stable multi-key sort order. System-missing sorts lowest (first when ascending), as in SPSS.
- Used in: [[dialog-transforms.test.ts]]

### sortCases
*function* · line 277 · exported
- Calls: [[cases.ts#CasesError|CasesError]], [[cases.ts#sortOrder|sortOrder()]], [[dsops.ts#fmtN|fmtN()]], [[dsops.ts#takeRows|takeRows()]]
- Used in: [[DataView.tsx]], [[CasesDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[dialog-transforms.test.ts]], [[transforms.test.ts]]

### checkWeightVariable
*function* · line 305 · exported
- Calls: [[cases.ts#CasesError|CasesError]], [[core/data.ts#isUserMissing|isUserMissing()]]
- Used in: [[CasesDialogs.tsx]], [[transforms.test.ts]]

### weightWarnings
*function* · line 324 · exported
- Calls: [[dsops.ts#plural|plural()]]
- Used in: [[CasesDialogs.tsx]]

### weightCases
*function* · line 332 · exported
- Calls: [[cases.ts#CasesError|CasesError]], [[cases.ts#checkWeightVariable|checkWeightVariable()]], [[cases.ts#weightWarnings|weightWarnings()]], [[dsops.ts#bump|bump()]]
- Used in: [[CasesDialogs.tsx]], [[transform/common.tsx]], [[transforms-ops.fuzz.test.ts]], [[transforms.test.ts]]
