---
id: "src/features/coding/dialogs/SmallDialogs.tsx#CodeEditDialog"
type: component
file: src/features/coding/dialogs/SmallDialogs.tsx
line: 13
area: features/coding
---

# <CodeEditDialog>

*React component* · defined in [[SmallDialogs.tsx]] (line 13) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[tree.ts#canReparent|canReparent()]]
- [[coding/actions.ts#commit|commit()]]
- [[coding/actions.ts#createCode|createCode()]]
- [[coding/actions.ts#deleteCode|deleteCode()]]
- [[palette.ts#nextCodeColor|nextCodeColor()]]
- [[palette.ts#normaliseHex|normaliseHex()]]
- [[rules.ts#parseRules|parseRules()]]
- [[coding/hooks.ts#plural|plural()]]
- [[rules.ts#rulesFromText|rulesFromText()]]
- [[useOrderedCodes|useOrderedCodes()]]
- [[useStore]]

## Renders
- [[ConfirmDialog|<ConfirmDialog>]]
- [[Modal|<Modal>]]

## Uses
- [[palette.ts#CODE_PALETTE|CODE_PALETTE]]
- [[useCodingUi]]

## Reads
- [[useStore/coding|useStore.coding]] · selector

## Writes
- [[useCodingUi/dialog|useCodingUi.dialog]] · getState.set, set()
- [[selectedCodeId|useCodingUi.selectedCodeId]] · getState.set, set()

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · getState

## Opens
- [[merge-code|coding: merge-code]]

## Rendered by
- [[CodingDialog|<CodingDialog>]]

## Renders
- [[code-edit|coding: code-edit]]
