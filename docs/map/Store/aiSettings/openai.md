---
id: "store-key:aiSettings.openai"
type: store-key
file: src/platform/ai.ts
line: 28
area: platform
---

# aiSettings.openai

*Store state key* · defined in [[platform/ai.ts]] (line 28) · area [[platform]]

- **Store:** aiSettings

## Read by
- [[AiSettingsDialog|<AiSettingsDialog>]] · getter
- [[LocalSetup|<LocalSetup>]] · getter
- [[OpenAiSection|<OpenAiSection>]] · alias
- [[ai-diagnose.ts#aiErrorReport|aiErrorReport()]] · alias
- [[ai-diagnose.ts#allKeys|allKeys()]] · alias
- [[ai-diagnose.ts#checkOpenAi|checkOpenAi()]] · alias
- [[drivers.ts#createDriver|createDriver()]] · getter
- [[platform/ai.ts#forgetAiKey|forgetAiKey()]] · alias, module state
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]] · alias, module state
- [[AiFeatureDialogs.tsx#shortProviderName|shortProviderName()]] · getter
- [[ai.test.ts]] · alias, getter

## Written by
- [[AiSettingsDialog|<AiSettingsDialog>]] · setter
- [[LocalSetup|<LocalSetup>]] · setter
- [[OpenAiSection|<OpenAiSection>]] · setter
- [[platform/ai.ts#forgetAiKey|forgetAiKey()]] · setter
- [[ai-diagnose.test.ts]] · setter
- [[ai.test.ts]] · setter

## Store
- [[aiSettings|AI settings (localStorage socius.ai)]]
