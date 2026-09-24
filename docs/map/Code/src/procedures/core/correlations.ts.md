---
id: src/procedures/core/correlations.ts
type: module
file: src/procedures/core/correlations.ts
area: procedures
---

# src/procedures/core/correlations.ts

*Module* · area [[procedures]] · 360 lines

> Analyze > Correlate: Bivariate (SPSS CORRELATIONS / NONPAR CORR) and Partial (SPSS PARTIAL CORR).

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[correlation.ts]] · value
- [[util.ts]] · value
- [[core/common.ts]] · value

## Calls
- [[core/common.ts#apaNum|apaNum()]]
- [[core/common.ts#apaP|apaP()]]
- [[core/common.ts#blank|blank()]]
- [[core/common.ts#caseNote|caseNote()]]
- [[output.ts#cell|cell()]]
- [[core/common.ts#fmtN|fmtN()]]
- [[output.ts#hcell|hcell()]]
- [[core/common.ts#item|item()]]
- [[correlation.ts#kendallTauB|kendallTauB()]]
- [[core/common.ts#labelR|labelR()]]
- [[core/common.ts#listProse|listProse()]]
- [[core/common.ts#numericValues|numericValues()]]
- [[core/common.ts#optBool|optBool()]]
- [[core/common.ts#optStr|optStr()]]
- [[correlation.ts#partialCorrelations|partialCorrelations()]]
- [[correlation.ts#pearson|pearson()]]
- [[core/common.ts#requireNumeric|requireNumeric()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/common.ts#selN|selN()]]
- [[correlation.ts#spearman|spearman()]]
- [[core/common.ts#tableBlock|tableBlock()]]
- [[core/common.ts#text|text()]]
- [[core/common.ts#vars|vars()]]
- [[core/common.ts#vlabel|vlabel()]]
- [[core/common.ts#vprose|vprose()]]

## Uses
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]]
- [[core/common.ts#vprose|vprose()]]

## Imported by
- [[core/index.ts]] · value

## Private helpers
METHOD_LABEL (line 37) · compute() (line 43) · runPartial() (line 264)

## Symbols

### runCorrelations
*function* · line 54
- Calls: [[core/common.ts#apaNum|apaNum()]], [[core/common.ts#apaP|apaP()]], [[core/common.ts#blank|blank()]], [[core/common.ts#caseNote|caseNote()]], [[core/common.ts#decFmt|decFmt()]], [[core/common.ts#fmtN|fmtN()]], [[core/common.ts#item|item()]], [[core/common.ts#labelR|labelR()]], [[core/common.ts#numericValues|numericValues()]], [[core/common.ts#optBool|optBool()]], [[core/common.ts#optStr|optStr()]], [[core/common.ts#requireNumeric|requireNumeric()]], [[core/common.ts#selN|selN()]], [[core/common.ts#tableBlock|tableBlock()]], [[core/common.ts#text|text()]], [[core/common.ts#vars|vars()]], [[core/common.ts#vlabel|vlabel()]], [[core/common.ts#vprose|vprose()]], [[core/data.ts#selectCases|selectCases()]], [[correlations.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[util.ts#moments|moments()]]
- Uses: [[core/common.ts#COHEN_NOTE|COHEN_NOTE]], [[correlations.ts]]
- Output: [[Blocks/chart|chart]], [[heatmap]]

### bivariateCorrelations
*const* · line 221 · exported
- Uses: [[correlations.ts#runCorrelations|runCorrelations()]]
- Used in: [[core/index.ts]]

### partialCorrelationsProc
*const* · line 336 · exported
- Uses: [[correlations.ts]]
- Used in: [[core/index.ts]]
