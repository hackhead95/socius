---
id: src/lib/io/codebook.ts
type: module
file: src/lib/io/codebook.ts
area: lib/io
---

# src/lib/io/codebook.ts

*Module* · area [[lib - io|lib/io]] · 57 lines

> Codebook: one row per variable with the dictionary information researchers document.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only

## Calls
- [[core/data.ts#isDateFormat|isDateFormat()]]

## Imported by
- [[io/index.ts]] · value
- [[xlsx.ts]] · value

## Private helpers
typeName() (line 6) · valueText() (line 20) · MEASURE_NAMES (line 41)

## Symbols

### missingText
*function* · line 27 · exported
- Calls: [[codebook.ts]]

### valueLabelsText
*function* · line 37 · exported
- Calls: [[codebook.ts]]

### codebookRows
*function* · line 43 · exported
- Calls: [[codebook.ts#missingText|missingText()]], [[codebook.ts#valueLabelsText|valueLabelsText()]], [[codebook.ts]]
- Uses: [[codebook.ts]]
- Used in: [[io/index.ts]], [[xlsx.ts]]
