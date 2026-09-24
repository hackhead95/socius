---
id: src/features/coding/ResponsesView.tsx
type: module
file: src/features/coding/ResponsesView.tsx
area: features/coding
---

# src/features/coding/ResponsesView.tsx

*Module* · area [[features - coding|features/coding]] · 467 lines

> Response mode: one open-ended answer per row, virtualised for thousands of rows. Keyboard: j/k or arrows move, x or Space selects, 1-9 toggle the first nine codes, / finds a code, o opens the response in the reading view for passage-level coding.

## Imports
- [[@tanstack-react-virtual|@tanstack/react-virtual]] · value
- [[react]] · value
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[QuickCode.tsx]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[coding/analysis.ts]] · value

## Imported by
- [[CodingWorkspace.tsx]] · value

## Private helpers
codeIdsFor() (line 390)

## Symbols

### ResponsesView
*component* · line 16 · exported · note: [[ResponsesView|<ResponsesView>]]
- Renders: [[CodeChip|<CodeChip>]], [[Floating|<Floating>]], [[QuickCode|<QuickCode>]], [[ResponseRow|<ResponseRow>]]
- Calls: [[ResponsesView.tsx]], [[coding/actions.ts#createCode|createCode()]], [[coding/actions.ts#setWholeResponseCode|setWholeResponseCode()]], [[coding/analysis.ts#attributeKeys|attributeKeys()]], [[coding/analysis.ts#attributeValues|attributeValues()]], [[coding/hooks.ts#plural|plural()]], [[uiStore.ts#jumpTo|jumpTo()]], [[uiStore.ts#openLocalDialog|openLocalDialog()]], [[useCodeMap|useCodeMap()]], [[useCodingUi]], [[useQuickKeyCodes|useQuickKeyCodes()]], [[useSegmentIndex|useSegmentIndex()]], [[useStore]]
- Uses: [[useCodingUi]]
- Reads: [[dataset|useStore.dataset]], [[exampleNote|useCodingUi.exampleNote]], [[selectedCodeId|useCodingUi.selectedCodeId]], [[useStore/coding|useStore.coding]]
- Writes: [[analyseTab|useCodingUi.analyseTab]], [[exampleNote|useCodingUi.exampleNote]], [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Opens: [[ai-suggest|coding: ai-suggest]], [[coding/import|coding: import]], [[export-dataset|coding: export-dataset]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]]

### ResponseRow
*component* · line 402 · note: [[ResponseRow|<ResponseRow>]]
- Renders: [[CodeChip|<CodeChip>]]
