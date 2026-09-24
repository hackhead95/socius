---
id: tests/platform/gemini-fixtures.ts
type: test-helper
file: tests/platform/gemini-fixtures.ts
area: tests
---

# tests/platform/gemini-fixtures.ts

*Test helper* · area [[tests]] · 189 lines

> Realistic Gemini API and OpenAI-compatible replies, shaped like the real services' JSON (the Google error bodies below follow what generativelanguage.googleapis.com returns, including the array wrapper the Interactions endpoint uses; the Interactions success shapes follow @google/genai 2.24's types).

## Imports
- [[platform/helpers.ts]] · value

## Imported by
- [[ai-tools.test.ts]] · value
- [[ai-diagnose.test.ts]] · value
- [[ai-http.test.ts]] · value

## Private helpers
errorInfo() (line 8) · sse() (line 126)

## Symbols

### googleError
*function* · line 11 · exported
> A Google error body. `wrap` puts it in an array, as the Interactions endpoint does.
- Calls: [[platform/helpers.ts#jsonResponse|jsonResponse()]]

### G
*const* · line 16 · exported
- Calls: [[gemini-fixtures.ts#googleError|googleError()]], [[gemini-fixtures.ts]]
- Used in: [[ai-tools.test.ts]], [[ai-diagnose.test.ts]], [[ai-http.test.ts]]

### modelList
*function* · line 92 · exported
> ---------- Gemini successes ----------
- Calls: [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- Used in: [[ai-diagnose.test.ts]], [[ai-http.test.ts]]

### interaction
*function* · line 97 · exported
> A completed Interaction: a thought step (with its signature) and the model's text.
- Calls: [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- Used in: [[ai-diagnose.test.ts]], [[ai-http.test.ts]]

### interactionIncomplete
*function* · line 113 · exported
> An Interaction that ran out of output tokens while thinking: no text at all.
- Calls: [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- Used in: [[ai-http.test.ts]]

### interactionCalls
*function* · line 118 · exported
> An Interaction asking for function calls.
- Calls: [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- Used in: [[ai-tools.test.ts]]

### interactionStream
*function* · line 129 · exported
> A streamed Interaction (SSE): created, a thought step with a signature delta, text deltas, completed.
- Calls: [[gemini-fixtures.ts]], [[platform/helpers.ts#sseResponse|sseResponse()]]
- Used in: [[ai-tools.test.ts]], [[ai-http.test.ts]]

### generateContent
*function* · line 158 · exported
> generateContent: a thought part, then text carrying a thought signature (Gemini 3 style).
- Calls: [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- Used in: [[ai-http.test.ts]]

### generateContentMaxTokens
*function* · line 167 · exported
> generateContent: thinking used every output token, so there is no text.
- Calls: [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- Used in: [[ai-http.test.ts]]

### O
*const* · line 173 · exported
> ---------- OpenAI-compatible services ----------
- Calls: [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- Used in: [[ai-diagnose.test.ts]], [[ai-http.test.ts]]
