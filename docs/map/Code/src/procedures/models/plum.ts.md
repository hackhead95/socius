---
id: src/procedures/models/plum.ts
type: module
file: src/procedures/models/plum.ts
area: procedures
---

# src/procedures/models/plum.ts

*Module* · area [[procedures]] · 387 lines

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
- [[models/common.ts]] · value

## Calls
- [[models/common.ts#buildTerms|buildTerms()]]
- [[models/common.ts#capitalize|capitalize()]]
- [[models/common.ts#caseNote|caseNote()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[distributions.ts#chi2Sf|chi2Sf()]]
- [[models/common.ts#coefCell|coefCell()]]
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
- [[models/common.ts#levelsOf|levelsOf()]]
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
- [[ordinal.ts#waldCI|waldCI()]]

## Uses
- [[models/common.ts#HESSIAN_SINGULARITY_WARNING|HESSIAN_SINGULARITY_WARNING]]

## Imported by
- [[models/index.ts]] · value

## Private helpers
runOrdinal() (line 99) · buildSyntax() (line 371)

## Symbols

### ordinalRegression
*const* · line 56 · exported
- Calls: [[models/common.ts#slot|slot()]], [[plum.ts]]
- Used in: [[models/index.ts]]

### tbl
*function* · line 95
- Output: [[table]]
