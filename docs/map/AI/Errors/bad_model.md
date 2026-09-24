---
id: "ai-error:bad_model"
type: ai-error
area: platform
---

# bad_model

*AI error code* · area [[platform]]

- **Has a user message:** yes

## Produced by
- [[ai-http.ts#classifyServiceError|classifyServiceError()]]
- [[ai-http.ts#summarise|summarise()]]

## Explained by
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]

## Checked by
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[ai-http.ts#apiLevel|apiLevel()]]
- [[ai-diagnose.ts#checkGemini|checkGemini()]]
- [[ai-diagnose.ts#checkOpenAi|checkOpenAi()]]
- [[ai-http.ts#modelLevel|modelLevel()]]
- [[ai-local.ts#runLocalCheck|runLocalCheck()]]
