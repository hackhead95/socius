---
id: tests/fuzz/replay.test.ts
type: test
file: tests/fuzz/replay.test.ts
area: tests
---

# tests/fuzz/replay.test.ts

*Test file* · area [[tests]] · 38 lines

> Replay one procedure fuzz case and print its output (debug tool; skipped unless FUZZ_REPLAY is set). FUZZ_REPLAY=crosstabs:2 [FUZZ_SEED=20260924] [FUZZ_VARIANT=weight|filter|missing] npx vitest run tests/fuzz/replay.test.ts

## Imports
- [[core/types.ts]] · type-only
- [[exportText.ts]] · value
- [[procedures/index.ts]] · value
- [[gen-data.ts]] · value
- [[proc-cases.ts]] · value
- [[proc-harness.ts]] · value
- [[rng.ts]] · value
- [[vitest]] · value

## Calls
- [[proc-cases.ts#buildCase|buildCase()]]
- [[proc-cases.ts#buildRows|buildRows()]]
- [[procedures/index.ts#getProcedure|getProcedure()]]
- [[exportText.ts#itemToText|itemToText()]]
- [[gen-data.ts#replicateByWeight|replicateByWeight()]]
- [[proc-harness.ts#reproCode|reproCode()]]
- [[proc-harness.ts#runChecked|runChecked()]]
- [[gen-data.ts#subsetRows|subsetRows()]]
- [[rng.ts#suiteSeed|suiteSeed()]]
- [[proc-harness.ts#userMissingAsSysmis|userMissingAsSysmis()]]

## Tests
- [[core/types.ts]] · import
- [[exportText.ts]] · import
- [[procedures/index.ts]] · import

## Private helpers
target (line 12)
