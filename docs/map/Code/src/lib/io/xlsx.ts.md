---
id: src/lib/io/xlsx.ts
type: module
file: src/lib/io/xlsx.ts
area: lib/io
---

# src/lib/io/xlsx.ts

*Module* · area [[lib - io|lib/io]] · 384 lines

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
- [[codebook-roundtrip.test.ts]] · import
- [[xlsx.test.ts]] · import

## Imported by
- [[io/index.ts]] · value
- [[codebook-roundtrip.test.ts]] · value
- [[xlsx.test.ts]] · value

## Types
XlsxImportOptions (line 40)

## Private helpers
MAX_ROWS (line 11) · MAX_COLS (line 12) · toArrayBuffer() (line 19) · readAllSheets() (line 23) · cellStr() (line 96) · readQuoted() (line 102) · NUM_LABEL_START (line 122) · parseStringMissing() (line 169) · MEASURES (line 212) · readDictionarySheet() (line 230) · codesFromLabels() (line 260) · applyDictionary() (line 279) · SPSS_EPOCH_MS (line 330) · dataCell() (line 332)

## Symbols

### listXlsxSheets
*function* · line 36 · exported
> Names of the worksheets in an .xlsx file, in workbook order.
- Calls: [[xlsx.ts]]
- Used in: [[io/index.ts]]

### readXlsx
*function* · line 48 · exported
- Calls: [[infer.ts#tableToDataset|tableToDataset()]], [[xlsx.ts]]
- Used in: [[io/index.ts]]

### parseValueLabelsText
*function* · line 129 · exported
> "1 = Male; 2 = Female" or "'KOL' = Kolkata; '' = No answer" (as written by codebookRows) back into value labels. A label may itself contain "; " (it runs until the next "code = "). Unquoted string codes, as older workbooks wrote them, ar...
- Calls: [[xlsx.ts]]
- Uses: [[xlsx.ts]]
- Used in: [[codebook-roundtrip.test.ts]], [[xlsx.test.ts]]

### parseMissingText
*function* · line 187 · exported
> "LO THRU 0, -1" or "'DK', ''" (as written by codebookRows) back into a missing-value spec; null if not understood.
- Calls: [[xlsx.ts]]
- Used in: [[codebook-roundtrip.test.ts]], [[xlsx.test.ts]]

### writeXlsx
*function* · line 340 · exported
- Calls: [[codebook.ts#codebookRows|codebookRows()]], [[core/data.ts#valueLabelFor|valueLabelFor()]], [[xlsx.ts]]
- Uses: [[xlsx.ts]]
- Used in: [[io/index.ts]]
