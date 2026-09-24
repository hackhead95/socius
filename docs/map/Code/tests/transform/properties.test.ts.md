---
id: tests/transform/properties.test.ts
type: test
file: tests/transform/properties.test.ts
area: tests
---

# tests/transform/properties.test.ts

*Test file* · area [[tests]] · 536 lines

## Test cases
- **scanning values**
  - counts every distinct value, sorted, with system-missing separate
  - adds weighted counts when a weight is on (zero and missing weights count 0)
  - limits the cases scanned to the first N
  - scans text values without trailing spaces, keeping empty text as a value
  - scans several variables in the order asked, skipping unknown ids
- **missing-code heuristics**
  - recognises nines codes and negative codes
  - flags 8 and 9 on a 1 to 5 scale, and 999999 above incomes
  - does not flag 97 to 99 when they continue the other values (ages up to 96)
  - flags negative codes, but not a symmetric scale
  - flags text codes such as NA and DK
  - flags values whose label reads like a missing answer
- **grid rows and flags**
  - shows every observed value, labelled unobserved values and missing values, with flags
  - says "missing code" (not a warning) once the code is marked missing
  - does not call scale values unlabelled
  - keeps labelled, missing and flagged values when the display is limited, then the most common
- **status and summary**
  - reports suspected missing codes first, then unlabelled values, then complete
  - summarises valid, user-missing and system-missing cases (weighted too)
- **measurement level suggestion**
  - suggests Ordinal for an agreement scale and says why
  - suggests Scale for many values or decimals
  - suggests Nominal for two categories, text, and named categories
  - suggests Ordinal for consecutive unlabelled codes and Nominal for codes with gaps
  - suggests Scale for long rating scales, counts named as such, and dates
  - ignores missing codes when judging (8/9 do not break a 1 to 5 scale)
  - recognises ordered label families in either direction
- **label suggestions**
  - offers an agreement scale for 1 to 5, plus labels for missing codes
  - offers 1 to 7 only when values go above 5
  - offers yes/no for 0/1 and 1/2, and sex or gender when the name says so
  - offers nothing for values that fit no pattern, or that are already labelled
  - previews without changing, then fills only unlabelled values by default
  - marks suggested missing codes as missing, within the SPSS limit
- **editing drafts**
  - sets, sorts and removes value labels
  - marks and unmarks missing values, sorted
  - refuses a fourth missing value and explains why
  - allows a range plus one value, and explains values inside the range
  - refuses text missing values longer than 8 bytes
  - copies chosen properties between drafts
  - finds the other items of a battery
  - parses typed values by type
- **SPSS limits**
  - accepts a normal draft
  - explains labels over 120 bytes and variable labels over 256 bytes
  - explains too many missing values and bad formats
  - keeps the format family when width or decimals change
- **applying all edits as one change**
  - builds one new dataset, leaves the old one alone, and writes SPSS syntax
  - groups identical settings of a battery into one command each
  - writes syntax that clears missing values and quotes text values
  - returns the same dataset when nothing changed
  - detects changes regardless of label order or missing order
- **on the sample survey**
  - the .sav: 8/9 and 999999 are flagged but already missing; the CSV (no labels): flagged as suspected, with a Likert suggestion

## Imports
- [[node-fs|node:fs]] · dynamic
- [[core/types.ts]] · value
- [[io/index.ts]] · dynamic
- [[properties.ts]] · value
- [[transform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[properties.ts#applyPropertyDrafts|applyPropertyDrafts()]]
- [[properties.ts#applySuggestion|applySuggestion()]]
- [[properties.ts#batterySiblings|batterySiblings()]]
- [[properties.ts#buildRows|buildRows()]]
- [[properties.ts#copyDraftProps|copyDraftProps()]]
- [[properties.ts#describeMissingSpec|describeMissingSpec()]]
- [[properties.ts#draftChanges|draftChanges()]]
- [[properties.ts#draftFromVariable|draftFromVariable()]]
- [[properties.ts#draftIssues|draftIssues()]]
- [[transform/helpers.ts#ds|ds()]]
- [[properties.ts#formatFor|formatFor()]]
- [[properties.ts#isDraftChanged|isDraftChanged()]]
- [[properties.ts#labelLooksMissing|labelLooksMissing()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[properties.ts#missingCodeHints|missingCodeHints()]]
- [[properties.ts#orderedScaleOf|orderedScaleOf()]]
- [[properties.ts#parseValue|parseValue()]]
- [[properties.ts#previewSuggestion|previewSuggestion()]]
- [[properties.ts#propertiesSyntax|propertiesSyntax()]]
- [[properties.ts#removeMissingRange|removeMissingRange()]]
- [[properties.ts#scanVariable|scanVariable()]]
- [[properties.ts#scanVariables|scanVariables()]]
- [[properties.ts#setValueLabel|setValueLabel()]]
- [[properties.ts#statusOf|statusOf()]]
- [[properties.ts#suggestLabels|suggestLabels()]]
- [[properties.ts#suggestMeasure|suggestMeasure()]]
- [[properties.ts#summarise|summarise()]]
- [[properties.ts#toggleMissing|toggleMissing()]]
- [[properties.ts#valueKey|valueKey()]]
- [[transform/helpers.ts#vid|vid()]]

## Uses
- [[properties.ts#isNegativeCode|isNegativeCode()]]
- [[properties.ts#isNinesCode|isNinesCode()]]
- [[properties.ts#SPSS_LIMITS|SPSS_LIMITS]]

## Tests
- [[Transforms/scale|scale]] · transform id
- [[core/types.ts]] · import
- [[io/index.ts]] · import
- [[properties.ts]] · import

## Private helpers
AGREE (line 11) · survey() (line 19) · V() (line 29)
