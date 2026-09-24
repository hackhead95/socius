---
id: src/features/assistant/controller.ts
type: module
file: src/features/assistant/controller.ts
area: features/assistant
---

# src/features/assistant/controller.ts

*Module* · area [[features - assistant|features/assistant]] · 154 lines

> What the panel's buttons do: send a message through the agent, stop, retry, apply what the assistant proposed. Reads the live app store at the moment each tool runs.

## Imports
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[chat-store.ts]] · value
- [[assistant/actions.ts]] · value
- [[agent.ts]] · value
- [[drivers.ts]] · value
- [[prompt.ts]] · value
- [[tools/index.ts]] · value
- [[assistant/types.ts]] · type-only
- [[ai-diagnose.ts]] · value
- [[platform/ai.ts]] · value
- [[errorlog.ts]] · value
- [[host.ts]] · value

## Tested by
- [[scenarios.test.ts]] · import
- [[ai-latency.test.ts]] · import

## Imported by
- [[AssistantPanel.tsx]] · value
- [[AssistantRoot.tsx]] · value
- [[scenarios.test.ts]] · value
- [[ai-latency.test.ts]] · dynamic

## Types
SendOptions (line 30)

## Private helpers
upsertStep() (line 22)

## Symbols

### appSnapshot
*function* · line 17 · exported
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[outputs|useStore.outputs]], [[useStore/coding|useStore.coding]], [[useStore/tab|useStore.tab]]
- Used in: [[AssistantPanel.tsx]]

### sendMessage
*function* · line 36 · exported
> Send a message. Resolves when the answer is complete, stopped or failed (never rejects).
- Calls: [[agent.ts#runAgent|runAgent()]], [[ai-diagnose.ts#aiErrorReport|aiErrorReport()]], [[controller.ts#appSnapshot|appSnapshot()]], [[controller.ts]], [[core/types.ts#newId|newId()]], [[drivers.ts#createDriver|createDriver()]], [[errorlog.ts#logError|logError()]], [[errorlog.ts#logWarn|logWarn()]], [[platform/ai.ts#aiErrorIsAppFault|aiErrorIsAppFault()]], [[platform/ai.ts#aiErrorText|aiErrorText()]], [[platform/ai.ts#effectiveProvider|effectiveProvider()]], [[platform/ai.ts#providerLabel|providerLabel()]], [[platform/ai.ts#recordAiConnection|recordAiConnection()]], [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]], [[prompt.ts#compactSystemPrompt|compactSystemPrompt()]], [[prompt.ts#systemPrompt|systemPrompt()]], [[tools/index.ts#allTools|allTools()]], [[tools/index.ts#compactTools|compactTools()]]
- Uses: [[controller.ts#appSnapshot|appSnapshot()]], [[useAssistantChat]], [[useStore]]
- Reads: [[controller|useAssistantChat.controller]], [[datasetId|useAssistantChat.datasetId]], [[dataset|useStore.dataset]], [[entries|useAssistantChat.entries]], [[outputs|useStore.outputs]], [[permissions|useAssistantChat.permissions]], [[running|useAssistantChat.running]], [[useAssistantChat/focusOutputId|useAssistantChat.focusOutputId]], [[useAssistantChat/history|useAssistantChat.history]]
- Writes: [[controller|useAssistantChat.controller]], [[datasetId|useAssistantChat.datasetId]], [[draft|useAssistantChat.draft]], [[entries|useAssistantChat.entries]], [[running|useAssistantChat.running]], [[useAssistantChat/focusOutputId|useAssistantChat.focusOutputId]], [[useAssistantChat/history|useAssistantChat.history]]
- Store actions: [[patchEntry()|useAssistantChat.patchEntry()]]
- Used in: [[AssistantPanel.tsx]], [[AssistantRoot.tsx]], [[scenarios.test.ts]]

### stopAssistant
*function* · line 108 · exported
- Uses: [[useAssistantChat]]
- Reads: [[controller|useAssistantChat.controller]]
- Used in: [[AssistantPanel.tsx]], [[scenarios.test.ts]]

### retryLast
*function* · line 113 · exported
> Ask the last question again (after an error or Stop).
- Calls: [[controller.ts#sendMessage|sendMessage()]]
- Uses: [[useAssistantChat]]
- Reads: [[entries|useAssistantChat.entries]], [[running|useAssistantChat.running]]
- Writes: [[entries|useAssistantChat.entries]]
- Used in: [[AssistantPanel.tsx]], [[scenarios.test.ts]]

### runArtifact
*function* · line 124 · exported
> Run an artifact's button: add an analysis to Output, apply a data change, open a dialog.
- Calls: [[assistant/actions.ts#addToOutput|addToOutput()]], [[assistant/actions.ts#applyProposal|applyProposal()]]
- Uses: [[useAssistantChat]], [[useStore]]
- Reads: [[entries|useAssistantChat.entries]]
- Store actions: [[patchEntry()|useAssistantChat.patchEntry()]], [[toast()|useStore.toast()]]
- Used in: [[AssistantPanel.tsx]], [[scenarios.test.ts]]

### dismissArtifact
*function* · line 141 · exported
- Uses: [[useAssistantChat]]
- Store actions: [[patchEntry()|useAssistantChat.patchEntry()]]
- Used in: [[AssistantPanel.tsx]]

### copyAnswer
*function* · line 145 · exported
- Calls: [[host.ts#copyToClipboard|copyToClipboard()]]
- Used in: [[AssistantPanel.tsx]]

### aiReady
*function* · line 150 · exported
> Is an AI provider set up (no request is made)?
- Calls: [[platform/ai.ts#getAiStatus|getAiStatus()]]
