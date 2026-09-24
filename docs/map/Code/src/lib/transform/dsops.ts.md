---
id: src/lib/transform/dsops.ts
type: module
file: src/lib/transform/dsops.ts
area: lib/transform
---

# src/lib/transform/dsops.ts

*Module* · area [[lib - transform|lib/transform]] · 106 lines

> Immutable dataset helpers shared by all transformations. Each returns a NEW Dataset (version + 1) that shares unchanged columns with the input, so undo stays cheap.

## Imports
- [[core/types.ts]] · type-only, value

## Imported by
- [[DefineProperties.tsx]] · value
- [[aggregate.ts]] · value
- [[binning.ts]] · value
- [[cases.ts]] · value
- [[compute.ts]] · value
- [[derive.ts]] · value
- [[transform/index.ts]] · re-export
- [[log.ts]] · type-only
- [[merge.ts]] · value
- [[properties.ts]] · value
- [[recode.ts]] · value

## Types
TransformResult (line 7)

## Symbols

### bump
*function* · line 18 · exported
- Used in: [[aggregate.ts]], [[cases.ts]], [[merge.ts]], [[properties.ts]], [[recode.ts]]

### withColumns
*function* · line 22 · exported
- Calls: [[dsops.ts#bump|bump()]]

### addVariable
*function* · line 27 · exported
> Add a variable (with data) at `index` (default end).
- Calls: [[dsops.ts#bump|bump()]]
- Used in: [[binning.ts]], [[cases.ts]], [[compute.ts]], [[derive.ts]], [[recode.ts]]

### replaceVariable
*function* · line 34 · exported
> Replace a variable's definition (same id) and optionally its column.
- Calls: [[dsops.ts#bump|bump()]]
- Used in: [[cases.ts]], [[compute.ts]], [[derive.ts]]

### takeRows
*function* · line 40 · exported
> Reorder (or subset) all cases: new row i = old row order[i].
- Calls: [[dsops.ts#bump|bump()]]
- Used in: [[cases.ts]]

### numFormat
*function* · line 59 · exported
> Numeric format string for a width/decimals pair.

### newNumericVar
*function* · line 64 · exported
> A new numeric variable definition with SPSS-like defaults.
- Calls: [[core/types.ts#makeVariable|makeVariable()]], [[dsops.ts#numFormat|numFormat()]]
- Used in: [[aggregate.ts]], [[binning.ts]], [[cases.ts]], [[compute.ts]], [[derive.ts]], [[merge.ts]], [[recode.ts]]

### newStringVar
*function* · line 70 · exported
- Calls: [[core/types.ts#makeVariable|makeVariable()]]
- Used in: [[compute.ts]], [[recode.ts]]

### allIntegers
*function* · line 76 · exported
> True if every non-NaN value is an integer (used to pick 0 decimals for new variables).

### suggestDecimals
*function* · line 85 · exported
> Suggest a sensible number of decimals for a computed column (0 for integers, else 2).
- Calls: [[dsops.ts#allIntegers|allIntegers()]]
- Used in: [[compute.ts]], [[derive.ts]], [[recode.ts]]

### countSysmis
*function* · line 89 · exported
- Used in: [[compute.ts]]

### rowsWhere
*function* · line 98 · exported
> Filter mask helper: indexes of cases in play, optional.

### fmtN
*function* · line 104 · exported
- Used in: [[DefineProperties.tsx]], [[binning.ts]], [[cases.ts]], [[compute.ts]], [[derive.ts]], [[merge.ts]], [[properties.ts]]

### plural
*function* · line 105 · exported
- Calls: [[dsops.ts#fmtN|fmtN()]]
- Used in: [[DefineProperties.tsx]], [[aggregate.ts]], [[cases.ts]], [[merge.ts]], [[properties.ts]], [[recode.ts]]
