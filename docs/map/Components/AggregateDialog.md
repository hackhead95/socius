---
id: "src/features/transform/MergeDialogs.tsx#AggregateDialog"
type: component
file: src/features/transform/MergeDialogs.tsx
line: 165
area: features/transform
---

# <AggregateDialog>

*React component* · defined in [[MergeDialogs.tsx]] (line 165) · area [[features - transform|features/transform]]

- **Exported:** yes

## Calls
- [[aggregate.ts#aggregate|aggregate()]]
- [[transform/common.tsx#applyTransform|applyTransform()]]
- [[errorlog.ts#logFailure|logFailure()]]

## Renders
- [[Icon|<Icon>]]
- [[TextField|<TextField>]]
- [[TransformModal|<TransformModal>]]
- [[VarPicker|<VarPicker>]]
- [[VarSelect|<VarSelect>]]

## Uses
- [[aggregate.ts#AGG_FUNCTIONS|AGG_FUNCTIONS]]
- [[useStore]]
- [[useUi]]

## Calls store actions
- [[setTab()|useStore.setTab()]] · getState
- [[confirm()|useUi.confirm()]] · getState

## Used by
- [[TransformDialogs.tsx]]

## Renders
- [[transform/aggregate|transform: aggregate]] · registry DIALOGS
