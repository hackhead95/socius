---
id: "store-key:useAssistantUi.open"
type: store-key
file: src/features/assistant/open.ts
line: 14
area: features/assistant
---

# useAssistantUi.open

*Store state key* · defined in [[open.ts]] (line 14) · area [[features - assistant|features/assistant]]

- **Store:** useAssistantUi

## Read by
- [[AssistantRoot|<AssistantRoot>]] · selector
- [[AssistantPanel.tsx#currentContext|currentContext()]] · getState
- [[features.test.ts]] · getState
- [[open.ts#toggleAssistant|toggleAssistant()]] · getState

## Written by
- [[Ask the Socius assistant|AI > Ask the Socius assistant...]] · runAiFeature
- [[Features/assistant|Ask the Socius assistant]]
- [[open.ts#closeAssistant|closeAssistant()]] · setState
- [[open.ts#openAssistant|openAssistant()]] · setState
- [[features.test.ts]] · setState
- [[palette.test.tsx]] · setState
- [[open.ts#toggleAssistant|toggleAssistant()]] · setState
- [[setOpen()|useAssistantUi.setOpen()]]

## Store
- [[useAssistantUi]]
