---
id: src/features/transform/common.tsx
type: module
file: src/features/transform/common.tsx
area: features/transform
---

# src/features/transform/common.tsx

*Module* · area [[features - transform|features/transform]] · 327 lines

> Shared building blocks for transformation dialogs.

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[transform/index.ts]] · value
- [[errorlog.ts]] · value
- [[Icon.tsx]] · value
- [[MeasureIcon.tsx]] · value
- [[Modal.tsx]] · value

## Imported by
- [[menus.ts]] · value
- [[TopBar.tsx]] · value
- [[CasesDialogs.tsx]] · value
- [[ComputeDialog.tsx]] · value
- [[DeriveDialogs.tsx]] · value
- [[MergeDialogs.tsx]] · value
- [[RecodeDialog.tsx]] · value

## Types
FromKind (line 245)

## Symbols

### applyTransform
*function* · line 12 · exported
> Apply a transformation: undoable dataset change + quiet log entry + summary toast.
- Calls: [[log.ts#transformLogItem|transformLogItem()]]
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Store actions: [[addOutput()|useStore.addOutput()]], [[mutateDataset()|useStore.mutateDataset()]], [[toast()|useStore.toast()]]
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]], [[DeriveDialogs.tsx]], [[MergeDialogs.tsx]], [[RecodeDialog.tsx]]

### turnFilterOff
*function* · line 22 · exported
> FILTER OFF / WEIGHT OFF from a chip or menu, logged like the dialogs so the syntax log stays complete.
- Calls: [[cases.ts#selectCasesTransform|selectCasesTransform()]], [[transform/common.tsx#applyTransform|applyTransform()]]
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Used in: [[TopBar.tsx]], [[menus.ts]]

### turnWeightOff
*function* · line 26 · exported
- Calls: [[cases.ts#weightCases|weightCases()]], [[transform/common.tsx#applyTransform|applyTransform()]]
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Used in: [[TopBar.tsx]], [[menus.ts]]

### TransformModal
*component* · line 31 · exported · note: [[TransformModal|<TransformModal>]]
- Renders: [[Icon|<Icon>]], [[Modal|<Modal>]]
- Rendered by: [[AggregateDialog|<AggregateDialog>]], [[AutoRecodeDialog|<AutoRecodeDialog>]], [[BinningDialog|<BinningDialog>]], [[ComputeDialog|<ComputeDialog>]], [[CountDialog|<CountDialog>]], [[MergeCasesDialog|<MergeCasesDialog>]], [[MergeVariablesDialog|<MergeVariablesDialog>]], [[RankDialog|<RankDialog>]], [[RecodeDialog|<RecodeDialog>]], [[ReverseDialog|<ReverseDialog>]], [[ScaleDialog|<ScaleDialog>]], [[SelectCasesDialog|<SelectCasesDialog>]], [[SortDialog|<SortDialog>]], [[StandardizeDialog|<StandardizeDialog>]], [[WeightDialog|<WeightDialog>]]
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]], [[DeriveDialogs.tsx]], [[MergeDialogs.tsx]], [[RecodeDialog.tsx]]

### tryRun
*function* · line 68 · exported
> Run `fn`, showing its error message instead of throwing. Returns true on success.
- Calls: [[errorlog.ts#logFailure|logFailure()]]
- Used in: [[CasesDialogs.tsx]], [[DeriveDialogs.tsx]], [[MergeDialogs.tsx]], [[RecodeDialog.tsx]]

### insertAtCursor
*function* · line 81 · exported
> Insert text at the cursor of a textarea/input and keep focus there.
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]]

### ExpressionField
*component* · line 101 · exported · note: [[ExpressionField|<ExpressionField>]]
> Expression textarea that shows the error position underneath.
- Rendered by: [[ComputeDialog|<ComputeDialog>]], [[RecodeDialog|<RecodeDialog>]], [[SelectCasesDialog|<SelectCasesDialog>]]
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]], [[RecodeDialog.tsx]]

### ExpressionHelper
*component* · line 154 · exported · note: [[ExpressionHelper|<ExpressionHelper>]]
> Variables + functions reference panel that inserts into the active expression field.
- Renders: [[Icon|<Icon>]], [[VarMeasureIcon|<VarMeasureIcon>]]
- Uses: [[functions.ts#FUNCTION_DOCS|FUNCTION_DOCS]], [[functions.ts#OPERATOR_DOCS|OPERATOR_DOCS]], [[functions.ts#SYSTEM_VARIABLES|SYSTEM_VARIABLES]]
- Rendered by: [[ComputeDialog|<ComputeDialog>]], [[SelectCasesDialog|<SelectCasesDialog>]]
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]]

### NumField
*component* · line 223 · exported · note: [[NumField|<NumField>]]
> Numeric text input helper.
- Rendered by: [[BinningDialog|<BinningDialog>]], [[RankDialog|<RankDialog>]], [[ReverseDialog|<ReverseDialog>]], [[ScaleDialog|<ScaleDialog>]], [[SelectCasesDialog|<SelectCasesDialog>]]
- Used in: [[CasesDialogs.tsx]], [[DeriveDialogs.tsx]]

### TextField
*component* · line 233 · exported · note: [[TextField|<TextField>]]
- Rendered by: [[AggregateDialog|<AggregateDialog>]], [[BinningDialog|<BinningDialog>]], [[ComputeDialog|<ComputeDialog>]], [[CountDialog|<CountDialog>]], [[ScaleDialog|<ScaleDialog>]]
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]], [[DeriveDialogs.tsx]], [[MergeDialogs.tsx]]

### FROM_KINDS
*const* · line 247 · exported

### useFromEditor
*hook* · line 257 · exported · note: [[useFromEditor|useFromEditor()]]
- Uses: [[transform/common.tsx#FROM_KINDS|FROM_KINDS]]
- Used in: [[DeriveDialogs.tsx]], [[RecodeDialog.tsx]]

### VarSelect
*component* · line 316 · exported · note: [[VarSelect|<VarSelect>]]
> Compact variable select (for a single choice inside rows).
- Rendered by: [[AggregateDialog|<AggregateDialog>]], [[MergeVariablesDialog|<MergeVariablesDialog>]], [[SelectCasesDialog|<SelectCasesDialog>]], [[SortDialog|<SortDialog>]]
- Used in: [[CasesDialogs.tsx]], [[MergeDialogs.tsx]]
