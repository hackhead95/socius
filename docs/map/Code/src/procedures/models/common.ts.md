---
id: src/procedures/models/common.ts
type: module
file: src/procedures/models/common.ts
area: procedures
---

# src/procedures/models/common.ts

*Module* · area [[procedures]] · 490 lines

> Shared helpers for the model procedures: option access, case notes, SPSS syntax preamble, APA number formatting, and predictor design (automatic dummy coding of categorical predictors).

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · value
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only, value
- [[procedures/text.ts]] · value

## Tested by
- [[fuzz-fixes.test.ts]] · import
- [[sample-survey.test.ts]] · import

## Imported by
- [[binary.ts]] · value
- [[models/factor.ts]] · value
- [[linear.ts]] · value
- [[nomreg.ts]] · value
- [[plum.ts]] · value
- [[models/reliability.ts]] · value
- [[fuzz-fixes.test.ts]] · value
- [[sample-survey.test.ts]] · value

## Types
Namer (line 94) · ReferenceChoice (line 209) · Term (line 211) · EmptyOutcomeCells (line 323)

## Symbols

### optBool
*function* · line 13 · exported
> ---------- Options ----------
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### optStr
*function* · line 17 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### optNum
*function* · line 21 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### slot
*function* · line 26 · exported
- Uses: [[models/common.ts#vars|vars()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### fmtP
*function* · line 33 · exported
> "p < .001" or "p = .032".
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[sample-survey.test.ts]]

### num
*function* · line 42 · exported
> Fixed decimals with thousands separators.
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### noLead
*function* · line 50 · exported
> Statistic that cannot exceed 1 in absolute value: drop the leading zero (".178"); never "-.00".
- Calls: [[procedures/text.ts#numText|numText()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### pct
*function* · line 54 · exported
- Used in: [[linear.ts]]

### dfText
*function* · line 59 · exported
> Degrees of freedom: integer when integral (unweighted), else one decimal (fractional weights).
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### dfCell
*function* · line 62 · exported
- Calls: [[output.ts#cell|cell()]]
- Used in: [[linear.ts]], [[models/reliability.ts]]

### coefCell
*function* · line 73 · exported
> Coefficient cell: 3 decimals, switching to scientific text for tiny non-zero magnitudes (like SPSS). With its standard error `se`, an estimate below 1e-9 standard errors is rounding noise around an exact zero (e.g. the intercept of balan...
- Calls: [[output.ts#cell|cell()]]
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### pCell
*function* · line 82 · exported
- Calls: [[output.ts#cell|cell()]]
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### textName
*function* · line 87 · exported
> How a variable is referred to in running text: its label when short, otherwise its name.
- Used in: [[linear.ts]]

### usableLabel
*function* · line 96
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### proseNamer
*function* · line 106 · exported
> One naming convention for all the prose of an analysis: labels when every variable involved has a short, statement-like label, otherwise variable names throughout. Mixing the two ("life_sat ... Age in completed years ... yrs_nbhd") reads...
- Calls: [[models/common.ts#usableLabel|usableLabel()]]
- Uses: [[models/common.ts#usableLabel|usableLabel()]]
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[fuzz-fixes.test.ts]]

### colProse
*function* · line 112 · exported
> A design column in prose: "age", or "region = North" for a dummy of a factor.
- Used in: [[binary.ts]], [[linear.ts]], [[plum.ts]]

### footName
*function* · line 117 · exported
> How a variable is referred to in table footnotes (SPSS shows labels).
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### listText
*function* · line 121 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### capitalize
*function* · line 127 · exported
- Used in: [[binary.ts]], [[linear.ts]], [[plum.ts]]

### weightedN
*function* · line 133 · exported
> ---------- Case notes and syntax ----------
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### caseNote
*function* · line 139 · exported
- Calls: [[models/common.ts#num|num()]], [[models/common.ts#weightedN|weightedN()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### syntaxPreamble
*function* · line 157 · exported
> FILTER / WEIGHT lines so the syntax reproduces the same case base in SPSS.
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### makeItem
*function* · line 170 · exported
- Calls: [[core/types.ts#newId|newId()]], [[procedures/text.ts#cleanBlocks|cleanBlocks()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### heading
*function* · line 174 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### textBlock
*function* · line 175 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### chartBlock
*function* · line 176 · exported
- Used in: [[models/factor.ts]], [[linear.ts]]

### vars
*function* · line 181 · exported
> ---------- Variables and values ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### numericValues
*function* · line 185 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### rawValues
*function* · line 193 · exported
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### levelsOf
*function* · line 199 · exported
> Distinct values (sorted: numbers ascending, strings alphabetically) with weighted counts.
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### isCategorical
*function* · line 232 · exported
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### spssLiteral
*function* · line 237
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### dummySyntaxName
*function* · line 241
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### buildTerms
*function* · line 251 · exported
> Build design columns for predictors (rows already selected). Categorical predictors (string, or nominal/ordinal with value labels when dummy coding is on) become 0/1 indicator columns for every level except the reference.
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[models/common.ts#dummySyntaxName|dummySyntaxName()]], [[models/common.ts#isCategorical|isCategorical()]], [[models/common.ts#levelsOf|levelsOf()]], [[models/common.ts#numericValues|numericValues()]], [[models/common.ts#rawValues|rawValues()]], [[models/common.ts#spssLiteral|spssLiteral()]], [[procedures/text.ts#labelOf|labelOf()]]
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### describeCols
*function* · line 299 · exported
> Names for a set of design columns, grouping dummies of the same factor: "educ_cat (Secondary, Vocational vs Primary)".
- Calls: [[models/common.ts#listText|listText()]]
- Used in: [[binary.ts]], [[linear.ts]], [[plum.ts]]

### HESSIAN_SINGULARITY_WARNING
*const* · line 320 · exported
> SPSS NOMREG / PLUM warning when the Hessian (information) matrix is singular.
- Used in: [[nomreg.ts]], [[plum.ts]]

### emptyOutcomeCells
*function* · line 338 · exported
> For each category of each factor, the outcome categories with no cases in it. An empty outcome-by-predictor cell makes the maximum-likelihood estimates of a (multinomial) logit model infinite: quasi-complete separation.
- Used in: [[nomreg.ts]], [[plum.ts]]

### orList
*function* · line 366 · exported
> "or" list: "A", "A or B", "A, B, or C".
- Used in: [[nomreg.ts]]

### emptyCellsText
*function* · line 373 · exported
> Plain-language description of empty cells: 'no cases with gender = "Other" have employ = "Student" or "Retired"'.
- Calls: [[models/common.ts#orList|orList()]]
- Used in: [[nomreg.ts]]

### selectAll
*function* · line 380 · exported
> Listwise case selection over all variables used by an analysis, with a friendly error if none remain.
- Calls: [[core/data.ts#selectCases|selectCases()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### standardizedHistogram
*function* · line 395 · exported
> Histogram of standardized values with a normal-curve overlay (weighted counts).
- Used in: [[linear.ts]]

### thin
*function* · line 422 · exported
> Evenly thinned index list (keeps charts under the renderer's point budget).
- Used in: [[linear.ts]]

### marginalCaseSummary
*function* · line 434 · exported
> SPSS "Case Processing Summary" for PLUM / NOMREG: the outcome's categories (and each factor's levels) with weighted N and marginal percentage, then Valid / Missing / Total / Subpopulation.
- Calls: [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[procedures/text.ts#labelOf|labelOf()]]
- Used in: [[nomreg.ts]], [[plum.ts]]

### countPatterns
*function* · line 473 · exported
> Number of distinct covariate patterns among the design columns.
- Used in: [[nomreg.ts]], [[plum.ts]]

### patternKeyFn
*function* · line 483 · exported
- Used in: [[plum.ts]]
