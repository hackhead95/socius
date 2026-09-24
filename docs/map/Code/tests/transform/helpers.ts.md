---
id: tests/transform/helpers.ts
type: test-helper
file: tests/transform/helpers.ts
area: tests
---

# tests/transform/helpers.ts

*Test helper* · area [[tests]] · 28 lines

## Imports
- [[core/types.ts]] · value

## Imported by
- [[dataview.test.ts]] · value
- [[expr.test.ts]] · value
- [[project.test.ts]] · value
- [[properties.test.ts]] · value
- [[sample-oracle.test.ts]] · value
- [[transforms.test.ts]] · value

## Tests
- [[core/types.ts]] · import

## Types
ColSpec (line 3)

## Symbols

### ds
*function* · line 6 · exported
> Build a dataset from plain arrays. null -> system-missing (numeric) or '' (string).
- Calls: [[core/types.ts#makeDataset|makeDataset()]], [[core/types.ts#makeVariable|makeVariable()]]
- Used in: [[dataview.test.ts]], [[expr.test.ts]], [[project.test.ts]], [[properties.test.ts]], [[transforms.test.ts]]

### col
*function* · line 19 · exported
- Used in: [[dataview.test.ts]], [[project.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]

### vid
*function* · line 25 · exported
- Used in: [[properties.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]
