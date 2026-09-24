---
id: "cmd:edit:undo"
type: command
file: src/app/menus.ts
area: app
---

# Edit > Undo

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Edit > Undo
- **Shortcut:** Mod+Z
- **Menu:** Edit

## Calls
- [[undo.ts#runUndo|runUndo()]]

## Writes
- [[useCodingUi/future|useCodingUi.future]] · runUndo
- [[useCodingUi/history|useCodingUi.history]] · runUndo

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · runUndo
- [[restoreOutput()|useStore.restoreOutput()]] · runUndo
- [[setCoding()|useStore.setCoding()]] · runUndo
- [[undo()|useStore.undo()]] · runUndo

## Part of
- [[Edit]]

## Tested by
- [[qual.spec.ts]] · menu label
- [[ui-overlays-focus.spec.ts]] · menu label
- [[navigation-audit.test.tsx]] · menu label
- [[search.test.ts]] · menu label
- [[ui-overlays.test.tsx]] · menu label

## Documents shortcut
- [[Mod+Z]] · Edit > Undo
