---
id: "transform:select"
type: transform
file: src/features/transform/CasesDialogs.tsx
area: transforms
---

# select

*Transform dialog* · defined in [[CasesDialogs.tsx]] · area `transforms`

## Calls
- [[cases.ts#CasesError|CasesError]]
- [[cases.ts#selectCasesTransform|selectCasesTransform()]]
- [[cases.ts#selectionValues|selectionValues()]]

## Uses
- [[ExpressionField|<ExpressionField>]] · dialog helper
- [[ExpressionHelper|<ExpressionHelper>]] · dialog helper
- [[NumField|<NumField>]] · dialog helper
- [[TransformModal|<TransformModal>]] · dialog helper
- [[VarSelect|<VarSelect>]] · dialog helper
- [[transform/common.tsx#applyTransform|applyTransform()]] · dialog helper
- [[transform/common.tsx#insertAtCursor|insertAtCursor()]] · dialog helper

## Logged to Output by
- [[transform/common.tsx#applyTransform|applyTransform()]]

## Generates SPSS syntax
- [[Syntax/COMPUTE|COMPUTE]]
- [[END IF]]
- [[EXECUTE]]
- [[FILTER]]
- [[FILTER OFF]]
- [[FORMATS]]
- [[SELECT IF]]
- [[SET]]
- [[USE ALL]]
- [[VALUE LABELS]]
- [[VARIABLE LABELS]]

## Configured in dialog
- [[transform/select|transform: select]]
