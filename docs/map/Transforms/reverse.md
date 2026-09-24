---
id: "transform:reverse"
type: transform
file: src/features/transform/DeriveDialogs.tsx
area: transforms
---

# reverse

*Transform dialog* · defined in [[DeriveDialogs.tsx]] · area `transforms`

## Calls
- [[derive.ts#detectScaleRange|detectScaleRange()]]
- [[derive.ts#reverseCode|reverseCode()]]

## Uses
- [[NumField|<NumField>]] · dialog helper
- [[TransformModal|<TransformModal>]] · dialog helper
- [[transform/common.tsx#applyTransform|applyTransform()]] · dialog helper
- [[transform/common.tsx#tryRun|tryRun()]] · dialog helper

## Tested by
- [[scenarios.test.ts]] · transform id

## Logged to Output by
- [[transform/common.tsx#applyTransform|applyTransform()]]

## Generates SPSS syntax
- [[Syntax/COMPUTE|COMPUTE]]
- [[EXECUTE]]
- [[RECODE]]

## Configured in dialog
- [[transform/reverse|transform: reverse]]
