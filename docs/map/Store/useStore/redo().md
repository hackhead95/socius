---
id: "store-action:useStore.redo"
type: store-action
file: src/core/store.ts
line: 117
area: core
---

# useStore.redo()

*Store action* · defined in [[store.ts]] (line 117) · area [[core]]

- **Store:** useStore

## Reads
- [[dataset|useStore.dataset]]
- [[useStore/future|useStore.future]]
- [[past|useStore.past]]

## Writes
- [[dataset|useStore.dataset]]
- [[useStore/future|useStore.future]]
- [[past|useStore.past]]

## Called by
- [[Redo|Edit > Redo]] · runRedo
- [[undo.ts#runRedo|runRedo()]] · alias
- [[navigation-audit.test.tsx]] · setState
- [[transforms-expr.fuzz.test.ts]] · getState
- [[transforms-ops.fuzz.test.ts]] · getState

## Store
- [[useStore]]
