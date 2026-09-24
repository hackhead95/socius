---
id: src/lib/coding/docxExports.ts
type: module
file: src/lib/coding/docxExports.ts
area: lib/coding
---

# src/lib/coding/docxExports.ts

*Module* · area [[lib - coding|lib/coding]] · 148 lines

> Word (DOCX) exports: codebook table (thesis appendix) and the qualitative report.

## Imports
- [[docx]] · value
- [[coding-types.ts]] · type-only
- [[coding/analysis.ts]] · value
- [[exports.ts]] · value
- [[tree.ts]] · value

## Tested by
- [[importers.test.ts]] · import

## Imported by
- [[ExportDialogs.tsx]] · dynamic
- [[importers.test.ts]] · value

## Types
CodebookDocxOptions (line 51)

## Private helpers
FONT (line 23) · run() (line 25) · para() (line 29) · thinBorder (line 38) · cellBorders (line 39) · tcell() (line 41)

## Symbols

### codebookDocx
*function* · line 57 · exported
> Codebook as a Word table (for a thesis appendix). Landscape A4.
- Calls: [[coding/analysis.ts#codeFrequencies|codeFrequencies()]], [[docxExports.ts]], [[tree.ts#buildCodeTree|buildCodeTree()]], [[tree.ts#flattenTree|flattenTree()]]
- Used in: [[importers.test.ts]]

### reportDocx
*function* · line 98 · exported
> The same report as a Word document.
- Calls: [[docxExports.ts]], [[exports.ts#reportCodeMeta|reportCodeMeta()]], [[exports.ts#reportFrequencyTable|reportFrequencyTable()]]
- Used in: [[importers.test.ts]]
