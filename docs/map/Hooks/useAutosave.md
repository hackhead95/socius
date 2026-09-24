---
id: "src/app/App.tsx#useAutosave"
type: hook
file: src/app/App.tsx
line: 61
area: app
---

# useAutosave()

*React hook* · defined in [[App.tsx]] (line 61) · area [[Areas/app|app]]

## Calls
- [[fileActions.ts#currentProjectState|currentProjectState()]]
- [[fileActions.ts#isModified|isModified()]]
- [[persistence.ts#saveSession|saveSession()]]
- [[update.ts#setBeforeReload|setBeforeReload()]]

## Uses
- [[useStore]]
- [[useUi]]

## Reads
- [[useStore/coding|useStore.coding]] · subscribe
- [[dataset|useStore.dataset]] · getState, subscribe
- [[outputs|useStore.outputs]] · subscribe
- [[showValueLabels|useStore.showValueLabels]] · subscribe
- [[useStore/tab|useStore.tab]] · subscribe
- [[cleanDataset|useUi.cleanDataset]] · subscribe

## Called by
- [[Components/App|<App>]]
