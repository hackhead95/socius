---
id: "store-key:useAssistantChat.running"
type: store-key
file: src/features/assistant/chat-store.ts
line: 64
area: features/assistant
---

# useAssistantChat.running

*Store state key* · defined in [[chat-store.ts]] (line 64) · area [[features - assistant|features/assistant]]

- **Store:** useAssistantChat

## Read by
- [[AssistantPanel|<AssistantPanel>]] · selector
- [[AssistantRoot|<AssistantRoot>]] · alias
- [[Composer|<Composer>]] · selector
- [[controller.ts#retryLast|retryLast()]] · alias
- [[controller.ts#sendMessage|sendMessage()]] · alias
- [[scenarios.test.ts]] · getState

## Written by
- [[controller.ts#sendMessage|sendMessage()]] · setState
- [[clear()|useAssistantChat.clear()]]

## Store
- [[useAssistantChat]]
