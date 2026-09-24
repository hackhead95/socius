---
id: src/lib/assistant/rate-limit.ts
type: module
file: src/lib/assistant/rate-limit.ts
area: lib/assistant
---

# src/lib/assistant/rate-limit.ts

*Module* · area [[lib - assistant|lib/assistant]] · 59 lines

> Client-side request pacing for free tiers. Counts requests in a sliding one-minute window, per provider and key. The limit can change while in use (Gemini's real per-model limits are learned from its 429 replies: see src/platform/ai-pace.ts, which uses this class).

## Tested by
- [[scenarios.test.ts]] · import
- [[ai-pace.test.ts]] · import

## Imported by
- [[agent.ts]] · value
- [[ai-pace.ts]] · value
- [[scenarios.test.ts]] · value
- [[ai-pace.test.ts]] · value

## Private helpers
limiters (line 33)

## Symbols

### RateLimiter
*class* · line 5 · exported
> Client-side request pacing for free tiers. Counts requests in a sliding one-minute window, per provider and key. The limit can change while in use (Gemini's real per-model limits are learned from its 429 replies: see src/platform/ai-pace...
- Used in: [[ai-pace.ts]], [[scenarios.test.ts]], [[ai-pace.test.ts]]

### limiterFor
*function* · line 35 · exported
- Calls: [[rate-limit.ts#RateLimiter|RateLimiter]]
- Uses: [[rate-limit.ts]]
- Used in: [[agent.ts]]

### abortableSleep
*function* · line 45 · exported
> Sleep that ends early (rejecting) when the signal aborts.
- Used in: [[agent.ts]]
