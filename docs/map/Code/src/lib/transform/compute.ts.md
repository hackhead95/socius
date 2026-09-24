---
id: src/lib/transform/compute.ts
type: module
file: src/lib/transform/compute.ts
area: lib/transform
---

# src/lib/transform/compute.ts

*Module* · area [[lib - transform|lib/transform]] · 167 lines

> COMPUTE / IF: create or overwrite a variable from an expression.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[dsops.ts]] · value
- [[evaluate.ts]] · value
- [[expr.ts]] · value
- [[syntax.ts]] · value

## Calls
- [[evaluate.ts#compileExpression|compileExpression()]]
- [[core/data.ts#getVariable|getVariable()]]
- [[core/data.ts#validateVarName|validateVarName()]]

## Uses
- [[expr.ts#ExprError|ExprError]]

## Imported by
- [[transform/index.ts]] · re-export

## Types
ComputeSpec (line 10) · ComputePreviewRow (line 83)

## Private helpers
prepare() (line 41) · condTrue() (line 77)

## Symbols

### ComputeError
*class* · line 22 · exported
- Used in: [[ComputeDialog.tsx]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]], [[transforms.test.ts]]

### previewCompute
*function* · line 92 · exported
> Preview the result for the first `n` cases. Throws ComputeError.
- Calls: [[compute.ts]], [[core/data.ts#formatRawValue|formatRawValue()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[dsops.ts#newStringVar|newStringVar()]]
- Used in: [[ComputeDialog.tsx]], [[transforms.test.ts]]

### computeVariable
*function* · line 106 · exported
- Calls: [[compute.ts]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#countSysmis|countSysmis()]], [[dsops.ts#fmtN|fmtN()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[dsops.ts#newStringVar|newStringVar()]], [[dsops.ts#replaceVariable|replaceVariable()]], [[dsops.ts#suggestDecimals|suggestDecimals()]], [[syntax.ts#lines|lines()]], [[syntax.ts#variableLabelSyntax|variableLabelSyntax()]]
- Used in: [[ComputeDialog.tsx]], [[transform.ts]], [[transforms-expr.fuzz.test.ts]], [[sample-survey.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]
