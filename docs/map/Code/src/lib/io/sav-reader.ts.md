---
id: src/lib/io/sav-reader.ts
type: module
file: src/lib/io/sav-reader.ts
area: lib/io
---

# src/lib/io/sav-reader.ts

*Module* · area [[lib - io|lib/io]] · 1230 lines

> SPSS system file (.sav / .zsav) reader. Implements the system file format as documented by GNU PSPP ("System File Format"): file header, variable records with continuation records, value labels (types 3/4), documents (type 6), the extension records (type 7) SPSS, PSPP, R haven and Stata write, and the three data layouts (uncompressed, bytecode compressed, zlib compressed). Both byte orders are ...

## Imports
- [[fflate]] · value
- [[core/types.ts]] · type-only, value
- [[encoding.ts]] · value
- [[sav-formats.ts]] · value

## Calls
- [[encoding.ts#decodeTrimmed|decodeTrimmed()]]
- [[encoding.ts#encodingForCodepage|encodingForCodepage()]]
- [[sav-formats.ts#formatToString|formatToString()]]
- [[encoding.ts#isAscii|isAscii()]]
- [[encoding.ts#isValidUtf8|isValidUtf8()]]
- [[encoding.ts#makeDecoder|makeDecoder()]]
- [[core/types.ts#newId|newId()]]
- [[encoding.ts#normalizeEncodingName|normalizeEncodingName()]]
- [[sav-formats.ts#unpackFormat|unpackFormat()]]

## Tested by
- [[io.fuzz.test.ts]] · import
- [[sav-edge.test.ts]] · import
- [[sav-malformed.test.ts]] · import
- [[sav-perf.test.ts]] · import
- [[sav-read.test.ts]] · import
- [[sav-write.test.ts]] · import

## Imported by
- [[io/index.ts]] · value
- [[io.fuzz.test.ts]] · value
- [[sav-edge.test.ts]] · value
- [[sav-malformed.test.ts]] · value
- [[sav-perf.test.ts]] · value
- [[sav-read.test.ts]] · value
- [[sav-write.test.ts]] · value

## Types
SavReadOptions (line 17) · SavReadResult (line 23)

## Private helpers
DEFAULT_SYSMIS (line 36) · DEFAULT_HIGHEST (line 37) · DEFAULT_LOWEST (line 39) · Cursor (line 46) · ascii() (line 153) · readHeader() (line 159) · readDictionary() (line 205) · readExtension() (line 340) · parseLongStringLabels() (line 400) · parseLongStringMissing() (line 424) · collectDictionaryText() (line 445) · chooseEncoding() (line 478) · MEASURES (line 539) · ALIGNS (line 540) · ROLES (line 541) · decodeFull() (line 543) · parseKeyValueRecord() (line 547) · buildVariables() (line 597) · listNames() (line 835) · upsertLabel() (line 840) · readMissing() (line 846) · makePlan() (line 873) · growPlan() (line 885) · StringCache (line 898) · readData() (line 946) · inflateZsav() (line 1119)

## Symbols

### SavFormatError
*class* · line 29 · exported
> Thrown for files that cannot be read; the message is written for end users.
- Used in: [[io.fuzz.test.ts]], [[sav-malformed.test.ts]]

### parseVariableAttributes
*function* · line 560 · exported
> Parse subtype 18 text: `name:attr('v'\n'v2'\n)attr2('x'\n)/name2:...`.

### readSav
*function* · line 1171 · exported
> ---------------------------------------------------------------------------------------------
- Calls: [[core/types.ts#makeDataset|makeDataset()]], [[sav-reader.ts]]
- Used in: [[io/index.ts]], [[sav-edge.test.ts]], [[sav-malformed.test.ts]], [[sav-perf.test.ts]], [[sav-read.test.ts]], [[sav-write.test.ts]]
