---
id: src/features/charts/scale.ts
type: module
file: src/features/charts/scale.ts
area: features/charts
---

# src/features/charts/scale.ts

*Module* · area [[features - charts|features/charts]] · 294 lines

> Pure scale and tick math for the SVG chart renderers. No DOM access here, so it is unit-tested.

## Tested by
- [[output/scale.test.ts]] · import

## Imported by
- [[BarChart.tsx]] · value
- [[BoxChart.tsx]] · value
- [[charts/common.tsx]] · value
- [[HeatmapChart.tsx]] · value
- [[HistogramChart.tsx]] · value
- [[LineChart.tsx]] · value
- [[PieChart.tsx]] · value
- [[PyramidChart.tsx]] · value
- [[ScatterChart.tsx]] · value
- [[output/scale.test.ts]] · value

## Types
Ticks (line 24) · Band (line 62)

## Private helpers
clean() (line 19)

## Symbols

### niceStep
*function* · line 4 · exported
> A "nice" step (1, 2, 2.5, 5 x 10^k) close to `rough`.
- Used in: [[output/scale.test.ts]]

### niceTicks
*function* · line 36 · exported
> Nice ticks covering [lo, hi] with roughly `count` intervals. The domain is extended outward to whole steps. Degenerate ranges (lo == hi) are widened so there is always something to draw.
- Calls: [[scale.ts#niceStep|niceStep()]], [[scale.ts]]
- Used in: [[BarChart.tsx]], [[BoxChart.tsx]], [[HistogramChart.tsx]], [[LineChart.tsx]], [[PyramidChart.tsx]], [[ScatterChart.tsx]], [[output/scale.test.ts]]

### linear
*function* · line 57 · exported
> Linear map from domain [d0, d1] to range [r0, r1].
- Used in: [[BarChart.tsx]], [[BoxChart.tsx]], [[HistogramChart.tsx]], [[LineChart.tsx]], [[PyramidChart.tsx]], [[ScatterChart.tsx]], [[output/scale.test.ts]]

### band
*function* · line 74 · exported
> Evenly divide [r0, r1] into n bands.
- Used in: [[BarChart.tsx]], [[BoxChart.tsx]], [[LineChart.tsx]], [[PyramidChart.tsx]], [[output/scale.test.ts]]

### extent
*function* · line 89 · exported
> Min and max of finite numbers; null if none.
- Used in: [[ScatterChart.tsx]], [[output/scale.test.ts]]

### stepDecimals
*function* · line 101 · exported
> Number of decimals needed to show a tick step exactly (0.25 -> 2, 5 -> 0).
- Used in: [[output/scale.test.ts]]

### formatTick
*function* · line 110 · exported
> Tick label: thousands separators, decimals matched to the step, optional % suffix.
- Calls: [[scale.ts#stepDecimals|stepDecimals()]]
- Used in: [[BarChart.tsx]], [[BoxChart.tsx]], [[HistogramChart.tsx]], [[LineChart.tsx]], [[PyramidChart.tsx]], [[ScatterChart.tsx]], [[output/scale.test.ts]]

### formatValue
*function* · line 125 · exported
> Compact value label for chart annotations (not axes): up to 1 decimal, thousands separators.
- Used in: [[BarChart.tsx]], [[BoxChart.tsx]], [[HeatmapChart.tsx]], [[HistogramChart.tsx]], [[LineChart.tsx]], [[PieChart.tsx]], [[PyramidChart.tsx]], [[ScatterChart.tsx]]

### normalPdf
*function* · line 133 · exported
> Normal density.

### normalCurvePoints
*function* · line 143 · exported
> Points of a normal curve scaled to histogram counts: expected count per bin = n * binWidth * pdf. Uses the (common) bin width of the first bin.
- Calls: [[scale.ts#normalPdf|normalPdf()]]
- Used in: [[HistogramChart.tsx]], [[output/scale.test.ts]]

### pieAngles
*function* · line 157 · exported
> Angles for donut slices, starting at 12 o'clock, clockwise. Zero/negative values get no slice.
- Used in: [[PieChart.tsx]], [[output/scale.test.ts]]

### arcPath
*function* · line 169 · exported
> SVG path for an annular sector.
- Used in: [[PieChart.tsx]], [[output/scale.test.ts]]

### barPath
*function* · line 187 · exported
> Rectangle path with only the data-end corners rounded (the baseline end stays square). `end` says which side is the data end.
- Used in: [[BarChart.tsx]], [[HistogramChart.tsx]], [[PyramidChart.tsx]], [[output/scale.test.ts]]

### approxTextWidth
*function* · line 206 · exported
> Approximate text width in px for layout when no canvas is available (IBM Plex Sans-ish metrics).
- Used in: [[charts/common.tsx]]

### truncateLabel
*function* · line 220 · exported
> Shorten a label to fit `maxWidth` px, adding an ellipsis.
- Uses: [[scale.ts#approxTextWidth|approxTextWidth()]]
- Used in: [[charts/common.tsx]], [[output/scale.test.ts]]

### labelStride
*function* · line 233 · exported
> Evenly thin category labels so they do not overlap: returns the step (show every k-th).
- Used in: [[LineChart.tsx]], [[output/scale.test.ts]]

### legendLayout
*function* · line 239 · exported
> Legend flow layout: positions items left to right, wrapping to new rows within `width`.
- Calls: [[scale.ts#truncateLabel|truncateLabel()]]
- Uses: [[scale.ts#approxTextWidth|approxTextWidth()]]
- Used in: [[charts/common.tsx]], [[output/scale.test.ts]]

### PointIndex
*class* · line 257 · exported
> Index of the nearest point to (px, py) within `maxDist`, using a uniform grid built once.
- Used in: [[ScatterChart.tsx]], [[output/scale.test.ts]]
