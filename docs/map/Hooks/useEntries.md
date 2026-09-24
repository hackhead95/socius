---
id: "src/app/CommandPalette.tsx#useEntries"
type: hook
file: src/app/CommandPalette.tsx
line: 75
area: app
---

# useEntries()

*React hook* · defined in [[CommandPalette.tsx]] (line 75) · area [[Areas/app|app]]

> Everything searchable right now.

## Calls
- [[search.ts#commandsFromMenus|commandsFromMenus()]]
- [[format-date.ts#formatTime|formatTime()]]
- [[procedures/index.ts#getProcedure|getProcedure()]]
- [[helpTopics.ts#helpTopicUrl|helpTopicUrl()]]
- [[links.ts#openExternal|openExternal()]]
- [[varUtils.ts#prefillProcedure|prefillProcedure()]]
- [[useMenus|useMenus()]]
- [[useStore]]

## Uses
- [[helpTopics.ts#HELP_TOPICS|HELP_TOPICS]]
- [[procedures/index.ts#procedures|procedures]]
- [[useCodingUi]]
- [[useStore]]
- [[useUi]]

## Reads
- [[useStore/coding|useStore.coding]] · selector
- [[dataset|useStore.dataset]] · getState alias, selector
- [[outputs|useStore.outputs]] · selector

## Writes
- [[selectedCodeId|useCodingUi.selectedCodeId]] · getState.set, set()
- [[useCodingUi/view|useCodingUi.view]] · getState.set, set()

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · getState
- [[openDialog()|useStore.openDialog()]] · getState alias
- [[setTab()|useStore.setTab()]] · getState alias
- [[focusGrid()|useUi.focusGrid()]] · getState alias
- [[focusOutput()|useUi.focusOutput()]] · getState alias
- [[focusVariableView()|useUi.focusVariableView()]] · getState alias

## Defines
- [[Palette/coding|Search palette: coding]]
- [[Palette/help|Search palette: help]]
- [[results|Search palette: results]]
- [[variables|Search palette: variables]]

## Called by
- [[CommandPalette|<CommandPalette>]]
