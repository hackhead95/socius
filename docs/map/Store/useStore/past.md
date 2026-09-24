---
id: "store-key:useStore.past"
type: store-key
file: src/core/store.ts
line: 79
area: core
---

# useStore.past

*Store state key* · defined in [[store.ts]] (line 79) · area [[core]]

> Undo/redo stacks of previous dataset states.

- **Store:** useStore

## Read by
- [[shell-fixes.test.ts]] · getState (destructured)
- [[dataset.test.ts]] · getState
- [[history.test.ts]] · getState
- [[undo.ts#undoStep|undoStep()]] · getState (destructured)
- [[mutateDataset()|useStore.mutateDataset()]]
- [[redo()|useStore.redo()]]
- [[undo()|useStore.undo()]]
- [[useUndoRedo|useUndoRedo()]] · selector

## Written by
- [[fileActions.ts#applyProject|applyProject()]] · setState
- [[Close data and start fresh|File > Close data and start fresh...]] · startFresh
- [[fileActions.ts#startFresh|startFresh()]] · setState
- [[navigation-audit.test.tsx]] · setState
- [[shell-fixes.test.ts]] · setState
- [[mutateDataset()|useStore.mutateDataset()]]
- [[redo()|useStore.redo()]]
- [[setDataset()|useStore.setDataset()]]
- [[undo()|useStore.undo()]]

## Store
- [[useStore]]
