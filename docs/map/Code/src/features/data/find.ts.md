---
id: src/features/data/find.ts
type: module
file: src/features/data/find.ts
area: features/data
---

# src/features/data/find.ts

*Module* · area [[features - data|features/data]] · 134 lines

> Find in the Data View: matches values and value labels without formatting every cell.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only

## Calls
- [[core/data.ts#valueLabelFor|valueLabelFor()]]

## Tested by
- [[dataview.test.ts]] · import

## Imported by
- [[DataView.tsx]] · value
- [[dataview.test.ts]] · value

## Types
FindOptions (line 6) · ColumnSummary (line 67)

## Private helpers
matcherFor() (line 18)

## Symbols

### findNext
*function* · line 47 · exported
> Next match after (row, col) in reading order (row by row), wrapping around. dir -1 searches backwards.
- Calls: [[find.ts]]
- Used in: [[DataView.tsx]], [[dataview.test.ts]]

### summarizeColumn
*function* · line 84 · exported
> Quick column summary respecting the filter and weight (like SPSS's statistics on a column).
- Calls: [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#caseWeights|caseWeights()]], [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#valueLabelFor|valueLabelFor()]]
- Used in: [[DataView.tsx]], [[dataview.test.ts]]
