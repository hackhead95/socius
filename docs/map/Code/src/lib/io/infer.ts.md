---
id: src/lib/io/infer.ts
type: module
file: src/lib/io/infer.ts
area: lib/io
---

# src/lib/io/infer.ts

*Module* · area [[lib - io|lib/io]] · 317 lines

> Turn a table of raw cells (from CSV or Excel) into a typed Dataset: detect numeric, date and string columns, choose formats and measurement levels, and make valid SPSS variable names.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only, value
- [[encoding.ts]] · value

## Imported by
- [[mutations.ts]] · value
- [[csv.ts]] · value
- [[xlsx.ts]] · value

## Types
RawCell (line 9) · TableInput (line 11)

## Private helpers
MISSING_TOKENS (line 22) · NUM_DOT (line 23) · NUM_COMMA (line 24) · ISO_DATE (line 25) · ISO_DATETIME (line 26) · CLOCK_TIME (line 27) · MAX_DECIMALS (line 28) · NUM_THOUSANDS (line 30) · SECONDS_PER_DAY (line 31) · daysFromCivil() (line 34) · SPSS_EPOCH_DAYS (line 43) · snapSeconds() (line 61) · decimalsOfText() (line 75) · decimalsOfNumber() (line 83) · isExcelTimeOnly() (line 88) · parseCell() (line 93) · cellText() (line 132) · numericWidth() (line 146) · guessMeasure() (line 159) · isEmptyRow() (line 203)

## Symbols

### spssDateSeconds
*function* · line 46 · exported
> SPSS date value (seconds since 1582-10-14) for a calendar date, or null if the date is invalid.
- Calls: [[infer.ts]]
- Uses: [[infer.ts]]

### spssSecondsFromDate
*function* · line 56 · exported
> SPSS seconds for a JS Date (read as UTC, rounded to the millisecond).
- Calls: [[infer.ts]]
- Uses: [[infer.ts]]

### variableNameFor
*function* · line 184 · exported
> A valid, unused SPSS name for a column header. Keeps letters from any script (Bengali, Hindi, accented Latin), turns runs of other characters into one underscore, and falls back to uniqueVarName from core/data when nothing usable is left.
- Calls: [[core/data.ts#uniqueVarName|uniqueVarName()]], [[core/data.ts#validateVarName|validateVarName()]], [[encoding.ts#truncateUtf8|truncateUtf8()]]
- Used in: [[mutations.ts]]

### tableToDataset
*function* · line 208 · exported
- Calls: [[core/data.ts#uniqueVarName|uniqueVarName()]], [[core/types.ts#makeDataset|makeDataset()]], [[core/types.ts#makeVariable|makeVariable()]], [[encoding.ts#truncateUtf8|truncateUtf8()]], [[encoding.ts#utf8ByteLength|utf8ByteLength()]], [[infer.ts#variableNameFor|variableNameFor()]], [[infer.ts]]
- Uses: [[infer.ts]]
- Used in: [[csv.ts]], [[xlsx.ts]]
