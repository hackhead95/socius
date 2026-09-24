---
id: src/features/transform/RecodeDialog.tsx
type: module
file: src/features/transform/RecodeDialog.tsx
area: features/transform
---

# src/features/transform/RecodeDialog.tsx

*Module* · area [[features - transform|features/transform]] · 223 lines

> Transform > Recode into Same Variables / Recode into Different Variables.

## Imports
- [[react]] · value
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[transform/common.tsx]] · value
- [[transform/index.ts]] · value
- [[Icon.tsx]] · value
- [[VarPicker.tsx]] · value

## Imported by
- [[TransformDialogs.tsx]] · value

## Symbols

### RecodeDialog
*component* · line 10 · exported · note: [[RecodeDialog|<RecodeDialog>]]
- Renders: [[ExpressionField|<ExpressionField>]], [[Icon|<Icon>]], [[TransformModal|<TransformModal>]], [[VarPicker|<VarPicker>]]
- Calls: [[core/data.ts#uniqueVarName|uniqueVarName()]], [[recode.ts#describeFrom|describeFrom()]], [[recode.ts#describeTo|describeTo()]], [[recode.ts#recodeDifferent|recodeDifferent()]], [[recode.ts#recodeSame|recodeSame()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]], [[useFromEditor|useFromEditor()]]
- Rendered by: [[TransformDialogs.tsx]]
