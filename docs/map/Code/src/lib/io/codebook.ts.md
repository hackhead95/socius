---
id: src/lib/io/codebook.ts
type: module
file: src/lib/io/codebook.ts
area: lib/io
---

# src/lib/io/codebook.ts

*Module* · area [[lib - io|lib/io]] · 69 lines

> Codebook: one row per variable with the dictionary information researchers document.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only

## Calls
- [[core/data.ts#isDateFormat|isDateFormat()]]

## Tested by
- [[codebook-roundtrip.test.ts]] · import

## Imported by
- [[io/index.ts]] · value
- [[xlsx.ts]] · value
- [[codebook-roundtrip.test.ts]] · value

## Private helpers
typeName() (line 6) · valueText() (line 30) · MEASURE_NAMES (line 53)

## Symbols

### quoteValue
*function* · line 26 · exported
> A string value as SPSS syntax writes it: in single quotes, with an embedded quote doubled ('it''s'); trailing blanks (SPSS padding) are dropped. Quoting lets values that contain ", ", "; " or " = ", and the empty value '', be read back e...
- Used in: [[codebook-roundtrip.test.ts]]

### missingText
*function* · line 38 · exported
> "LO THRU 0, -1" for numbers; "'DK', ''" for text (quoted, see quoteValue).
- Calls: [[codebook.ts]]

### valueLabelsText
*function* · line 49 · exported
> "1 = Male; 2 = Female" for numbers; "'KOL' = Kolkata; '' = No answer" for text.
- Calls: [[codebook.ts]]

### codebookRows
*function* · line 55 · exported
- Calls: [[codebook.ts#missingText|missingText()]], [[codebook.ts#valueLabelsText|valueLabelsText()]], [[codebook.ts]]
- Uses: [[codebook.ts]]
- Used in: [[io/index.ts]], [[xlsx.ts]]
