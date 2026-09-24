---
id: tests/fuzz/procedures-text.fuzz.test.ts
type: test
file: tests/fuzz/procedures-text.fuzz.test.ts
area: tests
---

# tests/fuzz/procedures-text.fuzz.test.ts

*Test file* · area [[tests]] · 126 lines

> Every procedure over the fuzz generators (the pairwise rows of procedures.fuzz, with other seeds), scanning ALL user-facing text: text blocks of every style, table titles, subtitles, header and stub labels, footnotes, chart titles and labels, the case note, dialog messages and error messages. Nothing may read "NaN", "undefined", "Infinity", "[object Object]", "n/a", a negative zero ("-0.00"), a...

## Test cases
- **all procedure text is clean (every procedure x generated data x options)**
- **tables stay rectangular (header as wide as the body) for every option combination**

## Imports
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[procedures/index.ts]] · value
- [[invariants.ts]] · value
- [[proc-cases.ts]] · value
- [[proc-harness.ts]] · value
- [[rng.ts]] · value
- [[vitest]] · value

## Calls
- [[proc-cases.ts#buildCase|buildCase()]]
- [[proc-cases.ts#buildRows|buildRows()]]
- [[proc-harness.ts#runChecked|runChecked()]]
- [[rng.ts#suiteSeed|suiteSeed()]]
- [[invariants.ts#tables|tables()]]
- [[invariants.ts#tableShapeProblems|tableShapeProblems()]]

## Uses
- [[procedures/index.ts#procedures|procedures]]

## Tests
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[procedures/index.ts]] · import

## Private helpers
SEEDS (line 17) · ONLY (line 18) · BAD (line 20) · NEG_ZERO (line 31) · EMPTY_NAME (line 33) · scan() (line 47) · scanItem() (line 54)
