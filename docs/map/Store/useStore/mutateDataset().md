---
id: "store-action:useStore.mutateDataset"
type: store-action
file: src/core/store.ts
line: 102
area: core
---

# useStore.mutateDataset()

*Store action* · defined in [[store.ts]] (line 102) · area [[core]]

> Apply a change; `fn` returns the new dataset (build it immutably). Records undo history. `label` names the change for Edit > Undo / Redo ("Recode", "Rename age"); optional.

- **Store:** useStore

## Reads
- [[dataset|useStore.dataset]]
- [[past|useStore.past]]

## Writes
- [[dataset|useStore.dataset]]
- [[useStore/future|useStore.future]]
- [[past|useStore.past]]

## Called by
- [[CopyPropertiesDialog|<CopyPropertiesDialog>]] · selector
- [[DatasetName|<DatasetName>]] · selector
- [[DataViewInner|<DataViewInner>]] · selector
- [[DefinePropertiesDialog|<DefinePropertiesDialog>]] · alias
- [[ExportToDatasetDialog|<ExportToDatasetDialog>]] · selector
- [[TypeDialog|<TypeDialog>]] · selector
- [[VariableViewInner|<VariableViewInner>]] · selector
- [[transform/common.tsx#applyTransform|applyTransform()]] · alias
- [[shell-fixes.test.ts]] · getState
- [[dataset.test.ts]] · getState
- [[transforms-expr.fuzz.test.ts]] · alias
- [[transforms-ops.fuzz.test.ts]] · alias
- [[history.test.ts]] · getState
- [[addVariable()|useStore.addVariable()]]
- [[deleteCases()|useStore.deleteCases()]]
- [[deleteVariables()|useStore.deleteVariables()]]
- [[insertCases()|useStore.insertCases()]]
- [[moveVariable()|useStore.moveVariable()]]
- [[setCell()|useStore.setCell()]]
- [[setFilter()|useStore.setFilter()]]
- [[setWeight()|useStore.setWeight()]]
- [[updateVariable()|useStore.updateVariable()]]

## Store
- [[useStore]]
