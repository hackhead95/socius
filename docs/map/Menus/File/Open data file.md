---
id: "cmd:file:open"
type: command
file: src/app/menus.ts
area: app
---

# File > Open data file...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** File > Open data file...
- **Shortcut:** Mod+O
- **Menu:** File

## Calls
- [[fileActions.ts#openDataFile|openDataFile()]]

## Calls store actions
- [[openDialog()|useStore.openDialog()]] · openDataFile

## Opens
- [[file/import|file: import]] · openDataFile

## Part of
- [[File]]

## Tested by
- [[ui-overlays-focus.spec.ts]] · menu label
- [[search.test.ts]] · menu label

## Documents shortcut
- [[Mod+O]] · File > Open data file...

## Suggested by
- [[CommandPalette.tsx#SUGGESTED|SUGGESTED]]
