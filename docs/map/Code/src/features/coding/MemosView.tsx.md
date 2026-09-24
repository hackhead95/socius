---
id: src/features/coding/MemosView.tsx
type: module
file: src/features/coding/MemosView.tsx
area: features/coding
---

# src/features/coding/MemosView.tsx

*Module* · area [[features - coding|features/coding]] · 126 lines

> Memos: project memos and memos linked to a code or a source.

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[host.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[CodingWorkspace.tsx]] · value

## Symbols

### MemosView
*component* · line 12 · exported · note: [[MemosView|<MemosView>]]
- Renders: [[ConfirmDialog|<ConfirmDialog>]], [[Swatch|<Swatch>]]
- Calls: [[coding/actions.ts#createMemo|createMemo()]], [[coding/actions.ts#deleteMemo|deleteMemo()]], [[coding/actions.ts#updateMemo|updateMemo()]], [[coding/hooks.ts#saveAndReport|saveAndReport()]], [[coding/hooks.ts#toast|toast()]], [[host.ts#copyToClipboard|copyToClipboard()]], [[useCodingUi]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]]
