---
id: "store-key:useStore.outputUndo"
type: store-key
file: src/core/store.ts
line: 84
area: core
---

# useStore.outputUndo

*Store state key* · defined in [[store.ts]] (line 84) · area [[core]]

> Results deleted from Output (newest last), for Undo in the Output tab; and deletions undone, for Redo.

- **Store:** useStore

## Read by
- [[undo.ts]] · getState (destructured)
- [[shell-fixes.test.ts]] · getState
- [[redeleteOutput()|useStore.redeleteOutput()]]
- [[removeOutput()|useStore.removeOutput()]]
- [[restoreOutput()|useStore.restoreOutput()]]
- [[useUndoRedo|useUndoRedo()]] · selector

## Written by
- [[navigation-audit.test.tsx]] · setState
- [[shell-fixes.test.ts]] · setState
- [[clearOutputs()|useStore.clearOutputs()]]
- [[redeleteOutput()|useStore.redeleteOutput()]]
- [[removeOutput()|useStore.removeOutput()]]
- [[restoreOutput()|useStore.restoreOutput()]]

## Store
- [[useStore]]
