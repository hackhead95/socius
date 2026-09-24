---
id: src/features/charts/Chart.tsx
type: module
file: src/features/charts/Chart.tsx
area: features/charts
---

# src/features/charts/Chart.tsx

*Module* · area [[features - charts|features/charts]] · 63 lines

> Hand-built responsive SVG charts for every ChartSpec type. Colours come from the --viz-* tokens, so both themes work; each chart has an accessible name/description and a hover/focus tooltip.

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[BarChart.tsx]] · value
- [[BoxChart.tsx]] · value
- `src/features/charts/charts.css` · side-effect
- [[charts/common.tsx]] · value
- [[HeatmapChart.tsx]] · value
- [[HistogramChart.tsx]] · value
- [[LineChart.tsx]] · value
- [[PieChart.tsx]] · value
- [[PyramidChart.tsx]] · value
- [[ScatterChart.tsx]] · value

## Tested by
- [[invariants.ts]] · import
- [[figures.test.tsx]] · import

## Imported by
- [[export.ts]] · value
- [[OutputViewer.tsx]] · value
- [[invariants.ts]] · value
- [[figures.test.tsx]] · dynamic

## Types
ChartProps (line 16)

## Symbols

### Chart
*component* · line 27 · exported · note: [[Components/Chart|<Chart>]]
- Renders: [[ChartBody|<ChartBody>]], [[Tooltip|<Tooltip>]]
- Calls: [[useChartWidth|useChartWidth()]]
- Uses: [[charts/common.tsx#ChartTitleShown|ChartTitleShown]]
- Rendered by: [[ChartBlock|<ChartBlock>]]
- Used in: [[export.ts]], [[invariants.ts]]

### ChartBody
*component* · line 41 · note: [[ChartBody|<ChartBody>]]
- Renders: [[BarChart|<BarChart>]], [[BoxChart|<BoxChart>]], [[HeatmapChart|<HeatmapChart>]], [[HistogramChart|<HistogramChart>]], [[LineChart|<LineChart>]], [[PieChart|<PieChart>]], [[PyramidChart|<PyramidChart>]], [[ScatterChart|<ScatterChart>]]
- Output: [[Charts/bar|bar]], [[Charts/histogram|histogram]], [[box]], [[heatmap]], [[line]], [[pie]], [[pyramid]], [[scatter]]
