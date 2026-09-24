---
id: tests/coding/actions.test.ts
type: test
file: tests/coding/actions.test.ts
area: tests
---

# tests/coding/actions.test.ts

*Test file* · area [[tests]] · 33 lines

## Test cases
- **coding undo history**
  - survives switching the active coder

## Imports
- [[coding-types.ts]] · value
- [[store.ts]] · value
- [[coding/actions.ts]] · value
- [[uiStore.ts]] · value
- [[vitest]] · value

## Calls
- [[coding/actions.ts#addCoder|addCoder()]]
- [[coding/actions.ts#addDocs|addDocs()]]
- [[coding/actions.ts#canUndo|canUndo()]]
- [[coding/actions.ts#createCode|createCode()]]
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]]
- [[coding/actions.ts#setWholeResponseCode|setWholeResponseCode()]]
- [[coding/actions.ts#undoCoding|undoCoding()]]

## Uses
- [[useCodingUi]]
- [[useStore]]

## Reads
- [[useStore/coding|useStore.coding]] · getState

## Writes
- [[useCodingUi/history|useCodingUi.history]] · getState.set, set()

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · getState
- [[setCoding()|useStore.setCoding()]] · getState

## Tests
- [[coding-types.ts]] · import
- [[store.ts]] · import
- [[coding/actions.ts]] · import
- [[uiStore.ts]] · import
