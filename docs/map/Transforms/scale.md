---
id: "transform:scale"
type: transform
file: src/features/transform/DeriveDialogs.tsx
area: transforms
---

# scale

*Transform dialog* · defined in [[DeriveDialogs.tsx]] · area `transforms`

## Calls
- [[derive.ts#createScale|createScale()]]
- [[stats/reliability.ts#reliabilityAnalysis|reliabilityAnalysis()]]

## Uses
- [[NumField|<NumField>]] · dialog helper
- [[TextField|<TextField>]] · dialog helper
- [[TransformModal|<TransformModal>]] · dialog helper
- [[transform/common.tsx#applyTransform|applyTransform()]] · dialog helper
- [[transform/common.tsx#tryRun|tryRun()]] · dialog helper

## Tested by
- [[scenarios.test.ts]] · transform id
- [[properties.test.ts]] · transform id

## Logged to Output by
- [[transform/common.tsx#applyTransform|applyTransform()]]

## Generates SPSS syntax
- [[Syntax/COMPUTE|COMPUTE]]
- [[EXECUTE]]

## Configured in dialog
- [[transform/scale|transform: scale]]
