---
id: "cmd:data:d-select"
type: command
file: src/app/menus.ts
area: app
---

# Data > Select cases...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Data > Select cases...
- **Needs a dataset:** yes
- **Menu:** Data

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[transform/select|transform: select]]

## Part of
- [[Data]]

## Tested by
- [[commands-smoke-app.spec.ts]] · menu label
- [[search.spec.ts]] · menu label
- [[shell.spec.ts]] · menu label
- [[ui-overlays-focus.spec.ts]] · menu label
- [[search.test.ts]] · menu label
- [[units.test.ts]] · menu label
- [[data-fixes.test.ts]] · menu label
