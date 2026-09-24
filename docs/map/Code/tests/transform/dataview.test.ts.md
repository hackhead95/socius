---
id: tests/transform/dataview.test.ts
type: test
file: tests/transform/dataview.test.ts
area: tests
---

# tests/transform/dataview.test.ts

*Test file* · area [[tests]] · 194 lines

## Test cases
- **cell input parsing**
  - accepts numbers, labels, empty and rejects text
  - parses dates in the variable format
  - truncates strings to their width
- **numeric to string keeps labels and missing codes matching the data**
  - converts labels and missing values with the same format as the values
- **pasting a table with headings into an empty dataset**
  - detects a heading row and names the variables from it
- **long text in string variables**
  - widens the variable instead of cutting typed or pasted text
- **TSV clipboard**
  - parses Excel-style quoted fields and round-trips
- **writing blocks (paste / typing)**
  - extends cases and creates variables for extra columns
  - clears ranges
  - names new variables like SPSS
- **variable properties**
  - changes type with conversion
  - keeps the format family when changing width/decimals
  - copies properties to a Likert battery and duplicates variables
  - parses pasted value-label lines
  - reads questionnaire-style lists: 1) Yes, 2. No, 3 - Maybe, -9 = Refused
- **find and quick statistics**
  - finds values and labels in reading order, wrapping
  - summarises numeric and categorical columns

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · value
- [[find.ts]] · value
- [[gridEdit.ts]] · value
- [[mutations.ts]] · value
- [[VarDialogs.tsx]] · value
- [[transform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[mutations.ts#changeType|changeType()]]
- [[mutations.ts#clearRange|clearRange()]]
- [[transform/helpers.ts#col|col()]]
- [[mutations.ts#copyProperties|copyProperties()]]
- [[mutations.ts#defaultVarName|defaultVarName()]]
- [[transform/helpers.ts#ds|ds()]]
- [[mutations.ts#duplicateVariables|duplicateVariables()]]
- [[gridEdit.ts#editText|editText()]]
- [[find.ts#findNext|findNext()]]
- [[core/data.ts#formatRawValue|formatRawValue()]]
- [[mutations.ts#formatWith|formatWith()]]
- [[mutations.ts#looksLikeHeader|looksLikeHeader()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[mutations.ts#nameVariablesFromHeader|nameVariablesFromHeader()]]
- [[gridEdit.ts#parseCellInput|parseCellInput()]]
- [[gridEdit.ts#parseDateText|parseDateText()]]
- [[VarDialogs.tsx#parseLabelLines|parseLabelLines()]]
- [[gridEdit.ts#parseTsv|parseTsv()]]
- [[find.ts#summarizeColumn|summarizeColumn()]]
- [[gridEdit.ts#toTsv|toTsv()]]
- [[mutations.ts#writeTexts|writeTexts()]]

## Tests
- [[core/data.ts]] · import
- [[core/types.ts]] · import
- [[find.ts]] · import
- [[gridEdit.ts]] · import
- [[mutations.ts]] · import
- [[VarDialogs.tsx]] · import
