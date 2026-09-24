---
id: "store-action:useStore.redeleteOutput"
type: store-action
file: src/core/store.ts
line: 125
area: core
---

# useStore.redeleteOutput()

*Store action* · defined in [[store.ts]] (line 125) · area [[core]]

> Delete again the result that `restoreOutput` brought back. Returns false when there is none.

- **Store:** useStore

## Reads
- [[outputRedo|useStore.outputRedo]]
- [[outputs|useStore.outputs]]
- [[outputUndo|useStore.outputUndo]]

## Writes
- [[outputRedo|useStore.outputRedo]]
- [[outputs|useStore.outputs]]
- [[outputUndo|useStore.outputUndo]]

## Called by
- [[Redo|Edit > Redo]] · runRedo
- [[undo.ts#runRedo|runRedo()]] · alias
- [[shell-fixes.test.ts]] · getState

## Store
- [[useStore]]
