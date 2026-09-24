---
id: "src/features/ai/ExplainPanel.tsx#ExplainPanel"
type: component
file: src/features/ai/ExplainPanel.tsx
line: 16
area: features/ai
---

# <ExplainPanel>

*React component* · defined in [[ExplainPanel.tsx]] (line 16) · area [[features - ai|features/ai]]

- **Exported:** yes

## Calls
- [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]]
- [[explainPrompt.ts#buildExplainPrompt|buildExplainPrompt()]]
- [[explainPrompt.ts#byteLength|byteLength()]]
- [[host.ts#copyToClipboard|copyToClipboard()]]
- [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- [[open.ts#openAssistant|openAssistant()]]
- [[explainPrompt.ts#plainText|plainText()]]
- [[useAiStatus|useAiStatus()]]
- [[useExplain]]

## Renders
- [[AiActivityLine|<AiActivityLine>]]
- [[AiErrorDetails|<AiErrorDetails>]]
- [[AiLoadProgress|<AiLoadProgress>]]
- [[AiProviderNote|<AiProviderNote>]]
- [[AiText|<AiText>]]

## Uses
- [[AiBits.tsx#SET_UP_AI|SET_UP_AI]]
- [[useExplain]]
- [[useStore]]

## Reads
- [[panels|useExplain.panels]] · selector

## Calls store actions
- [[addToOutput()|useExplain.addToOutput()]] · alias
- [[close()|useExplain.close()]] · alias
- [[run()|useExplain.run()]] · alias
- [[setPending()|useExplain.setPending()]] · alias
- [[stop()|useExplain.stop()]] · alias
- [[toast()|useStore.toast()]] · getState

## Rendered by
- [[OutputItemView|<OutputItemView>]]
