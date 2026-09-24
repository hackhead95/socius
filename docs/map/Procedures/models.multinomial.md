---
id: "procedure:models.multinomial"
type: procedure
file: src/procedures/models/nomreg.ts
area: procedures
---

# Multinomial Logistic Regression

*Analysis procedure (ProcedureDef)* · defined in [[nomreg.ts]] · area [[procedures]]

- **Menu:** Regression
- **Description:** Predict an unordered outcome with three or more categories (for example party preference) from several predictors.

> Each outcome category is compared with a reference category, giving one set of odds ratios per comparison. Needs a reasonable number of cases in every outcome category; merge very small categories first.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| dependent | Dependent (categories) | 1 | 1 |  | nominal |
| predictors | Predictors | 1 | ∞ |  |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| outcomeRef | select | Reference category of the outcome | Dependent | "last" |
| dummy | checkbox | Treat nominal/ordinal predictors as factors | Categorical predictors | true |
| reference | select | Reference category for factors | Categorical predictors | "first" |
| classification | checkbox | Classification table | Output | true |
| confLevel | number | Confidence level (%) | Output | 95 |
| maxIter | number | Maximum iterations | Output | 100 |

## Calls
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[distributions.ts#chi2Sf|chi2Sf()]] · stats
- [[logistic.ts#expCI|expCI()]] · stats
- [[logistic.ts#fitMultinomial|fitMultinomial()]] · stats
- [[output.ts#hcell|hcell()]]
- [[logistic.ts#multinomialNullLogLik|multinomialNullLogLik()]] · stats
- [[core/types.ts#newId|newId()]]
- [[logistic.ts#pseudoR2|pseudoR2()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[logistic.ts#screenCollinear|screenCollinear()]] · stats
- [[core/data.ts#selectCases|selectCases()]]
- [[models-util.ts#sum|sum()]] · stats

## Uses
- [[models/common.ts#buildTerms|buildTerms()]] · procedure helper
- [[models/common.ts#caseNote|caseNote()]] · procedure helper
- [[models/common.ts#coefCell|coefCell()]] · procedure helper
- [[models/common.ts#countPatterns|countPatterns()]] · procedure helper
- [[models/common.ts#dfText|dfText()]] · procedure helper
- [[models/common.ts#dummySyntaxName|dummySyntaxName()]] · procedure helper
- [[models/common.ts#emptyCellsText|emptyCellsText()]] · procedure helper
- [[models/common.ts#emptyOutcomeCells|emptyOutcomeCells()]] · procedure helper
- [[models/common.ts#fmtP|fmtP()]] · procedure helper
- [[models/common.ts#footName|footName()]] · procedure helper
- [[models/common.ts#heading|heading()]] · procedure helper
- [[models/common.ts#HESSIAN_SINGULARITY_WARNING|HESSIAN_SINGULARITY_WARNING]] · procedure helper
- [[models/common.ts#isCategorical|isCategorical()]] · procedure helper
- [[models/common.ts#levelsOf|levelsOf()]] · procedure helper
- [[models/common.ts#listText|listText()]] · procedure helper
- [[models/common.ts#makeItem|makeItem()]] · procedure helper
- [[models/common.ts#marginalCaseSummary|marginalCaseSummary()]] · procedure helper
- [[models/common.ts#noLead|noLead()]] · procedure helper
- [[models/common.ts#num|num()]] · procedure helper
- [[models/common.ts#numericValues|numericValues()]] · procedure helper
- [[binary.ts#oddsPhrase|oddsPhrase()]] · procedure helper
- [[models/common.ts#optBool|optBool()]] · procedure helper
- [[models/common.ts#optNum|optNum()]] · procedure helper
- [[models/common.ts#optStr|optStr()]] · procedure helper
- [[models/common.ts#orList|orList()]] · procedure helper
- [[models/common.ts#pCell|pCell()]] · procedure helper
- [[models/common.ts#rawValues|rawValues()]] · procedure helper
- [[models/common.ts#selectAll|selectAll()]] · procedure helper
- [[models/common.ts#slot|slot()]] · procedure helper
- [[models/common.ts#spssLiteral|spssLiteral()]] · procedure helper
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]] · procedure helper
- [[models/common.ts#textBlock|textBlock()]] · procedure helper
- [[models/common.ts#textName|textName()]] · procedure helper
- [[models/common.ts#vars|vars()]] · procedure helper
- [[models/common.ts#weightedN|weightedN()]] · procedure helper

## Tested by
- [[search.test.ts]] · menu label
- [[stats-models/procedures.test.ts]] · menu label, procedure id
- [[separation.test.ts]] · procedure id

## Generates SPSS syntax
- [[EXECUTE]]
- [[NOMREG]]

## Implemented by
- [[nomreg.ts#multinomialLogistic|multinomialLogistic]]

## Configured in dialog
- [[procedure/models.multinomial|procedure: models.multinomial]]
