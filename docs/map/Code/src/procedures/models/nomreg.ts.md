---
id: src/procedures/models/nomreg.ts
type: module
file: src/procedures/models/nomreg.ts
area: procedures
---

# src/procedures/models/nomreg.ts

*Module* · area [[procedures]] · 451 lines

> Multinomial Logistic Regression (SPSS NOMREG): baseline-category logit for an unordered outcome.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[distributions.ts]] · value
- [[logistic.ts]] · value
- [[models-util.ts]] · value
- [[core/common.ts]] · value
- [[binary.ts]] · value
- [[models/common.ts]] · value
- [[procedures/text.ts]] · value

## Calls
- [[models/common.ts#buildTerms|buildTerms()]]
- [[models/common.ts#caseNote|caseNote()]]
- [[output.ts#cell|cell()]]
- [[distributions.ts#chi2Sf|chi2Sf()]]
- [[models/common.ts#coefCell|coefCell()]]
- [[procedures/text.ts#confLevel|confLevel()]]
- [[models/common.ts#countPatterns|countPatterns()]]
- [[models/common.ts#dfText|dfText()]]
- [[models/common.ts#emptyCellsText|emptyCellsText()]]
- [[models/common.ts#emptyOutcomeCells|emptyOutcomeCells()]]
- [[logistic.ts#expCI|expCI()]]
- [[logistic.ts#fitMultinomial|fitMultinomial()]]
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
- [[logistic.ts#multinomialNullLogLik|multinomialNullLogLik()]]
- [[models/common.ts#noLead|noLead()]]
- [[models/common.ts#num|num()]]
- [[binary.ts#oddsPhrase|oddsPhrase()]]
- [[models/common.ts#optBool|optBool()]]
- [[models/common.ts#optNum|optNum()]]
- [[models/common.ts#optStr|optStr()]]
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

## Uses
- [[models/common.ts#HESSIAN_SINGULARITY_WARNING|HESSIAN_SINGULARITY_WARNING]]

## Imported by
- [[models/index.ts]] · value

## Private helpers
runMultinomial() (line 108) · separationExplanation() (line 374) · cntCell() (line 419) · predictCategory() (line 423) · buildSyntax() (line 436)

## Symbols

### multinomialLogistic
*const* · line 54 · exported
- Calls: [[models/common.ts#slot|slot()]], [[nomreg.ts]], [[procedures/text.ts#ciOption|ciOption()]]
- Used in: [[models/index.ts]]

### tbl
*function* · line 104
- Output: [[table]]
