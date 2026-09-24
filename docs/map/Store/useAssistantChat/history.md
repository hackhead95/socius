---
id: "store-key:useAssistantChat.history"
type: store-key
file: src/features/assistant/chat-store.ts
line: 63
area: features/assistant
---

# useAssistantChat.history

*Store state key* · defined in [[chat-store.ts]] (line 63) · area [[features - assistant|features/assistant]]

> The model-side conversation (with tool calls), for follow-up questions.

- **Store:** useAssistantChat

## Read by
- [[controller.ts#sendMessage|sendMessage()]] · alias
- [[scenarios.test.ts]] · getState

## Written by
- [[controller.ts#sendMessage|sendMessage()]] · setState
- [[clear()|useAssistantChat.clear()]]

## Store
- [[useAssistantChat]]
