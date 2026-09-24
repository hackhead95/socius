---
id: "ai-error:timeout"
type: ai-error
area: platform
---

# timeout

*AI error code* · area [[platform]]

- **Has a user message:** yes

## Produced by
- [[ai-http.ts#classifyServiceError|classifyServiceError()]]
- [[ai-http.ts#httpSend|httpSend()]]

## Explained by
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]

## Checked by
- [[ai-diagnose.ts#checkGemini|checkGemini()]]
- [[ai-diagnose.ts#checkOpenAi|checkOpenAi()]]
