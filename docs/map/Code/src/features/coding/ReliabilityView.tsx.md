---
id: src/features/coding/ReliabilityView.tsx
type: module
file: src/features/coding/ReliabilityView.tsx
area: features/coding
---

# src/features/coding/ReliabilityView.tsx

*Module* · area [[features - coding|features/coding]] · 188 lines

> Intercoder reliability: compare two coders over the sources both coded.

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[outputs.ts]] · value
- [[coding/reliability.ts]] · value

## Imported by
- [[CodingWorkspace.tsx]] · value

## Private helpers
fmt() (line 11)

## Symbols

### ReliabilityView
*component* · line 16 · exported · note: [[ReliabilityView|<ReliabilityView>]]
- Renders: [[OneSidedNote|<OneSidedNote>]], [[Swatch|<Swatch>]]
- Calls: [[ReliabilityView.tsx]], [[coding/hooks.ts#plural|plural()]], [[coding/reliability.ts#compareCoders|compareCoders()]], [[coding/reliability.ts#landisKoch|landisKoch()]], [[outputs.ts#reliabilityOutput|reliabilityOutput()]], [[uiStore.ts#jumpTo|jumpTo()]], [[uiStore.ts#openLocalDialog|openLocalDialog()]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Store actions: [[addOutput()|useStore.addOutput()]]
- Opens: [[coding/coders|coding: coders]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]]

### OneSidedNote
*component* · line 166 · note: [[OneSidedNote|<OneSidedNote>]]
> Sources only one coder coded: say so, and let the researcher decide whether they count.
- Calls: [[coding/hooks.ts#plural|plural()]]
