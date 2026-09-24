---
id: src/core/types.ts
type: module
file: src/core/types.ts
area: core
---

# src/core/types.ts

*Module* · area [[core]] · 133 lines

> Core data model. Mirrors the SPSS dictionary closely so .sav files round-trip without loss. Storage rules (every module relies on these): - Numeric columns are Float64Array. NaN means SYSTEM-missing (SPSS "sysmis", shown as "."). - String columns are string[]. '' is an empty string (never system-missing in SPSS semantics). - USER-missing values stay in the column as real values; `Variable.missi...

## Tested by
- [[features.test.ts]] · import
- [[navigation-audit.test.tsx]] · import
- [[palette.test.tsx]] · import
- [[search.test.ts]] · import
- [[shell-fixes.test.ts]] · import
- [[scenarios.test.ts]] · import
- [[units.test.ts]] · import
- [[dataset.test.ts]] · import
- [[example.test.ts]] · import
- [[io.fuzz.test.ts]] · import
- [[gen-data.ts]] · import
- [[gen-expr.ts]] · import
- [[proc-harness.ts]] · import
- [[procedures-oracle.fuzz.test.ts]] · import
- [[replay.test.ts]] · import
- [[transforms-expr.fuzz.test.ts]] · import
- [[transforms-ops.fuzz.test.ts]] · import
- [[csv.test.ts]] · import
- [[datasets.ts]] · import
- [[io/helpers.ts]] · import
- [[import.test.ts]] · import
- [[sav-perf.test.ts]] · import
- [[sav-write.test.ts]] · import
- [[xlsx.test.ts]] · import
- [[dialog-ui.test.tsx]] · import
- [[dialog.test.ts]] · import
- [[graphs.test.ts]] · import
- [[samples.test.ts]] · import
- [[stats-core/procedures.test.ts]] · import
- [[sample-survey.test.ts]] · import
- [[dataset.ts]] · import
- [[stats-models/procedures.test.ts]] · import
- [[separation.test.ts]] · import
- [[dataview.test.ts]] · import
- [[transform/helpers.ts]] · import
- [[history.test.ts]] · import
- [[properties.test.ts]] · import
- [[sample-oracle.test.ts]] · import

## Imported by
- [[CommandPalette.tsx]] · type-only
- [[ui-store.ts]] · type-only
- [[undo.ts]] · type-only
- [[core/data.ts]] · type-only
- [[procedure.ts]] · type-only
- [[store.ts]] · type-only, value
- [[ProcedureDialog.tsx]] · type-only
- [[varUtils.ts]] · type-only
- [[controller.ts]] · value
- [[starters.ts]] · type-only
- [[coding/actions.ts]] · value
- [[AiDialogs.tsx]] · value
- [[ExportDialogs.tsx]] · type-only
- [[ImportDialog.tsx]] · value
- [[DataGrid.tsx]] · type-only
- [[DataView.tsx]] · type-only
- [[DefineProperties.tsx]] · type-only
- [[find.ts]] · type-only
- [[gridEdit.ts]] · type-only
- [[mutations.ts]] · type-only, value
- [[VarDialogs.tsx]] · type-only
- [[VariableView.tsx]] · type-only
- [[install.ts]] · type-only
- [[fileActions.ts]] · type-only, value
- [[FileDialogs.tsx]] · type-only
- [[projectFile.ts]] · type-only
- [[CasesDialogs.tsx]] · type-only
- [[transform/common.tsx]] · type-only
- [[ComputeDialog.tsx]] · type-only
- [[DeriveDialogs.tsx]] · type-only
- [[MergeDialogs.tsx]] · type-only
- [[RecodeDialog.tsx]] · type-only
- [[TransformDialogs.tsx]] · type-only
- [[assistant/format.ts]] · type-only
- [[tools/analysis.ts]] · type-only, value
- [[tools/data.ts]] · type-only
- [[transform.ts]] · type-only, value
- [[assistant/types.ts]] · type-only
- [[codebookIO.ts]] · value
- [[example.ts]] · type-only, value
- [[outputs.ts]] · value
- [[survey.ts]] · type-only, value
- [[toDataset.ts]] · type-only, value
- [[codebook.ts]] · type-only
- [[csv.ts]] · type-only
- [[io/index.ts]] · type-only
- [[infer.ts]] · type-only, value
- [[sav-reader.ts]] · type-only, value
- [[sav-writer.ts]] · type-only
- [[xlsx.ts]] · type-only
- [[aggregate.ts]] · type-only, value
- [[binning.ts]] · type-only
- [[cases.ts]] · type-only
- [[compute.ts]] · type-only
- [[derive.ts]] · type-only, value
- [[dsops.ts]] · type-only, value
- [[evaluate.ts]] · type-only
- [[log.ts]] · value
- [[merge.ts]] · type-only, value
- [[properties.ts]] · type-only
- [[recode.ts]] · type-only
- [[syntax.ts]] · type-only
- [[core/common.ts]] · value
- [[correlations.ts]] · type-only
- [[core/crosstabs.ts]] · type-only
- [[core/descriptives.ts]] · type-only
- [[core/frequencies.ts]] · type-only
- [[core/nonparametric.ts]] · type-only
- [[oneway.ts]] · type-only
- [[ttests.ts]] · type-only
- [[graphs/index.ts]] · type-only, value
- [[binary.ts]] · type-only
- [[models/common.ts]] · type-only, value
- [[models/factor.ts]] · type-only
- [[linear.ts]] · type-only
- [[nomreg.ts]] · type-only
- [[plum.ts]] · type-only
- [[models/reliability.ts]] · type-only
- [[samples/index.ts]] · type-only
- [[MeasureIcon.tsx]] · type-only
- [[VarPicker.tsx]] · type-only
- [[features.test.ts]] · value
- [[navigation-audit.test.tsx]] · value
- [[palette.test.tsx]] · value
- [[search.test.ts]] · value
- [[shell-fixes.test.ts]] · value
- [[scenarios.test.ts]] · type-only
- [[units.test.ts]] · value
- [[dataset.test.ts]] · value
- [[example.test.ts]] · type-only
- [[io.fuzz.test.ts]] · value
- [[gen-data.ts]] · value
- [[gen-expr.ts]] · type-only
- [[proc-harness.ts]] · type-only
- [[procedures-oracle.fuzz.test.ts]] · type-only
- [[replay.test.ts]] · type-only
- [[transforms-expr.fuzz.test.ts]] · type-only
- [[transforms-ops.fuzz.test.ts]] · type-only, value
- [[csv.test.ts]] · value
- [[datasets.ts]] · type-only, value
- [[io/helpers.ts]] · type-only
- [[import.test.ts]] · value
- [[sav-perf.test.ts]] · type-only, value
- [[sav-write.test.ts]] · type-only
- [[xlsx.test.ts]] · value
- [[dialog-ui.test.tsx]] · value
- [[dialog.test.ts]] · value
- [[graphs.test.ts]] · value
- [[samples.test.ts]] · type-only
- [[stats-core/procedures.test.ts]] · value
- [[sample-survey.test.ts]] · value
- [[dataset.ts]] · value
- [[stats-models/procedures.test.ts]] · type-only, value
- [[separation.test.ts]] · type-only
- [[dataview.test.ts]] · value
- [[transform/helpers.ts]] · value
- [[history.test.ts]] · value
- [[properties.test.ts]] · value
- [[sample-oracle.test.ts]] · type-only

## Types
VarType (line 13) · MeasureLevel (line 14) · VarRole (line 15) · Alignment (line 16) · ValueLabel (line 18) · MissingSpec (line 24) · Variable (line 31) · Column (line 55) · Dataset (line 57)

## Private helpers
idCounter (line 79)

## Symbols

### newId
*function* · line 81 · exported
> Short unique id (not cryptographic).
- Uses: [[core/types.ts]]
- Used in: [[controller.ts]], [[coding/actions.ts]], [[AiDialogs.tsx]], [[ImportDialog.tsx]], [[mutations.ts]], [[tools/analysis.ts]], [[transform.ts]], [[codebookIO.ts]], [[example.ts]], [[outputs.ts]], [[survey.ts]], [[sav-reader.ts]], [[aggregate.ts]], [[derive.ts]], [[log.ts]], [[merge.ts]], [[core/common.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]] … +7

### makeVariable
*function* · line 87 · exported
> Build a Variable with sensible SPSS defaults.
- Calls: [[core/types.ts#newId|newId()]]
- Used in: [[mutations.ts]], [[toDataset.ts]], [[infer.ts]], [[dsops.ts]], [[features.test.ts]], [[navigation-audit.test.tsx]], [[palette.test.tsx]], [[search.test.ts]], [[shell-fixes.test.ts]], [[units.test.ts]], [[dataset.test.ts]], [[io.fuzz.test.ts]], [[gen-data.ts]], [[transforms-ops.fuzz.test.ts]], [[csv.test.ts]], [[datasets.ts]], [[import.test.ts]], [[sav-perf.test.ts]], [[xlsx.test.ts]], [[dialog-ui.test.tsx]], [[dialog.test.ts]], [[graphs.test.ts]], [[stats-core/procedures.test.ts]], [[sample-survey.test.ts]], [[dataset.ts]] … +5

### emptyColumn
*function* · line 109 · exported
- Used in: [[store.ts]]

### makeDataset
*function* · line 118 · exported
- Calls: [[core/types.ts#newId|newId()]]
- Used in: [[fileActions.ts]], [[infer.ts]], [[sav-reader.ts]], [[aggregate.ts]], [[features.test.ts]], [[navigation-audit.test.tsx]], [[palette.test.tsx]], [[search.test.ts]], [[shell-fixes.test.ts]], [[units.test.ts]], [[dataset.test.ts]], [[io.fuzz.test.ts]], [[gen-data.ts]], [[transforms-ops.fuzz.test.ts]], [[csv.test.ts]], [[datasets.ts]], [[import.test.ts]], [[sav-perf.test.ts]], [[xlsx.test.ts]], [[dialog-ui.test.tsx]], [[dialog.test.ts]], [[graphs.test.ts]], [[stats-core/procedures.test.ts]], [[dataset.ts]], [[transform/helpers.ts]] … +1
