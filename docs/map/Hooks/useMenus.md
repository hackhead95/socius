---
id: "src/app/menus.ts#useMenus"
type: hook
file: src/app/menus.ts
line: 36
area: app
---

# useMenus()

*React hook* · defined in [[menus.ts]] (line 36) · area [[Areas/app|app]]

- **Exported:** yes

## Calls
- [[output/actions.ts#confirmAndClearOutputs|confirmAndClearOutputs()]]
- [[output/actions.ts#exportAllOutput|exportAllOutput()]]
- [[fileActions.ts#exportCodebook|exportCodebook()]]
- [[fileActions.ts#exportCsvFile|exportCsvFile()]]
- [[fileActions.ts#exportSavFile|exportSavFile()]]
- [[fileActions.ts#exportXlsxFile|exportXlsxFile()]]
- [[fileActions.ts#loadSample|loadSample()]]
- [[shortcuts.ts#modKey|modKey()]]
- [[fileActions.ts#newDataset|newDataset()]]
- [[undo.ts#nothingTo|nothingTo()]]
- [[fileActions.ts#openDataFile|openDataFile()]]
- [[links.ts#openExternal|openExternal()]]
- [[fileActions.ts#openProjectFile|openProjectFile()]]
- [[features.ts#runAiFeature|runAiFeature()]]
- [[undo.ts#runRedo|runRedo()]]
- [[undo.ts#runUndo|runUndo()]]
- [[fileActions.ts#saveProject|saveProject()]]
- [[fileActions.ts#startFresh|startFresh()]]
- [[useStore]]
- [[useUi]]
- [[useUndoRedo|useUndoRedo()]]
- [[useUnseenErrors|useUnseenErrors()]]

## Uses
- [[features.ts#AI_FEATURES|AI_FEATURES]]
- [[menu.ts#codingMenuItems|codingMenuItems]]
- [[links.ts#GUIDE_URL|GUIDE_URL]]
- [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- [[errorlog/actions.ts#openErrorLog|openErrorLog()]]
- [[errorlog/actions.ts#openFeedback|openFeedback()]]
- [[procedures/index.ts#procedures|procedures]]
- [[output/actions.ts#REPORT_FORMATS|REPORT_FORMATS]]
- [[samples/index.ts#samples|samples]]
- [[transform/common.tsx#turnFilterOff|turnFilterOff()]]
- [[transform/common.tsx#turnWeightOff|turnWeightOff()]]
- [[useStore]]
- [[useUi]]

## Reads
- [[dataset|useStore.dataset]] · selector
- [[outputs|useStore.outputs]] · selector
- [[showValueLabels|useStore.showValueLabels]] · selector
- [[useStore/tab|useStore.tab]] · getState alias, selector
- [[currentVarId|useUi.currentVarId]] · selector
- [[sidebarOpen|useUi.sidebarOpen]] · selector
- [[useUi/theme|useUi.theme]] · selector

## Calls store actions
- [[openDialog()|useStore.openDialog()]] · getState alias
- [[setShowValueLabels()|useStore.setShowValueLabels()]] · getState alias
- [[setTab()|useStore.setTab()]] · getState alias
- [[confirm()|useUi.confirm()]] · getState
- [[requestFind()|useUi.requestFind()]] · getState
- [[requestGoto()|useUi.requestGoto()]] · getState
- [[setSidebarOpen()|useUi.setSidebarOpen()]] · getState
- [[setTheme()|useUi.setTheme()]] · getState

## Opens
- [[about|custom: about]]
- [[getting-started|custom: getting-started]]
- [[shortcuts|custom: shortcuts]]
- [[recent|file: recent]]

## Defines
- [[AI]]
- [[Analyze]]
- [[Data]]
- [[Edit]]
- [[File]]
- [[Graphs]]
- [[Menus/Help|Help]]
- [[Menus/Text coding|Text coding]]
- [[Menus/Transform|Transform]]
- [[Menus/View|View]]

## Called by
- [[MenuBar|<MenuBar>]]
- [[navigation-audit.test.tsx]]
- [[search.test.ts]]
- [[useEntries|useEntries()]]
