---
id: src/lib/coding/palette.ts
type: module
file: src/lib/coding/palette.ts
area: lib/coding
---

# src/lib/coding/palette.ts

*Module* · area [[lib - coding|lib/coding]] · 34 lines

> Highlighter colours for codes. Mid-luminance, saturated hues that stay distinguishable as a translucent fill on white paper and on the dark theme's surface, and as solid gutter bars.

## Imported by
- [[coding/actions.ts]] · value
- [[CodebookPanel.tsx]] · value
- [[AiDialogs.tsx]] · value
- [[SmallDialogs.tsx]] · value
- [[codebookIO.ts]] · value
- [[example.ts]] · value

## Symbols

### CODE_PALETTE
*const* · line 4 · exported
> Highlighter colours for codes. Mid-luminance, saturated hues that stay distinguishable as a translucent fill on white paper and on the dark theme's surface, and as solid gutter bars.
- Used in: [[CodebookPanel.tsx]], [[SmallDialogs.tsx]], [[example.ts]]

### nextCodeColor
*function* · line 20 · exported
> The first palette colour not yet used by `used`; cycles when all are taken.
- Uses: [[palette.ts#CODE_PALETTE|CODE_PALETTE]]
- Used in: [[coding/actions.ts]], [[AiDialogs.tsx]], [[SmallDialogs.tsx]], [[codebookIO.ts]]

### normaliseHex
*function* · line 27 · exported
> Normalise a user colour to #rrggbb, or null when invalid.
- Used in: [[SmallDialogs.tsx]], [[codebookIO.ts]]
