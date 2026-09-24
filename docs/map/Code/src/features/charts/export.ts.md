---
id: src/features/charts/export.ts
type: module
file: src/features/charts/export.ts
area: features/charts
---

# src/features/charts/export.ts

*Module* · area [[features - charts|features/charts]] · 207 lines

> Chart export: render a chart offscreen in the light (paper) theme, serialise the SVG with every token colour resolved and inlined, and rasterise to PNG at 2x. Browser only.

## Imports
- [[react]] · value
- [[react-dom]] · value
- [[output.ts]] · type-only
- [[Chart.tsx]] · value

## Imported by
- [[output/actions.ts]] · value

## Private helpers
lightTokens() (line 12) · colorCtx (line 35) · colorCache (line 36) · PAINT_PROPS (line 62) · loadImage() (line 164)

## Symbols

### EXPORT_WIDTH
*const* · line 9 · exported

### normalizeColor
*function* · line 38 · exported
> Any CSS colour (incl. color-mix/oklab) -> "#rrggbb" or "rgba(...)" by painting one pixel.
- Uses: [[export.ts]]

### serializeChart
*function* · line 65 · exported
> Serialise the SVG inside a rendered chart container, inlining computed colours and fonts.
- Calls: [[export.ts#normalizeColor|normalizeColor()]]
- Uses: [[export.ts]]

### withOffscreenChart
*function* · line 142 · exported
> Render a chart offscreen at a fixed width in the light theme and run `fn` on its container.
- Calls: [[export.ts]]
- Uses: [[Components/Chart|<Chart>]], [[export.ts#EXPORT_WIDTH|EXPORT_WIDTH]]

### chartToSvg
*function* · line 160 · exported
- Calls: [[export.ts#withOffscreenChart|withOffscreenChart()]]
- Uses: [[export.ts#EXPORT_WIDTH|EXPORT_WIDTH]], [[export.ts#serializeChart|serializeChart()]]
- Used in: [[output/actions.ts]]

### svgToPng
*function* · line 174 · exported
> Rasterise an SVG string to PNG at `scale` (default 2x for crisp print).
- Calls: [[export.ts]]

### chartToPng
*function* · line 186 · exported
- Calls: [[export.ts#chartToSvg|chartToSvg()]], [[export.ts#svgToPng|svgToPng()]]
- Uses: [[export.ts#EXPORT_WIDTH|EXPORT_WIDTH]]
- Used in: [[output/actions.ts]]

### chartToPngDataUrl
*function* · line 192 · exported
> PNG as a data: URL (for rich-HTML clipboard copies).
- Calls: [[export.ts#chartToPng|chartToPng()]]
- Uses: [[export.ts#EXPORT_WIDTH|EXPORT_WIDTH]]
- Used in: [[output/actions.ts]]

### fileStem
*function* · line 204 · exported
> Safe file name stem from a title.
- Used in: [[output/actions.ts]]
