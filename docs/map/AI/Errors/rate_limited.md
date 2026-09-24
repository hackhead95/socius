---
id: "ai-error:rate_limited"
type: ai-error
area: platform
---

# rate_limited

*AI error code* · area [[platform]]

- **Has a user message:** yes

## Produced by
- [[ai-http.ts#classifyServiceError|classifyServiceError()]]
- [[agent.ts#Runner|Runner]]
- [[ai-http.ts#summarise|summarise()]]

## Explained by
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]

## Checked by
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[ai-diagnose.ts#checkGemini|checkGemini()]]
- [[ai-http.ts#errorFromService|errorFromService()]]
- [[ai-http.ts#modelLevel|modelLevel()]]
- [[agent.ts#Runner|Runner]]
- [[ai-http.ts#summarise|summarise()]]
