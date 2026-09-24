---
id: "store-key:useStore.future"
type: store-key
file: src/core/store.ts
line: 82
area: core
---

# useStore.future

*Store state key* · defined in [[store.ts]] (line 82) · area [[core]]

- **Store:** useStore

## Read by
- [[undo.ts#redoStep|redoStep()]] · getState (destructured)
- [[redo()|useStore.redo()]]
- [[undo()|useStore.undo()]]
- [[useUndoRedo|useUndoRedo()]] · selector

## Written by
- [[fileActions.ts#applyProject|applyProject()]] · setState
- [[Close data and start fresh|File > Close data and start fresh...]] · startFresh
- [[fileActions.ts#startFresh|startFresh()]] · setState
- [[navigation-audit.test.tsx]] · setState
- [[shell-fixes.test.ts]] · setState
- [[data-fixes.test.ts]] · setState
- [[mutateDataset()|useStore.mutateDataset()]]
- [[redo()|useStore.redo()]]
- [[setDataset()|useStore.setDataset()]]
- [[undo()|useStore.undo()]]

## Store
- [[useStore]]
