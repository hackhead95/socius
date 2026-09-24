---
id: src/lib/io/index.ts
type: module
file: src/lib/io/index.ts
area: lib/io
---

# src/lib/io/index.ts

*Module* · area [[lib - io|lib/io]] · 203 lines

> File import/export entry points. Other modules code against these signatures. Nothing here touches DOM-only globals at import time; everything runs in the browser and in node.

## Imports
- [[fflate]] · value
- [[core/types.ts]] · type-only
- [[codebook.ts]] · value
- [[csv.ts]] · value
- [[sav-reader.ts]] · value
- [[sav-writer.ts]] · value
- [[xlsx.ts]] · value

## Tested by
- [[scenarios.test.ts]] · import
- [[dataset.test.ts]] · import
- [[example.test.ts]] · import
- [[io.fuzz.test.ts]] · import
- [[csv.test.ts]] · import
- [[import.test.ts]] · import
- [[sav-malformed.test.ts]] · import
- [[sav-write.test.ts]] · import
- [[xlsx.test.ts]] · import
- [[zip.test.ts]] · import
- [[samples.test.ts]] · import
- [[sample-survey.test.ts]] · import
- [[separation.test.ts]] · import
- [[properties.test.ts]] · import
- [[sample-oracle.test.ts]] · import

## Imported by
- [[fileActions.ts]] · value
- [[FileDialogs.tsx]] · value
- [[MergeDialogs.tsx]] · value
- [[samples/index.ts]] · value
- [[scenarios.test.ts]] · value
- [[dataset.test.ts]] · value
- [[example.test.ts]] · value
- [[io.fuzz.test.ts]] · value
- [[csv.test.ts]] · value
- [[import.test.ts]] · value
- [[sav-malformed.test.ts]] · value
- [[sav-write.test.ts]] · value
- [[xlsx.test.ts]] · value
- [[zip.test.ts]] · value
- [[samples.test.ts]] · value
- [[sample-survey.test.ts]] · value
- [[separation.test.ts]] · value
- [[properties.test.ts]] · dynamic
- [[sample-oracle.test.ts]] · value

## Types
ImportResult (line 11) · ImportOptions (line 17)

## Private helpers
TEXT_EXTENSIONS (line 30) · UNSUPPORTED (line 32) · IMAGE (line 52) · extensionOf() (line 55) · startsWith() (line 61) · looksLikeText() (line 67) · ZIP_SIG (line 75) · OPENABLE_IN_ZIP (line 76) · detectKind() (line 114)

## Symbols

### isPlainZip
*function* · line 79 · exported
> True for a zip archive that is not an Office document (xlsx/docx carry [Content_Types].xml).
- Calls: [[io/index.ts]]
- Uses: [[io/index.ts]]
- Used in: [[fileActions.ts]], [[zip.test.ts]]

### unwrapZip
*function* · line 95 · exported
> The single data or project file inside a plain zip (for example `survey.sav.zip`, which is how the claude.ai Artifact viewer saves .sav files). Throws a plain-language error when the archive holds no file Socius can open, or several.
- Uses: [[io/index.ts]]
- Used in: [[fileActions.ts]], [[zip.test.ts]]

### unopenableReason
*function* · line 146 · exported
> A plain-language reason why a file cannot be opened as data, judged from its name and first bytes (cheap: no parsing), or null if it looks openable. Lets the UI refuse before asking to replace data.
- Calls: [[io/index.ts]]
- Uses: [[io/index.ts]]
- Used in: [[fileActions.ts]], [[zip.test.ts]]

### importFile
*function* · line 157 · exported
> Import .sav, .zsav, .csv, .tsv, .txt (delimited), .xlsx. Detects type by magic bytes, then extension.
- Calls: [[csv.ts#readDelimited|readDelimited()]], [[io/index.ts#isPlainZip|isPlainZip()]], [[io/index.ts#unwrapZip|unwrapZip()]], [[io/index.ts]], [[sav-reader.ts#readSav|readSav()]], [[xlsx.ts#readXlsx|readXlsx()]]
- Used in: [[FileDialogs.tsx]], [[fileActions.ts]], [[MergeDialogs.tsx]], [[samples/index.ts]], [[scenarios.test.ts]], [[dataset.test.ts]], [[example.test.ts]], [[io.fuzz.test.ts]], [[csv.test.ts]], [[import.test.ts]], [[sav-malformed.test.ts]], [[xlsx.test.ts]], [[zip.test.ts]], [[samples.test.ts]], [[sample-survey.test.ts]], [[separation.test.ts]], [[sample-oracle.test.ts]]

### exportSav
*function* · line 172 · exported
> Write an SPSS .sav file (bytecode-compressed by default; `zsav` for zlib-compressed).
- Calls: [[sav-writer.ts#writeSav|writeSav()]]
- Used in: [[dataset.test.ts]], [[sav-write.test.ts]]

### exportSavWithReport
*function* · line 180 · exported
> Like exportSav, plus plain-language notes about anything SPSS could not store exactly (strings widened, more than 3 missing values, labels cut to SPSS limits, names changed).
- Calls: [[sav-writer.ts#writeSav|writeSav()]]
- Used in: [[fileActions.ts]], [[io.fuzz.test.ts]], [[sav-write.test.ts]]

### exportCsv
*function* · line 185 · exported
> CSV text. `values`: 'codes' writes raw values, 'labels' writes value labels where defined.
- Calls: [[csv.ts#writeDelimited|writeDelimited()]]
- Used in: [[fileActions.ts]], [[io.fuzz.test.ts]], [[csv.test.ts]]

### exportXlsx
*function* · line 190 · exported
> Excel workbook: sheet "Data" plus sheet "Variables" (the codebook).
- Calls: [[xlsx.ts#writeXlsx|writeXlsx()]]
- Used in: [[fileActions.ts]], [[io.fuzz.test.ts]], [[xlsx.test.ts]]

### codebookRows
*function* · line 195 · exported
> A codebook (variable list with labels, value labels, missing values) as rows for display/export.
- Calls: [[codebook.ts#codebookRows|codebookRows()]]
- Used in: [[fileActions.ts]], [[import.test.ts]]

### listXlsxSheets
*function* · line 200 · exported
> Worksheet names of an .xlsx file (for a sheet picker before importing).
- Calls: [[xlsx.ts#listXlsxSheets|listXlsxSheets()]]
- Used in: [[fileActions.ts]], [[xlsx.test.ts]]
