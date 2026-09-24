---
id: tests/transform/sample-oracle.test.ts
type: test
file: tests/transform/sample-oracle.test.ts
area: tests
---

# tests/transform/sample-oracle.test.ts

*Test file* · area [[tests]] · 145 lines

> Transformations on the real sample survey, checked against pandas (the Python oracle reads the same .sav with pyreadstat, which turns declared user-missing codes into NaN, as SPSS does in transformations). Skipped when the oracle is not installed.

## Test cases
  - compute: MEAN.3, SUM, RND, XDATE and IF
  - compute: string functions
  - recode into different: LOWEST thru 29, 30 thru 44, 45 thru HIGHEST, ELSE SYSMIS
  - automatic recode of interviewer, reverse-coding trust3, scale with alpha
  - standardize, rank, aggregate, select, count, binning

## Imports
- [[node-child_process|node:child_process]] · value
- [[node-fs|node:fs]] · value
- [[node-url|node:url]] · value
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[io/index.ts]] · value
- [[stats/reliability.ts]] · value
- [[transform/index.ts]] · value
- [[io/helpers.ts]] · value
- [[transform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[aggregate.ts#aggregate|aggregate()]]
- [[recode.ts#autoRecode|autoRecode()]]
- [[transform/helpers.ts#col|col()]]
- [[compute.ts#computeVariable|computeVariable()]]
- [[derive.ts#countValues|countValues()]]
- [[derive.ts#createScale|createScale()]]
- [[io/index.ts#importFile|importFile()]]
- [[core/data.ts#isMissingValue|isMissingValue()]]
- [[derive.ts#rankCases|rankCases()]]
- [[recode.ts#recodeDifferent|recodeDifferent()]]
- [[stats/reliability.ts#reliabilityAnalysis|reliabilityAnalysis()]]
- [[derive.ts#reverseCode|reverseCode()]]
- [[cases.ts#selectCasesTransform|selectCasesTransform()]]
- [[derive.ts#standardize|standardize()]]
- [[transform/helpers.ts#vid|vid()]]
- [[binning.ts#visualBin|visualBin()]]

## Uses
- [[io/helpers.ts#HAS_ORACLE|HAS_ORACLE]]
- [[io/helpers.ts#PYTHON|PYTHON]]

## Tests
- [[Transforms/rank|rank]] · transform id
- [[core/data.ts]] · import
- [[core/types.ts]] · import
- [[io/index.ts]] · import
- [[stats/reliability.ts]] · import
- [[transform/index.ts]] · import

## Private helpers
SAV (line 18) · ORACLE (line 20) · close() (line 53)
