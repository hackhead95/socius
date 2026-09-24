---
id: tests/output/export.test.ts
type: test
file: tests/output/export.test.ts
area: tests
---

# tests/output/export.test.ts

*Test file* · area [[tests]] · 94 lines

## Test cases
- **Word export**
  - produces a valid docx with tables, image and text
  - skips charts when no image is available and hides interpretations on request
- **HTML export**
  - builds a standalone document with APA tables
  - uses SPSS formatting in SPSS style
  - escapes user text
- **Text and Excel export**
  - renders aligned plain text
  - writes numbers as numbers and p < .001 as text

## Imports
- [[fflate]] · value
- [[exportDocx.ts]] · value
- [[exportText.ts]] · value
- [[exportXlsx.ts]] · value
- [[reportHtml.ts]] · value
- [[tableRender.ts]] · value
- [[fixtures.ts]] · value
- [[vitest]] · value

## Calls
- [[exportDocx.ts#buildDocx|buildDocx()]]
- [[reportHtml.ts#itemToHtml|itemToHtml()]]
- [[reportHtml.ts#reportToHtmlDocument|reportToHtmlDocument()]]
- [[exportText.ts#reportToText|reportToText()]]
- [[fixtures.ts#sampleItem|sampleItem()]]
- [[exportXlsx.ts#tableSheetData|tableSheetData()]]
- [[exportXlsx.ts#tablesToXlsx|tablesToXlsx()]]
- [[tableRender.ts#tableToHtml|tableToHtml()]]
- [[tableRender.ts#tableToText|tableToText()]]

## Uses
- [[fixtures.ts#TINY_PNG|TINY_PNG]]

## Tests
- [[exportDocx.ts]] · import
- [[exportText.ts]] · import
- [[exportXlsx.ts]] · import
- [[reportHtml.ts]] · import
- [[tableRender.ts]] · import

## Private helpers
opts (line 10)
