---
id: "store-action:useStore.undo"
type: store-action
file: src/core/store.ts
line: 113
area: core
---

# useStore.undo()

*Store action* · defined in [[store.ts]] (line 113) · area [[core]]

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
- [[Undo|Edit > Undo]] · runUndo
- [[undo.ts#runUndo|runUndo()]] · alias
- [[navigation-audit.test.tsx]] · setState
- [[scenarios.test.ts]] · getState
- [[dataset.test.ts]] · getState
- [[transforms-expr.fuzz.test.ts]] · alias
- [[transforms-ops.fuzz.test.ts]] · getState

## Store
- [[useStore]]
