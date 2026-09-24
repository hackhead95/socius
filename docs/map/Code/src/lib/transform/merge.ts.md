---
id: src/lib/transform/merge.ts
type: module
file: src/lib/transform/merge.ts
area: lib/transform
---

# src/lib/transform/merge.ts

*Module* · area [[lib - transform|lib/transform]] · 307 lines

> Merge Files: Add Cases (ADD FILES) and Add Variables (MATCH FILES).

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only, value
- [[dsops.ts]] · value
- [[syntax.ts]] · value

## Imported by
- [[transform/index.ts]] · re-export

## Types
VariablePairing (line 23) · AddCasesOptions (line 50) · AddVariablesOptions (line 151)

## Private helpers
emptyValue() (line 11) · mergeLabels() (line 15)

## Symbols

### MergeError
*class* · line 9 · exported
- Used in: [[transforms-ops.fuzz.test.ts]]

### pairVariables
*function* · line 31 · exported
- Used in: [[MergeDialogs.tsx]], [[transforms-ops.fuzz.test.ts]]

### addCases
*function* · line 58 · exported
- Calls: [[core/data.ts#uniqueVarName|uniqueVarName()]], [[core/types.ts#newId|newId()]], [[dsops.ts#bump|bump()]], [[dsops.ts#fmtN|fmtN()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[dsops.ts#plural|plural()]], [[merge.ts#pairVariables|pairVariables()]], [[merge.ts]], [[syntax.ts#lines|lines()]], [[syntax.ts#q|q()]], [[syntax.ts#varList|varList()]]
- Used in: [[MergeDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[transforms.test.ts]]

### addVariables
*function* · line 164 · exported
- Calls: [[core/types.ts#newId|newId()]], [[dsops.ts#bump|bump()]], [[dsops.ts#fmtN|fmtN()]], [[dsops.ts#plural|plural()]], [[merge.ts#MergeError|MergeError]], [[merge.ts]], [[syntax.ts#lines|lines()]], [[syntax.ts#q|q()]]
- Used in: [[MergeDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[transforms.test.ts]]
