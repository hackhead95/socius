---
id: src/features/coding/MemosView.tsx
type: module
file: src/features/coding/MemosView.tsx
area: features/coding
---

# src/features/coding/MemosView.tsx

*Module* · area [[features - coding|features/coding]] · 127 lines

> Memos: project memos and memos linked to a code or a source.

## Imports
- [[react]] · value
- [[format-date.ts]] · value
- [[store.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[host.ts]] · value
- [[Modal.tsx]] · value

## Tested by
- [[ui-fixes.test.tsx]] · import

## Imported by
- [[CodingWorkspace.tsx]] · value
- [[ui-fixes.test.tsx]] · value

## Symbols

### MemosView
*component* · line 13 · exported · note: [[MemosView|<MemosView>]]
- Renders: [[ConfirmDialog|<ConfirmDialog>]], [[Swatch|<Swatch>]]
- Calls: [[coding/actions.ts#createMemo|createMemo()]], [[coding/actions.ts#deleteMemo|deleteMemo()]], [[coding/actions.ts#updateMemo|updateMemo()]], [[coding/hooks.ts#saveAndReport|saveAndReport()]], [[coding/hooks.ts#toast|toast()]], [[format-date.ts#formatDateTime|formatDateTime()]], [[host.ts#copyToClipboard|copyToClipboard()]], [[useCodingUi]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]], [[ui-fixes.test.tsx]]
