---
id: "procedure:ttest-one-sample"
type: procedure
file: src/procedures/core/ttests.ts
area: procedures
---

# One-Sample T Test

*Analysis procedure (ProcedureDef)* · defined in [[ttests.ts]] · area [[procedures]]

- **Menu:** Compare Means
- **Description:** Test whether the mean of a variable differs from a fixed value (a norm, a scale midpoint, a national figure).

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Test Variable(s) | 1 | ∞ | numeric | scale |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| testValue | number | Test value |  | 0 |
| ciLevel | number | Confidence interval (%) | Options | 95 |
| effectSizes | checkbox | Estimate effect sizes | Options | true |
| missing | select | Missing values | Options | "analysis" |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[ttest.ts#oneSampleT|oneSampleT()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]] · procedure helper
- [[core/common.ts#decFmt|decFmt()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtDf|fmtDf()]] · procedure helper
- [[core/common.ts#fmtN|fmtN()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#labelD|labelD()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#optNum|optNum()]] · procedure helper
- [[core/common.ts#optStr|optStr()]] · procedure helper
- [[core/common.ts#pcell|pcell()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#selN|selN()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
- [[core/common.ts#vars|vars()]] · procedure helper
- [[core/common.ts#vlabel|vlabel()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[core/common.ts#weightVar|weightVar()]] · procedure helper

## Tested by
- [[search.test.ts]] · menu label
- [[procedures-oracle.fuzz.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[T-TEST]]

## Implemented by
- [[ttests.ts#oneSampleTTest|oneSampleTTest]]

## Configured in dialog
- [[procedure/ttest-one-sample|procedure: ttest-one-sample]]
