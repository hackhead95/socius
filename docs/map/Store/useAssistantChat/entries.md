---
id: "store-key:useAssistantChat.entries"
type: store-key
file: src/features/assistant/chat-store.ts
line: 61
area: features/assistant
---

# useAssistantChat.entries

*Store state key* · defined in [[chat-store.ts]] (line 61) · area [[features - assistant|features/assistant]]

- **Store:** useAssistantChat

## Read by
- [[AssistantPanel|<AssistantPanel>]] · selector
- [[controller.ts#retryLast|retryLast()]] · alias
- [[controller.ts#runArtifact|runArtifact()]] · alias
- [[controller.ts#sendMessage|sendMessage()]] · alias
- [[scenarios.test.ts]] · alias, getState
- [[patchEntry()|useAssistantChat.patchEntry()]]

## Written by
- [[controller.ts#retryLast|retryLast()]] · setState
- [[controller.ts#sendMessage|sendMessage()]] · setState
- [[clear()|useAssistantChat.clear()]]
- [[patchEntry()|useAssistantChat.patchEntry()]]

## Store
- [[useAssistantChat]]
