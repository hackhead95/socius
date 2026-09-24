---
id: "src/features/coding/CodebookPanel.tsx#CodebookPanel"
type: component
file: src/features/coding/CodebookPanel.tsx
line: 16
area: features/coding
---

# <CodebookPanel>

*React component* · defined in [[CodebookPanel.tsx]] (line 16) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[features.ts#aiFeature|aiFeature()]]
- [[coding/actions.ts#applyCode|applyCode()]]
- [[tree.ts#canReparent|canReparent()]]
- [[coding/actions.ts#createCode|createCode()]]
- [[coding/actions.ts#createMemo|createMemo()]]
- [[coding/actions.ts#deleteCode|deleteCode()]]
- [[tree.ts#descendantIds|descendantIds()]]
- [[example.ts#describeCodebookSize|describeCodebookSize()]]
- [[coding/actions.ts#moveCode|moveCode()]]
- [[uiStore.ts#openLocalDialog|openLocalDialog()]]
- [[coding/hooks.ts#plural|plural()]]
- [[coding/hooks.ts#toast|toast()]]
- [[coding/actions.ts#updateCode|updateCode()]]
- [[useCodingUi]]
- [[useOrderedCodes|useOrderedCodes()]]
- [[useStore]]
- [[useVisibleSegments|useVisibleSegments()]]

## Renders
- [[ConfirmDialog|<ConfirmDialog>]]
- [[Floating|<Floating>]]
- [[MenuButton|<MenuButton>]]

## Uses
- [[palette.ts#CODE_PALETTE|CODE_PALETTE]]

## Reads
- [[collapsed|useCodingUi.collapsed]] · hook (destructured)
- [[pending|useCodingUi.pending]] · hook (destructured)
- [[selectedCodeId|useCodingUi.selectedCodeId]] · hook (destructured)
- [[useStore/coding|useStore.coding]] · selector

## Writes
- [[collapsed|useCodingUi.collapsed]] · set alias
- [[pending|useCodingUi.pending]] · set alias
- [[selectedCodeId|useCodingUi.selectedCodeId]] · set alias
- [[useCodingUi/view|useCodingUi.view]] · set alias

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · hook (destructured)

## Opens
- [[ai-codebook|coding: ai-codebook]] · openLocalDialog
- [[auto-code|coding: auto-code]] · openLocalDialog
- [[code-edit|coding: code-edit]] · openLocalDialog
- [[export|coding: export]] · openLocalDialog
- [[merge-code|coding: merge-code]] · openLocalDialog

## Rendered by
- [[CodingWorkspace|<CodingWorkspace>]]
