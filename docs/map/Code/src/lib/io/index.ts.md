---
id: src/lib/io/index.ts
type: module
file: src/lib/io/index.ts
area: lib/io
---

# src/lib/io/index.ts

*Module* · area [[lib - io|lib/io]] · 214 lines

> File import/export entry points. Other modules code against these signatures. Nothing here touches DOM-only globals at import time; everything runs in the browser and in node.

## Imports
- [[fflate]] · value
- [[core/types.ts]] · type-only
- [[codebook.ts]] · value
- [[csv.ts]] · value
- [[infer.ts]] · re-export, type-only
- [[sav-reader.ts]] · value
- [[sav-writer.ts]] · value
- [[xlsx.ts]] · value

## Tested by
- [[scenarios.test.ts]] · import
- [[dataset.test.ts]] · import
- [[example.test.ts]] · import
- [[ui-fixes.test.tsx]] · import
- [[findings-repro.test.ts]] · import
- [[io.fuzz.test.ts]] · import
- [[codebook-roundtrip.test.ts]] · import
- [[csv.test.ts]] · import
- [[import.test.ts]] · import
- [[sav-malformed.test.ts]] · import
- [[sav-write.test.ts]] · import
- [[xlsx.test.ts]] · import
- [[zip.test.ts]] · import
- [[ai-latency.test.ts]] · import
- [[samples.test.ts]] · import
- [[sample-survey.test.ts]] · import
- [[separation.test.ts]] · import
- [[dialog-transforms.test.ts]] · import
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
- [[ui-fixes.test.tsx]] · value
- [[findings-repro.test.ts]] · value
- [[io.fuzz.test.ts]] · value
- [[codebook-roundtrip.test.ts]] · value
- [[csv.test.ts]] · value
- [[import.test.ts]] · value
- [[sav-malformed.test.ts]] · value
- [[sav-write.test.ts]] · value
- [[xlsx.test.ts]] · value
- [[zip.test.ts]] · value
- [[ai-latency.test.ts]] · dynamic
- [[samples.test.ts]] · value
- [[sample-survey.test.ts]] · value
- [[separation.test.ts]] · value
- [[dialog-transforms.test.ts]] · value
- [[properties.test.ts]] · dynamic
- [[sample-oracle.test.ts]] · value

## Types
ImportResult (line 12) · ImportOptions (line 22)

## Private helpers
TEXT_EXTENSIONS (line 41) · UNSUPPORTED (line 43) · IMAGE (line 63) · extensionOf() (line 66) · startsWith() (line 72) · looksLikeText() (line 78) · ZIP_SIG (line 86) · OPENABLE_IN_ZIP (line 87) · detectKind() (line 125)

## Symbols

### isPlainZip
*function* · line 90 · exported
> True for a zip archive that is not an Office document (xlsx/docx carry [Content_Types].xml).
- Calls: [[io/index.ts]]
- Uses: [[io/index.ts]]
- Used in: [[fileActions.ts]], [[zip.test.ts]]

### unwrapZip
*function* · line 106 · exported
> The single data or project file inside a plain zip (for example `survey.sav.zip`, which is how the claude.ai Artifact viewer saves .sav files). Throws a plain-language error when the archive holds no file Socius can open, or several.
- Uses: [[io/index.ts]]
- Used in: [[fileActions.ts]], [[zip.test.ts]]

### unopenableReason
*function* · line 157 · exported
> A plain-language reason why a file cannot be opened as data, judged from its name and first bytes (cheap: no parsing), or null if it looks openable. Lets the UI refuse before asking to replace data.
- Calls: [[io/index.ts]]
- Uses: [[io/index.ts]]
- Used in: [[fileActions.ts]], [[zip.test.ts]]

### importFile
*function* · line 168 · exported
> Import .sav, .zsav, .csv, .tsv, .txt (delimited), .xlsx. Detects type by magic bytes, then extension.
- Calls: [[csv.ts#readDelimited|readDelimited()]], [[io/index.ts#isPlainZip|isPlainZip()]], [[io/index.ts#unwrapZip|unwrapZip()]], [[io/index.ts]], [[sav-reader.ts#readSav|readSav()]], [[xlsx.ts#readXlsx|readXlsx()]]
- Used in: [[FileDialogs.tsx]], [[fileActions.ts]], [[MergeDialogs.tsx]], [[samples/index.ts]], [[scenarios.test.ts]], [[dataset.test.ts]], [[example.test.ts]], [[ui-fixes.test.tsx]], [[findings-repro.test.ts]], [[io.fuzz.test.ts]], [[codebook-roundtrip.test.ts]], [[csv.test.ts]], [[import.test.ts]], [[sav-malformed.test.ts]], [[xlsx.test.ts]], [[zip.test.ts]], [[samples.test.ts]], [[sample-survey.test.ts]], [[separation.test.ts]], [[dialog-transforms.test.ts]], [[sample-oracle.test.ts]]

### exportSav
*function* · line 183 · exported
> Write an SPSS .sav file (bytecode-compressed by default; `zsav` for zlib-compressed).
- Calls: [[sav-writer.ts#writeSav|writeSav()]]
- Used in: [[dataset.test.ts]], [[sav-write.test.ts]]

### exportSavWithReport
*function* · line 191 · exported
> Like exportSav, plus plain-language notes about anything SPSS could not store exactly (strings widened, more than 3 missing values, labels cut to SPSS limits, names changed).
- Calls: [[sav-writer.ts#writeSav|writeSav()]]
- Used in: [[fileActions.ts]], [[io.fuzz.test.ts]], [[sav-write.test.ts]]

### exportCsv
*function* · line 196 · exported
> CSV text. `values`: 'codes' writes raw values, 'labels' writes value labels where defined.
- Calls: [[csv.ts#writeDelimited|writeDelimited()]]
- Used in: [[fileActions.ts]], [[findings-repro.test.ts]], [[io.fuzz.test.ts]], [[codebook-roundtrip.test.ts]], [[csv.test.ts]]

### exportXlsx
*function* · line 201 · exported
> Excel workbook: sheet "Data" plus sheet "Variables" (the codebook).
- Calls: [[xlsx.ts#writeXlsx|writeXlsx()]]
- Used in: [[fileActions.ts]], [[findings-repro.test.ts]], [[io.fuzz.test.ts]], [[codebook-roundtrip.test.ts]], [[xlsx.test.ts]]

### codebookRows
*function* · line 206 · exported
> A codebook (variable list with labels, value labels, missing values) as rows for display/export.
- Calls: [[codebook.ts#codebookRows|codebookRows()]]
- Used in: [[fileActions.ts]], [[codebook-roundtrip.test.ts]], [[import.test.ts]]

### listXlsxSheets
*function* · line 211 · exported
> Worksheet names of an .xlsx file (for a sheet picker before importing).
- Calls: [[xlsx.ts#listXlsxSheets|listXlsxSheets()]]
- Used in: [[fileActions.ts]], [[xlsx.test.ts]]
