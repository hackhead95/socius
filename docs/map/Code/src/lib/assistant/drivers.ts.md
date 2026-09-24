---
id: src/lib/assistant/drivers.ts
type: module
file: src/lib/assistant/drivers.ts
area: lib/assistant
---

# src/lib/assistant/drivers.ts

*Module* · area [[lib - assistant|lib/assistant]] · 64 lines

> Picks the right driver for the AI provider the user set up (AI > AI assistant settings).

## Imports
- [[agent.ts]] · type-only
- [[ai-tools.ts]] · value
- [[platform/ai.ts]] · value

## Calls
- [[platform/ai.ts#askAI|askAI()]]

## Imported by
- [[controller.ts]] · value

## Private helpers
textDriver() (line 9)

## Symbols

### GEMINI_FREE_PER_MINUTE
*const* · line 7 · exported
> Free-tier pacing for Gemini: Google's free tier allows roughly 10 requests a minute for Flash models.

### createDriver
*function* · line 22 · exported
> The driver for the current provider, or null when AI is not set up.
- Calls: [[ai-tools.ts#askClaudeTools|askClaudeTools()]], [[ai-tools.ts#askGeminiTools|askGeminiTools()]], [[ai-tools.ts#askOpenAiTools|askOpenAiTools()]], [[ai-tools.ts#claudeToolsAvailable|claudeToolsAvailable()]], [[drivers.ts]], [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#getAiSettings|getAiSettings()]]
- Uses: [[drivers.ts#GEMINI_FREE_PER_MINUTE|GEMINI_FREE_PER_MINUTE]]
- Reads: [[aiSettings/gemini|aiSettings.gemini]], [[aiSettings/openai|aiSettings.openai]]
- Used in: [[controller.ts]]

### currentProviderLabel
*function* · line 61 · exported
- Calls: [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#providerLabel|providerLabel()]]
