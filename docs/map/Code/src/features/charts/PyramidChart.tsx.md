---
id: src/features/charts/PyramidChart.tsx
type: module
file: src/features/charts/PyramidChart.tsx
area: features/charts
---

# src/features/charts/PyramidChart.tsx

*Module* · area [[features - charts|features/charts]] · 124 lines

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[charts/common.tsx]] · value
- [[scale.ts]] · value

## Imported by
- [[Chart.tsx]] · value

## Symbols

### pyramidDesc
*function* · line 8 · exported
- Calls: [[scale.ts#formatValue|formatValue()]]

### PyramidChart
*component* · line 17 · exported · note: [[PyramidChart|<PyramidChart>]]
- Renders: [[ChartHeader|<ChartHeader>]], [[ChartSvg|<ChartSvg>]], [[TipRow|<TipRow>]]
- Calls: [[PyramidChart.tsx#pyramidDesc|pyramidDesc()]], [[charts/common.tsx#fit|fit()]], [[charts/common.tsx#maxLabelWidth|maxLabelWidth()]], [[charts/common.tsx#seriesColor|seriesColor()]], [[scale.ts#band|band()]], [[scale.ts#barPath|barPath()]], [[scale.ts#formatTick|formatTick()]], [[scale.ts#formatValue|formatValue()]], [[scale.ts#linear|linear()]], [[scale.ts#niceTicks|niceTicks()]], [[useHeaderLayout|useHeaderLayout()]]
- Uses: [[charts/common.tsx#FS_AXIS|FS_AXIS]], [[charts/common.tsx#FS_TICK|FS_TICK]]
- Rendered by: [[ChartBody|<ChartBody>]]
