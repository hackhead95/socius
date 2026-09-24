---
id: src/procedures/core/crosstabs.ts
type: module
file: src/procedures/core/crosstabs.ts
area: procedures
---

# src/procedures/core/crosstabs.ts

*Module* · area [[procedures]] · 777 lines

> Analyze > Descriptive Statistics > Crosstabs (SPSS CROSSTABS), including layered tables for the elaboration model (a control variable), chi-square tests, exact tests, measures of association, risk estimates, McNemar and Cochran-Mantel-Haenszel statistics.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[stats/crosstabs.ts]] · value
- [[core/common.ts]] · value

## Calls
- [[core/common.ts#apaNum|apaNum()]]
- [[core/common.ts#apaP|apaP()]]
- [[core/common.ts#blank|blank()]]
- [[core/common.ts#categoriesOf|categoriesOf()]]
- [[output.ts#cell|cell()]]
- [[stats/crosstabs.ts#cellStats|cellStats()]]
- [[stats/crosstabs.ts#chiSquareTests|chiSquareTests()]]
- [[stats/crosstabs.ts#cmh|cmh()]]
- [[core/common.ts#fmtN|fmtN()]]
- [[output.ts#hcell|hcell()]]
- [[stats/crosstabs.ts#kappa|kappa()]]
- [[core/common.ts#labelV|labelV()]]
- [[stats/crosstabs.ts#lambdaTau|lambdaTau()]]
- [[stats/crosstabs.ts#margins|margins()]]
- [[stats/crosstabs.ts#mcnemar|mcnemar()]]
- [[stats/crosstabs.ts#nominalMeasures|nominalMeasures()]]
- [[core/common.ts#optBool|optBool()]]
- [[core/common.ts#optStr|optStr()]]
- [[stats/crosstabs.ts#ordinalMeasures|ordinalMeasures()]]
- [[core/common.ts#pcell|pcell()]]
- [[core/common.ts#pct|pct()]]
- [[stats/crosstabs.ts#pearsonFromTable|pearsonFromTable()]]
- [[stats/crosstabs.ts#populated|populated()]]
- [[stats/crosstabs.ts#riskEstimate|riskEstimate()]]
- [[core/common.ts#sameValue|sameValue()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/common.ts#selN|selN()]]
- [[core/common.ts#sigWord|sigWord()]]
- [[stats/crosstabs.ts#spearmanFromTable|spearmanFromTable()]]
- [[core/common.ts#tableBlock|tableBlock()]]
- [[core/common.ts#text|text()]]
- [[core/common.ts#valueText|valueText()]]
- [[core/common.ts#vlabel|vlabel()]]
- [[core/common.ts#vprose|vprose()]]

## Imported by
- [[core/index.ts]] · value

## Private helpers
MAX_CATEGORIES (line 57) · adjustCount() (line 78) · buildPair() (line 84) · crosstabTable() (line 133) · safeCellStats() (line 188) · computeLayer() (line 214) · chiSquareTable() (line 240) · measureRow() (line 300) · symmetricTable() (line 311) · directionalTable() (line 364) · riskTable() (line 415) · cmhBlocks() (line 446) · describeAssociation() (line 499) · clustered (line 714)

## Symbols

### clusteredBar
*function* · line 561
- Calls: [[core/common.ts#valueText|valueText()]], [[core/common.ts#vlabel|vlabel()]], [[stats/crosstabs.ts#margins|margins()]]
- Output: [[Charts/bar|bar]]

### run
*function* · line 586
- Calls: [[core/common.ts#apaNum|apaNum()]], [[core/common.ts#apaP|apaP()]], [[core/common.ts#caseNote|caseNote()]], [[core/common.ts#fmtN|fmtN()]], [[core/common.ts#heading|heading()]], [[core/common.ts#item|item()]], [[core/common.ts#optBool|optBool()]], [[core/common.ts#optStr|optStr()]], [[core/common.ts#tableBlock|tableBlock()]], [[core/common.ts#text|text()]], [[core/common.ts#vars|vars()]], [[core/common.ts#vlabel|vlabel()]], [[core/common.ts#vprose|vprose()]], [[core/crosstabs.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]]
- Uses: [[core/common.ts#COHEN_NOTE|COHEN_NOTE]]
- Output: [[Blocks/chart|chart]]

### crosstabs
*const* · line 716 · exported
- Uses: [[core/crosstabs.ts#run|run()]]
- Used in: [[core/index.ts]]
