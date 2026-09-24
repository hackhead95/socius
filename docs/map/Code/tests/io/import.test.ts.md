---
id: tests/io/import.test.ts
type: test
file: tests/io/import.test.ts
area: tests
---

# tests/io/import.test.ts

*Test file* · area [[tests]] · 81 lines

> importFile type detection (magic bytes first, then extension), friendly rejections, and codebookRows.

## Test cases
- **importFile: detection**
  - detects SPSS files by their signature whatever the extension
  - detects xlsx by its zip signature
  - reads text files with unknown extensions as delimited text
  - names the alternative for formats it cannot read
- **codebookRows**
  - lists every variable with its dictionary information

## Imports
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[core/types.ts]] · value
- [[io/index.ts]] · value
- [[io/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[io/index.ts#codebookRows|codebookRows()]]
- [[io/index.ts#importFile|importFile()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]

## Uses
- [[io/helpers.ts#FIXTURES|FIXTURES]]

## Tests
- [[core/types.ts]] · import
- [[io/index.ts]] · import

## Private helpers
enc() (line 9) · fixture() (line 10)
