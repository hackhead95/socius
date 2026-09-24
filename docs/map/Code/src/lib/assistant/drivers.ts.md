---
id: src/lib/assistant/drivers.ts
type: module
file: src/lib/assistant/drivers.ts
area: lib/assistant
---

# src/lib/assistant/drivers.ts

*Module* · area [[lib - assistant|lib/assistant]] · 98 lines

> Picks the right driver for the AI provider the user set up (AI > AI assistant settings).

## Imports
- [[agent.ts]] · type-only
- [[ai-http.ts]] · value
- [[ai-tools.ts]] · value
- [[platform/ai.ts]] · value

## Calls
- [[platform/ai.ts#askAI|askAI()]]

## Imported by
- [[controller.ts]] · value

## Private helpers
hasToolResults() (line 15) · textDriver() (line 43)

## Symbols

### GEMINI_FREE_PER_MINUTE
*const* · line 12 · exported
> Gemini is not paced here any more: Google's free per-minute limits differ by model (Flash about 5, Flash-Lite about 15) and change, so the platform learns each model's real limit from its 429 replies and spaces requests to fit (src/platf...

### geminiTurn
*function* · line 28
> One assistant turn with Gemini. Tool steps use Flash-Lite (fast, minimal thinking, many free requests). When the user chose Flash, the turn after the tools ran (usually the answer) uses Flash if its per-minute limit has room; if Flash ca...
- Calls: [[ai-http.ts#geminiFlashHasRoom|geminiFlashHasRoom()]], [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiPreference|geminiPreference()]], [[ai-tools.ts#askGeminiTools|askGeminiTools()]], [[drivers.ts]], [[platform/ai.ts#getAiSettings|getAiSettings()]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]]

### createDriver
*function* · line 56 · exported
> The driver for the current provider, or null when AI is not set up.
- Calls: [[ai-tools.ts#askClaudeTools|askClaudeTools()]], [[ai-tools.ts#askOpenAiTools|askOpenAiTools()]], [[ai-tools.ts#claudeToolsAvailable|claudeToolsAvailable()]], [[drivers.ts]], [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#getAiSettings|getAiSettings()]]
- Uses: [[drivers.ts#geminiTurn|geminiTurn()]]
- Reads: [[aiSettings/openai|aiSettings.openai]]
- Used in: [[controller.ts]]

### currentProviderLabel
*function* · line 95 · exported
- Calls: [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#providerLabel|providerLabel()]]
