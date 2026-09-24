---
id: src/features/assistant/starters.ts
type: module
file: src/features/assistant/starters.ts
area: features/assistant
---

# src/features/assistant/starters.ts

*Module* · area [[features - assistant|features/assistant]] · 55 lines

> Context-aware starter prompts for an empty conversation.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[assistant/types.ts]] · type-only
- [[coding/analysis.ts]] · value

## Tested by
- [[units.test.ts]] · import

## Imported by
- [[AssistantPanel.tsx]] · value
- [[units.test.ts]] · value

## Private helpers
usable() (line 7)

## Symbols

### comparePrompt
*function* · line 12
> "Which test should I use to compare life_sat across gender?" with real variable names when possible.
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]], [[starters.ts]]

### scalePrompt
*function* · line 27
> A family of items like trust1..trust5 suggests "Build a trust scale".

### starterPrompts
*function* · line 37 · exported
- Calls: [[coding/analysis.ts#attributeKeys|attributeKeys()]], [[starters.ts#comparePrompt|comparePrompt()]], [[starters.ts#scalePrompt|scalePrompt()]]
- Used in: [[AssistantPanel.tsx]], [[units.test.ts]]
