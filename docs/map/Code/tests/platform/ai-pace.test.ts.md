---
id: tests/platform/ai-pace.test.ts
type: test
file: tests/platform/ai-pace.test.ts
area: tests
---

# tests/platform/ai-pace.test.ts

*Test file* · area [[tests]] · 228 lines

> Speed: rate limits read from Google's 429 replies and adaptive pacing, waiting out a short limit with a countdown, the model list cached for a day per key, the remembered API, the thinking level, and the timing records (no content, info entries in the error log).

## Test cases
- **reading limits from 429 replies**
  - the owner's message: 5 requests per minute, retry in 11 s
  - QuotaFailure violations: per-minute request quota, not token quotas or per-day ones
- **adaptive pacing**
  - nothing is paced until a limit is learned; then requests are spaced to it
  - "retry in N s" blocks the model for N s; learned limits survive a reload for a day
  - RateLimiter: a lowered limit waits for the right request to leave the window
- **Gemini requests with limits**
  - a 429 asking to retry in 11 s is waited out with a countdown, then answered
  - automatic choice: a long per-minute wait on one model moves on to another with room
- **model list cache and remembered API**
  - the model list is kept for a day per key hash (no key stored), so a new page load does not list again
  - an old list (over a day) is listed again
- **thinking level**
  - minimal on Flash-Lite, low on Flash, none on 2.x; explicit minimal for checks
  - a model that refuses 'minimal' is asked with 'low' (remembered), not with no level at all
- **timing records**
  - each finished action is one info entry in the error log, with stages and times but no content

## Imports
- [[rate-limit.ts]] · value
- [[ai-http.ts]] · value
- [[ai-pace.ts]] · value
- [[ai-timing.ts]] · value
- [[errorlog.ts]] · value
- [[gemini-fixtures.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[ai-timing.ts#__resetAiTimings|__resetAiTimings()]]
- [[errorlog.ts#__resetErrorLogForTests|__resetErrorLogForTests()]]
- [[ai-http.ts#__resetGeminiState|__resetGeminiState()]]
- [[ai-pace.ts#__resetPace|__resetPace()]]
- [[ai-http.ts#__setHttpRetryDelay|__setHttpRetryDelay()]]
- [[ai-http.ts#__setRateLimitSleep|__setRateLimitSleep()]]
- [[ai-http.ts#askGemini|askGemini()]]
- [[ai-http.ts#buildInteractionRequest|buildInteractionRequest()]]
- [[ai-http.ts#geminiRun|geminiRun()]]
- [[ai-timing.ts#getAiActivity|getAiActivity()]]
- [[errorlog.ts#getLog|getLog()]]
- [[gemini-fixtures.ts#interaction|interaction()]]
- [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- [[ai-http.ts#keyHash|keyHash()]]
- [[ai-pace.ts#knownLimit|knownLimit()]]
- [[ai-pace.ts#learnLimit|learnLimit()]]
- [[ai-http.ts#listGeminiModels|listGeminiModels()]]
- [[platform/helpers.ts#memoryStorage|memoryStorage()]]
- [[gemini-fixtures.ts#modelList|modelList()]]
- [[ai-pace.ts#noteRequest|noteRequest()]]
- [[ai-pace.ts#paceWaitMs|paceWaitMs()]]
- [[ai-pace.ts#parseRateLimit|parseRateLimit()]]
- [[ai-http.ts#parseServiceError|parseServiceError()]]
- [[rate-limit.ts#RateLimiter|RateLimiter]]
- [[ai-timing.ts#recentAiTimings|recentAiTimings()]]
- [[ai-timing.ts#startAiTiming|startAiTiming()]]
- [[ai-timing.ts#subscribeAiActivity|subscribeAiActivity()]]
- [[ai-http.ts#thinkingLevelFor|thinkingLevelFor()]]

## Tests
- [[socius.ai.geminiModels]] · storage key
- [[socius.ai.limits]] · storage key
- [[rate-limit.ts]] · import
- [[ai-http.ts]] · import
- [[ai-pace.ts]] · import
- [[ai-timing.ts]] · import
- [[errorlog.ts]] · import

## Private helpers
KEY (line 15) · OWNER_MSG (line 16) · owner429() (line 18) · store (line 34)
