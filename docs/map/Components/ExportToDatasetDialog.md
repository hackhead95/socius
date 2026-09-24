---
id: "src/features/coding/dialogs/ExportDialogs.tsx#ExportToDatasetDialog"
type: component
file: src/features/coding/dialogs/ExportDialogs.tsx
line: 132
area: features/coding
---

# <ExportToDatasetDialog>

*React component* · defined in [[ExportDialogs.tsx]] (line 132) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[toDataset.ts#applyCodeVariables|applyCodeVariables()]]
- [[toDataset.ts#buildCodeVariables|buildCodeVariables()]]
- [[tree.ts#descendantIds|descendantIds()]]
- [[coding/hooks.ts#plural|plural()]]
- [[coding/hooks.ts#toast|toast()]]
- [[useOrderedCodes|useOrderedCodes()]]
- [[useStore]]

## Renders
- [[Modal|<Modal>]]
- [[Swatch|<Swatch>]]

## Reads
- [[useStore/coding|useStore.coding]] · selector
- [[dataset|useStore.dataset]] · selector

## Calls store actions
- [[mutateDataset()|useStore.mutateDataset()]] · selector

## Rendered by
- [[CodingDialog|<CodingDialog>]]

## Renders
- [[export-dataset|coding: export-dataset]]
