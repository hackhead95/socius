---
id: tests/coding/codebook.test.ts
type: test
file: tests/coding/codebook.test.ts
area: tests
---

# tests/coding/codebook.test.ts

*Test file* · area [[tests]] · 76 lines

## Test cases
- **code tree**
  - orders depth-first and computes paths and descendants
  - survives parent cycles
- **codebook import/export**
  - CSV round trip keeps hierarchy and rules
  - JSON round trip and merge updates only empty fields
  - rejects bad input clearly
- **AI prompt helpers**
  - batches stay under the byte budget
  - validates suggestions against ids and codebook names
  - parses codebook suggestions defensively

## Imports
- [[coding-types.ts]] · type-only
- [[coding/ai.ts]] · value
- [[codebookIO.ts]] · value
- [[tree.ts]] · value
- [[vitest]] · value

## Calls
- [[tree.ts#buildCodeTree|buildCodeTree()]]
- [[coding/ai.ts#buildSuggestBatches|buildSuggestBatches()]]
- [[coding/ai.ts#byteLength|byteLength()]]
- [[tree.ts#canReparent|canReparent()]]
- [[codebookIO.ts#codebookToCsv|codebookToCsv()]]
- [[codebookIO.ts#codebookToJson|codebookToJson()]]
- [[tree.ts#codePath|codePath()]]
- [[tree.ts#descendantIds|descendantIds()]]
- [[codebookIO.ts#mergeCodebook|mergeCodebook()]]
- [[tree.ts#orderedCodes|orderedCodes()]]
- [[codebookIO.ts#parseCodebookCsv|parseCodebookCsv()]]
- [[codebookIO.ts#parseCodebookJson|parseCodebookJson()]]
- [[coding/ai.ts#parseCodebookSuggestions|parseCodebookSuggestions()]]
- [[coding/ai.ts#parseCodeSuggestions|parseCodeSuggestions()]]

## Uses
- [[coding/ai.ts#PROMPT_BUDGET_BYTES|PROMPT_BUDGET_BYTES]]

## Tests
- [[coding-types.ts]] · import
- [[coding/ai.ts]] · import
- [[codebookIO.ts]] · import
- [[tree.ts]] · import

## Private helpers
codes (line 7)
