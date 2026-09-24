---
id: "settings:aiSettings"
type: store
file: src/platform/ai.ts
area: platform
---

# AI settings (localStorage socius.ai)

*Store* · defined in [[platform/ai.ts]] · area [[platform]]

## Keys and who touches them
| key | written by | read by |
|---|---|---|
| [[aiSettings/gemini\|gemini]] | 8 ([[features.test.ts]], [[ai-diagnose.test.ts]], [[ai-keys.test.ts]], [[ai.test.ts]], …) | 10 |
| [[notice]] | 2 ([[GeminiSection\|<GeminiSection>]], [[platform/ai.ts#dismissAiNotice\|dismissAiNotice()]]) | 2 |
| [[aiSettings/openai\|openai]] | 7 ([[ai-diagnose.test.ts]], [[ai.test.ts]], [[AiSettingsDialog\|<AiSettingsDialog>]], [[OpenAiSection\|<OpenAiSection>]], …) | 12 |
| [[provider]] | 7 ([[features.test.ts]], [[ai-diagnose.test.ts]], [[ai-keys.test.ts]], [[ai.test.ts]], …) | 2 |
| [[remember]] | 3 ([[ai-keys.test.ts]], [[ai.test.ts]], [[platform/ai.ts#setRememberKey\|setRememberKey()]]) | 4 |
| [[aiSettings/webllm\|webllm]] | 1 ([[WebLlmSetup\|<WebLlmSetup>]]) | 3 |

## Actions
| action | writes | callers |
|---|---|---|

## State keys
- [[aiSettings/gemini|aiSettings.gemini]]
- [[notice|aiSettings.notice]]
- [[aiSettings/openai|aiSettings.openai]]
- [[provider|aiSettings.provider]]
- [[remember|aiSettings.remember]]
- [[aiSettings/webllm|aiSettings.webllm]]

## Used by
- [[platform/ai.ts#__reloadAiSettings|__reloadAiSettings()]] · whole-state
- [[ai-diagnose.ts#allKeys|allKeys()]] · whole-state
- [[ai-diagnose.ts#connectionReport|connectionReport()]] · whole-state
- [[platform/ai.ts#startAiStatus|startAiStatus()]] · whole-state
