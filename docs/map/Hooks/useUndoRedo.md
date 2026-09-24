---
id: "src/app/undo.ts#useUndoRedo"
type: hook
file: src/app/undo.ts
line: 158
area: app
---

# useUndoRedo()

*React hook* · defined in [[undo.ts]] (line 158) · area [[Areas/app|app]]

> Undo and Redo for the current tab, kept up to date (menus, top bar).

- **Exported:** yes

## Calls
- [[undo.ts#redoStep|redoStep()]]
- [[undo.ts#undoStep|undoStep()]]
- [[useCodingUi]]
- [[useStore]]

## Reads
- [[useCodingUi/future|useCodingUi.future]] · selector
- [[useCodingUi/history|useCodingUi.history]] · selector
- [[useStore/coding|useStore.coding]] · selector
- [[dataset|useStore.dataset]] · selector
- [[useStore/future|useStore.future]] · selector
- [[outputRedo|useStore.outputRedo]] · selector
- [[outputs|useStore.outputs]] · selector
- [[outputUndo|useStore.outputUndo]] · selector
- [[past|useStore.past]] · selector
- [[useStore/tab|useStore.tab]] · selector

## Called by
- [[TopBar|<TopBar>]]
- [[useMenus|useMenus()]]
