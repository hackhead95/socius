---
id: src/lib/transform/properties.ts
type: module
file: src/lib/transform/properties.ts
area: lib/transform
---

# src/lib/transform/properties.ts

*Module* · area [[lib - transform|lib/transform]] · 1014 lines

> Define Variable Properties (Data menu): scan the values a variable really has, spot unlabelled values and codes that look like missing answers, suggest a measurement level and common value labels, and apply all edits as one undoable change with equivalent SPSS syntax. Pure: no React, no store. The dialog lives in src/features/data/DefineProperties.tsx.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[encoding.ts]] · value
- [[dsops.ts]] · value
- [[syntax.ts]] · value

## Calls
- [[core/data.ts#isUserMissing|isUserMissing()]]
- [[dsops.ts#maxOf|maxOf()]]
- [[dsops.ts#minOf|minOf()]]

## Tested by
- [[data-fixes.test.ts]] · import
- [[properties.test.ts]] · import

## Imported by
- [[DefineProperties.tsx]] · value
- [[mutations.ts]] · re-export
- [[VarDialogs.tsx]] · value
- [[data-fixes.test.ts]] · value
- [[properties.test.ts]] · value

## Types
ValueCount (line 63) · VarScan (line 70) · ScanOptions (line 82) · PropsDraft (line 133) · DraftChanges (line 167) · MissingToggle (line 224) · CopyableProp (line 272) · DraftIssue (line 309) · FlagKind (line 424) · RowFlag (line 426) · GridRow (line 435) · GridRows (line 447) · VarStatus (line 519) · StatusInfo (line 521) · ScanSummary (line 538) · MeasureSuggestion (line 672) · LabelSuggestion (line 731) · SuggestionPreviewRow (line 806) · AppliedSuggestion (line 822) · PropertiesResult (line 883) · CopyProp (line 935)

## Private helpers
sameValue() (line 38) · labelsEqual() (line 153) · missingEqual() (line 159) · sortLabels() (line 201) · normaliseMissing() (line 256) · MISSING_WORDS (line 354) · STRING_MISSING (line 362) · rangeOf() (line 379) · substantiveLabelled() (line 456) · flagsFor() (line 463) · ORDERED_FAMILIES (line 565) · COUNT_WORDS (line 678) · LEVEL_NAME (line 680) · ellipsis() (line 686) · AGREE5 (line 741) · AGREE7 (line 742) · numbered() (line 744) · missingLabelFor() (line 748) · LEVEL_KEYWORD (line 850) · groupBy() (line 852) · ROLE_KEYWORD (line 952)

## Symbols

### SPSS_LIMITS
*const* · line 16 · exported
> The limits the .sav writer (src/lib/io/sav-writer.ts) enforces when saving.
- Used in: [[properties.test.ts]]

### DEFAULT_MAX_VALUES
*const* · line 27 · exported
- Used in: [[DefineProperties.tsx]]

### SCALE_MIN_UNIQUE
*const* · line 29 · exported
> Unique whole-number values at which a variable is suggested as Scale (SPSS uses 24 too).

### valueKey
*function* · line 34 · exported
> Stable key for a value (numbers and strings never collide; strings ignore trailing spaces).
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### sortValues
*function* · line 42 · exported

### displayValue
*function* · line 47 · exported
> How a value is shown: numbers plainly, empty text as "(empty)".
- Used in: [[DefineProperties.tsx]]

### parseValue
*function* · line 53 · exported
> Parse what the user typed as a value of this type (null when it is not a valid number).
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### scanVariable
*function* · line 91 · exported
> Count every distinct value of a variable. All cases are scanned (a filter does not hide values from the dictionary); counts are weighted too when a weight is on.
- Calls: [[core/data.ts#caseWeights|caseWeights()]]
- Used in: [[properties.test.ts]]

### scanVariables
*function* · line 121 · exported
- Calls: [[core/data.ts#caseWeights|caseWeights()]], [[properties.ts#scanVariable|scanVariable()]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### draftFromVariable
*function* · line 142 · exported
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### draftChanges
*function* · line 175 · exported
- Calls: [[properties.ts]]
- Used in: [[properties.test.ts]]

### isDraftChanged
*function* · line 185 · exported
- Calls: [[properties.ts#draftChanges|draftChanges()]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### labelFor
*function* · line 190 · exported
- Calls: [[properties.ts]]
- Used in: [[DefineProperties.tsx]]

### setValueLabel
*function* · line 195 · exported
> Set (or, with empty text, remove) the label of one value. Labels stay sorted by value.
- Calls: [[properties.ts]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### isMissingIn
*function* · line 205 · exported
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]]

### missingLimitProblem
*function* · line 210 · exported
> Why one more discrete missing value cannot be added, or null when it can.
- Calls: [[encoding.ts#utf8ByteLength|utf8ByteLength()]], [[properties.ts#rangeText|rangeText()]]
- Uses: [[properties.ts#SPSS_LIMITS|SPSS_LIMITS]], [[properties.ts#displayValue|displayValue()]]

### toggleMissing
*function* · line 231 · exported
> Mark or unmark one value as user-missing, respecting the SPSS limits.
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]], [[properties.ts#displayValue|displayValue()]], [[properties.ts#missingLimitProblem|missingLimitProblem()]], [[properties.ts#rangeText|rangeText()]], [[properties.ts]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### removeMissingRange
*function* · line 252 · exported
> Remove the missing range (keeping single missing values).
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### rangeText
*function* · line 261 · exported

### describeMissingSpec
*function* · line 265 · exported
- Calls: [[properties.ts#rangeText|rangeText()]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### COPYABLE_PROPS
*const* · line 274 · exported
- Used in: [[DefineProperties.tsx]]

### copyDraftProps
*function* · line 282 · exported
> Copy chosen properties from one draft to another (both variables must have the same type).
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### batterySiblings
*function* · line 295 · exported
> Other items of the same battery: variables named like this one with a different number (trust1 -> trust2 ... trust5; q12a -> q12b is not matched) and the same type.
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### draftIssues
*function* · line 315 · exported
- Calls: [[core/data.ts#isDateFormat|isDateFormat()]], [[encoding.ts#utf8ByteLength|utf8ByteLength()]], [[properties.ts#displayValue|displayValue()]], [[properties.ts#rangeText|rangeText()]]
- Uses: [[properties.ts#SPSS_LIMITS|SPSS_LIMITS]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### formatFor
*function* · line 345 · exported
> The SPSS format for a width/decimals change, keeping the family (F, COMMA, DOLLAR, DATE...).
- Calls: [[core/data.ts#isDateFormat|isDateFormat()]]
- Used in: [[properties.test.ts]]

### labelLooksMissing
*function* · line 358 · exported
> True when a value label reads like a missing answer ("Don't know", "Refused", "Not applicable"...).
- Uses: [[properties.ts]]
- Used in: [[properties.test.ts]]

### isNinesCode
*function* · line 365 · exported
> A code made of nines (9, 99, 999...) or nines ending in 8 or 7 (98, 997...). One digit: 8 or 9.
- Used in: [[properties.test.ts]]

### isNegativeCode
*function* · line 373 · exported
> Negative codes used for "not asked" or "refused": -1 to -9, and -77, -88, -99, -999, -98...
- Calls: [[properties.ts#isNinesCode|isNinesCode()]]
- Used in: [[properties.test.ts]]

### missingCodeHints
*function* · line 389 · exported
> Values that look like codes for a missing answer, with the reason (keyed by valueKey). Looks at the observed values and the value labels.
- Calls: [[dsops.ts#maxOf|maxOf()]], [[dsops.ts#minOf|minOf()]], [[properties.ts#labelLooksMissing|labelLooksMissing()]], [[properties.ts#valueKey|valueKey()]], [[properties.ts]]
- Uses: [[properties.ts#isNegativeCode|isNegativeCode()]], [[properties.ts#isNinesCode|isNinesCode()]], [[properties.ts]]
- Used in: [[data-fixes.test.ts]], [[properties.test.ts]]

### buildRows
*function* · line 490 · exported
> Rows for the value grid: every observed value plus labelled or missing values that do not occur. When there are more than `maxValues`, labelled, missing and flagged values are always kept and the most frequent of the rest fill the remain...
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]], [[properties.ts#labelFor|labelFor()]], [[properties.ts#missingCodeHints|missingCodeHints()]], [[properties.ts#valueKey|valueKey()]], [[properties.ts]]
- Uses: [[properties.ts#DEFAULT_MAX_VALUES|DEFAULT_MAX_VALUES]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### statusOf
*function* · line 528 · exported
- Calls: [[properties.ts#buildRows|buildRows()]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### summarise
*function* · line 548 · exported
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### orderedScaleOf
*function* · line 655 · exported
> Do these labels (in value order) follow an ordered answer scale? Returns its name, or null.
- Uses: [[properties.ts]]
- Used in: [[properties.test.ts]]

### measureName
*function* · line 682 · exported
- Uses: [[properties.ts]]
- Used in: [[DefineProperties.tsx]]

### suggestMeasure
*function* · line 693 · exported
> Suggest a measurement level from the values and labels, with a plain-English reason.
- Calls: [[core/data.ts#isDateFormat|isDateFormat()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[dsops.ts#fmtN|fmtN()]], [[properties.ts#missingCodeHints|missingCodeHints()]], [[properties.ts#orderedScaleOf|orderedScaleOf()]], [[properties.ts#valueKey|valueKey()]], [[properties.ts]]
- Uses: [[properties.ts#SCALE_MIN_UNIQUE|SCALE_MIN_UNIQUE]], [[properties.ts]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### suggestLabels
*function* · line 766 · exported
> Common label sets that fit the values of this variable: agreement scales (1 to 5, 1 to 7), yes/no (0/1 or 1/2), sex or gender (1/2) and labels for suspected missing codes. Offered as a preview; nothing changes until the user accepts one.
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]], [[dsops.ts#maxOf|maxOf()]], [[properties.ts#labelFor|labelFor()]], [[properties.ts#missingCodeHints|missingCodeHints()]], [[properties.ts#valueKey|valueKey()]], [[properties.ts]]
- Uses: [[properties.ts#displayValue|displayValue()]], [[properties.ts]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### previewSuggestion
*function* · line 814 · exported
- Calls: [[properties.ts#labelFor|labelFor()]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### applySuggestion
*function* · line 830 · exported
- Calls: [[properties.ts#previewSuggestion|previewSuggestion()]], [[properties.ts#setValueLabel|setValueLabel()]], [[properties.ts#toggleMissing|toggleMissing()]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### propertiesSyntax
*function* · line 862 · exported
> Equivalent SPSS syntax for property changes (variables with identical settings share one command).
- Calls: [[properties.ts#describeMissingSpec|describeMissingSpec()]], [[properties.ts]], [[syntax.ts#lines|lines()]], [[syntax.ts#missingSyntax|missingSyntax()]], [[syntax.ts#q|q()]], [[syntax.ts#sv|sv()]], [[syntax.ts#valueLabelsSyntax|valueLabelsSyntax()]], [[syntax.ts#varList|varList()]]
- Uses: [[properties.ts]]
- Used in: [[properties.test.ts]]

### applyPropertyDrafts
*function* · line 892 · exported
> Apply every draft at once: one new Dataset (one undo step), the SPSS syntax, and a summary. Drafts for unchanged variables are ignored. Missing values are stored sorted.
- Calls: [[dsops.ts#bump|bump()]], [[dsops.ts#plural|plural()]], [[properties.ts#draftChanges|draftChanges()]], [[properties.ts#formatFor|formatFor()]], [[properties.ts#isDraftChanged|isDraftChanged()]], [[properties.ts#propertiesSyntax|propertiesSyntax()]], [[properties.ts]]
- Used in: [[DefineProperties.tsx]], [[properties.test.ts]]

### COPY_PROPS
*const* · line 937 · exported
- Used in: [[VarDialogs.tsx]]

### copyProperties
*function* · line 948 · exported
> Copy chosen properties from one variable to others of the same type (other targets are left alone).
- Calls: [[properties.ts#copyPropertiesTransform|copyPropertiesTransform()]]
- Used in: [[dataview.test.ts]]

### copyPropertiesTransform
*function* · line 959 · exported
> Copy variable properties as a logged transform: the new dataset, SPSS syntax (VALUE LABELS, MISSING VALUES, VARIABLE LEVEL, FORMATS, VARIABLE WIDTH / ALIGNMENT / ROLE, VARIABLE LABELS, like APPLY DICTIONARY with the source variable) and ...
- Calls: [[dsops.ts#bump|bump()]], [[dsops.ts#plural|plural()]], [[syntax.ts#lines|lines()]], [[syntax.ts#missingSyntax|missingSyntax()]], [[syntax.ts#q|q()]], [[syntax.ts#valueLabelsSyntax|valueLabelsSyntax()]], [[syntax.ts#varList|varList()]]
- Uses: [[properties.ts#COPY_PROPS|COPY_PROPS]], [[properties.ts]]
- Used in: [[VarDialogs.tsx]], [[data-fixes.test.ts]]
