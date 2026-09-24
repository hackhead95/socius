---
id: "src/features/ai/WebLlmSetup.tsx#WebLlmSetup"
type: component
file: src/features/ai/WebLlmSetup.tsx
line: 41
area: features/ai
---

# <WebLlmSetup>

*React component* · defined in [[WebLlmSetup.tsx]] (line 41) · area [[features - ai|features/ai]]

- **Exported:** yes

## Calls
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[ai-webllm.ts#deleteWebLlmModel|deleteWebLlmModel()]]
- [[ai-webllm.ts#describeWebLlmProgress|describeWebLlmProgress()]]
- [[ai-webllm.ts#detectWebGpu|detectWebGpu()]]
- [[ai-webllm.ts#deviceMemoryGB|deviceMemoryGB()]]
- [[platform/ai.ts#getAiSettings|getAiSettings()]]
- [[WebLlmSetup.tsx#gpuProblem|gpuProblem()]]
- [[ai-webllm.ts#prepareWebLlm|prepareWebLlm()]]
- [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]]
- [[ai-webllm.ts#requestPersistentStorage|requestPersistentStorage()]]
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- [[ai-webllm.ts#storageFreeMB|storageFreeMB()]]
- [[ai-webllm.ts#suggestSmallerModel|suggestSmallerModel()]]
- [[useAiStatus|useAiStatus()]]
- [[useWebLlmState|useWebLlmState()]]

## Uses
- [[ai-webllm.ts#WEBLLM_MODELS|WEBLLM_MODELS]]

## Reads
- [[aiSettings/webllm|aiSettings.webllm]] · alias

## Writes
- [[aiSettings/webllm|aiSettings.webllm]] · setter

## Checks error code
- [[cancelled]]

## Rendered by
- [[AiSettingsDialog|<AiSettingsDialog>]]
