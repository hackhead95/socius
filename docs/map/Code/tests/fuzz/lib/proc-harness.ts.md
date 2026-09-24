---
id: tests/fuzz/lib/proc-harness.ts
type: test-helper
file: tests/fuzz/lib/proc-harness.ts
area: tests
---

# tests/fuzz/lib/proc-harness.ts

*Test helper* · area [[tests]] · 310 lines

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
- [[procedures.fuzz.test.ts]] · value
- [[replay.test.ts]] · value

## Tests
- [[core/data.ts]] · import
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[varUtils.ts]] · import

## Types
SlotChoice (line 53) · RunOutcome (line 114) · CaseSpec (line 140)

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

### resolveOptions
*function* · line 88 · exported
> Resolve group-pair markers to concrete values from the data.
- Calls: [[core/data.ts#distinctValues|distinctValues()]], [[procedure.ts#defaultOptions|defaultOptions()]]
- Used in: [[proc-cases.ts]], [[procedures.fuzz.test.ts]]

### runChecked
*function* · line 123 · exported
> Validate like the dialog, then run; never throws.
- Calls: [[varUtils.ts#validate|validate()]]
- Used in: [[procedures.fuzz.test.ts]], [[replay.test.ts]]

### checkRun
*function* · line 149 · exported
> Invariant failures for one run (not metamorphic).
- Calls: [[gen-data.ts#cloneDataset|cloneDataset()]], [[gen-data.ts#deepDiff|deepDiff()]], [[invariants.ts#badWords|badWords()]], [[invariants.ts#errorProblems|errorProblems()]], [[invariants.ts#outputProblems|outputProblems()]], [[proc-harness.ts#runChecked|runChecked()]]
- Used in: [[procedures.fuzz.test.ts]]

### checkWeightReplication
*function* · line 178 · exported
> Integer weights must equal replicated cases.
- Calls: [[gen-data.ts#replicateByWeight|replicateByWeight()]], [[invariants.ts#compareTables|compareTables()]], [[proc-harness.ts#runChecked|runChecked()]]
- Used in: [[procedures.fuzz.test.ts]]

### checkFilterSubset
*function* · line 192 · exported
> Filtering must equal physically removing the filtered-out cases.
- Calls: [[gen-data.ts#subsetRows|subsetRows()]], [[invariants.ts#compareTables|compareTables()]], [[proc-harness.ts#runChecked|runChecked()]]
- Used in: [[procedures.fuzz.test.ts]]

### userMissingAsSysmis
*function* · line 207 · exported
> Declared user-missing numeric codes must behave exactly like system-missing.
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]]
- Used in: [[replay.test.ts]]

### checkUserMissing
*function* · line 220 · exported
- Calls: [[gen-data.ts#deepDiff|deepDiff()]], [[invariants.ts#compareTables|compareTables()]], [[proc-harness.ts#runChecked|runChecked()]], [[proc-harness.ts#userMissingAsSysmis|userMissingAsSysmis()]]
- Used in: [[procedures.fuzz.test.ts]]

### shrinkCase
*function* · line 236 · exported
> Minimise a failing case: drop unused variables, reset options to defaults, drop cases. `fails` must return true while the (same) failure still occurs.
- Calls: [[gen-data.ts#keepVariables|keepVariables()]], [[gen-data.ts#subsetRows|subsetRows()]], [[procedure.ts#defaultOptions|defaultOptions()]]
- Used in: [[procedures.fuzz.test.ts]]

### reproCode
*function* · line 290 · exported
> Code that reproduces a case (paste into a vitest file).
- Calls: [[gen-data.ts#datasetToCode|datasetToCode()]], [[procedure.ts#defaultOptions|defaultOptions()]]
- Used in: [[procedures.fuzz.test.ts]], [[replay.test.ts]]

### sameFailure
*function* · line 304 · exported
> Helper to know whether a list of check failures still contains the given signature.
- Calls: [[findings.ts#signature|signature()]]
- Used in: [[procedures.fuzz.test.ts]]
