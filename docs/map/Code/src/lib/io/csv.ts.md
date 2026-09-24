---
id: src/lib/io/csv.ts
type: module
file: src/lib/io/csv.ts
area: lib/io
---

# src/lib/io/csv.ts

*Module* · area [[lib - io|lib/io]] · 232 lines

> Delimited text (CSV, TSV, semicolon, pipe): RFC 4180 parsing with delimiter detection, and export.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[encoding.ts]] · value
- [[infer.ts]] · value

## Tested by
- [[csv.test.ts]] · import

## Imported by
- [[io/index.ts]] · value
- [[xlsx.ts]] · value
- [[csv.test.ts]] · value

## Types
ParseResult (line 8) · CsvImportOptions (line 118) · CsvExportOptions (line 209)

## Private helpers
CANDIDATES (line 14) · pad2() (line 154) · secondsPart() (line 156) · needsQuote() (line 191)

## Symbols

### parseDelimited
*function* · line 21 · exported
> RFC 4180 parser: fields may be quoted with ", quotes inside are doubled, quoted fields may hold delimiters and line breaks. Accepts \r\n, \n and \r line endings. Lines that are completely empty are skipped. Stops after `maxRows` records ...
- Used in: [[csv.test.ts]]

### detectDelimiter
*function* · line 97 · exported
> Pick the delimiter that splits the first lines into the most consistent number of fields.
- Calls: [[csv.ts#parseDelimited|parseDelimited()]]
- Uses: [[csv.ts]]
- Used in: [[csv.test.ts]]

### readDelimited
*function* · line 124 · exported
- Calls: [[csv.ts#detectDelimiter|detectDelimiter()]], [[csv.ts#parseDelimited|parseDelimited()]], [[encoding.ts#decodeText|decodeText()]], [[infer.ts#tableToDataset|tableToDataset()]]
- Used in: [[io/index.ts]]

### isoForFormat
*function* · line 163 · exported
> ISO text for SPSS date/time values; null when the format is not a calendar/clock format.
- Calls: [[csv.ts]]
- Used in: [[xlsx.ts]]

### cellForExport
*function* · line 197 · exported
- Calls: [[core/data.ts#formatCell|formatCell()]], [[core/data.ts#valueLabelFor|valueLabelFor()]], [[csv.ts#isoForFormat|isoForFormat()]]

### writeDelimited
*function* · line 216 · exported
- Calls: [[csv.ts#cellForExport|cellForExport()]], [[csv.ts]]
- Used in: [[io/index.ts]]
