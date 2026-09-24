---
id: "procedure:models.factor"
type: procedure
file: src/procedures/models/factor.ts
area: procedures
---

# Factor Analysis

*Analysis procedure (ProcedureDef)* · defined in [[models/factor.ts]] · area [[procedures]]

- **Menu:** Dimension Reduction
- **Description:** Find a small number of underlying dimensions behind many items (for example attitude batteries) with principal components or principal axis factoring.

> Principal components (the SPSS default) summarise the items; principal axis factoring models the shared variance only and is usual for latent constructs. Use varimax when the dimensions should be independent, promax or direct oblimin when they may correlate (common for attitudes). Aim for at least 5 to 10 cases per variable and a KMO above .60.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Variables | 3 | ∞ | numeric |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| extraction | select | Extraction method | Extraction | "pc" |
| criterion | select | Extract | Extraction | "eigen" |
| minEigen | number | Eigenvalues greater than | Extraction | 1 |
| nFactors | number | Number of factors to extract | Extraction | 2 |
| maxIter | number | Maximum iterations for convergence | Extraction | 25 |
| scree | checkbox | Scree plot | Extraction | true |
| rotation | select | Rotation | Rotation | "varimax" |
| kappa | number | Promax kappa | Rotation | 4 |
| delta | number | Oblimin delta | Rotation | 0 |
| kmo | checkbox | KMO and Bartlett's test of sphericity | Descriptives | true |
| corr | checkbox | Correlation matrix and determinant | Descriptives | false |
| sort | checkbox | Sorted by size | Options | false |
| suppress | checkbox | Suppress small coefficients | Options | false |
| suppressBelow | number | Absolute value below | Options | 0.3 |

## Calls
- [[output.ts#cell|cell()]]
- [[stats/factor.ts#columnSS|columnSS()]] · stats
- [[stats/factor.ts#correlationMatrix|correlationMatrix()]] · stats
- [[stats/factor.ts#extractFactors|extractFactors()]] · stats
- [[output.ts#hcell|hcell()]]
- [[stats/factor.ts#kmoBartlett|kmoBartlett()]] · stats
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[stats/factor.ts#rotate|rotate()]] · stats
- [[core/data.ts#selectCases|selectCases()]]
- [[stats/factor.ts#sortOrder|sortOrder()]] · stats
- [[models-util.ts#sum|sum()]] · stats

## Uses
- [[models/common.ts#caseNote|caseNote()]] · procedure helper
- [[models/common.ts#chartBlock|chartBlock()]] · procedure helper
- [[models/common.ts#fmtP|fmtP()]] · procedure helper
- [[models/common.ts#heading|heading()]] · procedure helper
- [[models/common.ts#listText|listText()]] · procedure helper
- [[models/common.ts#makeItem|makeItem()]] · procedure helper
- [[models/common.ts#noLead|noLead()]] · procedure helper
- [[models/common.ts#num|num()]] · procedure helper
- [[models/common.ts#numericValues|numericValues()]] · procedure helper
- [[models/common.ts#optBool|optBool()]] · procedure helper
- [[models/common.ts#optNum|optNum()]] · procedure helper
- [[models/common.ts#optStr|optStr()]] · procedure helper
- [[models/common.ts#selectAll|selectAll()]] · procedure helper
- [[models/common.ts#slot|slot()]] · procedure helper
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]] · procedure helper
- [[models/common.ts#textBlock|textBlock()]] · procedure helper
- [[models/common.ts#vars|vars()]] · procedure helper
- [[models/common.ts#weightedN|weightedN()]] · procedure helper

## Tested by
- [[sample-survey.test.ts]] · procedure id
- [[stats-models/procedures.test.ts]] · procedure id

## Generates SPSS syntax
- [[FACTOR]]

## Implemented by
- [[models/factor.ts#factorAnalysis|factorAnalysis]]

## Configured in dialog
- [[procedure/models.factor|procedure: models.factor]]
