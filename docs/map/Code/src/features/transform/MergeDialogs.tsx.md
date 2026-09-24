---
id: src/features/transform/MergeDialogs.tsx
type: module
file: src/features/transform/MergeDialogs.tsx
area: features/transform
---

# src/features/transform/MergeDialogs.tsx

*Module* · area [[features - transform|features/transform]] · 242 lines

> Data > Merge Files (Add Cases / Add Variables) and Data > Aggregate.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[fileActions.ts]] · value
- [[transform/common.tsx]] · value
- [[io/index.ts]] · value
- [[transform/index.ts]] · value
- [[errorlog.ts]] · value
- [[Icon.tsx]] · value
- [[VarPicker.tsx]] · value

## Imported by
- [[TransformDialogs.tsx]] · value

## Private helpers
fmtN() (line 14)

## Symbols

### useOtherFile
*hook* · line 16 · note: [[useOtherFile|useOtherFile()]]
- Renders: [[Icon|<Icon>]]
- Calls: [[MergeDialogs.tsx]], [[errorlog.ts#logFailure|logFailure()]], [[fileActions.ts#pickFile|pickFile()]], [[io/index.ts#importFile|importFile()]]
- Uses: [[fileActions.ts#DATA_ACCEPT|DATA_ACCEPT]]

### MergeCasesDialog
*component* · line 48 · exported · note: [[MergeCasesDialog|<MergeCasesDialog>]]
- Renders: [[TransformModal|<TransformModal>]]
- Calls: [[merge.ts#addCases|addCases()]], [[merge.ts#pairVariables|pairVariables()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]], [[useOtherFile|useOtherFile()]]
- Used in: [[TransformDialogs.tsx]]

### MergeVariablesDialog
*component* · line 99 · exported · note: [[MergeVariablesDialog|<MergeVariablesDialog>]]
- Renders: [[TransformModal|<TransformModal>]], [[VarSelect|<VarSelect>]]
- Calls: [[merge.ts#addVariables|addVariables()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]], [[useOtherFile|useOtherFile()]]
- Used in: [[TransformDialogs.tsx]]

### AggregateDialog
*component* · line 165 · exported · note: [[AggregateDialog|<AggregateDialog>]]
- Renders: [[Icon|<Icon>]], [[TextField|<TextField>]], [[TransformModal|<TransformModal>]], [[VarPicker|<VarPicker>]], [[VarSelect|<VarSelect>]]
- Calls: [[MergeDialogs.tsx]], [[aggregate.ts#aggregate|aggregate()]], [[errorlog.ts#logFailure|logFailure()]], [[transform/common.tsx#applyTransform|applyTransform()]]
- Uses: [[aggregate.ts#AGG_FUNCTIONS|AGG_FUNCTIONS]], [[useStore]], [[useUi]]
- Store actions: [[confirm()|useUi.confirm()]], [[setTab()|useStore.setTab()]]
- Used in: [[TransformDialogs.tsx]]
