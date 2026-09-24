---
id: tests/platform/helpers.ts
type: test-helper
file: tests/platform/helpers.ts
area: tests
---

# tests/platform/helpers.ts

*Test helper* · area [[tests]] · 39 lines

> Shared test helpers for the AI provider layer: an in-memory localStorage and fetch responses.

## Imported by
- [[features.test.ts]] · value
- [[ai-tools.test.ts]] · value
- [[ai-latency.test.ts]] · value
- [[ai-diagnose.test.ts]] · value
- [[ai-http.test.ts]] · value
- [[ai-keys.test.ts]] · value
- [[ai-local.test.ts]] · value
- [[ai-pace.test.ts]] · value
- [[ai.test.ts]] · value
- [[gemini-fixtures.ts]] · value
- [[storage.test.ts]] · value
- [[webllm.test.ts]] · value

## Symbols

### memoryStorage
*function* · line 3 · exported
> Shared test helpers for the AI provider layer: an in-memory localStorage and fetch responses.
- Used in: [[features.test.ts]], [[ai-latency.test.ts]], [[ai-diagnose.test.ts]], [[ai-keys.test.ts]], [[ai-local.test.ts]], [[ai-pace.test.ts]], [[ai.test.ts]], [[storage.test.ts]], [[webllm.test.ts]]

### jsonResponse
*function* · line 24 · exported
- Used in: [[ai-tools.test.ts]], [[ai-http.test.ts]], [[ai-local.test.ts]], [[ai-pace.test.ts]], [[ai.test.ts]], [[gemini-fixtures.ts]]

### sseResponse
*function* · line 29 · exported
> A text/event-stream response delivered in the given raw chunks (which may split lines).
- Used in: [[ai-tools.test.ts]], [[ai-http.test.ts]], [[ai-local.test.ts]], [[gemini-fixtures.ts]]
