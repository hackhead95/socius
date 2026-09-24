---
id: src/platform/ai-storage.ts
type: module
file: src/platform/ai-storage.ts
area: platform
---

# src/platform/ai-storage.ts

*Module* · area [[platform]] · 296 lines

> Browser storage for Socius: how much this site uses and where (the on-device AI models, projects and autosave, the error log), deleting downloaded AI models, and checking free space before a download. Every GitHub Pages site on hackhead95.github.io shares one browser origin, and so one storage quota: "usage" includes other sites there. The on-device models are kept by @mlc-ai/web-llm 0.2.85 in ...

## Imports
- [[ai-webllm-models.ts]] · value

## Uses
- [[ai-webllm-models.ts#WEBLLM_MODELS|WEBLLM_MODELS]]

## Tested by
- [[storage.test.ts]] · import

## Imported by
- [[StorageManager.tsx]] · value
- [[WebLlmSetup.tsx]] · value
- [[persistence.ts]] · value
- [[ai-webllm.ts]] · value
- [[storage.test.ts]] · dynamic, value

## Implements provider
- [[Providers/webllm|webllm]]

## Types
StorageEstimate (line 19) · StoredModel (line 68) · WebLlmStorage (line 79) · SpaceCheck (line 276)

## Private helpers
OTHER_WEBLLM (line 17) · hasCaches() (line 88) · choiceFor() (line 103) · responseBytes() (line 107) · freedListeners (line 179)

## Symbols

### WEBLLM_CACHES
*const* · line 16 · exported

### estimateStorage
*function* · line 27 · exported
- Used in: [[StorageManager.tsx]], [[ai-webllm.ts]], [[storage.test.ts]]

### freeBytes
*function* · line 42 · exported
> Free space the browser will give this site, in bytes (quota minus usage), or null.
- Used in: [[StorageManager.tsx]], [[ai-webllm.ts]]

### storagePersisted
*function* · line 47 · exported
> Has the browser promised to keep this site's data when disk space runs low? null: cannot tell.
- Used in: [[StorageManager.tsx]]

### requestPersist
*function* · line 57 · exported
> Ask the browser to keep this site's data (best effort; some browsers ask the user).
- Used in: [[StorageManager.tsx]], [[ai-webllm.ts]]

### modelIdFromUrl
*function* · line 97 · exported
> The model id in a file address: https://huggingface.co/mlc-ai/<id>/resolve/main/...
- Used in: [[storage.test.ts]]

### listWebLlmStorage
*function* · line 119 · exported
> What the on-device AI has stored in this browser (Cache Storage), per model.
- Calls: [[ai-storage.ts#modelIdFromUrl|modelIdFromUrl()]], [[ai-storage.ts]]
- Uses: [[ai-storage.ts#WEBLLM_CACHES|WEBLLM_CACHES]], [[ai-storage.ts]]
- Used in: [[StorageManager.tsx]], [[WebLlmSetup.tsx]], [[storage.test.ts]]

### onStorageFreed
*function* · line 182 · exported
> Called after Socius freed browser storage (a model deleted), e.g. so autosave can try again at once.
- Uses: [[ai-storage.ts]]
- Used in: [[persistence.ts]]

### notifyStorageFreed
*function* · line 189 · exported
- Uses: [[ai-storage.ts]]
- Used in: [[storage.test.ts]]

### deleteStoredModel
*function* · line 200 · exported
> Delete one model's files (weights, tokenizer, settings, and its program) from every web-llm cache. Returns bytes freed (estimated).
- Calls: [[ai-storage.ts#modelIdFromUrl|modelIdFromUrl()]], [[ai-storage.ts#notifyStorageFreed|notifyStorageFreed()]], [[ai-storage.ts]]
- Uses: [[ai-storage.ts#WEBLLM_CACHES|WEBLLM_CACHES]]
- Used in: [[StorageManager.tsx]], [[ai-webllm.ts]], [[storage.test.ts]]

### deleteAllStoredModels
*function* · line 224 · exported
> Delete every downloaded on-device model (all web-llm caches and databases).
- Calls: [[ai-storage.ts#notifyStorageFreed|notifyStorageFreed()]], [[ai-storage.ts]]
- Uses: [[ai-storage.ts#WEBLLM_CACHES|WEBLLM_CACHES]], [[ai-storage.ts]]
- Used in: [[StorageManager.tsx]], [[storage.test.ts]]

### localStorageBytes
*function* · line 245 · exported
> Bytes Socius keeps in localStorage (settings, error log...), counted as UTF-16.
- Reads: [[-k|?k]]
- Used in: [[StorageManager.tsx]]

### formatBytes
*function* · line 263 · exported
> Human size: "1.6 GB", "420 MB", "12 KB".
- Used in: [[StorageManager.tsx]], [[WebLlmSetup.tsx]], [[ai-webllm.ts]], [[storage.test.ts]]

### SAFETY_MARGIN_BYTES
*const* · line 274 · exported
> Space kept free beyond the model itself, so autosave and other data still fit.
- Used in: [[storage.test.ts]]

### checkSpaceFor
*function* · line 286 · exported
> Is there room to download this model (its size, less parts already stored, plus 10% and a margin)?
- Calls: [[ai-storage.ts#estimateStorage|estimateStorage()]], [[ai-storage.ts#freeBytes|freeBytes()]], [[ai-storage.ts#listWebLlmStorage|listWebLlmStorage()]]
- Uses: [[ai-storage.ts#SAFETY_MARGIN_BYTES|SAFETY_MARGIN_BYTES]]
- Used in: [[WebLlmSetup.tsx]], [[ai-webllm.ts]], [[storage.test.ts]]
