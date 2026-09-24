---
id: src/platform/ai-diagnose.ts
type: module
file: src/platform/ai-diagnose.ts
area: platform
---

# src/platform/ai-diagnose.ts

*Module* · area [[platform]] · 521 lines

> Step-by-step "Test connection" for AI assistant settings, and plain-text reports for support. Google Gemini: 1) Internet connection, 2) Reached Google, 3) Key accepted, 4) Model chosen, 5) Got an answer. OpenAI-compatible online services (Groq, OpenRouter, ...): the same steps, with "Reached <host>" and "Model available" (the service's model list is offered when the typed model is not in it). C...

## Imports
- [[ai-http.ts]] · value
- [[ai-timing.ts]] · value
- [[platform/ai.ts]] · value
- [[buildInfo.ts]] · value
- [[errorlog.ts]] · value

## Calls
- [[platform/ai.ts#providerLabel|providerLabel()]]
- [[ai-timing.ts#recentAiTimings|recentAiTimings()]]
- [[platform/ai.ts#testAiConnection|testAiConnection()]]

## Uses
- [[buildInfo.ts#BUILD_INFO|BUILD_INFO]]

## Tested by
- [[ai-latency.test.ts]] · import
- [[ai-diagnose.test.ts]] · import
- [[ai-keys.test.ts]] · import

## Imported by
- [[AiSettingsDialog.tsx]] · value
- [[ConnectionChecklist.tsx]] · value
- [[explainStore.ts]] · value
- [[controller.ts]] · value
- [[ai-latency.test.ts]] · dynamic
- [[ai-diagnose.test.ts]] · value
- [[ai-keys.test.ts]] · value

## Implements provider
- [[Providers/gemini|gemini]]
- [[Providers/openai|openai]]

## Types
CheckStepId (line 21) · CheckState (line 22) · CheckStep (line 24) · CheckError (line 31) · ConnectionCheck (line 43)

## Private helpers
KEY_CODES (line 78) · browserOnline() (line 82) · hostOf() (line 90) · isLocalBase() (line 98) · pageReachable() (line 103) · Check (line 137) · explainNoAnswer() (line 188) · checkSimple() (line 345) · SECRET_PATTERNS (line 394) · pageAddress() (line 421) · userAgent() (line 429) · yesNo() (line 437) · attemptLine() (line 439) · header() (line 446) · errorLines() (line 456) · timingLines() (line 516)

## Symbols

### CHECK_LABELS
*const* · line 69 · exported
> Step names, as shown in the checklist.

### TEST_PROMPT
*const* · line 80

### errorOf
*function* · line 120
- Calls: [[platform/ai.ts#aiErrorText|aiErrorText()]]

### isCancel
*function* · line 133

### internetStep
*function* · line 176
> Step 1. False when the browser says it is offline (the check stops there).

### checkGemini
*function* · line 199
- Calls: [[ai-diagnose.ts#internetStep|internetStep()]], [[ai-diagnose.ts#isCancel|isCancel()]], [[ai-diagnose.ts]], [[ai-http.ts#askGemini|askGemini()]], [[ai-http.ts#describeKey|describeKey()]], [[ai-http.ts#geminiCandidates|geminiCandidates()]], [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiPreference|geminiPreference()]], [[ai-http.ts#listGeminiModels|listGeminiModels()]], [[ai-http.ts#rankGeminiModels|rankGeminiModels()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[platform/ai.ts#getAiSettings|getAiSettings()]], [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- Uses: [[ai-diagnose.ts#TEST_PROMPT|TEST_PROMPT]], [[ai-diagnose.ts]], [[ai-http.ts#CHECK_TIMEOUT_MS|CHECK_TIMEOUT_MS]], [[platform/ai.ts#DEFAULT_GEMINI_MODEL|DEFAULT_GEMINI_MODEL]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]]
- Writes: [[aiSettings/gemini|aiSettings.gemini]]

### checkOpenAi
*function* · line 272
- Calls: [[ai-diagnose.ts#internetStep|internetStep()]], [[ai-diagnose.ts#isCancel|isCancel()]], [[ai-diagnose.ts]], [[ai-http.ts#askOpenAiCompatible|askOpenAiCompatible()]], [[ai-http.ts#listOpenAiModels|listOpenAiModels()]], [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts#suggestOpenAiModels|suggestOpenAiModels()]]
- Uses: [[ai-diagnose.ts#TEST_PROMPT|TEST_PROMPT]], [[ai-diagnose.ts]], [[ai-http.ts#CHECK_TIMEOUT_MS|CHECK_TIMEOUT_MS]]
- Reads: [[aiSettings/openai|aiSettings.openai]]

### runConnectionCheck
*function* · line 360 · exported
> Run the step-by-step check for the provider in settings. Never rejects; `onUpdate` follows each step.
- Calls: [[ai-diagnose.ts#checkGemini|checkGemini()]], [[ai-diagnose.ts#checkOpenAi|checkOpenAi()]], [[ai-diagnose.ts#isCancel|isCancel()]], [[ai-diagnose.ts]], [[ai-timing.ts#startAiTiming|startAiTiming()]], [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#getAiSettings|getAiSettings()]], [[platform/ai.ts#logAiError|logAiError()]], [[platform/ai.ts#recordAiConnection|recordAiConnection()]]
- Used in: [[AiSettingsDialog.tsx]], [[ai-diagnose.test.ts]]

### redactSecrets
*function* · line 404 · exported
> Remove keys from text: known key formats, bearer tokens, key= parameters, and the given literal keys.
- Uses: [[ai-diagnose.ts]]
- Used in: [[ai-diagnose.test.ts]]

### allKeys
*function* · line 417
- Calls: [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[platform/ai.ts#getAiSettings|getAiSettings()]]
- Uses: [[aiSettings|AI settings (localStorage socius.ai)]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]], [[aiSettings/openai|aiSettings.openai]]

### connectionReport
*function* · line 469 · exported
> Plain-text report of a connection check, for "Copy details". Contains no key.
- Calls: [[ai-diagnose.ts#allKeys|allKeys()]], [[ai-diagnose.ts#redactSecrets|redactSecrets()]], [[ai-diagnose.ts]], [[platform/ai.ts#getAiSettings|getAiSettings()]]
- Uses: [[ai-diagnose.ts]], [[aiSettings|AI settings (localStorage socius.ai)]]
- Used in: [[ConnectionChecklist.tsx]], [[ai-diagnose.test.ts]]

### aiErrorReport
*function* · line 493 · exported
> Plain-text report for an AI error shown elsewhere (explanations, the assistant). Contains no key.
- Calls: [[ai-diagnose.ts#allKeys|allKeys()]], [[ai-diagnose.ts#errorOf|errorOf()]], [[ai-diagnose.ts#redactSecrets|redactSecrets()]], [[ai-diagnose.ts]], [[ai-http.ts#describeKey|describeKey()]], [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#getAiSettings|getAiSettings()]], [[platform/ai.ts#providerLabel|providerLabel()]]
- Uses: [[ai-diagnose.ts]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]], [[aiSettings/openai|aiSettings.openai]]
- Used in: [[explainStore.ts]], [[controller.ts]], [[ai-diagnose.test.ts]], [[ai-keys.test.ts]]
