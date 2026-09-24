---
id: src/platform/webllm-stub.ts
type: module
file: src/platform/webllm-stub.ts
area: platform
---

# src/platform/webllm-stub.ts

*Module* · area [[platform]] · 16 lines

> Stand-in for @mlc-ai/web-llm in the single-file Claude artifact build (`vite build --mode artifact` aliases the package here), so the large on-device AI library is never inlined into socius.html. The artifact build does not offer the on-device option; these only exist to satisfy imports.

## Implements provider
- [[Providers/webllm|webllm]]

## Referenced by (build config)
- `vite.config.ts`

## Symbols

### MLCEngine
*class* · line 5 · exported
> Stand-in for @mlc-ai/web-llm in the single-file Claude artifact build (`vite build --mode artifact` aliases the package here), so the large on-device AI library is never inlined into socius.html. The artifact build does not offer the on-...

### hasModelInCache
*function* · line 11 · exported

### deleteModelAllInfoInCache
*function* · line 15 · exported
