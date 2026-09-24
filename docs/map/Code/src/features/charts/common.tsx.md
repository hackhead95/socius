---
id: src/features/charts/common.tsx
type: module
file: src/features/charts/common.tsx
area: features/charts
---

# src/features/charts/common.tsx

*Module* · area [[features - charts|features/charts]] · 251 lines

> Shared pieces for the SVG chart renderers: sizing, text measurement, colours, the frame (title, legend, accessible title/desc) and the hover tooltip.

## Imports
- [[react]] · value
- [[scale.ts]] · value

## Imported by
- [[BarChart.tsx]] · value
- [[BoxChart.tsx]] · value
- [[Chart.tsx]] · value
- [[HeatmapChart.tsx]] · value
- [[HistogramChart.tsx]] · value
- [[LineChart.tsx]] · value
- [[PieChart.tsx]] · value
- [[PyramidChart.tsx]] · value
- [[ScatterChart.tsx]] · value

## Types
LegendItem (line 56) · Tip (line 62) · SetTip (line 68)

## Private helpers
measureCtx (line 18) · uid (line 130)

## Symbols

### FONT_UI
*const* · line 7 · exported

### FS_TICK
*const* · line 8 · exported
- Used in: [[BarChart.tsx]], [[BoxChart.tsx]], [[HeatmapChart.tsx]], [[HistogramChart.tsx]], [[LineChart.tsx]], [[PieChart.tsx]], [[PyramidChart.tsx]], [[ScatterChart.tsx]]

### FS_AXIS
*const* · line 9 · exported
- Used in: [[BarChart.tsx]], [[BoxChart.tsx]], [[LineChart.tsx]], [[PyramidChart.tsx]]

### FS_TITLE
*const* · line 10 · exported

### FS_LEGEND
*const* · line 11 · exported
- Used in: [[PieChart.tsx]]

### seriesColor
*function* · line 14 · exported
> Categorical colour for series i (fixed order, never cycled). Past slot 8 everything is neutral.
- Used in: [[BarChart.tsx]], [[LineChart.tsx]], [[PieChart.tsx]], [[PyramidChart.tsx]], [[ScatterChart.tsx]]

