---
id: "src/features/data/DataView.tsx#DataViewInner"
type: component
file: src/features/data/DataView.tsx
line: 24
area: features/data
---

# <DataViewInner>

*React component* · defined in [[DataView.tsx]] (line 24) · area [[features - data|features/data]]

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[mutations.ts#clearRange|clearRange()]]
- [[host.ts#copyToClipboard|copyToClipboard()]]
- [[core/data.ts#formatCell|formatCell()]]
- [[core/data.ts#formatRawValue|formatRawValue()]]
- [[mutations.ts#looksLikeHeader|looksLikeHeader()]]
- [[mutations.ts#nameVariablesFromHeader|nameVariablesFromHeader()]]
- [[mutations.ts#newDefaultVariable|newDefaultVariable()]]
- [[gridEdit.ts#parseCellInput|parseCellInput()]]
- [[gridEdit.ts#parseTsv|parseTsv()]]
- [[DataGrid.tsx#selRect|selRect()]]
- [[cases.ts#sortCases|sortCases()]]
- [[find.ts#summarizeColumn|summarizeColumn()]]
- [[gridEdit.ts#toTsv|toTsv()]]
- [[log.ts#transformLogItem|transformLogItem()]]
- [[useStore]]
- [[useUi]]
- [[mutations.ts#writeTexts|writeTexts()]]

## Renders
- [[ContextMenu|<ContextMenu>]]
- [[DataGrid|<DataGrid>]]
- [[FindBar|<FindBar>]]
- [[GotoBar|<GotoBar>]]
- [[Icon|<Icon>]]
- [[StatsPopover|<StatsPopover>]]

## Uses
- [[useStore]]

## Reads
- [[showValueLabels|useStore.showValueLabels]] · selector
- [[findSeq|useUi.findSeq]] · selector
- [[gotoSeq|useUi.gotoSeq]] · selector
- [[gridTarget|useUi.gridTarget]] · selector

## Calls store actions
- [[addOutput()|useStore.addOutput()]] · getState
- [[addVariable()|useStore.addVariable()]] · getState
- [[deleteCases()|useStore.deleteCases()]] · getState
- [[deleteVariables()|useStore.deleteVariables()]] · getState
- [[insertCases()|useStore.insertCases()]] · getState
- [[mutateDataset()|useStore.mutateDataset()]] · selector
- [[setCell()|useStore.setCell()]] · getState
- [[setShowValueLabels()|useStore.setShowValueLabels()]] · selector
- [[setTab()|useStore.setTab()]] · selector
- [[toast()|useStore.toast()]] · selector
- [[focusVariableView()|useUi.focusVariableView()]] · selector
- [[setCurrentVarId()|useUi.setCurrentVarId()]] · selector

## Rendered by
- [[DataView|<DataView>]]

## Binds shortcut
- [[Mod+C (DataViewInner)]]
- [[Mod+V (DataViewInner)]]
