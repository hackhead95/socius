---
id: tests/coding/dataset.test.ts
type: test
file: tests/coding/dataset.test.ts
area: tests
---

# tests/coding/dataset.test.ts

*Test file* · area [[tests]] · 185 lines

## Test cases
- **open-ended answers to response documents**
  - creates one response per non-empty answer with labelled attributes
  - rejects numeric variables
- **export codes to dataset**
  - builds 0/1 variables with sysmis for no answer, unique names and a count variable
  - adds a theme variable that is 1 when the theme or any sub-code applies, without double counting
  - skips responses whose case no longer matches
  - makes readable stems
- **exporting the same codes to the dataset again**
  - records the code and source question as variable attributes
  - update mode overwrites the earlier variables in place, keeping names and edits
  - new mode creates suffixed copies and leaves the earlier variables alone
  - updating is a single undo step in the store
  - the origin attributes survive a .sav round trip

## Imports
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[survey.ts]] · value
- [[toDataset.ts]] · value
- [[io/index.ts]] · value
- [[vitest]] · value

## Calls
- [[toDataset.ts#applyCodeVariables|applyCodeVariables()]]
- [[toDataset.ts#buildCodeVariables|buildCodeVariables()]]
- [[survey.ts#buildResponseDocs|buildResponseDocs()]]
- [[toDataset.ts#codeVarStem|codeVarStem()]]
- [[io/index.ts#exportSav|exportSav()]]
- [[toDataset.ts#findExportedVariable|findExportedVariable()]]
- [[io/index.ts#importFile|importFile()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]

## Uses
- [[toDataset.ts#CODE_ATTR|CODE_ATTR]]
- [[toDataset.ts#COUNT_CODE|COUNT_CODE]]
- [[toDataset.ts#SOURCE_ATTR|SOURCE_ATTR]]
- [[useStore]]

## Reads
- [[dataset|useStore.dataset]] · getState
- [[past|useStore.past]] · getState

## Calls store actions
- [[mutateDataset()|useStore.mutateDataset()]] · getState
- [[setDataset()|useStore.setDataset()]] · getState
- [[undo()|useStore.undo()]] · getState

## Tests
- [[coding-types.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[survey.ts]] · import
- [[toDataset.ts]] · import
- [[io/index.ts]] · import

## Private helpers
dataset() (line 9)
