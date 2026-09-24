---
id: src/lib/io/encoding.ts
type: module
file: src/lib/io/encoding.ts
area: lib/io
---

# src/lib/io/encoding.ts

*Module* · area [[lib - io|lib/io]] · 190 lines

> Text encoding helpers shared by the SPSS, CSV and XLSX code. Everything here works in the browser and in node (TextDecoder/TextEncoder are globals in both).

## Imported by
- [[mutations.ts]] · value
- [[csv.ts]] · value
- [[infer.ts]] · value
- [[sav-reader.ts]] · value
- [[sav-writer.ts]] · value
- [[properties.ts]] · value

## Private helpers
CODEPAGES (line 7) · fatalUtf8 (line 90)

## Symbols

### utf8Encoder
*const* · line 4 · exported
> Text encoding helpers shared by the SPSS, CSV and XLSX code. Everything here works in the browser and in node (TextDecoder/TextEncoder are globals in both).
- Used in: [[sav-writer.ts]]

### encodingForCodepage
*function* · line 57 · exported
> Encoding label for an SPSS subtype-3 character code, or null when the code says nothing useful (1 = EBCDIC, 2 = 7-bit ASCII, 3 = 8-bit ASCII, 4 = DEC Kanji, 0 or unknown numbers).
- Uses: [[encoding.ts]]
- Used in: [[sav-reader.ts]]

### normalizeEncodingName
*function* · line 62 · exported
> Normalise an encoding name as SPSS/PSPP/R write it (e.g. "CP1252", "UTF8", "ISO-8859-1") to a WHATWG label.
- Uses: [[encoding.ts]]
- Used in: [[sav-reader.ts]]

### makeDecoder
*function* · line 82 · exported
> A TextDecoder for `label`, or null when this runtime does not support it.
- Used in: [[sav-reader.ts]]

### isValidUtf8
*function* · line 93 · exported
> True when `bytes` is valid UTF-8 (pure ASCII counts as valid).
- Calls: [[encoding.ts#isAscii|isAscii()]]
- Uses: [[encoding.ts]]
- Used in: [[sav-reader.ts]]

### isAscii
*function* · line 103 · exported
- Used in: [[sav-reader.ts]]

### utf8ByteLength
*function* · line 109 · exported
> Number of bytes `s` takes in UTF-8, without allocating.
- Used in: [[mutations.ts]], [[infer.ts]], [[sav-writer.ts]], [[properties.ts]]

### truncateUtf8
*function* · line 127 · exported
> Cut `s` so its UTF-8 form has at most `maxBytes` bytes, never splitting a character.
- Calls: [[encoding.ts#utf8ByteLength|utf8ByteLength()]]
- Uses: [[encoding.ts#utf8Encoder|utf8Encoder]]
- Used in: [[infer.ts]], [[sav-writer.ts]]

### encodeUtf8Truncated
*function* · line 136 · exported
> Encode to UTF-8 and cut to `maxBytes` at a character boundary.
- Calls: [[encoding.ts#utf8ByteLength|utf8ByteLength()]]
- Uses: [[encoding.ts#utf8Encoder|utf8Encoder]]
- Used in: [[sav-writer.ts]]

### decodeTrimmed
*function* · line 146 · exported
> Decode `bytes[start, end)` after removing trailing spaces and NULs (SPSS pads strings with spaces; a few writers pad with NUL). Pure-ASCII runs skip the TextDecoder for speed.
- Used in: [[sav-reader.ts]]

### decodeText
*function* · line 163 · exported
> Decode a byte string for text files: strips a BOM, honours `encoding`, else UTF-8 with a windows-1252 fallback.
- Calls: [[encoding.ts#makeDecoder|makeDecoder()]], [[encoding.ts#normalizeEncodingName|normalizeEncodingName()]]
- Uses: [[encoding.ts]]
- Used in: [[csv.ts]]
