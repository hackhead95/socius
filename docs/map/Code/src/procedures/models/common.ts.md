---
id: src/procedures/models/common.ts
type: module
file: src/procedures/models/common.ts
area: procedures
---

# src/procedures/models/common.ts

*Module* · area [[procedures]] · 458 lines

> Shared helpers for the model procedures: option access, case notes, SPSS syntax preamble, APA number formatting, and predictor design (automatic dummy coding of categorical predictors).

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · value
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only, value

## Tested by
- [[sample-survey.test.ts]] · import

## Imported by
- [[binary.ts]] · value
- [[models/factor.ts]] · value
- [[linear.ts]] · value
- [[nomreg.ts]] · value
- [[plum.ts]] · value
- [[models/reliability.ts]] · value
- [[sample-survey.test.ts]] · value

## Types
ReferenceChoice (line 178) · Term (line 180) · EmptyOutcomeCells (line 292)

## Symbols

### optBool
*function* · line 12 · exported
> ---------- Options ----------
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### optStr
*function* · line 16 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### optNum
*function* · line 20 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### slot
*function* · line 25 · exported
- Uses: [[models/common.ts#vars|vars()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### fmtP
*function* · line 32 · exported
> "p < .001" or "p = .032".
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[sample-survey.test.ts]]

### num
*function* · line 41 · exported
> Fixed decimals with thousands separators.
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### noLead
*function* · line 47 · exported
> Statistic that cannot exceed 1 in absolute value: drop the leading zero (".178").
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### pct
*function* · line 53 · exported
- Used in: [[linear.ts]]

### dfText
*function* · line 58 · exported
> Degrees of freedom: integer when integral (unweighted), else one decimal (fractional weights).
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### dfCell
*function* · line 61 · exported
- Calls: [[output.ts#cell|cell()]]
- Used in: [[linear.ts]], [[models/reliability.ts]]

### coefCell
*function* · line 66 · exported
> Coefficient cell: 3 decimals, switching to scientific text for tiny non-zero magnitudes (like SPSS).
- Calls: [[output.ts#cell|cell()]]
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### pCell
*function* · line 74 · exported
- Calls: [[output.ts#cell|cell()]]
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### textName
*function* · line 79 · exported
> How a variable is referred to in running text: its label when short, otherwise its name.
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### footName
*function* · line 86 · exported
> How a variable is referred to in table footnotes (SPSS shows labels).
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### listText
*function* · line 90 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### capitalize
*function* · line 96 · exported
- Used in: [[binary.ts]], [[linear.ts]], [[plum.ts]]

### weightedN
*function* · line 102 · exported
> ---------- Case notes and syntax ----------
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### caseNote
*function* · line 108 · exported
- Calls: [[models/common.ts#num|num()]], [[models/common.ts#weightedN|weightedN()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### syntaxPreamble
*function* · line 126 · exported
> FILTER / WEIGHT lines so the syntax reproduces the same case base in SPSS.
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### makeItem
*function* · line 139 · exported
- Calls: [[core/types.ts#newId|newId()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### heading
*function* · line 143 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### textBlock
*function* · line 144 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### chartBlock
*function* · line 145 · exported
- Used in: [[models/factor.ts]], [[linear.ts]]

### vars
*function* · line 150 · exported
> ---------- Variables and values ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### numericValues
*function* · line 154 · exported
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### rawValues
*function* · line 162 · exported
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### levelsOf
*function* · line 168 · exported
> Distinct values (sorted: numbers ascending, strings alphabetically) with weighted counts.
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### isCategorical
*function* · line 201 · exported
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### spssLiteral
*function* · line 206
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### dummySyntaxName
*function* · line 210
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### buildTerms
*function* · line 220 · exported
> Build design columns for predictors (rows already selected). Categorical predictors (string, or nominal/ordinal with value labels when dummy coding is on) become 0/1 indicator columns for every level except the reference.
- Calls: [[core/data.ts#categoryLabel|categoryLabel()]], [[core/data.ts#requireVariable|requireVariable()]], [[models/common.ts#dummySyntaxName|dummySyntaxName()]], [[models/common.ts#isCategorical|isCategorical()]], [[models/common.ts#levelsOf|levelsOf()]], [[models/common.ts#numericValues|numericValues()]], [[models/common.ts#rawValues|rawValues()]], [[models/common.ts#spssLiteral|spssLiteral()]]
- Used in: [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### describeCols
*function* · line 268 · exported
> Names for a set of design columns, grouping dummies of the same factor: "educ_cat (Secondary, Vocational vs Primary)".
- Calls: [[models/common.ts#listText|listText()]]
- Used in: [[binary.ts]], [[linear.ts]], [[plum.ts]]

### HESSIAN_SINGULARITY_WARNING
*const* · line 289 · exported
> SPSS NOMREG / PLUM warning when the Hessian (information) matrix is singular.
- Used in: [[nomreg.ts]], [[plum.ts]]

### emptyOutcomeCells
*function* · line 307 · exported
> For each category of each factor, the outcome categories with no cases in it. An empty outcome-by-predictor cell makes the maximum-likelihood estimates of a (multinomial) logit model infinite: quasi-complete separation.
- Used in: [[nomreg.ts]], [[plum.ts]]

### orList
*function* · line 335 · exported
> "or" list: "A", "A or B", "A, B, or C".
- Used in: [[nomreg.ts]]

### emptyCellsText
*function* · line 342 · exported
> Plain-language description of empty cells: 'no cases with gender = "Other" have employ = "Student" or "Retired"'.
- Calls: [[models/common.ts#orList|orList()]]
- Used in: [[nomreg.ts]]

### selectAll
*function* · line 349 · exported
> Listwise case selection over all variables used by an analysis, with a friendly error if none remain.
- Calls: [[core/data.ts#selectCases|selectCases()]]
- Used in: [[binary.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### standardizedHistogram
*function* · line 364 · exported
> Histogram of standardized values with a normal-curve overlay (weighted counts).
- Used in: [[linear.ts]]

### thin
*function* · line 391 · exported
> Evenly thinned index list (keeps charts under the renderer's point budget).
- Used in: [[linear.ts]]

### marginalCaseSummary
*function* · line 403 · exported
> SPSS "Case Processing Summary" for PLUM / NOMREG: the outcome's categories (and each factor's levels) with weighted N and marginal percentage, then Valid / Missing / Total / Subpopulation.
- Calls: [[core/data.ts#categoryLabel|categoryLabel()]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]]
- Used in: [[nomreg.ts]], [[plum.ts]]

### countPatterns
*function* · line 441 · exported
> Number of distinct covariate patterns among the design columns.
- Used in: [[nomreg.ts]], [[plum.ts]]

### patternKeyFn
*function* · line 451 · exported
- Used in: [[plum.ts]]
