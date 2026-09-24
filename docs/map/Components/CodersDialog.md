---
id: "src/features/coding/dialogs/SmallDialogs.tsx#CodersDialog"
type: component
file: src/features/coding/dialogs/SmallDialogs.tsx
line: 240
area: features/coding
---

# <CodersDialog>

*React component* · defined in [[SmallDialogs.tsx]] (line 240) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[coding/actions.ts#addCoder|addCoder()]]
- [[coding/hooks.ts#plural|plural()]]
- [[coding/actions.ts#removeCoder|removeCoder()]]
- [[coding/actions.ts#renameCoder|renameCoder()]]
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]]
- [[coding/hooks.ts#toast|toast()]]
- [[useCodingUi]]
- [[useStore]]

## Renders
- [[ConfirmDialog|<ConfirmDialog>]]
- [[Modal|<Modal>]]

## Reads
- [[showAllCoders|useCodingUi.showAllCoders]] · selector
- [[useStore/coding|useStore.coding]] · selector

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · selector

## Rendered by
- [[CodingDialog|<CodingDialog>]]

## Renders
- [[coding/coders|coding: coders]]
