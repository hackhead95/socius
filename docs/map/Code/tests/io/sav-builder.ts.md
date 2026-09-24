---
id: tests/io/sav-builder.ts
type: test-helper
file: tests/io/sav-builder.ts
area: tests
---

# tests/io/sav-builder.ts

*Test helper* · area [[tests]] · 197 lines

> A tiny, independent SPSS system-file builder for tests. It writes records byte by byte from the format specification (not through Socius's writer), so the reader can be tested on files Socius would never produce: big-endian, legacy code pages, missing encoding records, odd extension records, unknown case counts.

## Imported by
- [[data.spec.ts]] · value
- [[sav-edge.test.ts]] · value

## Types
BuildVar (line 6) · BuildOptions (line 16)

## Private helpers
enc (line 35) · bytesOf() (line 36)

## Symbols

### W
*class* · line 38 · exported
- Calls: [[sav-builder.ts]]
- Used in: [[sav-edge.test.ts]]

### fmt
*function* · line 68 · exported
- Used in: [[sav-edge.test.ts]]

### ext
*function* · line 73 · exported
> Extension record (type 7).
- Calls: [[sav-builder.ts#W|W]], [[sav-builder.ts]]
- Used in: [[sav-edge.test.ts]]

### ext32
*function* · line 78 · exported
- Calls: [[sav-builder.ts#W|W]]
- Used in: [[sav-edge.test.ts]]

### valueLabels
*function* · line 85 · exported
> Value label record pair (types 3 + 4). Values: numbers, or 8-byte strings.
- Calls: [[sav-builder.ts#W|W]], [[sav-builder.ts]]
- Used in: [[data.spec.ts]], [[sav-edge.test.ts]]

### buildSav
*function* · line 100 · exported
- Calls: [[sav-builder.ts#W|W]], [[sav-builder.ts#fmt|fmt()]], [[sav-builder.ts]]
- Used in: [[data.spec.ts]], [[sav-edge.test.ts]]
