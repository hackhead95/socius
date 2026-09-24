---
id: "transform:compute"
type: transform
file: src/features/transform/ComputeDialog.tsx
area: transforms
---

# compute

*Transform dialog* · defined in [[ComputeDialog.tsx]] · area `transforms`

## Calls
- [[compute.ts#ComputeError|ComputeError]]
- [[compute.ts#computeVariable|computeVariable()]]
- [[compute.ts#previewCompute|previewCompute()]]

## Uses
- [[ExpressionField|<ExpressionField>]] · dialog helper
- [[ExpressionHelper|<ExpressionHelper>]] · dialog helper
- [[TextField|<TextField>]] · dialog helper
- [[TransformModal|<TransformModal>]] · dialog helper
- [[transform/common.tsx#applyTransform|applyTransform()]] · dialog helper
- [[transform/common.tsx#insertAtCursor|insertAtCursor()]] · dialog helper

## Tested by
- [[scenarios.test.ts]] · transform id
- [[transforms-expr.fuzz.test.ts]] · transform id
- [[transforms.test.ts]] · transform id

## Logged to Output by
- [[transform/common.tsx#applyTransform|applyTransform()]]

## Generates SPSS syntax
- [[Syntax/COMPUTE|COMPUTE]]
- [[EXECUTE]]

## Configured in dialog
- [[transform/compute|transform: compute]]
