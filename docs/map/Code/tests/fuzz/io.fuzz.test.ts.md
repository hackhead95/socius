---
id: tests/fuzz/io.fuzz.test.ts
type: test
file: tests/fuzz/io.fuzz.test.ts
area: tests
---

# tests/fuzz/io.fuzz.test.ts

*Test file* · area [[tests]] · 370 lines

> IO round trips and robustness. - Random datasets -> exportSav (none / bytecode / zsav, little and big endian) -> importFile -> equal dictionary and data (differences allowed only when the export report warns about them). - A random subset is cross-checked with pyreadstat (Python oracle, skipped when absent). - CSV and XLSX round trips keep names and values (XLSX also the dictionary via its Vari...

## Test cases
- **.sav round trips**
  - export -> import is lossless across compression modes and byte orders
- **CSV and XLSX round trips**
  - CSV keeps names and values; XLSX also the dictionary
- **corrupted input**
  - truncated, bit-flipped and header-mangled .sav files
  - garbage CSV / XLSX / unknown files give readable errors
- **gate**
  - no new failures (known ones are listed in tests/fuzz/known-issues.ts)

## Imports
- [[node-child_process|node:child_process]] · value
- [[node-fs|node:fs]] · value
- [[node-os|node:os]] · value
- [[node-path|node:path]] · value
- [[core/types.ts]] · value
- [[io/index.ts]] · value
- [[sav-reader.ts]] · value
- [[sav-writer.ts]] · value
- [[findings.ts]] · value
- [[gen-data.ts]] · value
- [[invariants.ts]] · value
- [[rng.ts]] · value
- [[vitest]] · value

## Calls
- [[invariants.ts#badWords|badWords()]]
- [[findings.ts#Collector|Collector]]
- [[gen-data.ts#datasetToCode|datasetToCode()]]
- [[invariants.ts#errorProblems|errorProblems()]]
- [[io/index.ts#exportCsv|exportCsv()]]
- [[io/index.ts#exportSavWithReport|exportSavWithReport()]]
- [[io/index.ts#exportXlsx|exportXlsx()]]
- [[rng.ts#fuzzScale|fuzzScale()]]
- [[gen-data.ts#genDataset|genDataset()]]
- [[io/index.ts#importFile|importFile()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[rng.ts#makeRng|makeRng()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[rng.ts#suiteSeed|suiteSeed()]]
- [[sav-writer.ts#writeSav|writeSav()]]

## Uses
- [[gen-data.ts#genVariable|genVariable()]]
- [[sav-reader.ts#SavFormatError|SavFormatError]]

## Tests
- [[core/types.ts]] · import
- [[io/index.ts]] · import
- [[sav-reader.ts]] · import
- [[sav-writer.ts]] · import

## Private helpers
SEED (line 23) · col (line 24) · out() (line 25) · PYTHON (line 26) · HAS_ORACLE (line 27) · DUMP (line 28) · N() (line 29) · fail() (line 31) · utf8() (line 37) · ioDataset() (line 39) · sameNum() (line 87) · diffDatasets() (line 93) · explained() (line 137) · reproFor() (line 146)
