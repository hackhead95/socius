---
id: src/features/errorlog/install.ts
type: module
file: src/features/errorlog/install.ts
area: features/errorlog
---

# src/features/errorlog/install.ts

*Module* · area [[features - errorlog|features/errorlog]] · 111 lines

> Starts the error log for the running app (called once from main.tsx): - context for every entry: main tab, dataset size, AI provider and model (sizes and ids only); - the open project's names and labels, which the log removes from anything it stores; - uncaught errors and unhandled promise rejections.

## Imports
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[core/types.ts]] · type-only
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

## Imported by
- [[main.tsx]] · value

## Private helpers
MAX_TERMS (line 13) · datasetSize() (line 15) · aiModel() (line 20) · cache (line 68) · currentTerms() (line 70) · areaOf() (line 77) · installed (line 85)

## Symbols

### projectTerms
*function* · line 38 · exported
> Everything in the project that a user typed or a file brought in, as terms to keep out of the log.
- Uses: [[install.ts]]

### installErrorLog
*function* · line 88 · exported
> Start the error log (idempotent).
- Calls: [[errorlog.ts#logError|logError()]], [[errorlog.ts#setLogContextProvider|setLogContextProvider()]], [[errorlog.ts#setSensitiveTermsProvider|setSensitiveTermsProvider()]], [[install.ts]]
- Uses: [[install.ts]], [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[useStore/dialog|useStore.dialog]], [[useStore/tab|useStore.tab]]
- Used in: [[main.tsx]]
