---
id: tests/io/csv.test.ts
type: test
file: tests/io/csv.test.ts
area: tests
---

# tests/io/csv.test.ts

*Test file* · area [[tests]] · 250 lines

> Delimited text import/export. pandas is the oracle for parsing where Python is available.

## Test cases
- **CSV parsing**
  - follows RFC 4180: quotes, doubled quotes, embedded delimiters and line breaks
  - handles CR-only line endings, a trailing delimiter and no final newline
  - flags an unterminated quote
  - detects comma, semicolon, tab and pipe delimiters
- **CSV import**
  - infers numeric, string, date and datetime columns
  - chooses measurement levels from the values
  - makes valid unique names and keeps the original header as the label
  - makes duplicate headers unique
  - reads files without a header row
  - strips a UTF-8 BOM and reads semicolon files with decimal commas
  - keeps comma numbers as text outside semicolon files (they may be thousands separators)
  - tells the user about comma numbers kept as text and NA words read as missing
  - falls back to windows-1252 for invalid UTF-8, and honours an encoding override
  - reads tab-separated .tsv and a delimiter override
  - pads short rows and warns
  - rejects a file with no data
- **CSV export**
  - writes codes with RFC 4180 quoting, ISO dates and empty system-missing cells
  - writes value labels when asked, with another delimiter and a BOM
  - round trips through import

## Imports
- [[node-child_process|node:child_process]] · value
- [[node-fs|node:fs]] · value
- [[core/types.ts]] · value
- [[csv.ts]] · value
- [[io/index.ts]] · value
- [[io/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[csv.ts#detectDelimiter|detectDelimiter()]]
- [[io/index.ts#exportCsv|exportCsv()]]
- [[io/index.ts#importFile|importFile()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[csv.ts#parseDelimited|parseDelimited()]]
- [[io/helpers.ts#tempPath|tempPath()]]

## Uses
- [[io/helpers.ts#HAS_ORACLE|HAS_ORACLE]]
- [[io/helpers.ts#PYTHON|PYTHON]]

## Tests
- [[core/types.ts]] · import
- [[csv.ts]] · import
- [[io/index.ts]] · import

## Private helpers
enc() (line 10) · col() (line 11) · TRICKY (line 17)
