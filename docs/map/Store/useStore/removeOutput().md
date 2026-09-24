---
id: "store-action:useStore.removeOutput"
type: store-action
file: src/core/store.ts
line: 120
area: core
---

# useStore.removeOutput()

*Store action* · defined in [[store.ts]] (line 120) · area [[core]]

> Remove one result; Undo in the Output tab brings it back (`restoreOutput`).

- **Store:** useStore

## Reads
- [[outputs|useStore.outputs]]
- [[outputUndo|useStore.outputUndo]]

## Writes
- [[outputRedo|useStore.outputRedo]]
- [[outputs|useStore.outputs]]
- [[outputUndo|useStore.outputUndo]]

## Called by
- [[OutputViewer|<OutputViewer>]] · selector
- [[navigation-audit.test.tsx]] · getState
- [[shell-fixes.test.ts]] · getState

## Store
- [[useStore]]
