---
id: "src/features/assistant/chat-store.ts#useAssistantChat"
type: store
file: src/features/assistant/chat-store.ts
line: 81
area: features/assistant
---

# useAssistantChat

*Store* · defined in [[chat-store.ts]] (line 81) · area [[features - assistant|features/assistant]]

- **Exported:** yes

## Keys and who touches them
| key | written by | read by |
|---|---|---|
| [[controller]] | 2 ([[clear()\|useAssistantChat.clear()]], [[controller.ts#sendMessage\|sendMessage()]]) | 3 |
| [[datasetId]] | 2 ([[clear()\|useAssistantChat.clear()]], [[controller.ts#sendMessage\|sendMessage()]]) | 1 |
| [[draft]] | 2 ([[setDraft()\|useAssistantChat.setDraft()]], [[controller.ts#sendMessage\|sendMessage()]]) | 1 |
| [[entries]] | 4 ([[clear()\|useAssistantChat.clear()]], [[patchEntry()\|useAssistantChat.patchEntry()]], [[controller.ts#retryLast\|retryLast()]], [[controller.ts#sendMessage\|sendMessage()]]) | 6 |
| [[useAssistantChat/focusOutputId\|focusOutputId]] | 3 ([[clear()\|useAssistantChat.clear()]], [[setFocusOutput()\|useAssistantChat.setFocusOutput()]], [[controller.ts#sendMessage\|sendMessage()]]) | 2 |
| [[useAssistantChat/history\|history]] | 2 ([[clear()\|useAssistantChat.clear()]], [[controller.ts#sendMessage\|sendMessage()]]) | 2 |
| [[permissions]] | 1 ([[setPermission()\|useAssistantChat.setPermission()]]) | 4 |
| [[running]] | 2 ([[clear()\|useAssistantChat.clear()]], [[controller.ts#sendMessage\|sendMessage()]]) | 6 |
| [[width]] | 1 ([[setWidth()\|useAssistantChat.setWidth()]]) | 2 |

## Actions
| action | writes | callers |
|---|---|---|
| [[clear()]] | [[controller]], [[datasetId]], [[entries]], [[useAssistantChat/focusOutputId\|focusOutputId]], [[useAssistantChat/history\|history]], [[running]] | 2 |
| [[patchEntry()]] | [[entries]] | 3 |
| [[setDraft()]] | [[draft]] | 3 |
| [[setFocusOutput()]] | [[useAssistantChat/focusOutputId\|focusOutputId]] | 2 |
| [[setPermission()]] | [[permissions]] | 1 |
| [[setWidth()]] | [[width]] | 1 |

## Uses
- [[chat-store.ts#SEE_KEY|SEE_KEY]]
- [[chat-store.ts#WIDTH_KEY|WIDTH_KEY]]

## Writes
- [[socius.assistant.see]]
- [[socius.assistant.width]]

## State keys
- [[controller|useAssistantChat.controller]]
- [[datasetId|useAssistantChat.datasetId]]
- [[draft|useAssistantChat.draft]]
- [[entries|useAssistantChat.entries]]
- [[useAssistantChat/focusOutputId|useAssistantChat.focusOutputId]]
- [[useAssistantChat/history|useAssistantChat.history]]
- [[permissions|useAssistantChat.permissions]]
- [[running|useAssistantChat.running]]
- [[width|useAssistantChat.width]]

## Actions
- [[clear()|useAssistantChat.clear()]]
- [[patchEntry()|useAssistantChat.patchEntry()]]
- [[setDraft()|useAssistantChat.setDraft()]]
- [[setFocusOutput()|useAssistantChat.setFocusOutput()]]
- [[setPermission()|useAssistantChat.setPermission()]]
- [[setWidth()|useAssistantChat.setWidth()]]

## Called by
- [[AssistantPanel|<AssistantPanel>]]
- [[Composer|<Composer>]]
- [[ResizeHandle|<ResizeHandle>]]
- [[SeeMenu|<SeeMenu>]]

## Used by
- [[AssistantPanel|<AssistantPanel>]]
- [[AssistantRoot|<AssistantRoot>]]
- [[Composer|<Composer>]]
- [[Components/Empty|<Empty>]]
- [[AssistantPanel.tsx#currentContext|currentContext()]]
- [[controller.ts#dismissArtifact|dismissArtifact()]]
- [[controller.ts#retryLast|retryLast()]]
- [[controller.ts#runArtifact|runArtifact()]]
- [[controller.ts#sendMessage|sendMessage()]]
- [[controller.ts#stopAssistant|stopAssistant()]]
- [[scenarios.test.ts]]
