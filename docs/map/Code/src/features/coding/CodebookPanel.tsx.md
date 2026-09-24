---
id: src/features/coding/CodebookPanel.tsx
type: module
file: src/features/coding/CodebookPanel.tsx
area: features/coding
---

# src/features/coding/CodebookPanel.tsx

*Module* · area [[features - coding|features/coding]] · 286 lines

> Codebook panel: hierarchical codes with counts, drag to reparent/reorder, quick actions.

## Imports
- [[react]] · value
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[features.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[example.ts]] · value
- [[palette.ts]] · value
- [[tree.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[CodingWorkspace.tsx]] · value

## Symbols

### CodebookPanel
*component* · line 16 · exported · note: [[CodebookPanel|<CodebookPanel>]]
- Renders: [[ConfirmDialog|<ConfirmDialog>]], [[Floating|<Floating>]], [[MenuButton|<MenuButton>]]
- Calls: [[coding/actions.ts#applyCode|applyCode()]], [[coding/actions.ts#createCode|createCode()]], [[coding/actions.ts#createMemo|createMemo()]], [[coding/actions.ts#deleteCode|deleteCode()]], [[coding/actions.ts#moveCode|moveCode()]], [[coding/actions.ts#updateCode|updateCode()]], [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#toast|toast()]], [[example.ts#describeCodebookSize|describeCodebookSize()]], [[features.ts#aiFeature|aiFeature()]], [[tree.ts#canReparent|canReparent()]], [[tree.ts#descendantIds|descendantIds()]], [[uiStore.ts#openLocalDialog|openLocalDialog()]], [[useCodingUi]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]], [[useVisibleSegments|useVisibleSegments()]]
- Uses: [[palette.ts#CODE_PALETTE|CODE_PALETTE]]
- Reads: [[collapsed|useCodingUi.collapsed]], [[pending|useCodingUi.pending]], [[selectedCodeId|useCodingUi.selectedCodeId]], [[useStore/coding|useStore.coding]]
- Writes: [[collapsed|useCodingUi.collapsed]], [[pending|useCodingUi.pending]], [[selectedCodeId|useCodingUi.selectedCodeId]], [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Opens: [[ai-codebook|coding: ai-codebook]], [[auto-code|coding: auto-code]], [[code-edit|coding: code-edit]], [[export|coding: export]], [[merge-code|coding: merge-code]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]]
