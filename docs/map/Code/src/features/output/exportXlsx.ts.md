---
id: src/features/output/exportXlsx.ts
type: module
file: src/features/output/exportXlsx.ts
area: features/output
---

# src/features/output/exportXlsx.ts

*Module* · area [[features - output|features/output]] · 103 lines

> Output tables -> .xlsx (one sheet per table). Numbers stay numbers with Excel formats that match the on-screen formatting; p < .001 is written as text so it never shows as 0.000.

## Imports
- [[output.ts]] · type-only
- [[output/format.ts]] · value
- [[write-excel-file]] · value

## Calls
- [[output/format.ts#formatCell|formatCell()]]

## Tested by
- [[export.test.ts]] · import

## Imported by
- [[output/actions.ts]] · dynamic
- [[export.test.ts]] · value

## Private helpers
FORMATS (line 9) · xcell() (line 20) · sheetName() (line 85)

## Symbols

### tableSheetData
*function* · line 39 · exported
> Sheet rows for one table: title, header rows, body, footnotes.
- Calls: [[exportXlsx.ts]], [[output/format.ts#layoutRows|layoutRows()]], [[output/format.ts#percentColumns|percentColumns()]]
- Used in: [[export.test.ts]]

### tablesToXlsx
*function* · line 94 · exported
> Workbook with one sheet per table.
- Calls: [[exportXlsx.ts#tableSheetData|tableSheetData()]], [[exportXlsx.ts]]
- Used in: [[export.test.ts]]
