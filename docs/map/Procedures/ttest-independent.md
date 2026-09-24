---
id: "procedure:ttest-independent"
type: procedure
file: src/procedures/core/ttests.ts
area: procedures
---

# Independent-Samples T Test

*Analysis procedure (ProcedureDef)* · defined in [[ttests.ts]] · area [[procedures]]

- **Menu:** Compare Means
- **Description:** Compare the means of two groups (e.g. women and men) on a scale variable.

> Levene's test tells you which row to read: if it is significant, the variances differ and the Welch row (equal variances not assumed) is the right one.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Test Variable(s) | 1 | ∞ | numeric | scale |
| group | Grouping Variable | 1 | 1 |  |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| defineBy | select | Define groups by |  | "values" |
| groups | groupPair | Groups |  |  |
| cutPoint | number | Cut point |  | 0 |
| ciLevel | number | Confidence interval (%) | Options | 95 |
| effectSizes | checkbox | Estimate effect sizes | Options | true |
| chart | checkbox | Chart of means with 95% error bars | Options | false |
| missing | select | Missing values | Options | "analysis" |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[ttest.ts#independentT|independentT()]] · stats
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[core/common.ts#coerceValue|coerceValue()]] · procedure helper
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
- [[core/common.ts#one|one()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#optNum|optNum()]] · procedure helper
- [[core/common.ts#optStr|optStr()]] · procedure helper
- [[core/common.ts#pcell|pcell()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#sameValue|sameValue()]] · procedure helper
- [[core/common.ts#selN|selN()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#syntaxValue|syntaxValue()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
- [[core/common.ts#twoGroups|twoGroups()]] · procedure helper
- [[core/common.ts#valueText|valueText()]] · procedure helper
- [[core/common.ts#vars|vars()]] · procedure helper
- [[core/common.ts#vlabel|vlabel()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[core/common.ts#weightVar|weightVar()]] · procedure helper

## Tested by
- [[assistant.spec.ts]] · menu label
- [[quant.spec.ts]] · menu label
- [[search.spec.ts]] · menu label
- [[search.test.ts]] · menu label
- [[scenarios.test.ts]] · procedure id
- [[procedures-oracle.fuzz.test.ts]] · procedure id
- [[dialog.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[T-TEST]]

## Implemented by
- [[ttests.ts#independentTTest|independentTTest]]

## Configured in dialog
- [[procedure/ttest-independent|procedure: ttest-independent]]
