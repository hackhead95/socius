---
id: src/features/data/VarDialogs.tsx
type: module
file: src/features/data/VarDialogs.tsx
area: features/data
---

# src/features/data/VarDialogs.tsx

*Module* · area [[features - data|features/data]] · 456 lines

> Variable View dialogs: Type, Value Labels, Missing Values, Copy Properties.

## Imports
- [[react]] · value
- [[core/data.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[mutations.ts]] · value
- [[transform/common.tsx]] · value
- [[properties.ts]] · value
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
DATE_FORMATS (line 17) · kindOf() (line 37) · textDecimals() (line 48)

## Symbols

### typeName
*function* · line 27 · exported
- Calls: [[core/data.ts#isDateFormat|isDateFormat()]]
- Used in: [[VariableView.tsx]]

### TypeDialog
*component* · line 59 · exported · note: [[TypeDialog|<TypeDialog>]]
- Renders: [[Modal|<Modal>]]
- Calls: [[VarDialogs.tsx]], [[mutations.ts#changeType|changeType()]], [[useStore]]
- Uses: [[VarDialogs.tsx]], [[useStore]]
- Store actions: [[mutateDataset()|useStore.mutateDataset()]], [[toast()|useStore.toast()]]
- Rendered by: [[VariableViewInner|<VariableViewInner>]]

### describeValueLabels
*function* · line 158 · exported
> ---------- Value labels ----------
- Used in: [[VariableView.tsx]]

### parseLabelLines
*function* · line 166 · exported
> Parse pasted lines like "1=Male", "2 Female", "3<TAB>Other", "'a' = Yes".
- Used in: [[dataview.test.ts]]

### ValueLabelsDialog
*component* · line 193 · exported · note: [[ValueLabelsDialog|<ValueLabelsDialog>]]
- Renders: [[Icon|<Icon>]], [[Modal|<Modal>]]
- Calls: [[VarDialogs.tsx#parseLabelLines|parseLabelLines()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[mutations.ts#patchVariable|patchVariable()]], [[useStore]]
- Store actions: [[mutateDataset()|useStore.mutateDataset()]]
- Rendered by: [[VariableViewInner|<VariableViewInner>]]

### describeMissing
*function* · line 302 · exported
> ---------- Missing values ----------
- Used in: [[VariableView.tsx]]

### MissingDialog
*component* · line 310 · exported · note: [[MissingDialog|<MissingDialog>]]
- Renders: [[Modal|<Modal>]]
- Calls: [[mutations.ts#patchVariable|patchVariable()]], [[useStore]]
- Store actions: [[mutateDataset()|useStore.mutateDataset()]]
- Rendered by: [[VariableViewInner|<VariableViewInner>]]

### CopyPropertiesDialog
*component* · line 403 · exported · note: [[CopyPropertiesDialog|<CopyPropertiesDialog>]]
> ---------- Copy properties ----------
- Renders: [[Modal|<Modal>]], [[VarPicker|<VarPicker>]]
- Calls: [[properties.ts#copyPropertiesTransform|copyPropertiesTransform()]], [[transform/common.tsx#applyTransform|applyTransform()]]
- Uses: [[properties.ts#COPY_PROPS|COPY_PROPS]], [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Rendered by: [[DialogHost|<DialogHost>]], [[VariableViewInner|<VariableViewInner>]]
