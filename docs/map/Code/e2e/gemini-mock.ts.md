---
id: e2e/gemini-mock.ts
type: test-helper
file: e2e/gemini-mock.ts
area: e2e
---

# e2e/gemini-mock.ts

*Test helper* · area [[e2e]] · 107 lines

> Helpers for mocking Google's Gemini Interactions API (POST /v1beta/interactions) in e2e tests. Specs describe model replies as generateContent-style parts ({text}, {functionCall, thoughtSignature}) because they are short to write; these helpers turn them into Interactions steps (JSON or the SSE event stream), and turn an Interactions request back into a generateContent-like body (contents, syst...

## Imports
- [[@playwright-test|@playwright/test]] · type-only

## Imported by
- [[ai-check.spec.ts]] · value
- [[ai-features.spec.ts]] · value
- [[ai-speed.spec.ts]] · value
- [[ai.spec.ts]] · value
- [[assistant.spec.ts]] · value

## Types
Part (line 11)

## Private helpers
seq (line 58)

## Symbols

### GEMINI
*const* · line 8 · exported
- Used in: [[ai-check.spec.ts]], [[ai-features.spec.ts]], [[ai-speed.spec.ts]], [[ai.spec.ts]], [[assistant.spec.ts]]

### cors
*const* · line 9 · exported
- Used in: [[ai-check.spec.ts]], [[ai-speed.spec.ts]]

### isInteractions
*function* · line 13 · exported

### modelsReply
*function* · line 16 · exported
> Model list reply for GET /v1beta/models.
- Uses: [[gemini-mock.ts#cors|cors]]
- Used in: [[ai-check.spec.ts]], [[ai-features.spec.ts]], [[ai-speed.spec.ts]], [[ai.spec.ts]], [[assistant.spec.ts]]

### promptOf
*function* · line 21 · exported
> The last user text of an Interactions request (a prompt string, or the last user_input step).
- Used in: [[ai-features.spec.ts]], [[ai-speed.spec.ts]], [[ai.spec.ts]]

### legacyBody
*function* · line 29 · exported
> An Interactions request in generateContent terms: contents (user/model turns), systemInstruction, generationConfig.
- Used in: [[assistant.spec.ts]]

### partsToSteps
*function* · line 60 · exported
> generateContent-style parts -> Interactions output steps (a thoughtSignature becomes a thought step).
- Uses: [[gemini-mock.ts]]

### interactionReply
*function* · line 74 · exported
> Reply to an Interactions request with these parts: JSON, or SSE events when the request streams.
- Calls: [[gemini-mock.ts#partsToSteps|partsToSteps()]]
- Uses: [[gemini-mock.ts#cors|cors]], [[gemini-mock.ts]]
- Used in: [[ai-check.spec.ts]], [[ai-features.spec.ts]], [[ai-speed.spec.ts]], [[ai.spec.ts]], [[assistant.spec.ts]]

### googleErrorReply
*function* · line 100 · exported
> Fulfil a route with a Google error body (the Interactions endpoint wraps errors in an array).
- Uses: [[gemini-mock.ts#cors|cors]]
- Used in: [[ai-check.spec.ts]], [[ai.spec.ts]]

### fulfil
*function* · line 104 · exported
- Used in: [[ai-speed.spec.ts]], [[assistant.spec.ts]]
