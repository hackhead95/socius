---
id: "cmd:file:recent"
type: command
file: src/app/menus.ts
area: app
---

# File > Recent projects...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** File > Recent projects...
- **Menu:** File

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[recent|file: recent]]

## Part of
- [[File]]

## Tested by
- [[ui-overlays-focus.spec.ts]] · menu label
- [[menu-knowledge.test.ts]] · menu label
