---
id: tests/stats-models/helpers.ts
type: test-helper
file: tests/stats-models/helpers.ts
area: tests
---

# tests/stats-models/helpers.ts

*Test helper* · area [[tests]] · 77 lines

## Imports
- `tests/stats-models/fixtures/socio_data.json` · value
- [[vitest]] · value

## Imported by
- [[dataset.ts]] · value
- [[logistic.test.ts]] · value
- [[matrix.test.ts]] · value
- [[stats-models/procedures.test.ts]] · value
- [[regression.test.ts]] · value
- [[stats-models/scale.test.ts]] · value
- [[separation.test.ts]] · value

## Types
SocioData (line 4)

## Symbols

### socio
*const* · line 5 · exported
- Used in: [[dataset.ts]], [[stats-models/procedures.test.ts]]

### errorLog
*const* · line 8 · exported
> Largest relative error observed across all comparisons in this test run (reported by the suite).

### close
*function* · line 18 · exported
> Assert |a - e| <= rel * |e| + abs. Records the largest relative error for reporting.
- Uses: [[stats-models/helpers.ts#errorLog|errorLog]]
- Used in: [[logistic.test.ts]], [[matrix.test.ts]], [[stats-models/procedures.test.ts]], [[regression.test.ts]], [[stats-models/scale.test.ts]], [[separation.test.ts]]

### closeAll
*function* · line 32 · exported
- Calls: [[stats-models/helpers.ts#close|close()]]
- Used in: [[logistic.test.ts]], [[matrix.test.ts]], [[stats-models/procedures.test.ts]], [[regression.test.ts]], [[stats-models/scale.test.ts]], [[separation.test.ts]]

### col
*function* · line 37 · exported
- Uses: [[stats-models/helpers.ts#socio|socio]]
- Used in: [[logistic.test.ts]], [[regression.test.ts]], [[stats-models/scale.test.ts]], [[separation.test.ts]]

### ones
*function* · line 43 · exported
- Used in: [[logistic.test.ts]], [[regression.test.ts]], [[stats-models/scale.test.ts]], [[separation.test.ts]]

### dummyCols
*function* · line 48 · exported
> Dummy columns for the given category values (reference excluded).
- Used in: [[logistic.test.ts]], [[regression.test.ts]], [[separation.test.ts]]

### closeLoadings
*function* · line 57 · exported
> Compare two loading matrices up to column reflection and column permutation. Each expected column is matched with the actual column of the same index after optional sign flip, or with any column (greedy) when `permute` is true.
- Calls: [[stats-models/helpers.ts#close|close()]]
- Used in: [[stats-models/scale.test.ts]]
