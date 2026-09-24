---
id: src/features/charts/PieChart.tsx
type: module
file: src/features/charts/PieChart.tsx
area: features/charts
---

# src/features/charts/PieChart.tsx

*Module* · area [[features - charts|features/charts]] · 100 lines

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[charts/common.tsx]] · value
- [[scale.ts]] · value

## Imported by
- [[Chart.tsx]] · value

## Symbols

### pieDesc
*function* · line 8 · exported
- Calls: [[scale.ts#formatValue|formatValue()]]

### PieChart
*component* · line 14 · exported · note: [[PieChart|<PieChart>]]
- Renders: [[ChartHeader|<ChartHeader>]], [[ChartSvg|<ChartSvg>]], [[TipRow|<TipRow>]]
- Calls: [[PieChart.tsx#pieDesc|pieDesc()]], [[charts/common.tsx#fit|fit()]], [[charts/common.tsx#headerLayout|headerLayout()]], [[charts/common.tsx#measureText|measureText()]], [[charts/common.tsx#seriesColor|seriesColor()]], [[scale.ts#arcPath|arcPath()]], [[scale.ts#formatValue|formatValue()]], [[scale.ts#pieAngles|pieAngles()]]
- Uses: [[charts/common.tsx#FS_LEGEND|FS_LEGEND]], [[charts/common.tsx#FS_TICK|FS_TICK]]
- Rendered by: [[ChartBody|<ChartBody>]]
