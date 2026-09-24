---
id: src/lib/io/xlsx.ts
type: module
file: src/lib/io/xlsx.ts
area: lib/io
---

# src/lib/io/xlsx.ts

*Module* · area [[lib - io|lib/io]] · 235 lines

> Excel .xlsx import and export. Uses the "universal" builds of read-excel-file and write-excel-file, which take ArrayBuffer/Blob and run in the browser and in node alike. They are loaded on demand so the main bundle stays small.

## Imports
- [[read-excel-file]] · dynamic
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[codebook.ts]] · value
- [[csv.ts]] · value
- [[infer.ts]] · value
- [[write-excel-file]] · dynamic

## Calls
- [[csv.ts#isoForFormat|isoForFormat()]]

## Tested by
- [[xlsx.test.ts]] · import

## Imported by
- [[io/index.ts]] · value
- [[xlsx.test.ts]] · value

## Types
XlsxImportOptions (line 39)

## Private helpers
MAX_ROWS (line 11) · MAX_COLS (line 12) · toArrayBuffer() (line 19) · readAllSheets() (line 23) · cellStr() (line 83) · MEASURES (line 130) · applyDictionarySheet() (line 133) · SPSS_EPOCH_MS (line 181) · dataCell() (line 183)

## Symbols

### listXlsxSheets
*function* · line 35 · exported
> Names of the worksheets in an .xlsx file, in workbook order.
- Calls: [[xlsx.ts]]
- Used in: [[io/index.ts]]

### readXlsx
*function* · line 45 · exported
- Calls: [[infer.ts#tableToDataset|tableToDataset()]], [[xlsx.ts]]
- Used in: [[io/index.ts]]

### parseValueLabelsText
*function* · line 86 · exported
> "1 = Male; 2 = Female" (as written by codebookRows) back into value labels.
- Used in: [[xlsx.test.ts]]

### parseMissingText
*function* · line 107 · exported
> "LO THRU 0, -1" (as written by codebookRows) back into a missing-value spec; null if not understood.
- Used in: [[xlsx.test.ts]]

### writeXlsx
*function* · line 191 · exported
- Calls: [[codebook.ts#codebookRows|codebookRows()]], [[core/data.ts#valueLabelFor|valueLabelFor()]], [[xlsx.ts]]
- Uses: [[xlsx.ts]]
- Used in: [[io/index.ts]]
