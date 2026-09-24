---
id: src/features/data/mutations.ts
type: module
file: src/features/data/mutations.ts
area: features/data
---

# src/features/data/mutations.ts

*Module* · area [[features - data|features/data]] · 310 lines

> Immutable dataset edits used by the Data View and Variable View (all go through mutateDataset).

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only, value
- [[gridEdit.ts]] · value
- [[encoding.ts]] · value
- [[infer.ts]] · value
- [[properties.ts]] · re-export

## Tested by
- [[shell-fixes.test.ts]] · import
- [[data-fixes.test.ts]] · import
- [[dataview.test.ts]] · import

## Imported by
- [[DataView.tsx]] · value
- [[VarDialogs.tsx]] · value
- [[VariableView.tsx]] · value
- [[shell-fixes.test.ts]] · value
- [[data-fixes.test.ts]] · value
- [[dataview.test.ts]] · value

## Types
CellWrite (line 85) · WriteReport (line 91)

## Private helpers
MAX_STRING_WIDTH (line 11) · bump() (line 13) · NAME_CHAR (line 17) · RESERVED_WORDS (line 18) · growCases() (line 71)

## Symbols

### varNameProblem
*function* · line 26 · exported
> Why `raw` cannot be the name of variable `exceptId` (or of a new variable), in plain words with a suggestion where one helps; null when the name is fine. The rules are SPSS's (validateVarName): start with a letter (any alphabet, so Benga...
- Calls: [[core/data.ts#validateVarName|validateVarName()]], [[encoding.ts#utf8ByteLength|utf8ByteLength()]]
- Uses: [[mutations.ts]]
- Used in: [[VariableView.tsx]], [[shell-fixes.test.ts]]

### defaultVarName
*function* · line 56 · exported
> Next free default name VAR00001, VAR00002, ...
- Used in: [[dataview.test.ts]]

### newDefaultVariable
*function* · line 64 · exported
- Calls: [[core/types.ts#makeVariable|makeVariable()]], [[mutations.ts#defaultVarName|defaultVarName()]]
- Used in: [[DataView.tsx]], [[VariableView.tsx]]

### writeTexts
*function* · line 104 · exported
> Write a block of typed/pasted texts. Rows past the end add cases; columns past the end add variables (numeric if every value in that column is a number, else string).
- Calls: [[encoding.ts#utf8ByteLength|utf8ByteLength()]], [[gridEdit.ts#parseCellInput|parseCellInput()]], [[mutations.ts#newDefaultVariable|newDefaultVariable()]], [[mutations.ts]]
- Uses: [[mutations.ts]]
- Used in: [[DataView.tsx]], [[data-fixes.test.ts]], [[dataview.test.ts]]

### looksLikeHeader
*function* · line 183 · exported
> Does the first pasted row look like column headings (as when copying a table from Excel)? True when every heading is non-empty text that is not a number and at least one column below holds numbers.
- Used in: [[DataView.tsx]], [[dataview.test.ts]]

### nameVariablesFromHeader
*function* · line 196 · exported
> Rename variables from `start` on after pasted headings (invalid names are made valid; the heading becomes the label).
- Calls: [[infer.ts#variableNameFor|variableNameFor()]]
- Used in: [[DataView.tsx]], [[data-fixes.test.ts]], [[dataview.test.ts]]

### clearRange
*function* · line 214 · exported
> Clear a rectangle (sysmis for numbers, empty for text).
- Calls: [[mutations.ts]]
- Used in: [[DataView.tsx]], [[dataview.test.ts]]

### formatWith
*function* · line 230 · exported
> Keep the SPSS format family (F, COMMA, DOLLAR, DATE...) while changing width/decimals.
- Calls: [[core/data.ts#isDateFormat|isDateFormat()]]
- Used in: [[VariableView.tsx]], [[dataview.test.ts]]

### changeType
*function* · line 239 · exported
> Change type and/or format with sensible data conversion (dates parse from text, numbers format to text).
- Calls: [[core/data.ts#formatRawValue|formatRawValue()]], [[core/data.ts#isDateFormat|isDateFormat()]], [[gridEdit.ts#parseDateText|parseDateText()]], [[mutations.ts]]
- Used in: [[VarDialogs.tsx]], [[VariableView.tsx]], [[dataview.test.ts]]

### patchVariable
*function* · line 283 · exported
> Change dictionary properties of one variable (not its type; see changeType).
- Calls: [[mutations.ts]]
- Used in: [[VarDialogs.tsx]]

### duplicateVariables
*function* · line 292 · exported
> Duplicate variables (with data) right after each original, named <name>_copy.
- Calls: [[core/data.ts#uniqueVarName|uniqueVarName()]], [[core/types.ts#newId|newId()]], [[mutations.ts]]
- Used in: [[VariableView.tsx]], [[dataview.test.ts]]
