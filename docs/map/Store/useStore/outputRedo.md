---
id: "store-key:useStore.outputRedo"
type: store-key
file: src/core/store.ts
line: 87
area: core
---

# useStore.outputRedo

*Store state key* · defined in [[store.ts]] (line 87) · area [[core]]

- **Store:** useStore

## Read by
- [[undo.ts]] · getState (destructured)
- [[redeleteOutput()|useStore.redeleteOutput()]]
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
