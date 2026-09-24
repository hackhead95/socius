---
id: src/platform/ai.ts
type: module
file: src/platform/ai.ts
area: platform
---

# src/platform/ai.ts

*Module* · area [[platform]] · 599 lines

> AI provider layer. Every AI request in the app goes through askAI / askAIJson here, on a user click. Providers: - claude : inside the claude.ai Artifact viewer (the `sample` capability). Only offered there. - webllm : a small model running on this computer (WebGPU). Nothing leaves the computer. - gemini : Google Gemini with the user's own free key from Google AI Studio. - openai : any OpenAI-co...

## Imports
- [[ai-http.ts]] · value
- [[ai-webllm.ts]] · value
- [[claude.ts]] · re-export, value
- [[errorlog.ts]] · value

## Calls
- [[claude.ts#claudeSampleAvailable|claudeSampleAvailable()]]
- [[ai-webllm.ts#detectWebGpu|detectWebGpu()]]
- [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]]
- [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]

## Tested by
- [[features.test.ts]] · import
- [[ai-matrix.fuzz.test.ts]] · import
- [[ai-diagnose.test.ts]] · import
- [[ai-local.test.ts]] · import
- [[ai.test.ts]] · import
- [[webllm.test.ts]] · import

## Imported by
- [[AiBits.tsx]] · value
- [[AiFeatureDialogs.tsx]] · value
- [[AiSettingsDialog.tsx]] · value
- [[ExplainPanel.tsx]] · value
- [[explainStore.ts]] · value
- [[features.ts]] · value
- [[ai/hooks.ts]] · value
- [[LocalSetup.tsx]] · value
- [[WebLlmSetup.tsx]] · value
- [[controller.ts]] · value
- [[AiDialogs.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[install.ts]] · value
- [[OutputViewer.tsx]] · value
- [[drivers.ts]] · value
- [[json-protocol.ts]] · value
- [[ai-diagnose.ts]] · value
- [[ai-local.ts]] · value
- [[host.ts]] · re-export
- [[features.test.ts]] · value
- [[ai-matrix.fuzz.test.ts]] · value
- [[ai-diagnose.test.ts]] · value
- [[ai-local.test.ts]] · value
- [[ai.test.ts]] · value
- [[webllm.test.ts]] · value

## Types
AiProviderId (line 21) · OpenAiPreset (line 22) · AiSettings (line 24) · OpenAiPresetInfo (line 44) · AiPrivacy (line 244) · AiStatus (line 288) · AiAskOptions (line 360)

## Private helpers
OLD_DEFAULT_GEMINI_MODELS (line 39) · storage() (line 105) · str() (line 113) · PROVIDERS (line 114) · settings (line 138) · settingsListeners (line 154) · notifySettings() (line 162) · isLocalUrl() (line 211) · hostOf() (line 235) · providerReady() (line 266) · initialStatus() (line 299) · status (line 304) · listeners (line 305) · refreshSeq (line 306) · setStatus() (line 317) · started (line 339) · SETTINGS_HINT (line 483) · siteRestriction() (line 568)

## Symbols

### DEFAULT_GEMINI_MODEL
*const* · line 36 · exported
> Empty = choose automatically, favouring the newest Flash-Lite model the key can use (more free requests per day); 'auto-flash' = automatic, favouring Flash for single requests. See ai-http.
- Used in: [[ai-diagnose.ts]]

### GEMINI_AUTO_FLASH
*const* · line 37 · exported
- Used in: [[AiSettingsDialog.tsx]]

### GEMINI_KEY_URL
*const* · line 40 · exported
- Used in: [[AiSettingsDialog.tsx]]

### DEFAULT_PROMPT_BUDGET_BYTES
*const* · line 42 · exported
> Largest prompt sent to Claude or Gemini (the Claude sample capability accepts 64 KB).
- Used in: [[ai.test.ts]]

### OPENAI_PRESETS
*const* · line 54 · exported
- Uses: [[platform/ai.ts#DEFAULT_PROMPT_BUDGET_BYTES|DEFAULT_PROMPT_BUDGET_BYTES]]
- Used in: [[AiFeatureDialogs.tsx]], [[AiSettingsDialog.tsx]], [[ai.test.ts]]

### DEFAULT_SETTINGS
*const* · line 94 · exported
- Uses: [[ai-webllm.ts#DEFAULT_WEBLLM_MODEL|DEFAULT_WEBLLM_MODEL]], [[platform/ai.ts#DEFAULT_GEMINI_MODEL|DEFAULT_GEMINI_MODEL]], [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]]

### AI_SETTINGS_KEY
*const* · line 103 · exported
> ---------- settings persistence (localStorage only) ----------
- Used in: [[ai.test.ts]]

### parseAiSettings
*function* · line 116 · exported
- Calls: [[ai-webllm.ts#webLlmChoice|webLlmChoice()]], [[platform/ai.ts]]
- Uses: [[ai-webllm.ts#DEFAULT_WEBLLM_MODEL|DEFAULT_WEBLLM_MODEL]], [[platform/ai.ts#DEFAULT_GEMINI_MODEL|DEFAULT_GEMINI_MODEL]], [[platform/ai.ts#DEFAULT_SETTINGS|DEFAULT_SETTINGS]], [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]], [[platform/ai.ts]]
- Used in: [[ai.test.ts]]

### loadAiSettings
*function* · line 140 · exported
- Calls: [[platform/ai.ts#parseAiSettings|parseAiSettings()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts#AI_SETTINGS_KEY|AI_SETTINGS_KEY]]
- Reads: [[socius.ai]]

### getAiSettings
*function* · line 150 · exported
- Uses: [[platform/ai.ts]]
- Used in: [[AiBits.tsx]], [[AiFeatureDialogs.tsx]], [[AiSettingsDialog.tsx]], [[LocalSetup.tsx]], [[WebLlmSetup.tsx]], [[install.ts]], [[drivers.ts]], [[ai-diagnose.ts]], [[ai.test.ts]]

### subscribeAiSettings
*function* · line 157 · exported
> Notified synchronously whenever settings change (controlled inputs need that).
- Uses: [[platform/ai.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[ai.test.ts]]

### saveAiSettings
*function* · line 167 · exported
> Save settings (merged into the current ones) and notify listeners.
- Calls: [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts#AI_SETTINGS_KEY|AI_SETTINGS_KEY]], [[platform/ai.ts]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]], [[aiSettings/openai|aiSettings.openai]], [[aiSettings/webllm|aiSettings.webllm]]
- Writes: [[socius.ai]]
- Used in: [[AiSettingsDialog.tsx]], [[LocalSetup.tsx]], [[WebLlmSetup.tsx]], [[ai-diagnose.ts]], [[features.test.ts]], [[ai-matrix.fuzz.test.ts]], [[ai-diagnose.test.ts]], [[ai.test.ts]], [[webllm.test.ts]]

### forgetAiKey
*function* · line 186 · exported
> Remove a stored key from this browser.
- Calls: [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- Uses: [[platform/ai.ts]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]], [[aiSettings/openai|aiSettings.openai]]
- Writes: [[aiSettings/gemini|aiSettings.gemini]], [[aiSettings/openai|aiSettings.openai]]
- Used in: [[AiSettingsDialog.tsx]], [[ai.test.ts]]

### __reloadAiSettings
*function* · line 191 · exported
> Test hook: re-read settings from storage and reset the status.
- Calls: [[platform/ai.ts#loadAiSettings|loadAiSettings()]], [[platform/ai.ts]]
- Uses: [[aiSettings|AI settings (localStorage socius.ai)]], [[platform/ai.ts]]
- Used in: [[features.test.ts]], [[ai-matrix.fuzz.test.ts]], [[ai-diagnose.test.ts]], [[ai-local.test.ts]], [[ai.test.ts]], [[webllm.test.ts]]

### claudePresent
*function* · line 198 · exported
> ---------- which provider ----------
- Calls: [[claude.ts#claudeGlobal|claudeGlobal()]]
- Used in: [[AiSettingsDialog.tsx]]

### effectiveProvider
*function* · line 203 · exported
> The provider that askAI will use, or null when none is set up.
- Calls: [[platform/ai.ts#claudePresent|claudePresent()]]
- Uses: [[ai-webllm.ts#WEBLLM_IN_BUILD|WEBLLM_IN_BUILD]], [[platform/ai.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[controller.ts]], [[install.ts]], [[drivers.ts]], [[ai-diagnose.ts]], [[ai.test.ts]]

### providerLabel
*function* · line 216 · exported
> Short name of a provider for "will be sent to ..." lines.
- Calls: [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiPreference|geminiPreference()]], [[ai-http.ts#lastResolvedGeminiModel|lastResolvedGeminiModel()]], [[ai-webllm.ts#webLlmChoice|webLlmChoice()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]], [[platform/ai.ts]]
- Used in: [[controller.ts]], [[drivers.ts]], [[ai-diagnose.ts]], [[ai.test.ts]]

### providerPrivacy
*function* · line 246 · exported
- Calls: [[platform/ai.ts]]
- Uses: [[platform/ai.ts]]
- Used in: [[AiBits.tsx]], [[ai.test.ts]]

### aiPromptBudget
*function* · line 255 · exported
> How many bytes of prompt the current provider takes comfortably.
- Calls: [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts]]
- Uses: [[ai-webllm.ts#WEBLLM_PROMPT_BUDGET_BYTES|WEBLLM_PROMPT_BUDGET_BYTES]], [[platform/ai.ts#DEFAULT_PROMPT_BUDGET_BYTES|DEFAULT_PROMPT_BUDGET_BYTES]], [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]], [[platform/ai.ts]]
- Used in: [[ExplainPanel.tsx]], [[explainStore.ts]], [[RetrievalView.tsx]], [[AiDialogs.tsx]], [[drivers.ts]], [[ai.test.ts]]

### aiAvailable
*function* · line 282 · exported
> True when a provider is configured and usable here (no request is sent to any AI service).
- Calls: [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts]]
- Used in: [[features.ts]], [[ai.test.ts]]

### getAiStatus
*function* · line 308 · exported
- Uses: [[platform/ai.ts]]
- Used in: [[explainStore.ts]], [[features.ts]], [[ai/hooks.ts]], [[controller.ts]], [[OutputViewer.tsx]], [[ai.test.ts]]

### subscribeAi
*function* · line 312 · exported
- Uses: [[platform/ai.ts]]
- Used in: [[ai/hooks.ts]], [[ai.test.ts]]

### refreshAiStatus
*function* · line 323 · exported
> Re-check the provider (after settings change, or once at start). Resolves to the new status.
- Calls: [[ai-webllm.ts#detectWebGpu|detectWebGpu()]], [[ai-webllm.ts#isWebLlmCached|isWebLlmCached()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#providerLabel|providerLabel()]], [[platform/ai.ts#providerPrivacy|providerPrivacy()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[WebLlmSetup.tsx]], [[controller.ts]], [[features.test.ts]], [[ai.test.ts]], [[webllm.test.ts]]

### startAiStatus
*function* · line 341 · exported
> Start the first status check (idempotent). Also follows settings changed in another tab.
- Calls: [[platform/ai.ts#loadAiSettings|loadAiSettings()]], [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]], [[platform/ai.ts]]
- Uses: [[aiSettings|AI settings (localStorage socius.ai)]], [[platform/ai.ts#AI_SETTINGS_KEY|AI_SETTINGS_KEY]], [[platform/ai.ts]]
- Used in: [[ai/hooks.ts]]

### stripThinking
*function* · line 372 · exported
> Remove "thinking" blocks some models emit (<think>...</think>), including an unfinished one while streaming.
- Used in: [[ai-local.ts]], [[ai.test.ts]]

### wrapError
*function* · line 379
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### askAI
*function* · line 386 · exported
> Ask the current provider for text. Rejects AiError with a stable `code` (see aiErrorMessage).
- Calls: [[ai-http.ts#askGemini|askGemini()]], [[ai-http.ts#askOpenAiCompatible|askOpenAiCompatible()]], [[ai-http.ts#geminiPreference|geminiPreference()]], [[ai-webllm.ts#askWebLlm|askWebLlm()]], [[claude.ts#AiUnavailableError|AiUnavailableError]], [[claude.ts#askClaude|askClaude()]], [[errorlog.ts#logError|logError()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#saveAiSettings|saveAiSettings()]], [[platform/ai.ts#stripThinking|stripThinking()]], [[platform/ai.ts#wrapError|wrapError()]], [[platform/ai.ts]]
- Uses: [[ai-webllm.ts#WEBLLM_MAX_TOKENS|WEBLLM_MAX_TOKENS]], [[claude.ts#AiUnavailableError|AiUnavailableError]], [[platform/ai.ts#DEFAULT_GEMINI_MODEL|DEFAULT_GEMINI_MODEL]], [[platform/ai.ts]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]]
- Writes: [[aiSettings/gemini|aiSettings.gemini]]
- Used in: [[explainStore.ts]], [[RetrievalView.tsx]], [[drivers.ts]], [[ai-matrix.fuzz.test.ts]], [[ai.test.ts]]

### extractJson
*function* · line 430 · exported
> Parse JSON from a model reply, tolerantly: the whole reply, else a fenced ```json block, else the span from the first { or [ to the last } or ]. Throws AiError('invalid_json') when nothing parses.
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]], [[platform/ai.ts#stripThinking|stripThinking()]]
- Used in: [[json-protocol.ts]], [[ai.test.ts]]

### askAIJson
*function* · line 462 · exported
> Ask for JSON. Describe the exact shape in the prompt; validate the fields you use.
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]], [[claude.ts#askClaudeJson|askClaudeJson()]], [[errorlog.ts#logError|logError()]], [[platform/ai.ts#askAI|askAI()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#extractJson|extractJson()]], [[platform/ai.ts#wrapError|wrapError()]]
- Used in: [[AiDialogs.tsx]], [[ai-matrix.fuzz.test.ts]], [[ai.test.ts]], [[webllm.test.ts]]

### testAiConnection
*function* · line 476 · exported
> Send a tiny prompt to check the setup. Resolves to the reply; rejects AiError.
- Calls: [[platform/ai.ts#askAI|askAI()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]]
- Used in: [[ai-diagnose.ts]], [[ai-matrix.fuzz.test.ts]], [[ai.test.ts]]

### aiErrorMessage
*function* · line 486 · exported
> Plain-language message for an AI error code.
- Calls: [[platform/ai.ts]]
- Uses: [[platform/ai.ts]]
- Used in: [[explainStore.ts]], [[RetrievalView.tsx]], [[AiDialogs.tsx]], [[ai-diagnose.ts]], [[ai-matrix.fuzz.test.ts]], [[ai.test.ts]]

### aiErrorText
*function* · line 578 · exported
> Message for a caught error, with the service's own words when they help.
- Calls: [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]]
- Uses: [[platform/ai.ts]]
- Used in: [[WebLlmSetup.tsx]], [[explainStore.ts]], [[controller.ts]], [[RetrievalView.tsx]], [[AiDialogs.tsx]], [[ai-diagnose.ts]], [[ai-local.ts]], [[ai-matrix.fuzz.test.ts]], [[ai.test.ts]], [[webllm.test.ts]]
