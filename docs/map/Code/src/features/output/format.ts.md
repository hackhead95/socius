---
id: src/features/output/format.ts
type: module
file: src/features/output/format.ts
area: features/output
---

# src/features/output/format.ts

*Module* · area [[features - output|features/output]] · 174 lines

> Number formatting for output tables. Pure functions (unit-tested); every renderer and exporter (screen, clipboard, Word, HTML, Excel, text) formats cells through here so they always agree. Rules, by CellFormat: - int Rounded, thousands separators: 1,234. (Weighted counts are rounded like SPSS shows them.) - dec1..4 Fixed decimals, thousands separators from 1,000 up: 1,234.50. - pct One decimal....

## Imports
- [[output.ts]] · type-only

## Tested by
- [[findings-repro.test.ts]] · import
- [[invariants.ts]] · import
- [[procedures-oracle.fuzz.test.ts]] · import
- [[format.test.ts]] · import
- [[fuzz-fixes.test.ts]] · import

## Imported by
- [[explainPrompt.ts]] · value
- [[output/actions.ts]] · type-only
- [[exportDocx.ts]] · value
- [[exportText.ts]] · value
- [[exportXlsx.ts]] · value
- [[OutputTableView.tsx]] · value
- [[OutputViewer.tsx]] · value
- [[reportHtml.ts]] · type-only
- [[tableRender.ts]] · value
- [[viewPrefs.ts]] · type-only
- [[graphs/index.ts]] · value
- [[findings-repro.test.ts]] · value
- [[invariants.ts]] · value
- [[procedures-oracle.fuzz.test.ts]] · value
- [[format.test.ts]] · value
- [[fuzz-fixes.test.ts]] · value

## Types
TableStyle (line 20) · FormatContext (line 22) · FormattedCell (line 85) · GridCell (line 113)

## Private helpers
group() (line 28) · dropLeadingZero() (line 34) · PERCENT_HEADER (line 151)

## Symbols

### formatNumber
*function* · line 39 · exported
> Format a number by CellFormat.
- Calls: [[output/format.ts#formatP|formatP()]], [[output/format.ts]]
- Used in: [[OutputViewer.tsx]], [[exportText.ts]], [[format.test.ts]]

### formatP
*function* · line 77 · exported
> p-value text. APA: ".032", "< .001". SPSS: ".032", "<.001".
- Calls: [[output/format.ts]]
- Used in: [[graphs/index.ts]], [[format.test.ts]]

### formatCell
*function* · line 93 · exported
> Format one table cell.
- Calls: [[output/format.ts#formatNumber|formatNumber()]]
- Used in: [[explainPrompt.ts]], [[OutputTableView.tsx]], [[exportDocx.ts]], [[exportXlsx.ts]], [[tableRender.ts]], [[format.test.ts]]

### cellText
*function* · line 101 · exported
> Plain text of a cell including its mark (for text/Excel export and clipboard fallbacks).
- Calls: [[output/format.ts#formatCell|formatCell()]]
- Used in: [[format.test.ts]]

### isSignificantP
*function* · line 107 · exported
> True if a p-value cell is below .05 (used for subtle highlighting when the procedure did not set a tone).
- Used in: [[OutputTableView.tsx]], [[format.test.ts]]

### layoutRows
*function* · line 125 · exported
> Lay out rows of cells with colSpan/rowSpan onto absolute column positions (like an HTML table does), so exporters and the percent-column rule know which column every cell sits in.
- Used in: [[explainPrompt.ts]], [[OutputTableView.tsx]], [[exportDocx.ts]], [[exportXlsx.ts]], [[tableRender.ts]], [[findings-repro.test.ts]], [[invariants.ts]], [[procedures-oracle.fuzz.test.ts]], [[format.test.ts]], [[fuzz-fixes.test.ts]]

### percentColumns
*function* · line 158 · exported
> For each absolute column, whether its header (any header row covering it) names percentages. Header cells that span several columns count for each column only if they are the lowest header over that column, so a spanning "Sex" over "Coun...
- Calls: [[output/format.ts#layoutRows|layoutRows()]]
- Uses: [[output/format.ts]]
- Used in: [[OutputTableView.tsx]], [[exportDocx.ts]], [[exportXlsx.ts]], [[tableRender.ts]], [[format.test.ts]]

### stubCount
*function* · line 171 · exported
> Number of stub (row-header) columns.
- Used in: [[OutputTableView.tsx]], [[tableRender.ts]]
