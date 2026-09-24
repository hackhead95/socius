---
id: "procedure:models.reliability"
type: procedure
file: src/procedures/models/reliability.ts
area: procedures
---

# Reliability Analysis

*Analysis procedure (ProcedureDef)* · defined in [[models/reliability.ts]] · area [[procedures]]

- **Menu:** Scale
- **Description:** Check whether several items measure the same thing well enough to be combined into a scale (Cronbach's alpha, McDonald's omega, item-total statistics).

> Enter the items of one scale. Reverse-worded items must be recoded first so that high values mean the same thing for every item; the output flags items that correlate negatively with the rest of the scale.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| items | Items | 2 | ∞ | numeric |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| itemStats | checkbox | Item statistics | Descriptives | true |
| scaleStats | checkbox | Scale statistics | Descriptives | true |
| itemTotal | checkbox | Scale if item deleted (item-total statistics) | Descriptives | true |
| interItem | checkbox | Inter-item correlation matrix | Inter-item | false |
| summary | checkbox | Summary item statistics (means, variances, correlations) | Inter-item | false |
| omega | checkbox | McDonald's omega (one-factor model) | Model | true |

## Calls
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[stats/reliability.ts#oneFactorML|oneFactorML()]] · stats
- [[stats/reliability.ts#reliabilityAnalysis|reliabilityAnalysis()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]

## Uses
- [[models/common.ts#caseNote|caseNote()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[models/common.ts#dfCell|dfCell()]] · procedure helper
- [[models/common.ts#footName|footName()]] · procedure helper
- [[models/common.ts#heading|heading()]] · procedure helper
- [[models/common.ts#listText|listText()]] · procedure helper
- [[models/common.ts#makeItem|makeItem()]] · procedure helper
- [[models/common.ts#noLead|noLead()]] · procedure helper
- [[models/common.ts#num|num()]] · procedure helper
- [[models/common.ts#numericValues|numericValues()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[models/common.ts#optBool|optBool()]] · procedure helper
- [[models/common.ts#selectAll|selectAll()]] · procedure helper
- [[models/common.ts#slot|slot()]] · procedure helper
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]] · procedure helper
- [[models/common.ts#textBlock|textBlock()]] · procedure helper
- [[models/common.ts#vars|vars()]] · procedure helper
- [[models/common.ts#weightedN|weightedN()]] · procedure helper

## Tested by
- [[search.spec.ts]] · menu label
- [[search.test.ts]] · menu label
- [[scenarios.test.ts]] · procedure id
- [[procedures-oracle.fuzz.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id
- [[stats-models/procedures.test.ts]] · menu label, procedure id

## Generates SPSS syntax
- [[RELIABILITY]]

## Implemented by
- [[models/reliability.ts#reliability|reliability]]

## Configured in dialog
- [[procedure/models.reliability|procedure: models.reliability]]
