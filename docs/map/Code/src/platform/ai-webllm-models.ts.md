---
id: src/platform/ai-webllm-models.ts
type: module
file: src/platform/ai-webllm-models.ts
area: platform
---

# src/platform/ai-webllm-models.ts

*Module* · area [[platform]] · 51 lines

> The on-device models Socius offers (see ai-webllm.ts). Kept apart so that ai-storage.ts can name stored models without importing the engine code (and without an import cycle).

## Imported by
- [[ai-storage.ts]] · value
- [[ai-webllm.ts]] · re-export, value

## Implements provider
- [[Providers/webllm|webllm]]

## Types
WebLlmModelChoice (line 4)

## Symbols

### WEBLLM_MODELS
*const* · line 25 · exported
> Ids checked against prebuiltAppConfig in @mlc-ai/web-llm 0.2.85 (tests/platform/webllm.test.ts).
- Used in: [[WebLlmSetup.tsx]], [[ai-storage.ts]], [[ai-webllm.ts]], [[webllm.test.ts]]
