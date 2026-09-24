---
id: tests/fuzz/procedures-perf.fuzz.test.ts
type: test
file: tests/fuzz/procedures-perf.fuzz.test.ts
area: tests
---

# tests/fuzz/procedures-perf.fuzz.test.ts

*Test file* · area [[tests]] · 56 lines

> Large-input behaviour: every procedure with every checkbox option on (and each select choice) on a 3,000-case dataset. Invariants: finishes within 3 s (the analysis runs on the page's main thread, so a slow run freezes the app), never throws an internal error. Reproduce: FUZZ_SEED=<seed> npx vitest run tests/fuzz/procedures-perf.fuzz.test.ts

## Test cases
  - gate: no new failures (known ones are listed in tests/fuzz/known-issues.ts)

## Imports
- [[procedure.ts]] · value
- [[procedures/index.ts]] · value
- [[findings.ts]] · value
- [[gen-data.ts]] · value
- [[invariants.ts]] · value
- [[proc-harness.ts]] · value
- [[rng.ts]] · value
- [[vitest]] · value

## Calls
- [[proc-harness.ts#assignTypical|assignTypical()]]
- [[findings.ts#Collector|Collector]]
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[invariants.ts#errorProblems|errorProblems()]]
- [[gen-data.ts#genDataset|genDataset()]]
- [[rng.ts#makeRng|makeRng()]]
- [[proc-harness.ts#resolveOptions|resolveOptions()]]
- [[proc-harness.ts#runChecked|runChecked()]]
- [[rng.ts#suiteSeed|suiteSeed()]]

## Uses
- [[procedures/index.ts#procedures|procedures]]

## Tests
- [[procedure.ts]] · import
- [[procedures/index.ts]] · import

## Private helpers
SEED (line 14) · N (line 15) · LIMIT_MS (line 16) · col (line 17) · out() (line 18)
