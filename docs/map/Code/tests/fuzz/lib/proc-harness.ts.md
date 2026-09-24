---
id: tests/fuzz/lib/proc-harness.ts
type: test-helper
file: tests/fuzz/lib/proc-harness.ts
area: tests
---

# tests/fuzz/lib/proc-harness.ts

*Test helper* · area [[tests]] · 331 lines

> Harness for fuzzing ProcedureDefs: option domains, slot assignment, one checked run, metamorphic comparisons (weights, filter, user-missing) and a shrinker that produces a minimal reproduction.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only, value
- [[core/types.ts]] · type-only
- [[varUtils.ts]] · value
- [[findings.ts]] · type-only, value
- [[gen-data.ts]] · value
- [[invariants.ts]] · value
- [[rng.ts]] · type-only

## Imported by
- [[proc-cases.ts]] · value
- [[procedures-perf.fuzz.test.ts]] · value
- [[procedures-text.fuzz.test.ts]] · value
- [[procedures.fuzz.test.ts]] · value
- [[replay.test.ts]] · value

## Tests
- [[core/data.ts]] · import
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[varUtils.ts]] · import

## Types
SlotChoice (line 53) · RunOutcome (line 134) · CaseSpec (line 160)

## Symbols

### PAIR_MARKERS
*const* · line 15 · exported

### optionDomain
*function* · line 18 · exported
> Values to cover for one option (pairwise parameter domain).
- Uses: [[proc-harness.ts#PAIR_MARKERS|PAIR_MARKERS]]
- Used in: [[proc-cases.ts]]

### invalidOptionValues
*function* · line 43 · exported
> Invalid option values: the dialog must reject them with a readable message (never run).
- Used in: [[procedures.fuzz.test.ts]]

### assignSlots
*function* · line 59 · exported
> A random but UI-valid slot assignment (types respected, counts within min..max).
- Used in: [[proc-cases.ts]], [[procedures.fuzz.test.ts]]

### assignTypical
*function* · line 88 · exported
> A realistic assignment (what a researcher would pick): measure-matching, well-behaved variables only.
- Used in: [[procedures-perf.fuzz.test.ts]]

### resolveOptions
*function* · line 108 · exported
> Resolve group-pair markers to concrete values from the data.
- Calls: [[core/data.ts#distinctValues|distinctValues()]], [[procedure.ts#defaultOptions|defaultOptions()]]
- Used in: [[proc-cases.ts]], [[procedures-perf.fuzz.test.ts]], [[procedures.fuzz.test.ts]]

### runChecked
*function* · line 143 · exported
> Validate like the dialog, then run; never throws.
- Calls: [[varUtils.ts#validate|validate()]]
- Used in: [[procedures-perf.fuzz.test.ts]], [[procedures-text.fuzz.test.ts]], [[procedures.fuzz.test.ts]], [[replay.test.ts]]

### checkRun
*function* · line 169 · exported
> Invariant failures for one run (not metamorphic).
- Calls: [[gen-data.ts#cloneDataset|cloneDataset()]], [[gen-data.ts#deepDiff|deepDiff()]], [[invariants.ts#badWords|badWords()]], [[invariants.ts#errorProblems|errorProblems()]], [[invariants.ts#outputProblems|outputProblems()]], [[proc-harness.ts#runChecked|runChecked()]]
- Used in: [[procedures.fuzz.test.ts]]

### checkWeightReplication
*function* · line 198 · exported
> Integer weights must equal replicated cases.
- Calls: [[gen-data.ts#replicateByWeight|replicateByWeight()]], [[invariants.ts#compareTables|compareTables()]], [[proc-harness.ts#runChecked|runChecked()]]
- Used in: [[procedures.fuzz.test.ts]]

### checkFilterSubset
*function* · line 213 · exported
> Filtering must equal physically removing the filtered-out cases.
- Calls: [[gen-data.ts#subsetRows|subsetRows()]], [[invariants.ts#compareTables|compareTables()]], [[proc-harness.ts#runChecked|runChecked()]]
- Used in: [[procedures.fuzz.test.ts]]

### userMissingAsSysmis
*function* · line 228 · exported
> Declared user-missing numeric codes must behave exactly like system-missing.
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]]
- Used in: [[replay.test.ts]]

### checkUserMissing
*function* · line 241 · exported
- Calls: [[gen-data.ts#deepDiff|deepDiff()]], [[invariants.ts#compareTables|compareTables()]], [[proc-harness.ts#runChecked|runChecked()]], [[proc-harness.ts#userMissingAsSysmis|userMissingAsSysmis()]]
- Used in: [[procedures.fuzz.test.ts]]

### shrinkCase
*function* · line 257 · exported
> Minimise a failing case: drop unused variables, reset options to defaults, drop cases. `fails` must return true while the (same) failure still occurs.
- Calls: [[gen-data.ts#keepVariables|keepVariables()]], [[gen-data.ts#subsetRows|subsetRows()]], [[procedure.ts#defaultOptions|defaultOptions()]]
- Used in: [[procedures.fuzz.test.ts]]

### reproCode
*function* · line 311 · exported
> Code that reproduces a case (paste into a vitest file).
- Calls: [[gen-data.ts#datasetToCode|datasetToCode()]], [[procedure.ts#defaultOptions|defaultOptions()]]
- Used in: [[procedures.fuzz.test.ts]], [[replay.test.ts]]

### sameFailure
*function* · line 325 · exported
> Helper to know whether a list of check failures still contains the given signature.
- Calls: [[findings.ts#signature|signature()]]
- Used in: [[procedures.fuzz.test.ts]]
