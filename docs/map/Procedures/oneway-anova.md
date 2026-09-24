---
id: "procedure:oneway-anova"
type: procedure
file: src/procedures/core/oneway.ts
area: procedures
---

# One-Way ANOVA

*Analysis procedure (ProcedureDef)* · defined in [[oneway.ts]] · area [[procedures]]

- **Menu:** Compare Means
- **Description:** Compare the means of three or more groups (e.g. income by region) and find out which groups differ.

> Check Levene's test first. If variances differ, read the Welch test and use Games-Howell for post hoc comparisons. Tukey is the usual choice when variances are similar.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| dependents | Dependent List | 1 | ∞ | numeric | scale |
| factor | Factor | 1 | 1 |  | nominal, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| descriptives | checkbox | Descriptive | Statistics | true |
| homogeneity | checkbox | Homogeneity of variance test | Statistics | true |
| welch | checkbox | Welch | Statistics | true |
| brownForsythe | checkbox | Brown-Forsythe | Statistics | false |
| effectSizes | checkbox | Estimate effect size | Statistics | true |
| trend | checkbox | Linear trend (polynomial contrast) | Statistics | false |
| tukey | checkbox | Tukey | Post hoc | false |
| bonferroni | checkbox | Bonferroni | Post hoc | false |
| scheffe | checkbox | Scheffe | Post hoc | false |
| gamesHowell | checkbox | Games-Howell (unequal variances) | Post hoc | false |
| subsets | checkbox | Homogeneous subsets (Tukey) | Post hoc | false |
| ciLevel | number | Confidence level (%) | Options | 95 |
| plot | checkbox | Means plot | Options | false |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[anova.ts#linearTrend|linearTrend()]] · stats
- [[core/types.ts#newId|newId()]]
- [[anova.ts#oneWayAnova|oneWayAnova()]] · stats
- [[anova.ts#postHoc|postHoc()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[anova.ts#tukeySubsets|tukeySubsets()]] · stats
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[core/common.ts#categoriesOf|categoriesOf()]] · procedure helper
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]] · procedure helper
- [[core/common.ts#decFmt|decFmt()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtDf|fmtDf()]] · procedure helper
- [[core/common.ts#heading|heading()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#labelEta2|labelEta2()]] · procedure helper
- [[core/common.ts#listProse|listProse()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[core/common.ts#one|one()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#optNum|optNum()]] · procedure helper
- [[core/common.ts#pcell|pcell()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#sameValue|sameValue()]] · procedure helper
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
- [[quant.spec.ts]] · menu label
- [[search.spec.ts]] · menu label
- [[search.test.ts]] · menu label
- [[scenarios.test.ts]] · procedure id
- [[procedures-oracle.fuzz.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[ONEWAY]]

## Implemented by
- [[oneway.ts#onewayAnova|onewayAnova]]

## Configured in dialog
- [[procedure/oneway-anova|procedure: oneway-anova]]
