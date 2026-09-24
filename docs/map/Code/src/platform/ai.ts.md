---
id: src/platform/ai.ts
type: module
file: src/platform/ai.ts
area: platform
---

# src/platform/ai.ts

*Module* · area [[platform]] · 838 lines

> AI provider layer. Every AI request in the app goes through askAI / askAIJson here, on a user click. Providers: - claude : inside the claude.ai Artifact viewer (the `sample` capability). Only offered there. - webllm : a small model running on this computer (WebGPU). Nothing leaves the computer. - gemini : Google Gemini with the user's own free key from Google AI Studio. - openai : any OpenAI-co...

## Imports
- [[ai-http.ts]] · type-only, value
- [[ai-timing.ts]] · value
- [[ai-webllm.ts]] · value
- [[claude.ts]] · re-export, value
- [[errorlog.ts]] · value

## Calls
- [[claude.ts#claudeSampleAvailable|claudeSampleAvailable()]]
- [[ai-webllm.ts#detectWebGpu|detectWebGpu()]]
- [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]]
- [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]

## Reads
- [[socius.ai.check]]
- [[socius.ai.keys]]

## Tested by
- [[features.test.ts]] · import
- [[ai-matrix.fuzz.test.ts]] · import
- [[ai-latency.test.ts]] · import
- [[ai-diagnose.test.ts]] · import
- [[ai-keys.test.ts]] · import
- [[ai-local.test.ts]] · import
- [[ai.test.ts]] · import
- [[storage.test.ts]] · import
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
- [[StorageManager.tsx]] · value
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
- [[ai-latency.test.ts]] · dynamic
- [[ai-diagnose.test.ts]] · value
- [[ai-keys.test.ts]] · dynamic, value
- [[ai-local.test.ts]] · value
- [[ai.test.ts]] · value
- [[storage.test.ts]] · value
- [[webllm.test.ts]] · value

## Types
AiProviderId (line 26) · OpenAiPreset (line 27) · AiSettings (line 29) · OpenAiPresetInfo (line 57) · AiPrivacy (line 334) · AiStatus (line 378) · AiConnection (line 397) · AiAskOptions (line 561)

## Private helpers
OLD_DEFAULT_GEMINI_MODELS (line 52) · storage() (line 122) · sessionStore() (line 130) · readSessionKeys() (line 138) · str() (line 147) · PROVIDERS (line 148) · settings (line 199) · settingsListeners (line 236) · notifySettings() (line 244) · isLocalUrl() (line 301) · hostOf() (line 325) · providerReady() (line 356) · initialStatus() (line 399) · APP_FAULT_CODES (line 429) · CONNECTION_FAILURES (line 448) · readCheck() (line 461) · lastCheck (line 470) · connectionOf() (line 472) · status (line 505) · listeners (line 506) · refreshSeq (line 507) · setStatus() (line 518) · started (line 540) · SETTINGS_HINT (line 722) · siteRestriction() (line 807)

## Symbols

### AI_SETTINGS_VERSION
*const* · line 42 · exported
> Version of the stored settings (2: keys remembered only on request; Flash-Lite is the automatic default).

### DEFAULT_GEMINI_MODEL
*const* · line 49 · exported
> Empty = choose automatically, favouring the newest Flash-Lite model the key can use (fastest, many more free requests); 'auto-flash' = automatic, favouring Flash (slower, about 5 requests a minute on the free tier). Settings saved before...
- Used in: [[ai-diagnose.ts]]

### GEMINI_AUTO_FLASH
*const* · line 50 · exported
- Used in: [[AiSettingsDialog.tsx]]

### GEMINI_KEY_URL
*const* · line 53 · exported
- Used in: [[AiSettingsDialog.tsx]]

### DEFAULT_PROMPT_BUDGET_BYTES
*const* · line 55 · exported
> Largest prompt sent to Claude or Gemini (the Claude sample capability accepts 64 KB).
- Used in: [[ai.test.ts]]

### OPENAI_PRESETS
*const* · line 67 · exported
- Uses: [[platform/ai.ts#DEFAULT_PROMPT_BUDGET_BYTES|DEFAULT_PROMPT_BUDGET_BYTES]]
- Used in: [[AiFeatureDialogs.tsx]], [[AiSettingsDialog.tsx]], [[WebLlmSetup.tsx]], [[ai.test.ts]]

### DEFAULT_SETTINGS
*const* · line 107 · exported
- Uses: [[ai-webllm.ts#DEFAULT_WEBLLM_MODEL|DEFAULT_WEBLLM_MODEL]], [[platform/ai.ts#DEFAULT_GEMINI_MODEL|DEFAULT_GEMINI_MODEL]], [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]]

### AI_SETTINGS_KEY
*const* · line 118 · exported
> ---------- settings persistence ----------
- Used in: [[ai-keys.test.ts]], [[ai.test.ts]]

### AI_SESSION_KEYS
*const* · line 120 · exported
> Keys that are not remembered: this tab only (sessionStorage).
- Used in: [[ai-keys.test.ts]]

### parseAiSettings
*function* · line 150 · exported
- Calls: [[ai-webllm.ts#webLlmChoice|webLlmChoice()]], [[platform/ai.ts]]
- Uses: [[ai-webllm.ts#DEFAULT_WEBLLM_MODEL|DEFAULT_WEBLLM_MODEL]], [[platform/ai.ts#DEFAULT_GEMINI_MODEL|DEFAULT_GEMINI_MODEL]], [[platform/ai.ts#DEFAULT_SETTINGS|DEFAULT_SETTINGS]], [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]], [[platform/ai.ts]]
- Used in: [[ai-keys.test.ts]], [[ai.test.ts]]

### storedAiSettings
*function* · line 190 · exported
> What goes into localStorage: the settings, with keys only where the user asked to remember them.
- Uses: [[platform/ai.ts#AI_SETTINGS_VERSION|AI_SETTINGS_VERSION]]
- Used in: [[ai-keys.test.ts]]

### loadAiSettings
*function* · line 201 · exported
- Calls: [[platform/ai.ts#parseAiSettings|parseAiSettings()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts#AI_SETTINGS_KEY|AI_SETTINGS_KEY]]
- Reads: [[socius.ai]]

### persistSettings
*function* · line 216
- Calls: [[platform/ai.ts#storedAiSettings|storedAiSettings()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts#AI_SESSION_KEYS|AI_SESSION_KEYS]], [[platform/ai.ts#AI_SETTINGS_KEY|AI_SETTINGS_KEY]]
- Writes: [[socius.ai.keys]], [[socius.ai]]

### getAiSettings
*function* · line 232 · exported
- Uses: [[platform/ai.ts]]
- Used in: [[AiBits.tsx]], [[AiFeatureDialogs.tsx]], [[AiSettingsDialog.tsx]], [[LocalSetup.tsx]], [[WebLlmSetup.tsx]], [[install.ts]], [[drivers.ts]], [[ai-diagnose.ts]], [[ai-keys.test.ts]], [[ai.test.ts]]

### subscribeAiSettings
*function* · line 239 · exported
> Notified synchronously whenever settings change (controlled inputs need that).
- Uses: [[platform/ai.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[ai.test.ts]]

### saveAiSettings
*function* · line 249 · exported
> Save settings (merged into the current ones) and notify listeners.
- Calls: [[platform/ai.ts#persistSettings|persistSettings()]], [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]], [[aiSettings/openai|aiSettings.openai]], [[aiSettings/webllm|aiSettings.webllm]], [[remember|aiSettings.remember]]
- Used in: [[AiSettingsDialog.tsx]], [[LocalSetup.tsx]], [[WebLlmSetup.tsx]], [[ai-diagnose.ts]], [[features.test.ts]], [[ai-matrix.fuzz.test.ts]], [[ai-diagnose.test.ts]], [[ai-keys.test.ts]], [[ai.test.ts]], [[webllm.test.ts]]

### forgetAiKey
*function* · line 265 · exported
> Remove a stored key from this browser (localStorage and this tab).
- Calls: [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- Uses: [[platform/ai.ts]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]], [[aiSettings/openai|aiSettings.openai]]
- Writes: [[aiSettings/gemini|aiSettings.gemini]], [[aiSettings/openai|aiSettings.openai]]
- Used in: [[AiSettingsDialog.tsx]], [[ai-keys.test.ts]], [[ai.test.ts]]

### setRememberKey
*function* · line 270 · exported
> "Remember this key on this computer": keep it in localStorage (true) or in this tab only (false).
- Calls: [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- Uses: [[platform/ai.ts]]
- Reads: [[remember|aiSettings.remember]]
- Writes: [[remember|aiSettings.remember]]
- Used in: [[AiSettingsDialog.tsx]], [[ai-keys.test.ts]]

### dismissAiNotice
*function* · line 275 · exported
> Clear the one-time note shown in AI settings.
- Calls: [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- Writes: [[notice|aiSettings.notice]]
- Used in: [[AiSettingsDialog.tsx]], [[ai-keys.test.ts]]

### __reloadAiSettings
*function* · line 280 · exported
> Test hook: re-read settings from storage and reset the status.
- Calls: [[platform/ai.ts#loadAiSettings|loadAiSettings()]], [[platform/ai.ts]]
- Uses: [[aiSettings|AI settings (localStorage socius.ai)]], [[platform/ai.ts]]
- Used in: [[features.test.ts]], [[ai-matrix.fuzz.test.ts]], [[ai-diagnose.test.ts]], [[ai-keys.test.ts]], [[ai-local.test.ts]], [[ai.test.ts]], [[storage.test.ts]], [[webllm.test.ts]]

### claudePresent
*function* · line 288 · exported
> ---------- which provider ----------
- Calls: [[claude.ts#claudeGlobal|claudeGlobal()]]
- Used in: [[AiSettingsDialog.tsx]]

### effectiveProvider
*function* · line 293 · exported
> The provider that askAI will use, or null when none is set up.
- Calls: [[platform/ai.ts#claudePresent|claudePresent()]]
- Uses: [[ai-webllm.ts#WEBLLM_IN_BUILD|WEBLLM_IN_BUILD]], [[platform/ai.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[controller.ts]], [[install.ts]], [[drivers.ts]], [[ai-diagnose.ts]], [[ai.test.ts]]

### providerLabel
*function* · line 306 · exported
> Short name of a provider for "will be sent to ..." lines.
- Calls: [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiPreference|geminiPreference()]], [[ai-http.ts#lastResolvedGeminiModel|lastResolvedGeminiModel()]], [[ai-webllm.ts#webLlmChoice|webLlmChoice()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]], [[platform/ai.ts]]
- Used in: [[controller.ts]], [[drivers.ts]], [[ai-diagnose.ts]], [[ai.test.ts]]

### providerPrivacy
*function* · line 336 · exported
- Calls: [[platform/ai.ts]]
- Uses: [[platform/ai.ts]]
- Used in: [[AiBits.tsx]], [[ai.test.ts]]

### aiPromptBudget
*function* · line 345 · exported
> How many bytes of prompt the current provider takes comfortably.
- Calls: [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts]]
- Uses: [[ai-webllm.ts#WEBLLM_PROMPT_BUDGET_BYTES|WEBLLM_PROMPT_BUDGET_BYTES]], [[platform/ai.ts#DEFAULT_PROMPT_BUDGET_BYTES|DEFAULT_PROMPT_BUDGET_BYTES]], [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]], [[platform/ai.ts]]
- Used in: [[ExplainPanel.tsx]], [[explainStore.ts]], [[RetrievalView.tsx]], [[AiDialogs.tsx]], [[drivers.ts]], [[ai.test.ts]]

### aiAvailable
*function* · line 372 · exported
> True when a provider is configured and usable here (no request is sent to any AI service).
- Calls: [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts]]
- Used in: [[features.ts]], [[ai.test.ts]]

### AI_CHECK_KEY
*const* · line 406 · exported
> ---------- the last connection result, per set-up ----------

### setupSignature
*function* · line 409 · exported
> A fingerprint of the set-up (keys only as a hash): a new key or model means "not tested yet".
- Calls: [[ai-http.ts#keyHash|keyHash()]], [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Uses: [[platform/ai.ts]]

### aiErrorIsAppFault
*function* · line 432 · exported
> Is this AI error a fault in the app (rather than the key, the network, a limit...)?
- Uses: [[platform/ai.ts]]
- Used in: [[controller.ts]]

### logAiError
*function* · line 441 · exported
> Log an AI error at the right level (see aiErrorIsAppFault). Returns the error.
- Calls: [[errorlog.ts#logError|logError()]], [[errorlog.ts#logWarn|logWarn()]], [[platform/ai.ts#aiErrorIsAppFault|aiErrorIsAppFault()]]
- Used in: [[ai-diagnose.ts]]

### recordAiConnection
*function* · line 484 · exported
> Remember how the last Test connection or AI request went with the current set-up. Errors that do not say anything about the connection (Stop, a busy service, a too long prompt, a rate limit, which means the key works) are ignored or coun...
- Calls: [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#setupSignature|setupSignature()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts#AI_CHECK_KEY|AI_CHECK_KEY]], [[platform/ai.ts]]
- Writes: [[socius.ai.check]]
- Used in: [[controller.ts]], [[ai-diagnose.ts]]

### getAiStatus
*function* · line 509 · exported
- Uses: [[platform/ai.ts]]
- Used in: [[explainStore.ts]], [[features.ts]], [[ai/hooks.ts]], [[controller.ts]], [[OutputViewer.tsx]], [[ai.test.ts]]

### subscribeAi
*function* · line 513 · exported
- Uses: [[platform/ai.ts]]
- Used in: [[ai/hooks.ts]], [[ai.test.ts]]

### refreshAiStatus
*function* · line 524 · exported
> Re-check the provider (after settings change, or once at start). Resolves to the new status.
- Calls: [[ai-webllm.ts#detectWebGpu|detectWebGpu()]], [[ai-webllm.ts#isWebLlmCached|isWebLlmCached()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#providerLabel|providerLabel()]], [[platform/ai.ts#providerPrivacy|providerPrivacy()]], [[platform/ai.ts]]
- Uses: [[platform/ai.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[StorageManager.tsx]], [[WebLlmSetup.tsx]], [[controller.ts]], [[features.test.ts]], [[ai.test.ts]], [[webllm.test.ts]]

### startAiStatus
*function* · line 542 · exported
> Start the first status check (idempotent). Also follows settings changed in another tab.
- Calls: [[platform/ai.ts#loadAiSettings|loadAiSettings()]], [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]], [[platform/ai.ts]]
- Uses: [[aiSettings|AI settings (localStorage socius.ai)]], [[platform/ai.ts#AI_SETTINGS_KEY|AI_SETTINGS_KEY]], [[platform/ai.ts]]
- Used in: [[ai/hooks.ts]]

### stripThinking
*function* · line 579 · exported
> Remove "thinking" blocks some models emit (<think>...</think>), including an unfinished one while streaming.
- Used in: [[ai-local.ts]], [[ai.test.ts]]

### wrapError
*function* · line 586
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### askAI
*function* · line 593 · exported
> Ask the current provider for text. Rejects AiError with a stable `code` (see aiErrorMessage).
- Calls: [[ai-timing.ts#startAiTiming|startAiTiming()]], [[platform/ai.ts#askProvider|askProvider()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#logAiError|logAiError()]], [[platform/ai.ts#recordAiConnection|recordAiConnection()]], [[platform/ai.ts#stripThinking|stripThinking()]], [[platform/ai.ts#wrapError|wrapError()]]
- Uses: [[platform/ai.ts]]
- Used in: [[explainStore.ts]], [[RetrievalView.tsx]], [[drivers.ts]], [[ai-matrix.fuzz.test.ts]], [[ai.test.ts]]

### askProvider
*function* · line 620
- Calls: [[ai-http.ts#askGemini|askGemini()]], [[ai-http.ts#askOpenAiCompatible|askOpenAiCompatible()]], [[ai-http.ts#geminiPreference|geminiPreference()]], [[ai-webllm.ts#askWebLlm|askWebLlm()]], [[claude.ts#AiUnavailableError|AiUnavailableError]], [[claude.ts#askClaude|askClaude()]], [[platform/ai.ts#saveAiSettings|saveAiSettings()]], [[platform/ai.ts#stripThinking|stripThinking()]], [[platform/ai.ts]]
- Uses: [[ai-webllm.ts#WEBLLM_MAX_TOKENS|WEBLLM_MAX_TOKENS]], [[claude.ts#AiUnavailableError|AiUnavailableError]], [[platform/ai.ts#DEFAULT_GEMINI_MODEL|DEFAULT_GEMINI_MODEL]], [[platform/ai.ts]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]]
- Writes: [[aiSettings/gemini|aiSettings.gemini]]

### extractJson
*function* · line 669 · exported
> Parse JSON from a model reply, tolerantly: the whole reply, else a fenced ```json block, else the span from the first { or [ to the last } or ]. Throws AiError('invalid_json') when nothing parses.
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]], [[platform/ai.ts#stripThinking|stripThinking()]]
- Used in: [[json-protocol.ts]], [[ai.test.ts]]

### askAIJson
*function* · line 701 · exported
> Ask for JSON. Describe the exact shape in the prompt; validate the fields you use.
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]], [[claude.ts#askClaudeJson|askClaudeJson()]], [[platform/ai.ts#askAI|askAI()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#extractJson|extractJson()]], [[platform/ai.ts#logAiError|logAiError()]], [[platform/ai.ts#wrapError|wrapError()]]
- Used in: [[AiDialogs.tsx]], [[ai-matrix.fuzz.test.ts]], [[ai.test.ts]], [[webllm.test.ts]]

### testAiConnection
*function* · line 715 · exported
> Send a tiny prompt to check the setup. Resolves to the reply; rejects AiError.
- Calls: [[platform/ai.ts#askAI|askAI()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]]
- Used in: [[ai-diagnose.ts]], [[ai-matrix.fuzz.test.ts]], [[ai.test.ts]]

### aiErrorMessage
*function* · line 725 · exported
> Plain-language message for an AI error code.
- Calls: [[platform/ai.ts]]
- Uses: [[platform/ai.ts]]
- Used in: [[explainStore.ts]], [[RetrievalView.tsx]], [[AiDialogs.tsx]], [[ai-diagnose.ts]], [[ai-matrix.fuzz.test.ts]], [[ai.test.ts]]

### aiErrorText
*function* · line 817 · exported
> Message for a caught error, with the service's own words when they help.
- Calls: [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]]
- Uses: [[platform/ai.ts]]
- Used in: [[WebLlmSetup.tsx]], [[explainStore.ts]], [[controller.ts]], [[RetrievalView.tsx]], [[AiDialogs.tsx]], [[ai-diagnose.ts]], [[ai-local.ts]], [[ai-matrix.fuzz.test.ts]], [[ai.test.ts]], [[webllm.test.ts]]
