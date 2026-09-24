---
id: src/features/output/OutputViewer.tsx
type: module
file: src/features/output/OutputViewer.tsx
area: features/output
---

# src/features/output/OutputViewer.tsx

*Module* · area [[features - output|features/output]] · 578 lines

> The Output viewer: a document of analysis results (like the SPSS Output Viewer) with an outline navigator, APA/SPSS table styles, per-item and per-block actions, and report exports.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[output.ts]] · type-only
- [[store.ts]] · value
- `src/features/ai/ai.css` · side-effect
- [[ExplainPanel.tsx]] · value
- [[explainPrompt.ts]] · value
- [[explainStore.ts]] · value
- [[ai/hooks.ts]] · value
- [[Chart.tsx]] · value
- [[dataTable.ts]] · value
- [[output/actions.ts]] · value
- [[output/format.ts]] · value
- [[output/icons.tsx]] · value
- `src/features/output/output.css` · side-effect
- [[OutputTableView.tsx]] · value
- [[reportHtml.ts]] · value
- [[viewPrefs.ts]] · value
- [[platform/ai.ts]] · value
- [[procedures/index.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[App.tsx]] · value

## Private helpers
QUICK_START (line 29) · blockAnchor() (line 31) · itemAnchor() (line 32)

## Symbols

### useNumbering
*hook* · line 35 · note: [[useNumbering|useNumbering()]]
> Table and figure numbers across the whole document (APA numbering).
- Output: [[table]]

### blockLabel
*function* · line 44
- Output: [[Blocks/chart|chart]], [[heading]], [[table]]

### OutputViewer
*component* · line 51 · exported · note: [[OutputViewer|<OutputViewer>]]
- Renders: [[EmptyState|<EmptyState>]], [[ExportMenu|<ExportMenu>]], [[IconChart|<IconChart>]], [[IconOutline|<IconOutline>]], [[IconTable|<IconTable>]], [[IconText|<IconText>]], [[IconX|<IconX>]], [[OutputItemView|<OutputItemView>]]
- Calls: [[OutputViewer.tsx#blockLabel|blockLabel()]], [[OutputViewer.tsx]], [[output/actions.ts#confirmAndClearOutputs|confirmAndClearOutputs()]], [[output/actions.ts#copyItem|copyItem()]], [[output/actions.ts#exportReport|exportReport()]], [[useNumbering|useNumbering()]], [[useOutputPrefs]], [[useStore]], [[useUi]]
- Uses: [[useStore]]
- Reads: [[outputTarget|useUi.outputTarget]], [[outputs|useStore.outputs]], [[showInterpretations|useOutputPrefs.showInterpretations]], [[showSyntax|useOutputPrefs.showSyntax]], [[tableStyle|useOutputPrefs.tableStyle]], [[useStore/focusOutputId|useStore.focusOutputId]]
- Writes: [[outputs|useStore.outputs]], [[showInterpretations|useOutputPrefs.showInterpretations]], [[showSyntax|useOutputPrefs.showSyntax]], [[tableStyle|useOutputPrefs.tableStyle]]
- Store actions: [[clearOutputs()|useStore.clearOutputs()]], [[moveOutput()|useStore.moveOutput()]], [[removeOutput()|useStore.removeOutput()]], [[useOutputPrefs/set()|useOutputPrefs.set()]]
- Output: [[Blocks/chart|chart]], [[table]]
- Rendered by: [[Components/App|<App>]]

### ExportMenu
*component* · line 270 · note: [[ExportMenu|<ExportMenu>]]
- Renders: [[IconDownload|<IconDownload>]]
- Uses: [[output/actions.ts#REPORT_FORMATS|REPORT_FORMATS]]

### EmptyState
*component* · line 320 · note: [[EmptyState|<EmptyState>]]
- Calls: [[procedures/index.ts#getProcedure|getProcedure()]], [[useStore]]
- Uses: [[OutputViewer.tsx]]
- Reads: [[dataset|useStore.dataset]]
- Store actions: [[openDialog()|useStore.openDialog()]]

### OutputItemView
*component* · line 365 · note: [[OutputItemView|<OutputItemView>]]
- Renders: [[BlockView|<BlockView>]], [[ExplainButton|<ExplainButton>]], [[ExplainPanel|<ExplainPanel>]], [[IconChevron|<IconChevron>]], [[IconCopy|<IconCopy>]], [[IconDown|<IconDown>]], [[IconTrash|<IconTrash>]], [[IconUp|<IconUp>]], [[SyntaxView|<SyntaxView>]]
- Calls: [[OutputViewer.tsx]], [[explainPrompt.ts#isExplainable|isExplainable()]], [[reportHtml.ts#formatItemTime|formatItemTime()]], [[useOutputPrefs]]
- Reads: [[showSyntax|useOutputPrefs.showSyntax]]

### BlockView
*component* · line 415 · note: [[BlockView|<BlockView>]]
- Renders: [[ChartBlock|<ChartBlock>]], [[IconCopy|<IconCopy>]], [[IconDownload|<IconDownload>]], [[IconWarn|<IconWarn>]], [[OutputTableView|<OutputTableView>]]
- Calls: [[output/actions.ts#copyTable|copyTable()]], [[output/actions.ts#copyText|copyText()]], [[output/actions.ts#saveTableXlsx|saveTableXlsx()]], [[useOutputPrefs]]
- Reads: [[showInterpretations|useOutputPrefs.showInterpretations]], [[tableStyle|useOutputPrefs.tableStyle]]
- Output: [[Blocks/chart|chart]], [[heading]], [[table]], [[text]]

### ChartBlock
*component* · line 482 · note: [[ChartBlock|<ChartBlock>]]
- Renders: [[Components/Chart|<Chart>]], [[IconDownload|<IconDownload>]], [[IconTable|<IconTable>]]
- Calls: [[dataTable.ts#chartDataTable|chartDataTable()]], [[output/actions.ts#saveChartPng|saveChartPng()]], [[output/actions.ts#saveChartSvg|saveChartSvg()]], [[output/format.ts#formatNumber|formatNumber()]]
- Output: [[scatter]]

### SyntaxView
*component* · line 535 · note: [[SyntaxView|<SyntaxView>]]
- Renders: [[IconCopy|<IconCopy>]]
- Calls: [[output/actions.ts#copyText|copyText()]]

### ExplainButton
*component* · line 553 · note: [[ExplainButton|<ExplainButton>]]
> "Explain with AI": opens the panel under the item (or AI set-up first, then continues).
- Calls: [[ai/hooks.ts#openAiSettings|openAiSettings()]], [[platform/ai.ts#getAiStatus|getAiStatus()]], [[useExplain]]
- Uses: [[useExplain]]
- Reads: [[panels|useExplain.panels]]
- Store actions: [[close()|useExplain.close()]], [[open()|useExplain.open()]], [[setPending()|useExplain.setPending()]]
