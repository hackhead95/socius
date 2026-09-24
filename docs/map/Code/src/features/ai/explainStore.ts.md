---
id: src/features/ai/explainStore.ts
type: module
file: src/features/ai/explainStore.ts
area: features/ai
---

# src/features/ai/explainStore.ts

*Module* · area [[features - ai|features/ai]] · 100 lines

> State of the "Explain with AI" panels on Output items. Kept outside the viewer so a streaming answer survives switching tabs. Nothing is sent until run() is called from the panel's Explain button.

## Imports
- [[output.ts]] · type-only
- [[store.ts]] · value
- [[explainPrompt.ts]] · value
- [[ai-diagnose.ts]] · value
- [[platform/ai.ts]] · value
- [[zustand]] · value

## Tested by
- [[features.test.ts]] · import

## Imported by
- [[AiSettingsDialog.tsx]] · value
- [[ExplainPanel.tsx]] · value
- [[features.ts]] · value
- [[OutputViewer.tsx]] · value
- [[features.test.ts]] · value

## Types
ExplainPhase (line 10) · ExplainPanelState (line 12)

## Private helpers
controllers (line 35)

## Symbols

### useExplain
*store* · line 37 · exported · note: [[useExplain]]
- Calls: [[ai-diagnose.ts#aiErrorReport|aiErrorReport()]], [[explainPrompt.ts#buildExplainPrompt|buildExplainPrompt()]], [[explainPrompt.ts#plainText|plainText()]], [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]], [[platform/ai.ts#aiErrorText|aiErrorText()]], [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]], [[platform/ai.ts#askAI|askAI()]], [[platform/ai.ts#getAiStatus|getAiStatus()]]
- Uses: [[explainStore.ts]], [[useStore]]
- Reads: [[outputs|useStore.outputs]]
- Writes: [[outputs|useStore.outputs]]
- Output: [[text]]
- Used in: [[AiSettingsDialog.tsx]], [[ExplainPanel.tsx]], [[features.ts]], [[OutputViewer.tsx]], [[features.test.ts]]
