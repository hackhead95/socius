---
id: src/app/TopBar.tsx
type: module
file: src/app/TopBar.tsx
area: app
---

# src/app/TopBar.tsx

*Module* · area [[Areas/app|app]] · 154 lines

> Top bar: product mark, menus, search, AI status, dataset name and size, weight / filter / sample chips, undo/redo, theme.

## Imports
- [[react]] · value
- [[CommandPalette.tsx]] · value
- [[links.ts]] · value
- [[MenuBar.tsx]] · value
- [[shortcuts.ts]] · value
- [[ui-store.ts]] · value
- [[undo.ts]] · value
- [[core/data.ts]] · value
- [[store.ts]] · value
- [[AiFeatureDialogs.tsx]] · value
- [[errorlog/actions.ts]] · value
- [[fileActions.ts]] · value
- [[transform/common.tsx]] · value
- [[Icon.tsx]] · value

## Imported by
- [[App.tsx]] · value

## Private helpers
fmtN() (line 18)

## Symbols

### Mark
*component* · line 24 · exported · note: [[Mark|<Mark>]]
> The Socius logo is the Home button: it shows the start screen (open a file, recent projects, getting started) over whatever is open; "Back to your data" there (or any tab) returns.
- Calls: [[useUi]]
- Uses: [[useUi]]
- Reads: [[home (store-key)|useUi.home]]
- Store actions: [[setHome()|useUi.setHome()]]

### TopBar
*component* · line 41 · exported · note: [[TopBar|<TopBar>]]
- Renders: [[AiChip|<AiChip>]], [[DatasetName|<DatasetName>]], [[Icon|<Icon>]], [[Mark|<Mark>]], [[MenuBar|<MenuBar>]]
- Calls: [[TopBar.tsx]], [[core/data.ts#activeCaseMask|activeCaseMask()]], [[errorlog/actions.ts#openFeedback|openFeedback()]], [[fileActions.ts#isModified|isModified()]], [[shortcuts.ts#modKey|modKey()]], [[undo.ts#nothingTo|nothingTo()]], [[undo.ts#runRedo|runRedo()]], [[undo.ts#runUndo|runUndo()]], [[useStore]], [[useUi]], [[useUndoRedo|useUndoRedo()]]
- Uses: [[CommandPalette.tsx#openPalette|openPalette()]], [[links.ts#FEEDBACK_URL|FEEDBACK_URL]], [[transform/common.tsx#turnFilterOff|turnFilterOff()]], [[transform/common.tsx#turnWeightOff|turnWeightOff()]]
- Reads: [[cleanDataset|useUi.cleanDataset]], [[dataset|useStore.dataset]], [[useUi/theme|useUi.theme]]
- Store actions: [[openDialog()|useStore.openDialog()]], [[setTheme()|useUi.setTheme()]]
- Opens: [[transform/select|transform: select]], [[transform/weight|transform: weight]]
- Rendered by: [[Components/App|<App>]]

### DatasetName
*component* · line 122 · note: [[DatasetName|<DatasetName>]]
- Calls: [[useStore]]
- Store actions: [[mutateDataset()|useStore.mutateDataset()]]
