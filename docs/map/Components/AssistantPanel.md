---
id: "src/features/assistant/AssistantPanel.tsx#AssistantPanel"
type: component
file: src/features/assistant/AssistantPanel.tsx
line: 21
area: features/assistant
---

# <AssistantPanel>

*React component* · defined in [[AssistantPanel.tsx]] (line 21) · area [[features - assistant|features/assistant]]

- **Exported:** yes

## Calls
- [[useAiStatus|useAiStatus()]]
- [[useAssistantChat]]

## Renders
- [[AsIcon|<AsIcon>]]
- [[Composer|<Composer>]]
- [[Components/Empty|<Empty>]]
- [[Entry|<Entry>]]
- [[ResizeHandle|<ResizeHandle>]]
- [[SeeMenu|<SeeMenu>]]

## Uses
- [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- [[AiBits.tsx#SET_UP_AI|SET_UP_AI]]
- [[useAssistantChat]]

## Reads
- [[entries|useAssistantChat.entries]] · selector
- [[running|useAssistantChat.running]] · selector
- [[width|useAssistantChat.width]] · selector

## Calls store actions
- [[clear()|useAssistantChat.clear()]] · getState

## Rendered by
- [[AssistantRoot|<AssistantRoot>]]

## Binds shortcut
- [[Escape (AssistantPanel)]]
