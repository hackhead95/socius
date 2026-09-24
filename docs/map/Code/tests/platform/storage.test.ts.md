---
id: tests/platform/storage.test.ts
type: test
file: tests/platform/storage.test.ts
area: tests
---

# tests/platform/storage.test.ts

*Test file* · area [[tests]] · 279 lines

> Browser storage: what the on-device models take (web-llm's Cache Storage, mocked), deleting them, the space check before a download (no download that would fill the quota; a partial download removed when storage runs out), and autosave when IndexedDB reports QuotaExceededError (paused, logged once, retried with growing gaps and at once when space is freed, resumed by the first save that works).

## Test cases
- **downloaded models in Cache Storage**
  - lists each model with its size and whether it is complete, including its program file
  - deletes one model (weights, tokenizer, settings and its program) and leaves the other
  - reads the model id from a file address
  - no Cache Storage (older browsers, the Artifact viewer): empty, no errors
- **space check before downloading**
  - refuses when the download (plus 10% and a margin) does not fit, counting parts already stored
  - the on-device model is not downloaded when it would not fit; a download stopped by a full quota is removed
- **autosave when browser storage is full**
  - pauses (one log entry), does not write every 1.5 s, retries with growing gaps and resumes by itself
  - a retry that works resumes autosave without any action

## Imports
- [[persistence.ts]] · dynamic
- [[ai-storage.ts]] · dynamic, value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value
- [[errorlog.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[platform/ai.ts#__reloadAiSettings|__reloadAiSettings()]]
- [[errorlog.ts#__resetErrorLogForTests|__resetErrorLogForTests()]]
- [[ai-webllm.ts#__setWebLlmLoader|__setWebLlmLoader()]]
- [[ai-storage.ts#checkSpaceFor|checkSpaceFor()]]
- [[ai-storage.ts#deleteAllStoredModels|deleteAllStoredModels()]]
- [[ai-storage.ts#deleteStoredModel|deleteStoredModel()]]
- [[ai-storage.ts#estimateStorage|estimateStorage()]]
- [[ai-storage.ts#formatBytes|formatBytes()]]
- [[errorlog.ts#getLog|getLog()]]
- [[ai-storage.ts#listWebLlmStorage|listWebLlmStorage()]]
- [[platform/helpers.ts#memoryStorage|memoryStorage()]]
- [[ai-storage.ts#modelIdFromUrl|modelIdFromUrl()]]
- [[ai-storage.ts#notifyStorageFreed|notifyStorageFreed()]]
- [[ai-webllm.ts#prepareWebLlm|prepareWebLlm()]]

## Uses
- [[ai-storage.ts#SAFETY_MARGIN_BYTES|SAFETY_MARGIN_BYTES]]

## Tests
- [[persistence.ts]] · import
- [[ai-storage.ts]] · import
- [[ai-webllm.ts]] · import
- [[platform/ai.ts]] · import
- [[errorlog.ts]] · import

## Private helpers
QWEN (line 14) · LLAMA (line 15) · HF() (line 16) · WASM (line 17) · MockCache (line 21) · mockCaches() (line 38) · bytes() (line 54) · fillModel() (line 56) · stubEstimate() (line 68) · mockIndexedDb() (line 177)
