---
id: src/lib/io/sav-formats.ts
type: module
file: src/lib/io/sav-formats.ts
area: lib/io
---

# src/lib/io/sav-formats.ts

*Module* · area [[lib - io|lib/io]] · 121 lines

> SPSS print/write format codes. In a system file a format is packed into one int32 as (type << 16) | (width << 8) | decimals; in Socius it is a string such as "F8.2" or "DATE11".

## Imported by
- [[sav-reader.ts]] · value
- [[sav-writer.ts]] · value

## Types
SavFormat (line 51)

## Private helpers
TYPE_NAMES (line 4) · TYPE_CODES (line 44) · WITH_DECIMALS (line 47) · FRACTIONAL_SECONDS (line 49) · MIN_WIDTH (line 94)

## Symbols

### unpackFormat
*function* · line 57 · exported
- Used in: [[sav-reader.ts]], [[sav-writer.ts]]

### formatToString
*function* · line 62 · exported
> Format string for a packed format, or null when the type code is unknown.
- Uses: [[sav-formats.ts]]
- Used in: [[sav-reader.ts]], [[sav-writer.ts]]

### parseFormat
*function* · line 71 · exported
> Parse "F8.2", "a20", "DATETIME20" etc. Returns null when the text is not a known format.
- Uses: [[sav-formats.ts]]

### formatTypeCode
*function* · line 81 · exported
- Uses: [[sav-formats.ts]]

### packFormat
*function* · line 85 · exported
- Used in: [[sav-writer.ts]]

### isStringFormatType
*function* · line 89 · exported

### packNumericFormat
*function* · line 105 · exported
> Pack a numeric variable's format for writing. The format type comes from `format`; for the plain numeric types (F, COMMA, DOLLAR, PCT, ...) width and decimals come from the variable's Width/Decimals fields, which are what users edit. Unk...
- Calls: [[sav-formats.ts#isStringFormatType|isStringFormatType()]], [[sav-formats.ts#packFormat|packFormat()]], [[sav-formats.ts#parseFormat|parseFormat()]]
- Uses: [[sav-formats.ts]]
- Used in: [[sav-writer.ts]]
