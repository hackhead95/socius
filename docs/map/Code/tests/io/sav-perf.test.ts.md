---
id: tests/io/sav-perf.test.ts
type: test
file: tests/io/sav-perf.test.ts
area: tests
---

# tests/io/sav-perf.test.ts

*Test file* · area [[tests]] · 63 lines

> Performance: a 100,000 case x 200 variable file (generated at test time, never committed) must load in a few seconds.

## Test cases
- **SPSS reader performance**
  - reads 100k cases x 200 variables in a few seconds (bytecode and zsav)

## Imports
- [[core/types.ts]] · type-only, value
- [[sav-reader.ts]] · value
- [[sav-writer.ts]] · value
- [[vitest]] · value

## Calls
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[sav-reader.ts#readSav|readSav()]]
- [[sav-writer.ts#writeSav|writeSav()]]

## Tests
- [[core/types.ts]] · import
- [[sav-reader.ts]] · import
- [[sav-writer.ts]] · import

## Private helpers
N (line 9) · NUMERIC (line 10) · STRINGS (line 11) · bigDataset() (line 13)
