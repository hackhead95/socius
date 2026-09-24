---
id: src/procedures/graphs/index.ts
type: module
file: src/procedures/graphs/index.ts
area: procedures
---

# src/procedures/graphs/index.ts

*Module* · area [[procedures]] · 840 lines

> Graphs menu: chart procedures that build OutputItems with a chart, a small summary table, SPSS syntax and a one-line interpretation. Filter, weights and missing values follow core/data.ts.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · value
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only, value
- [[output/format.ts]] · value
- [[core/common.ts]] · value
- [[stats.ts]] · value

## Calls
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[core/data.ts#distinctValues|distinctValues()]]
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#vprose|vprose()]]

## Tested by
- [[graphs.test.ts]] · import

## Imported by
- [[procedures/index.ts]] · value
- [[graphs.test.ts]] · value

## Private helpers
fmt() (line 15) · fmtN() (line 16) · dropZero() (line 17) · name() (line 19) · prose (line 24) · fmtVal() (line 27) · caseNote() (line 29) · syntaxPrefix() (line 43) · item() (line 50) · categoriesOf() (line 59) · keyOf() (line 63) · valueAt() (line 67) · need() (line 72) · numericValues() (line 76) · CAT_MEASURES (line 82) · skewWords() (line 279) · summaryCells() (line 451) · strength() (line 458) · MAX_POINTS (line 466)

## Symbols

### barChart
*const* · line 86
> ---------- Bar chart ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[stats.ts#meanCI|meanCI()]]
- Uses: [[graphs/index.ts]]
- Output: [[Charts/bar|bar]], [[table]], [[text]]

### histogram
*const* · line 287
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[stats.ts#binCounts|binCounts()]], [[stats.ts#histogramEdges|histogramEdges()]], [[stats.ts#wMoments|wMoments()]], [[stats.ts#wPercentile|wPercentile()]]
- Output: [[Charts/histogram|histogram]], [[text]]

### boxPlot
*const* · line 352
> ---------- Box plot ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#hcell|hcell()]], [[stats.ts#boxStats|boxStats()]]
- Uses: [[graphs/index.ts]]
- Output: [[Blocks/chart|chart]], [[box]], [[table]], [[text]]

### scatter
*const* · line 468
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[output/format.ts#formatP|formatP()]], [[stats.ts#linearFit|linearFit()]], [[stats.ts#tTwoSidedP|tTwoSidedP()]]
- Uses: [[graphs/index.ts]]
- Output: [[scatter]], [[table]], [[text]]

### lineChart
*const* · line 571
> ---------- Line chart ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]]
- Uses: [[graphs/index.ts]]
- Output: [[line]], [[table]], [[text]]

### pieChart
*const* · line 674
> ---------- Pie chart ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]]
- Uses: [[graphs/index.ts]]
- Output: [[pie]], [[table]], [[text]]

### pyramid
*const* · line 719
> ---------- Population pyramid ----------
- Calls: [[core/data.ts#categoryLabel|categoryLabel()]], [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]]
- Output: [[pyramid]], [[table]], [[text]]

### graphProcedures
*const* · line 839 · exported
- Uses: [[graphs/index.ts#barChart|barChart]], [[graphs/index.ts#boxPlot|boxPlot]], [[graphs/index.ts#histogram|histogram]], [[graphs/index.ts#lineChart|lineChart]], [[graphs/index.ts#pieChart|pieChart]], [[graphs/index.ts#pyramid|pyramid]], [[graphs/index.ts#scatter|scatter]]
- Used in: [[procedures/index.ts]], [[graphs.test.ts]]
