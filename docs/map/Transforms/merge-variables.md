---
id: "transform:merge-variables"
type: transform
file: src/features/transform/MergeDialogs.tsx
area: transforms
---

# merge-variables

*Transform dialog* · defined in [[MergeDialogs.tsx]] · area `transforms`

## Calls
- [[merge.ts#addVariables|addVariables()]]
- [[io/index.ts#importFile|importFile()]]

## Uses
- [[TransformModal|<TransformModal>]] · dialog helper
- [[VarSelect|<VarSelect>]] · dialog helper
- [[transform/common.tsx#applyTransform|applyTransform()]] · dialog helper
- [[fileActions.ts#DATA_ACCEPT|DATA_ACCEPT]] · dialog helper
- [[fileActions.ts#pickFile|pickFile()]] · dialog helper
- [[transform/common.tsx#tryRun|tryRun()]] · dialog helper

## Logged to Output by
- [[transform/common.tsx#applyTransform|applyTransform()]]

## Generates SPSS syntax
- [[EXECUTE]]
- [[MATCH FILES]]

## Configured in dialog
- [[transform/merge-variables|transform: merge-variables]]
