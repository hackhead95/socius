---
id: tests/io/sav-malformed.test.ts
type: test
file: tests/io/sav-malformed.test.ts
area: tests
---

# tests/io/sav-malformed.test.ts

*Test file* · area [[tests]] · 114 lines

> (4) Malformed or truncated .sav files give a clear SavFormatError, never a crash, hang or a low-level exception (RangeError from a DataView, out-of-memory allocation, ...).

## Test cases
- **reader: malformed input**
  - rejects empty, tiny and non-SPSS input with a readable message
  - reports truncated data with the promised and actual case counts
  - corrupting integer fields to extreme values never allocates absurd memory
  - a damaged zlib block is reported as damaged
  - importFile passes the readable error through

## Imports
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[io/index.ts]] · value
- [[sav-reader.ts]] · value
- [[io/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[io/index.ts#importFile|importFile()]]
- [[sav-reader.ts#readSav|readSav()]]

## Uses
- [[io/helpers.ts#FIXTURES|FIXTURES]]
- [[sav-reader.ts#SavFormatError|SavFormatError]]

## Tests
- [[io/index.ts]] · import
- [[sav-reader.ts]] · import

## Private helpers
fixture() (line 10) · rng() (line 13) · expectCleanOutcome() (line 24)
