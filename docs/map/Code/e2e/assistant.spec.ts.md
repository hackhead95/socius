---
id: e2e/assistant.spec.ts
type: e2e-spec
file: e2e/assistant.spec.ts
area: e2e
---

# e2e/assistant.spec.ts

*End-to-end spec* · area [[e2e]] · 199 lines

> The Socius assistant end to end: floating button and Ctrl+J, the panel on every tab, Gemini function calling against a mocked Interactions API (tool calls run on the live data, results go back as function_result steps, with the model's thought signatures replayed), Add to Output, a proposed recode applied only on click and undone, Stop, the phone layout, and opening it from search.

## Test cases
  - floating button, Ctrl+J, starters, set-up prompt and privacy line without AI
  - Gemini function calling: tools run on the live data, results go back, Add to Output
  - a proposed recode changes nothing until Apply, and Undo reverses it
  - Stop ends a slow answer; Retry asks again
  - phone: a smaller button and a full-screen sheet
  - search can hand a question to the assistant

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[gemini-mock.ts]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[gemini-mock.ts#fulfil|fulfil()]]
- [[gemini-mock.ts#interactionReply|interactionReply()]]
- [[gemini-mock.ts#legacyBody|legacyBody()]]
- [[gemini-mock.ts#modelsReply|modelsReply()]]
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Uses
- [[gemini-mock.ts#GEMINI|GEMINI]]

## Tests
- [[Independent-Samples T Test|Analyze > Compare Means > Independent-Samples T Test...]] · menu label
- [[describe_variables]] · tool name
- [[get_cases]] · tool name
- [[get_dataset_overview]] · tool name
- [[Procedures/ttest-independent|Independent-Samples T Test]] · menu label
- [[propose_transform]] · tool name
- [[run_analysis]] · tool name
- [[search_help]] · tool name
- [[socius.ai]] · storage key
- [[Output|View > Output]] · menu label

## Private helpers
withGemini() (line 13) · mockGemini() (line 22) · lastParts() (line 36)
