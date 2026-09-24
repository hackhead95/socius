---
id: src/features/coding/dialogs/ExportDialogs.tsx
type: module
file: src/features/coding/dialogs/ExportDialogs.tsx
area: features/coding
---

# src/features/coding/dialogs/ExportDialogs.tsx

*Module* · area [[features - coding|features/coding]] · 280 lines

> Export coded segments, the qualitative report and the codebook; import a codebook; export codes to the dataset as 0/1 variables (mixed-methods bridge).

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[codebookIO.ts]] · value
- [[docxExports.ts]] · dynamic
- [[exports.ts]] · value
- [[importers.ts]] · value
- [[toDataset.ts]] · value
- [[tree.ts]] · value
- [[errorlog.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[CodingDialog.tsx]] · value

## Symbols

### ExportDialog
*component* · line 20 · exported · note: [[ExportDialog|<ExportDialog>]]
- Renders: [[Modal|<Modal>]], [[Segmented|<Segmented>]]
- Calls: [[codebookIO.ts#codebookToCsv|codebookToCsv()]], [[codebookIO.ts#codebookToJson|codebookToJson()]], [[codebookIO.ts#mergeCodebook|mergeCodebook()]], [[codebookIO.ts#parseCodebookCsv|parseCodebookCsv()]], [[codebookIO.ts#parseCodebookJson|parseCodebookJson()]], [[coding/actions.ts#replaceCodebook|replaceCodebook()]], [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#saveAndReport|saveAndReport()]], [[coding/hooks.ts#saveCsv|saveCsv()]], [[coding/hooks.ts#saveXlsx|saveXlsx()]], [[coding/hooks.ts#toast|toast()]], [[errorlog.ts#logFailure|logFailure()]], [[exports.ts#reportData|reportData()]], [[exports.ts#reportHtml|reportHtml()]], [[exports.ts#segmentTable|segmentTable()]], [[importers.ts#decodeText|decodeText()]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Rendered by: [[CodingDialog|<CodingDialog>]]

### ExportToDatasetDialog
*component* · line 132 · exported · note: [[ExportToDatasetDialog|<ExportToDatasetDialog>]]
- Renders: [[Modal|<Modal>]], [[Swatch|<Swatch>]]
- Calls: [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#toast|toast()]], [[toDataset.ts#applyCodeVariables|applyCodeVariables()]], [[toDataset.ts#buildCodeVariables|buildCodeVariables()]], [[tree.ts#descendantIds|descendantIds()]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[useStore/coding|useStore.coding]]
- Store actions: [[mutateDataset()|useStore.mutateDataset()]]
- Rendered by: [[CodingDialog|<CodingDialog>]]
