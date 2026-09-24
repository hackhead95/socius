---
id: "procedure:frequencies"
type: procedure
file: src/procedures/core/frequencies.ts
area: procedures
---

# Frequencies

*Analysis procedure (ProcedureDef)* · defined in [[core/frequencies.ts]] · area [[procedures]]

- **Menu:** Descriptive Statistics
- **Description:** Count how often each answer occurs, with percentages, summary statistics and charts.

> Use for categorical survey items (how many respondents chose each option) and for a first look at any variable. Missing values are listed separately and excluded from the valid percentages, as in SPSS.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Variable(s) | 1 | ∞ |  |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| showTables | checkbox | Display frequency tables | Tables | true |
| order | select | Order categories by | Tables | "ascending" |
| mean | checkbox | Mean | Statistics | false |
| median | checkbox | Median | Statistics | false |
| mode | checkbox | Mode | Statistics | false |
| sum | checkbox | Sum | Statistics | false |
| sd | checkbox | Std. deviation | Statistics | false |
| variance | checkbox | Variance | Statistics | false |
| range | checkbox | Range | Statistics | false |
| min | checkbox | Minimum | Statistics | false |
| max | checkbox | Maximum | Statistics | false |
| seMean | checkbox | S.E. mean | Statistics | false |
| skewness | checkbox | Skewness | Statistics | false |
| kurtosis | checkbox | Kurtosis | Statistics | false |
| quartiles | checkbox | Quartiles | Statistics | false |
| percentiles | text | Percentiles | Statistics | "" |
| chart | select | Chart | Charts | "none" |
| normalCurve | checkbox | Show normal curve on histogram | Charts | true |
| chartValues | select | Chart values | Charts | "frequencies" |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[util.ts#distinctWeighted|distinctWeighted()]] · stats
- [[stats/frequencies.ts#frequencyTable|frequencyTable()]] · stats
- [[output.ts#hcell|hcell()]]
- [[core/data.ts#isUserMissing|isUserMissing()]]
- [[util.ts#kurtosis|kurtosis()]] · stats
- [[util.ts#modes|modes()]] · stats
- [[util.ts#moments|moments()]] · stats
- [[core/types.ts#newId|newId()]]
- [[util.ts#percentileHaverage|percentileHaverage()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[util.ts#skewness|skewness()]] · stats
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[procedures/text.ts#countText|countText()]] · procedure helper
- [[core/common.ts#decFmt|decFmt()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtN|fmtN()]] · procedure helper
- [[chartUtil.ts#histogram|histogram()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#listProse|listProse()]] · procedure helper
- [[chartUtil.ts#niceWidth|niceWidth()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#optStr|optStr()]] · procedure helper
- [[core/common.ts#parseNumberList|parseNumberList()]] · procedure helper
- [[core/common.ts#pct|pct()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
- [[core/common.ts#valueText|valueText()]] · procedure helper
- [[core/common.ts#vars|vars()]] · procedure helper
- [[core/common.ts#vlabel|vlabel()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[core/common.ts#weightVar|weightVar()]] · procedure helper

## Tested by
- [[ai-features.spec.ts]] · menu label
- [[ai-local.spec.ts]] · menu label
- [[commands-smoke-app.spec.ts]] · menu label
- [[errorlog.spec.ts]] · menu label
- [[quant.spec.ts]] · menu label
- [[search.spec.ts]] · menu label
- [[ui-overlays-focus.spec.ts]] · menu label
- [[navigation-audit.test.tsx]] · menu label
- [[palette.test.tsx]] · procedure id
- [[search.test.ts]] · menu label, procedure id
- [[ui-overlays.test.tsx]] · menu label
- [[scenarios.test.ts]] · procedure id
- [[procedures.fuzz.test.ts]] · procedure id
- [[figures.test.tsx]] · menu label
- [[format.test.ts]] · menu label
- [[fuzz-fixes.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[Syntax/FREQUENCIES|FREQUENCIES]]

## Implemented by
- [[core/frequencies.ts#frequencies|frequencies]]

## Configured in dialog
- [[procedure/frequencies|procedure: frequencies]]
