---
id: "store-key:useAssistantChat.focusOutputId"
type: store-key
file: src/features/assistant/chat-store.ts
line: 70
area: features/assistant
---

# useAssistantChat.focusOutputId

*Store state key* · defined in [[chat-store.ts]] (line 70) · area [[features - assistant|features/assistant]]

> Output item the next message is about (from "Explain with AI" etc.).

- **Store:** useAssistantChat

## Read by
- [[Composer|<Composer>]] · selector
- [[controller.ts#sendMessage|sendMessage()]] · alias

## Written by
- [[controller.ts#sendMessage|sendMessage()]] · setState
- [[clear()|useAssistantChat.clear()]]
- [[setFocusOutput()|useAssistantChat.setFocusOutput()]]

## Store
- [[useAssistantChat]]
