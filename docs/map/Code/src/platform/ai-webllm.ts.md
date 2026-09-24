---
id: src/platform/ai-webllm.ts
type: module
file: src/platform/ai-webllm.ts
area: platform
---

# src/platform/ai-webllm.ts

*Module* · area [[platform]] · 433 lines

> On-device AI with WebLLM (@mlc-ai/web-llm): a small language model runs on this computer's graphics chip through WebGPU. Nothing leaves the computer. The first use downloads the model weights, which the browser then keeps in its cache. The package is large (several MB), so it is only ever loaded with a dynamic import, on first use. In the single-file Claude artifact build it is left out entirel...

## Imports
- [[@mlc-ai-web-llm|@mlc-ai/web-llm]] · dynamic, type-only
- [[ai-storage.ts]] · value
- [[ai-webllm-models.ts]] · re-export, value
- [[claude.ts]] · value

## Tested by
- [[features.test.ts]] · import
- [[ai-diagnose.test.ts]] · import
- [[ai.test.ts]] · import
- [[storage.test.ts]] · import
- [[webllm.test.ts]] · import

## Imported by
- [[AiBits.tsx]] · value
- [[AiSettingsDialog.tsx]] · value
- [[ai/hooks.ts]] · value
- [[StorageManager.tsx]] · value
- [[WebLlmSetup.tsx]] · value
- [[platform/ai.ts]] · value
- [[features.test.ts]] · value
- [[ai-diagnose.test.ts]] · value
- [[ai.test.ts]] · value
- [[storage.test.ts]] · value
- [[webllm.test.ts]] · value

## Implements provider
- [[Providers/webllm|webllm]]

## Types
WebGpuStatus (line 59) · WebLlmState (line 168) · WebLlmAskOptions (line 319)

## Private helpers
loader (line 38) · modPromise (line 39) · loadModule() (line 41) · MIN_LIMITS (line 52) · gpuPromise (line 82) · disableF16() (line 161) · state (line 177) · listeners (line 178) · setState() (line 189) · engine (line 212) · loadedModel (line 213) · loading (line 214) · isAbortError() (line 216)

## Symbols

