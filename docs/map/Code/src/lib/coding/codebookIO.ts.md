---
id: src/lib/coding/codebookIO.ts
type: module
file: src/lib/coding/codebookIO.ts
area: lib/coding
---

# src/lib/coding/codebookIO.ts

*Module* · area [[lib - coding|lib/coding]] · 175 lines

> Codebook import/export as JSON and CSV. Hierarchy is kept via parent names (CSV) or ids (JSON).

## Imports
- [[coding-types.ts]] · type-only
- [[core/types.ts]] · value
- [[importers.ts]] · value
- [[palette.ts]] · value
- [[tree.ts]] · value

## Tested by
- [[codebook.test.ts]] · import

## Imported by
- [[ExportDialogs.tsx]] · value
- [[codebook.test.ts]] · value

## Private helpers
str() (line 53)

## Symbols

### CODEBOOK_CSV_COLUMNS
*const* · line 9 · exported

### codebookToCsv
*function* · line 11 · exported
- Calls: [[importers.ts#toCsv|toCsv()]], [[tree.ts#orderedCodes|orderedCodes()]], [[tree.ts#parentName|parentName()]]
- Uses: [[codebookIO.ts#CODEBOOK_CSV_COLUMNS|CODEBOOK_CSV_COLUMNS]]
- Used in: [[ExportDialogs.tsx]], [[codebook.test.ts]]

### codebookToJson
*function* · line 19 · exported
- Calls: [[tree.ts#orderedCodes|orderedCodes()]], [[tree.ts#parentName|parentName()]]
- Used in: [[ExportDialogs.tsx]], [[codebook.test.ts]]

### parseCodebookJson
*function* · line 58 · exported
> Parse a codebook JSON (Socius format, or a plain array of {name, description, parent...}).
- Calls: [[codebookIO.ts]]
- Uses: [[codebookIO.ts]]
- Used in: [[ExportDialogs.tsx]], [[codebook.test.ts]]

### parseCodebookCsv
*function* · line 84 · exported
> Parse a codebook CSV with a header row (name required; parent, description... optional).
- Calls: [[importers.ts#parseCsv|parseCsv()]]
- Used in: [[ExportDialogs.tsx]], [[codebook.test.ts]]

### mergeCodebook
*function* · line 118 · exported
> Merge imported codes into an existing codebook. Codes whose name (case-insensitive, same parent) already exists are updated only where the existing field is empty; new codes are appended.
- Calls: [[core/types.ts#newId|newId()]], [[palette.ts#nextCodeColor|nextCodeColor()]], [[palette.ts#normaliseHex|normaliseHex()]]
- Used in: [[ExportDialogs.tsx]], [[codebook.test.ts]]
