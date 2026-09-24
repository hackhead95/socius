---
id: src/lib/coding/segments.ts
type: module
file: src/lib/coding/segments.ts
area: lib/coding
---

# src/lib/coding/segments.ts

*Module* · area [[lib - coding|lib/coding]] · 136 lines

> Segment utilities: overlap tests, merging, subtracting ranges, paragraph runs for rendering.

## Imports
- [[coding-types.ts]] · type-only

## Tested by
- [[segments.test.ts]] · import

## Imported by
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[Reader.tsx]] · value
- [[coding/reliability.ts]] · type-only
- [[rules.ts]] · type-only, value
- [[coding/text.ts]] · type-only
- [[segments.test.ts]] · value

## Types
Range (line 5) · Run (line 97)

## Symbols

### rangesOverlap
*function* · line 11 · exported
> True if [a.start, a.end) and [b.start, b.end) share at least one character.
- Used in: [[segments.test.ts]]

### trimRange
*function* · line 16 · exported
> Shrink a range so it does not start or end on whitespace. Returns null if nothing is left.
- Used in: [[Reader.tsx]], [[coding/actions.ts]], [[rules.ts]], [[segments.test.ts]]

### addSegmentMerged
*function* · line 29 · exported
> Add a segment, merging it with any segment of the same document, code and coder that overlaps or touches it (so coding the same passage twice never double counts). Memos are concatenated. Returns the new array and the resulting (possibly...
- Used in: [[coding/actions.ts]], [[segments.test.ts]]

### subtractRange
*function* · line 49 · exported
> Remove [start, end) of `codeId` (by `coder`, or any coder when coder is null) from a document. Segments partly inside are trimmed or split in two.
- Used in: [[coding/actions.ts]], [[segments.test.ts]]

### indexByDoc
*function* · line 71 · exported
> Segments grouped by document id (each list sorted by start).
- Used in: [[coding/hooks.ts]]

### splitLines
*function* · line 83 · exported
> Paragraph ranges: text split at line breaks. Empty lines give empty ranges (kept for spacing).
- Used in: [[Reader.tsx]], [[segments.test.ts]]

### buildRuns
*function* · line 103 · exported
> Split [start, end) into runs where the set of covering segments is constant.
- Used in: [[segments.test.ts]]

### assignLanes
*function* · line 121 · exported
> Greedy lane assignment so overlapping segments get different gutter lanes. Returns lane per id.
- Used in: [[Reader.tsx]], [[segments.test.ts]]
