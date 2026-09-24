---
id: "src/features/ai/AiBits.tsx#AiProviderNote"
type: component
file: src/features/ai/AiBits.tsx
line: 29
area: features/ai
---

# <AiProviderNote>

*React component* · defined in [[AiBits.tsx]] (line 29) · area [[features - ai|features/ai]]

> Before anything is sent: which provider will receive what, and where it goes. `what` is a phrase like "150 excerpts"; `when` names the button, e.g. "When you click Suggest codes".

- **Exported:** yes

## Calls
- [[platform/ai.ts#getAiSettings|getAiSettings()]]
- [[useAiStatus|useAiStatus()]]
- [[ai-webllm.ts#webLlmChoice|webLlmChoice()]]

## Uses
- [[AiBits.tsx#AI_SETTINGS_LABEL|AI_SETTINGS_LABEL]]
- [[ai/hooks.ts#openAiSettings|openAiSettings()]]

## Reads
- [[aiSettings/webllm|aiSettings.webllm]] · getter

## Rendered by
- [[AiCodebookDialog|<AiCodebookDialog>]]
- [[AiSuggestDialog|<AiSuggestDialog>]]
- [[ExplainPanel|<ExplainPanel>]]
- [[RetrievalView|<RetrievalView>]]
