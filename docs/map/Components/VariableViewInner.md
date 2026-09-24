---
id: "src/features/data/VariableView.tsx#VariableViewInner"
type: component
file: src/features/data/VariableView.tsx
line: 63
area: features/data
---

# <VariableViewInner>

*React component* · defined in [[VariableView.tsx]] (line 63) · area [[features - data|features/data]]

## Calls
- [[mutations.ts#changeType|changeType()]]
- [[mutations.ts#duplicateVariables|duplicateVariables()]]
- [[mutations.ts#formatWith|formatWith()]]
- [[core/data.ts#isDateFormat|isDateFormat()]]
- [[mutations.ts#newDefaultVariable|newDefaultVariable()]]
- [[useStore]]
- [[useUi]]
- [[mutations.ts#varNameProblem|varNameProblem()]]

## Renders
- [[CellDisplay|<CellDisplay>]]
- [[ContextMenu|<ContextMenu>]]
- [[CopyPropertiesDialog|<CopyPropertiesDialog>]]
- [[Icon|<Icon>]]
- [[MissingDialog|<MissingDialog>]]
- [[TypeDialog|<TypeDialog>]]
- [[ValueLabelsDialog|<ValueLabelsDialog>]]

## Uses
- [[useStore]]

## Reads
- [[varViewTarget|useUi.varViewTarget]] · selector

## Calls store actions
- [[addVariable()|useStore.addVariable()]] · getState
- [[deleteVariables()|useStore.deleteVariables()]] · getState
- [[moveVariable()|useStore.moveVariable()]] · getState
- [[mutateDataset()|useStore.mutateDataset()]] · selector
- [[openDialog()|useStore.openDialog()]] · getState
- [[setTab()|useStore.setTab()]] · selector
- [[toast()|useStore.toast()]] · selector
- [[updateVariable()|useStore.updateVariable()]] · selector
- [[focusGrid()|useUi.focusGrid()]] · selector

## Opens
- [[transform/define-properties|transform: define-properties]]

## Rendered by
- [[VariableView|<VariableView>]]

## Binds shortcut
- [[ArrowDown (VariableViewInner)]]
- [[ArrowLeft (VariableViewInner)]]
- [[ArrowRight (VariableViewInner)]]
- [[ArrowUp (VariableViewInner)]]
- [[Delete (VariableViewInner)]]
- [[Enter (VariableViewInner)]]
- [[Escape (VariableViewInner)]]
- [[F2 (VariableViewInner)]]
- [[Mod+End (VariableViewInner)]]
- [[Mod+Home (VariableViewInner)]]
- [[PageDown (VariableViewInner)]]
- [[PageUp (VariableViewInner)]]
- [[Shift+Tab (VariableViewInner)]]
- [[Space (VariableViewInner)]]
- [[Tab (VariableViewInner)]]
