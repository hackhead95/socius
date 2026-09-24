---
id: tests/fuzz/lib/gen-data.ts
type: test-helper
file: tests/fuzz/lib/gen-data.ts
area: tests
---

# tests/fuzz/lib/gen-data.ts

*Test helper* · area [[tests]] · 335 lines

> Random SPSS-like datasets for fuzzing: mixed types, measurement levels, value labels, user-missing codes (discrete and ranges), system-missing, constant and all-missing columns, tiny n, huge values, ties, weights (integer / fractional / zero / negative / missing), filters, long and Unicode labels, names at the SPSS 64-byte limit. Everything is driven by an Rng so a seed reproduces the dataset.

## Imports
- [[core/types.ts]] · value
- [[rng.ts]] · type-only

## Imported by
- [[io.fuzz.test.ts]] · value
- [[proc-cases.ts]] · value
- [[proc-harness.ts]] · value
- [[procedures-oracle.fuzz.test.ts]] · value
- [[procedures.fuzz.test.ts]] · value
- [[replay.test.ts]] · value
- [[transforms-expr.fuzz.test.ts]] · value
- [[transforms-ops.fuzz.test.ts]] · value

## Tests
- [[core/types.ts]] · import

## Types
VarKind (line 8) · GenVarMeta (line 25) · GenDataset (line 30) · GenOptions (line 37)

## Private helpers
BENGALI (line 48) · HINDI (line 49) · LATIN (line 50) · LONG_LABEL (line 52) · spssDateSeconds() (line 56) · nameCounter (line 60) · genName() (line 62) · genLabel() (line 75) · missingSpecFor() (line 83) · EXTRA_KINDS (line 200)

## Symbols

### N_CHOICES
*const* · line 54 · exported

### genVariable
*function* · line 89 · exported
- Calls: [[core/types.ts#makeVariable|makeVariable()]], [[gen-data.ts]]
- Uses: [[gen-data.ts]]
- Used in: [[io.fuzz.test.ts]]

### genDataset
*function* · line 202 · exported
- Calls: [[core/types.ts#makeDataset|makeDataset()]], [[gen-data.ts#genVariable|genVariable()]]
- Uses: [[gen-data.ts#N_CHOICES|N_CHOICES]], [[gen-data.ts]]
- Used in: [[io.fuzz.test.ts]], [[proc-cases.ts]], [[procedures-oracle.fuzz.test.ts]], [[procedures.fuzz.test.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### cloneDataset
*function* · line 239 · exported
> ---------- dataset utilities for metamorphic checks ----------
- Used in: [[proc-harness.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### subsetRows
*function* · line 246 · exported
> Keep only the given rows (in order).
- Used in: [[proc-harness.ts]], [[replay.test.ts]]

### replicateByWeight
*function* · line 253 · exported
> Replicate case i w[i] times (integer weights), and drop the weight.
- Calls: [[gen-data.ts#subsetRows|subsetRows()]]
- Used in: [[proc-harness.ts]], [[replay.test.ts]]

### deepDiff
*function* · line 265 · exported
> Stable, typed-array-aware deep equality with NaN == NaN. Returns a path of the first difference or null.
- Used in: [[proc-harness.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### datasetToCode
*function* · line 297 · exported
> Compact TypeScript that rebuilds a (small) dataset: used in minimal reproductions.
- Used in: [[io.fuzz.test.ts]], [[proc-harness.ts]], [[procedures-oracle.fuzz.test.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### keepVariables
*function* · line 326 · exported
> Keep only the listed variables (plus weight/filter).
- Used in: [[proc-harness.ts]], [[procedures-oracle.fuzz.test.ts]], [[transforms-expr.fuzz.test.ts]]
