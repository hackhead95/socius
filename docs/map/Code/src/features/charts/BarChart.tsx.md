---
id: src/features/charts/BarChart.tsx
type: module
file: src/features/charts/BarChart.tsx
area: features/charts
---

# src/features/charts/BarChart.tsx

*Module* · area [[features - charts|features/charts]] · 343 lines

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[charts/common.tsx]] · value
- [[scale.ts]] · value

## Imported by
- [[Chart.tsx]] · value

## Private helpers
MAX_BAR (line 11) · GAP (line 12)

## Symbols

### barDesc
*function* · line 14 · exported
- Calls: [[charts/common.tsx#listText|listText()]], [[scale.ts#formatValue|formatValue()]]

### BarChart
*component* · line 27 · exported · note: [[BarChart|<BarChart>]]
- Renders: [[ChartHeader|<ChartHeader>]], [[ChartSvg|<ChartSvg>]], [[TipRow|<TipRow>]], [[XAxisNumeric|<XAxisNumeric>]], [[YAxis|<YAxis>]]
- Calls: [[BarChart.tsx#barDesc|barDesc()]], [[charts/common.tsx#fit|fit()]], [[charts/common.tsx#headerLayout|headerLayout()]], [[charts/common.tsx#maxLabelWidth|maxLabelWidth()]], [[charts/common.tsx#measureText|measureText()]], [[charts/common.tsx#seriesColor|seriesColor()]], [[scale.ts#band|band()]], [[scale.ts#barPath|barPath()]], [[scale.ts#formatTick|formatTick()]], [[scale.ts#formatValue|formatValue()]], [[scale.ts#linear|linear()]], [[scale.ts#niceTicks|niceTicks()]]
- Uses: [[BarChart.tsx]], [[charts/common.tsx#FS_AXIS|FS_AXIS]], [[charts/common.tsx#FS_TICK|FS_TICK]]
- Rendered by: [[ChartBody|<ChartBody>]]
