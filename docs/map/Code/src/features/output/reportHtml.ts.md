---
id: src/features/output/reportHtml.ts
type: module
file: src/features/output/reportHtml.ts
area: features/output
---

# src/features/output/reportHtml.ts

*Module* · area [[features - output|features/output]] · 135 lines

> Output items -> HTML. `itemToHtml` produces a fragment with inline styles only (safe to paste into Word or Google Docs); `reportToHtmlDocument` wraps items into a standalone, printable page.

## Imports
- [[output.ts]] · type-only
- [[output/format.ts]] · type-only
- [[tableRender.ts]] · value

## Tested by
- [[export.test.ts]] · import

## Imported by
- [[AiFeatureDialogs.tsx]] · value
- [[output/actions.ts]] · value
- [[exportDocx.ts]] · value
- [[exportText.ts]] · value
- [[OutputViewer.tsx]] · value
- [[export.test.ts]] · value

## Types
ReportOptions (line 8) · Counters (line 14) · ChartHtml (line 20)

## Private helpers
SERIF (line 22)

## Symbols

### formatItemTime
*function* · line 24 · exported
- Used in: [[AiFeatureDialogs.tsx]], [[OutputViewer.tsx]]

### itemMeta
*function* · line 29 · exported
- Calls: [[reportHtml.ts#formatItemTime|formatItemTime()]]
- Used in: [[exportDocx.ts]], [[exportText.ts]]

### blockVisible
*function* · line 37 · exported
> Whether a block is shown under the given options.
- Output: [[text]]
- Used in: [[exportDocx.ts]], [[exportText.ts]]

### itemToHtml
*function* · line 41 · exported
- Calls: [[reportHtml.ts#blockVisible|blockVisible()]], [[reportHtml.ts#itemMeta|itemMeta()]], [[tableRender.ts#esc|esc()]], [[tableRender.ts#tableToHtml|tableToHtml()]]
- Output: [[Blocks/chart|chart]], [[heading]], [[table]], [[text]]
- Used in: [[output/actions.ts]], [[export.test.ts]]

### reportToHtmlDocument
*function* · line 91 · exported
> Standalone HTML report (styled, printable).
- Calls: [[reportHtml.ts#itemToHtml|itemToHtml()]], [[tableRender.ts#esc|esc()]]
- Uses: [[reportHtml.ts]]
- Used in: [[output/actions.ts]], [[export.test.ts]]
