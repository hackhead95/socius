---
id: tests/io/xlsx.test.ts
type: test
file: tests/io/xlsx.test.ts
area: tests
---

# tests/io/xlsx.test.ts

*Test file* · area [[tests]] · 172 lines

> Excel import (fixture written by openpyxl in scripts/fixtures/make_fixtures.py) and export (checked by reading it back, and by openpyxl when Python is available).

## Test cases
- **XLSX import**
  - reads the first sheet with Excel types mapped to SPSS types
  - selects a sheet by name or 0-based index and lists sheets
  - reads without a header row when asked
  - reports a damaged workbook clearly
- **XLSX export**
  - writes a Data sheet that imports back to the same values
  - parses codebook text back into value labels and missing values
  - writes labels instead of codes when asked, and a codebook sheet

## Imports
- [[node-child_process|node:child_process]] · value
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[core/types.ts]] · value
- [[io/index.ts]] · value
- [[xlsx.ts]] · value
- [[io/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[io/index.ts#exportXlsx|exportXlsx()]]
- [[io/index.ts#importFile|importFile()]]
- [[io/index.ts#listXlsxSheets|listXlsxSheets()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[xlsx.ts#parseMissingText|parseMissingText()]]
- [[xlsx.ts#parseValueLabelsText|parseValueLabelsText()]]
- [[io/helpers.ts#tempPath|tempPath()]]

## Uses
- [[io/helpers.ts#FIXTURES|FIXTURES]]
- [[io/helpers.ts#HAS_ORACLE|HAS_ORACLE]]
- [[io/helpers.ts#PYTHON|PYTHON]]

## Tests
- [[core/types.ts]] · import
- [[io/index.ts]] · import
- [[xlsx.ts]] · import

## Private helpers
workbook() (line 12) · col() (line 14) · exportSample() (line 76)
