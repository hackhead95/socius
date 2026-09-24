---
id: src/features/charts/HeatmapChart.tsx
type: module
file: src/features/charts/HeatmapChart.tsx
area: features/charts
---

# src/features/charts/HeatmapChart.tsx

*Module* · area [[features - charts|features/charts]] · 175 lines

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[charts/common.tsx]] · value
- [[scale.ts]] · value

## Calls
- [[scale.ts#formatValue|formatValue()]]

## Imported by
- [[Chart.tsx]] · value

## Private helpers
fmtCell() (line 30)

## Symbols

### heatIntensity
*function* · line 9 · exported
> Normalised intensity: sequential 0..1; diverging -1..1 (sign = side).

### heatFill
*function* · line 20 · exported
> Fill for an intensity: one hue light->dark for sequential; blue/red arms with a neutral middle for diverging.

### heatText
*function* · line 26 · exported

### heatmapDesc
*function* · line 38 · exported
- Calls: [[HeatmapChart.tsx]]

### HeatmapChart
*component* · line 52 · exported · note: [[HeatmapChart|<HeatmapChart>]]
- Renders: [[ChartHeader|<ChartHeader>]], [[ChartSvg|<ChartSvg>]], [[TipRow|<TipRow>]]
- Calls: [[HeatmapChart.tsx#heatFill|heatFill()]], [[HeatmapChart.tsx#heatIntensity|heatIntensity()]], [[HeatmapChart.tsx#heatText|heatText()]], [[HeatmapChart.tsx#heatmapDesc|heatmapDesc()]], [[HeatmapChart.tsx]], [[charts/common.tsx#fit|fit()]], [[charts/common.tsx#headerLayout|headerLayout()]], [[charts/common.tsx#maxLabelWidth|maxLabelWidth()]], [[useUid|useUid()]]
- Uses: [[charts/common.tsx#FS_TICK|FS_TICK]]
- Rendered by: [[ChartBody|<ChartBody>]]
