---
id: "src/features/ai/hooks.ts#useAiStatus"
type: hook
file: src/features/ai/hooks.ts
line: 8
area: features/ai
---

# useAiStatus()

*React hook* · defined in [[ai/hooks.ts]] (line 8) · area [[features - ai|features/ai]]

> Current AI provider and whether it is ready. Re-renders when settings change.

- **Exported:** yes

## Calls
- [[platform/ai.ts#startAiStatus|startAiStatus()]]

## Uses
- [[platform/ai.ts#getAiStatus|getAiStatus()]]
- [[platform/ai.ts#subscribeAi|subscribeAi()]]

## Called by
- [[AiChip|<AiChip>]]
- [[AiCodebookDialog|<AiCodebookDialog>]]
- [[AiGate|<AiGate>]]
- [[AiProviderNote|<AiProviderNote>]]
- [[AiSettingsDialog|<AiSettingsDialog>]]
- [[AiSuggestDialog|<AiSuggestDialog>]]
- [[AssistantPanel|<AssistantPanel>]]
- [[CodingWorkspace|<CodingWorkspace>]]
- [[ExplainPanel|<ExplainPanel>]]
- [[RetrievalView|<RetrievalView>]]
- [[WebLlmSetup|<WebLlmSetup>]]
