---
id: src/app/menus.ts
type: module
file: src/app/menus.ts
area: app
---

# src/app/menus.ts

*Module* · area [[Areas/app|app]] · 276 lines

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
- [[menu-knowledge.test.ts]] · import
- [[navigation-audit.test.tsx]] · import
- [[search.test.ts]] · import
- [[ui-fixes.test.tsx]] · import

## Imported by
- [[CommandPalette.tsx]] · value
- [[MenuBar.tsx]] · value
- [[menuKnowledge.ts]] · value
- [[menu-knowledge.test.ts]] · value
- [[navigation-audit.test.tsx]] · value
- [[search.test.ts]] · value
- [[ui-fixes.test.tsx]] · value

## Types
TopMenu (line 26) · MenuState (line 37)

## Private helpers
ANALYZE_ORDER (line 34)

## Symbols

### NEED_DATA
*const* · line 32 · exported
- Used in: [[CommandPalette.tsx]]

### useMenus
*hook* · line 55 · exported · note: [[useMenus|useMenus()]]
> The menus, kept up to date (menubar, phone menu sheet, search palette).
- Calls: [[menus.ts#buildMenus|buildMenus()]], [[useNarrow|useNarrow()]], [[useStore]], [[useUi]], [[useUndoRedo|useUndoRedo()]], [[useUnseenErrors|useUnseenErrors()]]
- Reads: [[currentVarId|useUi.currentVarId]], [[dataset|useStore.dataset]], [[drawerOpen|useUi.drawerOpen]], [[outputs|useStore.outputs]], [[showValueLabels|useStore.showValueLabels]], [[sidebarOpen|useUi.sidebarOpen]], [[useStore/tab|useStore.tab]], [[useUi/theme|useUi.theme]]
- Used in: [[CommandPalette.tsx]], [[MenuBar.tsx]], [[navigation-audit.test.tsx]], [[search.test.ts]]

### allMenus
*function* · line 78 · exported
> Every command, whatever is open: data with cases, filter and weight on, some output. For knowledge about the menus (the Socius assistant), not for display: nothing is disabled or checked.
- Calls: [[menus.ts#buildMenus|buildMenus()]]
- Used in: [[menuKnowledge.ts]], [[menu-knowledge.test.ts]], [[ui-fixes.test.tsx]]

### buildMenus
*function* · line 86 · exported
> The menu model for a given state (pure apart from what the items do when chosen).
- Calls: [[features.ts#runAiFeature|runAiFeature()]], [[fileActions.ts#exportCodebook|exportCodebook()]], [[fileActions.ts#exportCsvFile|exportCsvFile()]], [[fileActions.ts#exportSavFile|exportSavFile()]], [[fileActions.ts#exportXlsxFile|exportXlsxFile()]], [[fileActions.ts#loadSample|loadSample()]], [[fileActions.ts#newDataset|newDataset()]], [[fileActions.ts#openDataFile|openDataFile()]], [[fileActions.ts#openProjectFile|openProjectFile()]], [[fileActions.ts#saveProject|saveProject()]], [[fileActions.ts#startFresh|startFresh()]], [[links.ts#openExternal|openExternal()]], [[output/actions.ts#confirmAndClearOutputs|confirmAndClearOutputs()]], [[output/actions.ts#exportAllOutput|exportAllOutput()]], [[shortcuts.ts#modKey|modKey()]], [[ui-store.ts#isNarrow|isNarrow()]], [[undo.ts#nothingTo|nothingTo()]], [[undo.ts#runRedo|runRedo()]], [[undo.ts#runUndo|runUndo()]]
- Uses: [[ai/hooks.ts#openAiSettings|openAiSettings()]], [[errorlog/actions.ts#openErrorLog|openErrorLog()]], [[errorlog/actions.ts#openFeedback|openFeedback()]], [[features.ts#AI_FEATURES|AI_FEATURES]], [[links.ts#GUIDE_URL|GUIDE_URL]], [[menu.ts#codingMenuItems|codingMenuItems]], [[menus.ts#NEED_DATA|NEED_DATA]], [[menus.ts]], [[output/actions.ts#REPORT_FORMATS|REPORT_FORMATS]], [[procedures/index.ts#procedures|procedures]], [[samples/index.ts#samples|samples]], [[transform/common.tsx#turnFilterOff|turnFilterOff()]], [[transform/common.tsx#turnWeightOff|turnWeightOff()]], [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]], [[drawerOpen|useUi.drawerOpen]], [[useStore/tab|useStore.tab]]
- Store actions: [[confirm()|useUi.confirm()]], [[openDialog()|useStore.openDialog()]], [[requestFind()|useUi.requestFind()]], [[requestGoto()|useUi.requestGoto()]], [[setShowValueLabels()|useStore.setShowValueLabels()]], [[setTab()|useStore.setTab()]], [[setTheme()|useUi.setTheme()]], [[toggleVariableList()|useUi.toggleVariableList()]]
- Opens: [[about|custom: about]], [[getting-started|custom: getting-started]], [[recent|file: recent]], [[shortcuts|custom: shortcuts]]
