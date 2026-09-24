---
id: src/features/coding/dialogs/AiDialogs.tsx
type: module
file: src/features/coding/dialogs/AiDialogs.tsx
area: features/coding
---

# src/features/coding/dialogs/AiDialogs.tsx

*Module* · area [[features - coding|features/coding]] · 340 lines

> AI-assisted coding through the provider the user set up (src/platform/ai: Claude inside the artifact, a model on this computer, Gemini, or another service). Every request starts with a click, after the dialog has said what will be sent where; suggestion runs are sequential batches with progress and a Stop button.

## Imports
- [[react]] · value
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[AiBits.tsx]] · value
- [[ai/hooks.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[coding/ai.ts]] · value
- [[palette.ts]] · value
- [[text.ts]] · value
- [[platform/ai.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[CodingDialog.tsx]] · value

## Private helpers
toggle() (line 334)

## Symbols

### AiCodebookDialog
*component* · line 21 · exported · note: [[AiCodebookDialog|<AiCodebookDialog>]]
- Renders: [[AiLoadProgress|<AiLoadProgress>]], [[AiProviderNote|<AiProviderNote>]], [[Modal|<Modal>]]
- Calls: [[coding/actions.ts#replaceCodebook|replaceCodebook()]], [[coding/ai.ts#buildCodebookPrompt|buildCodebookPrompt()]], [[coding/ai.ts#parseCodebookSuggestions|parseCodebookSuggestions()]], [[coding/ai.ts#spreadSample|spreadSample()]], [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#toast|toast()]], [[core/types.ts#newId|newId()]], [[palette.ts#nextCodeColor|nextCodeColor()]], [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]], [[platform/ai.ts#aiErrorText|aiErrorText()]], [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]], [[platform/ai.ts#askAIJson|askAIJson()]], [[text.ts#splitParagraphs|splitParagraphs()]], [[useAiStatus|useAiStatus()]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Rendered by: [[CodingDialog|<CodingDialog>]]

### AiSuggestDialog
*component* · line 165 · exported · note: [[AiSuggestDialog|<AiSuggestDialog>]]
- Renders: [[AiLoadProgress|<AiLoadProgress>]], [[AiProviderNote|<AiProviderNote>]], [[CodeChip|<CodeChip>]], [[Modal|<Modal>]]
- Calls: [[AiDialogs.tsx]], [[coding/actions.ts#addSegmentsBulk|addSegmentsBulk()]], [[coding/ai.ts#buildSuggestBatches|buildSuggestBatches()]], [[coding/ai.ts#parseCodeSuggestions|parseCodeSuggestions()]], [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#toast|toast()]], [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]], [[platform/ai.ts#aiErrorText|aiErrorText()]], [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]], [[platform/ai.ts#askAIJson|askAIJson()]], [[useAiStatus|useAiStatus()]], [[useCodeMap|useCodeMap()]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Rendered by: [[CodingDialog|<CodingDialog>]]
