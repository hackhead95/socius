---
id: src/lib/assistant/prompt.ts
type: module
file: src/lib/assistant/prompt.ts
area: lib/assistant
---

# src/lib/assistant/prompt.ts

*Module* · area [[lib - assistant|lib/assistant]] · 119 lines

> The specialist: system prompt and live context. The procedure catalogue and Text coding menu are generated from the running app, so the assistant's knowledge of Socius stays current.

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
- [[scenarios.test.ts]] · import
- [[units.test.ts]] · import

## Imported by
- [[controller.ts]] · value
- [[scenarios.test.ts]] · value
- [[units.test.ts]] · value

## Types
PromptContext (line 11)

## Private helpers
PERSONA (line 21) · RULES (line 23) · WORKFLOW (line 38) · TESTS (line 48) · catalogue() (line 59) · seeLine() (line 76) · TAB_NAMES (line 80)

## Symbols

### contextText
*function* · line 83 · exported
> The "right now" section: what is open, where the user is, what they are asking about.
- Calls: [[assistant/format.ts#outputItemText|outputItemText()]], [[assistant/format.ts#trimToBytes|trimToBytes()]], [[prompt.ts]], [[tools/data.ts#caseStatus|caseStatus()]]
- Uses: [[prompt.ts]]

### systemPrompt
*function* · line 109 · exported
> Full system prompt for capable models (Gemini, Claude, OpenAI-compatible services).
- Calls: [[prompt.ts#contextText|contextText()]], [[prompt.ts]]
- Uses: [[prompt.ts]]
- Used in: [[controller.ts]], [[scenarios.test.ts]], [[units.test.ts]]

### compactSystemPrompt
*function* · line 114 · exported
> Short system prompt for small on-device models (4k-token context).
- Calls: [[prompt.ts#contextText|contextText()]], [[tools/analysis.ts#menuPath|menuPath()]]
- Uses: [[procedures/index.ts#procedures|procedures]], [[prompt.ts]]
- Used in: [[controller.ts]], [[scenarios.test.ts]]
