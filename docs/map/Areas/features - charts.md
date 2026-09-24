---
id: "area:features/charts"
type: area
area: features/charts
---

# Area: features/charts

13 files, 2280 lines.

## Depends on (module imports)
- [[core]]: 11

## Used by areas
- [[features - output|features/output]]: 4
- [[features - ai|features/ai]]: 1

## Files
- [[BarChart.tsx]]
- [[BoxChart.tsx]]
- [[Chart.tsx]]: Hand-built responsive SVG charts for every ChartSpec type. Colours come from the --viz-* tokens, so both themes work; each chart has an acce…
- [[charts/common.tsx]]: Shared pieces for the SVG chart renderers: sizing, text measurement, colours, the frame (title, legend, accessible title/desc) and the hover…
- [[dataTable.ts]]: A plain table view of any chart's data (the accessible twin of the chart, also used by exports).
- [[export.ts]]: Chart export: render a chart offscreen in the light (paper) theme, serialise the SVG with every token colour resolved and inlined, and raste…
- [[HeatmapChart.tsx]]
- [[HistogramChart.tsx]]
- [[LineChart.tsx]]
- [[PieChart.tsx]]
- [[PyramidChart.tsx]]
- [[scale.ts]]: Pure scale and tick math for the SVG chart renderers. No DOM access here, so it is unit-tested.
- [[ScatterChart.tsx]]

## Components
[[BarChart|<BarChart>]] · [[BoxChart|<BoxChart>]] · [[Components/Chart|<Chart>]] · [[ChartBody|<ChartBody>]] · [[ChartHeader|<ChartHeader>]] · [[ChartSvg|<ChartSvg>]] · [[HeatmapChart|<HeatmapChart>]] · [[HistogramChart|<HistogramChart>]] · [[LineChart|<LineChart>]] · [[PieChart|<PieChart>]] · [[PyramidChart|<PyramidChart>]] · [[ScatterChart|<ScatterChart>]] · [[TipRow|<TipRow>]] · [[Tooltip|<Tooltip>]] · [[XAxisNumeric|<XAxisNumeric>]] · [[YAxis|<YAxis>]]

## Hooks
[[useChartWidth|useChartWidth()]] · [[useHeaderLayout|useHeaderLayout()]] · [[useThemeVersion|useThemeVersion()]] · [[useUid|useUid()]]
