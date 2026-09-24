---
id: src/features/coding/QuickCode.tsx
type: module
file: src/features/coding/QuickCode.tsx
area: features/coding
---

# src/features/coding/QuickCode.tsx

*Module* · area [[features - coding|features/coding]] · 147 lines

> Quick-code picker: search codes, create a code inline, number keys 1-9 for recent codes.

## Imports
- [[react]] · value
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[tree.ts]] · value

## Imported by
- [[Reader.tsx]] · value
- [[ResponsesView.tsx]] · value

## Types
QuickCodeProps (line 11)

## Symbols

### QuickCode
*component* · line 26 · exported · note: [[QuickCode|<QuickCode>]]
- Renders: [[Swatch|<Swatch>]]
- Calls: [[tree.ts#codePath|codePath()]], [[useCodingUi]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]]
- Reads: [[recentCodeIds|useCodingUi.recentCodeIds]], [[useStore/coding|useStore.coding]]
- Rendered by: [[Reader|<Reader>]], [[ResponsesView|<ResponsesView>]]