### DEFAULT_WEBLLM_MODEL
*const* · line 17 · exported
- Uses: [[ai-webllm-models.ts#WEBLLM_MODELS|WEBLLM_MODELS]]
- Used in: [[platform/ai.ts]]

### WEBLLM_PROMPT_BUDGET_BYTES
*const* · line 19 · exported
> Both models have a 4,096-token context window: keep prompts small and leave room for the reply.
- Used in: [[platform/ai.ts]], [[ai.test.ts]]

### WEBLLM_MAX_TOKENS
*const* · line 20 · exported
- Used in: [[platform/ai.ts]]

### WEBLLM_IN_BUILD
*const* · line 23 · exported
> False in the Claude artifact build, where the on-device option is not offered.
- Used in: [[AiSettingsDialog.tsx]], [[platform/ai.ts]]

### webLlmChoice
*function* · line 25 · exported
- Uses: [[ai-webllm-models.ts#WEBLLM_MODELS|WEBLLM_MODELS]]
- Used in: [[AiBits.tsx]], [[platform/ai.ts]]

### defaultLoader
*function* · line 33
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### detectWebGpu
*function* · line 84 · exported
- Uses: [[ai-webllm.ts#WEBLLM_IN_BUILD|WEBLLM_IN_BUILD]], [[ai-webllm.ts]]
- Used in: [[WebLlmSetup.tsx]], [[platform/ai.ts]], [[webllm.test.ts]]

### storageFreeMB
*function* · line 121 · exported
> Free space the browser will give this site, in MB (quota minus usage), or null when it does not say. A private window often has a tiny quota.
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### requestPersistentStorage
*function* · line 132 · exported
> Ask the browser to keep the downloaded model when disk space runs low (best effort, never throws).
- Calls: [[ai-storage.ts#requestPersist|requestPersist()]]
- Used in: [[WebLlmSetup.tsx]]

### modelDownloadBytes
*function* · line 137 · exported
> Bytes a model id needs in browser storage (its download).
- Calls: [[ai-webllm.ts#webLlmChoice|webLlmChoice()]]
- Used in: [[WebLlmSetup.tsx]]

### deviceMemoryGB
*function* · line 143 · exported
> Memory this computer reports (Chrome and Edge only, rounded, at most 8 or so), or null.
- Used in: [[WebLlmSetup.tsx]]

### suggestSmallerModel
*function* · line 149 · exported
> Suggest the smaller model when this computer reports little memory.
- Calls: [[ai-webllm.ts#deviceMemoryGB|deviceMemoryGB()]], [[ai-webllm.ts#webLlmChoice|webLlmChoice()]]
- Uses: [[ai-webllm-models.ts#WEBLLM_MODELS|WEBLLM_MODELS]]
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### resolveModelId
*function* · line 154 · exported
> The model id to load on this computer for a chosen model.
- Calls: [[ai-webllm.ts#detectWebGpu|detectWebGpu()]], [[ai-webllm.ts#webLlmChoice|webLlmChoice()]]
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### getWebLlmState
*function* · line 180 · exported
- Uses: [[ai-webllm.ts]]
- Used in: [[ai/hooks.ts]], [[webllm.test.ts]]

### subscribeWebLlm
*function* · line 184 · exported
- Uses: [[ai-webllm.ts]]
- Used in: [[ai/hooks.ts]], [[webllm.test.ts]]

### describeWebLlmProgress
*function* · line 195 · exported
> What the progress bar is doing, in plain words (the package reports downloading, then preparing the graphics chip).
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### loadErrorCode
*function* · line 224 · exported
> Stable error code for a failed model load. The package's own messages are technical; these codes map to plain-language messages in aiErrorMessage (src/platform/ai.ts).
- Used in: [[webllm.test.ts]]

### ensureEngine
*function* · line 237 · exported
> Load (downloading on first use) the model. Aborting the signal cancels the download.
- Calls: [[ai-storage.ts#checkSpaceFor|checkSpaceFor()]], [[ai-storage.ts#deleteStoredModel|deleteStoredModel()]], [[ai-storage.ts#estimateStorage|estimateStorage()]], [[ai-storage.ts#formatBytes|formatBytes()]], [[ai-storage.ts#freeBytes|freeBytes()]], [[ai-storage.ts#requestPersist|requestPersist()]], [[ai-webllm.ts#detectWebGpu|detectWebGpu()]], [[ai-webllm.ts#loadErrorCode|loadErrorCode()]], [[ai-webllm.ts#modelDownloadBytes|modelDownloadBytes()]], [[ai-webllm.ts#waitWithSignal|waitWithSignal()]], [[ai-webllm.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[ai-webllm.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]

### waitWithSignal
*function* · line 309
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### askWebLlm
*function* · line 327 · exported
> Ask the on-device model. Always streams internally so Stop can interrupt generation.
- Calls: [[ai-webllm.ts#loadChoice|loadChoice()]], [[ai-webllm.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[ai-webllm.ts#WEBLLM_MAX_TOKENS|WEBLLM_MAX_TOKENS]], [[ai-webllm.ts]]
- Used in: [[platform/ai.ts]], [[webllm.test.ts]]

### prepareWebLlm
*function* · line 366 · exported
> Download (or load from the browser cache) without asking anything.
- Calls: [[ai-webllm.ts#loadChoice|loadChoice()]]
- Used in: [[WebLlmSetup.tsx]], [[storage.test.ts]], [[webllm.test.ts]]

### loadChoice
*function* · line 374
> Load the right files for a chosen model. The GPU check says whether 16-bit shaders exist; if the engine finds out otherwise while loading, switch to the 32-bit files once and try again.
- Calls: [[ai-webllm.ts#ensureEngine|ensureEngine()]], [[ai-webllm.ts#resolveModelId|resolveModelId()]], [[ai-webllm.ts]]

### isWebLlmCached
*function* · line 385 · exported
> Is the model already in the browser cache? (No download.)
- Calls: [[ai-webllm.ts#detectWebGpu|detectWebGpu()]], [[ai-webllm.ts#resolveModelId|resolveModelId()]], [[ai-webllm.ts]]
- Used in: [[platform/ai.ts]], [[webllm.test.ts]]

### deleteWebLlmModelId
*function* · line 397 · exported
> Remove one stored model by its exact id (as listed in Browser storage), unloading it first if it is loaded.
- Calls: [[ai-storage.ts#deleteStoredModel|deleteStoredModel()]], [[ai-webllm.ts]]
- Uses: [[ai-webllm.ts]]
- Used in: [[StorageManager.tsx]], [[WebLlmSetup.tsx]]

### deleteWebLlmModel
*function* · line 407 · exported
> Remove the model files from the browser cache to free disk space.
- Calls: [[ai-storage.ts#deleteStoredModel|deleteStoredModel()]], [[ai-webllm.ts#resolveModelId|resolveModelId()]], [[ai-webllm.ts]]
- Uses: [[ai-webllm.ts]]
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### __setWebLlmLoader
*function* · line 424 · exported
> Test hook: replace the package loader (and forget the engine, GPU check and state).
- Uses: [[ai-webllm.ts#defaultLoader|defaultLoader()]], [[ai-webllm.ts]]
- Used in: [[features.test.ts]], [[ai-diagnose.test.ts]], [[ai.test.ts]], [[storage.test.ts]], [[webllm.test.ts]]
