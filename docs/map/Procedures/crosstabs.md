---
id: "procedure:crosstabs"
type: procedure
file: src/procedures/core/crosstabs.ts
area: procedures
---

# Crosstabs

*Analysis procedure (ProcedureDef)* · defined in [[core/crosstabs.ts]] · area [[procedures]]

- **Menu:** Descriptive Statistics
- **Description:** Cross-tabulate two categorical variables, test whether they are associated, and add a control variable to elaborate the relationship.

> Put the independent variable (e.g. education) in Rows and the outcome (e.g. trust) in Columns, and read the row percentages. Add a Layer variable to check whether the association holds within groups of a control variable (the elaboration model).

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| rows | Row(s) | 1 | ∞ |  | nominal, ordinal |
| columns | Column(s) | 1 | ∞ |  | nominal, ordinal |
| layer | Layer (control variable) | 0 | 1 |  | nominal, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| observed | checkbox | Observed counts | Cells | true |
| expected | checkbox | Expected counts | Cells | false |
| rowPct | checkbox | Row percentages | Cells | true |
| colPct | checkbox | Column percentages | Cells | false |
| totPct | checkbox | Total percentages | Cells | false |
| stdRes | checkbox | Standardized residuals | Cells | false |
| adjRes | checkbox | Adjusted standardized residuals | Cells | false |
| chisq | checkbox | Chi-square | Statistics | true |
| phi | checkbox | Phi and Cramer's V | Statistics | true |
| cc | checkbox | Contingency coefficient | Statistics | false |
| lambda | checkbox | Lambda and Goodman-Kruskal tau | Statistics | false |
| gamma | checkbox | Gamma | Statistics | false |
| somersD | checkbox | Somers' d | Statistics | false |
| tauB | checkbox | Kendall's tau-b | Statistics | false |
| tauC | checkbox | Kendall's tau-c | Statistics | false |
| correlations | checkbox | Correlations (Spearman, Pearson) | Statistics | false |
| kappa | checkbox | Kappa | Statistics | false |
| risk | checkbox | Risk (odds ratio, 2x2) | Statistics | false |
| mcnemar | checkbox | McNemar | Statistics | false |
| cmh | checkbox | Cochran-Mantel-Haenszel (layered 2x2) | Statistics | false |
| exact | select | Exact tests | Exact | "asymptotic" |
| weights | select | Non-integer weights | Cells | "round" |
| chart | checkbox | Clustered bar chart | Charts | false |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[stats/crosstabs.ts#cellStats|cellStats()]] · stats
- [[stats/crosstabs.ts#chiSquareTests|chiSquareTests()]] · stats
- [[stats/crosstabs.ts#cmh|cmh()]] · stats
- [[output.ts#hcell|hcell()]]
- [[stats/crosstabs.ts#kappa|kappa()]] · stats
- [[stats/crosstabs.ts#lambdaTau|lambdaTau()]] · stats
- [[stats/crosstabs.ts#margins|margins()]] · stats
- [[stats/crosstabs.ts#mcnemar|mcnemar()]] · stats
- [[core/types.ts#newId|newId()]]
- [[stats/crosstabs.ts#nominalMeasures|nominalMeasures()]] · stats
- [[stats/crosstabs.ts#ordinalMeasures|ordinalMeasures()]] · stats
- [[stats/crosstabs.ts#pearsonFromTable|pearsonFromTable()]] · stats
- [[stats/crosstabs.ts#populated|populated()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[stats/crosstabs.ts#riskEstimate|riskEstimate()]] · stats
- [[core/data.ts#selectCases|selectCases()]]
- [[stats/crosstabs.ts#spearmanFromTable|spearmanFromTable()]] · stats
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[core/common.ts#categoriesOf|categoriesOf()]] · procedure helper
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtN|fmtN()]] · procedure helper
- [[core/common.ts#heading|heading()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#labelV|labelV()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#optStr|optStr()]] · procedure helper
- [[core/common.ts#pcell|pcell()]] · procedure helper
- [[core/common.ts#pct|pct()]] · procedure helper
- [[core/common.ts#sameValue|sameValue()]] · procedure helper
- [[core/common.ts#selN|selN()]] · procedure helper
- [[core/common.ts#sigWord|sigWord()]] · procedure helper
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
- [[ai-features.spec.ts]] · menu label
- [[qual.spec.ts]] · menu label
- [[quant.spec.ts]] · menu label
- [[search.spec.ts]] · menu label
- [[features.test.ts]] · menu label
- [[navigation-audit.test.tsx]] · menu label
- [[palette.test.tsx]] · menu label, procedure id
- [[search.test.ts]] · menu label, procedure id
- [[scenarios.test.ts]] · procedure id
- [[units.test.ts]] · menu label, procedure id
- [[procedures-oracle.fuzz.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[Syntax/COUNT|COUNT]]
- [[Syntax/CROSSTABS|CROSSTABS]]

## Implemented by
- [[core/crosstabs.ts#crosstabs|crosstabs]]

## Configured in dialog
- [[procedure/crosstabs|procedure: crosstabs]]
