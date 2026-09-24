---
id: src/features/output/reportHtml.ts
type: module
file: src/features/output/reportHtml.ts
area: features/output
---

# src/features/output/reportHtml.ts

*Module* · area [[features - output|features/output]] · 136 lines

> Output items -> HTML. `itemToHtml` produces a fragment with inline styles only (safe to paste into Word or Google Docs); `reportToHtmlDocument` wraps items into a standalone, printable page.

## Imports
- [[format-date.ts]] · value
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
ReportOptions (line 9) · Counters (line 15) · ChartHtml (line 21)

## Private helpers
SERIF (line 23)

## Symbols

### formatItemTime
*function* · line 26 · exported
> When a result was made: the app-wide date and time format ("24 Sep 2026, 14:55").
- Calls: [[format-date.ts#formatDateTime|formatDateTime()]]
- Used in: [[AiFeatureDialogs.tsx]], [[OutputViewer.tsx]]

### itemMeta
*function* · line 30 · exported
- Calls: [[reportHtml.ts#formatItemTime|formatItemTime()]]
- Used in: [[exportDocx.ts]], [[exportText.ts]]

### blockVisible
*function* · line 38 · exported
> Whether a block is shown under the given options.
- Output: [[text]]
- Used in: [[exportDocx.ts]], [[exportText.ts]]

### itemToHtml
*function* · line 42 · exported
- Calls: [[reportHtml.ts#blockVisible|blockVisible()]], [[reportHtml.ts#itemMeta|itemMeta()]], [[tableRender.ts#esc|esc()]], [[tableRender.ts#tableToHtml|tableToHtml()]]
- Output: [[Blocks/chart|chart]], [[heading]], [[table]], [[text]]
- Used in: [[output/actions.ts]], [[export.test.ts]]

### reportToHtmlDocument
*function* · line 92 · exported
> Standalone HTML report (styled, printable).
- Calls: [[format-date.ts#formatLongDate|formatLongDate()]], [[reportHtml.ts#itemToHtml|itemToHtml()]], [[tableRender.ts#esc|esc()]]
- Uses: [[reportHtml.ts]]
- Used in: [[output/actions.ts]], [[export.test.ts]]
