---
id: "src/features/coding/dialogs/ExportDialogs.tsx#ExportDialog"
type: component
file: src/features/coding/dialogs/ExportDialogs.tsx
line: 20
area: features/coding
---

# <ExportDialog>

*React component* · defined in [[ExportDialogs.tsx]] (line 20) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[codebookIO.ts#codebookToCsv|codebookToCsv()]]
- [[codebookIO.ts#codebookToJson|codebookToJson()]]
- [[importers.ts#decodeText|decodeText()]]
- [[errorlog.ts#logFailure|logFailure()]]
- [[codebookIO.ts#mergeCodebook|mergeCodebook()]]
- [[codebookIO.ts#parseCodebookCsv|parseCodebookCsv()]]
- [[codebookIO.ts#parseCodebookJson|parseCodebookJson()]]
- [[coding/hooks.ts#plural|plural()]]
- [[coding/actions.ts#replaceCodebook|replaceCodebook()]]
- [[exports.ts#reportData|reportData()]]
- [[exports.ts#reportHtml|reportHtml()]]
- [[coding/hooks.ts#saveAndReport|saveAndReport()]]
- [[coding/hooks.ts#saveCsv|saveCsv()]]
- [[coding/hooks.ts#saveXlsx|saveXlsx()]]
- [[exports.ts#segmentTable|segmentTable()]]
- [[coding/hooks.ts#toast|toast()]]
- [[useStore]]

## Renders
- [[Modal|<Modal>]]
- [[Segmented|<Segmented>]]

## Reads
- [[useStore/coding|useStore.coding]] · selector

## Rendered by
- [[CodingDialog|<CodingDialog>]]

## Renders
- [[export|coding: export]]
- [[export-codebook|coding: export-codebook]]
- [[export-report|coding: export-report]]
