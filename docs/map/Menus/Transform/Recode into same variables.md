---
id: "cmd:transform:t-same"
type: command
file: src/app/menus.ts
area: app
---

# Transform > Recode into same variables...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Transform > Recode into same variables...
- **Needs a dataset:** yes
- **Menu:** Transform

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[transform/recode-same|transform: recode-same]]

## Part of
- [[Menus/Transform|Transform]]

## Tested by
- [[transform-dialogs.spec.ts]] · menu label
- [[dialog-transforms.test.ts]] · menu label
