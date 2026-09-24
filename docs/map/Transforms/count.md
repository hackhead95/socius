---
id: "transform:count"
type: transform
file: src/features/transform/DeriveDialogs.tsx
area: transforms
---

# count

*Transform dialog* · defined in [[DeriveDialogs.tsx]] · area `transforms`

## Calls
- [[derive.ts#countValues|countValues()]]
- [[recode.ts#describeFrom|describeFrom()]]

## Uses
- [[TextField|<TextField>]] · dialog helper
- [[TransformModal|<TransformModal>]] · dialog helper
- [[transform/common.tsx#applyTransform|applyTransform()]] · dialog helper
- [[transform/common.tsx#tryRun|tryRun()]] · dialog helper
- [[useFromEditor|useFromEditor()]] · dialog helper

## Tested by
- [[transforms-ops.fuzz.test.ts]] · transform id
- [[sample-survey.test.ts]] · transform id
- [[transforms.test.ts]] · transform id

## Logged to Output by
- [[transform/common.tsx#applyTransform|applyTransform()]]

## Generates SPSS syntax
- [[Syntax/COUNT|COUNT]]
- [[EXECUTE]]

## Configured in dialog
- [[transform/count|transform: count]]
