---
id: src/core/output.ts
type: module
file: src/core/output.ts
area: core
---

# src/core/output.ts

*Module* · area [[core]] · 179 lines

> Output model. Every analysis produces one OutputItem made of blocks (tables, charts, text). Procedures build these; the Output viewer renders them; exporters turn them into Word/HTML/Excel. Keep blocks declarative and serialisable (plain JSON: no functions, no typed arrays).

## Tested by
- [[explainPrompt.test.ts]] · import
- [[scenarios.test.ts]] · import
- [[invariants.ts]] · import
- [[proc-harness.ts]] · import
- [[procedures-oracle.fuzz.test.ts]] · import
- [[fixtures.ts]] · import
- [[format.test.ts]] · import
- [[graphs.test.ts]] · import
- [[stats-core/procedures.test.ts]] · import
- [[sample-survey.test.ts]] · import
- [[stats-models/procedures.test.ts]] · import
- [[separation.test.ts]] · import

## Imported by
- [[procedure.ts]] · type-only
- [[store.ts]] · type-only
- [[ExplainPanel.tsx]] · type-only
- [[explainPrompt.ts]] · type-only
- [[explainStore.ts]] · type-only
- [[features.ts]] · type-only
- [[BarChart.tsx]] · type-only
- [[BoxChart.tsx]] · type-only
- [[Chart.tsx]] · type-only
- [[dataTable.ts]] · type-only
- [[export.ts]] · type-only
- [[HeatmapChart.tsx]] · type-only
- [[HistogramChart.tsx]] · type-only
- [[LineChart.tsx]] · type-only
- [[PieChart.tsx]] · type-only
- [[PyramidChart.tsx]] · type-only
- [[ScatterChart.tsx]] · type-only
- [[output/actions.ts]] · type-only
- [[exportDocx.ts]] · type-only
- [[exportText.ts]] · type-only
- [[exportXlsx.ts]] · type-only
- [[output/format.ts]] · type-only
- [[OutputTableView.tsx]] · type-only
- [[OutputViewer.tsx]] · type-only
- [[reportHtml.ts]] · type-only
- [[tableRender.ts]] · type-only
- [[projectFile.ts]] · type-only
- [[assistant/actions.ts]] · type-only
- [[assistant/format.ts]] · type-only
- [[prompt.ts]] · type-only
- [[tools/analysis.ts]] · type-only
- [[assistant/types.ts]] · type-only
- [[outputs.ts]] · type-only, value
- [[log.ts]] · type-only
- [[core/common.ts]] · value
- [[correlations.ts]] · type-only
- [[core/crosstabs.ts]] · type-only
- [[core/descriptives.ts]] · type-only
- [[core/frequencies.ts]] · type-only
- [[core/nonparametric.ts]] · type-only
- [[oneway.ts]] · type-only
- [[ttests.ts]] · type-only
- [[graphs/index.ts]] · value
- [[binary.ts]] · type-only
- [[models/common.ts]] · value
- [[models/factor.ts]] · type-only
- [[linear.ts]] · type-only
- [[nomreg.ts]] · type-only
- [[plum.ts]] · type-only
- [[models/reliability.ts]] · type-only
- [[explainPrompt.test.ts]] · value
- [[scenarios.test.ts]] · type-only
- [[invariants.ts]] · type-only
- [[proc-harness.ts]] · type-only
- [[procedures-oracle.fuzz.test.ts]] · type-only
- [[fixtures.ts]] · value
- [[format.test.ts]] · value
- [[graphs.test.ts]] · type-only
- [[stats-core/procedures.test.ts]] · type-only
- [[sample-survey.test.ts]] · type-only
- [[stats-models/procedures.test.ts]] · type-only
- [[separation.test.ts]] · type-only

## Types
CellFormat (line 6) · Cell (line 15) · OutputTable (line 32) · ChartSpec (line 49) · OutputBlock (line 144) · OutputItem (line 161)

## Symbols

### cell
*function* · line 177 · exported
> Small helpers so procedures read well.
- Used in: [[outputs.ts]], [[core/common.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]], [[binary.ts]], [[models/common.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]], [[explainPrompt.test.ts]], [[fixtures.ts]], [[format.test.ts]]

### hcell
*function* · line 178 · exported
- Used in: [[outputs.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]], [[binary.ts]], [[models/common.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]], [[explainPrompt.test.ts]], [[fixtures.ts]], [[format.test.ts]]
