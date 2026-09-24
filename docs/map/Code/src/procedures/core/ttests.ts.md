---
id: src/procedures/core/ttests.ts
type: module
file: src/procedures/core/ttests.ts
area: procedures
---

# src/procedures/core/ttests.ts

*Module* · area [[procedures]] · 434 lines

> Analyze > Compare Means: One-Sample, Independent-Samples and Paired-Samples T Test (SPSS T-TEST).

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[ttest.ts]] · value
- [[core/common.ts]] · value
- [[procedures/text.ts]] · value

## Calls
- [[procedures/text.ts#allFinite|allFinite()]]
- [[core/common.ts#apaNum|apaNum()]]
- [[core/common.ts#apaP|apaP()]]
- [[core/common.ts#caseNote|caseNote()]]
- [[output.ts#cell|cell()]]
- [[procedures/text.ts#confLevel|confLevel()]]
- [[core/common.ts#decFmt|decFmt()]]
- [[core/common.ts#fmtDf|fmtDf()]]
- [[core/common.ts#fmtN|fmtN()]]
- [[output.ts#hcell|hcell()]]
- [[core/common.ts#item|item()]]
- [[core/common.ts#labelD|labelD()]]
- [[core/common.ts#labelR|labelR()]]
- [[procedures/text.ts#levelText|levelText()]]
- [[core/common.ts#numericValues|numericValues()]]
- [[ttest.ts#oneSampleT|oneSampleT()]]
- [[core/common.ts#optBool|optBool()]]
- [[core/common.ts#optNum|optNum()]]
- [[core/common.ts#optStr|optStr()]]
- [[ttest.ts#pairedT|pairedT()]]
- [[core/common.ts#pcell|pcell()]]
- [[core/common.ts#requireNumeric|requireNumeric()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/common.ts#selMissing|selMissing()]]
- [[core/common.ts#selN|selN()]]
- [[core/common.ts#tableBlock|tableBlock()]]
- [[core/common.ts#text|text()]]
- [[core/common.ts#vars|vars()]]
- [[core/common.ts#vlabel|vlabel()]]
- [[core/common.ts#vprose|vprose()]]

## Uses
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]]

## Imported by
- [[core/index.ts]] · value

## Private helpers
confOpt() (line 42) · effectRows() (line 46) · EFFECT_FOOT (line 55) · runOneSample() (line 63) · runPaired() (line 320)

## Symbols

### oneSampleTTest
*const* · line 120 · exported
- Calls: [[procedures/text.ts#ciOption|ciOption()]]
- Uses: [[ttests.ts]]
- Used in: [[core/index.ts]]

### runIndependent
*function* · line 149
> --------------------------------------------------------------------------------------------- Independent samples ---------------------------------------------------------------------------------------------
- Calls: [[core/common.ts#apaNum|apaNum()]], [[core/common.ts#apaP|apaP()]], [[core/common.ts#blank|blank()]], [[core/common.ts#caseNote|caseNote()]], [[core/common.ts#decFmt|decFmt()]], [[core/common.ts#fmtDf|fmtDf()]], [[core/common.ts#fmtN|fmtN()]], [[core/common.ts#item|item()]], [[core/common.ts#labelD|labelD()]], [[core/common.ts#numericValues|numericValues()]], [[core/common.ts#one|one()]], [[core/common.ts#optBool|optBool()]], [[core/common.ts#optNum|optNum()]], [[core/common.ts#optStr|optStr()]], [[core/common.ts#pcell|pcell()]], [[core/common.ts#requireNumeric|requireNumeric()]], [[core/common.ts#selMissing|selMissing()]], [[core/common.ts#selN|selN()]], [[core/common.ts#tableBlock|tableBlock()]], [[core/common.ts#text|text()]], [[core/common.ts#twoGroups|twoGroups()]], [[core/common.ts#vars|vars()]], [[core/common.ts#vlabel|vlabel()]], [[core/common.ts#vprose|vprose()]], [[core/data.ts#selectCases|selectCases()]] … +5
- Uses: [[core/common.ts#COHEN_NOTE|COHEN_NOTE]]
- Output: [[Charts/bar|bar]]

### independentTTest
*const* · line 269 · exported
- Calls: [[procedures/text.ts#ciOption|ciOption()]]
- Uses: [[ttests.ts#runIndependent|runIndependent()]]
- Used in: [[core/index.ts]]

### pairedTTest
*const* · line 405 · exported
- Calls: [[procedures/text.ts#ciOption|ciOption()]]
- Uses: [[ttests.ts]]
- Used in: [[core/index.ts]]
