---
id: src/lib/io/infer.ts
type: module
file: src/lib/io/infer.ts
area: lib/io
---

# src/lib/io/infer.ts

*Module* · area [[lib - io|lib/io]] · 370 lines

> Turn a table of raw cells (from CSV or Excel) into a typed Dataset: detect numeric, date and string columns, choose formats and measurement levels, and make valid SPSS variable names.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only, value
- [[encoding.ts]] · value

## Tested by
- [[codebook-roundtrip.test.ts]] · import

## Imported by
- [[mutations.ts]] · value
- [[csv.ts]] · value
- [[io/index.ts]] · re-export, type-only
- [[xlsx.ts]] · value
- [[codebook-roundtrip.test.ts]] · value

## Types
RawCell (line 9) · TableInput (line 11) · ImportColumnInfo (line 25)

## Private helpers
MISSING_TOKENS (line 61) · NUM_DOT (line 62) · NUM_COMMA (line 63) · ISO_DATE (line 64) · ISO_DATETIME (line 65) · CLOCK_TIME (line 66) · MAX_DECIMALS (line 67) · NUM_THOUSANDS (line 69) · SECONDS_PER_DAY (line 70) · daysFromCivil() (line 73) · SPSS_EPOCH_DAYS (line 82) · snapSeconds() (line 100) · decimalsOfText() (line 114) · decimalsOfNumber() (line 122) · isExcelTimeOnly() (line 127) · parseCell() (line 132) · cellText() (line 171) · numericWidth() (line 185) · guessMeasure() (line 198) · isEmptyRow() (line 242)

## Symbols

### conversionWarning
*function* · line 40 · exported
> The import warning that lists the columns whose text changed when read as numbers, and how.
- Used in: [[codebook-roundtrip.test.ts]]

### spssDateSeconds
*function* · line 85 · exported
> SPSS date value (seconds since 1582-10-14) for a calendar date, or null if the date is invalid.
- Calls: [[infer.ts]]
- Uses: [[infer.ts]]

### spssSecondsFromDate
*function* · line 95 · exported
> SPSS seconds for a JS Date (read as UTC, rounded to the millisecond).
- Calls: [[infer.ts]]
- Uses: [[infer.ts]]

### variableNameFor
*function* · line 223 · exported
> A valid, unused SPSS name for a column header. Keeps letters from any script (Bengali, Hindi, accented Latin), turns runs of other characters into one underscore, and falls back to uniqueVarName from core/data when nothing usable is left.
- Calls: [[core/data.ts#uniqueVarName|uniqueVarName()]], [[core/data.ts#validateVarName|validateVarName()]], [[encoding.ts#truncateUtf8|truncateUtf8()]]
- Used in: [[mutations.ts]]

### tableToDataset
*function* · line 247 · exported
- Calls: [[core/data.ts#uniqueVarName|uniqueVarName()]], [[core/types.ts#makeDataset|makeDataset()]], [[core/types.ts#makeVariable|makeVariable()]], [[encoding.ts#truncateUtf8|truncateUtf8()]], [[encoding.ts#utf8ByteLength|utf8ByteLength()]], [[infer.ts#conversionWarning|conversionWarning()]], [[infer.ts#variableNameFor|variableNameFor()]], [[infer.ts]]
- Uses: [[infer.ts]]
- Used in: [[csv.ts]], [[xlsx.ts]]
