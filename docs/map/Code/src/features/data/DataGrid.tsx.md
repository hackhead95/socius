---
id: src/features/data/DataGrid.tsx
type: module
file: src/features/data/DataGrid.tsx
area: features/data
---

# src/features/data/DataGrid.tsx

*Module* · area [[features - data|features/data]] · 544 lines

> Virtualised Data View grid (rows AND columns), SPSS-style: sticky variable-name header, sticky case numbers (struck through when filtered out), keyboard navigation, type-to-edit, value-label dropdown, TSV copy/paste, and one extra "ghost" row and column for adding data.

## Imports
- [[@tanstack-react-virtual|@tanstack/react-virtual]] · value
- [[react]] · value
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[gridEdit.ts]] · value
- [[MeasureIcon.tsx]] · value

## Imported by
- [[DataView.tsx]] · value

## Types
Sel (line 15) · Rect (line 22) · EditCommit (line 39)

## Private helpers
GHOST_W (line 13)

## Symbols

### ROW_H
*const* · line 11 · exported

### HEAD_H
*const* · line 12 · exported

### selRect
*function* · line 29 · exported
- Used in: [[DataView.tsx]]

### colWidth
*function* · line 33 · exported

### DataGrid
*component* · line 71 · exported · note: [[DataGrid|<DataGrid>]]
- Renders: [[GridCell|<GridCell>]], [[MeasureIcon|<MeasureIcon>]]
- Calls: [[DataGrid.tsx#selRect|selRect()]], [[MeasureIcon.tsx#measureKind|measureKind()]], [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[gridEdit.ts#editText|editText()]]
- Uses: [[DataGrid.tsx#HEAD_H|HEAD_H]], [[DataGrid.tsx#ROW_H|ROW_H]], [[DataGrid.tsx#colWidth|colWidth()]], [[DataGrid.tsx]]
- Rendered by: [[DataViewInner|<DataViewInner>]]

### GridCell
*component* · line 506 · note: [[GridCell|<GridCell>]]
- Calls: [[core/data.ts#formatCell|formatCell()]], [[core/data.ts#formatRawValue|formatRawValue()]], [[core/data.ts#isUserMissing|isUserMissing()]]
