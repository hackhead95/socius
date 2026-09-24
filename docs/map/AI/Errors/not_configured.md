---
id: "ai-error:not_configured"
type: ai-error
area: platform
---

# not_configured

*AI error code* · area [[platform]]

- **Has a user message:** yes

## Produced by
- [[ai-http.ts#askGemini|askGemini()]]
- [[ai-tools.ts#askGeminiTools|askGeminiTools()]]
- [[ai-http.ts#askOpenAiCompatible|askOpenAiCompatible()]]
- [[ai-tools.ts#askOpenAiTools|askOpenAiTools()]]
- [[platform/ai.ts#askProvider|askProvider()]]
- [[ai-http.ts#geminiRun|geminiRun()]]
- [[ai-http.ts#listGeminiModels|listGeminiModels()]]
- [[ai-diagnose.ts#runConnectionCheck|runConnectionCheck()]]
- [[controller.ts#sendMessage|sendMessage()]]

## Explained by
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]
