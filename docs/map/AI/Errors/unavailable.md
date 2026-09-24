---
id: "ai-error:unavailable"
type: ai-error
area: platform
---

# unavailable

*AI error code* · area [[platform]]

## Produced by
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[claude.ts#askClaude|askClaude()]]
- [[claude.ts#askClaudeJson|askClaudeJson()]]
- [[ai-tools.ts#askClaudeTools|askClaudeTools()]]
- [[ai-webllm.ts#askWebLlm|askWebLlm()]]
- [[ai-http.ts#classifyServiceError|classifyServiceError()]]
- [[ai-webllm.ts#defaultLoader|defaultLoader()]]
- [[ai-webllm.ts#ensureEngine|ensureEngine()]]
- [[ai-diagnose.ts#errorOf|errorOf()]]
- [[ai-tools.ts#readJson|readJson()]]
- [[ai-http.ts#readJsonBody|readJsonBody()]]
- [[ai-diagnose.ts#runConnectionCheck|runConnectionCheck()]]
- [[ai-http.ts#streamOpenAi|streamOpenAi()]]
- [[platform/ai.ts#wrapError|wrapError()]]

## Checked by
- [[platform/ai.ts#aiErrorIsAppFault|aiErrorIsAppFault()]]
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[ai-http.ts#askOpenAiCompatible|askOpenAiCompatible()]]
- [[drivers.ts#geminiTurn|geminiTurn()]]
- [[ai-tools.ts#isToolsUnsupported|isToolsUnsupported()]]
- [[ai-http.ts#modelLevel|modelLevel()]]
- [[ai-http.ts#sendGemini|sendGemini()]]
