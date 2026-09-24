---
id: tests/fuzz/transforms-expr.fuzz.test.ts
type: test
file: tests/fuzz/transforms-expr.fuzz.test.ts
area: tests
---

# tests/fuzz/transforms-expr.fuzz.test.ts

*Test file* · area [[tests]] · 283 lines

> Grammar-based fuzzing of the COMPUTE expression language and the Compute Variable transform. - Random well-typed expressions (functions, operators, missing values, strings, dates) are rendered with minimal and with full parentheses; both must compile and agree with an independent reference evaluator implementing SPSS missing-value rules (tests/fuzz/lib/gen-expr.ts). - Random token soup must eit...

## Test cases
- **expressions**
  - random well-typed expressions agree with the SPSS reference semantics
  - SPSS precedence and missing-value probes
  - token soup never crashes the parser
- **Compute Variable**
  - random targets, expressions and IF conditions
- **gate**
  - no new failures (known ones are listed in tests/fuzz/known-issues.ts)

## Imports
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[transform/index.ts]] · value
- [[findings.ts]] · value
- [[gen-data.ts]] · value
- [[gen-expr.ts]] · value
- [[invariants.ts]] · value
- [[rng.ts]] · value
- [[vitest]] · value

## Calls
- [[invariants.ts#badWords|badWords()]]
- [[gen-data.ts#cloneDataset|cloneDataset()]]
- [[findings.ts#Collector|Collector]]
- [[evaluate.ts#compileExpression|compileExpression()]]
- [[compute.ts#computeVariable|computeVariable()]]
- [[gen-data.ts#datasetToCode|datasetToCode()]]
- [[gen-data.ts#deepDiff|deepDiff()]]
- [[invariants.ts#errorProblems|errorProblems()]]
- [[gen-expr.ts#exprGenerator|exprGenerator()]]
- [[rng.ts#fuzzScale|fuzzScale()]]
- [[gen-data.ts#genDataset|genDataset()]]
- [[gen-data.ts#keepVariables|keepVariables()]]
- [[rng.ts#makeRng|makeRng()]]
- [[gen-expr.ts#refEval|refEval()]]
- [[gen-expr.ts#render|render()]]
- [[rng.ts#suiteSeed|suiteSeed()]]
- [[gen-expr.ts#tokenSoup|tokenSoup()]]

## Uses
- [[compute.ts#ComputeError|ComputeError]]
- [[expr.ts#ExprError|ExprError]]
- [[gen-expr.ts#UNKNOWN|UNKNOWN]]
- [[useStore]]

## Reads
- [[dataset|useStore.dataset]] · getState

## Calls store actions
- [[mutateDataset()|useStore.mutateDataset()]] · alias
- [[redo()|useStore.redo()]] · getState
- [[setDataset()|useStore.setDataset()]] · alias
- [[undo()|useStore.undo()]] · alias

## Tests
- [[Transforms/compute|compute]] · transform id
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[transform/index.ts]] · import

## Private helpers
SEED (line 19) · col (line 20) · out() (line 21) · fail() (line 23) · usedVars() (line 28) · exprRepro() (line 35) · sameNum() (line 41)
