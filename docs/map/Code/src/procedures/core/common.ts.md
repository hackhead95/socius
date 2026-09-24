---
id: src/procedures/core/common.ts
type: module
file: src/procedures/core/common.ts
area: procedures
---

# src/procedures/core/common.ts

*Module* · area [[procedures]] · 403 lines

> Helpers shared by the core statistics procedures: case selection, category handling, output building, plain-language wording (APA numbers, effect-size labels) and SPSS syntax fragments.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · value
- [[procedure.ts]] · type-only
- [[core/types.ts]] · value

## Tested by
- [[sample-survey.test.ts]] · import

## Imported by
- [[correlations.ts]] · value
- [[core/crosstabs.ts]] · value
- [[core/descriptives.ts]] · value
- [[core/frequencies.ts]] · value
- [[core/nonparametric.ts]] · value
- [[oneway.ts]] · value
- [[ttests.ts]] · value
- [[graphs/index.ts]] · value
- [[sample-survey.test.ts]] · value

## Types
TwoGroups (line 340)

## Symbols

### optBool
*function* · line 22 · exported
> --------------------------------------------------------------------------------------------- Options ---------------------------------------------------------------------------------------------
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### optNum
*function* · line 27 · exported
- Used in: [[core/descriptives.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### optStr
*function* · line 33 · exported
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[ttests.ts]]

### parseNumberList
*function* · line 39 · exported
> Parse "10, 90" / "10 90" into numbers; throws a readable error on bad input.
- Uses: [[core/common.ts#text|text()]]
- Used in: [[core/frequencies.ts]], [[core/nonparametric.ts]]

### vars
*function* · line 56 · exported
> --------------------------------------------------------------------------------------------- Variables and values ---------------------------------------------------------------------------------------------
- Calls: [[core/data.ts#requireVariable|requireVariable()]]
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### one
*function* · line 60 · exported
- Calls: [[core/data.ts#requireVariable|requireVariable()]]
- Used in: [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### vlabel
*function* · line 67 · exported
> Label for tables: variable label if present, else name.
- Calls: [[core/data.ts#varDisplayName|varDisplayName()]]
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### vprose
*function* · line 75 · exported
> Short name for prose: the label if it is short, else the name. Labels phrased as survey questions ("How many years have you lived here?") read badly inside a sentence, so those use the name too.
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]]

### requireNumeric
*function* · line 80 · exported
- Used in: [[correlations.ts]], [[core/descriptives.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### valueKey
*function* · line 85 · exported
> Canonical key of a raw value (trailing spaces trimmed for strings).
- Used in: [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/nonparametric.ts]], [[oneway.ts]]

### sameValue
*function* · line 89 · exported
- Used in: [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### coerceValue
*function* · line 95 · exported
> Parse a group value from option input (numbers for numeric variables).
- Used in: [[core/nonparametric.ts]], [[ttests.ts]]

### valueText
*function* · line 104 · exported
- Calls: [[core/data.ts#categoryLabel|categoryLabel()]]
- Used in: [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### categoriesOf
*function* · line 111 · exported
> Sorted distinct valid values of a variable among `rows`.
- Calls: [[core/common.ts#valueKey|valueKey()]]
- Used in: [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/nonparametric.ts]], [[oneway.ts]]

### numericValues
*function* · line 121 · exported
- Used in: [[correlations.ts]], [[core/descriptives.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### decFmt
*function* · line 134 · exported
> Number format for statistics of a variable: its print decimals plus `extra` (at most 4). With the default extra of 2 (means, SDs) at least 2 decimals are shown; with extra 0 (minimum, maximum, mode) the variable's own decimals are used, ...
- Used in: [[correlations.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[oneway.ts]], [[ttests.ts]]

### weightVar
*function* · line 144 · exported
> --------------------------------------------------------------------------------------------- Case notes and syntax ---------------------------------------------------------------------------------------------
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### filterVar
*function* · line 148 · exported
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### fmtCount
*function* · line 152 · exported
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### filterCounts
*function* · line 158 · exported
> Counts cases removed by the filter (and zero/missing weights) separately.
- Calls: [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#caseWeights|caseWeights()]]
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### caseNote
*function* · line 171 · exported
> "N = 1,204 (weighted by wt); 12 excluded for missing values; 30 filtered out."
- Calls: [[core/common.ts#caseNoteTail|caseNoteTail()]], [[core/common.ts#fmtCount|fmtCount()]], [[core/common.ts#weightVar|weightVar()]]
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### caseNoteRange
*function* · line 183 · exported
> Case note for procedures where each variable uses its own valid cases (Descriptives, Frequencies): "N = 607 to 630 valid cases per variable; each variable uses its own valid cases (580 are valid on all 3); 30 filtered out by city."
- Calls: [[core/common.ts#caseNoteTail|caseNoteTail()]], [[core/common.ts#fmtCount|fmtCount()]], [[core/common.ts#weightVar|weightVar()]]
- Used in: [[core/descriptives.ts]]

### caseNoteTail
*function* · line 193
- Calls: [[core/common.ts#filterCounts|filterCounts()]], [[core/common.ts#filterVar|filterVar()]], [[core/common.ts#fmtCount|fmtCount()]]
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### selN
*function* · line 203 · exported
> Weighted N of a selection.
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### syntaxPrefix
*function* · line 209 · exported
- Calls: [[core/common.ts#filterVar|filterVar()]], [[core/common.ts#weightVar|weightVar()]]
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### names
*function* · line 218 · exported

### syntaxValue
*function* · line 223 · exported
> SPSS literal for a value in syntax.
- Used in: [[core/nonparametric.ts]], [[ttests.ts]]

### item
*function* · line 231 · exported
> --------------------------------------------------------------------------------------------- Output building ---------------------------------------------------------------------------------------------
- Calls: [[core/common.ts#syntaxPrefix|syntaxPrefix()]], [[core/types.ts#newId|newId()]]
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### tableBlock
*function* · line 235 · exported
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### text
*function* · line 236 · exported
- Output: [[text]]
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### heading
*function* · line 237 · exported
- Output: [[heading]]
- Used in: [[core/crosstabs.ts]], [[oneway.ts]]

### pcell
*function* · line 243 · exported
> Cell for a p-value, marked as noteworthy when below .05.
- Calls: [[output.ts#cell|cell()]]
- Used in: [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### nan
*function* · line 247 · exported
- Calls: [[output.ts#cell|cell()]]

### blank
*function* · line 248 · exported
- Calls: [[output.ts#cell|cell()]]
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### apaNum
*function* · line 255 · exported
> APA number: 2 decimals by default, leading zero dropped for bounded statistics.
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### apaP
*function* · line 264 · exported
> "p = .032" or "p < .001".
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[sample-survey.test.ts]]

### fmtDf
*function* · line 271 · exported
- Used in: [[oneway.ts]], [[ttests.ts]]

### fmtN
*function* · line 275 · exported
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[ttests.ts]]

### pct
*function* · line 279 · exported
- Used in: [[core/crosstabs.ts]], [[core/frequencies.ts]]

### sigWord
*function* · line 284 · exported
> "statistically significant" wording with the alpha level.
- Used in: [[core/crosstabs.ts]]

### labelD
*function* · line 289 · exported
> Cohen (1988) label for |d|: .2 small, .5 medium, .8 large.
- Used in: [[ttests.ts]]

### labelR
*function* · line 298 · exported
> Cohen (1988) label for |r| (and phi, rank-biserial r): .1 small, .3 medium, .5 large.
- Used in: [[correlations.ts]], [[core/nonparametric.ts]], [[ttests.ts]]

### labelV
*function* · line 307 · exported
> Cohen (1988) label for Cramér's V with df* = min(r, c) - 1: thresholds .1, .3, .5 divided by sqrt(df*).
- Used in: [[core/crosstabs.ts]]

### labelEta2
*function* · line 316 · exported
> Cohen (1988) label for eta squared / omega squared: .01 small, .06 medium, .14 large.
- Used in: [[core/nonparametric.ts]], [[oneway.ts]]

### labelW
*function* · line 324 · exported
> Kendall's W (Landis-Koch style conventions are not used; Cohen's r thresholds on W).
- Calls: [[core/common.ts#labelR|labelR()]]
- Used in: [[core/nonparametric.ts]]

### COHEN_NOTE
*const* · line 328 · exported
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]]

### listProse
*function* · line 331 · exported
> Join a list in prose: "a, b and c".
- Used in: [[correlations.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]]

### twoGroups
*function* · line 352 · exported
> Split selected cases into two groups by `gv`: either a pair of values or a cut point (cases >= cut form group 1, as SPSS).
- Calls: [[core/common.ts#coerceValue|coerceValue()]], [[core/common.ts#sameValue|sameValue()]], [[core/common.ts#syntaxValue|syntaxValue()]], [[core/common.ts#valueText|valueText()]]
- Used in: [[core/nonparametric.ts]], [[ttests.ts]]

### select
*function* · line 384 · exported
> Selection honouring filter/weights/missing over variables; convenience wrapper.
- Calls: [[core/data.ts#selectCases|selectCases()]]

### userMissing
*function* · line 389 · exported
> True when a raw value is user-missing (not system-missing).
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]]

### sumArr
*function* · line 393 · exported

### needCases
*function* · line 400 · exported
> Throws a readable error when there are too few cases.
- Calls: [[core/common.ts#fmtCount|fmtCount()]]
