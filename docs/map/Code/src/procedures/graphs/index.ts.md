---
id: src/procedures/graphs/index.ts
type: module
file: src/procedures/graphs/index.ts
area: procedures
---

# src/procedures/graphs/index.ts

*Module* · area [[procedures]] · 853 lines

> Graphs menu: chart procedures that build OutputItems with a chart, a small summary table, SPSS syntax and a one-line interpretation. Filter, weights and missing values follow core/data.ts.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · value
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only, value
- [[output/format.ts]] · value
- [[core/common.ts]] · value
- [[stats.ts]] · value
- [[procedures/text.ts]] · value

## Calls
- [[output.ts#cell|cell()]]
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]]
- [[core/data.ts#distinctValues|distinctValues()]]
- [[procedures/text.ts#labelOf|labelOf()]]
- [[core/types.ts#newId|newId()]]
- [[procedures/text.ts#numText|numText()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[procedures/text.ts#countText|countText()]]
- [[core/common.ts#vprose|vprose()]]

## Tested by
- [[graphs.test.ts]] · import

## Imported by
- [[procedures/index.ts]] · value
- [[graphs.test.ts]] · value

## Private helpers
fmt() (line 16) · fmtN (line 17) · dropZero() (line 18) · name() (line 20) · prose (line 25) · fmtVal() (line 28) · caseNote() (line 30) · syntaxPrefix() (line 44) · item() (line 51) · categoriesOf() (line 60) · keyOf() (line 64) · valueAt() (line 68) · need() (line 73) · numericValues() (line 77) · CAT_MEASURES (line 83) · skewWords() (line 280) · summaryCells() (line 455) · strength() (line 462) · MAX_POINTS (line 470)

## Symbols

### barChart
*const* · line 87
> ---------- Bar chart ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[stats.ts#meanCI|meanCI()]]
- Uses: [[graphs/index.ts]]
- Output: [[Charts/bar|bar]], [[table]], [[text]]

### histogram
*const* · line 288
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[stats.ts#binCounts|binCounts()]], [[stats.ts#histogramEdges|histogramEdges()]], [[stats.ts#wMoments|wMoments()]], [[stats.ts#wPercentile|wPercentile()]]
- Output: [[Charts/histogram|histogram]], [[text]]

### boxPlot
*const* · line 353
> ---------- Box plot ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#hcell|hcell()]], [[procedures/text.ts#allFinite|allFinite()]], [[stats.ts#boxStats|boxStats()]]
- Uses: [[graphs/index.ts]]
- Output: [[Blocks/chart|chart]], [[box]], [[table]], [[text]]

### scatter
*const* · line 472
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[output/format.ts#formatP|formatP()]], [[procedures/text.ts#numText|numText()]], [[stats.ts#linearFit|linearFit()]], [[stats.ts#tTwoSidedP|tTwoSidedP()]]
- Uses: [[graphs/index.ts]]
- Output: [[scatter]], [[table]], [[text]]

### lineChart
*const* · line 581
> ---------- Line chart ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]]
- Uses: [[graphs/index.ts]]
- Output: [[line]], [[table]], [[text]]

### pieChart
*const* · line 684
> ---------- Pie chart ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]]
- Uses: [[graphs/index.ts]]
- Output: [[pie]], [[table]], [[text]]

### pyramid
*const* · line 729
> ---------- Population pyramid ----------
- Calls: [[core/data.ts#requireVariable|requireVariable()]], [[core/data.ts#selectCases|selectCases()]], [[graphs/index.ts]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[procedures/text.ts#labelOf|labelOf()]]
- Output: [[pyramid]], [[table]], [[text]]

### graphProcedures
*const* · line 852 · exported
- Uses: [[graphs/index.ts#barChart|barChart]], [[graphs/index.ts#boxPlot|boxPlot]], [[graphs/index.ts#histogram|histogram]], [[graphs/index.ts#lineChart|lineChart]], [[graphs/index.ts#pieChart|pieChart]], [[graphs/index.ts#pyramid|pyramid]], [[graphs/index.ts#scatter|scatter]]
- Used in: [[procedures/index.ts]], [[graphs.test.ts]]
