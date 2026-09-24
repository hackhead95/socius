---
id: src/procedures/models/binary.ts
type: module
file: src/procedures/models/binary.ts
area: procedures
---

# src/procedures/models/binary.ts

*Module* · area [[procedures]] · 545 lines

> Binary Logistic Regression (SPSS LOGISTIC REGRESSION, METHOD=ENTER).

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[distributions.ts]] · value
- [[logistic.ts]] · value
- [[models-util.ts]] · value
- [[models/common.ts]] · value

## Calls
- [[models/common.ts#buildTerms|buildTerms()]]
- [[models/common.ts#capitalize|capitalize()]]
- [[models/common.ts#caseNote|caseNote()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[distributions.ts#chi2Sf|chi2Sf()]]
- [[models/common.ts#coefCell|coefCell()]]
- [[models/common.ts#describeCols|describeCols()]]
- [[logistic.ts#detectSeparation|detectSeparation()]]
- [[models/common.ts#dfText|dfText()]]
- [[logistic.ts#expCI|expCI()]]
- [[logistic.ts#fitBinaryLogit|fitBinaryLogit()]]
- [[models/common.ts#fmtP|fmtP()]]
- [[models/common.ts#footName|footName()]]
- [[output.ts#hcell|hcell()]]
- [[models/common.ts#heading|heading()]]
- [[logistic.ts#hosmerLemeshow|hosmerLemeshow()]]
- [[models/common.ts#levelsOf|levelsOf()]]
- [[models/common.ts#listText|listText()]]
- [[models/common.ts#makeItem|makeItem()]]
- [[logistic.ts#multinomialNullLogLik|multinomialNullLogLik()]]
- [[models/common.ts#noLead|noLead()]]
- [[models/common.ts#num|num()]]
- [[models/common.ts#optBool|optBool()]]
- [[models/common.ts#optNum|optNum()]]
- [[models/common.ts#optStr|optStr()]]
- [[models/common.ts#pCell|pCell()]]
- [[logistic.ts#pseudoR2|pseudoR2()]]
- [[models/common.ts#rawValues|rawValues()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[logistic.ts#scoreTestsConstantOnly|scoreTestsConstantOnly()]]
- [[logistic.ts#screenCollinear|screenCollinear()]]
- [[models/common.ts#selectAll|selectAll()]]
- [[models/common.ts#slot|slot()]]
- [[models-util.ts#sum|sum()]]
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]]
- [[models/common.ts#textBlock|textBlock()]]
- [[models/common.ts#textName|textName()]]
- [[logistic.ts#waldTest|waldTest()]]

## Imported by
- [[models/index.ts]] · value
- [[nomreg.ts]] · value

## Private helpers
runBinary() (line 124) · num0() (line 413) · classificationRate() (line 452) · classificationTable() (line 461) · separationText() (line 485) · buildSyntax() (line 512)

## Symbols

### binaryLogistic
*const* · line 60 · exported
- Calls: [[binary.ts]], [[models/common.ts#slot|slot()]]
- Used in: [[models/index.ts]]

### oddsPhrase
*function* · line 115 · exported
- Calls: [[models/common.ts#num|num()]]
- Used in: [[nomreg.ts]]

### tbl
*function* · line 417
- Output: [[table]]

### uniqueTerms
*function* · line 421 · exported

### codingsTable
*function* · line 427 · exported
- Calls: [[binary.ts#tbl|tbl()]], [[core/data.ts#categoryLabel|categoryLabel()]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]]
