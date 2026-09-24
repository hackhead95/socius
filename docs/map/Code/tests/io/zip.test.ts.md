---
id: tests/io/zip.test.ts
type: test
file: tests/io/zip.test.ts
area: tests
---

# tests/io/zip.test.ts

*Test file* · area [[tests]] · 60 lines

> Zipped data files: the claude.ai Artifact viewer saves .sav files as <name>.sav.zip, and people email zipped CSVs. importFile unwraps a plain zip holding exactly one openable file.

## Test cases
- **zipped data files**
  - opens the .sav inside survey.sav.zip (how the Artifact viewer saves SPSS files)
  - opens a zipped .zsav, CSV and xlsx, ignoring folders and macOS metadata
  - still reads real xlsx workbooks (which are zips too) as Excel
  - explains archives it cannot open
  - unwrapZip returns the single project or data file with its bare name
- **unopenableReason**
  - rejects PDFs, images and other formats before any parsing

## Imports
- [[fflate]] · value
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[io/index.ts]] · value
- [[io/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[io/index.ts#importFile|importFile()]]
- [[io/index.ts#isPlainZip|isPlainZip()]]
- [[io/index.ts#unopenableReason|unopenableReason()]]
- [[io/index.ts#unwrapZip|unwrapZip()]]

## Uses
- [[io/helpers.ts#FIXTURES|FIXTURES]]

## Tests
- [[io/index.ts]] · import

## Private helpers
enc() (line 10) · fixture() (line 11)
