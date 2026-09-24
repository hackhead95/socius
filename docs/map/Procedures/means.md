---
id: "procedure:means"
type: procedure
file: src/procedures/core/oneway.ts
area: procedures
---

# Means

*Analysis procedure (ProcedureDef)* · defined in [[oneway.ts]] · area [[procedures]]

- **Menu:** Compare Means
- **Description:** Compare group means (and other statistics) of scale variables across the categories of one or more grouping variables.

> Add a second layer to break each group down further. Tick the ANOVA option for a significance test and eta squared for the first layer.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| dependents | Dependent List | 1 | ∞ | numeric | scale |
| layer1 | Independent List (Layer 1) | 1 | ∞ |  | nominal, ordinal |
| layer2 | Layer 2 (optional) | 0 | ∞ |  | nominal, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| mean | checkbox | Mean | Cell statistics | true |
| n | checkbox | N | Cell statistics | true |
| sd | checkbox | Std. Deviation | Cell statistics | true |
| median | checkbox | Median | Cell statistics | false |
| se | checkbox | Std. Error of Mean | Cell statistics | false |
| min | checkbox | Minimum | Cell statistics | false |
| max | checkbox | Maximum | Cell statistics | false |
| sum | checkbox | Sum | Cell statistics | false |
| variance | checkbox | Variance | Cell statistics | false |
| anova | checkbox | ANOVA table and eta | Statistics for first layer | false |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[util.ts#distinctWeighted|distinctWeighted()]] · stats
- [[output.ts#hcell|hcell()]]
- [[util.ts#moments|moments()]] · stats
- [[core/types.ts#newId|newId()]]
- [[anova.ts#oneWayAnova|oneWayAnova()]] · stats
- [[util.ts#percentileHaverage|percentileHaverage()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[procedures/text.ts#allFinite|allFinite()]] · procedure helper
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[core/common.ts#categoriesOf|categoriesOf()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]] · procedure helper
- [[procedures/text.ts#countText|countText()]] · procedure helper
- [[core/common.ts#decFmt|decFmt()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtDf|fmtDf()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#labelEta2|labelEta2()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#pcell|pcell()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#sameValue|sameValue()]] · procedure helper
- [[core/common.ts#selMissing|selMissing()]] · procedure helper
- [[core/common.ts#selN|selN()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
- [[core/common.ts#valueKey|valueKey()]] · procedure helper
- [[core/common.ts#valueText|valueText()]] · procedure helper
- [[core/common.ts#vars|vars()]] · procedure helper
- [[core/common.ts#vlabel|vlabel()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[core/common.ts#weightVar|weightVar()]] · procedure helper

## Tested by
- [[fuzz-fixes.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[Syntax/MEANS|MEANS]]

## Implemented by
- [[oneway.ts#means|means]]

## Configured in dialog
- [[procedure/means|procedure: means]]
