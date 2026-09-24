---
id: "store-action:useStore.restoreOutput"
type: store-action
file: src/core/store.ts
line: 126
area: core
---

# useStore.restoreOutput()

*Store action* · defined in [[store.ts]] (line 126) · area [[core]]

> Bring back the last deleted result. Returns false when there is none.

- **Store:** useStore

## Reads
- [[outputRedo|useStore.outputRedo]]
- [[outputs|useStore.outputs]]
- [[outputUndo|useStore.outputUndo]]

## Writes
- [[useStore/focusOutputId|useStore.focusOutputId]]
- [[outputRedo|useStore.outputRedo]]
- [[outputs|useStore.outputs]]
- [[outputUndo|useStore.outputUndo]]

## Called by
- [[OutputViewer|<OutputViewer>]] · getState
- [[Undo|Edit > Undo]] · runUndo
- [[undo.ts#runUndo|runUndo()]] · alias
- [[shell-fixes.test.ts]] · getState

## Store
- [[useStore]]
