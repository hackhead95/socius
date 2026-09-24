---
id: "cmd:file:open-proj"
type: command
file: src/app/menus.ts
area: app
---

# File > Open project...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** File > Open project...
- **Menu:** File

## Calls
- [[fileActions.ts#openProjectFile|openProjectFile()]]

## Calls store actions
- [[openDialog()|useStore.openDialog()]] · openProjectFile

## Opens
- [[file/import|file: import]] · openProjectFile

## Part of
- [[File]]
