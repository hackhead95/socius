---
id: "ai-error:offline"
type: ai-error
area: platform
---

# offline

*AI error code* · area [[platform]]

- **Has a user message:** yes

## Produced by
- [[ai-diagnose.ts#internetStep|internetStep()]]
- [[ai-http.ts#networkError|networkError()]]

## Explained by
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]

## Checked by
- [[ai-diagnose.ts#checkGemini|checkGemini()]]
- [[ai-diagnose.ts#checkOpenAi|checkOpenAi()]]
