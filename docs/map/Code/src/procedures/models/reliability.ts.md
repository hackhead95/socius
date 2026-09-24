---
id: src/procedures/models/reliability.ts
type: module
file: src/procedures/models/reliability.ts
area: procedures
---

# src/procedures/models/reliability.ts

*Module* · area [[procedures]] · 220 lines

> Reliability Analysis (SPSS RELIABILITY /MODEL=ALPHA) with McDonald's omega.

## Imports
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[stats/reliability.ts]] · value
- [[models/common.ts]] · value

## Calls
- [[models/common.ts#caseNote|caseNote()]]
- [[output.ts#cell|cell()]]
- [[models/common.ts#dfCell|dfCell()]]
- [[models/common.ts#footName|footName()]]
- [[output.ts#hcell|hcell()]]
- [[models/common.ts#heading|heading()]]
- [[models/common.ts#listText|listText()]]
- [[models/common.ts#makeItem|makeItem()]]
- [[models/common.ts#noLead|noLead()]]
- [[models/common.ts#num|num()]]
- [[models/common.ts#numericValues|numericValues()]]
- [[stats/reliability.ts#oneFactorML|oneFactorML()]]
- [[models/common.ts#optBool|optBool()]]
- [[stats/reliability.ts#reliabilityAnalysis|reliabilityAnalysis()]]
- [[models/common.ts#selectAll|selectAll()]]
- [[models/common.ts#slot|slot()]]
- [[models/common.ts#syntaxPreamble|syntaxPreamble()]]
- [[models/common.ts#textBlock|textBlock()]]
- [[models/common.ts#vars|vars()]]

## Imported by
- [[models/index.ts]] · value

## Private helpers
runReliability() (line 61)

## Symbols

### alphaBand
*function* · line 28 · exported
> George & Mallery (2003) rule-of-thumb bands for alpha.

### reliability
*const* · line 37 · exported
- Calls: [[models/reliability.ts]]
- Used in: [[models/index.ts]]

### tbl
*function* · line 57
- Output: [[table]]
