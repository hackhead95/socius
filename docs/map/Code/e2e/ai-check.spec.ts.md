---
id: e2e/ai-check.spec.ts
type: e2e-spec
file: e2e/ai-check.spec.ts
area: e2e
---

# e2e/ai-check.spec.ts

*End-to-end spec* · area [[e2e]] · 206 lines

> AI assistant settings > Test connection: the step-by-step checklist for Google Gemini (success, and a refused key, no free allowance, a blocked connection), "Copy details" (never the key), the model picker for an OpenAI-compatible service, and the "Details" link under an assistant error. Network mocked.

## Test cases
  - Gemini: success shows five ticks, the model and the reply; Details has no key
  - Gemini: a key Google cannot validate stops at "Key accepted"; Copy details has statuses but no key
  - Gemini: no free allowance on any model tried: "Model chosen" fails and names the models
  - Gemini: a blocked connection fails at "Reached Google" and says what may block it
  - Other service: a model the service does not offer gets a picker; choosing one tests again
  - Assistant: a daily limit error says when it resets, with a Details report that has no key
  - a failed test: the AI chip says "not connected" with the reason, and the Help menu gets no error dot (a warning is logged)

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[gemini-mock.ts]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[gemini-mock.ts#googleErrorReply|googleErrorReply()]]
- [[gemini-mock.ts#interactionReply|interactionReply()]]
- [[gemini-mock.ts#modelsReply|modelsReply()]]
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Uses
- [[gemini-mock.ts#cors|cors]]
- [[gemini-mock.ts#GEMINI|GEMINI]]

## Tests
- [[AI assistant settings|AI > AI assistant settings...]] · menu label
- [[socius.ai]] · storage key
- [[socius.errorlog]] · storage key

## Private helpers
AQ_KEY (line 8) · openSettings() (line 10) · geminiWithKey() (line 18) · steps() (line 25) · copiedText() (line 27)
