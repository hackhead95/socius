---
id: "ai-error:cancelled"
type: ai-error
area: platform
---

# cancelled

*AI error code* · area [[platform]]

- **Has a user message:** yes

## Produced by
- [[platform/ai.ts#askAIJson|askAIJson()]]
- [[ai-webllm.ts#askWebLlm|askWebLlm()]]
- [[ai-http.ts#cancelled|cancelled()]]
- [[ai-tools.ts#cancelled|cancelled()]]
- [[agent.ts#cancelledError|cancelledError()]]
- [[ai-timing.ts#defaultSleep|defaultSleep()]]
- [[ai-webllm.ts#ensureEngine|ensureEngine()]]
- [[ai-diagnose.ts#runConnectionCheck|runConnectionCheck()]]
- [[ai-local.ts#runLocalCheck|runLocalCheck()]]
- [[ai-local.ts#timedFetch|timedFetch()]]
- [[ai-webllm.ts#waitWithSignal|waitWithSignal()]]
- [[platform/ai.ts#wrapError|wrapError()]]

## Explained by
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]

## Checked by
- [[AiSettingsDialog|<AiSettingsDialog>]]
- [[ConnectionChecklist|<ConnectionChecklist>]]
- [[WebLlmSetup|<WebLlmSetup>]]
- [[ai-timing.ts#AiTiming|AiTiming]]
- [[ai-http.ts#geminiRun|geminiRun()]]
- [[ai-diagnose.ts#isCancel|isCancel()]]
- [[platform/ai.ts#recordAiConnection|recordAiConnection()]]
- [[ai-diagnose.ts#runConnectionCheck|runConnectionCheck()]]
- [[ai-local.ts#runLocalCheck|runLocalCheck()]]
- [[controller.ts#sendMessage|sendMessage()]]
