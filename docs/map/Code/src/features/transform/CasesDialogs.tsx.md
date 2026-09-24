---
id: src/features/transform/CasesDialogs.tsx
type: module
file: src/features/transform/CasesDialogs.tsx
area: features/transform
---

# src/features/transform/CasesDialogs.tsx

*Module* · area [[features - transform|features/transform]] · 357 lines

> Visual Binning, Select Cases, Weight Cases, Sort Cases.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[transform/common.tsx]] · value
- [[transform/index.ts]] · value
- [[errorlog.ts]] · value
- [[Icon.tsx]] · value
- [[VarPicker.tsx]] · value

## Imported by
- [[TransformDialogs.tsx]] · value

## Private helpers
isNumeric() (line 15) · fmtN() (line 16)

## Symbols

### BinningDialog
*component* · line 20 · exported · note: [[BinningDialog|<BinningDialog>]]
> ---------- Visual Binning ----------
- Renders: [[NumField|<NumField>]], [[TextField|<TextField>]], [[TransformModal|<TransformModal>]], [[VarPicker|<VarPicker>]]
- Calls: [[CasesDialogs.tsx]], [[binning.ts#previewBins|previewBins()]], [[binning.ts#visualBin|visualBin()]], [[core/data.ts#uniqueVarName|uniqueVarName()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]]
- Uses: [[CasesDialogs.tsx]]
- Used in: [[TransformDialogs.tsx]]

### SelectCasesDialog
*component* · line 127 · exported · note: [[SelectCasesDialog|<SelectCasesDialog>]]
> ---------- Select Cases ----------
- Renders: [[ExpressionField|<ExpressionField>]], [[ExpressionHelper|<ExpressionHelper>]], [[NumField|<NumField>]], [[TransformModal|<TransformModal>]], [[VarSelect|<VarSelect>]]
- Calls: [[CasesDialogs.tsx]], [[cases.ts#CasesError|CasesError]], [[cases.ts#selectCasesTransform|selectCasesTransform()]], [[cases.ts#selectionValues|selectionValues()]], [[errorlog.ts#logFailure|logFailure()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#insertAtCursor|insertAtCursor()]]
- Uses: [[CasesDialogs.tsx]], [[cases.ts#CasesError|CasesError]], [[useUi]]
- Store actions: [[confirm()|useUi.confirm()]]
- Used in: [[TransformDialogs.tsx]]

### WeightDialog
*component* · line 271 · exported · note: [[WeightDialog|<WeightDialog>]]
> ---------- Weight Cases ----------
- Renders: [[TransformModal|<TransformModal>]], [[VarPicker|<VarPicker>]]
- Calls: [[CasesDialogs.tsx]], [[cases.ts#checkWeightVariable|checkWeightVariable()]], [[cases.ts#weightCases|weightCases()]], [[cases.ts#weightWarnings|weightWarnings()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]]
- Uses: [[CasesDialogs.tsx]]
- Used in: [[TransformDialogs.tsx]]

### SortDialog
*component* · line 309 · exported · note: [[SortDialog|<SortDialog>]]
> ---------- Sort Cases ----------
- Renders: [[Icon|<Icon>]], [[TransformModal|<TransformModal>]], [[VarSelect|<VarSelect>]]
- Calls: [[cases.ts#sortCases|sortCases()]], [[transform/common.tsx#applyTransform|applyTransform()]], [[transform/common.tsx#tryRun|tryRun()]]
- Used in: [[TransformDialogs.tsx]]
