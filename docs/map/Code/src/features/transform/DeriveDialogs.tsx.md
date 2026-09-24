---
id: src/features/transform/DeriveDialogs.tsx
type: module
file: src/features/transform/DeriveDialogs.tsx
area: features/transform
---

# src/features/transform/DeriveDialogs.tsx

*Module* · area [[features - transform|features/transform]] · 332 lines

> Automatic Recode, Reverse-code items, Create Scale, Standardize, Count Values, Rank Cases.

## Imports
- [[react]] · value
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[transform/common.tsx]] · value
- [[stats/reliability.ts]] · value
- [[transform/index.ts]] · value
- [[Icon.tsx]] · value
- [[VarPicker.tsx]] · value

## Imported by
- [[TransformDialogs.tsx]] · value

## Private helpers
isNumeric() (line 14)

## Symbols

### useSuggestedNames
*hook* · line 16 · note: [[useSuggestedNames|useSuggestedNames()]]
- Calls: [[core/data.ts#uniqueVarName|uniqueVarName()]]

### AutoRecodeDialog
*component* · line 36 · exported · note: [[AutoRecodeDialog|<AutoRecodeDialog>]]
> ---------- Automatic Recode ----------
- Renders: [[Icon|<Icon>]], [[TransformModal|<TransformModal>]], [[VarPicker|<VarPicker>]]
- Calls: [[recode.ts#autoRecode|autoRecode()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]], [[useSuggestedNames|useSuggestedNames()]]
- Used in: [[TransformDialogs.tsx]]

### ReverseDialog
*component* · line 78 · exported · note: [[ReverseDialog|<ReverseDialog>]]
> ---------- Reverse-code ----------
- Renders: [[NumField|<NumField>]], [[TransformModal|<TransformModal>]], [[VarPicker|<VarPicker>]]
- Calls: [[derive.ts#detectScaleRange|detectScaleRange()]], [[derive.ts#reverseCode|reverseCode()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]]
- Uses: [[DeriveDialogs.tsx]]
- Used in: [[TransformDialogs.tsx]]

### ScaleDialog
*component* · line 134 · exported · note: [[ScaleDialog|<ScaleDialog>]]
> ---------- Create Scale ----------
- Renders: [[NumField|<NumField>]], [[TextField|<TextField>]], [[TransformModal|<TransformModal>]], [[VarPicker|<VarPicker>]]
- Calls: [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#caseWeights|caseWeights()]], [[core/data.ts#isMissingValue|isMissingValue()]], [[derive.ts#createScale|createScale()]], [[stats/reliability.ts#reliabilityAnalysis|reliabilityAnalysis()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]]
- Uses: [[DeriveDialogs.tsx]]
- Used in: [[TransformDialogs.tsx]]

### StandardizeDialog
*component* · line 208 · exported · note: [[StandardizeDialog|<StandardizeDialog>]]
> ---------- Standardize ----------
- Renders: [[TransformModal|<TransformModal>]], [[VarPicker|<VarPicker>]]
- Calls: [[derive.ts#standardize|standardize()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]]
- Uses: [[DeriveDialogs.tsx]]
- Used in: [[TransformDialogs.tsx]]

### CountDialog
*component* · line 232 · exported · note: [[CountDialog|<CountDialog>]]
> ---------- Count ----------
- Renders: [[Icon|<Icon>]], [[TextField|<TextField>]], [[TransformModal|<TransformModal>]], [[VarPicker|<VarPicker>]]
- Calls: [[derive.ts#countValues|countValues()]], [[recode.ts#describeFrom|describeFrom()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]], [[useFromEditor|useFromEditor()]]
- Used in: [[TransformDialogs.tsx]]

### RankDialog
*component* · line 285 · exported · note: [[RankDialog|<RankDialog>]]
> ---------- Rank ----------
- Renders: [[NumField|<NumField>]], [[TransformModal|<TransformModal>]], [[VarPicker|<VarPicker>]]
- Calls: [[derive.ts#rankCases|rankCases()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]]
- Used in: [[TransformDialogs.tsx]]
