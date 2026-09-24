---
id: src/features/output/actions.ts
type: module
file: src/features/output/actions.ts
area: features/output
---

# src/features/output/actions.ts

*Module* · area [[features - output|features/output]] · 182 lines

> Browser-side output actions: copy as rich HTML, save charts, export the report. All file saves go through platform/host (saveFile) so they work inside the claude.ai Artifact sandbox.

## Imports
- [[ui-store.ts]] · value
- [[output.ts]] · type-only
- [[store.ts]] · value
- [[export.ts]] · value
- [[exportDocx.ts]] · dynamic
- [[exportText.ts]] · value
- [[exportXlsx.ts]] · dynamic
- [[output/format.ts]] · type-only
- [[reportHtml.ts]] · value
- [[tableRender.ts]] · value
- [[viewPrefs.ts]] · value
- [[errorlog.ts]] · value
- [[host.ts]] · value

## Uses
- [[useStore]]

## Calls store actions
- [[toast()|useStore.toast()]] · getState

## Imported by
- [[menus.ts]] · value
- [[ProcedureDialog.tsx]] · value
- [[OutputViewer.tsx]] · value

## Types
ReportFormat (line 108)

## Private helpers
MIME (line 15) · toast() (line 24) · report() (line 28) · dateStamp() (line 34) · PASTE_FONT (line 44)

## Symbols

### reportFileStem
*function* · line 39 · exported
- Calls: [[export.ts#fileStem|fileStem()]], [[output/actions.ts]]

### copyItem
*function* · line 46 · exported
> inherit the target document's font when pasting
- Calls: [[export.ts#chartToPngDataUrl|chartToPngDataUrl()]], [[exportText.ts#itemToText|itemToText()]], [[host.ts#copyToClipboard|copyToClipboard()]], [[output/actions.ts]], [[reportHtml.ts#itemToHtml|itemToHtml()]]
- Uses: [[output/actions.ts]]
- Output: [[Blocks/chart|chart]]
- Used in: [[OutputViewer.tsx]]

### copyTable
*function* · line 64 · exported
- Calls: [[host.ts#copyToClipboard|copyToClipboard()]], [[output/actions.ts]], [[tableRender.ts#tableToHtml|tableToHtml()]], [[tableRender.ts#tableToText|tableToText()]]
- Used in: [[OutputViewer.tsx]]

### copyText
*function* · line 69 · exported
- Calls: [[host.ts#copyToClipboard|copyToClipboard()]], [[output/actions.ts]]
- Used in: [[ProcedureDialog.tsx]], [[OutputViewer.tsx]]

### saveTableXlsx
*function* · line 74 · exported
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[export.ts#fileStem|fileStem()]], [[host.ts#saveFile|saveFile()]], [[output/actions.ts]]
- Uses: [[output/actions.ts]]
- Used in: [[OutputViewer.tsx]]

### saveChartPng
*function* · line 86 · exported
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[export.ts#chartToPng|chartToPng()]], [[export.ts#fileStem|fileStem()]], [[host.ts#saveFile|saveFile()]], [[output/actions.ts]]
- Uses: [[output/actions.ts]]
- Used in: [[OutputViewer.tsx]]

### saveChartSvg
*function* · line 97 · exported
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[export.ts#chartToSvg|chartToSvg()]], [[export.ts#fileStem|fileStem()]], [[host.ts#saveFile|saveFile()]], [[output/actions.ts]]
- Uses: [[output/actions.ts]]
- Used in: [[OutputViewer.tsx]]

### exportReport
*function* · line 110 · exported
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[export.ts#chartToPng|chartToPng()]], [[export.ts#chartToSvg|chartToSvg()]], [[exportText.ts#reportToText|reportToText()]], [[host.ts#saveFile|saveFile()]], [[output/actions.ts#reportFileStem|reportFileStem()]], [[output/actions.ts]], [[reportHtml.ts#reportToHtmlDocument|reportToHtmlDocument()]]
- Uses: [[output/actions.ts]]
- Output: [[table]]
- Used in: [[OutputViewer.tsx]]

### REPORT_FORMATS
*const* · line 157 · exported
> The report formats, in menu order. Shared by File > Export output report and the Output toolbar.
- Used in: [[menus.ts]], [[OutputViewer.tsx]]

### exportAllOutput
*function* · line 165 · exported
> Export every output item with the Output view's current settings (table style, interpretations, syntax).
- Calls: [[output/actions.ts#exportReport|exportReport()]]
- Uses: [[useOutputPrefs]], [[useStore]]
- Reads: [[outputs|useStore.outputs]], [[showInterpretations|useOutputPrefs.showInterpretations]], [[showSyntax|useOutputPrefs.showSyntax]], [[tableStyle|useOutputPrefs.tableStyle]]
- Used in: [[menus.ts]]

### confirmAndClearOutputs
*function* · line 171 · exported
> One confirmation for clearing the output, used by Edit > Clear output... and the Output toolbar.
- Uses: [[useStore]], [[useUi]]
- Reads: [[outputs|useStore.outputs]]
- Store actions: [[clearOutputs()|useStore.clearOutputs()]], [[confirm()|useUi.confirm()]]
- Used in: [[menus.ts]], [[OutputViewer.tsx]]
