---
id: src/procedures/core/frequencies.ts
type: module
file: src/procedures/core/frequencies.ts
area: procedures
---

# src/procedures/core/frequencies.ts

*Module* · area [[procedures]] · 409 lines

> Analyze > Descriptive Statistics > Frequencies (SPSS FREQUENCIES).

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[stats/frequencies.ts]] · value
- [[util.ts]] · value
- [[chartUtil.ts]] · value
- [[core/common.ts]] · value

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/common.ts#apaNum|apaNum()]]
- [[core/common.ts#blank|blank()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[output.ts#cell|cell()]]
- [[core/common.ts#decFmt|decFmt()]]
- [[util.ts#distinctWeighted|distinctWeighted()]]
- [[core/common.ts#fmtN|fmtN()]]
- [[stats/frequencies.ts#frequencyTable|frequencyTable()]]
- [[output.ts#hcell|hcell()]]
- [[core/data.ts#isUserMissing|isUserMissing()]]
- [[util.ts#kurtosis|kurtosis()]]
- [[core/common.ts#listProse|listProse()]]
- [[util.ts#modes|modes()]]
- [[util.ts#moments|moments()]]
- [[core/common.ts#optBool|optBool()]]
- [[core/common.ts#pct|pct()]]
- [[util.ts#percentileHaverage|percentileHaverage()]]
- [[util.ts#skewness|skewness()]]
- [[core/common.ts#valueText|valueText()]]
- [[core/common.ts#vlabel|vlabel()]]
- [[core/common.ts#vprose|vprose()]]

## Imported by
- [[core/index.ts]] · value

## Private helpers
collect() (line 41) · freqTableOut() (line 65) · STAT_KEYS (line 117) · statisticsTable() (line 132) · interpret() (line 225) · apaFor() (line 265)

## Symbols

### chartFor
*function* · line 200
- Calls: [[chartUtil.ts#histogram|histogram()]], [[core/common.ts#valueText|valueText()]], [[core/common.ts#vlabel|vlabel()]], [[util.ts#moments|moments()]]
- Output: [[Charts/bar|bar]], [[Charts/histogram|histogram]], [[pie]]

### run
*function* · line 277
- Calls: [[core/common.ts#caseNote|caseNote()]], [[core/common.ts#item|item()]], [[core/common.ts#optBool|optBool()]], [[core/common.ts#optStr|optStr()]], [[core/common.ts#parseNumberList|parseNumberList()]], [[core/common.ts#tableBlock|tableBlock()]], [[core/common.ts#text|text()]], [[core/common.ts#vars|vars()]], [[core/frequencies.ts#chartFor|chartFor()]], [[core/frequencies.ts]]
- Uses: [[core/frequencies.ts]]
- Output: [[Blocks/chart|chart]]

### frequencies
*const* · line 334 · exported
- Calls: [[core/common.ts#parseNumberList|parseNumberList()]]
- Uses: [[core/frequencies.ts#run|run()]]
- Used in: [[core/index.ts]]
