---
id: src/lib/assistant/prompt.ts
type: module
file: src/lib/assistant/prompt.ts
area: lib/assistant
---

# src/lib/assistant/prompt.ts

*Module* · area [[lib - assistant|lib/assistant]] · 132 lines

> The specialist: system prompt and live context. The menus (every command) are generated from the running app's menu model, so the assistant's knowledge of Socius stays current.

## Imports
- [[output.ts]] · type-only
- [[menu.ts]] · value
- [[assistant/format.ts]] · value
- [[tools/analysis.ts]] · value
- [[tools/data.ts]] · value
- [[assistant/types.ts]] · type-only
- [[procedures/index.ts]] · value

## Calls
- [[tools/analysis.ts#menuPath|menuPath()]]

## Uses
- [[menu.ts#codingMenuItems|codingMenuItems]]
- [[procedures/index.ts#procedures|procedures]]

## Tested by
- [[menu-knowledge.test.ts]] · import
- [[scenarios.test.ts]] · import
- [[units.test.ts]] · import

## Imported by
- [[menuKnowledge.ts]] · value
- [[controller.ts]] · value
- [[menu-knowledge.test.ts]] · value
- [[scenarios.test.ts]] · value
- [[units.test.ts]] · value

## Types
PromptContext (line 11)

## Private helpers
PERSONA (line 21) · RULES (line 23) · WORKFLOW (line 38) · TESTS (line 48) · menuKnowledge (line 62) · fallbackCatalogue() (line 69) · catalogue() (line 77) · seeLine() (line 89) · TAB_NAMES (line 93)

## Symbols

### setMenuKnowledgeProvider
*function* · line 65 · exported
> Called by the app at start-up with a function that describes every menu command.
- Uses: [[prompt.ts]]
- Used in: [[menuKnowledge.ts]], [[menu-knowledge.test.ts]]

### contextText
*function* · line 96 · exported
> The "right now" section: what is open, where the user is, what they are asking about.
- Calls: [[assistant/format.ts#outputItemText|outputItemText()]], [[assistant/format.ts#trimToBytes|trimToBytes()]], [[prompt.ts]], [[tools/data.ts#caseStatus|caseStatus()]]
- Uses: [[prompt.ts]]

### systemPrompt
*function* · line 122 · exported
> Full system prompt for capable models (Gemini, Claude, OpenAI-compatible services).
- Calls: [[prompt.ts#contextText|contextText()]], [[prompt.ts]]
- Uses: [[prompt.ts]]
- Used in: [[controller.ts]], [[menu-knowledge.test.ts]], [[scenarios.test.ts]], [[units.test.ts]]

### compactSystemPrompt
*function* · line 127 · exported
> Short system prompt for small on-device models (4k-token context).
- Calls: [[prompt.ts#contextText|contextText()]], [[tools/analysis.ts#menuPath|menuPath()]]
- Uses: [[procedures/index.ts#procedures|procedures]], [[prompt.ts]]
- Used in: [[controller.ts]], [[scenarios.test.ts]]
