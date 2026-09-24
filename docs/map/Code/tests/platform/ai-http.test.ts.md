---
id: tests/platform/ai-http.test.ts
type: test
file: tests/platform/ai-http.test.ts
area: tests
---

# tests/platform/ai-http.test.ts

*Test file* · area [[tests]] · 500 lines

> Gemini (Interactions API first, generateContent as a fallback) and OpenAI-compatible adapters: request building, keys, replies (thinking, empty replies), every error shape the services send, automatic model choice with fallbacks, retries, time limits and network failures.

## Test cases
- **keys**
  - cleans pasted keys: spaces, line breaks, invisible characters, quotes, prefixes
  - knows the key formats and warns only about keys that do not look like Google keys
- **request building**
  - Interactions: model and prompt in the body, key in a header, low thinking, room for thinking, JSON, no storage, streaming
  - generateContent (fallback): thinking settings per model family
  - OpenAI-compatible: base URL normalised, bearer key, stream flag; no key header for local servers
- **Gemini replies**
  - Interactions: skips the thought step and returns the text; sends one request with an explicit model
  - Interactions: older replies with `outputs` instead of `steps`
  - Interactions streaming: thought signature deltas, text deltas split across network chunks
  - thinking used every output token: a clear max_tokens error (Interactions and generateContent)
  - generateContent: thought parts are skipped, text with a thoughtSignature is kept
  - safety blocks and recitation become their own codes
  - an error event inside a stream becomes an AI error
- **Gemini errors, one per real error shape**
  - per-minute limit keeps the retry delay and says it is per minute
  - maps statuses and messages to stable codes
  - network failures: offline, blocked, a key the browser refuses to send, cancelling
  - gives up after the time limit with a timeout error
  - refuses to send without a key or model
- **AQ. keys (AI Studio auth keys, 2026)**
  - go to the Interactions API first, in the x-goog-api-key header only
  - a key Google cannot validate fails at the model list as key_not_accepted
  - ACCESS_TOKEN_TYPE_UNSUPPORTED when answering: a key problem, no switch to generateContent, no other models
  - Interactions endpoint missing (404, not a key problem): falls back to generateContent, for AQ. keys too
  - an AIza key: the generateContent fallback is remembered for next time
- **automatic Gemini model choice and fallbacks**
  - ranks the newest stable Flash model first and skips special-purpose ones
  - lists the models when no model is set, then generates with the pick and remembers it
  - free limit 0 for the first model: tries the next one, which answers, and remembers it
  - a typed model retired for new users: falls back, reports it, and names the reason
  - 403 on one model, free limit 0 on the others: moves on; at most three models, then one clear error
  - a model that rejects the thinking setting is retried once without it
  - "store" refused as an unknown field: retried once without it
  - 503 overloaded is retried once after a pause
  - a model list that cannot be read falls back to Google's standard names
  - treats "auto" and a "models/" prefix sensibly
- **OpenAI-compatible services**
  - plain reply and SSE deltas ending with [DONE]
  - readSse joins multi-line data fields and handles a final event without a blank line
  - a stream with no readable events is an error, not an empty answer; a local program's 403 means "allow this website"
  - keeps the service message as detail; plain-text bodies; one retry on 5xx
  - requests to a program on this computer are marked for Chrome's local network permission; others are not
  - lists models (Groq, OpenRouter) and suggests chat models, free ones first

## Imports
- [[ai-http.ts]] · value
- [[gemini-fixtures.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[ai-http.ts#__resetGeminiState|__resetGeminiState()]]
- [[ai-http.ts#__setHttpRetryDelay|__setHttpRetryDelay()]]
- [[ai-http.ts#__setRateLimitSleep|__setRateLimitSleep()]]
- [[ai-http.ts#askGemini|askGemini()]]
- [[ai-http.ts#askOpenAiCompatible|askOpenAiCompatible()]]
- [[ai-http.ts#buildGeminiRequest|buildGeminiRequest()]]
- [[ai-http.ts#buildInteractionRequest|buildInteractionRequest()]]
- [[ai-http.ts#buildOpenAiRequest|buildOpenAiRequest()]]
- [[ai-http.ts#classifyServiceError|classifyServiceError()]]
- [[ai-http.ts#describeKey|describeKey()]]
- [[ai-http.ts#geminiKeyKind|geminiKeyKind()]]
- [[ai-http.ts#geminiKeyWarning|geminiKeyWarning()]]
- [[ai-http.ts#geminiModelName|geminiModelName()]]
- [[ai-http.ts#geminiText|geminiText()]]
- [[gemini-fixtures.ts#generateContent|generateContent()]]
- [[gemini-fixtures.ts#generateContentMaxTokens|generateContentMaxTokens()]]
- [[ai-http.ts#httpErrorCode|httpErrorCode()]]
- [[gemini-fixtures.ts#interaction|interaction()]]
- [[gemini-fixtures.ts#interactionIncomplete|interactionIncomplete()]]
- [[gemini-fixtures.ts#interactionStream|interactionStream()]]
- [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- [[ai-http.ts#lastResolvedGeminiModel|lastResolvedGeminiModel()]]
- [[ai-http.ts#listOpenAiModels|listOpenAiModels()]]
- [[gemini-fixtures.ts#modelList|modelList()]]
- [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]]
- [[ai-http.ts#parseServiceError|parseServiceError()]]
- [[ai-http.ts#pickGeminiModel|pickGeminiModel()]]
- [[ai-http.ts#rankGeminiModels|rankGeminiModels()]]
- [[ai-http.ts#readSse|readSse()]]
- [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- [[platform/helpers.ts#sseResponse|sseResponse()]]
- [[ai-http.ts#suggestOpenAiModels|suggestOpenAiModels()]]

## Uses
- [[gemini-fixtures.ts#G|G]]
- [[gemini-fixtures.ts#O|O]]

## Tests
- [[ai-http.ts]] · import

## Private helpers
AIZA (line 13) · AQ (line 14) · gem (line 15) · oa (line 16) · mockFetch() (line 30) · isList() (line 40) · isInteraction() (line 41)
