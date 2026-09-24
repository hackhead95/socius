---
id: "cmd:edit:goto"
type: command
file: src/app/menus.ts
area: app
---

# Edit > Go to case...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Edit > Go to case...
- **Shown conditionally:** yes
- **Menu:** Edit

## Calls store actions
- [[setTab()|useStore.setTab()]]
- [[requestGoto()|useUi.requestGoto()]]

## Part of
- [[Edit]]

## Tested by
- [[menu-knowledge.test.ts]] · menu label
