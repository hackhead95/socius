---
id: "store-action:useStore.addOutput"
type: store-action
file: src/core/store.ts
line: 121
area: core
---

# useStore.addOutput()

*Store action* · defined in [[store.ts]] (line 121) · area [[core]]

> Append an output item. By default it is focused and the Output tab opens; pass `{ focus: false }` to log quietly.

- **Store:** useStore

## Reads
- [[outputs|useStore.outputs]]

## Writes
- [[useStore/focusOutputId|useStore.focusOutputId]]
- [[outputs|useStore.outputs]]
- [[useStore/tab|useStore.tab]]

## Called by
- [[DataViewInner|<DataViewInner>]] · getState
- [[DefinePropertiesDialog|<DefinePropertiesDialog>]] · alias
- [[DialogBody|<DialogBody>]] · selector
- [[ReliabilityView|<ReliabilityView>]] · selector
- [[SendButton|<SendButton>]] · selector
- [[transform/common.tsx#applyTransform|applyTransform()]] · alias

## Store
- [[useStore]]
