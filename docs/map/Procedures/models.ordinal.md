---
id: "procedure:models.ordinal"
type: procedure
file: src/procedures/models/plum.ts
area: procedures
---

# Ordinal Regression

*Analysis procedure (ProcedureDef)* · defined in [[plum.ts]] · area [[procedures]]

- **Menu:** Regression
- **Description:** Predict an ordered outcome such as a Likert item (strongly disagree ... strongly agree) with a proportional-odds (cumulative logit) model.

> Use when the outcome has ordered categories but the distances between them are not known. The model assumes each predictor has the same effect at every cut-point of the outcome (proportional odds); the Test of Parallel Lines checks this.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| dependent | Dependent (ordered categories) | 1 | 1 |  | ordinal |
| predictors | Predictors | 1 | ∞ |  |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| dummy | checkbox | Treat nominal/ordinal predictors as factors | Categorical predictors | true |
| reference | select | Reference category | Categorical predictors | "first" |
| parallel | checkbox | Test of parallel lines | Output | true |
| gof | checkbox | Goodness-of-fit statistics | Output | true |
| maxIter | number | Maximum iterations | Output | 100 |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[distributions.ts#chi2Sf|chi2Sf()]] · stats
- [[ordinal.ts#cumulativeNullLogLik|cumulativeNullLogLik()]] · stats
- [[ordinal.ts#fitCumulativeLogit|fitCumulativeLogit()]] · stats
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[ordinal.ts#ordinalGoodnessOfFit|ordinalGoodnessOfFit()]] · stats
- [[logistic.ts#pseudoR2|pseudoR2()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[logistic.ts#screenCollinear|screenCollinear()]] · stats
- [[core/data.ts#selectCases|selectCases()]]
- [[models-util.ts#sum|sum()]] · stats
- [[ordinal.ts#waldCI|waldCI()]] · stats

## Uses
- [[models/common.ts#buildTerms|buildTerms()]] · procedure helper
- [[models/common.ts#capitalize|capitalize()]] · procedure helper
- [[models/common.ts#caseNote|caseNote()]] · procedure helper
- [[procedures/text.ts#CI_MAX|CI_MAX]] · procedure helper
- [[procedures/text.ts#CI_MIN|CI_MIN]] · procedure helper
- [[procedures/text.ts#ciOption|ciOption()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[models/common.ts#coefCell|coefCell()]] · procedure helper
- [[models/common.ts#colProse|colProse()]] · procedure helper
- [[procedures/text.ts#confLevel|confLevel()]] · procedure helper
- [[models/common.ts#countPatterns|countPatterns()]] · procedure helper
- [[models/common.ts#describeCols|describeCols()]] · procedure helper
- [[models/common.ts#dfText|dfText()]] · procedure helper
- [[models/common.ts#dummySyntaxName|dummySyntaxName()]] · procedure helper
- [[models/common.ts#emptyOutcomeCells|emptyOutcomeCells()]] · procedure helper
- [[models/common.ts#fmtP|fmtP()]] · procedure helper
- [[models/common.ts#footName|footName()]] · procedure helper
- [[models/common.ts#heading|heading()]] · procedure helper
- [[models/common.ts#HESSIAN_SINGULARITY_WARNING|HESSIAN_SINGULARITY_WARNING]] · procedure helper
- [[models/common.ts#isCategorical|isCategorical()]] · procedure helper
- [[procedures/text.ts#labelOf|labelOf()]] · procedure helper
- [[models/common.ts#levelsOf|levelsOf()]] · procedure helper
- [[procedures/text.ts#levelText|levelText()]] · procedure helper
- [[models/common.ts#listText|listText()]] · procedure helper
- [[models/common.ts#makeItem|makeItem()]] · procedure helper
- [[models/common.ts#marginalCaseSummary|marginalCaseSummary()]] · procedure helper
- [[models/common.ts#noLead|noLead()]] · procedure helper
- [[procedures/text.ts#nonEmpty|nonEmpty()]] · procedure helper
- [[models/common.ts#num|num()]] · procedure helper
- [[models/common.ts#numericValues|numericValues()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[models/common.ts#optBool|optBool()]] · procedure helper
- [[models/common.ts#optNum|optNum()]] · procedure helper
- [[models/common.ts#optStr|optStr()]] · procedure helper
- [[models/common.ts#patternKeyFn|patternKeyFn()]] · procedure helper
- [[models/common.ts#pCell|pCell()]] · procedure helper
- [[models/common.ts#proseNamer|proseNamer()]] · procedure helper
- [[procedures/text.ts#rangeMessage|rangeMessage()]] · procedure helper
- [[models/common.ts#rawValues|rawValues()]] · procedure helper
- [[models/common.ts#selectAll|selectAll()]] · procedure helper
- [[core/common.ts#selMissing|selMissing()]] · procedure helper
- [[models/common.ts#slot|slot()]] · procedure helper
- [[models/common.ts#spssLiteral|spssLiteral()]] · procedure helper
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]] · procedure helper
- [[models/common.ts#textBlock|textBlock()]] · procedure helper
- [[models/common.ts#usableLabel|usableLabel()]] · procedure helper
- [[models/common.ts#vars|vars()]] · procedure helper
- [[models/common.ts#weightedN|weightedN()]] · procedure helper

## Tested by
- [[search.test.ts]] · menu label
- [[sample-survey.test.ts]] · procedure id
- [[stats-models/procedures.test.ts]] · menu label, procedure id
- [[separation.test.ts]] · procedure id

## Generates SPSS syntax
- [[EXECUTE]]
- [[PLUM]]

## Implemented by
- [[plum.ts#ordinalRegression|ordinalRegression]]

## Configured in dialog
- [[procedure/models.ordinal|procedure: models.ordinal]]
