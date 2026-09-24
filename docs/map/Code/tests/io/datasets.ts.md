---
id: tests/io/datasets.ts
type: test-helper
file: tests/io/datasets.ts
area: tests
---

# tests/io/datasets.ts

*Test helper* · area [[tests]] · 83 lines

> Datasets shared by the SPSS writer tests.

## Imports
- [[core/types.ts]] · type-only, value

## Calls
- [[core/types.ts#makeVariable|makeVariable()]]

## Imported by
- [[sav-spssio.test.ts]] · value
- [[sav-write.test.ts]] · value

## Tests
- [[core/types.ts]] · import

## Private helpers
numVar() (line 7) · strVar() (line 10)

## Symbols

### BN
*const* · line 5 · exported

### edgeDataset
*function* · line 15 · exported
> A dataset exercising every dictionary feature the writer supports.
- Calls: [[core/types.ts#makeDataset|makeDataset()]], [[datasets.ts]]
- Uses: [[datasets.ts#BN|BN]]
- Used in: [[sav-spssio.test.ts]], [[sav-write.test.ts]]

### emptyDataset
*function* · line 75 · exported
- Calls: [[datasets.ts#edgeDataset|edgeDataset()]]
- Used in: [[sav-write.test.ts]]

### EXPECTED_DOCS
*const* · line 82 · exported
> Document lines after the writer wraps them at 80 bytes.
- Uses: [[datasets.ts#BN|BN]]
- Used in: [[sav-write.test.ts]]
