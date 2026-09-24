---
id: src/features/charts/LineChart.tsx
type: module
file: src/features/charts/LineChart.tsx
area: features/charts
---

# src/features/charts/LineChart.tsx

*Module* · area [[features - charts|features/charts]] · 161 lines

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[charts/common.tsx]] · value
- [[scale.ts]] · value

## Imported by
- [[Chart.tsx]] · value

## Symbols

### lineDesc
*function* · line 8 · exported
- Calls: [[charts/common.tsx#listText|listText()]], [[scale.ts#formatValue|formatValue()]]

### LineChart
*component* · line 16 · exported · note: [[LineChart|<LineChart>]]
- Renders: [[ChartHeader|<ChartHeader>]], [[ChartSvg|<ChartSvg>]], [[TipRow|<TipRow>]], [[YAxis|<YAxis>]]
- Calls: [[LineChart.tsx#lineDesc|lineDesc()]], [[charts/common.tsx#fit|fit()]], [[charts/common.tsx#maxLabelWidth|maxLabelWidth()]], [[charts/common.tsx#measureText|measureText()]], [[charts/common.tsx#seriesColor|seriesColor()]], [[scale.ts#band|band()]], [[scale.ts#formatTick|formatTick()]], [[scale.ts#formatValue|formatValue()]], [[scale.ts#labelStride|labelStride()]], [[scale.ts#linear|linear()]], [[scale.ts#niceTicks|niceTicks()]], [[useHeaderLayout|useHeaderLayout()]]
- Uses: [[charts/common.tsx#FS_AXIS|FS_AXIS]], [[charts/common.tsx#FS_TICK|FS_TICK]]
- Rendered by: [[ChartBody|<ChartBody>]]
