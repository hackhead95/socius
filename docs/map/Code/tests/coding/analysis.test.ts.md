---
id: tests/coding/analysis.test.ts
type: test
file: tests/coding/analysis.test.ts
area: tests
---

# tests/coding/analysis.test.ts

*Test file* · area [[tests]] · 96 lines

## Test cases
- **code frequencies**
  - counts segments, documents and percentages, with sub-codes rolled up
- **co-occurrence**
  - document mode counts documents with both codes
  - overlap mode counts overlapping segment pairs
- **code by attribute**
  - counts documents per attribute value with column percentages
- **themes rolled up with their sub-codes**
  - co-occurrence of top-level themes counts sub-code segments in their theme
  - codes by attribute: theme rows count sources with the theme or a sub-code, in value-label order
- **informative attributes**
  - puts attributes shared by every source last

## Imports
- [[coding-types.ts]] · type-only
- [[coding/analysis.ts]] · value
- [[vitest]] · value

## Calls
- [[coding/analysis.ts#codeByAttribute|codeByAttribute()]]
- [[coding/analysis.ts#codeFrequencies|codeFrequencies()]]
- [[coding/analysis.ts#constantAttributeKeys|constantAttributeKeys()]]
- [[coding/analysis.ts#cooccurrence|cooccurrence()]]
- [[coding/analysis.ts#orderedAttributes|orderedAttributes()]]

## Tests
- [[coding-types.ts]] · import
- [[coding/analysis.ts]] · import

## Private helpers
code() (line 5) · doc() (line 6) · seg() (line 7) · codes (line 9) · docs (line 10) · segments (line 11)
