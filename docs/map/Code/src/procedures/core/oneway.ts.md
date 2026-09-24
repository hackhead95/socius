---
id: src/procedures/core/oneway.ts
type: module
file: src/procedures/core/oneway.ts
area: procedures
---

# src/procedures/core/oneway.ts

*Module* · area [[procedures]] · 455 lines

> Analyze > Compare Means: Means (SPSS MEANS) and One-Way ANOVA (SPSS ONEWAY).

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[anova.ts]] · value
- [[util.ts]] · value
- [[core/common.ts]] · value

## Calls
- [[core/common.ts#apaNum|apaNum()]]
- [[core/common.ts#apaP|apaP()]]
- [[core/common.ts#blank|blank()]]
- [[core/common.ts#caseNote|caseNote()]]
- [[core/common.ts#categoriesOf|categoriesOf()]]
- [[output.ts#cell|cell()]]
- [[core/common.ts#decFmt|decFmt()]]
- [[util.ts#distinctWeighted|distinctWeighted()]]
- [[core/common.ts#fmtDf|fmtDf()]]
- [[output.ts#hcell|hcell()]]
- [[core/common.ts#item|item()]]
- [[core/common.ts#labelEta2|labelEta2()]]
- [[util.ts#moments|moments()]]
- [[core/common.ts#numericValues|numericValues()]]
- [[anova.ts#oneWayAnova|oneWayAnova()]]
- [[core/common.ts#optBool|optBool()]]
- [[core/common.ts#pcell|pcell()]]
- [[util.ts#percentileHaverage|percentileHaverage()]]
- [[core/common.ts#requireNumeric|requireNumeric()]]
- [[core/common.ts#sameValue|sameValue()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/common.ts#selN|selN()]]
- [[core/common.ts#tableBlock|tableBlock()]]
- [[core/common.ts#text|text()]]
- [[core/common.ts#valueText|valueText()]]
- [[core/common.ts#vars|vars()]]
- [[core/common.ts#vlabel|vlabel()]]
- [[core/common.ts#vprose|vprose()]]

## Uses
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]]

## Imported by
- [[core/index.ts]] · value

## Private helpers
groupBy() (line 48) · MEANS_STATS (line 68) · statValues() (line 80) · runMeans() (line 87) · MAX_GROUPS (line 205) · POST_HOC (line 207)

## Symbols

### means
*const* · line 182 · exported
- Uses: [[oneway.ts]]
- Used in: [[core/index.ts]]

### runOneway
*function* · line 214
- Calls: [[anova.ts#linearTrend|linearTrend()]], [[anova.ts#oneWayAnova|oneWayAnova()]], [[anova.ts#postHoc|postHoc()]], [[anova.ts#tukeySubsets|tukeySubsets()]], [[core/common.ts#apaNum|apaNum()]], [[core/common.ts#apaP|apaP()]], [[core/common.ts#blank|blank()]], [[core/common.ts#caseNote|caseNote()]], [[core/common.ts#decFmt|decFmt()]], [[core/common.ts#fmtDf|fmtDf()]], [[core/common.ts#heading|heading()]], [[core/common.ts#item|item()]], [[core/common.ts#labelEta2|labelEta2()]], [[core/common.ts#listProse|listProse()]], [[core/common.ts#one|one()]], [[core/common.ts#optBool|optBool()]], [[core/common.ts#optNum|optNum()]], [[core/common.ts#pcell|pcell()]], [[core/common.ts#requireNumeric|requireNumeric()]], [[core/common.ts#selN|selN()]], [[core/common.ts#tableBlock|tableBlock()]], [[core/common.ts#text|text()]], [[core/common.ts#vars|vars()]], [[core/common.ts#vlabel|vlabel()]], [[core/common.ts#vprose|vprose()]] … +4
- Uses: [[core/common.ts#COHEN_NOTE|COHEN_NOTE]], [[oneway.ts]]
- Output: [[Blocks/chart|chart]], [[line]]

### onewayAnova
*const* · line 426 · exported
- Uses: [[oneway.ts#runOneway|runOneway()]]
- Used in: [[core/index.ts]]
