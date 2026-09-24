---
id: src/features/ai/WebLlmSetup.tsx
type: module
file: src/features/ai/WebLlmSetup.tsx
area: features/ai
---

# src/features/ai/WebLlmSetup.tsx

*Module* · area [[features - ai|features/ai]] · 187 lines

> AI assistant settings > On this computer: whether this browser can run the on-device model (and exactly why not), the model choice, and the one-time download with progress, cancel and retry.

## Imports
- [[react]] · value
- `src/features/ai/ai-local.css` · side-effect
- [[ai/hooks.ts]] · value
- [[ai-local.ts]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value

## Imported by
- [[AiSettingsDialog.tsx]] · value

## Private helpers
SITE (line 13)

## Symbols

### gpuProblem
*function* · line 16 · exported
> Why this browser cannot run the model, in plain words, for each detection result.
- Calls: [[ai-local.ts#detectBrowser|detectBrowser()]], [[ai-local.ts#detectOs|detectOs()]]
- Uses: [[WebLlmSetup.tsx]]

### WebLlmSetup
*component* · line 41 · exported · note: [[WebLlmSetup|<WebLlmSetup>]]
- Calls: [[WebLlmSetup.tsx#gpuProblem|gpuProblem()]], [[ai-webllm.ts#deleteWebLlmModel|deleteWebLlmModel()]], [[ai-webllm.ts#describeWebLlmProgress|describeWebLlmProgress()]], [[ai-webllm.ts#detectWebGpu|detectWebGpu()]], [[ai-webllm.ts#deviceMemoryGB|deviceMemoryGB()]], [[ai-webllm.ts#prepareWebLlm|prepareWebLlm()]], [[ai-webllm.ts#requestPersistentStorage|requestPersistentStorage()]], [[ai-webllm.ts#storageFreeMB|storageFreeMB()]], [[ai-webllm.ts#suggestSmallerModel|suggestSmallerModel()]], [[platform/ai.ts#aiErrorText|aiErrorText()]], [[platform/ai.ts#getAiSettings|getAiSettings()]], [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]], [[platform/ai.ts#saveAiSettings|saveAiSettings()]], [[useAiStatus|useAiStatus()]], [[useWebLlmState|useWebLlmState()]]
- Uses: [[ai-webllm.ts#WEBLLM_MODELS|WEBLLM_MODELS]]
- Reads: [[aiSettings/webllm|aiSettings.webllm]]
- Writes: [[aiSettings/webllm|aiSettings.webllm]]
- Rendered by: [[AiSettingsDialog|<AiSettingsDialog>]]
