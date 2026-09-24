---
id: "src/features/coding/RetrievalView.tsx#RetrievalView"
type: component
file: src/features/coding/RetrievalView.tsx
line: 20
area: features/coding
---

# <RetrievalView>

*React component* · defined in [[RetrievalView.tsx]] (line 20) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]]
- [[platform/ai.ts#askAI|askAI()]]
- [[coding/analysis.ts#attributeKeys|attributeKeys()]]
- [[coding/analysis.ts#attributeValues|attributeValues()]]
- [[coding/ai.ts#buildSummaryPrompt|buildSummaryPrompt()]]
- [[tree.ts#codePath|codePath()]]
- [[coding/analysis.ts#constantAttributeKeys|constantAttributeKeys()]]
- [[host.ts#copyToClipboard|copyToClipboard()]]
- [[coding/actions.ts#createMemo|createMemo()]]
- [[tree.ts#descendantIds|descendantIds()]]
- [[uiStore.ts#jumpTo|jumpTo()]]
- [[coding/analysis.ts#orderedAttributes|orderedAttributes()]]
- [[exports.ts#originLabel|originLabel()]]
- [[coding/hooks.ts#plural|plural()]]
- [[coding/hooks.ts#safeFileName|safeFileName()]]
- [[coding/hooks.ts#saveCsv|saveCsv()]]
- [[coding/hooks.ts#saveXlsx|saveXlsx()]]
- [[exports.ts#segmentTable|segmentTable()]]
- [[coding/ai.ts#spreadSample|spreadSample()]]
- [[coding/hooks.ts#toast|toast()]]
- [[useAiStatus|useAiStatus()]]
- [[useCodingUi]]
- [[useOrderedCodes|useOrderedCodes()]]
- [[useStore]]
- [[useVisibleSegments|useVisibleSegments()]]

## Renders
- [[AiLoadProgress|<AiLoadProgress>]]
- [[AiProviderNote|<AiProviderNote>]]
- [[Swatch|<Swatch>]]

## Reads
- [[selectedCodeId|useCodingUi.selectedCodeId]] · hook (destructured)
- [[useStore/coding|useStore.coding]] · selector

## Writes
- [[selectedCodeId|useCodingUi.selectedCodeId]] · set alias

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · hook (destructured)

## Rendered by
- [[CodingWorkspace|<CodingWorkspace>]]
