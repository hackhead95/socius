---
id: tests/io/codebook-roundtrip.test.ts
type: test
file: tests/io/codebook-roundtrip.test.ts
area: tests
---

# tests/io/codebook-roundtrip.test.ts

*Test file* · area [[tests]] · 145 lines

> Excel round trips of the dictionary (FZ-10, FZ-17) and CSV/Excel type inference with its warning and "Keep as text" (FZ-18, intended with warning). See docs/qa/FUZZ-FINDINGS.md.

## Test cases
- **FZ-10: string missing values and value labels survive the codebook text**
  - quotes string values SPSS-style
  - parses every tricky value back (missing values, three at a time)
  - parses value labels whose codes or labels contain "; " and " = "
  - an Excel round trip keeps tricky string missing values and value labels exactly
- **FZ-17: the Variables sheet is authoritative**
  - value labels come back for a variable whose cases are all missing, or that has no cases
  - with "Excel with value labels", label texts are read back as their codes
  - a numeric column holding text that is not a label stays text, with a note
  - string columns stay text (numbers, "NA", leading zeros and spaces kept) with their width
- **FZ-18: CSV numbers are inferred, with a warning; Keep as text keeps the text**
  - the warning lists each converted column and what changed
  - Keep as text reads the chosen columns exactly as written
  - a CSV round trip of a string column is exact with Keep as text
  - conversionWarning shortens long lists
  - Missing values and Value labels cells hold the SPSS-style text

## Imports
- [[node-child_process|node:child_process]] · value
- [[node-fs|node:fs]] · value
- [[core/types.ts]] · value
- [[codebook.ts]] · value
- [[io/index.ts]] · value
- [[infer.ts]] · value
- [[xlsx.ts]] · value
- [[io/helpers.ts]] · value
- [[vitest]] · value
- [[write-excel-file]] · dynamic

## Calls
- [[io/index.ts#codebookRows|codebookRows()]]
- [[infer.ts#conversionWarning|conversionWarning()]]
- [[io/index.ts#exportCsv|exportCsv()]]
- [[io/index.ts#exportXlsx|exportXlsx()]]
- [[io/index.ts#importFile|importFile()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[xlsx.ts#parseMissingText|parseMissingText()]]
- [[xlsx.ts#parseValueLabelsText|parseValueLabelsText()]]
- [[codebook.ts#quoteValue|quoteValue()]]
- [[io/helpers.ts#tempPath|tempPath()]]

## Uses
- [[io/helpers.ts#HAS_ORACLE|HAS_ORACLE]]
- [[io/helpers.ts#PYTHON|PYTHON]]
- [[codebook.ts#quoteValue|quoteValue()]]

## Tests
- [[core/types.ts]] · import
- [[codebook.ts]] · import
- [[io/index.ts]] · import
- [[infer.ts]] · import
- [[xlsx.ts]] · import

## Private helpers
enc() (line 13) · one() (line 14) · xlsxRoundTrip() (line 17) · TRICKY (line 22)
