---
id: tests/io/sav-write.test.ts
type: test
file: tests/io/sav-write.test.ts
area: tests
---

# tests/io/sav-write.test.ts

*Test file* · area [[tests]] · 179 lines

> (2) Socius writes .sav/.zsav files that pyreadstat reads back identically (needs the Python oracle; skipped with a reason when /opt/oracle/bin/python is absent, e.g. in CI). (3) Socius's own round trip read(write(ds)) is lossless (always runs).

## Test cases
- **SPSS writer: JS round trip (always runs)**
  - re-writes every pyreadstat fixture without loss
  - defaults to bytecode compression and a $FL2 header; zsav gets $FL3
  - generates unique 8-byte short names for long names that share a prefix
  - stores the weight variable in the header
  - keeps SPSS limits and reports what it had to change
  - refuses datasets that cannot be written, with a clear message

## Imports
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[core/types.ts]] · type-only
- [[io/index.ts]] · value
- [[sav-reader.ts]] · value
- [[sav-writer.ts]] · value
- [[datasets.ts]] · value
- [[io/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[datasets.ts#edgeDataset|edgeDataset()]]
- [[datasets.ts#emptyDataset|emptyDataset()]]
- [[io/helpers.ts#expectMatchesOracle|expectMatchesOracle()]]
- [[io/index.ts#exportSav|exportSav()]]
- [[io/index.ts#exportSavWithReport|exportSavWithReport()]]
- [[io/helpers.ts#pyreadstatRead|pyreadstatRead()]]
- [[sav-reader.ts#readSav|readSav()]]
- [[sav-writer.ts#writeSav|writeSav()]]

## Uses
- [[datasets.ts#EXPECTED_DOCS|EXPECTED_DOCS]]
- [[io/helpers.ts#FIXTURES|FIXTURES]]
- [[io/helpers.ts#HAS_ORACLE|HAS_ORACLE]]

## Tests
- [[core/types.ts]] · import
- [[io/index.ts]] · import
- [[sav-reader.ts]] · import
- [[sav-writer.ts]] · import

## Private helpers
MODES (line 14) · expectSameDataset() (line 16)
