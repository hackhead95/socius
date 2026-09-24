---
id: src/app/menus.ts
type: module
file: src/app/menus.ts
area: app
---

# src/app/menus.ts

*Module* · area [[Areas/app|app]] · 233 lines

> Menubar model: File, Edit, View, Data, Transform, Analyze, Graphs, Text coding, AI, Help. The search palette (CommandPalette) searches these same items, so every command lives here once. Rule (docs/NAVIGATION.md): each command has exactly one menu home. AI features and AI assistant settings live only in the AI menu; switching views lives only in the View menu. Toolbars, the top bar and set-up p...

## Imports
- [[links.ts]] · value
- [[shortcuts.ts]] · value
- [[ui-store.ts]] · value
- [[undo.ts]] · value
- [[procedure.ts]] · type-only
- [[store.ts]] · value
- [[features.ts]] · value
- [[ai/hooks.ts]] · value
- [[menu.ts]] · value
- [[errorlog/actions.ts]] · value
- [[output/actions.ts]] · value
- [[fileActions.ts]] · value
- [[transform/common.tsx]] · value
- [[procedures/index.ts]] · value
- [[samples/index.ts]] · value
- [[Menu.tsx]] · type-only

## Tested by
- [[navigation-audit.test.tsx]] · import
- [[search.test.ts]] · import

## Imported by
- [[CommandPalette.tsx]] · value
- [[MenuBar.tsx]] · value
- [[navigation-audit.test.tsx]] · value
- [[search.test.ts]] · value

## Types
TopMenu (line 26)

## Private helpers
NEED_DATA (line 32) · ANALYZE_ORDER (line 34)

## Symbols

### useMenus
*hook* · line 36 · exported · note: [[useMenus|useMenus()]]
- Calls: [[features.ts#runAiFeature|runAiFeature()]], [[fileActions.ts#exportCodebook|exportCodebook()]], [[fileActions.ts#exportCsvFile|exportCsvFile()]], [[fileActions.ts#exportSavFile|exportSavFile()]], [[fileActions.ts#exportXlsxFile|exportXlsxFile()]], [[fileActions.ts#loadSample|loadSample()]], [[fileActions.ts#newDataset|newDataset()]], [[fileActions.ts#openDataFile|openDataFile()]], [[fileActions.ts#openProjectFile|openProjectFile()]], [[fileActions.ts#saveProject|saveProject()]], [[fileActions.ts#startFresh|startFresh()]], [[links.ts#openExternal|openExternal()]], [[output/actions.ts#confirmAndClearOutputs|confirmAndClearOutputs()]], [[output/actions.ts#exportAllOutput|exportAllOutput()]], [[shortcuts.ts#modKey|modKey()]], [[undo.ts#nothingTo|nothingTo()]], [[undo.ts#runRedo|runRedo()]], [[undo.ts#runUndo|runUndo()]], [[useStore]], [[useUi]], [[useUndoRedo|useUndoRedo()]], [[useUnseenErrors|useUnseenErrors()]]
- Uses: [[ai/hooks.ts#openAiSettings|openAiSettings()]], [[errorlog/actions.ts#openErrorLog|openErrorLog()]], [[errorlog/actions.ts#openFeedback|openFeedback()]], [[features.ts#AI_FEATURES|AI_FEATURES]], [[links.ts#GUIDE_URL|GUIDE_URL]], [[menu.ts#codingMenuItems|codingMenuItems]], [[menus.ts]], [[output/actions.ts#REPORT_FORMATS|REPORT_FORMATS]], [[procedures/index.ts#procedures|procedures]], [[samples/index.ts#samples|samples]], [[transform/common.tsx#turnFilterOff|turnFilterOff()]], [[transform/common.tsx#turnWeightOff|turnWeightOff()]], [[useStore]], [[useUi]]
- Reads: [[currentVarId|useUi.currentVarId]], [[dataset|useStore.dataset]], [[outputs|useStore.outputs]], [[showValueLabels|useStore.showValueLabels]], [[sidebarOpen|useUi.sidebarOpen]], [[useStore/tab|useStore.tab]], [[useUi/theme|useUi.theme]]
- Store actions: [[confirm()|useUi.confirm()]], [[openDialog()|useStore.openDialog()]], [[requestFind()|useUi.requestFind()]], [[requestGoto()|useUi.requestGoto()]], [[setShowValueLabels()|useStore.setShowValueLabels()]], [[setSidebarOpen()|useUi.setSidebarOpen()]], [[setTab()|useStore.setTab()]], [[setTheme()|useUi.setTheme()]]
- Opens: [[about|custom: about]], [[getting-started|custom: getting-started]], [[recent|file: recent]], [[shortcuts|custom: shortcuts]]
- Used in: [[CommandPalette.tsx]], [[MenuBar.tsx]], [[navigation-audit.test.tsx]], [[search.test.ts]]
