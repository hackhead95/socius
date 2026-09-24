---
id: "cmd:file:close"
type: command
file: src/app/menus.ts
area: app
---

# File > Close data and start fresh...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** File > Close data and start fresh...
- **Destructive:** yes
- **Menu:** File

## Calls
- [[fileActions.ts#startFresh|startFresh()]]

## Writes
- [[dataset|useStore.dataset]] · startFresh
- [[useStore/dialog|useStore.dialog]] · startFresh
- [[useStore/focusOutputId|useStore.focusOutputId]] · startFresh
- [[useStore/future|useStore.future]] · startFresh
- [[outputs|useStore.outputs]] · startFresh
- [[past|useStore.past]] · startFresh
- [[useStore/tab|useStore.tab]] · startFresh

## Calls store actions
- [[setCoding()|useStore.setCoding()]] · startFresh
- [[confirm()|useUi.confirm()]]
- [[setSampleBanner()|useUi.setSampleBanner()]] · startFresh

## Part of
- [[File]]

## Tested by
- [[shell.spec.ts]] · menu label
- [[about-storage.test.tsx]] · menu label
- [[menu-knowledge.test.ts]] · menu label
