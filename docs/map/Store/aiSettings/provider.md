---
id: "store-key:aiSettings.provider"
type: store-key
file: src/platform/ai.ts
line: 31
area: platform
---

# aiSettings.provider

*Store state key* · defined in [[platform/ai.ts]] (line 31) · area [[platform]]

> The provider the user chose; null means "not chosen" (Claude is used automatically when present).

- **Store:** aiSettings

## Read by
- [[ai-keys.test.ts]] · getter
- [[ai.test.ts]] · alias, getter

## Written by
- [[AiSettingsDialog|<AiSettingsDialog>]] · setter
- [[WebLlmSetup|<WebLlmSetup>]] · setter
- [[features.test.ts]] · setter
- [[ai-diagnose.test.ts]] · setter
- [[ai-keys.test.ts]] · setter
- [[ai.test.ts]] · setter
- [[webllm.test.ts]] · setter

## Store
- [[aiSettings|AI settings (localStorage socius.ai)]]
