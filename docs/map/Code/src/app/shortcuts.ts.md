---
id: src/app/shortcuts.ts
type: module
file: src/app/shortcuts.ts
area: app
---

# src/app/shortcuts.ts

*Module* · area [[Areas/app|app]] · 71 lines

> Global keyboard shortcuts (undo/redo/open/save) and platform helpers.

## Imports
- [[ui-store.ts]] · value
- [[undo.ts]] · value
- [[store.ts]] · value
- [[fileActions.ts]] · value

## Tested by
- [[navigation-audit.test.tsx]] · import
- [[palette.test.tsx]] · import

## Imported by
- [[App.tsx]] · value
- [[CommandPalette.tsx]] · value
- [[HelpDialogs.tsx]] · value
- [[menus.ts]] · value
- [[TopBar.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[navigation-audit.test.tsx]] · value
- [[palette.test.tsx]] · value

## Private helpers
inTextField() (line 19)

## Symbols

### isMac
*function* · line 7 · exported
- Used in: [[CommandPalette.tsx]], [[HelpDialogs.tsx]]

### modKey
*function* · line 15 · exported
- Calls: [[shortcuts.ts#isMac|isMac()]]
- Used in: [[TopBar.tsx]], [[menus.ts]], [[CodingWorkspace.tsx]]

### handleGlobalKey
*function* · line 30 · exported
- Calls: [[fileActions.ts#openDataFile|openDataFile()]], [[fileActions.ts#saveProject|saveProject()]], [[shortcuts.ts]], [[undo.ts#redoStep|redoStep()]], [[undo.ts#runRedo|runRedo()]], [[undo.ts#runUndo|runUndo()]], [[undo.ts#undoStep|undoStep()]]
- Uses: [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]], [[paletteOpen|useUi.paletteOpen]], [[useStore/tab|useStore.tab]]
- Store actions: [[requestFind()|useUi.requestFind()]], [[setPaletteOpen()|useUi.setPaletteOpen()]]
- Used in: [[App.tsx]], [[navigation-audit.test.tsx]], [[palette.test.tsx]]
