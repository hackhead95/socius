---
id: src/features/coding/ResponsesView.tsx
type: module
file: src/features/coding/ResponsesView.tsx
area: features/coding
---

# src/features/coding/ResponsesView.tsx

*Module* · area [[features - coding|features/coding]] · 482 lines

> Response mode: one open-ended answer per row, virtualised for thousands of rows. Keyboard: j/k or arrows move, x or Space selects, 1-9 toggle the first nine codes, / finds a code, o opens the response in the reading view for passage-level coding.

## Imports
- [[@tanstack-react-virtual|@tanstack/react-virtual]] · value
- [[react]] · value
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[coding/actions.ts]] · value
- [[exampleGuide.ts]] · value
- [[coding/hooks.ts]] · value
- [[QuickCode.tsx]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[coding/analysis.ts]] · value

## Tested by
- [[shortcut-precedence.test.tsx]] · import

## Imported by
- [[CodingWorkspace.tsx]] · value
- [[shortcut-precedence.test.tsx]] · value

## Private helpers
codeIdsFor() (line 392)

## Symbols

### ResponsesView
*component* · line 17 · exported · note: [[ResponsesView|<ResponsesView>]]
- Renders: [[CodeChip|<CodeChip>]], [[ExampleNextSteps|<ExampleNextSteps>]], [[Floating|<Floating>]], [[QuickCode|<QuickCode>]], [[ResponseRow|<ResponseRow>]]
- Calls: [[ResponsesView.tsx]], [[coding/actions.ts#createCode|createCode()]], [[coding/actions.ts#setWholeResponseCode|setWholeResponseCode()]], [[coding/analysis.ts#attributeKeys|attributeKeys()]], [[coding/analysis.ts#attributeValues|attributeValues()]], [[coding/hooks.ts#plural|plural()]], [[uiStore.ts#jumpTo|jumpTo()]], [[uiStore.ts#openLocalDialog|openLocalDialog()]], [[useCodeMap|useCodeMap()]], [[useCodingUi]], [[useQuickKeyCodes|useQuickKeyCodes()]], [[useSegmentIndex|useSegmentIndex()]], [[useStore]]
- Uses: [[exampleGuide.ts#NOT_CODED_FILTER_LABEL|NOT_CODED_FILTER_LABEL]], [[useCodingUi]]
- Reads: [[dataset|useStore.dataset]], [[exampleNote|useCodingUi.exampleNote]], [[selectedCodeId|useCodingUi.selectedCodeId]], [[useStore/coding|useStore.coding]]
- Writes: [[analyseTab|useCodingUi.analyseTab]], [[exampleNote|useCodingUi.exampleNote]], [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Opens: [[ai-suggest|coding: ai-suggest]], [[coding/import|coding: import]], [[export-dataset|coding: export-dataset]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]], [[shortcut-precedence.test.tsx]]

### ResponseRow
*component* · line 404 · note: [[ResponseRow|<ResponseRow>]]
- Renders: [[CodeChip|<CodeChip>]]

### ExampleNextSteps
*component* · line 473 · note: [[ExampleNextSteps|<ExampleNextSteps>]]
> What to do after reviewing the worked example (UI-018: this used to be a long toast that vanished before it could be read). Menu names come from the menu model (UI-029).
- Calls: [[exampleGuide.ts#workedExampleGuide|workedExampleGuide()]]
