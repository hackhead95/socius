---
id: src/procedures/models/plum.ts
type: module
file: src/procedures/models/plum.ts
area: procedures
---

# src/procedures/models/plum.ts

*Module* · area [[procedures]] · 398 lines

> Ordinal Regression (SPSS PLUM, logit link): proportional-odds cumulative logit model. SPSS parameterisation: logit P(Y <= j) = threshold_j - (location), so a positive location estimate means higher outcome categories become more likely.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[distributions.ts]] · value
- [[logistic.ts]] · value
- [[models-util.ts]] · value
- [[ordinal.ts]] · value
- [[core/common.ts]] · value
- [[models/common.ts]] · value
- [[procedures/text.ts]] · value

## Calls
- [[models/common.ts#buildTerms|buildTerms()]]
- [[models/common.ts#capitalize|capitalize()]]
- [[models/common.ts#caseNote|caseNote()]]
- [[output.ts#cell|cell()]]
- [[distributions.ts#chi2Sf|chi2Sf()]]
- [[models/common.ts#coefCell|coefCell()]]
- [[models/common.ts#colProse|colProse()]]
- [[procedures/text.ts#confLevel|confLevel()]]
- [[models/common.ts#countPatterns|countPatterns()]]
- [[ordinal.ts#cumulativeNullLogLik|cumulativeNullLogLik()]]
- [[models/common.ts#describeCols|describeCols()]]
- [[models/common.ts#dfText|dfText()]]
- [[models/common.ts#emptyOutcomeCells|emptyOutcomeCells()]]
- [[ordinal.ts#fitCumulativeLogit|fitCumulativeLogit()]]
- [[models/common.ts#fmtP|fmtP()]]
- [[models/common.ts#footName|footName()]]
- [[output.ts#hcell|hcell()]]
- [[models/common.ts#heading|heading()]]
- [[procedures/text.ts#labelOf|labelOf()]]
- [[models/common.ts#levelsOf|levelsOf()]]
- [[procedures/text.ts#levelText|levelText()]]
- [[models/common.ts#listText|listText()]]
- [[models/common.ts#makeItem|makeItem()]]
- [[models/common.ts#marginalCaseSummary|marginalCaseSummary()]]
- [[models/common.ts#noLead|noLead()]]
- [[models/common.ts#num|num()]]
- [[models/common.ts#optBool|optBool()]]
- [[models/common.ts#optNum|optNum()]]
- [[models/common.ts#optStr|optStr()]]
- [[ordinal.ts#ordinalGoodnessOfFit|ordinalGoodnessOfFit()]]
- [[models/common.ts#patternKeyFn|patternKeyFn()]]
- [[models/common.ts#pCell|pCell()]]
- [[models/common.ts#proseNamer|proseNamer()]]
- [[logistic.ts#pseudoR2|pseudoR2()]]
- [[models/common.ts#rawValues|rawValues()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[logistic.ts#screenCollinear|screenCollinear()]]
- [[models/common.ts#selectAll|selectAll()]]
- [[core/common.ts#selMissing|selMissing()]]
- [[models/common.ts#slot|slot()]]
- [[models-util.ts#sum|sum()]]
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]]
- [[models/common.ts#textBlock|textBlock()]]
- [[ordinal.ts#waldCI|waldCI()]]

## Uses
- [[models/common.ts#HESSIAN_SINGULARITY_WARNING|HESSIAN_SINGULARITY_WARNING]]

## Imported by
- [[models/index.ts]] · value

## Private helpers
runOrdinal() (line 102) · buildSyntax() (line 382)

## Symbols

### ordinalRegression
*const* · line 59 · exported
- Calls: [[models/common.ts#slot|slot()]], [[plum.ts]], [[procedures/text.ts#ciOption|ciOption()]]
- Used in: [[models/index.ts]]

### tbl
*function* · line 98
- Output: [[table]]
