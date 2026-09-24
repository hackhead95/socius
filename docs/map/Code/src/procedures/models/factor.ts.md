---
id: src/procedures/models/factor.ts
type: module
file: src/procedures/models/factor.ts
area: procedures
---

# src/procedures/models/factor.ts

*Module* · area [[procedures]] · 356 lines

> Factor Analysis (SPSS FACTOR): principal components or principal axis factoring, with varimax / promax / direct oblimin rotation, KMO and Bartlett's test, scree plot.

## Imports
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[stats/factor.ts]] · value
- [[models-util.ts]] · value
- [[models/common.ts]] · value

## Calls
- [[models/common.ts#noLead|noLead()]]
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]]

## Imported by
- [[models/index.ts]] · value

## Private helpers
capitalizeNum() (line 325) · buildSyntax() (line 330)

## Symbols

### kmoLabel
*function* · line 31 · exported

### factorAnalysis
*const* · line 40 · exported
- Calls: [[models/factor.ts#runFactor|runFactor()]]
- Used in: [[models/index.ts]]

### tbl
*function* · line 101
- Output: [[table]]

### runFactor
*function* · line 105
- Calls: [[models-util.ts#sum|sum()]], [[models/common.ts#caseNote|caseNote()]], [[models/common.ts#chartBlock|chartBlock()]], [[models/common.ts#fmtP|fmtP()]], [[models/common.ts#heading|heading()]], [[models/common.ts#listText|listText()]], [[models/common.ts#makeItem|makeItem()]], [[models/common.ts#noLead|noLead()]], [[models/common.ts#numericValues|numericValues()]], [[models/common.ts#num|num()]], [[models/common.ts#optBool|optBool()]], [[models/common.ts#optNum|optNum()]], [[models/common.ts#optStr|optStr()]], [[models/common.ts#selectAll|selectAll()]], [[models/common.ts#slot|slot()]], [[models/common.ts#textBlock|textBlock()]], [[models/common.ts#vars|vars()]], [[models/factor.ts#kmoLabel|kmoLabel()]], [[models/factor.ts#tbl|tbl()]], [[models/factor.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[stats/factor.ts#columnSS|columnSS()]], [[stats/factor.ts#correlationMatrix|correlationMatrix()]], [[stats/factor.ts#extractFactors|extractFactors()]] … +3
- Uses: [[models/factor.ts#factorAnalysis|factorAnalysis]]
- Output: [[line]]
