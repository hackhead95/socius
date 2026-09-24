---
id: tests/io/helpers.ts
type: test-helper
file: tests/io/helpers.ts
area: tests
---

# tests/io/helpers.ts

*Test helper* · area [[tests]] · 205 lines

> Shared helpers for the IO tests: compare a Socius Dataset with pyreadstat's reading of a file (the JSON written by scripts/fixtures/dump_sav.py), and run the Python oracle when available.

## Imports
- [[node-child_process|node:child_process]] · value
- [[node-fs|node:fs]] · value
- [[node-os|node:os]] · value
- [[node-path|node:path]] · value
- [[core/types.ts]] · type-only
- [[vitest]] · value

## Imported by
- [[csv.test.ts]] · value
- [[import.test.ts]] · value
- [[sav-malformed.test.ts]] · value
- [[sav-read.test.ts]] · value
- [[sav-spssio.test.ts]] · value
- [[sav-write.test.ts]] · value
- [[xlsx.test.ts]] · value
- [[zip.test.ts]] · value
- [[sample-oracle.test.ts]] · value

## Tests
- [[core/types.ts]] · import

## Types
OracleVar (line 17) · OracleDump (line 30) · CompareOptions (line 90) · SpssioVar (line 139) · SpssioDump (line 152)

## Private helpers
DUMP (line 15) · tmp (line 40) · bound() (line 62) · missingPairs() (line 69) · oracleMissingPairs() (line 76) · labelPairs() (line 82) · oracleLabelPairs() (line 86) · spssBound() (line 159) · normFormat() (line 167)

## Symbols

### PYTHON
*const* · line 10 · exported
- Used in: [[csv.test.ts]], [[sav-spssio.test.ts]], [[xlsx.test.ts]], [[sample-oracle.test.ts]]

### HAS_ORACLE
*const* · line 12 · exported
> The Python oracle is optional (absent in CI). SOCIUS_NO_ORACLE=1 simulates its absence.
- Uses: [[io/helpers.ts#PYTHON|PYTHON]]
- Used in: [[csv.test.ts]], [[sav-spssio.test.ts]], [[sav-write.test.ts]], [[xlsx.test.ts]], [[sample-oracle.test.ts]]

### ROOT
*const* · line 13 · exported
- Used in: [[sav-spssio.test.ts]]

### FIXTURES
*const* · line 14 · exported
- Uses: [[io/helpers.ts#ROOT|ROOT]]
- Used in: [[import.test.ts]], [[sav-malformed.test.ts]], [[sav-read.test.ts]], [[sav-write.test.ts]], [[xlsx.test.ts]], [[zip.test.ts]]

### tempPath
*function* · line 41 · exported
- Uses: [[io/helpers.ts]]
- Used in: [[csv.test.ts]], [[sav-spssio.test.ts]], [[xlsx.test.ts]]

### pyreadstatRead
*function* · line 47 · exported
> Read a .sav file with pyreadstat (through dump_sav.py).
- Calls: [[io/helpers.ts#tempPath|tempPath()]]
- Uses: [[io/helpers.ts#PYTHON|PYTHON]], [[io/helpers.ts]]
- Used in: [[sav-write.test.ts]]

### num
*function* · line 54 · exported

### expectMatchesOracle
*function* · line 98 · exported
> Assert that `ds` holds exactly what pyreadstat read (`o`).
- Calls: [[io/helpers.ts]]
- Used in: [[sav-read.test.ts]], [[sav-write.test.ts]]

### expectSpssioMatches
*function* · line 169 · exported
- Calls: [[io/helpers.ts]]
- Used in: [[sav-read.test.ts]], [[sav-spssio.test.ts]]
