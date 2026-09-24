---
id: tests/fuzz/procedures.fuzz.test.ts
type: test
file: tests/fuzz/procedures.fuzz.test.ts
area: tests
---

# tests/fuzz/procedures.fuzz.test.ts

*Test file* · area [[tests]] · 134 lines

> Combinatorial fuzzing of every ProcedureDef: datasets x UI-valid slot assignments x a pairwise (all-pairs) covering set of option values and dataset states, plus random samples. Invariants per run: the dialog's validation and run() never throw an internal error; messages are plain English; output is plain JSON, tables are rectangular (with spans), no NaN/undefined/ [object Object] in text or re...

## Test cases
- **procedures x data x options (pairwise)**
  - no new failures (known ones are listed in tests/fuzz/known-issues.ts)

## Imports
- [[procedure.ts]] · type-only, value
- [[procedures/index.ts]] · value
- [[findings.ts]] · value
- [[gen-data.ts]] · value
- [[invariants.ts]] · value
- [[proc-cases.ts]] · value
- [[proc-harness.ts]] · value
- [[rng.ts]] · value
- [[vitest]] · value

## Calls
- [[proc-harness.ts#assignSlots|assignSlots()]]
- [[invariants.ts#badWords|badWords()]]
- [[proc-cases.ts#buildCase|buildCase()]]
- [[proc-cases.ts#buildRows|buildRows()]]
- [[proc-harness.ts#checkFilterSubset|checkFilterSubset()]]
- [[proc-harness.ts#checkRun|checkRun()]]
- [[proc-harness.ts#checkUserMissing|checkUserMissing()]]
- [[proc-harness.ts#checkWeightReplication|checkWeightReplication()]]
- [[findings.ts#Collector|Collector]]
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[invariants.ts#errorProblems|errorProblems()]]
- [[gen-data.ts#genDataset|genDataset()]]
- [[proc-harness.ts#invalidOptionValues|invalidOptionValues()]]
- [[rng.ts#makeRng|makeRng()]]
- [[proc-harness.ts#reproCode|reproCode()]]
- [[proc-harness.ts#resolveOptions|resolveOptions()]]
- [[proc-cases.ts#rowSeed|rowSeed()]]
- [[proc-harness.ts#runChecked|runChecked()]]
- [[proc-harness.ts#sameFailure|sameFailure()]]
- [[proc-harness.ts#shrinkCase|shrinkCase()]]
- [[rng.ts#suiteSeed|suiteSeed()]]

## Uses
- [[procedures/index.ts#procedures|procedures]]

## Tests
- [[Procedures/frequencies|Frequencies]] · procedure id
- [[procedure.ts]] · import
- [[procedures/index.ts]] · import

## Private helpers
SEED (line 26) · ONLY (line 27) · col (line 28) · LISTS_MISSING_CODES (line 31) · fuzzProcedure() (line 33)
