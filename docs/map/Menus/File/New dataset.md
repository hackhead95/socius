---
id: "cmd:file:new"
type: command
file: src/app/menus.ts
area: app
---

# File > New dataset

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** File > New dataset
- **Menu:** File

## Calls
- [[fileActions.ts#newDataset|newDataset()]]

## Calls store actions
- [[setDataset()|useStore.setDataset()]] · newDataset
- [[setTab()|useStore.setTab()]] · newDataset
- [[setSampleBanner()|useUi.setSampleBanner()]] · newDataset

## Part of
- [[File]]

## Tested by
- [[commands-smoke-app.spec.ts]] · menu label
- [[shell-fixes.spec.ts]] · menu label
