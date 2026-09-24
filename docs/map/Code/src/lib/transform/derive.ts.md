---
id: src/lib/transform/derive.ts
type: module
file: src/lib/transform/derive.ts
area: lib/transform
---

# src/lib/transform/derive.ts

*Module* · area [[lib - transform|lib/transform]] · 317 lines

> Derived variables: reverse-coding, scale scores, z-scores, counts, ranks.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only, value
- [[dsops.ts]] · value
- [[recode.ts]] · value
- [[syntax.ts]] · value

## Imported by
- [[transform/index.ts]] · re-export

## Types
ScaleRange (line 20) · ReverseSpec (line 44) · ScaleSpec (line 108) · CountSpec (line 200) · RankSpec (line 246)

## Private helpers
findVar() (line 12)

## Symbols

### DeriveError
*class* · line 10 · exported
- Used in: [[transforms-ops.fuzz.test.ts]]

### detectScaleRange
*function* · line 27 · exported
> Scale end points: from value labels (ignoring user-missing codes) when there are at least 2, else from the data.
- Calls: [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#isUserMissing|isUserMissing()]]
- Used in: [[DeriveDialogs.tsx]], [[transforms.test.ts]]

### reverseCode
*function* · line 53 · exported
- Calls: [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[core/data.ts#uniqueVarName|uniqueVarName()]], [[core/types.ts#newId|newId()]], [[derive.ts#DeriveError|DeriveError]], [[derive.ts#detectScaleRange|detectScaleRange()]], [[derive.ts]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#replaceVariable|replaceVariable()]], [[syntax.ts#lines|lines()]], [[syntax.ts#valueLabelsSyntax|valueLabelsSyntax()]], [[syntax.ts#variableLabelSyntax|variableLabelSyntax()]]
- Used in: [[DeriveDialogs.tsx]], [[transform.ts]], [[transforms-ops.fuzz.test.ts]], [[sample-survey.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]

### createScale
*function* · line 117 · exported
- Calls: [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#validateVarName|validateVarName()]], [[derive.ts#DeriveError|DeriveError]], [[derive.ts]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#fmtN|fmtN()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[dsops.ts#suggestDecimals|suggestDecimals()]], [[syntax.ts#lines|lines()]], [[syntax.ts#variableLabelSyntax|variableLabelSyntax()]]
- Used in: [[DeriveDialogs.tsx]], [[transform.ts]], [[transforms-ops.fuzz.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]

### standardize
*function* · line 153 · exported
> ---------- Standardize (DESCRIPTIVES /SAVE) ----------
- Calls: [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#caseWeights|caseWeights()]], [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#uniqueVarName|uniqueVarName()]], [[derive.ts#DeriveError|DeriveError]], [[derive.ts]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[syntax.ts#varList|varList()]]
- Used in: [[DeriveDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]

### countValues
*function* · line 207 · exported
- Calls: [[core/data.ts#validateVarName|validateVarName()]], [[derive.ts#DeriveError|DeriveError]], [[derive.ts]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[recode.ts#matchesFrom|matchesFrom()]], [[syntax.ts#lines|lines()]], [[syntax.ts#sv|sv()]], [[syntax.ts#varList|varList()]], [[syntax.ts#variableLabelSyntax|variableLabelSyntax()]]
- Used in: [[DeriveDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]

### rankColumn
*function* · line 255 · exported
> Ranks (1-based) of valid values; ties handled per `ties`. Returns NaN for excluded cases.
- Used in: [[transforms.test.ts]]

### rankCases
*function* · line 279 · exported
- Calls: [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#uniqueVarName|uniqueVarName()]], [[derive.ts#DeriveError|DeriveError]], [[derive.ts#rankColumn|rankColumn()]], [[derive.ts]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[dsops.ts#suggestDecimals|suggestDecimals()]], [[syntax.ts#varList|varList()]]
- Used in: [[DeriveDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]
