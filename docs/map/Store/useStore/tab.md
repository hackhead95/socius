---
id: "store-key:useStore.tab"
type: store-key
file: src/core/store.ts
line: 90
area: core
---

# useStore.tab

*Store state key* · defined in [[store.ts]] (line 90) · area [[core]]

- **Store:** useStore

## Read by
- [[Components/App|<App>]] · selector, subscribe
- [[Components/Empty|<Empty>]] · selector
- [[MenuBar|<MenuBar>]] · selector
- [[VariableList|<VariableList>]] · selector
- [[fileActions.ts#activateDataset|activateDataset()]] · alias
- [[controller.ts#appSnapshot|appSnapshot()]] · alias
- [[menus.ts#buildMenus|buildMenus()]] · getState alias
- [[fileActions.ts#currentProjectState|currentProjectState()]] · alias
- [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]] · alias
- [[install.ts#installErrorLog|installErrorLog()]] · alias
- [[undo.ts#nothingTo|nothingTo()]] · getState
- [[undo.ts#redoStep|redoStep()]] · getState
- [[features.test.ts]] · getState
- [[palette.test.tsx]] · getState
- [[undo.ts#undoStep|undoStep()]] · getState
- [[useAutosave|useAutosave()]] · subscribe
- [[useMenus|useMenus()]] · selector
- [[useToastPlacement|useToastPlacement()]] · selector
- [[useUndoRedo|useUndoRedo()]] · selector

## Written by
- [[fileActions.ts#applyProject|applyProject()]] · setState
- [[Close data and start fresh|File > Close data and start fresh...]] · startFresh
- [[fileActions.ts#startFresh|startFresh()]] · setState
- [[features.test.ts]] · setState
- [[navigation-audit.test.tsx]] · setState
- [[palette.test.tsx]] · setState
- [[shell-fixes.test.ts]] · setState
- [[shortcut-precedence.test.tsx]] · setState
- [[ui-fixes.test.tsx]] · setState
- [[data-fixes.test.ts]] · setState
- [[addOutput()|useStore.addOutput()]]
- [[setTab()|useStore.setTab()]]

## Store
- [[useStore]]
