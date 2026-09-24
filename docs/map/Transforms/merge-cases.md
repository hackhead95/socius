---
id: "transform:merge-cases"
type: transform
file: src/features/transform/MergeDialogs.tsx
area: transforms
---

# merge-cases

*Transform dialog* · defined in [[MergeDialogs.tsx]] · area `transforms`

## Calls
- [[merge.ts#addCases|addCases()]]
- [[io/index.ts#importFile|importFile()]]
- [[merge.ts#pairVariables|pairVariables()]]

## Uses
- [[TransformModal|<TransformModal>]] · dialog helper
- [[transform/common.tsx#applyTransform|applyTransform()]] · dialog helper
- [[fileActions.ts#DATA_ACCEPT|DATA_ACCEPT]] · dialog helper
- [[fileActions.ts#pickFile|pickFile()]] · dialog helper
- [[transform/common.tsx#tryRun|tryRun()]] · dialog helper

## Logged to Output by
- [[transform/common.tsx#applyTransform|applyTransform()]]

## Generates SPSS syntax
- [[ADD FILES]]
- [[EXECUTE]]

## Configured in dialog
- [[transform/merge-cases|transform: merge-cases]]
