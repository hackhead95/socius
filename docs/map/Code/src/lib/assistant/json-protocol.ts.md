---
id: src/lib/assistant/json-protocol.ts
type: module
file: src/lib/assistant/json-protocol.ts
area: lib/assistant
---

# src/lib/assistant/json-protocol.ts

*Module* · area [[lib - assistant|lib/assistant]] · 107 lines

> A strict JSON action protocol for models without reliable native tool calling (the small on-device model, and Claude or services where page tools are unavailable). Each reply is exactly one object: {"tool": "<name>", "args": {...}} to use a tool, or {"answer": "<Markdown>"} when ready to answer.

## Imports
- [[assistant/format.ts]] · value
- [[assistant/types.ts]] · type-only
- [[platform/ai.ts]] · value

## Tested by
- [[units.test.ts]] · import

## Imported by
- [[agent.ts]] · value
- [[units.test.ts]] · value

## Types
JsonAction (line 9) · TranscriptEntry (line 29)

## Symbols

### toolListText
*function* · line 12 · exported
> One line per tool: name(args) - description.

### PROTOCOL
*const* · line 24 · exported

### buildJsonPrompt
*function* · line 35 · exported
> The whole exchange as one prompt, dropping the oldest tool results first when over budget.
- Calls: [[assistant/format.ts#byteLength|byteLength()]], [[json-protocol.ts#toolListText|toolListText()]]
- Uses: [[json-protocol.ts#PROTOCOL|PROTOCOL]]
- Used in: [[agent.ts]], [[units.test.ts]]

### parseAction
*function* · line 62 · exported
> Parse and validate one protocol reply.
- Calls: [[platform/ai.ts#extractJson|extractJson()]]
- Used in: [[agent.ts]], [[units.test.ts]]

### partialAnswer
*function* · line 83 · exported
> The answer text so far while a {"answer": "..."} reply streams in (for live display).
- Used in: [[agent.ts]], [[units.test.ts]]
