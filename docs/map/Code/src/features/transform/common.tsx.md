---
id: src/features/transform/common.tsx
type: module
file: src/features/transform/common.tsx
area: features/transform
---

# src/features/transform/common.tsx

*Module* · area [[features - transform|features/transform]] · 351 lines

> Shared building blocks for transformation dialogs.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[transform/index.ts]] · value
- [[errorlog.ts]] · value
- [[Icon.tsx]] · value
- [[MeasureIcon.tsx]] · value
- [[Modal.tsx]] · value

## Tested by
- [[data-fixes.test.ts]] · import

## Imported by
- [[menus.ts]] · value
- [[TopBar.tsx]] · value
- [[VarDialogs.tsx]] · value
- [[CasesDialogs.tsx]] · value
- [[ComputeDialog.tsx]] · value
- [[DeriveDialogs.tsx]] · value
- [[MergeDialogs.tsx]] · value
- [[RecodeDialog.tsx]] · value
- [[data-fixes.test.ts]] · value

## Types
FromKind (line 269)

## Symbols

### applyTransform
*function* · line 17 · exported
> Apply a transformation: undoable dataset change + quiet log entry + summary toast. `label` names the step for Edit > Undo ("Undo Recode into different variables"); use the menu item's words, plus the new variable's name where there is on...
- Calls: [[log.ts#transformLogItem|transformLogItem()]]
- Uses: [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]]
- Store actions: [[addOutput()|useStore.addOutput()]], [[focusGrid()|useUi.focusGrid()]], [[mutateDataset()|useStore.mutateDataset()]], [[setHome()|useUi.setHome()]], [[setTab()|useStore.setTab()]], [[toast()|useStore.toast()]]
- Used in: [[VarDialogs.tsx]], [[CasesDialogs.tsx]], [[ComputeDialog.tsx]], [[DeriveDialogs.tsx]], [[MergeDialogs.tsx]], [[RecodeDialog.tsx]], [[data-fixes.test.ts]]

### turnFilterOff
*function* · line 46 · exported
> FILTER OFF / WEIGHT OFF from a chip or menu, logged like the dialogs so the syntax log stays complete.
- Calls: [[cases.ts#selectCasesTransform|selectCasesTransform()]], [[transform/common.tsx#applyTransform|applyTransform()]]
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Used in: [[TopBar.tsx]], [[menus.ts]]

### turnWeightOff
*function* · line 50 · exported
- Calls: [[cases.ts#weightCases|weightCases()]], [[transform/common.tsx#applyTransform|applyTransform()]]
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Used in: [[TopBar.tsx]], [[menus.ts]]

### TransformModal
*component* · line 55 · exported · note: [[TransformModal|<TransformModal>]]
- Renders: [[Icon|<Icon>]], [[Modal|<Modal>]]
- Rendered by: [[AggregateDialog|<AggregateDialog>]], [[AutoRecodeDialog|<AutoRecodeDialog>]], [[BinningDialog|<BinningDialog>]], [[ComputeDialog|<ComputeDialog>]], [[CountDialog|<CountDialog>]], [[MergeCasesDialog|<MergeCasesDialog>]], [[MergeVariablesDialog|<MergeVariablesDialog>]], [[RankDialog|<RankDialog>]], [[RecodeDialog|<RecodeDialog>]], [[ReverseDialog|<ReverseDialog>]], [[ScaleDialog|<ScaleDialog>]], [[SelectCasesDialog|<SelectCasesDialog>]], [[SortDialog|<SortDialog>]], [[StandardizeDialog|<StandardizeDialog>]], [[WeightDialog|<WeightDialog>]]
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]], [[DeriveDialogs.tsx]], [[MergeDialogs.tsx]], [[RecodeDialog.tsx]]

### tryRun
*function* · line 92 · exported
> Run `fn`, showing its error message instead of throwing. Returns true on success.
- Calls: [[errorlog.ts#logFailure|logFailure()]]
- Used in: [[CasesDialogs.tsx]], [[DeriveDialogs.tsx]], [[MergeDialogs.tsx]], [[RecodeDialog.tsx]]

### insertAtCursor
*function* · line 105 · exported
> Insert text at the cursor of a textarea/input and keep focus there.
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]]

### ExpressionField
*component* · line 125 · exported · note: [[ExpressionField|<ExpressionField>]]
> Expression textarea that shows the error position underneath.
- Rendered by: [[ComputeDialog|<ComputeDialog>]], [[RecodeDialog|<RecodeDialog>]], [[SelectCasesDialog|<SelectCasesDialog>]]
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]], [[RecodeDialog.tsx]]

### ExpressionHelper
*component* · line 178 · exported · note: [[ExpressionHelper|<ExpressionHelper>]]
> Variables + functions reference panel that inserts into the active expression field.
- Renders: [[Icon|<Icon>]], [[VarMeasureIcon|<VarMeasureIcon>]]
- Uses: [[functions.ts#FUNCTION_DOCS|FUNCTION_DOCS]], [[functions.ts#OPERATOR_DOCS|OPERATOR_DOCS]], [[functions.ts#SYSTEM_VARIABLES|SYSTEM_VARIABLES]]
- Rendered by: [[ComputeDialog|<ComputeDialog>]], [[SelectCasesDialog|<SelectCasesDialog>]]
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]]

### NumField
*component* · line 247 · exported · note: [[NumField|<NumField>]]
> Numeric text input helper.
- Rendered by: [[BinningDialog|<BinningDialog>]], [[RankDialog|<RankDialog>]], [[ReverseDialog|<ReverseDialog>]], [[ScaleDialog|<ScaleDialog>]], [[SelectCasesDialog|<SelectCasesDialog>]]
- Used in: [[CasesDialogs.tsx]], [[DeriveDialogs.tsx]]

### TextField
*component* · line 257 · exported · note: [[TextField|<TextField>]]
- Rendered by: [[AggregateDialog|<AggregateDialog>]], [[BinningDialog|<BinningDialog>]], [[ComputeDialog|<ComputeDialog>]], [[CountDialog|<CountDialog>]], [[ScaleDialog|<ScaleDialog>]]
- Used in: [[CasesDialogs.tsx]], [[ComputeDialog.tsx]], [[DeriveDialogs.tsx]], [[MergeDialogs.tsx]]

### FROM_KINDS
*const* · line 271 · exported

### useFromEditor
*hook* · line 281 · exported · note: [[useFromEditor|useFromEditor()]]
- Uses: [[transform/common.tsx#FROM_KINDS|FROM_KINDS]]
- Used in: [[DeriveDialogs.tsx]], [[RecodeDialog.tsx]]

### VarSelect
*component* · line 340 · exported · note: [[VarSelect|<VarSelect>]]
> Compact variable select (for a single choice inside rows).
- Rendered by: [[AggregateDialog|<AggregateDialog>]], [[MergeVariablesDialog|<MergeVariablesDialog>]], [[SelectCasesDialog|<SelectCasesDialog>]], [[SortDialog|<SortDialog>]]
- Used in: [[CasesDialogs.tsx]], [[MergeDialogs.tsx]]
