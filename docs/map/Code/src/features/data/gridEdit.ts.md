---
id: src/features/data/gridEdit.ts
type: module
file: src/features/data/gridEdit.ts
area: features/data
---

# src/features/data/gridEdit.ts

*Module* · area [[features - data|features/data]] · 152 lines

> Parsing typed/pasted cell text and TSV clipboard data for the Data View.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only

## Calls
- [[core/data.ts#dateToSpssSeconds|dateToSpssSeconds()]]

## Tested by
- [[dataview.test.ts]] · import

## Imported by
- [[DataGrid.tsx]] · value
- [[DataView.tsx]] · value
- [[mutations.ts]] · value
- [[dataview.test.ts]] · value

## Types
ParseResult (line 6)

## Private helpers
MONTHS (line 8) · mkDate() (line 10) · fullYear() (line 19) · dateHint() (line 54)

## Symbols

### parseDateText
*function* · line 24 · exported
> Parse date/time text for a date-formatted variable. Returns SPSS seconds or null.
- Calls: [[gridEdit.ts]]
- Uses: [[gridEdit.ts]]
- Used in: [[mutations.ts]], [[dataview.test.ts]]

### parseCellInput
*function* · line 65 · exported
> Parse what the user typed into a cell. Accepts value labels for labelled variables.
- Calls: [[core/data.ts#isDateFormat|isDateFormat()]], [[gridEdit.ts#parseDateText|parseDateText()]], [[gridEdit.ts]]
- Used in: [[DataView.tsx]], [[mutations.ts]], [[dataview.test.ts]]

### editText
*function* · line 87 · exported
> Text shown in the editor when editing an existing value. Keeps full precision.
- Calls: [[core/data.ts#formatRawValue|formatRawValue()]], [[core/data.ts#isDateFormat|isDateFormat()]]
- Used in: [[DataGrid.tsx]], [[dataview.test.ts]]

### parseTsv
*function* · line 95 · exported
> Parse tab-separated clipboard text (Excel/Sheets style, with quoted fields).
- Used in: [[DataView.tsx]], [[dataview.test.ts]]

### toTsv
*function* · line 148 · exported
- Used in: [[DataView.tsx]], [[dataview.test.ts]]
