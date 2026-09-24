---
id: src/procedures/models/binary.ts
type: module
file: src/procedures/models/binary.ts
area: procedures
---

# src/procedures/models/binary.ts

*Module* · area [[procedures]] · 556 lines

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
- [[procedures/text.ts#labelOf|labelOf()]]
- [[models/common.ts#levelsOf|levelsOf()]]
- [[procedures/text.ts#levelText|levelText()]]
- [[models/common.ts#listText|listText()]]
- [[models/common.ts#makeItem|makeItem()]]
- [[logistic.ts#multinomialNullLogLik|multinomialNullLogLik()]]
- [[models/common.ts#noLead|noLead()]]
- [[models/common.ts#num|num()]]
- [[models/common.ts#optBool|optBool()]]
- [[models/common.ts#optNum|optNum()]]
- [[models/common.ts#optStr|optStr()]]
- [[models/common.ts#pCell|pCell()]]
- [[models/common.ts#proseNamer|proseNamer()]]
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
- [[logistic.ts#waldTest|waldTest()]]

## Imported by
- [[models/index.ts]] · value
- [[nomreg.ts]] · value

## Private helpers
runBinary() (line 126) · num0() (line 424) · classificationRate() (line 463) · classificationTable() (line 472) · separationText() (line 496) · buildSyntax() (line 523)

## Symbols

### binaryLogistic
*const* · line 62 · exported
- Calls: [[binary.ts]], [[models/common.ts#slot|slot()]], [[procedures/text.ts#ciOption|ciOption()]]
- Used in: [[models/index.ts]]

### oddsPhrase
*function* · line 117 · exported
- Calls: [[models/common.ts#num|num()]]
- Used in: [[nomreg.ts]]

### tbl
*function* · line 428
- Output: [[table]]

### uniqueTerms
*function* · line 432 · exported

### codingsTable
*function* · line 438 · exported
- Calls: [[binary.ts#tbl|tbl()]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[procedures/text.ts#labelOf|labelOf()]]
