---
id: src/platform/ai-webllm.ts
type: module
file: src/platform/ai-webllm.ts
area: platform
---

# src/platform/ai-webllm.ts

*Module* · area [[platform]] · 432 lines

> On-device AI with WebLLM (@mlc-ai/web-llm): a small language model runs on this computer's graphics chip through WebGPU. Nothing leaves the computer. The first use downloads the model weights, which the browser then keeps in its cache. The package is large (several MB), so it is only ever loaded with a dynamic import, on first use. In the single-file Claude artifact build it is left out entirel...

## Imports
- [[@mlc-ai-web-llm|@mlc-ai/web-llm]] · dynamic, type-only
- [[claude.ts]] · value

## Tested by
- [[features.test.ts]] · import
- [[ai-diagnose.test.ts]] · import
- [[ai.test.ts]] · import
- [[webllm.test.ts]] · import

## Imported by
- [[AiBits.tsx]] · value
- [[AiSettingsDialog.tsx]] · value
- [[ai/hooks.ts]] · value
- [[WebLlmSetup.tsx]] · value
- [[platform/ai.ts]] · value
- [[features.test.ts]] · value
- [[ai-diagnose.test.ts]] · value
- [[ai.test.ts]] · value
- [[webllm.test.ts]] · value

## Implements provider
- [[Providers/webllm|webllm]]

## Types
WebLlmModelChoice (line 12) · WebGpuStatus (line 91) · WebLlmState (line 198) · WebLlmAskOptions (line 333)

## Private helpers
loader (line 70) · modPromise (line 71) · loadModule() (line 73) · MIN_LIMITS (line 84) · gpuPromise (line 114) · disableF16() (line 191) · state (line 207) · listeners (line 208) · setState() (line 219) · engine (line 242) · loadedModel (line 243) · loading (line 244) · isAbortError() (line 246)

## Symbols

