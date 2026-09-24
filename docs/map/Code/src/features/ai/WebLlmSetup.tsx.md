---
id: src/features/ai/WebLlmSetup.tsx
type: module
file: src/features/ai/WebLlmSetup.tsx
area: features/ai
---

# src/features/ai/WebLlmSetup.tsx

*Module* · area [[features - ai|features/ai]] · 257 lines

> AI assistant settings > On this computer: whether this browser can run the on-device model (and exactly why not), the model choice, and the one-time download with progress, cancel and retry.

## Imports
- [[react]] · value
- `src/features/ai/ai-local.css` · side-effect
- [[ai/hooks.ts]] · value
- [[StorageManager.tsx]] · value
- [[ai-local.ts]] · value
- [[ai-storage.ts]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value

## Imported by
- [[AiSettingsDialog.tsx]] · value

## Private helpers
SITE (line 17)

## Symbols

### gpuProblem
*function* · line 20 · exported
> Why this browser cannot run the model, in plain words, for each detection result.
- Calls: [[ai-local.ts#detectBrowser|detectBrowser()]], [[ai-local.ts#detectOs|detectOs()]]
- Uses: [[WebLlmSetup.tsx]]

### WebLlmSetup
*component* · line 45 · exported · note: [[WebLlmSetup|<WebLlmSetup>]]
- Renders: [[StorageManager|<StorageManager>]]
- Calls: [[WebLlmSetup.tsx#gpuProblem|gpuProblem()]], [[ai-storage.ts#checkSpaceFor|checkSpaceFor()]], [[ai-storage.ts#formatBytes|formatBytes()]], [[ai-storage.ts#listWebLlmStorage|listWebLlmStorage()]], [[ai-webllm.ts#deleteWebLlmModelId|deleteWebLlmModelId()]], [[ai-webllm.ts#deleteWebLlmModel|deleteWebLlmModel()]], [[ai-webllm.ts#describeWebLlmProgress|describeWebLlmProgress()]], [[ai-webllm.ts#detectWebGpu|detectWebGpu()]], [[ai-webllm.ts#deviceMemoryGB|deviceMemoryGB()]], [[ai-webllm.ts#modelDownloadBytes|modelDownloadBytes()]], [[ai-webllm.ts#prepareWebLlm|prepareWebLlm()]], [[ai-webllm.ts#requestPersistentStorage|requestPersistentStorage()]], [[ai-webllm.ts#resolveModelId|resolveModelId()]], [[ai-webllm.ts#storageFreeMB|storageFreeMB()]], [[ai-webllm.ts#suggestSmallerModel|suggestSmallerModel()]], [[platform/ai.ts#aiErrorText|aiErrorText()]], [[platform/ai.ts#getAiSettings|getAiSettings()]], [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]], [[platform/ai.ts#saveAiSettings|saveAiSettings()]], [[useAiStatus|useAiStatus()]], [[useWebLlmState|useWebLlmState()]]
- Uses: [[ai-webllm-models.ts#WEBLLM_MODELS|WEBLLM_MODELS]], [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]]
- Reads: [[aiSettings/openai|aiSettings.openai]], [[aiSettings/webllm|aiSettings.webllm]]
- Writes: [[aiSettings/openai|aiSettings.openai]], [[aiSettings/webllm|aiSettings.webllm]], [[provider|aiSettings.provider]]
- Rendered by: [[AiSettingsDialog|<AiSettingsDialog>]]
