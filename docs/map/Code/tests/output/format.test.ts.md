---
id: tests/output/format.test.ts
type: test
file: tests/output/format.test.ts
area: tests
---

# tests/output/format.test.ts

*Test file* · area [[tests]] · 100 lines

## Test cases
- **formatNumber**
  - int: rounds and groups thousands
  - decN: fixed decimals, grouping from 1,000
  - pct: % unless the column header names percent
  - p: APA and SPSS styles, never 0.000
  - r: drops the leading zero
  - coef: 3 decimals, leading zero kept
  - special values
- **formatCell**
  - null is blank, strings pass through, marks kept separately
  - flags significant p-values
- **table geometry**
  - lays out colSpan/rowSpan like HTML
  - finds percent columns from the lowest header

## Imports
- [[output.ts]] · value
- [[output/format.ts]] · value
- [[vitest]] · value

## Calls
- [[output.ts#cell|cell()]]
- [[output/format.ts#cellText|cellText()]]
- [[output/format.ts#formatCell|formatCell()]]
- [[output/format.ts#formatNumber|formatNumber()]]
- [[output/format.ts#formatP|formatP()]]
- [[output.ts#hcell|hcell()]]
- [[output/format.ts#isSignificantP|isSignificantP()]]
- [[output/format.ts#layoutRows|layoutRows()]]
- [[output/format.ts#percentColumns|percentColumns()]]

## Tests
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[output.ts]] · import
- [[output/format.ts]] · import
