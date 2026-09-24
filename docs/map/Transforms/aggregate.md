---
id: "transform:aggregate"
type: transform
file: src/features/transform/MergeDialogs.tsx
area: transforms
---

# aggregate

*Transform dialog* · defined in [[MergeDialogs.tsx]] · area `transforms`

## Calls
- [[aggregate.ts#AGG_FUNCTIONS|AGG_FUNCTIONS]]
- [[aggregate.ts#aggregate|aggregate()]]

## Uses
- [[TextField|<TextField>]] · dialog helper
- [[TransformModal|<TransformModal>]] · dialog helper
- [[VarSelect|<VarSelect>]] · dialog helper
- [[transform/common.tsx#applyTransform|applyTransform()]] · dialog helper

## Tested by
- [[transforms-ops.fuzz.test.ts]] · transform id
- [[transforms.test.ts]] · transform id

## Logged to Output by
- [[transform/common.tsx#applyTransform|applyTransform()]]

## Generates SPSS syntax
- [[Syntax/AGGREGATE|AGGREGATE]]

## Configured in dialog
- [[transform/aggregate|transform: aggregate]]
