---
id: "ai-feature:assistant"
type: ai-feature
file: src/features/ai/features.ts
area: features/ai
---

# Ask the Socius assistant

*AI feature* · defined in [[features.ts]] · area [[features - ai|features/ai]]

- **Does:** answers your questions about methods and your data, for example which test to use, and points you to the menu that runs it.
- **Menu label:** Ask the Socius assistant...

## Calls
- [[open.ts#openAssistant|openAssistant()]]

## Writes
- [[useAssistantUi/open|useAssistantUi.open]]
- [[request|useAssistantUi.request]]

## Started by
- [[features.ts#runAiFeature|runAiFeature()]]
