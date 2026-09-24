---
id: src/features/transform/ComputeDialog.tsx
type: module
file: src/features/transform/ComputeDialog.tsx
area: features/transform
---

# src/features/transform/ComputeDialog.tsx

*Module* · area [[features - transform|features/transform]] · 148 lines

> Transform > Compute Variable.

## Imports
- [[react]] · value
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[transform/common.tsx]] · value
- [[transform/index.ts]] · value
- [[errorlog.ts]] · value

## Imported by
- [[TransformDialogs.tsx]] · value

## Symbols

### ComputeDialog
*component* · line 9 · exported · note: [[ComputeDialog|<ComputeDialog>]]
- Renders: [[ExpressionField|<ExpressionField>]], [[ExpressionHelper|<ExpressionHelper>]], [[TextField|<TextField>]], [[TransformModal|<TransformModal>]]
- Calls: [[compute.ts#ComputeError|ComputeError]], [[compute.ts#computeVariable|computeVariable()]], [[compute.ts#previewCompute|previewCompute()]], [[core/data.ts#getVariable|getVariable()]], [[errorlog.ts#logFailure|logFailure()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#insertAtCursor|insertAtCursor()]]
- Uses: [[compute.ts#ComputeError|ComputeError]]
- Used in: [[TransformDialogs.tsx]]
