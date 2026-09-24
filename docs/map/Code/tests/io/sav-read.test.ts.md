---
id: tests/io/sav-read.test.ts
type: test
file: tests/io/sav-read.test.ts
area: tests
---

# tests/io/sav-read.test.ts

*Test file* · area [[tests]] · 102 lines

> (1) Socius reads every pyreadstat-written fixture exactly as pyreadstat itself reads it. Runs without Python: the expected readings are committed JSON files next to the fixtures.

## Test cases
- **SPSS reader matches pyreadstat on committed fixtures**
  - has fixtures to test
  - reads the same dataset from uncompressed, bytecode and zlib files
  - keeps multi-byte characters split across very long string segments intact
  - maps SPSS dictionary details onto Socius variables
- **SPSS reader matches IBM SPSS I/O on files IBM SPSS I/O wrote**

## Imports
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[sav-reader.ts]] · value
- [[io/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[io/helpers.ts#expectMatchesOracle|expectMatchesOracle()]]
- [[io/helpers.ts#expectSpssioMatches|expectSpssioMatches()]]
- [[sav-reader.ts#readSav|readSav()]]

## Uses
- [[io/helpers.ts#FIXTURES|FIXTURES]]

## Tests
- [[sav-reader.ts]] · import

## Private helpers
fixtures (line 9) · load() (line 11)
