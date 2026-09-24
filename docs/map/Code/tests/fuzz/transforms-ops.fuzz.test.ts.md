---
id: tests/fuzz/transforms-ops.fuzz.test.ts
type: test
file: tests/fuzz/transforms-ops.fuzz.test.ts
area: tests
---

# tests/fuzz/transforms-ops.fuzz.test.ts

*Test file* · area [[tests]] · 553 lines

> Fuzzing the data transformations: recode (same / different / automatic), visual binning, select cases (filter and delete), sort, weight, aggregate, merge (add cases / add variables), reverse-code, scales, z-scores, count, rank. Invariants for every transform: only its own error class with a plain-English message on bad input; the input dataset is never mutated; the result is structurally valid ...

## Test cases
- **recode**
  - recode into same / different variables and automatic recode
- **binning, select, sort, weight**
  - visual binning
  - select cases (filter and delete)
  - sort and weight
- **aggregate and merge**
  - aggregate matches a reference group-by
  - merge: add cases and add variables
- **derived variables**
  - reverse-code, scales, z-scores, count, rank
- **gate**
  - no new failures (known ones are listed in tests/fuzz/known-issues.ts)

## Imports
- [[core/data.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only, value
- [[transform/index.ts]] · type-only, value
- [[findings.ts]] · value
- [[gen-data.ts]] · value
- [[gen-expr.ts]] · value
- [[invariants.ts]] · value
- [[rng.ts]] · value
- [[vitest]] · value

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[merge.ts#addCases|addCases()]]
- [[merge.ts#addVariables|addVariables()]]
- [[aggregate.ts#aggregate|aggregate()]]
- [[recode.ts#autoRecode|autoRecode()]]
- [[invariants.ts#badWords|badWords()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[gen-data.ts#cloneDataset|cloneDataset()]]
- [[findings.ts#Collector|Collector]]
- [[evaluate.ts#compileExpression|compileExpression()]]
- [[evaluate.ts#conditionMask|conditionMask()]]
- [[derive.ts#countValues|countValues()]]
- [[derive.ts#createScale|createScale()]]
- [[gen-data.ts#datasetToCode|datasetToCode()]]
- [[gen-data.ts#deepDiff|deepDiff()]]
- [[invariants.ts#errorProblems|errorProblems()]]
- [[gen-expr.ts#exprGenerator|exprGenerator()]]
- [[rng.ts#fuzzScale|fuzzScale()]]
- [[gen-data.ts#genDataset|genDataset()]]
- [[core/data.ts#isMissingValue|isMissingValue()]]
- [[core/data.ts#isUserMissing|isUserMissing()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[rng.ts#makeRng|makeRng()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[merge.ts#pairVariables|pairVariables()]]
- [[derive.ts#rankCases|rankCases()]]
- [[recode.ts#recodeDifferent|recodeDifferent()]]
- [[recode.ts#recodeSame|recodeSame()]]
- [[gen-expr.ts#render|render()]]
- [[derive.ts#reverseCode|reverseCode()]]
- [[recode.ts#rulesSyntax|rulesSyntax()]]
- [[cases.ts#selectCasesTransform|selectCasesTransform()]]
- [[cases.ts#selectionValues|selectionValues()]]
- [[cases.ts#sortCases|sortCases()]]
- [[derive.ts#standardize|standardize()]]
- [[rng.ts#suiteSeed|suiteSeed()]]
- [[core/data.ts#validateVarName|validateVarName()]]
- [[binning.ts#visualBin|visualBin()]]
- [[cases.ts#weightCases|weightCases()]]

## Uses
- [[aggregate.ts#AGG_FUNCTIONS|AGG_FUNCTIONS]]
- [[aggregate.ts#AggregateError|AggregateError]]
- [[binning.ts#BinError|BinError]]
- [[cases.ts#CasesError|CasesError]]
- [[compute.ts#ComputeError|ComputeError]]
- [[derive.ts#DeriveError|DeriveError]]
- [[expr.ts#ExprError|ExprError]]
- [[merge.ts#MergeError|MergeError]]
- [[recode.ts#RecodeError|RecodeError]]
- [[useStore]]

## Reads
- [[dataset|useStore.dataset]] · getState

## Calls store actions
- [[mutateDataset()|useStore.mutateDataset()]] · alias
- [[redo()|useStore.redo()]] · getState
- [[setDataset()|useStore.setDataset()]] · alias
- [[undo()|useStore.undo()]] · getState

## Tests
- [[Transforms/aggregate|aggregate]] · transform id
- [[Transforms/count|count]] · transform id
- [[Transforms/rank|rank]] · transform id
- [[core/data.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[transform/index.ts]] · import
- [[Transforms/standardize|standardize]] · transform id

## Private helpers
SEED (line 23) · col (line 24) · out() (line 25) · OWN_ERRORS (line 26) · fail() (line 28) · structureProblems() (line 33) · runT() (line 67) · numVars() (line 109) · strVars() (line 112) · valuesOf() (line 115) · genRules() (line 119) · refRecode() (line 154) · eqv() (line 179) · dsFor() (line 181) · N() (line 186) · compileSafe() (line 538)
