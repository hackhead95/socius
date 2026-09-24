---
id: "cmd:file:sample"
type: command
file: src/app/menus.ts
area: app
---

# File > Load sample survey

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** File > Load sample survey
- **Menu:** File

## Calls
- [[fileActions.ts#loadSample|loadSample()]]

## Calls store actions
- [[setDataset()|useStore.setDataset()]] · loadSample
- [[setTab()|useStore.setTab()]] · loadSample
- [[setSampleBanner()|useUi.setSampleBanner()]] · loadSample

## Part of
- [[File]]
