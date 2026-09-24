---
id: "transform:rank"
type: transform
file: src/features/transform/DeriveDialogs.tsx
area: transforms
---

# rank

*Transform dialog* · defined in [[DeriveDialogs.tsx]] · area `transforms`

## Calls
- [[derive.ts#rankCases|rankCases()]]

## Uses
- [[NumField|<NumField>]] · dialog helper
- [[TransformModal|<TransformModal>]] · dialog helper
- [[transform/common.tsx#applyTransform|applyTransform()]] · dialog helper
- [[transform/common.tsx#tryRun|tryRun()]] · dialog helper

## Tested by
- [[transforms-ops.fuzz.test.ts]] · transform id
- [[sample-oracle.test.ts]] · transform id

## Logged to Output by
- [[transform/common.tsx#applyTransform|applyTransform()]]

## Generates SPSS syntax
- [[Syntax/RANK|RANK]]

## Configured in dialog
- [[transform/rank|transform: rank]]
