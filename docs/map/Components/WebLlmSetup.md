---
id: "src/features/ai/WebLlmSetup.tsx#WebLlmSetup"
type: component
file: src/features/ai/WebLlmSetup.tsx
line: 45
area: features/ai
---

# <WebLlmSetup>

*React component* · defined in [[WebLlmSetup.tsx]] (line 45) · area [[features - ai|features/ai]]

- **Exported:** yes

## Calls
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[ai-storage.ts#checkSpaceFor|checkSpaceFor()]]
- [[ai-webllm.ts#deleteWebLlmModel|deleteWebLlmModel()]]
- [[ai-webllm.ts#deleteWebLlmModelId|deleteWebLlmModelId()]]
- [[ai-webllm.ts#describeWebLlmProgress|describeWebLlmProgress()]]
- [[ai-webllm.ts#detectWebGpu|detectWebGpu()]]
- [[ai-webllm.ts#deviceMemoryGB|deviceMemoryGB()]]
- [[ai-storage.ts#formatBytes|formatBytes()]]
- [[platform/ai.ts#getAiSettings|getAiSettings()]]
- [[WebLlmSetup.tsx#gpuProblem|gpuProblem()]]
- [[ai-storage.ts#listWebLlmStorage|listWebLlmStorage()]]
- [[ai-webllm.ts#modelDownloadBytes|modelDownloadBytes()]]
- [[ai-webllm.ts#prepareWebLlm|prepareWebLlm()]]
- [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]]
- [[ai-webllm.ts#requestPersistentStorage|requestPersistentStorage()]]
- [[ai-webllm.ts#resolveModelId|resolveModelId()]]
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- [[ai-webllm.ts#storageFreeMB|storageFreeMB()]]
- [[ai-webllm.ts#suggestSmallerModel|suggestSmallerModel()]]
- [[useAiStatus|useAiStatus()]]
- [[useWebLlmState|useWebLlmState()]]

## Renders
- [[StorageManager|<StorageManager>]]

## Uses
- [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]]
- [[ai-webllm-models.ts#WEBLLM_MODELS|WEBLLM_MODELS]]

## Reads
- [[aiSettings/openai|aiSettings.openai]] · getter
- [[aiSettings/webllm|aiSettings.webllm]] · alias

## Writes
- [[aiSettings/openai|aiSettings.openai]] · setter
- [[provider|aiSettings.provider]] · setter
- [[aiSettings/webllm|aiSettings.webllm]] · setter

## Checks error code
- [[cancelled]]

## Rendered by
- [[AiSettingsDialog|<AiSettingsDialog>]]
