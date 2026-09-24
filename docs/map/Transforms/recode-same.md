---
id: "transform:recode-same"
type: transform
file: src/features/transform/RecodeDialog.tsx
area: transforms
---

# recode-same

*Transform dialog* · defined in [[RecodeDialog.tsx]] · area `transforms`

## Calls
- [[recode.ts#describeFrom|describeFrom()]]
- [[recode.ts#describeTo|describeTo()]]
- [[recode.ts#recodeDifferent|recodeDifferent()]]
- [[recode.ts#recodeSame|recodeSame()]]

## Uses
- [[ExpressionField|<ExpressionField>]] · dialog helper
- [[TransformModal|<TransformModal>]] · dialog helper
- [[transform/common.tsx#applyTransform|applyTransform()]] · dialog helper
- [[transform/common.tsx#tryRun|tryRun()]] · dialog helper
- [[useFromEditor|useFromEditor()]] · dialog helper

## Logged to Output by
- [[transform/common.tsx#applyTransform|applyTransform()]]

## Generates SPSS syntax
- [[END IF]]
- [[EXECUTE]]
- [[RECODE]]
- [[STRING]]

## Configured in dialog
- [[transform/recode-same|transform: recode-same]]
