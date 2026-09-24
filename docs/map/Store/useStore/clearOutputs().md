---
id: "store-action:useStore.clearOutputs"
type: store-action
file: src/core/store.ts
line: 124
area: core
---

# useStore.clearOutputs()

*Store action* · defined in [[store.ts]] (line 124) · area [[core]]

- **Store:** useStore

## Writes
- [[outputRedo|useStore.outputRedo]]
- [[outputs|useStore.outputs]]
- [[outputUndo|useStore.outputUndo]]

## Called by
- [[OutputViewer|<OutputViewer>]] · selector
- [[output/actions.ts#confirmAndClearOutputs|confirmAndClearOutputs()]] · getState
- [[Clear output|Edit > Clear output...]] · confirmAndClearOutputs
- [[navigation-audit.test.tsx]] · setState

## Store
- [[useStore]]
