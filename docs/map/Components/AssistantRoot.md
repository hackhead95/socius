---
id: "src/features/assistant/AssistantRoot.tsx#AssistantRoot"
type: component
file: src/features/assistant/AssistantRoot.tsx
line: 15
area: features/assistant
---

# <AssistantRoot>

*React component* · defined in [[AssistantRoot.tsx]] (line 15) · area [[features - assistant|features/assistant]]

- **Exported:** yes

## Calls
- [[open.ts#assistantShortcutLabel|assistantShortcutLabel()]]
- [[AssistantRoot.tsx#isAssistantShortcut|isAssistantShortcut()]]
- [[controller.ts#sendMessage|sendMessage()]]
- [[open.ts#toggleAssistant|toggleAssistant()]]
- [[useAssistantUi]]

## Renders
- [[AsIcon|<AsIcon>]]
- [[AssistantPanel|<AssistantPanel>]]

## Uses
- [[useAssistantChat]]
- [[useAssistantUi]]

## Reads
- [[running|useAssistantChat.running]] · alias
- [[useAssistantUi/open|useAssistantUi.open]] · selector
- [[request|useAssistantUi.request]] · selector

## Calls store actions
- [[setDraft()|useAssistantChat.setDraft()]] · alias
- [[setFocusOutput()|useAssistantChat.setFocusOutput()]] · alias
- [[consumeRequest()|useAssistantUi.consumeRequest()]] · getState
- [[setOpen()|useAssistantUi.setOpen()]] · getState

## Rendered by
- [[Components/App|<App>]]
