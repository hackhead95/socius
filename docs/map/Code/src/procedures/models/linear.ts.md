---
id: src/procedures/models/linear.ts
type: module
file: src/procedures/models/linear.ts
area: procedures
---

# src/procedures/models/linear.ts

*Module* · area [[procedures]] · 635 lines

> Linear Regression (SPSS REGRESSION): hierarchical blocks, automatic dummy coding, Enter or Stepwise, SPSS tables, residual diagnostics, interpretation and APA text.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[regression.ts]] · value
- [[models/common.ts]] · value
- [[procedures/text.ts]] · value

## Calls
- [[models/common.ts#capitalize|capitalize()]]
- [[output.ts#cell|cell()]]
- [[models/common.ts#colProse|colProse()]]
- [[models/common.ts#describeCols|describeCols()]]
- [[models/common.ts#dfText|dfText()]]
- [[models/common.ts#fmtP|fmtP()]]
- [[output.ts#hcell|hcell()]]
- [[procedures/text.ts#levelText|levelText()]]
- [[models/common.ts#listText|listText()]]
- [[models/common.ts#noLead|noLead()]]
- [[models/common.ts#num|num()]]
- [[models/common.ts#optNum|optNum()]]
- [[models/common.ts#optStr|optStr()]]
- [[models/common.ts#pCell|pCell()]]
- [[models/common.ts#pct|pct()]]
- [[models/common.ts#slot|slot()]]
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]]

## Uses
- [[regression.ts#DEFAULT_TOLERANCE|DEFAULT_TOLERANCE]]

## Imported by
- [[models/index.ts]] · value

## Private helpers
LETTERS (line 75) · validateLinear() (line 132) · weightedMeanArr() (line 443) · weightedSSArr() (line 451) · excludedTable() (line 457) · predictorPhrase() (line 492) · interpretation() (line 502) · apaText() (line 563) · buildSyntax() (line 607)

## Symbols

### fmtCoef
*function* · line 66 · exported
> Coefficient in running text with sensible precision.
- Calls: [[models/common.ts#num|num()]]

### linearRegression
*const* · line 77 · exported
- Calls: [[linear.ts#runLinear|runLinear()]], [[linear.ts]], [[procedures/text.ts#ciOption|ciOption()]]
- Used in: [[models/index.ts]]

### runLinear
*function* · line 145
- Calls: [[core/data.ts#distinctValues|distinctValues()]], [[core/data.ts#requireVariable|requireVariable()]], [[linear.ts#table|table()]], [[linear.ts]], [[models/common.ts#buildTerms|buildTerms()]], [[models/common.ts#caseNote|caseNote()]], [[models/common.ts#chartBlock|chartBlock()]], [[models/common.ts#coefCell|coefCell()]], [[models/common.ts#dfCell|dfCell()]], [[models/common.ts#footName|footName()]], [[models/common.ts#heading|heading()]], [[models/common.ts#listText|listText()]], [[models/common.ts#makeItem|makeItem()]], [[models/common.ts#noLead|noLead()]], [[models/common.ts#numericValues|numericValues()]], [[models/common.ts#num|num()]], [[models/common.ts#optBool|optBool()]], [[models/common.ts#optNum|optNum()]], [[models/common.ts#optStr|optStr()]], [[models/common.ts#pCell|pCell()]], [[models/common.ts#pct|pct()]], [[models/common.ts#proseNamer|proseNamer()]], [[models/common.ts#selectAll|selectAll()]], [[models/common.ts#slot|slot()]], [[models/common.ts#standardizedHistogram|standardizedHistogram()]] … +12
- Uses: [[linear.ts#linearRegression|linearRegression]], [[linear.ts]], [[regression.ts#DEFAULT_TOLERANCE|DEFAULT_TOLERANCE]]
- Output: [[scatter]], [[table]]

### table
*function* · line 439
- Output: [[table]]
