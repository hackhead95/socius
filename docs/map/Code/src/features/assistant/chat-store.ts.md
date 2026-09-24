---
id: src/features/assistant/chat-store.ts
type: module
file: src/features/assistant/chat-store.ts
area: features/assistant
---

# src/features/assistant/chat-store.ts

*Module* · area [[features - assistant|features/assistant]] · 116 lines

> Conversation state for the assistant panel. Kept in memory for the browser session (it survives closing the panel and switching tabs, not a page reload). "What the assistant can see" settings for statistics and texts are remembered in this browser; reading individual cases always starts off.

## Imports
- [[assistant/types.ts]] · value
- [[ai-tools.ts]] · type-only
- [[zustand]] · value

## Uses
- [[assistant/types.ts#DEFAULT_PERMISSIONS|DEFAULT_PERMISSIONS]]

## Reads
- [[socius.assistant.see]]
- [[socius.assistant.width]]

## Tested by
- [[scenarios.test.ts]] · import
- [[ai-latency.test.ts]] · import

## Imported by
- [[AssistantPanel.tsx]] · value
- [[AssistantRoot.tsx]] · value
- [[controller.ts]] · value
- [[scenarios.test.ts]] · value
- [[ai-latency.test.ts]] · dynamic

## Types
ArtifactEntry (line 8) · ChatEntry (line 15)

## Private helpers
loadPermissions() (line 37) · loadWidth() (line 51)

## Symbols

### SEE_KEY
*const* · line 34 · exported

### WIDTH_KEY
*const* · line 35 · exported

### useAssistantChat
*store* · line 81 · exported · note: [[useAssistantChat]]
- Calls: [[chat-store.ts]]
- Uses: [[chat-store.ts#SEE_KEY|SEE_KEY]], [[chat-store.ts#WIDTH_KEY|WIDTH_KEY]]
- Writes: [[socius.assistant.see]], [[socius.assistant.width]]
- Used in: [[AssistantPanel.tsx]], [[AssistantRoot.tsx]], [[controller.ts]], [[scenarios.test.ts]]
