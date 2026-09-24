---
id: tests/stats-models/dataset.ts
type: test-helper
file: tests/stats-models/dataset.ts
area: tests
---

# tests/stats-models/dataset.ts

*Test helper* · area [[tests]] · 91 lines

> Synthetic survey Dataset for procedure tests: value labels, user-missing codes, a weight variable and a filter variable, built from the oracle's sociology-like data.

## Imports
- [[core/types.ts]] · value
- [[stats-models/helpers.ts]] · value

## Imported by
- [[stats-models/procedures.test.ts]] · value
- [[separation.test.ts]] · value

## Tests
- [[core/types.ts]] · import

## Types
BuildOpts (line 6)

## Symbols

### buildSurvey
*function* · line 13 · exported
- Calls: [[core/types.ts#makeDataset|makeDataset()]], [[core/types.ts#makeVariable|makeVariable()]]
- Uses: [[stats-models/helpers.ts#socio|socio]]
- Used in: [[stats-models/procedures.test.ts]], [[separation.test.ts]]
