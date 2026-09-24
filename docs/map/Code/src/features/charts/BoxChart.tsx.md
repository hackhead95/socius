---
id: src/features/charts/BoxChart.tsx
type: module
file: src/features/charts/BoxChart.tsx
area: features/charts
---

# src/features/charts/BoxChart.tsx

*Module* · area [[features - charts|features/charts]] · 168 lines

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[charts/common.tsx]] · value
- [[scale.ts]] · value

## Imported by
- [[Chart.tsx]] · value

## Private helpers
star() (line 15)

## Symbols

### boxDesc
*function* · line 8 · exported
- Calls: [[scale.ts#formatValue|formatValue()]]

### BoxChart
*component* · line 26 · exported · note: [[BoxChart|<BoxChart>]]
- Renders: [[ChartHeader|<ChartHeader>]], [[ChartSvg|<ChartSvg>]], [[TipRow|<TipRow>]], [[YAxis|<YAxis>]]
- Calls: [[BoxChart.tsx#boxDesc|boxDesc()]], [[BoxChart.tsx]], [[charts/common.tsx#fit|fit()]], [[charts/common.tsx#headerLayout|headerLayout()]], [[charts/common.tsx#maxLabelWidth|maxLabelWidth()]], [[scale.ts#band|band()]], [[scale.ts#formatTick|formatTick()]], [[scale.ts#formatValue|formatValue()]], [[scale.ts#linear|linear()]], [[scale.ts#niceTicks|niceTicks()]]
- Uses: [[charts/common.tsx#FS_AXIS|FS_AXIS]], [[charts/common.tsx#FS_TICK|FS_TICK]]
- Rendered by: [[ChartBody|<ChartBody>]]
