---
id: src/features/assistant/open.ts
type: module
file: src/features/assistant/open.ts
area: features/assistant
---

# src/features/assistant/open.ts

*Module* · area [[features - assistant|features/assistant]] · 52 lines

> Entry point for the Socius assistant panel (owned by the assistant module). Other features call openAssistant() to show the panel, optionally with a prompt to send.

## Imports
- [[zustand]] · value

## Tested by
- [[features.test.ts]] · import
- [[palette.test.tsx]] · import

## Imported by
- [[CommandPalette.tsx]] · value
- [[ExplainPanel.tsx]] · value
- [[features.ts]] · value
- [[AssistantPanel.tsx]] · value
- [[AssistantRoot.tsx]] · value
- [[features.test.ts]] · value
- [[palette.test.tsx]] · value

## Types
AssistantRequest (line 5)

## Symbols

### useAssistantUi
*store* · line 20 · exported · note: [[useAssistantUi]]
- Used in: [[AssistantPanel.tsx]], [[AssistantRoot.tsx]], [[features.test.ts]], [[palette.test.tsx]]

### openAssistant
*function* · line 31 · exported
- Uses: [[useAssistantUi]]
- Writes: [[request|useAssistantUi.request]], [[useAssistantUi/open|useAssistantUi.open]]
- Used in: [[CommandPalette.tsx]], [[ExplainPanel.tsx]], [[features.ts]]

### closeAssistant
*function* · line 35 · exported
- Uses: [[useAssistantUi]]
- Writes: [[useAssistantUi/open|useAssistantUi.open]]

### toggleAssistant
*function* · line 40 · exported
> Open or close the panel (Ctrl+J / Cmd+J).
- Uses: [[useAssistantUi]]
- Reads: [[useAssistantUi/open|useAssistantUi.open]]
- Writes: [[useAssistantUi/open|useAssistantUi.open]]
- Used in: [[AssistantRoot.tsx]]

### assistantShortcutLabel
*function* · line 45 · exported
> Keyboard shortcut for the assistant, for menus and help text ("Ctrl+J", or "Cmd+J" on a Mac).
- Used in: [[AssistantRoot.tsx]]
