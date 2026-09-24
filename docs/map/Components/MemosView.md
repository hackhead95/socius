---
id: "src/features/coding/MemosView.tsx#MemosView"
type: component
file: src/features/coding/MemosView.tsx
line: 13
area: features/coding
---

# <MemosView>

*React component* · defined in [[MemosView.tsx]] (line 13) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[host.ts#copyToClipboard|copyToClipboard()]]
- [[coding/actions.ts#createMemo|createMemo()]]
- [[coding/actions.ts#deleteMemo|deleteMemo()]]
- [[format-date.ts#formatDateTime|formatDateTime()]]
- [[coding/hooks.ts#saveAndReport|saveAndReport()]]
- [[coding/hooks.ts#toast|toast()]]
- [[coding/actions.ts#updateMemo|updateMemo()]]
- [[useCodingUi]]
- [[useOrderedCodes|useOrderedCodes()]]
- [[useStore]]

## Renders
- [[ConfirmDialog|<ConfirmDialog>]]
- [[Swatch|<Swatch>]]

## Reads
- [[useStore/coding|useStore.coding]] · selector

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · selector

## Rendered by
- [[CodingWorkspace|<CodingWorkspace>]]
- [[ui-fixes.test.tsx]]
