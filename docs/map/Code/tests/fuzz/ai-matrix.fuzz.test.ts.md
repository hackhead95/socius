---
id: tests/fuzz/ai-matrix.fuzz.test.ts
type: test
file: tests/fuzz/ai-matrix.fuzz.test.ts
area: tests
---

# tests/fuzz/ai-matrix.fuzz.test.ts

*Test file* · area [[tests]] · 365 lines

> AI provider error matrix (pure, mocked fetch): providers {Gemini AIza key, Gemini AQ. key, OpenAI-compatible (Groq), local (Ollama)} x responses {200 text, 200 with thought parts, 200 empty (MAX_TOKENS), 400 invalid key, 401 ACCESS_TOKEN_TYPE_UNSUPPORTED, 403 referrer blocked, 403 service disabled, 404 model, 429 per minute, 429 per day / limit 0, 500, 503, network TypeError, abort, malformed J...

## Test cases
- **AI provider x response x mode**
- **gate**
  - no new failures (known ones are listed in tests/fuzz/known-issues.ts)

## Imports
- [[ai-http.ts]] · value
- [[platform/ai.ts]] · value
- [[claude.ts]] · value
- [[findings.ts]] · value
- [[invariants.ts]] · value
- [[vitest]] · value

## Calls
- [[platform/ai.ts#__reloadAiSettings|__reloadAiSettings()]]
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[platform/ai.ts#askAI|askAI()]]
- [[platform/ai.ts#askAIJson|askAIJson()]]
- [[invariants.ts#badWords|badWords()]]
- [[findings.ts#Collector|Collector]]
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- [[platform/ai.ts#testAiConnection|testAiConnection()]]

## Uses
- [[claude.ts#AiUnavailableError|AiUnavailableError]]

## Tests
- [[ai-http.ts]] · import
- [[platform/ai.ts]] · import
- [[claude.ts]] · import

## Private helpers
col (line 21) · out() (line 22) · memoryStorage() (line 25) · PROVIDERS (line 41) · SCENARIOS (line 52) · MODES (line 54) · googleError() (line 56) · ERRORS (line 60) · EXPECT_TEXT (line 94) · enc (line 107) · sse() (line 108) · json() (line 117) · splitEvery() (line 118) · apiOf() (line 121) · wantsStream() (line 129) · replyFor() (line 139) · respond() (line 141) · knownCodes (line 232) · RAW_TEXT (line 237) · runMode() (line 239) · resetAi() (line 255)