### WEBLLM_MODELS
*const* · line 28 · exported
> Ids checked against prebuiltAppConfig in @mlc-ai/web-llm 0.2.85 (tests/platform/webllm.test.ts).
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### DEFAULT_WEBLLM_MODEL
*const* · line 49 · exported
- Uses: [[ai-webllm.ts#WEBLLM_MODELS|WEBLLM_MODELS]]
- Used in: [[platform/ai.ts]]

### WEBLLM_PROMPT_BUDGET_BYTES
*const* · line 51 · exported
> Both models have a 4,096-token context window: keep prompts small and leave room for the reply.
- Used in: [[platform/ai.ts]], [[ai.test.ts]]

### WEBLLM_MAX_TOKENS
*const* · line 52 · exported
- Used in: [[platform/ai.ts]]

### WEBLLM_IN_BUILD
*const* · line 55 · exported
> False in the Claude artifact build, where the on-device option is not offered.
- Used in: [[AiSettingsDialog.tsx]], [[platform/ai.ts]]

### webLlmChoice
*function* · line 57 · exported
- Uses: [[ai-webllm.ts#WEBLLM_MODELS|WEBLLM_MODELS]]
- Used in: [[AiBits.tsx]], [[platform/ai.ts]]

### defaultLoader
*function* · line 65
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### detectWebGpu
*function* · line 116 · exported
- Uses: [[ai-webllm.ts#WEBLLM_IN_BUILD|WEBLLM_IN_BUILD]], [[ai-webllm.ts]]
- Used in: [[WebLlmSetup.tsx]], [[platform/ai.ts]], [[webllm.test.ts]]

### storageFreeMB
*function* · line 153 · exported
> Free space the browser will give this site, in MB (quota minus usage), or null when it does not say. A private window often has a tiny quota.
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### requestPersistentStorage
*function* · line 164 · exported
> Ask the browser to keep the downloaded model when disk space runs low (best effort, never throws).
- Used in: [[WebLlmSetup.tsx]]

### deviceMemoryGB
*function* · line 173 · exported
> Memory this computer reports (Chrome and Edge only, rounded, at most 8 or so), or null.
- Used in: [[WebLlmSetup.tsx]]

### suggestSmallerModel
*function* · line 179 · exported
> Suggest the smaller model when this computer reports little memory.
- Calls: [[ai-webllm.ts#deviceMemoryGB|deviceMemoryGB()]], [[ai-webllm.ts#webLlmChoice|webLlmChoice()]]
- Uses: [[ai-webllm.ts#WEBLLM_MODELS|WEBLLM_MODELS]]
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### resolveModelId
*function* · line 184 · exported
> The model id to load on this computer for a chosen model.
- Calls: [[ai-webllm.ts#detectWebGpu|detectWebGpu()]], [[ai-webllm.ts#webLlmChoice|webLlmChoice()]]
- Used in: [[webllm.test.ts]]

### getWebLlmState
*function* · line 210 · exported
- Uses: [[ai-webllm.ts]]
- Used in: [[ai/hooks.ts]], [[webllm.test.ts]]

### subscribeWebLlm
*function* · line 214 · exported
- Uses: [[ai-webllm.ts]]
- Used in: [[ai/hooks.ts]], [[webllm.test.ts]]

### describeWebLlmProgress
*function* · line 225 · exported
> What the progress bar is doing, in plain words (the package reports downloading, then preparing the graphics chip).
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### loadErrorCode
*function* · line 254 · exported
> Stable error code for a failed model load. The package's own messages are technical; these codes map to plain-language messages in aiErrorMessage (src/platform/ai.ts).
- Used in: [[webllm.test.ts]]

### ensureEngine
*function* · line 267 · exported
> Load (downloading on first use) the model. Aborting the signal cancels the download.
- Calls: [[ai-webllm.ts#detectWebGpu|detectWebGpu()]], [[ai-webllm.ts#loadErrorCode|loadErrorCode()]], [[ai-webllm.ts#waitWithSignal|waitWithSignal()]], [[ai-webllm.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[ai-webllm.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]

### waitWithSignal
*function* · line 323
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### askWebLlm
*function* · line 341 · exported
> Ask the on-device model. Always streams internally so Stop can interrupt generation.
- Calls: [[ai-webllm.ts#loadChoice|loadChoice()]], [[ai-webllm.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[ai-webllm.ts#WEBLLM_MAX_TOKENS|WEBLLM_MAX_TOKENS]], [[ai-webllm.ts]]
- Used in: [[platform/ai.ts]], [[webllm.test.ts]]

### prepareWebLlm
*function* · line 380 · exported
> Download (or load from the browser cache) without asking anything.
- Calls: [[ai-webllm.ts#loadChoice|loadChoice()]]
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### loadChoice
*function* · line 388
> Load the right files for a chosen model. The GPU check says whether 16-bit shaders exist; if the engine finds out otherwise while loading, switch to the 32-bit files once and try again.
- Calls: [[ai-webllm.ts#ensureEngine|ensureEngine()]], [[ai-webllm.ts#resolveModelId|resolveModelId()]], [[ai-webllm.ts]]

### isWebLlmCached
*function* · line 399 · exported
> Is the model already in the browser cache? (No download.)
- Calls: [[ai-webllm.ts#detectWebGpu|detectWebGpu()]], [[ai-webllm.ts#resolveModelId|resolveModelId()]], [[ai-webllm.ts]]
- Used in: [[platform/ai.ts]], [[webllm.test.ts]]

### deleteWebLlmModel
*function* · line 411 · exported
> Remove the model files from the browser cache to free disk space.
- Calls: [[ai-webllm.ts#resolveModelId|resolveModelId()]], [[ai-webllm.ts]]
- Uses: [[ai-webllm.ts]]
- Used in: [[WebLlmSetup.tsx]], [[webllm.test.ts]]

### __setWebLlmLoader
*function* · line 423 · exported
> Test hook: replace the package loader (and forget the engine, GPU check and state).
- Uses: [[ai-webllm.ts#defaultLoader|defaultLoader()]], [[ai-webllm.ts]]
- Used in: [[features.test.ts]], [[ai-diagnose.test.ts]], [[ai.test.ts]], [[webllm.test.ts]]
