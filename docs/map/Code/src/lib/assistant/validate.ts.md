---
id: src/lib/assistant/validate.ts
type: module
file: src/lib/assistant/validate.ts
area: lib/assistant
---

# src/lib/assistant/validate.ts

*Module* · area [[lib - assistant|lib/assistant]] · 84 lines

> Check and gently coerce tool arguments against the tool's JSON schema before running it, so a model's small slips (a number sent as text, one name instead of a list) do not become errors and real mistakes come back as clear messages the model can fix.

## Imports
- [[ai-tools.ts]] · type-only

## Tested by
- [[units.test.ts]] · import

## Imported by
- [[agent.ts]] · value
- [[units.test.ts]] · value

## Types
ArgCheck (line 6)

## Private helpers
coerce() (line 11)

## Symbols

### checkArgs
*function* · line 78 · exported
> Validate and coerce arguments for a tool. Unknown extra arguments are kept (tools ignore them).
- Calls: [[validate.ts]]
- Used in: [[agent.ts]], [[units.test.ts]]
