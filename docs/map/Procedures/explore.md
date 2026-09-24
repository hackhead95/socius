---
id: "procedure:explore"
type: procedure
file: src/procedures/core/descriptives.ts
area: procedures
---

# Explore

*Analysis procedure (ProcedureDef)* · defined in [[core/descriptives.ts]] · area [[procedures]]

- **Menu:** Descriptive Statistics
- **Description:** Look closely at a scale variable, overall or by group: confidence intervals, percentiles, normality tests and boxplots.

> Use before a t test or ANOVA to check assumptions: are there outliers, is the distribution roughly normal within each group? Shapiro-Wilk is usually more powerful than Kolmogorov-Smirnov for n up to 5,000.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| dependents | Dependent List | 1 | ∞ | numeric | scale |
| factor | Factor List | 0 | 1 |  | nominal, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| descriptives | checkbox | Descriptives | Statistics | true |
| ciLevel | number | Confidence interval for mean (%) | Statistics | 95 |
| percentiles | checkbox | Percentiles | Statistics | false |
| normality | checkbox | Normality tests | Plots | true |
| boxplot | checkbox | Boxplot | Plots | true |
| histogram | checkbox | Histogram | Plots | false |
| missing | select | Missing values | Options | "listwise" |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[stats/descriptives.ts#boxStats|boxStats()]] · stats
- [[core/data.ts#caseWeights|caseWeights()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[stats/descriptives.ts#DEFAULT_PERCENTILES|DEFAULT_PERCENTILES]] · stats
- [[stats/descriptives.ts#expandIntegerWeights|expandIntegerWeights()]] · stats
- [[stats/descriptives.ts#exploreStats|exploreStats()]] · stats
- [[output.ts#hcell|hcell()]]
- [[stats/descriptives.ts#ksLilliefors|ksLilliefors()]] · stats
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[stats/descriptives.ts#shapiroWilk|shapiroWilk()]] · stats
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[core/common.ts#categoriesOf|categoriesOf()]] · procedure helper
- [[core/common.ts#decFmt|decFmt()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtN|fmtN()]] · procedure helper
- [[chartUtil.ts#histogram|histogram()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[chartUtil.ts#niceWidth|niceWidth()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#optNum|optNum()]] · procedure helper
- [[core/common.ts#optStr|optStr()]] · procedure helper
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
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[EXAMINE]]

## Implemented by
- [[core/descriptives.ts#explore|explore]]

## Configured in dialog
- [[procedure/explore|procedure: explore]]
