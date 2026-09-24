---
id: src/lib/coding/ai.ts
type: module
file: src/lib/coding/ai.ts
area: lib/coding
---

# src/lib/coding/ai.ts

*Module* · area [[lib - coding|lib/coding]] · 176 lines

> Prompt builders and response validators for AI-assisted coding. No network calls here: the feature layer sends prompts through platform/ai (askAI / askAIJson) on user action.

## Imports
- [[coding-types.ts]] · type-only

## Tested by
- [[ai-budget.test.ts]] · import
- [[codebook.test.ts]] · import

## Imported by
- [[AiDialogs.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[ai-budget.test.ts]] · value
- [[codebook.test.ts]] · value

## Types
CodebookSuggestion (line 19) · SuggestItem (line 86)

## Private helpers
enc (line 11) · clip() (line 14) · codebookBlock() (line 91)

## Symbols

### PROMPT_BUDGET_BYTES
*const* · line 10 · exported
> Default prompt size: well under the 64 KB limit of the Claude sample capability. Smaller models (on-device, free tiers) pass a smaller `budgetBytes`; fewer excerpts are then included.
- Used in: [[ai-budget.test.ts]], [[codebook.test.ts]]

### byteLength
*function* · line 12 · exported
- Uses: [[coding/ai.ts]]
- Used in: [[ai-budget.test.ts]], [[codebook.test.ts]]

### spreadSample
*function* · line 29 · exported
> Evenly spaced sample of up to `n` items (deterministic, keeps variety across the list).
- Used in: [[RetrievalView.tsx]], [[AiDialogs.tsx]]

### buildCodebookPrompt
*function* · line 37 · exported
- Calls: [[coding/ai.ts#byteLength|byteLength()]], [[coding/ai.ts]]
- Uses: [[coding/ai.ts#PROMPT_BUDGET_BYTES|PROMPT_BUDGET_BYTES]]
- Used in: [[AiDialogs.tsx]], [[ai-budget.test.ts]]

### parseCodebookSuggestions
*function* · line 63 · exported
- Used in: [[AiDialogs.tsx]], [[codebook.test.ts]]

### buildSuggestBatches
*function* · line 101 · exported
> Split responses into prompts that each stay under the budget. Each response text is clipped to `maxChars` characters. Returns one prompt per batch with the ids it contains.
- Calls: [[coding/ai.ts#byteLength|byteLength()]], [[coding/ai.ts]]
- Uses: [[coding/ai.ts#PROMPT_BUDGET_BYTES|PROMPT_BUDGET_BYTES]]
- Used in: [[AiDialogs.tsx]], [[ai-budget.test.ts]], [[codebook.test.ts]]

### parseCodeSuggestions
*function* · line 136 · exported
> Validate a suggestion reply: only known ids, only codebook names (case-insensitive). Returns id -> code ids.
- Used in: [[AiDialogs.tsx]], [[codebook.test.ts]]

### buildSummaryPrompt
*function* · line 153 · exported
- Calls: [[coding/ai.ts#byteLength|byteLength()]], [[coding/ai.ts]]
- Uses: [[coding/ai.ts#PROMPT_BUDGET_BYTES|PROMPT_BUDGET_BYTES]]
- Used in: [[RetrievalView.tsx]], [[ai-budget.test.ts]]
