---
id: tests/transform/history.test.ts
type: test
file: tests/transform/history.test.ts
area: tests
---

# tests/transform/history.test.ts

*Test file* · area [[tests]] · 35 lines

> Undo history must not grow without bound on big files: every sort of 100,000 x 200 copies 160 MB.

## Test cases
- **undo history memory**
  - drops the oldest states once the columns only they hold pass the budget
  - counts columns shared with the current data or other states once
  - keeps sorting a large dataset from piling up copies

## Imports
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[vitest]] · value

## Calls
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[store.ts#trimHistory|trimHistory()]]

## Uses
- [[useStore]]

## Reads
- [[past|useStore.past]] · getState

## Calls store actions
- [[mutateDataset()|useStore.mutateDataset()]] · getState
- [[setDataset()|useStore.setDataset()]] · getState

## Tests
- [[store.ts]] · import
- [[core/types.ts]] · import

## Private helpers
big() (line 6)
