---
id: tests/io/sav-edge.test.ts
type: test
file: tests/io/sav-edge.test.ts
area: tests
---

# tests/io/sav-edge.test.ts

*Test file* · area [[tests]] · 282 lines

> Reader edge cases on hand-built files (see sav-builder.ts): byte order, legacy encodings, unknown case counts, display-record variants, extension records Socius skips.

## Test cases
- **reader: byte order**
  - rejects a file whose layout code fits neither byte order
- **reader: text encodings**
  - uses the code page from subtype 3 when there is no encoding record
  - prefers the subtype 20 encoding name (Cyrillic windows-1251)
  - decodes Shift_JIS files (code page 932)
  - guesses windows-1252 from a non-UTF-8 dictionary and says so
  - guesses UTF-8 from a valid UTF-8 dictionary
  - re-reads string data as windows-1252 when an ASCII dictionary hides non-UTF-8 data
  - honours the encoding override when the file names no encoding
- **reader: case counts and trailing data**
  - counts cases when the header says -1 (uncompressed) and drops an incomplete last case
  - counts cases when the header says -1 (bytecode)
  - uses the 64-bit case count record when the header says -1
  - ignores garbage after the declared cases
  - reads a file with variables but no cases
- **reader: dictionary records**
  - reads the 2-value display record form (measure, alignment)
  - skips unknown and unused extension records, and reports multiple response sets
  - reads variable attributes and SPSS roles (subtype 18)
  - applies one value label record to several variables and handles string labels
  - makes duplicate long names unique
  - warns when the weight variable is a string
  - falls back to F format for an unknown format code and says so

## Imports
- [[sav-reader.ts]] · value
- [[sav-builder.ts]] · value
- [[vitest]] · value

## Calls
- [[sav-builder.ts#buildSav|buildSav()]]
- [[sav-builder.ts#ext|ext()]]
- [[sav-builder.ts#ext32|ext32()]]
- [[sav-builder.ts#fmt|fmt()]]
- [[sav-reader.ts#readSav|readSav()]]
- [[sav-builder.ts#valueLabels|valueLabels()]]
- [[sav-builder.ts#W|W]]

## Tests
- [[sav-reader.ts]] · import

## Private helpers
LOWEST (line 7) · cp1252() (line 14) · sampleFile() (line 19)
