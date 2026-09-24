---
id: tests/app/shell-fixes.test.ts
type: test
file: tests/app/shell-fixes.test.ts
area: tests
---

# tests/app/shell-fixes.test.ts

*Test file* · area [[tests]] · 183 lines

> Regression tests for the September 2026 shell fixes: Undo per tab (describing the change, output deletions, coding redo), renaming variables, the sample-interview chooser, the start screen's way back, and submenu "menu aim".

## Test cases
- **Undo says what it will undo**
  - describes each kind of data change
  - uses the name a change was given
- **deleted Output results can be undone**
  - restores the result at its place, and redo deletes it again
  - skips a result already brought back by the Output toast, and forgets deletions when a project replaces everything
- **Text coding redo**
  - redoes what was undone, and a new change clears the redo list
  - keeps redo working after switching coder
- **renaming a variable (Variable View name cell, Data View heading)**
  - accepts simple names, a change of capitals only, digits, underscores and non-Latin letters
  - explains what is wrong in plain words, with a suggestion
  - keeps the weight, the filter and coding links, which refer to the variable by id
- **sample interviews: one chooser from the menu and the toolbar**
  - both places are the same command with the same label
  - ticks every interview that is not loaded yet
- **start screen (Home)**
  - offers a way back to what is open
- **submenu menu aim**
  - treats a diagonal move towards the submenu as aiming, and other moves as not

## Imports
- [[undo.ts]] · value
- [[Welcome.tsx]] · value
- [[coding-types.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[coding/actions.ts]] · value
- [[ImportDialog.tsx]] · value
- [[menu.ts]] · value
- [[uiStore.ts]] · value
- [[mutations.ts]] · value
- [[samples/index.ts]] · value
- [[Menu.tsx]] · value
- [[vitest]] · value

## Calls
- [[coding/actions.ts#addCoder|addCoder()]]
- [[coding/actions.ts#addDocs|addDocs()]]
- [[Menu.tsx#aimsAtSubmenu|aimsAtSubmenu()]]
- [[Welcome.tsx#backTarget|backTarget()]]
- [[coding/actions.ts#canRedo|canRedo()]]
- [[coding/actions.ts#canUndo|canUndo()]]
- [[coding/actions.ts#createCode|createCode()]]
- [[undo.ts#describeDatasetChange|describeDatasetChange()]]
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[coding/actions.ts#redoCoding|redoCoding()]]
- [[ImportDialog.tsx#samplesToTick|samplesToTick()]]
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]]
- [[coding/actions.ts#undoCoding|undoCoding()]]
- [[mutations.ts#varNameProblem|varNameProblem()]]

## Uses
- [[menu.ts#codingMenuItems|codingMenuItems]]
- [[samples/index.ts#sampleTranscripts|sampleTranscripts]]
- [[useCodingUi]]
- [[useStore]]

## Reads
- [[useStore/coding|useStore.coding]] · getState
- [[dataset|useStore.dataset]] · getState, getState (destructured)
- [[outputs|useStore.outputs]] · getState
- [[outputUndo|useStore.outputUndo]] · getState
- [[past|useStore.past]] · getState (destructured)

## Writes
- [[useCodingUi/future|useCodingUi.future]] · setState
- [[useCodingUi/history|useCodingUi.history]] · setState
- [[useStore/coding|useStore.coding]] · setState
- [[dataset|useStore.dataset]] · setState
- [[useStore/future|useStore.future]] · setState
- [[outputRedo|useStore.outputRedo]] · setState
- [[outputs|useStore.outputs]] · setState
- [[outputUndo|useStore.outputUndo]] · setState
- [[past|useStore.past]] · setState
- [[useStore/tab|useStore.tab]] · setState

## Calls store actions
- [[mutateDataset()|useStore.mutateDataset()]] · getState
- [[redeleteOutput()|useStore.redeleteOutput()]] · getState
- [[removeOutput()|useStore.removeOutput()]] · getState
- [[restoreOutput()|useStore.restoreOutput()]] · getState
- [[setDataset()|useStore.setDataset()]] · getState
- [[updateVariable()|useStore.updateVariable()]] · getState

## Tests
- [[undo.ts]] · import
- [[Welcome.tsx]] · import
- [[coding-types.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[coding/actions.ts]] · import
- [[ImportDialog.tsx]] · import
- [[menu.ts]] · import
- [[uiStore.ts]] · import
- [[mutations.ts]] · import
- [[samples/index.ts]] · import
- [[Menu.tsx]] · import
- [[Load sample interviews|Text coding > Load sample interviews...]] · menu label
- [[Output|View > Output]] · menu label

## Private helpers
survey() (line 18)
