---
id: src/features/errorlog/install.ts
type: module
file: src/features/errorlog/install.ts
area: features/errorlog
---

# src/features/errorlog/install.ts

*Module* · area [[features - errorlog|features/errorlog]] · 215 lines

> Starts the error log for the running app (called once from main.tsx): - context for every entry: main tab, dataset size, AI provider and model (sizes and ids only); - the open project's names and labels, which the log removes from anything it stores; - uncaught errors and unhandled promise rejections; - resources that fail to load (scripts and stylesheets as warnings, images as info); - code fi...

## Imports
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[update.ts]] · value
- [[ai-http.ts]] · value
- [[platform/ai.ts]] · value
- [[claude.ts]] · value
- [[errorlog.ts]] · value

## Calls
- [[platform/ai.ts#effectiveProvider|effectiveProvider()]]
- [[platform/ai.ts#getAiSettings|getAiSettings()]]
- [[ai-http.ts#lastResolvedGeminiModel|lastResolvedGeminiModel()]]

## Uses
- [[claude.ts#AiUnavailableError|AiUnavailableError]]
- [[useStore]]

## Reads
- [[useStore/coding|useStore.coding]] · alias
- [[dataset|useStore.dataset]] · alias

## Tested by
- [[errorlog-install.test.tsx]] · import

## Imported by
- [[main.tsx]] · value
- [[errorlog-install.test.tsx]] · value

## Private helpers
MAX_TERMS (line 19) · datasetSize() (line 21) · aiModel() (line 26) · cache (line 74) · currentTerms() (line 76) · areaOf() (line 83) · installed (line 168)

## Symbols

### projectTerms
*function* · line 44 · exported
> Everything in the project that a user typed or a file brought in, as terms to keep out of the log.
- Uses: [[install.ts]]

### onChunkLoadError
*function* · line 92 · exported
> A code file of an older version could not be loaded: log it calmly and offer the reload.
- Calls: [[errorlog.ts#logWarn|logWarn()]], [[update.ts#showUpdateNotice|showUpdateNotice()]]

### describeResourceError
*function* · line 98 · exported
> What failed to load, for a capture-phase `error` event on an element (null when it is not a resource).
- Calls: [[errorlog.ts#redact|redact()]]
- Used in: [[errorlog-install.test.tsx]]

### reactRootErrorOptions
*const* · line 136 · exported
> Options for createRoot (main.tsx). Errors caught by Socius's own error boundaries are logged there (with the boundary's name), so onCaughtError logs only what other boundaries catch. The component stack is kept to component names.
- Calls: [[errorlog.ts#componentStackText|componentStackText()]], [[errorlog.ts#logError|logError()]], [[errorlog.ts#logWarn|logWarn()]], [[update.ts#isChunkLoadError|isChunkLoadError()]], [[update.ts#showUpdateNotice|showUpdateNotice()]]
- Used in: [[main.tsx]], [[errorlog-install.test.tsx]]

### installErrorLog
*function* · line 171 · exported
> Start the error log (idempotent).
- Calls: [[errorlog.ts#logError|logError()]], [[errorlog.ts#logInfo|logInfo()]], [[errorlog.ts#logWarn|logWarn()]], [[errorlog.ts#setLogContextProvider|setLogContextProvider()]], [[errorlog.ts#setSensitiveTermsProvider|setSensitiveTermsProvider()]], [[install.ts#describeResourceError|describeResourceError()]], [[install.ts#onChunkLoadError|onChunkLoadError()]], [[install.ts]], [[update.ts#isChunkLoadError|isChunkLoadError()]]
- Uses: [[install.ts]], [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[useStore/dialog|useStore.dialog]], [[useStore/tab|useStore.tab]]
- Used in: [[main.tsx]], [[errorlog-install.test.tsx]]
