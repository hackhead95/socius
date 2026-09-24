---
id: "src/app/TopBar.tsx#TopBar"
type: component
file: src/app/TopBar.tsx
line: 41
area: app
---

# <TopBar>

*React component* · defined in [[TopBar.tsx]] (line 41) · area [[Areas/app|app]]

- **Exported:** yes

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[fileActions.ts#isModified|isModified()]]
- [[shortcuts.ts#modKey|modKey()]]
- [[undo.ts#nothingTo|nothingTo()]]
- [[errorlog/actions.ts#openFeedback|openFeedback()]]
- [[undo.ts#runRedo|runRedo()]]
- [[undo.ts#runUndo|runUndo()]]
- [[useStore]]
- [[useUi]]
- [[useUndoRedo|useUndoRedo()]]

## Renders
- [[AiChip|<AiChip>]]
- [[DatasetName|<DatasetName>]]
- [[Icon|<Icon>]]
- [[Mark|<Mark>]]
- [[MenuBar|<MenuBar>]]

## Uses
- [[links.ts#FEEDBACK_URL|FEEDBACK_URL]]
- [[CommandPalette.tsx#openPalette|openPalette()]]
- [[transform/common.tsx#turnFilterOff|turnFilterOff()]]
- [[transform/common.tsx#turnWeightOff|turnWeightOff()]]

## Reads
- [[dataset|useStore.dataset]] · selector
- [[cleanDataset|useUi.cleanDataset]] · selector
- [[useUi/theme|useUi.theme]] · selector

## Calls store actions
- [[openDialog()|useStore.openDialog()]] · selector
- [[setTheme()|useUi.setTheme()]] · selector

## Opens
- [[transform/select|transform: select]]
- [[transform/weight|transform: weight]]

## Rendered by
- [[Components/App|<App>]]
