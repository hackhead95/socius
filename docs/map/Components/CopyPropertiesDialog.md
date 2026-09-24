---
id: "src/features/data/VarDialogs.tsx#CopyPropertiesDialog"
type: component
file: src/features/data/VarDialogs.tsx
line: 401
area: features/data
---

# <CopyPropertiesDialog>

*React component* · defined in [[VarDialogs.tsx]] (line 401) · area [[features - data|features/data]]

> ---------- Copy properties ----------

- **Exported:** yes

## Calls
- [[mutations.ts#copyProperties|copyProperties()]]
- [[useStore]]

## Renders
- [[Modal|<Modal>]]
- [[VarPicker|<VarPicker>]]

## Uses
- [[mutations.ts#COPY_PROPS|COPY_PROPS]]

## Calls store actions
- [[mutateDataset()|useStore.mutateDataset()]] · selector
- [[toast()|useStore.toast()]] · selector

## Rendered by
- [[DialogHost|<DialogHost>]]
- [[VariableViewInner|<VariableViewInner>]]

## Renders
- [[transform/copy-properties|transform: copy-properties]]
