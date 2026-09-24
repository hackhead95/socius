---
id: "procedure:ttest-paired"
type: procedure
file: src/procedures/core/ttests.ts
area: procedures
---

# Paired-Samples T Test

*Analysis procedure (ProcedureDef)* · defined in [[ttests.ts]] · area [[procedures]]

- **Menu:** Compare Means
- **Description:** Compare two measurements on the same people (before and after, two related questions).

> Put the first measure of each pair in Variable 1 and the second in Variable 2; the i-th variables of the two lists form pair i.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| first | Variable 1 | 1 | ∞ | numeric | scale |
| second | Variable 2 | 1 | ∞ | numeric | scale |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| effectSizes | checkbox | Estimate effect sizes | Options | true |
| missing | select | Missing values | Options | "analysis" |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[ttest.ts#pairedT|pairedT()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[procedures/text.ts#allFinite|allFinite()]] · procedure helper
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[procedures/text.ts#CI_MAX|CI_MAX]] · procedure helper
- [[procedures/text.ts#CI_MIN|CI_MIN]] · procedure helper
- [[procedures/text.ts#ciOption|ciOption()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]] · procedure helper
- [[procedures/text.ts#confLevel|confLevel()]] · procedure helper
- [[procedures/text.ts#countText|countText()]] · procedure helper
- [[core/common.ts#decFmt|decFmt()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtDf|fmtDf()]] · procedure helper
- [[core/common.ts#fmtN|fmtN()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#labelD|labelD()]] · procedure helper
- [[core/common.ts#labelR|labelR()]] · procedure helper
- [[procedures/text.ts#levelText|levelText()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#optStr|optStr()]] · procedure helper
- [[core/common.ts#pcell|pcell()]] · procedure helper
- [[procedures/text.ts#rangeMessage|rangeMessage()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#selMissing|selMissing()]] · procedure helper
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
- [[fuzz-fixes.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[T-TEST]]

## Implemented by
- [[ttests.ts#pairedTTest|pairedTTest]]

## Configured in dialog
- [[procedure/ttest-paired|procedure: ttest-paired]]
