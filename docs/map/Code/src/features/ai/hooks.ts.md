---
id: src/features/ai/hooks.ts
type: module
file: src/features/ai/hooks.ts
area: features/ai
---

# src/features/ai/hooks.ts

*Module* · area [[features - ai|features/ai]] · 36 lines

> React bindings for the AI provider layer (src/platform/ai.ts) and the AI settings dialog.

## Imports
- [[react]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value
- [[zustand]] · value

## Tested by
- [[features.test.ts]] · import

## Imported by
- [[menus.ts]] · value
- [[AiBits.tsx]] · value
- [[AiFeatureDialogs.tsx]] · value
- [[AiSettingsDialog.tsx]] · value
- [[ExplainPanel.tsx]] · value
- [[features.ts]] · value
- [[WebLlmSetup.tsx]] · value
- [[AssistantPanel.tsx]] · value
- [[CodingDialog.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[AiDialogs.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[OutputViewer.tsx]] · value
- [[features.test.ts]] · value

## Symbols

### useAiStatus
*hook* · line 8 · exported · note: [[useAiStatus|useAiStatus()]]
> Current AI provider and whether it is ready. Re-renders when settings change.
- Calls: [[platform/ai.ts#startAiStatus|startAiStatus()]]
- Uses: [[platform/ai.ts#getAiStatus|getAiStatus()]], [[platform/ai.ts#subscribeAi|subscribeAi()]]
- Used in: [[AiBits.tsx]], [[AiFeatureDialogs.tsx]], [[AiSettingsDialog.tsx]], [[ExplainPanel.tsx]], [[WebLlmSetup.tsx]], [[AssistantPanel.tsx]], [[CodingDialog.tsx]], [[CodingWorkspace.tsx]], [[RetrievalView.tsx]], [[AiDialogs.tsx]]

### useWebLlmState
*hook* · line 14 · exported · note: [[useWebLlmState|useWebLlmState()]]
> On-device model download / load progress.
- Uses: [[ai-webllm.ts#getWebLlmState|getWebLlmState()]], [[ai-webllm.ts#subscribeWebLlm|subscribeWebLlm()]]
- Used in: [[AiBits.tsx]], [[WebLlmSetup.tsx]]

### useAiSettingsDialog
*store* · line 26 · exported · note: [[useAiSettingsDialog]]
> The AI assistant settings dialog, rendered once by the app shell above every other dialog.
- Used in: [[AiSettingsDialog.tsx]], [[features.test.ts]]

### openAiSettings
*function* · line 33 · exported
> Show the AI assistant settings dialog (AI > AI assistant settings). `intent` names the AI feature the user was trying to use (see features.ts), so the dialog can say what it will do once set up. Safe as an onClick handler (a click event ...
- Uses: [[useAiSettingsDialog]]
- Writes: [[intent|useAiSettingsDialog.intent]], [[useAiSettingsDialog/open|useAiSettingsDialog.open]]
- Used in: [[menus.ts]], [[AiBits.tsx]], [[AiFeatureDialogs.tsx]], [[ExplainPanel.tsx]], [[features.ts]], [[AssistantPanel.tsx]], [[CodingWorkspace.tsx]], [[OutputViewer.tsx]]
