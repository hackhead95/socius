---
id: src/procedures/models/nomreg.ts
type: module
file: src/procedures/models/nomreg.ts
area: procedures
---

# src/procedures/models/nomreg.ts

*Module* · area [[procedures]] · 441 lines

> Multinomial Logistic Regression (SPSS NOMREG): baseline-category logit for an unordered outcome.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[distributions.ts]] · value
- [[logistic.ts]] · value
- [[models-util.ts]] · value
- [[binary.ts]] · value
- [[models/common.ts]] · value

## Calls
- [[models/common.ts#buildTerms|buildTerms()]]
- [[models/common.ts#caseNote|caseNote()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[distributions.ts#chi2Sf|chi2Sf()]]
- [[models/common.ts#coefCell|coefCell()]]
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
- [[models/common.ts#levelsOf|levelsOf()]]
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
- [[logistic.ts#pseudoR2|pseudoR2()]]
- [[models/common.ts#rawValues|rawValues()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[logistic.ts#screenCollinear|screenCollinear()]]
- [[models/common.ts#selectAll|selectAll()]]
- [[models/common.ts#slot|slot()]]
- [[models-util.ts#sum|sum()]]
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]]
- [[models/common.ts#textBlock|textBlock()]]
- [[models/common.ts#textName|textName()]]

## Uses
- [[models/common.ts#HESSIAN_SINGULARITY_WARNING|HESSIAN_SINGULARITY_WARNING]]

## Imported by
- [[models/index.ts]] · value

## Private helpers
runMultinomial() (line 106) · separationExplanation() (line 364) · cntCell() (line 409) · predictCategory() (line 413) · buildSyntax() (line 426)

## Symbols

### multinomialLogistic
*const* · line 52 · exported
- Calls: [[models/common.ts#slot|slot()]], [[nomreg.ts]]
- Used in: [[models/index.ts]]

### tbl
*function* · line 102
- Output: [[table]]
