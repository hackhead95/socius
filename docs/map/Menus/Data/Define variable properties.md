---
id: "cmd:data:d-define"
type: command
file: src/app/menus.ts
area: app
---

# Data > Define variable properties...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Data > Define variable properties...
- **Needs a dataset:** yes
- **Tooltip:** Scan the values of variables, label them, mark missing codes and set the measurement level
- **Menu:** Data

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[transform/define-properties|transform: define-properties]]

## Part of
- [[Data]]

## Tested by
- [[define-properties.spec.ts]] · menu label
- [[navigation-audit.test.tsx]] · menu label
