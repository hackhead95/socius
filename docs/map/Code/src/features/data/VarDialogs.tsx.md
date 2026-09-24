---
id: src/features/data/VarDialogs.tsx
type: module
file: src/features/data/VarDialogs.tsx
area: features/data
---

# src/features/data/VarDialogs.tsx

*Module* · area [[features - data|features/data]] · 454 lines

> Variable View dialogs: Type, Value Labels, Missing Values, Copy Properties.

## Imports
- [[react]] · value
- [[core/data.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[mutations.ts]] · value
- [[Icon.tsx]] · value
- [[Modal.tsx]] · value
- [[VarPicker.tsx]] · value

## Calls
- [[core/data.ts#isDateFormat|isDateFormat()]]

## Tested by
- [[dataview.test.ts]] · import

## Imported by
- [[DialogHost.tsx]] · value
- [[VariableView.tsx]] · value
- [[dataview.test.ts]] · value

## Private helpers
DATE_FORMATS (line 15) · kindOf() (line 35) · textDecimals() (line 46)

## Symbols

### typeName
*function* · line 25 · exported
- Calls: [[core/data.ts#isDateFormat|isDateFormat()]]
- Used in: [[VariableView.tsx]]

### TypeDialog
*component* · line 57 · exported · note: [[TypeDialog|<TypeDialog>]]
- Renders: [[Modal|<Modal>]]
- Calls: [[VarDialogs.tsx]], [[mutations.ts#changeType|changeType()]], [[useStore]]
- Uses: [[VarDialogs.tsx]], [[useStore]]
- Store actions: [[mutateDataset()|useStore.mutateDataset()]], [[toast()|useStore.toast()]]
- Rendered by: [[VariableViewInner|<VariableViewInner>]]

### describeValueLabels
*function* · line 156 · exported
> ---------- Value labels ----------
- Used in: [[VariableView.tsx]]

### parseLabelLines
*function* · line 164 · exported
> Parse pasted lines like "1=Male", "2 Female", "3<TAB>Other", "'a' = Yes".
- Used in: [[dataview.test.ts]]

### ValueLabelsDialog
*component* · line 191 · exported · note: [[ValueLabelsDialog|<ValueLabelsDialog>]]
- Renders: [[Icon|<Icon>]], [[Modal|<Modal>]]
- Calls: [[VarDialogs.tsx#parseLabelLines|parseLabelLines()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[useStore]]
- Store actions: [[updateVariable()|useStore.updateVariable()]]
- Rendered by: [[VariableViewInner|<VariableViewInner>]]

### describeMissing
*function* · line 300 · exported
> ---------- Missing values ----------
- Used in: [[VariableView.tsx]]

### MissingDialog
*component* · line 308 · exported · note: [[MissingDialog|<MissingDialog>]]
- Renders: [[Modal|<Modal>]]
- Calls: [[useStore]]
- Store actions: [[updateVariable()|useStore.updateVariable()]]
- Rendered by: [[VariableViewInner|<VariableViewInner>]]

### CopyPropertiesDialog
*component* · line 401 · exported · note: [[CopyPropertiesDialog|<CopyPropertiesDialog>]]
> ---------- Copy properties ----------
- Renders: [[Modal|<Modal>]], [[VarPicker|<VarPicker>]]
- Calls: [[mutations.ts#copyProperties|copyProperties()]], [[useStore]]
- Uses: [[mutations.ts#COPY_PROPS|COPY_PROPS]]
- Store actions: [[mutateDataset()|useStore.mutateDataset()]], [[toast()|useStore.toast()]]
- Rendered by: [[DialogHost|<DialogHost>]], [[VariableViewInner|<VariableViewInner>]]
