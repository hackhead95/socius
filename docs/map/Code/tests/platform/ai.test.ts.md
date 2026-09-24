---
id: tests/platform/ai.test.ts
type: test
file: tests/platform/ai.test.ts
area: tests
---

# tests/platform/ai.test.ts

*Test file* · area [[tests]] · 286 lines

> Provider layer: settings persistence, provider choice, tolerant JSON, routing, the unchanged Claude path.

## Test cases
- **settings persistence**
  - starts with defaults and no provider when nothing is stored
  - saves to localStorage only and reads it back after a reload
  - forget key removes only the key
  - tolerates corrupt or partial stored settings
  - keeps working when storage throws (private windows, blocked storage)
  - notifies settings listeners synchronously and status listeners after the check
- **provider choice**
  - uses Claude automatically inside the artifact, unless the user chose another provider
  - is available only when configured
  - prompt budget and privacy follow the provider
- **tolerant JSON extraction**
  - parses the whole reply
  - parses a fenced block
  - falls back to the first bracket to the last
  - skips thinking blocks
  - rejects replies without JSON
- **asking**
  - without a provider, rejects not_configured and sends nothing
  - routes to Gemini (Interactions API) with JSON mode and parses a fenced JSON reply
  - Gemini automatic choice: Flash-Lite by default, Flash when preferred (not for JSON batches)
  - routes to an OpenAI-compatible service and strips thinking from text
  - invalid JSON from a provider becomes invalid_json
- **Claude artifact path (unchanged)**
  - askAI / askAIJson use the sample capability with the model tier and streamed text
  - keeps the capability error codes and the older host exports
- **messages**
  - has a plain-language message for every stable code, with no em-dashes

## Imports
- [[ai-http.ts]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value
- [[claude.ts]] · value
- [[host.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[platform/ai.ts#__reloadAiSettings|__reloadAiSettings()]]
- [[claude.ts#__resetCapabilityCache|__resetCapabilityCache()]]
- [[ai-http.ts#__resetGeminiState|__resetGeminiState()]]
- [[ai-webllm.ts#__setWebLlmLoader|__setWebLlmLoader()]]
- [[platform/ai.ts#aiAvailable|aiAvailable()]]
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]]
- [[platform/ai.ts#askAI|askAI()]]
- [[platform/ai.ts#askAIJson|askAIJson()]]
- [[claude.ts#askClaude|askClaude()]]
- [[platform/ai.ts#effectiveProvider|effectiveProvider()]]
- [[platform/ai.ts#extractJson|extractJson()]]
- [[platform/ai.ts#forgetAiKey|forgetAiKey()]]
- [[platform/ai.ts#getAiSettings|getAiSettings()]]
- [[platform/ai.ts#getAiStatus|getAiStatus()]]
- [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- [[platform/helpers.ts#memoryStorage|memoryStorage()]]
- [[platform/ai.ts#parseAiSettings|parseAiSettings()]]
- [[platform/ai.ts#providerLabel|providerLabel()]]
- [[platform/ai.ts#providerPrivacy|providerPrivacy()]]
- [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]]
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- [[platform/ai.ts#stripThinking|stripThinking()]]
- [[platform/ai.ts#subscribeAi|subscribeAi()]]
- [[platform/ai.ts#subscribeAiSettings|subscribeAiSettings()]]
- [[platform/ai.ts#testAiConnection|testAiConnection()]]

## Uses
- [[platform/ai.ts#AI_SETTINGS_KEY|AI_SETTINGS_KEY]]
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]
- [[claude.ts#askClaudeJson|askClaudeJson()]]
- [[platform/ai.ts#DEFAULT_PROMPT_BUDGET_BYTES|DEFAULT_PROMPT_BUDGET_BYTES]]
- [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]]
- [[ai-webllm.ts#WEBLLM_PROMPT_BUDGET_BYTES|WEBLLM_PROMPT_BUDGET_BYTES]]

## Reads
- [[aiSettings/gemini|aiSettings.gemini]] · alias, getter
- [[aiSettings/openai|aiSettings.openai]] · alias, getter
- [[provider|aiSettings.provider]] · alias, getter

## Writes
- [[aiSettings/gemini|aiSettings.gemini]] · setter
- [[aiSettings/openai|aiSettings.openai]] · setter
- [[provider|aiSettings.provider]] · setter
- [[remember|aiSettings.remember]] · setter

## Tests
- [[ai-http.ts]] · import
- [[ai-webllm.ts]] · import
- [[platform/ai.ts]] · import
- [[claude.ts]] · import
- [[host.ts]] · import

## Private helpers
store (line 14)
