---
id: "ai-error:network"
type: ai-error
area: platform
---

# network

*AI error code* · area [[platform]]

- **Has a user message:** yes

## Produced by
- [[ai-http.ts#networkError|networkError()]]
- [[ai-http.ts#readJsonEvents|readJsonEvents()]]
- [[ai-tools.ts#readJsonEvents|readJsonEvents()]]
- [[ai-tools.ts#sendRequest|sendRequest()]]

## Explained by
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]

## Checked by
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[platform/ai.ts#askAI|askAI()]]
- [[ai-diagnose.ts#checkGemini|checkGemini()]]
- [[ai-diagnose.ts#checkOpenAi|checkOpenAi()]]
