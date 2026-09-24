---
id: src/lib/assistant/rate-limit.ts
type: module
file: src/lib/assistant/rate-limit.ts
area: lib/assistant
---

# src/lib/assistant/rate-limit.ts

*Module* · area [[lib - assistant|lib/assistant]] · 56 lines

> Client-side request pacing for free tiers (Google's free Gemini tier allows only a few requests a minute). Counts requests in a sliding one-minute window, per provider and key.

## Tested by
- [[scenarios.test.ts]] · import

## Imported by
- [[agent.ts]] · value
- [[scenarios.test.ts]] · value

## Private helpers
limiters (line 30)

## Symbols

### RateLimiter
*class* · line 4 · exported
> Client-side request pacing for free tiers (Google's free Gemini tier allows only a few requests a minute). Counts requests in a sliding one-minute window, per provider and key.
- Used in: [[scenarios.test.ts]]

### limiterFor
*function* · line 32 · exported
- Calls: [[rate-limit.ts#RateLimiter|RateLimiter]]
- Uses: [[rate-limit.ts]]
- Used in: [[agent.ts]]

### abortableSleep
*function* · line 42 · exported
> Sleep that ends early (rejecting) when the signal aborts.
- Used in: [[agent.ts]]
