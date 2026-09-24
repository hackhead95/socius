---
id: src/lib/coding/survey.ts
type: module
file: src/lib/coding/survey.ts
area: lib/coding
---

# src/lib/coding/survey.ts

*Module* · area [[lib - coding|lib/coding]] · 65 lines

> Open-ended survey answers (a string variable of the active dataset) -> response documents.

## Imports
- [[coding-types.ts]] · type-only
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only, value

## Tested by
- [[dataset.test.ts]] · import

## Imported by
- [[ImportDialog.tsx]] · value
- [[example.ts]] · value
- [[dataset.test.ts]] · value

## Types
ResponseImport (line 8)

## Symbols

### buildResponseDocs
*function* · line 21 · exported
> One TextDoc per non-empty answer: kind 'response', caseIndex + varId set, attributes from the chosen variables (value labels where defined). The document name is the ID variable's value when given, else "Case <n>".
- Calls: [[core/data.ts#formatCell|formatCell()]], [[core/data.ts#isMissingValue|isMissingValue()]], [[core/types.ts#newId|newId()]], [[survey.ts#attrName|attrName()]]
- Used in: [[ImportDialog.tsx]], [[example.ts]], [[dataset.test.ts]]

### attrName
*function* · line 61 · exported
> Attribute key for a dataset variable: its name (short, stable in tables).
