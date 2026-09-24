---
id: src/core/data.ts
type: module
file: src/core/data.ts
area: core
---

# src/core/data.ts

*Module* · area [[core]] · 288 lines

> Shared data-access semantics. Statistics procedures, transforms, the grid and exporters must all use these so missing values, filters and weights behave identically everywhere.

## Imports
- [[core/types.ts]] · type-only

## Tested by
- [[commands-smoke-analyze.spec.ts]] · import
- [[gen-expr.ts]] · import
- [[proc-harness.ts]] · import
- [[procedures-oracle.fuzz.test.ts]] · import
- [[transforms-ops.fuzz.test.ts]] · import
- [[dataview.test.ts]] · import
- [[sample-oracle.test.ts]] · import
- [[transforms.test.ts]] · import

## Imported by
- [[commands-smoke-analyze.spec.ts]] · value
- [[TopBar.tsx]] · value
- [[ProcedureDialog.tsx]] · value
- [[starters.ts]] · value
- [[ImportDialog.tsx]] · value
- [[DataGrid.tsx]] · value
- [[DataView.tsx]] · value
- [[DefineProperties.tsx]] · value
- [[find.ts]] · value
- [[gridEdit.ts]] · value
- [[mutations.ts]] · value
- [[VarDialogs.tsx]] · value
- [[VariableView.tsx]] · value
- [[FileDialogs.tsx]] · value
- [[CasesDialogs.tsx]] · value
- [[ComputeDialog.tsx]] · value
- [[DeriveDialogs.tsx]] · value
- [[RecodeDialog.tsx]] · value
- [[tools/analysis.ts]] · value
- [[tools/data.ts]] · value
- [[transform.ts]] · value
- [[survey.ts]] · value
- [[toDataset.ts]] · value
- [[codebook.ts]] · value
- [[csv.ts]] · value
- [[infer.ts]] · value
- [[xlsx.ts]] · value
- [[aggregate.ts]] · value
- [[binning.ts]] · value
- [[cases.ts]] · value
- [[compute.ts]] · value
- [[derive.ts]] · value
- [[evaluate.ts]] · value
- [[merge.ts]] · value
- [[properties.ts]] · value
- [[recode.ts]] · value
- [[core/common.ts]] · value
- [[correlations.ts]] · value
- [[core/crosstabs.ts]] · value
- [[core/descriptives.ts]] · value
- [[core/frequencies.ts]] · value
- [[core/nonparametric.ts]] · value
- [[oneway.ts]] · value
- [[ttests.ts]] · value
- [[graphs/index.ts]] · value
- [[binary.ts]] · value
- [[models/common.ts]] · value
- [[linear.ts]] · value
- [[nomreg.ts]] · value
- [[plum.ts]] · value
- [[procedures/text.ts]] · value
- [[gen-expr.ts]] · value
- [[proc-harness.ts]] · value
- [[procedures-oracle.fuzz.test.ts]] · value
- [[transforms-ops.fuzz.test.ts]] · value
- [[dataview.test.ts]] · value
- [[sample-oracle.test.ts]] · value
- [[transforms.test.ts]] · value

## Types
CaseSelection (line 109)

## Private helpers
varName() (line 37) · SPSS_EPOCH_MS (line 176) · MONTHS (line 190) · pad() (line 191) · RESERVED (line 247)

## Symbols

### getVariable
*function* · line 6 · exported
- Used in: [[ComputeDialog.tsx]], [[tools/data.ts]], [[transform.ts]], [[compute.ts]]

