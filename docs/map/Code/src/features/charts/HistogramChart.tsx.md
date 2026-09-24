---
id: src/features/charts/HistogramChart.tsx
type: module
file: src/features/charts/HistogramChart.tsx
area: features/charts
---

# src/features/charts/HistogramChart.tsx

*Module* · area [[features - charts|features/charts]] · 107 lines

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[charts/common.tsx]] · value
- [[scale.ts]] · value

## Imported by
- [[Chart.tsx]] · value

## Symbols

### histogramDesc
*function* · line 8 · exported
- Calls: [[scale.ts#formatValue|formatValue()]]

### HistogramChart
*component* · line 19 · exported · note: [[HistogramChart|<HistogramChart>]]
- Renders: [[ChartHeader|<ChartHeader>]], [[ChartSvg|<ChartSvg>]], [[TipRow|<TipRow>]], [[XAxisNumeric|<XAxisNumeric>]], [[YAxis|<YAxis>]]
- Calls: [[HistogramChart.tsx#histogramDesc|histogramDesc()]], [[charts/common.tsx#maxLabelWidth|maxLabelWidth()]], [[charts/common.tsx#measureText|measureText()]], [[scale.ts#barPath|barPath()]], [[scale.ts#formatTick|formatTick()]], [[scale.ts#formatValue|formatValue()]], [[scale.ts#linear|linear()]], [[scale.ts#niceTicks|niceTicks()]], [[scale.ts#normalCurvePoints|normalCurvePoints()]], [[useHeaderLayout|useHeaderLayout()]]
- Uses: [[charts/common.tsx#FS_TICK|FS_TICK]]
- Rendered by: [[ChartBody|<ChartBody>]]
