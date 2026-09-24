---
id: "store-action:useStore.setCoding"
type: store-action
file: src/core/store.ts
line: 130
area: core
---

# useStore.setCoding()

*Store action* · defined in [[store.ts]] (line 130) · area [[core]]

- **Store:** useStore

## Writes
- [[useStore/coding|useStore.coding]]

## Called by
- [[coding/actions.ts#commit|commit()]] · getState
- [[Redo|Edit > Redo]] · runRedo
- [[Undo|Edit > Undo]] · runUndo
- [[Close data and start fresh|File > Close data and start fresh...]] · startFresh
- [[coding/actions.ts#redoCoding|redoCoding()]] · getState
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]] · getState
- [[fileActions.ts#startFresh|startFresh()]] · getState
- [[actions.test.ts]] · getState
- [[coding/actions.ts#undoCoding|undoCoding()]] · getState

## Store
- [[useStore]]
