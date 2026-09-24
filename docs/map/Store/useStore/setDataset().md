---
id: "store-action:useStore.setDataset"
type: store-action
file: src/core/store.ts
line: 97
area: core
---

# useStore.setDataset()

*Store action* · defined in [[store.ts]] (line 97) · area [[core]]

> dataset

- **Store:** useStore

## Writes
- [[dataset|useStore.dataset]]
- [[useStore/future|useStore.future]]
- [[past|useStore.past]]

## Called by
- [[fileActions.ts#activateDataset|activateDataset()]] · alias
- [[Load sample survey|File > Load sample survey]] · loadSample
- [[New dataset|File > New dataset]] · newDataset
- [[shell-fixes.test.ts]] · getState
- [[scenarios.test.ts]] · getState
- [[dataset.test.ts]] · getState
- [[transforms-expr.fuzz.test.ts]] · alias
- [[transforms-ops.fuzz.test.ts]] · alias
- [[history.test.ts]] · getState

## Store
- [[useStore]]
