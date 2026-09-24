---
id: "cmd:view:v-vars"
type: command
file: src/app/menus.ts
area: app
---

# View > Variable View

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** View > Variable View
- **Needs a dataset:** yes
- **Menu:** View

## Calls store actions
- [[setTab()|useStore.setTab()]]

## Part of
- [[Menus/View|View]]

## Tested by
- [[commands-smoke-app.spec.ts]] · menu label
- [[data.spec.ts]] · menu label
- [[define-properties.spec.ts]] · menu label
- [[search.spec.ts]] · menu label
- [[transform-dialogs.spec.ts]] · menu label
