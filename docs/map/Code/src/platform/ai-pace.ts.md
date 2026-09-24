---
id: src/platform/ai-pace.ts
type: module
file: src/platform/ai-pace.ts
area: platform
---

# src/platform/ai-pace.ts

*Module* · area [[platform]] · 145 lines

> Adaptive pacing for free tiers. Google's free Gemini tier limits requests per minute per model (for example Flash 5, Flash-Lite 15; Google no longer publishes fixed numbers and they change). Instead of guessing, Socius learns each model's real limit from the 429 replies ("limit: 5 requests per minute", QuotaFailure quotaValue) and the wait Google asks for ("Please retry in 11s", RetryInfo), the...

## Imports
- [[rate-limit.ts]] · value

## Calls
- [[rate-limit.ts#RateLimiter|RateLimiter]]

## Reads
- [[socius.ai.limits]]

## Writes
- [[socius.ai.limits]]

## Tested by
- [[ai-latency.test.ts]] · import
- [[ai-pace.test.ts]] · import

## Imported by
- [[ai-http.ts]] · value
- [[ai-latency.test.ts]] · dynamic
- [[ai-pace.test.ts]] · value

## Types
LimitInfo (line 12)

## Private helpers
STORE_KEY (line 52) · KEEP_MS (line 53) · limiters (line 60) · blocked (line 61) · learned (line 62) · readLearned() (line 64) · saveLearned() (line 79) · slot() (line 87) · limiter() (line 89)

## Symbols

### parseRateLimit
*function* · line 25 · exported
> Read a rate limit out of a 429 message and its QuotaFailure violations: "limit: 5 requests per minute", "...free_tier_requests, limit: 15, model: ..." with a PerMinute quota id, or a violation's quotaValue. Token limits (input_token_coun...
- Used in: [[ai-http.ts]], [[ai-pace.test.ts]]

### noteRequest
*function* · line 100 · exported
> Note a request sent to a model (counted even before a limit is known, so the window is right once it is).
- Calls: [[ai-pace.ts]], [[rate-limit.ts#RateLimiter|RateLimiter]]
- Uses: [[ai-pace.ts]]
- Used in: [[ai-http.ts]], [[ai-pace.test.ts]]

### learnLimit
*function* · line 108 · exported
> Learn from a 429: the model's per-minute limit and how long to wait before the next request.
- Calls: [[ai-pace.ts]]
- Uses: [[ai-pace.ts]]
- Used in: [[ai-http.ts]], [[ai-pace.test.ts]]

### clearBlock
*function* · line 120 · exported
> The requested wait is over (Socius waited it out).
- Calls: [[ai-pace.ts]]
- Uses: [[ai-pace.ts]]
- Used in: [[ai-http.ts]]

### knownLimit
*function* · line 125 · exported
> The learned per-minute limit of a model, if any.
- Calls: [[ai-pace.ts]]
- Used in: [[ai-pace.test.ts]]

### paceWaitMs
*function* · line 130 · exported
> Milliseconds to wait before the next request to this model (0 = send now).
- Calls: [[ai-pace.ts]]
- Uses: [[ai-pace.ts]]
- Used in: [[ai-http.ts]], [[ai-pace.test.ts]]

### __resetPace
*function* · line 140 · exported
> Test hook: forget learned limits and windows.
- Uses: [[ai-pace.ts]]
- Used in: [[ai-http.ts]], [[ai-pace.test.ts]]
