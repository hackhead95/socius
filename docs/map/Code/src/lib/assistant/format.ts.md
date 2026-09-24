---
id: src/lib/assistant/format.ts
type: module
file: src/lib/assistant/format.ts
area: lib/assistant
---

# src/lib/assistant/format.ts

*Module* · area [[lib - assistant|lib/assistant]] · 129 lines

> Text for the model: compact renderings of output items, numbers and variables, and size trimming.

## Imports
- [[output.ts]] · type-only
- [[core/types.ts]] · type-only
- [[tableRender.ts]] · value

## Tested by
- [[units.test.ts]] · import

## Imported by
- [[agent.ts]] · value
- [[json-protocol.ts]] · value
- [[prompt.ts]] · value
- [[tools/analysis.ts]] · value
- [[coding.ts]] · value
- [[tools/data.ts]] · value
- [[tools/help.ts]] · value
- [[transform.ts]] · value
- [[units.test.ts]] · value

## Symbols

### enc
*const* · line 6
- Used in: [[tools/analysis.ts]], [[coding.ts]], [[tools/data.ts]], [[tools/help.ts]], [[transform.ts]]

### byteLength
*function* · line 7 · exported
- Uses: [[assistant/format.ts#enc|enc]]
- Used in: [[agent.ts]], [[json-protocol.ts]], [[tools/analysis.ts]], [[coding.ts]], [[tools/data.ts]], [[tools/help.ts]], [[transform.ts]], [[units.test.ts]]

### trimToBytes
*function* · line 10 · exported
> Cut text to at most `max` bytes (UTF-8), at a line break when one is near, with a note.
- Calls: [[assistant/format.ts#byteLength|byteLength()]]
- Used in: [[agent.ts]], [[prompt.ts]], [[tools/analysis.ts]], [[coding.ts]], [[tools/data.ts]], [[tools/help.ts]], [[transform.ts]], [[units.test.ts]]

### num
*function* · line 29 · exported
> A number for the model: up to `dp` decimals, no trailing zeros, "." for not computable.
- Used in: [[tools/analysis.ts]], [[tools/data.ts]], [[transform.ts]]

### pct
*function* · line 36 · exported
- Used in: [[coding.ts]], [[tools/data.ts]]

### varHead
*function* · line 41 · exported
> Short one-line description of a variable's dictionary entry.

### valueLabelsText
*function* · line 45 · exported
- Used in: [[tools/data.ts]]

### missingText
*function* · line 51 · exported
- Used in: [[tools/data.ts]]

### clipTable
*function* · line 61 · exported
> A table with at most `maxRows` body rows (a note says how many were dropped).
- Used in: [[tools/analysis.ts]]

### blockText
*function* · line 68
- Calls: [[assistant/format.ts#clipTable|clipTable()]], [[tableRender.ts#tableToText|tableToText()]]
- Output: [[Blocks/chart|chart]], [[heading]], [[table]], [[text]]
- Used in: [[tools/analysis.ts]]

### outputItemText
*function* · line 87 · exported
> An output item as compact text for the model: title, case base, tables (clipped), warnings, interpretation and APA sentence. Charts are named, not described. Syntax is included when asked.
- Calls: [[assistant/format.ts#blockText|blockText()]]
- Output: [[text]]
- Used in: [[prompt.ts]], [[tools/analysis.ts]]

### closestNames
*function* · line 101 · exported
> Near matches for a mistyped name (for "did you mean" messages).
- Calls: [[assistant/format.ts#levenshtein|levenshtein()]]
- Used in: [[tools/analysis.ts]], [[coding.ts]], [[tools/data.ts]], [[transform.ts]]

### levenshtein
*function* · line 115
- Used in: [[tools/analysis.ts]], [[coding.ts]], [[tools/data.ts]], [[transform.ts]]
