---
id: src/features/output/exportDocx.ts
type: module
file: src/features/output/exportDocx.ts
area: features/output
---

# src/features/output/exportDocx.ts

*Module* · area [[features - output|features/output]] · 179 lines

> Output items -> Word (.docx) with the `docx` library. Tables become real Word tables in APA style (horizontal rules only, bold header, no vertical borders); charts are embedded as PNG images.

## Imports
- [[docx]] · value
- [[format-date.ts]] · value
- [[output.ts]] · type-only
- [[output/format.ts]] · value
- [[reportHtml.ts]] · value

## Calls
- [[output/format.ts#formatCell|formatCell()]]
- [[output/format.ts#layoutRows|layoutRows()]]
- [[output/format.ts#percentColumns|percentColumns()]]

## Tested by
- [[export.test.ts]] · import

## Imported by
- [[output/actions.ts]] · dynamic
- [[export.test.ts]] · value

## Types
ChartImage (line 13) · ChartImageProvider (line 20)

## Private helpers
FONT (line 22) · MONO (line 23) · NONE (line 24) · RULE_THICK (line 25) · RULE (line 26) · TEXT_WIDTH (line 28) · tableToDocx() (line 30) · para() (line 113)

## Symbols

### buildDocx
*function* · line 121 · exported
> Build the Word document for a set of output items.
- Calls: [[exportDocx.ts]], [[format-date.ts#formatLongDate|formatLongDate()]], [[reportHtml.ts#blockVisible|blockVisible()]], [[reportHtml.ts#itemMeta|itemMeta()]]
- Uses: [[exportDocx.ts]]
- Output: [[Blocks/chart|chart]], [[heading]], [[table]], [[text]]
- Used in: [[export.test.ts]]