### requireVariable
*function* · line 13 · exported
- Calls: [[core/data.ts#getVariable|getVariable()]]
- Used in: [[core/common.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]], [[binary.ts]], [[models/common.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]]

### getColumn
*function* · line 19 · exported

### numericColumn
*function* · line 25 · exported
- Calls: [[core/data.ts#getColumn|getColumn()]], [[core/data.ts]]

### stringColumn
*function* · line 31 · exported
- Calls: [[core/data.ts#getColumn|getColumn()]], [[core/data.ts]]

### isUserMissing
*function* · line 42 · exported
> True if a raw value is user-missing under the spec (does not check system-missing).
- Used in: [[starters.ts]], [[DataGrid.tsx]], [[VarDialogs.tsx]], [[tools/data.ts]], [[transform.ts]], [[cases.ts]], [[derive.ts]], [[evaluate.ts]], [[properties.ts]], [[recode.ts]], [[core/common.ts]], [[core/frequencies.ts]], [[gen-expr.ts]], [[proc-harness.ts]], [[transforms-ops.fuzz.test.ts]]

### isMissingValue
*function* · line 55 · exported
> True if value is system-missing (numeric NaN) or user-missing. Empty strings are NOT missing unless declared.
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]]
- Used in: [[commands-smoke-analyze.spec.ts]], [[find.ts]], [[DeriveDialogs.tsx]], [[transform.ts]], [[survey.ts]], [[aggregate.ts]], [[binning.ts]], [[derive.ts]], [[procedures-oracle.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]], [[sample-oracle.test.ts]]

### valueLabelFor
*function* · line 61 · exported
> Label for a value, or undefined. String comparison ignores trailing spaces (SPSS pads strings).
- Used in: [[find.ts]], [[tools/data.ts]], [[csv.ts]], [[xlsx.ts]], [[evaluate.ts]], [[recode.ts]], [[gen-expr.ts]]

### activeCaseMask
*function* · line 75 · exported
> Cases that are "in play" for analysis: passes the dataset filter (filterVarId: value non-zero and not missing). Returns a Uint8Array mask of length nCases (1 = include).
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]]
- Used in: [[TopBar.tsx]], [[DataGrid.tsx]], [[DataView.tsx]], [[find.ts]], [[DeriveDialogs.tsx]], [[tools/analysis.ts]], [[tools/data.ts]], [[transform.ts]], [[aggregate.ts]], [[binning.ts]], [[derive.ts]], [[core/common.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[nomreg.ts]], [[plum.ts]], [[transforms-ops.fuzz.test.ts]], [[transforms.test.ts]]

### caseWeights
*function* · line 94 · exported
> Case weights (length nCases). All 1 when no weight variable is set. Like SPSS, cases with missing, zero or negative weight get weight 0 (excluded). Fractional weights are kept as-is.
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]]
- Used in: [[find.ts]], [[DeriveDialogs.tsx]], [[tools/data.ts]], [[aggregate.ts]], [[derive.ts]], [[properties.ts]], [[core/common.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[nomreg.ts]], [[plum.ts]], [[transforms-ops.fuzz.test.ts]]

### selectCases
*function* · line 124 · exported
> Listwise case selection: active (filtered-in) cases with a positive weight and no missing value in ANY of the given variables. The standard entry point for procedures.
- Calls: [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#caseWeights|caseWeights()]], [[core/data.ts#isUserMissing|isUserMissing()]]
- Used in: [[tools/data.ts]], [[core/common.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]], [[binary.ts]], [[models/common.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]], [[procedures-oracle.fuzz.test.ts]]

### valuesAt
*function* · line 162 · exported
> Numeric values for the given rows (convenience for procedures).

### isWeighted
*function* · line 170 · exported
> True when the dataset has a weight variable in effect.

### isDateFormat
*function* · line 178 · exported
> 1582-10-14
- Used in: [[DefineProperties.tsx]], [[VarDialogs.tsx]], [[VariableView.tsx]], [[gridEdit.ts]], [[mutations.ts]], [[tools/data.ts]], [[codebook.ts]], [[properties.ts]]

### spssSecondsToDate
*function* · line 182 · exported
- Uses: [[core/data.ts]]
- Used in: [[evaluate.ts]]

### dateToSpssSeconds
*function* · line 186 · exported
- Uses: [[core/data.ts]]
- Used in: [[gridEdit.ts]], [[evaluate.ts]]

### formatRawValue
*function* · line 194 · exported
> Format a raw cell value for display (no value labels). System-missing numeric shows as ''.
- Calls: [[core/data.ts#isDateFormat|isDateFormat()]], [[core/data.ts#spssSecondsToDate|spssSecondsToDate()]], [[core/data.ts]]
- Uses: [[core/data.ts]]
- Used in: [[DataGrid.tsx]], [[DataView.tsx]], [[gridEdit.ts]], [[mutations.ts]], [[tools/data.ts]], [[compute.ts]], [[dataview.test.ts]]

### formatCell
*function* · line 221 · exported
> Display text for a cell: value label when `useLabels` and one exists, else formatted raw value.
- Calls: [[core/data.ts#formatRawValue|formatRawValue()]], [[core/data.ts#valueLabelFor|valueLabelFor()]]
- Used in: [[DataGrid.tsx]], [[DataView.tsx]], [[FileDialogs.tsx]], [[tools/data.ts]], [[transform.ts]], [[survey.ts]], [[csv.ts]]

### varDisplayName
*function* · line 230 · exported
> "Label (name)" or "name" — how variables are referred to in output tables.
- Used in: [[ImportDialog.tsx]], [[core/common.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]]

### categoryLabel
*function* · line 237 · exported
> Display text for a category value in output tables: its label, else the formatted value.
- Calls: [[core/data.ts#formatRawValue|formatRawValue()]], [[core/data.ts#isDateFormat|isDateFormat()]], [[core/data.ts#valueLabelFor|valueLabelFor()]]
- Used in: [[ProcedureDialog.tsx]], [[tools/analysis.ts]], [[tools/data.ts]], [[core/common.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]], [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[procedures/text.ts]]

### validateVarName
*function* · line 250 · exported
> Returns an error message, or null if `name` is a valid, unused SPSS variable name.
- Uses: [[core/data.ts]]
- Used in: [[mutations.ts]], [[infer.ts]], [[aggregate.ts]], [[binning.ts]], [[compute.ts]], [[derive.ts]], [[recode.ts]], [[transforms-ops.fuzz.test.ts]]

### uniqueVarName
*function* · line 261 · exported
> Make `base` into a valid unused name by sanitising and appending _1, _2, ...
- Uses: [[core/data.ts]]
- Used in: [[mutations.ts]], [[CasesDialogs.tsx]], [[DeriveDialogs.tsx]], [[RecodeDialog.tsx]], [[toDataset.ts]], [[infer.ts]], [[cases.ts]], [[derive.ts]], [[merge.ts]]

### distinctValues
*function* · line 275 · exported
> Distinct non-missing values of a variable among the given rows, sorted (numbers ascending, strings alpha).
- Calls: [[core/data.ts#isMissingValue|isMissingValue()]]
- Used in: [[ProcedureDialog.tsx]], [[tools/analysis.ts]], [[graphs/index.ts]], [[linear.ts]], [[proc-harness.ts]]
