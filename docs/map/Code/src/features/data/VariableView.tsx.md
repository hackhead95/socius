---
id: src/features/data/VariableView.tsx
type: module
file: src/features/data/VariableView.tsx
area: features/data
---

# src/features/data/VariableView.tsx

*Module* · area [[features - data|features/data]] · 655 lines

> Variable View: the SPSS dictionary as an editable table (one row per variable).

## Imports
- [[@tanstack-react-virtual|@tanstack/react-virtual]] · value
- [[react]] · value
- [[ui-store.ts]] · value
- [[core/data.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[mutations.ts]] · value
- [[VarDialogs.tsx]] · value
- [[Icon.tsx]] · value
- [[MeasureIcon.tsx]] · value
- [[Menu.tsx]] · value

## Imported by
- [[App.tsx]] · value

## Private helpers
COLS (line 16) · ROW_H (line 29) · NUM_W (line 30) · SELECT_OPTIONS (line 32) · cap() (line 53)

## Symbols

### VariableView
*component* · line 55 · exported · note: [[VariableView|<VariableView>]]
- Renders: [[VariableViewInner|<VariableViewInner>]]
- Calls: [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Rendered by: [[Components/App|<App>]]

### VariableViewInner
*component* · line 63 · note: [[VariableViewInner|<VariableViewInner>]]
- Renders: [[CellDisplay|<CellDisplay>]], [[ContextMenu|<ContextMenu>]], [[CopyPropertiesDialog|<CopyPropertiesDialog>]], [[Icon|<Icon>]], [[MissingDialog|<MissingDialog>]], [[TypeDialog|<TypeDialog>]], [[ValueLabelsDialog|<ValueLabelsDialog>]]
- Calls: [[core/data.ts#isDateFormat|isDateFormat()]], [[mutations.ts#changeType|changeType()]], [[mutations.ts#duplicateVariables|duplicateVariables()]], [[mutations.ts#formatWith|formatWith()]], [[mutations.ts#newDefaultVariable|newDefaultVariable()]], [[mutations.ts#varNameProblem|varNameProblem()]], [[useStore]], [[useUi]]
- Uses: [[VariableView.tsx]], [[useStore]]
- Reads: [[varViewTarget|useUi.varViewTarget]]
- Store actions: [[addVariable()|useStore.addVariable()]], [[deleteVariables()|useStore.deleteVariables()]], [[focusGrid()|useUi.focusGrid()]], [[moveVariable()|useStore.moveVariable()]], [[mutateDataset()|useStore.mutateDataset()]], [[openDialog()|useStore.openDialog()]], [[setTab()|useStore.setTab()]], [[toast()|useStore.toast()]], [[updateVariable()|useStore.updateVariable()]]
- Opens: [[transform/define-properties|transform: define-properties]]

### CellDisplay
*component* · line 604 · note: [[CellDisplay|<CellDisplay>]]
- Renders: [[DialogCell|<DialogCell>]], [[MeasureIcon|<MeasureIcon>]]
- Calls: [[MeasureIcon.tsx#measureKind|measureKind()]], [[VarDialogs.tsx#describeMissing|describeMissing()]], [[VarDialogs.tsx#describeValueLabels|describeValueLabels()]], [[VarDialogs.tsx#typeName|typeName()]], [[VariableView.tsx]], [[core/data.ts#isDateFormat|isDateFormat()]]

### DialogCell
*component* · line 635 · note: [[DialogCell|<DialogCell>]]
- Renders: [[Icon|<Icon>]]
