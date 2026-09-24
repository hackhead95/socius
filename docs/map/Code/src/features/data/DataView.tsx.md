---
id: src/features/data/DataView.tsx
type: module
file: src/features/data/DataView.tsx
area: features/data
---

# src/features/data/DataView.tsx

*Module* · area [[features - data|features/data]] · 524 lines

> Data View: toolbar, virtualised grid, find bar, context menus and quick column statistics.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[core/data.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[DataGrid.tsx]] · value
- [[find.ts]] · value
- [[gridEdit.ts]] · value
- [[mutations.ts]] · value
- [[transform/index.ts]] · value
- [[host.ts]] · value
- [[Icon.tsx]] · value
- [[Menu.tsx]] · value

## Tested by
- [[shortcut-precedence.test.tsx]] · import

## Imported by
- [[App.tsx]] · value
- [[shortcut-precedence.test.tsx]] · value

## Private helpers
MAX_COPY_CELLS (line 16) · fmt() (line 469)

## Symbols

### DataView
*component* · line 18 · exported · note: [[DataView|<DataView>]]
- Renders: [[DataViewInner|<DataViewInner>]]
- Calls: [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Rendered by: [[Components/App|<App>]], [[shortcut-precedence.test.tsx]]

### DataViewInner
*component* · line 24 · note: [[DataViewInner|<DataViewInner>]]
- Renders: [[ContextMenu|<ContextMenu>]], [[DataGrid|<DataGrid>]], [[FindBar|<FindBar>]], [[GotoBar|<GotoBar>]], [[Icon|<Icon>]], [[StatsPopover|<StatsPopover>]]
- Calls: [[DataGrid.tsx#selRect|selRect()]], [[cases.ts#sortCases|sortCases()]], [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#formatCell|formatCell()]], [[core/data.ts#formatRawValue|formatRawValue()]], [[find.ts#summarizeColumn|summarizeColumn()]], [[gridEdit.ts#parseCellInput|parseCellInput()]], [[gridEdit.ts#parseTsv|parseTsv()]], [[gridEdit.ts#toTsv|toTsv()]], [[host.ts#copyToClipboard|copyToClipboard()]], [[log.ts#transformLogItem|transformLogItem()]], [[mutations.ts#clearRange|clearRange()]], [[mutations.ts#looksLikeHeader|looksLikeHeader()]], [[mutations.ts#nameVariablesFromHeader|nameVariablesFromHeader()]], [[mutations.ts#newDefaultVariable|newDefaultVariable()]], [[mutations.ts#writeTexts|writeTexts()]], [[useStore]], [[useUi]]
- Uses: [[DataView.tsx]], [[useStore]]
- Reads: [[findSeq|useUi.findSeq]], [[gotoSeq|useUi.gotoSeq]], [[gridTarget|useUi.gridTarget]], [[showValueLabels|useStore.showValueLabels]]
- Store actions: [[addOutput()|useStore.addOutput()]], [[addVariable()|useStore.addVariable()]], [[deleteCases()|useStore.deleteCases()]], [[deleteVariables()|useStore.deleteVariables()]], [[focusVariableView()|useUi.focusVariableView()]], [[insertCases()|useStore.insertCases()]], [[mutateDataset()|useStore.mutateDataset()]], [[setCell()|useStore.setCell()]], [[setCurrentVarId()|useUi.setCurrentVarId()]], [[setShowValueLabels()|useStore.setShowValueLabels()]], [[setTab()|useStore.setTab()]], [[toast()|useStore.toast()]]

### FindBar
*component* · line 368 · note: [[FindBar|<FindBar>]]
- Renders: [[Icon|<Icon>]]
- Calls: [[find.ts#findNext|findNext()]]

### GotoBar
*component* · line 431 · note: [[GotoBar|<GotoBar>]]
- Renders: [[Icon|<Icon>]]

### StatsPopover
*component* · line 471 · note: [[StatsPopover|<StatsPopover>]]
- Renders: [[Icon|<Icon>]]
- Calls: [[DataView.tsx]]
