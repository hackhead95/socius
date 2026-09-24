---
id: tests/fuzz/lib/proc-cases.ts
type: test-helper
file: tests/fuzz/lib/proc-cases.ts
area: tests
---

# tests/fuzz/lib/proc-cases.ts

*Test helper* · area [[tests]] · 37 lines

> Deterministic construction of the procedure fuzz cases, shared by the suite and the replay tool.

## Imports
- [[procedure.ts]] · type-only
- [[gen-data.ts]] · value
- [[pairwise.ts]] · value
- [[proc-harness.ts]] · value
- [[rng.ts]] · value

## Imported by
- [[procedures.fuzz.test.ts]] · value
- [[replay.test.ts]] · value

## Tests
- [[procedure.ts]] · import

## Symbols

### rowSeed
*function* · line 8 · exported
- Calls: [[rng.ts#makeRng|makeRng()]]
- Used in: [[procedures.fuzz.test.ts]]

### buildRows
*function* · line 13 · exported
> Pairwise covering rows (dataset state x options) plus random rows; row 0 = defaults on a typical dataset.
- Calls: [[pairwise.ts#pairwise|pairwise()]], [[proc-harness.ts#optionDomain|optionDomain()]], [[rng.ts#fuzzScale|fuzzScale()]], [[rng.ts#makeRng|makeRng()]]
- Used in: [[procedures.fuzz.test.ts]], [[replay.test.ts]]

### buildCase
*function* · line 29 · exported
- Calls: [[gen-data.ts#genDataset|genDataset()]], [[proc-cases.ts#rowSeed|rowSeed()]], [[proc-harness.ts#assignSlots|assignSlots()]], [[proc-harness.ts#resolveOptions|resolveOptions()]], [[rng.ts#makeRng|makeRng()]]
- Used in: [[procedures.fuzz.test.ts]], [[replay.test.ts]]
