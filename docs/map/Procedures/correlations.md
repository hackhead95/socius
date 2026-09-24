---
id: "procedure:correlations"
type: procedure
file: src/procedures/core/correlations.ts
area: procedures
---

# Bivariate Correlations

*Analysis procedure (ProcedureDef)* · defined in [[correlations.ts]] · area [[procedures]]

- **Menu:** Correlate
- **Description:** Measure how strongly pairs of variables move together: Pearson's r, Spearman's rho, Kendall's tau-b.

> Pairwise deletion (the SPSS default) uses every case that has both values of a pair, so N can differ between cells of the matrix.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Variables | 2 | ∞ | numeric | scale, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| pearson | checkbox | Pearson | Correlation coefficients | true |
| kendall | checkbox | Kendall's tau-b | Correlation coefficients | false |
| spearman | checkbox | Spearman | Correlation coefficients | false |
| tails | select | Test of significance |  | "two" |
| flag | checkbox | Flag significant correlations |  | true |
| descriptives | checkbox | Means and standard deviations | Options | false |
| missing | select | Missing values | Options | "pairwise" |
| heatmap | checkbox | Heatmap of the correlation matrix | Options | false |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[correlation.ts#kendallTauB|kendallTauB()]] · stats
- [[util.ts#moments|moments()]] · stats
- [[core/types.ts#newId|newId()]]
- [[correlation.ts#pearson|pearson()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[correlation.ts#spearman|spearman()]] · stats
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]] · procedure helper
- [[procedures/text.ts#countText|countText()]] · procedure helper
- [[core/common.ts#decFmt|decFmt()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtN|fmtN()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#labelR|labelR()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#optStr|optStr()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#selMissing|selMissing()]] · procedure helper
- [[core/common.ts#selN|selN()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
- [[core/common.ts#vars|vars()]] · procedure helper
- [[core/common.ts#vlabel|vlabel()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[core/common.ts#weightVar|weightVar()]] · procedure helper

## Tested by
- [[quant.spec.ts]] · menu label
- [[search.test.ts]] · menu label
- [[scenarios.test.ts]] · procedure id
- [[findings-repro.test.ts]] · procedure id
- [[procedures-oracle.fuzz.test.ts]] · procedure id
- [[fuzz-fixes.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[Syntax/CORRELATIONS|CORRELATIONS]]
- [[NONPAR CORR]]

## Implemented by
- [[correlations.ts#bivariateCorrelations|bivariateCorrelations]]

## Configured in dialog
- [[procedure/correlations|procedure: correlations]]
