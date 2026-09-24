---
id: "src/features/assistant/AssistantPanel.tsx#Empty"
type: component
file: src/features/assistant/AssistantPanel.tsx
line: 193
area: features/assistant
---

# <Empty>

*React component* · defined in [[AssistantPanel.tsx]] (line 193) · area [[features - assistant|features/assistant]]

## Calls
- [[controller.ts#sendMessage|sendMessage()]]
- [[starters.ts#starterPrompts|starterPrompts()]]
- [[useStore]]

## Uses
- [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- [[AiBits.tsx#SET_UP_AI|SET_UP_AI]]
- [[useAssistantChat]]
- [[useAssistantUiNeedsSetup]]

## Reads
- [[useStore/coding|useStore.coding]] · selector
- [[dataset|useStore.dataset]] · selector
- [[outputs|useStore.outputs]] · selector
- [[useStore/tab|useStore.tab]] · selector

## Writes
- [[show|useAssistantUiNeedsSetup.show]] · setState

## Calls store actions
- [[setDraft()|useAssistantChat.setDraft()]] · getState

## Rendered by
- [[AssistantPanel|<AssistantPanel>]]
