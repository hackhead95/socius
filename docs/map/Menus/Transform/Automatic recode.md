---
id: "cmd:transform:t-auto"
type: command
file: src/app/menus.ts
area: app
---

# Transform > Automatic recode...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Transform > Automatic recode...
- **Needs a dataset:** yes
- **Menu:** Transform

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[transform/autorecode|transform: autorecode]]

## Part of
- [[Menus/Transform|Transform]]

## Tested by
- [[transform-dialogs.spec.ts]] · menu label
- [[dialog-transforms.test.ts]] · menu label
