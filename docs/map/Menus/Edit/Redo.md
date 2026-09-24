---
id: "cmd:edit:redo"
type: command
file: src/app/menus.ts
area: app
---

# Edit > Redo

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Edit > Redo
- **Shortcut:** Mod+Y
- **Menu:** Edit

## Calls
- [[undo.ts#runRedo|runRedo()]]

## Writes
- [[useCodingUi/future|useCodingUi.future]] · runRedo
- [[useCodingUi/history|useCodingUi.history]] · runRedo

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · runRedo
- [[redeleteOutput()|useStore.redeleteOutput()]] · runRedo
- [[redo()|useStore.redo()]] · runRedo
- [[setCoding()|useStore.setCoding()]] · runRedo

## Part of
- [[Edit]]

## Tested by
- [[navigation-audit.test.tsx]] · menu label

## Documents shortcut
- [[Mod+Y]] · Edit > Redo
