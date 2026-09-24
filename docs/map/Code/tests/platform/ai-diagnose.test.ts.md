---
id: tests/platform/ai-diagnose.test.ts
type: test
file: tests/platform/ai-diagnose.test.ts
area: tests
---

# tests/platform/ai-diagnose.test.ts

*Test file* · area [[tests]] · 194 lines

> The step-by-step connection check (AI assistant settings > Test connection) and the "Copy details" reports: each step's state for success and for the common failures, and no key in any report.

## Test cases
- **Gemini connection check**
  - success: five ticks, the model that answered and its reply; updates as it goes
  - invalid key: stops at "Key accepted" with the reason, and skips the rest
  - AQ. key Google cannot validate: a key problem with advice
  - free limit 0 on the first model, success on the next: the checklist names both
  - region not supported: fails at "Got an answer" with the explanation
  - offline: stops at step 1 without sending anything
  - online but Google unreachable (blocked): fails at "Reached Google" with what may block it
  - stopping the check marks the remaining steps as stopped
- **OpenAI-compatible connection check**
  - a typed model the service does not offer: lists its models for a picker
  - Groq: key refused at the model list
  - Groq: success
- **reports never contain a key**
  - connection report: version, browser, online status, steps, HTTP statuses, Google status and reason; no key
  - error report for Explain / the assistant
  - redactSecrets removes Google, OpenAI-style and Groq keys, bearer tokens and key= parameters

## Imports
- [[ai-diagnose.ts]] · value
- [[ai-http.ts]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value
- [[claude.ts]] · value
- [[gemini-fixtures.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[platform/ai.ts#__reloadAiSettings|__reloadAiSettings()]]
- [[claude.ts#__resetCapabilityCache|__resetCapabilityCache()]]
- [[ai-http.ts#__resetGeminiState|__resetGeminiState()]]
- [[ai-http.ts#__setHttpRetryDelay|__setHttpRetryDelay()]]
- [[ai-webllm.ts#__setWebLlmLoader|__setWebLlmLoader()]]
- [[ai-diagnose.ts#aiErrorReport|aiErrorReport()]]
- [[ai-diagnose.ts#connectionReport|connectionReport()]]
- [[gemini-fixtures.ts#interaction|interaction()]]
- [[platform/helpers.ts#memoryStorage|memoryStorage()]]
- [[gemini-fixtures.ts#modelList|modelList()]]
- [[ai-diagnose.ts#redactSecrets|redactSecrets()]]
- [[ai-diagnose.ts#runConnectionCheck|runConnectionCheck()]]
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]

## Uses
- [[gemini-fixtures.ts#G|G]]
- [[gemini-fixtures.ts#O|O]]

## Writes
- [[aiSettings/gemini|aiSettings.gemini]] · setter
- [[aiSettings/openai|aiSettings.openai]] · setter
- [[provider|aiSettings.provider]] · setter

## Tests
- [[ai-diagnose.ts]] · import
- [[ai-http.ts]] · import
- [[ai-webllm.ts]] · import
- [[platform/ai.ts]] · import
- [[claude.ts]] · import

## Private helpers
AQ (line 12) · AIZA (line 13) · route() (line 30) · states() (line 36)
