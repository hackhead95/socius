---
id: src/lib/coding/importers.ts
type: module
file: src/lib/coding/importers.ts
area: lib/coding
---

# src/lib/coding/importers.ts

*Module* · area [[lib - coding|lib/coding]] · 136 lines

> Source importers: .docx text extraction, CSV parsing, plain-text normalisation.

## Imports
- [[fflate]] · value

## Tested by
- [[importers.test.ts]] · import

## Imported by
- [[ExportDialogs.tsx]] · value
- [[ImportDialog.tsx]] · value
- [[coding/hooks.ts]] · value
- [[codebookIO.ts]] · value
- [[importers.test.ts]] · value

## Private helpers
decodeXmlEntities() (line 5)

## Symbols

### extractDocxText
*function* · line 21 · exported
> Extract plain text from a .docx: one line per paragraph (w:p), tabs and line breaks kept, each table cell paragraph on its own line. Tracked deletions, footnotes, headers and comments are ignored.
- Calls: [[importers.ts]]
- Used in: [[ImportDialog.tsx]], [[importers.test.ts]]

### normaliseText
*function* · line 59 · exported
> Normalise line endings and strip a BOM and trailing whitespace.
- Used in: [[ImportDialog.tsx]], [[importers.test.ts]]

### decodeText
*function* · line 64 · exported
> Decode bytes as UTF-8, falling back to windows-1252 when the bytes are not valid UTF-8.
- Used in: [[ExportDialogs.tsx]], [[ImportDialog.tsx]], [[importers.test.ts]]

### detectDelimiter
*function* · line 73 · exported
> Detect the delimiter from the first lines (comma, semicolon, tab).

### parseCsv
*function* · line 91 · exported
> RFC 4180 CSV parser (quoted fields, doubled quotes, embedded newlines).
- Calls: [[importers.ts#detectDelimiter|detectDelimiter()]]
- Used in: [[ImportDialog.tsx]], [[codebookIO.ts]], [[importers.test.ts]]

### toCsv
*function* · line 129 · exported
> Serialise rows as CSV (quotes where needed). Prefixed with a BOM so Excel reads UTF-8.
- Used in: [[coding/hooks.ts]], [[codebookIO.ts]], [[importers.test.ts]]
