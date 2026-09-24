---
id: tests/coding/ai-budget.test.ts
type: test
file: tests/coding/ai-budget.test.ts
area: tests
---

# tests/coding/ai-budget.test.ts

*Test file* · area [[tests]] · 30 lines

> Prompt builders respect a smaller prompt budget (on-device models and strict free tiers).

## Test cases
- **prompt budgets**
  - codebook prompt: default budget unchanged, smaller budget sends fewer excerpts
  - suggestion batches and summaries stay under the budget

## Imports
- [[coding-types.ts]] · type-only
- [[coding/ai.ts]] · value
- [[vitest]] · value

## Calls
- [[coding/ai.ts#buildCodebookPrompt|buildCodebookPrompt()]]
- [[coding/ai.ts#buildSuggestBatches|buildSuggestBatches()]]
- [[coding/ai.ts#buildSummaryPrompt|buildSummaryPrompt()]]
- [[coding/ai.ts#byteLength|byteLength()]]

## Uses
- [[coding/ai.ts#PROMPT_BUDGET_BYTES|PROMPT_BUDGET_BYTES]]

## Tests
- [[coding-types.ts]] · import
- [[coding/ai.ts]] · import

## Private helpers
code (line 6) · texts (line 7)
