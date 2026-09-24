---
id: "procedure:models.linear"
type: procedure
file: src/procedures/models/linear.ts
area: procedures
---

# Linear Regression

*Analysis procedure (ProcedureDef)* · defined in [[linear.ts]] · area [[procedures]]

- **Menu:** Regression
- **Description:** Predict a scale outcome (for example a trust or attitude score) from several predictors, optionally entered in blocks.

> Use hierarchical blocks to see how much a set of predictors adds over earlier ones (for example demographics first, then attitudes). Categorical predictors with value labels (nominal or ordinal) are turned into dummy variables automatically. Assumptions: a roughly linear relationship, independent cases, residuals with constant spread and a roughly normal distribution. Check the residual plots.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| dependent | Dependent | 1 | 1 | numeric | scale |
| block1 | Independent(s): Block 1 | 1 | ∞ |  |  |
| block2 | Block 2 (optional) | 0 | ∞ |  |  |
| block3 | Block 3 (optional) | 0 | ∞ |  |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| method | select | Method | Method | "enter" |
| pin | number | Entry probability (PIN) | Method | 0.05 |
| pout | number | Removal probability (POUT) | Method | 0.1 |
| dummy | checkbox | Dummy-code categorical predictors | Categorical predictors | true |
| reference | select | Reference category | Categorical predictors | "first" |
| ci | checkbox | Confidence intervals for B | Statistics | true |
| confLevel | number | Confidence level (%) | Statistics | 95 |
| collinearity | checkbox | Collinearity diagnostics (tolerance, VIF) | Statistics | true |
| zpp | checkbox | Part and partial correlations | Statistics | false |
| durbinWatson | checkbox | Durbin-Watson | Residuals | false |
| casewise | checkbox | Casewise diagnostics | Residuals | true |
| outlierSd | number | Outliers outside (standard deviations) | Residuals | 3 |
| plots | checkbox | Residual plots (histogram, residuals vs predicted) | Residuals | true |

## Calls
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[regression.ts#DEFAULT_TOLERANCE|DEFAULT_TOLERANCE]] · stats
- [[core/data.ts#distinctValues|distinctValues()]]
- [[regression.ts#durbinWatson|durbinWatson()]] · stats
- [[regression.ts#excludedStats|excludedStats()]] · stats
- [[regression.ts#fitLinear|fitLinear()]] · stats
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[regression.ts#r2Change|r2Change()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[regression.ts#stepwiseSelect|stepwiseSelect()]] · stats

## Uses
- [[models/common.ts#buildTerms|buildTerms()]] · procedure helper
- [[models/common.ts#capitalize|capitalize()]] · procedure helper
- [[models/common.ts#caseNote|caseNote()]] · procedure helper
- [[models/common.ts#chartBlock|chartBlock()]] · procedure helper
- [[models/common.ts#coefCell|coefCell()]] · procedure helper
- [[models/common.ts#describeCols|describeCols()]] · procedure helper
- [[models/common.ts#dfCell|dfCell()]] · procedure helper
- [[models/common.ts#dfText|dfText()]] · procedure helper
- [[models/common.ts#dummySyntaxName|dummySyntaxName()]] · procedure helper
- [[models/common.ts#fmtP|fmtP()]] · procedure helper
- [[models/common.ts#footName|footName()]] · procedure helper
- [[models/common.ts#heading|heading()]] · procedure helper
- [[models/common.ts#isCategorical|isCategorical()]] · procedure helper
- [[models/common.ts#levelsOf|levelsOf()]] · procedure helper
- [[models/common.ts#listText|listText()]] · procedure helper
- [[models/common.ts#makeItem|makeItem()]] · procedure helper
- [[models/common.ts#noLead|noLead()]] · procedure helper
- [[models/common.ts#num|num()]] · procedure helper
- [[models/common.ts#numericValues|numericValues()]] · procedure helper
- [[models/common.ts#optBool|optBool()]] · procedure helper
- [[models/common.ts#optNum|optNum()]] · procedure helper
- [[models/common.ts#optStr|optStr()]] · procedure helper
- [[models/common.ts#pCell|pCell()]] · procedure helper
- [[models/common.ts#pct|pct()]] · procedure helper
- [[models/common.ts#rawValues|rawValues()]] · procedure helper
- [[models/common.ts#selectAll|selectAll()]] · procedure helper
- [[models/common.ts#slot|slot()]] · procedure helper
- [[models/common.ts#spssLiteral|spssLiteral()]] · procedure helper
- [[models/common.ts#standardizedHistogram|standardizedHistogram()]] · procedure helper
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]] · procedure helper
- [[models/common.ts#textBlock|textBlock()]] · procedure helper
- [[models/common.ts#textName|textName()]] · procedure helper
- [[models/common.ts#thin|thin()]] · procedure helper
- [[models/common.ts#vars|vars()]] · procedure helper
- [[models/common.ts#weightedN|weightedN()]] · procedure helper

## Tested by
- [[search.spec.ts]] · menu label
- [[search.test.ts]] · menu label
- [[scenarios.test.ts]] · procedure id
- [[procedures-oracle.fuzz.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id
- [[stats-models/procedures.test.ts]] · procedure id

## Generates SPSS syntax
- [[EXECUTE]]
- [[Syntax/REGRESSION|REGRESSION]]

## Implemented by
- [[linear.ts#linearRegression|linearRegression]]

## Configured in dialog
- [[procedure/models.linear|procedure: models.linear]]
