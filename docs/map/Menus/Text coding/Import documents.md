---
id: "cmd:coding:c-import"
type: command
file: src/app/menus.ts
area: app
---

# Text coding > Import documents...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Text coding > Import documents...
- **Menu:** Text coding

## Calls store actions
- [[openDialog()|useStore.openDialog()]]
- [[setTab()|useStore.setTab()]]

## Opens
- [[coding/import|coding: import]]

## Part of
- [[Menus/Text coding|Text coding]]

## Tested by
- [[coding-output-fixes.spec.ts]] · menu label
- [[search.test.ts]] · menu label
- [[ui-fixes.test.tsx]] · menu label
