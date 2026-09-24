---
id: "cmd:transform:t-compute"
type: command
file: src/app/menus.ts
area: app
---

# Transform > Compute variable...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Transform > Compute variable...
- **Needs a dataset:** yes
- **Menu:** Transform

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[transform/compute|transform: compute]]

## Part of
- [[Menus/Transform|Transform]]

## Tested by
- [[data.spec.ts]] · menu label
- [[shell.spec.ts]] · menu label
- [[search.test.ts]] · menu label
