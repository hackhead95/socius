---
id: "procedure:models.logistic"
type: procedure
file: src/procedures/models/binary.ts
area: procedures
---

# Binary Logistic Regression

*Analysis procedure (ProcedureDef)* · defined in [[binary.ts]] · area [[procedures]]

- **Menu:** Regression
- **Description:** Predict a yes/no outcome (for example voted or not) from several predictors; results are given as odds ratios.

> The dependent variable must have exactly two values. Choose which value counts as the "event" (coded 1). Categorical predictors with value labels are indicator-coded automatically against a reference category. Aim for at least 10 cases of the rarer outcome per predictor.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| dependent | Dependent (two categories) | 1 | 1 |  | nominal, ordinal |
| covariates | Covariates | 1 | ∞ |  |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| event | select | Event (coded 1) | Dependent | "higher" |
| dummy | checkbox | Treat nominal/ordinal predictors as categorical | Categorical predictors | true |
| reference | select | Reference category | Categorical predictors | "first" |
| cut | number | Classification cutoff | Options | 0.5 |
| ci | checkbox | CI for Exp(B) | Options | true |
| hl | checkbox | Hosmer-Lemeshow goodness of fit | Options | true |
| hlTable | checkbox | Hosmer-Lemeshow contingency table | Options | false |
| block0 | checkbox | Show Block 0 (constant-only model) | Options | true |
| maxIter | number | Maximum iterations | Options | 50 |

## Calls
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[distributions.ts#chi2Sf|chi2Sf()]] · stats
- [[logistic.ts#detectSeparation|detectSeparation()]] · stats
- [[logistic.ts#expCI|expCI()]] · stats
- [[logistic.ts#fitBinaryLogit|fitBinaryLogit()]] · stats
- [[output.ts#hcell|hcell()]]
- [[logistic.ts#hosmerLemeshow|hosmerLemeshow()]] · stats
- [[logistic.ts#multinomialNullLogLik|multinomialNullLogLik()]] · stats
- [[core/types.ts#newId|newId()]]
- [[logistic.ts#pseudoR2|pseudoR2()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[logistic.ts#scoreTestsConstantOnly|scoreTestsConstantOnly()]] · stats
- [[logistic.ts#screenCollinear|screenCollinear()]] · stats
- [[core/data.ts#selectCases|selectCases()]]
- [[models-util.ts#sum|sum()]] · stats
- [[logistic.ts#waldTest|waldTest()]] · stats

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
- [[models/common.ts#describeCols|describeCols()]] · procedure helper
- [[models/common.ts#dfText|dfText()]] · procedure helper
- [[models/common.ts#dummySyntaxName|dummySyntaxName()]] · procedure helper
- [[models/common.ts#fmtP|fmtP()]] · procedure helper
- [[models/common.ts#footName|footName()]] · procedure helper
- [[models/common.ts#heading|heading()]] · procedure helper
- [[models/common.ts#isCategorical|isCategorical()]] · procedure helper
- [[procedures/text.ts#labelOf|labelOf()]] · procedure helper
- [[models/common.ts#levelsOf|levelsOf()]] · procedure helper
- [[procedures/text.ts#levelText|levelText()]] · procedure helper
- [[models/common.ts#listText|listText()]] · procedure helper
- [[models/common.ts#makeItem|makeItem()]] · procedure helper
- [[models/common.ts#noLead|noLead()]] · procedure helper
- [[procedures/text.ts#nonEmpty|nonEmpty()]] · procedure helper
- [[models/common.ts#num|num()]] · procedure helper
- [[models/common.ts#numericValues|numericValues()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[models/common.ts#optBool|optBool()]] · procedure helper
- [[models/common.ts#optNum|optNum()]] · procedure helper
- [[models/common.ts#optStr|optStr()]] · procedure helper
- [[models/common.ts#pCell|pCell()]] · procedure helper
- [[models/common.ts#proseNamer|proseNamer()]] · procedure helper
- [[procedures/text.ts#rangeMessage|rangeMessage()]] · procedure helper
- [[models/common.ts#rawValues|rawValues()]] · procedure helper
- [[models/common.ts#selectAll|selectAll()]] · procedure helper
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
- [[LOGISTIC]]
- [[RECODE]]

## Implemented by
- [[binary.ts#binaryLogistic|binaryLogistic]]

## Configured in dialog
- [[procedure/models.logistic|procedure: models.logistic]]
