---
id: src/features/output/OutputTableView.tsx
type: module
file: src/features/output/OutputTableView.tsx
area: features/output
---

# src/features/output/OutputTableView.tsx

*Module* · area [[features - output|features/output]] · 127 lines

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[output/format.ts]] · value

## Imported by
- [[OutputViewer.tsx]] · value

## Symbols

### useScrollEdges
*hook* · line 6 · note: [[useScrollEdges|useScrollEdges()]]
> Which sides of a horizontal scroller have content out of view (updates on scroll and resize).

### OutputTableView
*component* · line 31 · exported · note: [[OutputTableView|<OutputTableView>]]
> An output table on screen: APA (horizontal rules only) or SPSS (light grid) style.
- Calls: [[output/format.ts#formatCell|formatCell()]], [[output/format.ts#isSignificantP|isSignificantP()]], [[output/format.ts#layoutRows|layoutRows()]], [[output/format.ts#percentColumns|percentColumns()]], [[output/format.ts#stubCount|stubCount()]], [[useScrollEdges|useScrollEdges()]]
- Rendered by: [[BlockView|<BlockView>]]
