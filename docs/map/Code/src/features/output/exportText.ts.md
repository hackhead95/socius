---
id: src/features/output/exportText.ts
type: module
file: src/features/output/exportText.ts
area: features/output
---

# src/features/output/exportText.ts

*Module* · area [[features - output|features/output]] · 70 lines

> Output items -> plain text (for .txt export and plain-text clipboard fallbacks).

## Imports
- [[format-date.ts]] · value
- [[output.ts]] · type-only
- [[dataTable.ts]] · value
- [[output/format.ts]] · value
- [[reportHtml.ts]] · value
- [[tableRender.ts]] · value

## Tested by
- [[invariants.ts]] · import
- [[replay.test.ts]] · import
- [[export.test.ts]] · import

## Imported by
- [[output/actions.ts]] · value
- [[invariants.ts]] · value
- [[replay.test.ts]] · value
- [[export.test.ts]] · value

## Private helpers
wrap() (line 9)

## Symbols

### itemToText
*function* · line 28 · exported
- Calls: [[dataTable.ts#chartDataTable|chartDataTable()]], [[exportText.ts]], [[output/format.ts#formatNumber|formatNumber()]], [[reportHtml.ts#blockVisible|blockVisible()]], [[reportHtml.ts#itemMeta|itemMeta()]], [[tableRender.ts#tableToText|tableToText()]]
- Output: [[Blocks/chart|chart]], [[heading]], [[table]], [[text]]
- Used in: [[output/actions.ts]], [[invariants.ts]], [[replay.test.ts]]

### reportToText
*function* · line 65 · exported
- Calls: [[exportText.ts#itemToText|itemToText()]], [[format-date.ts#formatLongDate|formatLongDate()]]
- Used in: [[output/actions.ts]], [[export.test.ts]]