### measureText
*function* · line 20 · exported
> Text width in px (canvas when available, else an approximation).
- Calls: [[scale.ts#approxTextWidth|approxTextWidth()]]
- Uses: [[charts/common.tsx]]
- Used in: [[BarChart.tsx]], [[HistogramChart.tsx]], [[LineChart.tsx]], [[PieChart.tsx]], [[ScatterChart.tsx]]

### fit
*function* · line 33 · exported
- Calls: [[charts/common.tsx#measureText|measureText()]], [[scale.ts#truncateLabel|truncateLabel()]]
- Used in: [[BarChart.tsx]], [[BoxChart.tsx]], [[HeatmapChart.tsx]], [[LineChart.tsx]], [[PieChart.tsx]], [[PyramidChart.tsx]]

### useChartWidth
*hook* · line 36 · exported · note: [[useChartWidth|useChartWidth()]]
> Width of the container, tracked with ResizeObserver. `fixed` overrides (used for exports).
- Used in: [[Chart.tsx]]

### ChartTitleShown
*const* · line 75 · exported
> Whether charts draw their title inside the image. The Output view (APA style) and the Word/HTML exports print "Figure N" and the italic title above the chart instead, so the title is not repeated inside it; stand-alone PNG/SVG files keep...
- Used in: [[Chart.tsx]]

### headerLayout
*function* · line 78 · exported
> Top-of-chart header layout: title + wrapped legend. Returns the y where the plot may start.
- Calls: [[charts/common.tsx#fit|fit()]], [[charts/common.tsx#measureText|measureText()]], [[scale.ts#legendLayout|legendLayout()]]
- Uses: [[charts/common.tsx#FS_LEGEND|FS_LEGEND]], [[charts/common.tsx#FS_TITLE|FS_TITLE]]

### useHeaderLayout
*hook* · line 93 · exported · note: [[useHeaderLayout|useHeaderLayout()]]
> headerLayout for a chart component: leaves the title out when the caption above shows it.
- Calls: [[charts/common.tsx#headerLayout|headerLayout()]]
- Uses: [[charts/common.tsx#ChartTitleShown|ChartTitleShown]]
- Used in: [[BarChart.tsx]], [[BoxChart.tsx]], [[HeatmapChart.tsx]], [[HistogramChart.tsx]], [[LineChart.tsx]], [[PieChart.tsx]], [[PyramidChart.tsx]], [[ScatterChart.tsx]]

### ChartHeader
*component* · line 98 · exported · note: [[ChartHeader|<ChartHeader>]]
- Uses: [[charts/common.tsx#FONT_UI|FONT_UI]], [[charts/common.tsx#FS_LEGEND|FS_LEGEND]], [[charts/common.tsx#FS_TITLE|FS_TITLE]]
- Rendered by: [[BarChart|<BarChart>]], [[BoxChart|<BoxChart>]], [[HeatmapChart|<HeatmapChart>]], [[HistogramChart|<HistogramChart>]], [[LineChart|<LineChart>]], [[PieChart|<PieChart>]], [[PyramidChart|<PyramidChart>]], [[ScatterChart|<ScatterChart>]]

### useUid
*hook* · line 131 · exported · note: [[useUid|useUid()]]
- Uses: [[charts/common.tsx]]
- Used in: [[HeatmapChart.tsx]]

### ChartSvg
*component* · line 138 · exported · note: [[ChartSvg|<ChartSvg>]]
> The outer SVG with accessible name and description, and a surface-coloured background.
- Calls: [[useUid|useUid()]]
- Uses: [[charts/common.tsx#FONT_UI|FONT_UI]]
- Rendered by: [[BarChart|<BarChart>]], [[BoxChart|<BoxChart>]], [[HeatmapChart|<HeatmapChart>]], [[HistogramChart|<HistogramChart>]], [[LineChart|<LineChart>]], [[PieChart|<PieChart>]], [[PyramidChart|<PyramidChart>]], [[ScatterChart|<ScatterChart>]]

### Tooltip
*component* · line 162 · exported · note: [[Tooltip|<Tooltip>]]
> Tooltip positioned inside the chart container; flips to stay visible.
- Rendered by: [[Components/Chart|<Chart>]]

### TipRow
*component* · line 174 · exported · note: [[TipRow|<TipRow>]]
> Tooltip row: value first (strong), then label; keyed by a short line of the series colour.
- Rendered by: [[BarChart|<BarChart>]], [[BoxChart|<BoxChart>]], [[HeatmapChart|<HeatmapChart>]], [[HistogramChart|<HistogramChart>]], [[LineChart|<LineChart>]], [[PieChart|<PieChart>]], [[PyramidChart|<PyramidChart>]], [[ScatterChart|<ScatterChart>]]

### YAxis
*component* · line 185 · exported · note: [[YAxis|<YAxis>]]
> Y-axis ticks + gridlines + axis title.
- Calls: [[charts/common.tsx#fit|fit()]]
- Uses: [[charts/common.tsx#FS_AXIS|FS_AXIS]], [[charts/common.tsx#FS_TICK|FS_TICK]]
- Rendered by: [[BarChart|<BarChart>]], [[BoxChart|<BoxChart>]], [[HistogramChart|<HistogramChart>]], [[LineChart|<LineChart>]], [[ScatterChart|<ScatterChart>]]

### XAxisNumeric
*component* · line 215 · exported · note: [[XAxisNumeric|<XAxisNumeric>]]
> X-axis numeric ticks + gridlines + title.
- Calls: [[charts/common.tsx#fit|fit()]]
- Uses: [[charts/common.tsx#FS_AXIS|FS_AXIS]], [[charts/common.tsx#FS_TICK|FS_TICK]]
- Rendered by: [[BarChart|<BarChart>]], [[HistogramChart|<HistogramChart>]], [[ScatterChart|<ScatterChart>]]

### maxLabelWidth
*function* · line 240 · exported
> Widest of the given tick labels.
- Calls: [[charts/common.tsx#measureText|measureText()]]
- Uses: [[charts/common.tsx#FS_TICK|FS_TICK]]
- Used in: [[BarChart.tsx]], [[BoxChart.tsx]], [[HeatmapChart.tsx]], [[HistogramChart.tsx]], [[LineChart.tsx]], [[PyramidChart.tsx]], [[ScatterChart.tsx]]

### listText
*function* · line 247 · exported
> Human list: "a, b and c".
- Used in: [[BarChart.tsx]], [[LineChart.tsx]]
