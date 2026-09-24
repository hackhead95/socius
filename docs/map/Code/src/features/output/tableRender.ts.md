---
id: src/features/output/tableRender.ts
type: module
file: src/features/output/tableRender.ts
area: features/output
---

# src/features/output/tableRender.ts

*Module* · area [[features - output|features/output]] · 161 lines

> Output table -> HTML string (inline styles, for Word/Google Docs paste and the HTML report) and -> plain text. Pure: no DOM, so exporters and tests share it.

## Imports
- [[output.ts]] · type-only
- [[output/format.ts]] · value

## Tested by
- [[export.test.ts]] · import

## Imported by
- [[output/actions.ts]] · value
- [[exportText.ts]] · value
- [[reportHtml.ts]] · value
- [[assistant/format.ts]] · value
- [[export.test.ts]] · value

## Types
TableHtmlOptions (line 11)

## Private helpers
INK (line 19) · GRID (line 20) · HEAD_BG (line 21) · cellAlign() (line 23)

## Symbols

### esc
*function* · line 7 · exported
- Used in: [[reportHtml.ts]]

### tableToHtml
*function* · line 31 · exported
> One table as an HTML fragment with inline styles only.
- Calls: [[output/format.ts#formatCell|formatCell()]], [[output/format.ts#layoutRows|layoutRows()]], [[output/format.ts#percentColumns|percentColumns()]], [[output/format.ts#stubCount|stubCount()]], [[tableRender.ts#esc|esc()]], [[tableRender.ts]]
- Uses: [[tableRender.ts]]
- Used in: [[output/actions.ts]], [[reportHtml.ts]], [[export.test.ts]]

### tableToText
*function* · line 105 · exported
> Plain-text table with aligned columns (spans flattened into their first column).
- Calls: [[output/format.ts#formatCell|formatCell()]], [[output/format.ts#layoutRows|layoutRows()]], [[output/format.ts#percentColumns|percentColumns()]], [[output/format.ts#stubCount|stubCount()]]
- Used in: [[output/actions.ts]], [[exportText.ts]], [[assistant/format.ts]], [[export.test.ts]]

### tableToMatrix
*function* · line 147 · exported
> Cell matrix with spans, formatted as text; used by the Excel exporter.
- Calls: [[output/format.ts#formatCell|formatCell()]], [[output/format.ts#layoutRows|layoutRows()]], [[output/format.ts#percentColumns|percentColumns()]], [[output/format.ts#stubCount|stubCount()]]
