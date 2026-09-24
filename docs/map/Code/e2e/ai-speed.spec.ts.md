---
id: e2e/ai-speed.spec.ts
type: e2e-spec
file: e2e/ai-speed.spec.ts
area: e2e
---

# e2e/ai-speed.spec.ts

*End-to-end spec* · area [[e2e]] · 226 lines

> Speed and storage, end to end: - Gemini with a tiny free limit (mocked: "limit: 3 requests per minute ... Please retry in Ns"): the assistant shows a countdown instead of hanging, then the answer completes. - First words appear quickly (no model list on a second question, the dataset overview looked up before the first request). - Browser storage full (IndexedDB writes fail with QuotaExceededEr...

## Test cases
  - free per-minute limit: the assistant shows a countdown, then still answers
  - performance: the first words appear quickly
  - storage full: one banner, Save project works, deleting the model resumes autosave
  - real quota (DevTools): dummy model files fill the storage, the manager deletes them, autosave recovers

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[gemini-mock.ts]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[gemini-mock.ts#fulfil|fulfil()]]
- [[gemini-mock.ts#interactionReply|interactionReply()]]
- [[e2e/helpers.ts#loadSampleFromWelcome|loadSampleFromWelcome()]]
- [[gemini-mock.ts#modelsReply|modelsReply()]]
- [[e2e/helpers.ts#openWithSample|openWithSample()]]
- [[gemini-mock.ts#promptOf|promptOf()]]

## Uses
- [[gemini-mock.ts#cors|cors]]
- [[gemini-mock.ts#GEMINI|GEMINI]]

## Tests
- [[describe_variables]] · tool name
- [[Save project|File > Save project]] · menu label
- [[socius.ai]] · storage key
- [[socius.errorlog]] · storage key
- [[Data View|View > Data View]] · menu label
- [[Output|View > Output]] · menu label

## Private helpers
withGemini() (line 14) · mockLimitedGemini() (line 26) · assistantScript() (line 60) · ask() (line 68) · fakeModel() (line 121) · triggerAutosave() (line 131)
