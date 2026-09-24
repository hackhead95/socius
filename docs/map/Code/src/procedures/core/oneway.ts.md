---
id: src/procedures/core/oneway.ts
type: module
file: src/procedures/core/oneway.ts
area: procedures
---

# src/procedures/core/oneway.ts

*Module* · area [[procedures]] · 468 lines

> Analyze > Compare Means: Means (SPSS MEANS) and One-Way ANOVA (SPSS ONEWAY).

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[anova.ts]] · value
- [[util.ts]] · value
- [[core/common.ts]] · value
- [[procedures/text.ts]] · value

## Calls
- [[procedures/text.ts#allFinite|allFinite()]]
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
- [[core/common.ts#selMissing|selMissing()]]
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
groupBy() (line 50) · MEANS_STATS (line 70) · statValues() (line 82) · runMeans() (line 89) · MAX_GROUPS (line 214) · POST_HOC (line 216)

## Symbols

### means
*const* · line 191 · exported
- Uses: [[oneway.ts]]
- Used in: [[core/index.ts]]

### runOneway
*function* · line 223
- Calls: [[anova.ts#linearTrend|linearTrend()]], [[anova.ts#oneWayAnova|oneWayAnova()]], [[anova.ts#postHoc|postHoc()]], [[anova.ts#tukeySubsets|tukeySubsets()]], [[core/common.ts#apaNum|apaNum()]], [[core/common.ts#apaP|apaP()]], [[core/common.ts#blank|blank()]], [[core/common.ts#caseNote|caseNote()]], [[core/common.ts#decFmt|decFmt()]], [[core/common.ts#fmtDf|fmtDf()]], [[core/common.ts#heading|heading()]], [[core/common.ts#item|item()]], [[core/common.ts#labelEta2|labelEta2()]], [[core/common.ts#listProse|listProse()]], [[core/common.ts#one|one()]], [[core/common.ts#optBool|optBool()]], [[core/common.ts#pcell|pcell()]], [[core/common.ts#requireNumeric|requireNumeric()]], [[core/common.ts#selMissing|selMissing()]], [[core/common.ts#selN|selN()]], [[core/common.ts#tableBlock|tableBlock()]], [[core/common.ts#text|text()]], [[core/common.ts#vars|vars()]], [[core/common.ts#vlabel|vlabel()]], [[core/common.ts#vprose|vprose()]] … +6
- Uses: [[core/common.ts#COHEN_NOTE|COHEN_NOTE]], [[oneway.ts]]
- Output: [[Blocks/chart|chart]], [[line]]

### onewayAnova
*const* · line 439 · exported
- Calls: [[procedures/text.ts#ciOption|ciOption()]]
- Uses: [[oneway.ts#runOneway|runOneway()]]
- Used in: [[core/index.ts]]
