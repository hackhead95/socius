---
id: tests/coding/segments.test.ts
type: test
file: tests/coding/segments.test.ts
area: tests
---

# tests/coding/segments.test.ts

*Test file* · area [[tests]] · 49 lines

## Test cases
- **segment utilities**
  - overlap and trim
  - merges overlapping and touching segments of the same code and coder only
  - subtracts a range, splitting a segment
  - builds runs of constant coverage
  - assigns gutter lanes to overlapping segments
  - splits lines keeping empty lines

## Imports
- [[coding-types.ts]] · type-only
- [[segments.ts]] · value
- [[vitest]] · value

## Calls
- [[segments.ts#addSegmentMerged|addSegmentMerged()]]
- [[segments.ts#assignLanes|assignLanes()]]
- [[segments.ts#buildRuns|buildRuns()]]
- [[segments.ts#rangesOverlap|rangesOverlap()]]
- [[segments.ts#splitLines|splitLines()]]
- [[segments.ts#subtractRange|subtractRange()]]
- [[segments.ts#trimRange|trimRange()]]

## Tests
- [[coding-types.ts]] · import
- [[segments.ts]] · import

## Private helpers
S() (line 5)
