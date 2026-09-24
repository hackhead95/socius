---
id: src/features/ai/ExplainPanel.tsx
type: module
file: src/features/ai/ExplainPanel.tsx
area: features/ai
---

# src/features/ai/ExplainPanel.tsx

*Module* · area [[features - ai|features/ai]] · 127 lines

> The "Explain with AI" panel under an Output item: first what will be sent and to whom, then the streamed explanation with Stop, Copy, Add to output and a hand-over to the Socius assistant.

## Imports
- [[react]] · value
- [[output.ts]] · type-only
- [[store.ts]] · value
- `src/features/ai/ai.css` · side-effect
- [[AiBits.tsx]] · value
- [[AiText.tsx]] · value
- [[explainPrompt.ts]] · value
- [[explainStore.ts]] · value
- [[ai/hooks.ts]] · value
- [[open.ts]] · value
- [[platform/ai.ts]] · value
- [[host.ts]] · value

## Imported by
- [[OutputViewer.tsx]] · value

## Symbols

### ExplainPanel
*component* · line 16 · exported · note: [[ExplainPanel|<ExplainPanel>]]
- Renders: [[AiActivityLine|<AiActivityLine>]], [[AiErrorDetails|<AiErrorDetails>]], [[AiLoadProgress|<AiLoadProgress>]], [[AiProviderNote|<AiProviderNote>]], [[AiText|<AiText>]]
- Calls: [[ai/hooks.ts#openAiSettings|openAiSettings()]], [[explainPrompt.ts#buildExplainPrompt|buildExplainPrompt()]], [[explainPrompt.ts#byteLength|byteLength()]], [[explainPrompt.ts#plainText|plainText()]], [[host.ts#copyToClipboard|copyToClipboard()]], [[open.ts#openAssistant|openAssistant()]], [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]], [[useAiStatus|useAiStatus()]], [[useExplain]]
- Uses: [[AiBits.tsx#SET_UP_AI|SET_UP_AI]], [[useExplain]], [[useStore]]
- Reads: [[panels|useExplain.panels]]
- Store actions: [[addToOutput()|useExplain.addToOutput()]], [[close()|useExplain.close()]], [[run()|useExplain.run()]], [[setPending()|useExplain.setPending()]], [[stop()|useExplain.stop()]], [[toast()|useStore.toast()]]
- Rendered by: [[OutputItemView|<OutputItemView>]]
