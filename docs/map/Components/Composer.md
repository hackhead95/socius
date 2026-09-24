---
id: "src/features/assistant/AssistantPanel.tsx#Composer"
type: component
file: src/features/assistant/AssistantPanel.tsx
line: 433
area: features/assistant
---

# <Composer>

*React component* · defined in [[AssistantPanel.tsx]] (line 433) · area [[features - assistant|features/assistant]]

## Calls
- [[controller.ts#sendMessage|sendMessage()]]
- [[useAssistantChat]]
- [[useStore]]

## Renders
- [[AsIcon|<AsIcon>]]

## Uses
- [[controller.ts#stopAssistant|stopAssistant()]]
- [[useAssistantChat]]

## Reads
- [[draft|useAssistantChat.draft]] · selector
- [[useAssistantChat/focusOutputId|useAssistantChat.focusOutputId]] · selector
- [[running|useAssistantChat.running]] · selector
- [[dataset|useStore.dataset]] · selector
- [[outputs|useStore.outputs]] · selector

## Calls store actions
- [[setDraft()|useAssistantChat.setDraft()]] · selector
- [[setFocusOutput()|useAssistantChat.setFocusOutput()]] · getState

## Rendered by
- [[AssistantPanel|<AssistantPanel>]]

## Binds shortcut
- [[Enter (Composer)]]
