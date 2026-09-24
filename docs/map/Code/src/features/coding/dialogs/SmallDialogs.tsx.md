---
id: src/features/coding/dialogs/SmallDialogs.tsx
type: module
file: src/features/coding/dialogs/SmallDialogs.tsx
area: features/coding
---

# src/features/coding/dialogs/SmallDialogs.tsx

*Module* · area [[features - coding|features/coding]] · 306 lines

> Code editor, merge, source editor and coder management dialogs.

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[uiStore.ts]] · value
- [[palette.ts]] · value
- [[rules.ts]] · value
- [[tree.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[CodingDialog.tsx]] · value

## Symbols

### CodeEditDialog
*component* · line 13 · exported · note: [[CodeEditDialog|<CodeEditDialog>]]
- Renders: [[ConfirmDialog|<ConfirmDialog>]], [[Modal|<Modal>]]
- Calls: [[coding/actions.ts#commit|commit()]], [[coding/actions.ts#createCode|createCode()]], [[coding/actions.ts#deleteCode|deleteCode()]], [[coding/hooks.ts#plural|plural()]], [[palette.ts#nextCodeColor|nextCodeColor()]], [[palette.ts#normaliseHex|normaliseHex()]], [[rules.ts#parseRules|parseRules()]], [[rules.ts#rulesFromText|rulesFromText()]], [[tree.ts#canReparent|canReparent()]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]]
- Uses: [[palette.ts#CODE_PALETTE|CODE_PALETTE]], [[useCodingUi]]
- Reads: [[useStore/coding|useStore.coding]]
- Writes: [[selectedCodeId|useCodingUi.selectedCodeId]], [[useCodingUi/dialog|useCodingUi.dialog]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Opens: [[merge-code|coding: merge-code]]
- Rendered by: [[CodingDialog|<CodingDialog>]]

### MergeCodeDialog
*component* · line 146 · exported · note: [[MergeCodeDialog|<MergeCodeDialog>]]
- Renders: [[Modal|<Modal>]]
- Calls: [[coding/actions.ts#mergeCode|mergeCode()]], [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#toast|toast()]], [[tree.ts#codePath|codePath()]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Rendered by: [[CodingDialog|<CodingDialog>]]

### DocEditDialog
*component* · line 192 · exported · note: [[DocEditDialog|<DocEditDialog>]]
- Renders: [[Modal|<Modal>]]
- Calls: [[coding/actions.ts#renameDoc|renameDoc()]], [[coding/actions.ts#setDocAttributes|setDocAttributes()]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Rendered by: [[CodingDialog|<CodingDialog>]]

### CodersDialog
*component* · line 240 · exported · note: [[CodersDialog|<CodersDialog>]]
- Renders: [[ConfirmDialog|<ConfirmDialog>]], [[Modal|<Modal>]]
- Calls: [[coding/actions.ts#addCoder|addCoder()]], [[coding/actions.ts#removeCoder|removeCoder()]], [[coding/actions.ts#renameCoder|renameCoder()]], [[coding/actions.ts#setActiveCoder|setActiveCoder()]], [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#toast|toast()]], [[useCodingUi]], [[useStore]]
- Reads: [[showAllCoders|useCodingUi.showAllCoders]], [[useStore/coding|useStore.coding]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Rendered by: [[CodingDialog|<CodingDialog>]]
