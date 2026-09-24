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
| [[aiSettings/gemini\|gemini]] | 7 ([[features.test.ts]], [[ai-diagnose.test.ts]], [[ai.test.ts]], [[GeminiSection\|<GeminiSection>]], …) | 9 |
| [[aiSettings/openai\|openai]] | 6 ([[ai-diagnose.test.ts]], [[ai.test.ts]], [[AiSettingsDialog\|<AiSettingsDialog>]], [[OpenAiSection\|<OpenAiSection>]], …) | 11 |
| [[provider]] | 5 ([[features.test.ts]], [[ai-diagnose.test.ts]], [[ai.test.ts]], [[webllm.test.ts]], …) | 1 |
| [[aiSettings/webllm\|webllm]] | 1 ([[WebLlmSetup\|<WebLlmSetup>]]) | 3 |

## Actions
| action | writes | callers |
|---|---|---|

## State keys
- [[aiSettings/gemini|aiSettings.gemini]]
- [[aiSettings/openai|aiSettings.openai]]
- [[provider|aiSettings.provider]]
- [[aiSettings/webllm|aiSettings.webllm]]

## Used by
- [[platform/ai.ts#__reloadAiSettings|__reloadAiSettings()]] · whole-state
- [[ai-diagnose.ts#allKeys|allKeys()]] · whole-state
- [[ai-diagnose.ts#connectionReport|connectionReport()]] · whole-state
- [[platform/ai.ts#startAiStatus|startAiStatus()]] · whole-state
