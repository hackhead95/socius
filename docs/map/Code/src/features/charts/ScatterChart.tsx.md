---
id: src/features/charts/ScatterChart.tsx
type: module
file: src/features/charts/ScatterChart.tsx
area: features/charts
---

# src/features/charts/ScatterChart.tsx

*Module* · area [[features - charts|features/charts]] · 219 lines

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[charts/common.tsx]] · value
- [[scale.ts]] · value

## Imported by
- [[Chart.tsx]] · value

## Symbols

### CANVAS_THRESHOLD
*const* · line 9 · exported
> Above this many points the dots are painted on a canvas layer instead of SVG circles.

### scatterDesc
*function* · line 11 · exported
- Calls: [[scale.ts#extent|extent()]], [[scale.ts#formatValue|formatValue()]]

### useThemeVersion
*hook* · line 21 · note: [[useThemeVersion|useThemeVersion()]]
> Bumps when the colour theme changes, so canvas layers repaint with the new token values.

### ScatterChart
*component* · line 38 · exported · note: [[ScatterChart|<ScatterChart>]]
- Renders: [[ChartHeader|<ChartHeader>]], [[ChartSvg|<ChartSvg>]], [[TipRow|<TipRow>]], [[XAxisNumeric|<XAxisNumeric>]], [[YAxis|<YAxis>]]
- Calls: [[ScatterChart.tsx#scatterDesc|scatterDesc()]], [[charts/common.tsx#headerLayout|headerLayout()]], [[charts/common.tsx#maxLabelWidth|maxLabelWidth()]], [[charts/common.tsx#measureText|measureText()]], [[charts/common.tsx#seriesColor|seriesColor()]], [[scale.ts#PointIndex|PointIndex]], [[scale.ts#extent|extent()]], [[scale.ts#formatTick|formatTick()]], [[scale.ts#formatValue|formatValue()]], [[scale.ts#linear|linear()]], [[scale.ts#niceTicks|niceTicks()]], [[useThemeVersion|useThemeVersion()]]
- Uses: [[ScatterChart.tsx#CANVAS_THRESHOLD|CANVAS_THRESHOLD]], [[charts/common.tsx#FS_TICK|FS_TICK]]
- Rendered by: [[ChartBody|<ChartBody>]]
