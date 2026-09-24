---
id: src/lib/io/sav-writer.ts
type: module
file: src/lib/io/sav-writer.ts
area: lib/io
---

# src/lib/io/sav-writer.ts

*Module* · area [[lib - io|lib/io]] · 688 lines

> SPSS system file (.sav / .zsav) writer. Produces files that SPSS (16 and later), PSPP, R haven and pyreadstat open: UTF-8 text (subtype 20 + code page 65001), long variable names, very long strings, long string value labels and missing values, display parameters and bytecode or zlib compression.

## Imports
- [[fflate]] · value
- [[core/types.ts]] · type-only
- [[encoding.ts]] · value
- [[sav-formats.ts]] · value

## Calls
- [[encoding.ts#encodeUtf8Truncated|encodeUtf8Truncated()]]
- [[sav-formats.ts#formatToString|formatToString()]]
- [[sav-formats.ts#packFormat|packFormat()]]
- [[sav-formats.ts#packNumericFormat|packNumericFormat()]]
- [[encoding.ts#truncateUtf8|truncateUtf8()]]
- [[sav-formats.ts#unpackFormat|unpackFormat()]]
- [[encoding.ts#utf8ByteLength|utf8ByteLength()]]

## Uses
- [[encoding.ts#utf8Encoder|utf8Encoder]]

## Tested by
- [[io.fuzz.test.ts]] · import
- [[sav-perf.test.ts]] · import
- [[sav-spssio.test.ts]] · import
- [[sav-write.test.ts]] · import

## Imported by
- [[io/index.ts]] · value
- [[io.fuzz.test.ts]] · value
- [[sav-perf.test.ts]] · value
- [[sav-spssio.test.ts]] · value
- [[sav-write.test.ts]] · value

## Types
SavCompression (line 11) · SavWriteOptions (line 13) · SavWriteResult (line 21)

## Private helpers
BIAS (line 27) · SYSMIS (line 28) · HIGHEST (line 29) · LOWEST (line 30) · MAX_STRING (line 36) · MAX_VAR_LABEL (line 37) · MAX_VALUE_LABEL (line 38) · ZBLOCK (line 39) · SPACE8 (line 40) · ByteWriter (line 43) · NAME_RE (line 132) · RESERVED (line 133) · sanitizeName() (line 135) · ShortNames (line 146) · segmentCount() (line 168) · planVariables() (line 172) · measureCode() (line 301) · alignCode() (line 304) · ROLE_CODES (line 307) · writeExtension() (line 309) · spssDate() (line 328) · asciiBytes() (line 337) · writeDictionary() (line 343) · makeRowFiller() (line 544) · writeBytecode() (line 595)

## Symbols

### writeSav
*function* · line 634 · exported
- Calls: [[sav-writer.ts]]
- Uses: [[sav-writer.ts]]
- Used in: [[io/index.ts]], [[io.fuzz.test.ts]], [[sav-perf.test.ts]], [[sav-spssio.test.ts]], [[sav-write.test.ts]]
