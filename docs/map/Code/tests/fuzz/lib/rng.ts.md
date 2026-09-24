---
id: tests/fuzz/lib/rng.ts
type: test-helper
file: tests/fuzz/lib/rng.ts
area: tests
---

# tests/fuzz/lib/rng.ts

*Test helper* · area [[tests]] · 69 lines

> Seeded, reproducible randomness for the fuzz suites (no dependencies). Every suite prints its seed; re-run a single failure with FUZZ_SEED=<seed>.

## Imported by
- [[io.fuzz.test.ts]] · value
- [[gen-data.ts]] · type-only
- [[gen-expr.ts]] · type-only
- [[pairwise.ts]] · type-only
- [[proc-cases.ts]] · value
- [[proc-harness.ts]] · type-only
- [[procedures-oracle.fuzz.test.ts]] · value
- [[procedures.fuzz.test.ts]] · value
- [[replay.test.ts]] · value
- [[transforms-expr.fuzz.test.ts]] · value
- [[transforms-ops.fuzz.test.ts]] · value

## Types
Rng (line 4)

## Private helpers
hashString() (line 16)

## Symbols

### makeRng
*function* · line 26 · exported
> mulberry32
- Calls: [[rng.ts]]
- Used in: [[io.fuzz.test.ts]], [[proc-cases.ts]], [[procedures-oracle.fuzz.test.ts]], [[procedures.fuzz.test.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### suiteSeed
*function* · line 59 · exported
> Base seed for a suite: FUZZ_SEED env overrides the fixed default (so CI is reproducible).
- Used in: [[io.fuzz.test.ts]], [[procedures-oracle.fuzz.test.ts]], [[procedures.fuzz.test.ts]], [[replay.test.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### fuzzScale
*function* · line 65 · exported
> Iteration multiplier: FUZZ_SCALE=5 runs five times as many random cases.
- Used in: [[io.fuzz.test.ts]], [[proc-cases.ts]], [[procedures-oracle.fuzz.test.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]
