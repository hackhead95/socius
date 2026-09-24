---
id: src/lib/coding/exports.ts
type: module
file: src/lib/coding/exports.ts
area: lib/coding
---

# src/lib/coding/exports.ts

*Module* · area [[lib - coding|lib/coding]] · 224 lines

> Exports: coded segments table and the qualitative report (content + HTML). Word output lives in docxExports.ts so the docx library loads only when a Word file is requested.

## Imports
- [[coding-types.ts]] · type-only
- [[coding/analysis.ts]] · value
- [[tree.ts]] · value

## Tested by
- [[importers.test.ts]] · import

## Imported by
- [[ExportDialogs.tsx]] · value
- [[Reader.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[docxExports.ts]] · value
- [[importers.test.ts]] · value

## Types
Row (line 8) · ReportData (line 69)

## Symbols

### segmentTable
*function* · line 11 · exported
> Header + rows of all coded segments, one row per segment.
- Calls: [[coding/analysis.ts#attributeKeys|attributeKeys()]], [[exports.ts#originLabel|originLabel()]], [[tree.ts#codePath|codePath()]], [[tree.ts#parentName|parentName()]]
- Used in: [[RetrievalView.tsx]], [[ExportDialogs.tsx]], [[importers.test.ts]]

### originLabel
*function* · line 43 · exported
- Used in: [[Reader.tsx]], [[RetrievalView.tsx]]

### exampleQuotes
*function* · line 48 · exported
> Up to `n` example quotes for a code: distinct documents, preferring manual, medium-length passages.

### countWithSub
*function* · line 97 · exported
> "12 (15 with sub-codes)" for themes whose sub-codes add sources; plain count otherwise.

### reportData
*function* · line 103 · exported
> Assemble report content (shared by the HTML and DOCX renderers).
- Calls: [[coding/analysis.ts#codeFrequencies|codeFrequencies()]], [[exports.ts#exampleQuotes|exampleQuotes()]], [[tree.ts#buildCodeTree|buildCodeTree()]], [[tree.ts#codePath|codePath()]], [[tree.ts#flattenTree|flattenTree()]]
- Used in: [[ExportDialogs.tsx]], [[importers.test.ts]]

### escapeHtml
*function* · line 138 · exported

### reportHtml
*function* · line 143 · exported
> A standalone, printable HTML report.
- Calls: [[exports.ts#reportCodeMeta|reportCodeMeta()]], [[exports.ts#reportFrequencyTable|reportFrequencyTable()]]
- Uses: [[exports.ts#escapeHtml|escapeHtml()]]
- Used in: [[ExportDialogs.tsx]], [[importers.test.ts]]

### reportFrequencyTable
*function* · line 197 · exported
> The report's code frequency table as text cells: separate columns for documents and responses.
- Calls: [[exports.ts#countWithSub|countWithSub()]]
- Used in: [[docxExports.ts]], [[importers.test.ts]]

### reportCodeMeta
*function* · line 211 · exported
> "4 segments in 2 of 3 documents and 40 of 630 responses (6.3%)", mentioning sub-codes for themes.
- Used in: [[docxExports.ts]], [[importers.test.ts]]
