---
id: src/features/assistant/AssistantRoot.tsx
type: module
file: src/features/assistant/AssistantRoot.tsx
area: features/assistant
---

# src/features/assistant/AssistantRoot.tsx

*Module* · area [[features - assistant|features/assistant]] · 76 lines

> Mounted once by the app shell: the floating Assistant button, the panel, the Ctrl+J / Cmd+J shortcut, and requests from other features (openAssistant({ prompt, send, outputId })).

## Imports
- [[react]] · value
- `src/features/assistant/assistant.css` · side-effect
- [[AssistantPanel.tsx]] · value
- [[chat-store.ts]] · value
- [[controller.ts]] · value
- [[assistant/icons.tsx]] · value
- [[open.ts]] · value

## Tested by
- [[navigation-audit.test.tsx]] · import
- [[units.test.ts]] · import

## Imported by
- [[App.tsx]] · value
- [[navigation-audit.test.tsx]] · value
- [[units.test.ts]] · value

## Symbols

### isAssistantShortcut
*function* · line 11 · exported
- Used in: [[navigation-audit.test.tsx]], [[units.test.ts]]

### AssistantRoot
*component* · line 15 · exported · note: [[AssistantRoot|<AssistantRoot>]]
- Renders: [[AsIcon|<AsIcon>]], [[AssistantPanel|<AssistantPanel>]]
- Calls: [[AssistantRoot.tsx#isAssistantShortcut|isAssistantShortcut()]], [[controller.ts#sendMessage|sendMessage()]], [[open.ts#assistantShortcutLabel|assistantShortcutLabel()]], [[open.ts#toggleAssistant|toggleAssistant()]], [[useAssistantUi]]
- Uses: [[useAssistantChat]], [[useAssistantUi]]
- Reads: [[request|useAssistantUi.request]], [[running|useAssistantChat.running]], [[useAssistantUi/open|useAssistantUi.open]]
- Store actions: [[consumeRequest()|useAssistantUi.consumeRequest()]], [[setDraft()|useAssistantChat.setDraft()]], [[setFocusOutput()|useAssistantChat.setFocusOutput()]], [[setOpen()|useAssistantUi.setOpen()]]
- Rendered by: [[Components/App|<App>]]
