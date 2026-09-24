---
id: "src/features/assistant/AssistantPanel.tsx#Composer"
type: component
file: src/features/assistant/AssistantPanel.tsx
line: 456
area: features/assistant
---

# <Composer>

*React component* · defined in [[AssistantPanel.tsx]] (line 456) · area [[features - assistant|features/assistant]]

## Calls
- [[controller.ts#sendMessage|sendMessage()]]
- [[useAssistantChat]]
- [[useAssistantUiNeedsSetup]]
- [[useStore]]

## Renders
- [[AsIcon|<AsIcon>]]

## Uses
- [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- [[AiBits.tsx#SET_UP_AI|SET_UP_AI]]
- [[controller.ts#stopAssistant|stopAssistant()]]
- [[useAssistantChat]]
- [[useAssistantUiNeedsSetup]]

## Reads
- [[draft|useAssistantChat.draft]] · selector
- [[useAssistantChat/focusOutputId|useAssistantChat.focusOutputId]] · selector
- [[running|useAssistantChat.running]] · selector
- [[show|useAssistantUiNeedsSetup.show]] · selector
- [[dataset|useStore.dataset]] · selector
- [[outputs|useStore.outputs]] · selector

## Writes
- [[show|useAssistantUiNeedsSetup.show]] · setState

## Calls store actions
- [[setDraft()|useAssistantChat.setDraft()]] · selector
- [[setFocusOutput()|useAssistantChat.setFocusOutput()]] · getState

## Rendered by
- [[AssistantPanel|<AssistantPanel>]]

## Binds shortcut
- [[Enter (Composer)]]
