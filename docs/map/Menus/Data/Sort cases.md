---
id: "cmd:data:d-sort"
type: command
file: src/app/menus.ts
area: app
---

# Data > Sort cases...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Data > Sort cases...
- **Needs a dataset:** yes
- **Menu:** Data

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[transform/sort|transform: sort]]

## Part of
- [[Data]]

## Tested by
- [[transform-dialogs.spec.ts]] · menu label
- [[ui-overlays-focus.spec.ts]] · menu label
- [[dialog-transforms.test.ts]] · menu label
