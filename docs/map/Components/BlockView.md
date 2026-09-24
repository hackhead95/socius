---
id: "src/features/output/OutputViewer.tsx#BlockView"
type: component
file: src/features/output/OutputViewer.tsx
line: 409
area: features/output
---

# <BlockView>

*React component* · defined in [[OutputViewer.tsx]] (line 409) · area [[features - output|features/output]]

## Calls
- [[output/actions.ts#copyTable|copyTable()]]
- [[output/actions.ts#copyText|copyText()]]
- [[output/actions.ts#saveTableXlsx|saveTableXlsx()]]
- [[useOutputPrefs]]

## Renders
- [[ChartBlock|<ChartBlock>]]
- [[IconCopy|<IconCopy>]]
- [[IconDownload|<IconDownload>]]
- [[IconWarn|<IconWarn>]]
- [[OutputTableView|<OutputTableView>]]

## Reads
- [[showInterpretations|useOutputPrefs.showInterpretations]] · alias
- [[tableStyle|useOutputPrefs.tableStyle]] · alias

## Handles
- [[Blocks/chart|chart]] · renderer
- [[heading]] · renderer
- [[table]] · renderer
- [[text]] · renderer

## Rendered by
- [[OutputItemView|<OutputItemView>]]
