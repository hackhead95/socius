---
id: src/features/charts/export.ts
type: module
file: src/features/charts/export.ts
area: features/charts
---

# src/features/charts/export.ts

*Module* · area [[features - charts|features/charts]] · 212 lines

> Chart export: render a chart offscreen in the light (paper) theme, serialise the SVG with every token colour resolved and inlined, and rasterise to PNG at 2x. Browser only.

## Imports
- [[react]] · value
- [[react-dom]] · value
- [[output.ts]] · type-only
- [[Chart.tsx]] · value

## Imported by
- [[output/actions.ts]] · value

## Types
ChartRenderOptions (line 11)

## Private helpers
lightTokens() (line 17) · colorCtx (line 40) · colorCache (line 41) · PAINT_PROPS (line 67) · loadImage() (line 169)

## Symbols

### EXPORT_WIDTH
*const* · line 9 · exported

### normalizeColor
*function* · line 43 · exported
> Any CSS colour (incl. color-mix/oklab) -> "#rrggbb" or "rgba(...)" by painting one pixel.
- Uses: [[export.ts]]

### serializeChart
*function* · line 70 · exported
> Serialise the SVG inside a rendered chart container, inlining computed colours and fonts.
- Calls: [[export.ts#normalizeColor|normalizeColor()]]
- Uses: [[export.ts]]

### withOffscreenChart
*function* · line 147 · exported
> Render a chart offscreen at a fixed width in the light theme and run `fn` on its container.
- Calls: [[export.ts]]
- Uses: [[Components/Chart|<Chart>]], [[export.ts#EXPORT_WIDTH|EXPORT_WIDTH]]

### chartToSvg
*function* · line 165 · exported
- Calls: [[export.ts#withOffscreenChart|withOffscreenChart()]]
- Uses: [[export.ts#EXPORT_WIDTH|EXPORT_WIDTH]], [[export.ts#serializeChart|serializeChart()]]
- Used in: [[output/actions.ts]]

### svgToPng
*function* · line 179 · exported
> Rasterise an SVG string to PNG at `scale` (default 2x for crisp print).
- Calls: [[export.ts]]

### chartToPng
*function* · line 191 · exported
- Calls: [[export.ts#chartToSvg|chartToSvg()]], [[export.ts#svgToPng|svgToPng()]]
- Uses: [[export.ts#EXPORT_WIDTH|EXPORT_WIDTH]]
- Used in: [[output/actions.ts]]

### chartToPngDataUrl
*function* · line 197 · exported
> PNG as a data: URL (for rich-HTML clipboard copies).
- Calls: [[export.ts#chartToPng|chartToPng()]]
- Uses: [[export.ts#EXPORT_WIDTH|EXPORT_WIDTH]]
- Used in: [[output/actions.ts]]

### fileStem
*function* · line 209 · exported
> Safe file name stem from a title.
- Used in: [[output/actions.ts]]
