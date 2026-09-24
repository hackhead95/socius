---
id: src/features/coding/RetrievalView.tsx
type: module
file: src/features/coding/RetrievalView.tsx
area: features/coding
---

# src/features/coding/RetrievalView.tsx

*Module* · area [[features - coding|features/coding]] · 202 lines

> Code retrieval: every segment coded with a code, with source, attributes and context.

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[AiBits.tsx]] · value
- [[ai/hooks.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[coding/ai.ts]] · value
- [[coding/analysis.ts]] · value
- [[exports.ts]] · value
- [[tree.ts]] · value
- [[platform/ai.ts]] · value
- [[host.ts]] · value

## Imported by
- [[CodingWorkspace.tsx]] · value

## Private helpers
PAGE (line 18)

## Symbols

### RetrievalView
*component* · line 20 · exported · note: [[RetrievalView|<RetrievalView>]]
- Renders: [[AiLoadProgress|<AiLoadProgress>]], [[AiProviderNote|<AiProviderNote>]], [[Swatch|<Swatch>]]
- Calls: [[coding/actions.ts#createMemo|createMemo()]], [[coding/ai.ts#buildSummaryPrompt|buildSummaryPrompt()]], [[coding/ai.ts#spreadSample|spreadSample()]], [[coding/analysis.ts#attributeKeys|attributeKeys()]], [[coding/analysis.ts#attributeValues|attributeValues()]], [[coding/analysis.ts#constantAttributeKeys|constantAttributeKeys()]], [[coding/analysis.ts#orderedAttributes|orderedAttributes()]], [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#safeFileName|safeFileName()]], [[coding/hooks.ts#saveCsv|saveCsv()]], [[coding/hooks.ts#saveXlsx|saveXlsx()]], [[coding/hooks.ts#toast|toast()]], [[exports.ts#originLabel|originLabel()]], [[exports.ts#segmentTable|segmentTable()]], [[host.ts#copyToClipboard|copyToClipboard()]], [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]], [[platform/ai.ts#aiErrorText|aiErrorText()]], [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]], [[platform/ai.ts#askAI|askAI()]], [[tree.ts#codePath|codePath()]], [[tree.ts#descendantIds|descendantIds()]], [[uiStore.ts#jumpTo|jumpTo()]], [[useAiStatus|useAiStatus()]], [[useCodingUi]], [[useOrderedCodes|useOrderedCodes()]] … +2
- Uses: [[RetrievalView.tsx]]
- Reads: [[selectedCodeId|useCodingUi.selectedCodeId]], [[useStore/coding|useStore.coding]]
- Writes: [[selectedCodeId|useCodingUi.selectedCodeId]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]]
