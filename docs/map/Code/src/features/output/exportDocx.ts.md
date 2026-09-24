---
id: src/features/output/exportDocx.ts
type: module
file: src/features/output/exportDocx.ts
area: features/output
---

# src/features/output/exportDocx.ts

*Module* · area [[features - output|features/output]] · 178 lines

> Output items -> Word (.docx) with the `docx` library. Tables become real Word tables in APA style (horizontal rules only, bold header, no vertical borders); charts are embedded as PNG images.

## Imports
- [[docx]] · value
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
ChartImage (line 12) · ChartImageProvider (line 19)

## Private helpers
FONT (line 21) · MONO (line 22) · NONE (line 23) · RULE_THICK (line 24) · RULE (line 25) · TEXT_WIDTH (line 27) · tableToDocx() (line 29) · para() (line 112)

## Symbols

### buildDocx
*function* · line 120 · exported
> Build the Word document for a set of output items.
- Calls: [[exportDocx.ts]], [[reportHtml.ts#blockVisible|blockVisible()]], [[reportHtml.ts#itemMeta|itemMeta()]]
- Uses: [[exportDocx.ts]]
- Output: [[Blocks/chart|chart]], [[heading]], [[table]], [[text]]
- Used in: [[export.test.ts]]
