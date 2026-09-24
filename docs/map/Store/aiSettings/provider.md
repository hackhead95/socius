---
id: "store-key:aiSettings.provider"
type: store-key
file: src/platform/ai.ts
line: 26
area: platform
---

# aiSettings.provider

*Store state key* · defined in [[platform/ai.ts]] (line 26) · area [[platform]]

> The provider the user chose; null means "not chosen" (Claude is used automatically when present).

- **Store:** aiSettings

## Read by
- [[ai.test.ts]] · alias, getter

## Written by
- [[AiSettingsDialog|<AiSettingsDialog>]] · setter
- [[features.test.ts]] · setter
- [[ai-diagnose.test.ts]] · setter
- [[ai.test.ts]] · setter
- [[webllm.test.ts]] · setter

## Store
- [[aiSettings|AI settings (localStorage socius.ai)]]
