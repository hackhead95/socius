---
id: src/features/ai/AiSettingsDialog.tsx
type: module
file: src/features/ai/AiSettingsDialog.tsx
area: features/ai
---

# src/features/ai/AiSettingsDialog.tsx

*Module* · area [[features - ai|features/ai]] · 345 lines

> "AI assistant" settings: choose where AI help runs (Claude inside the artifact, a model on this computer, Google Gemini with a free key, or another OpenAI-compatible service), enter keys, test the connection, and read what each choice means for participants' privacy. Settings are saved in this browser as you type; they never go into project files or exports.

## Imports
- [[react]] · value
- `src/features/ai/ai.css` · side-effect
- [[AiBits.tsx]] · value
- [[ConnectionChecklist.tsx]] · value
- [[explainStore.ts]] · value
- [[features.ts]] · value
- [[ai/hooks.ts]] · value
- [[LocalSetup.tsx]] · value
- [[WebLlmSetup.tsx]] · value
- [[ai-diagnose.ts]] · value
- [[ai-http.ts]] · value
- [[ai-local.ts]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value
- [[Modal.tsx]] · value

## Calls
- [[platform/ai.ts#claudePresent|claudePresent()]]
- [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]]

## Uses
- [[ai-webllm.ts#WEBLLM_IN_BUILD|WEBLLM_IN_BUILD]]

## Imported by
- [[App.tsx]] · value

## Private helpers
choices() (line 33) · hostLabel() (line 211)

## Symbols

### AiSettingsHost
*component* · line 44 · exported · note: [[AiSettingsHost|<AiSettingsHost>]]
- Renders: [[AiSettingsDialog|<AiSettingsDialog>]]
- Calls: [[features.ts#isAiFeatureId|isAiFeatureId()]], [[useAiSettingsDialog]]
- Reads: [[intent|useAiSettingsDialog.intent]], [[useAiSettingsDialog/open|useAiSettingsDialog.open]]
- Store actions: [[useAiSettingsDialog/set()|useAiSettingsDialog.set()]]
- Rendered by: [[Components/App|<App>]]

### AiSettingsDialog
*component* · line 55 · exported · note: [[AiSettingsDialog|<AiSettingsDialog>]]
- Renders: [[AiPrivacyNotice|<AiPrivacyNotice>]], [[ConnectionChecklist|<ConnectionChecklist>]], [[GeminiSection|<GeminiSection>]], [[Modal|<Modal>]], [[OpenAiSection|<OpenAiSection>]], [[ReadyPanel|<ReadyPanel>]], [[WebLlmSetup|<WebLlmSetup>]]
- Calls: [[AiSettingsDialog.tsx]], [[ai-diagnose.ts#runConnectionCheck|runConnectionCheck()]], [[ai-local.ts#isLocalServiceUrl|isLocalServiceUrl()]], [[features.ts#aiFeature|aiFeature()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#getAiSettings|getAiSettings()]], [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]], [[platform/ai.ts#saveAiSettings|saveAiSettings()]], [[useAiStatus|useAiStatus()]]
- Uses: [[platform/ai.ts#getAiSettings|getAiSettings()]], [[platform/ai.ts#subscribeAiSettings|subscribeAiSettings()]]
- Reads: [[aiSettings/openai|aiSettings.openai]]
- Writes: [[aiSettings/openai|aiSettings.openai]], [[provider|aiSettings.provider]]

### ReadyPanel
*component* · line 184 · note: [[ReadyPanel|<ReadyPanel>]]
> After a successful test: one button per AI feature that closes settings and starts it.
- Calls: [[features.ts#aiFeature|aiFeature()]], [[features.ts#runAiFeature|runAiFeature()]]
- Uses: [[features.ts#AI_FEATURES|AI_FEATURES]], [[useExplain]]
- Store actions: [[setPending()|useExplain.setPending()]]

### KeyField
*component* · line 219 · note: [[KeyField|<KeyField>]]

### GeminiSection
*component* · line 245 · note: [[GeminiSection|<GeminiSection>]]
- Renders: [[KeyField|<KeyField>]]
- Calls: [[ai-http.ts#geminiKeyWarning|geminiKeyWarning()]], [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiPreference|geminiPreference()]], [[ai-http.ts#lastResolvedGeminiModel|lastResolvedGeminiModel()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[platform/ai.ts#forgetAiKey|forgetAiKey()]], [[platform/ai.ts#getAiSettings|getAiSettings()]], [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- Uses: [[platform/ai.ts#GEMINI_AUTO_FLASH|GEMINI_AUTO_FLASH]], [[platform/ai.ts#GEMINI_KEY_URL|GEMINI_KEY_URL]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]]
- Writes: [[aiSettings/gemini|aiSettings.gemini]]

### OpenAiSection
*component* · line 303 · note: [[OpenAiSection|<OpenAiSection>]]
- Renders: [[KeyField|<KeyField>]], [[LocalSetup|<LocalSetup>]]
- Calls: [[ai-local.ts#isLocalServiceUrl|isLocalServiceUrl()]], [[platform/ai.ts#forgetAiKey|forgetAiKey()]], [[platform/ai.ts#getAiSettings|getAiSettings()]], [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- Uses: [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]]
- Reads: [[aiSettings/openai|aiSettings.openai]]
- Writes: [[aiSettings/openai|aiSettings.openai]]
