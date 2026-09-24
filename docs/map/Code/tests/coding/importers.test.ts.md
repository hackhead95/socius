---
id: tests/coding/importers.test.ts
type: test
file: tests/coding/importers.test.ts
area: tests
---

# tests/coding/importers.test.ts

*Test file* · area [[tests]] · 104 lines

## Test cases
- **docx extraction**
  - keeps paragraphs, runs, tabs, breaks and entities
  - rejects non-docx input
- **text & CSV**
  - normalises text
  - decodes windows-1252 fallback
  - parses quoted CSV with embedded newlines and detects semicolons
  - round-trips CSV output
- **exports**
  - segment table includes attributes, parent code, text and memo
  - codebook DOCX is a valid Word file with the codes in a table
  - report HTML and DOCX contain definitions and quotes
  - report counts documents and responses separately and shows themes with their sub-codes

## Imports
- [[fflate]] · value
- [[coding-types.ts]] · type-only
- [[docxExports.ts]] · value
- [[exports.ts]] · value
- [[importers.ts]] · value
- [[vitest]] · value

## Calls
- [[docxExports.ts#codebookDocx|codebookDocx()]]
- [[importers.ts#decodeText|decodeText()]]
- [[importers.ts#extractDocxText|extractDocxText()]]
- [[importers.ts#normaliseText|normaliseText()]]
- [[importers.ts#parseCsv|parseCsv()]]
- [[exports.ts#reportCodeMeta|reportCodeMeta()]]
- [[exports.ts#reportData|reportData()]]
- [[docxExports.ts#reportDocx|reportDocx()]]
- [[exports.ts#reportFrequencyTable|reportFrequencyTable()]]
- [[exports.ts#reportHtml|reportHtml()]]
- [[exports.ts#segmentTable|segmentTable()]]
- [[importers.ts#toCsv|toCsv()]]

## Tests
- [[coding-types.ts]] · import
- [[docxExports.ts]] · import
- [[exports.ts]] · import
- [[importers.ts]] · import

## Private helpers
tinyDocx() (line 8) · project (line 51)
