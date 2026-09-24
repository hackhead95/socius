---
id: src/app/shortcuts.ts
type: module
file: src/app/shortcuts.ts
area: app
---

# src/app/shortcuts.ts

*Module* · area [[Areas/app|app]] · 82 lines

> Global keyboard shortcuts (undo/redo/open/save) and platform helpers.

## Imports
- [[ui-store.ts]] · value
- [[undo.ts]] · value
- [[store.ts]] · value
- [[fileActions.ts]] · value

## Tested by
- [[navigation-audit.test.tsx]] · import
- [[palette.test.tsx]] · import
- [[shortcut-precedence.test.tsx]] · import

## Imported by
- [[App.tsx]] · value
- [[CommandPalette.tsx]] · value
- [[HelpDialogs.tsx]] · value
- [[menuKnowledge.ts]] · value
- [[menus.ts]] · value
- [[TopBar.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[OutputViewer.tsx]] · value
- [[navigation-audit.test.tsx]] · value
- [[palette.test.tsx]] · value
- [[shortcut-precedence.test.tsx]] · value

## Private helpers
inTextField() (line 19)

## Symbols

### isMac
*function* · line 7 · exported
- Used in: [[CommandPalette.tsx]], [[HelpDialogs.tsx]]

### modKey
*function* · line 15 · exported
- Calls: [[shortcuts.ts#isMac|isMac()]]
- Used in: [[TopBar.tsx]], [[menuKnowledge.ts]], [[menus.ts]], [[CodingWorkspace.tsx]], [[OutputViewer.tsx]]

### handleGlobalKey
*function* · line 40 · exported
> App-wide keys (registered on window in App.tsx). Precedence, for keys that a view also handles itself ("/" in the Text coding Responses view, Ctrl/Cmd+F in the Data View grid, Ctrl/Cmd+K inside the search palette): the view's own handler...
- Calls: [[fileActions.ts#openDataFile|openDataFile()]], [[fileActions.ts#saveProject|saveProject()]], [[shortcuts.ts]], [[undo.ts#redoStep|redoStep()]], [[undo.ts#runRedo|runRedo()]], [[undo.ts#runUndo|runUndo()]], [[undo.ts#undoStep|undoStep()]]
- Uses: [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]], [[paletteOpen|useUi.paletteOpen]], [[useStore/tab|useStore.tab]]
- Store actions: [[requestFind()|useUi.requestFind()]], [[setPaletteOpen()|useUi.setPaletteOpen()]]
- Used in: [[App.tsx]], [[navigation-audit.test.tsx]], [[palette.test.tsx]], [[shortcut-precedence.test.tsx]]
