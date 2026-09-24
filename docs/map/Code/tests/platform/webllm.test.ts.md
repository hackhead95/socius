---
id: tests/platform/webllm.test.ts
type: test
file: tests/platform/webllm.test.ts
area: tests
---

# tests/platform/webllm.test.ts

*Test file* · area [[tests]] · 256 lines

> On-device adapter with a mocked WebLLM engine. (WebGPU and the model download cannot run in the headless test browser or in node, so the real engine is not exercised here.)

## Test cases
- **model list**
  - uses model ids that exist in the installed @mlc-ai/web-llm prebuilt config
- **WebGPU detection**
  - reports a missing API, a missing adapter, and 16-bit float support
  - explains the exact state: insecure page, too-limited chip, software-only adapter, failing request
  - reads the storage the browser will give this site
  - suggests the smaller model on computers that report little memory
  - without WebGPU, asking fails with webgpu_unavailable and the package is never loaded
- **engine**
  - loads once with progress, streams replies, and reuses the loaded model
  - cancelling a download unloads the engine and rejects cancelled
  - a failed download is model_download_failed
  - maps the package's load errors to clear messages
  - retries with the 32-bit model files when 16-bit shaders turn out to be missing
  - describes download progress in plain words
  - stopping generation interrupts the engine
  - cache check and delete use the package helpers
  - works through the provider layer: status and tolerant JSON

## Imports
- [[node-fs|node:fs]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[platform/ai.ts#__reloadAiSettings|__reloadAiSettings()]]
- [[ai-webllm.ts#__setWebLlmLoader|__setWebLlmLoader()]]
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[platform/ai.ts#askAIJson|askAIJson()]]
- [[ai-webllm.ts#askWebLlm|askWebLlm()]]
- [[ai-webllm.ts#deleteWebLlmModel|deleteWebLlmModel()]]
- [[ai-webllm.ts#describeWebLlmProgress|describeWebLlmProgress()]]
- [[ai-webllm.ts#detectWebGpu|detectWebGpu()]]
- [[ai-webllm.ts#getWebLlmState|getWebLlmState()]]
- [[ai-webllm.ts#isWebLlmCached|isWebLlmCached()]]
- [[ai-webllm.ts#loadErrorCode|loadErrorCode()]]
- [[platform/helpers.ts#memoryStorage|memoryStorage()]]
- [[ai-webllm.ts#prepareWebLlm|prepareWebLlm()]]
- [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]]
- [[ai-webllm.ts#resolveModelId|resolveModelId()]]
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- [[ai-webllm.ts#storageFreeMB|storageFreeMB()]]
- [[ai-webllm.ts#subscribeWebLlm|subscribeWebLlm()]]
- [[ai-webllm.ts#suggestSmallerModel|suggestSmallerModel()]]

## Uses
- [[ai-webllm-models.ts#WEBLLM_MODELS|WEBLLM_MODELS]]

## Writes
- [[provider|aiSettings.provider]] · setter

## Tests
- [[ai-webllm.ts]] · import
- [[platform/ai.ts]] · import

## Private helpers
F16 (line 12) · mockModule() (line 24)
