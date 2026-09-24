---
id: src/app/undo.ts
type: module
file: src/app/undo.ts
area: app
---

# src/app/undo.ts

*Module* · area [[Areas/app|app]] · 172 lines

> Undo and Redo follow the tab you are in (Edit > Undo / Redo, Ctrl+Z / Ctrl+Y, the top-bar icons): - Text coding: the last coding change (codes, passages, memos, sources), nothing else. - Output: the last deleted result, if there is one; otherwise the last data change. - Data View and Variable View: the last data change. The menu label says what will be undone ("Undo rename of age", "Undo code p...

## Imports
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[coding/actions.ts]] · value
- [[uiStore.ts]] · value

## Uses
- [[useStore]]

## Reads
- [[outputRedo|useStore.outputRedo]] · getState (destructured)
- [[outputs|useStore.outputs]] · getState (destructured)
- [[outputUndo|useStore.outputUndo]] · getState (destructured)

## Tested by
- [[shell-fixes.test.ts]] · import

## Imported by
- [[menus.ts]] · value
- [[shortcuts.ts]] · value
- [[TopBar.tsx]] · value
- [[shell-fixes.test.ts]] · value

## Types
UndoScope (line 11) · UndoStep (line 13)

## Private helpers
MAX_NAME (line 19) · short() (line 21) · lowerFirst() (line 22) · plural() (line 23) · sameProps() (line 25) · outputPhrase() (line 74) · codingPhrase() (line 78) · liveOutputUndo() (line 82) · liveOutputRedo() (line 88)

## Symbols

### describeDatasetChange
*function* · line 36 · exported
> Describe the change from `before` to `after` in a few words, for "Undo ..." and "Redo ...". Uses the name the change was given (mutateDataset's `label`) when there is one.
- Calls: [[store.ts#changeLabelOf|changeLabelOf()]], [[undo.ts]]
- Used in: [[shell-fixes.test.ts]]

### undoStep
*function* · line 95 · exported
> What Undo would do in the current tab, or null when there is nothing to undo there.
- Calls: [[coding/actions.ts#undoLabel|undoLabel()]], [[undo.ts#describeDatasetChange|describeDatasetChange()]], [[undo.ts]]
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[past|useStore.past]], [[useStore/tab|useStore.tab]]
- Used in: [[shortcuts.ts]]

### redoStep
*function* · line 110 · exported
> What Redo would do in the current tab, or null when there is nothing to redo there.
- Calls: [[coding/actions.ts#redoLabel|redoLabel()]], [[undo.ts#describeDatasetChange|describeDatasetChange()]], [[undo.ts]]
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[useStore/future|useStore.future]], [[useStore/tab|useStore.tab]]
- Used in: [[shortcuts.ts]]

### nothingTo
*function* · line 125 · exported
> Tooltip for a disabled Undo or Redo, per tab.
- Uses: [[useStore]]
- Reads: [[useStore/tab|useStore.tab]]
- Used in: [[TopBar.tsx]], [[menus.ts]]

### runUndo
*function* · line 132 · exported
> Undo in the current tab. Returns the step it undid, or null.
- Calls: [[coding/actions.ts#undoCoding|undoCoding()]], [[undo.ts#undoStep|undoStep()]]
- Uses: [[useStore]]
- Store actions: [[restoreOutput()|useStore.restoreOutput()]], [[toast()|useStore.toast()]], [[undo()|useStore.undo()]]
- Used in: [[TopBar.tsx]], [[menus.ts]], [[shortcuts.ts]]

### runRedo
*function* · line 145 · exported
> Redo in the current tab. Returns the step it redid, or null.
- Calls: [[coding/actions.ts#redoCoding|redoCoding()]], [[undo.ts#redoStep|redoStep()]]
- Uses: [[useStore]]
- Store actions: [[redeleteOutput()|useStore.redeleteOutput()]], [[redo()|useStore.redo()]], [[toast()|useStore.toast()]]
- Used in: [[TopBar.tsx]], [[menus.ts]], [[shortcuts.ts]]

### useUndoRedo
*hook* · line 158 · exported · note: [[useUndoRedo|useUndoRedo()]]
> Undo and Redo for the current tab, kept up to date (menus, top bar).
- Calls: [[undo.ts#redoStep|redoStep()]], [[undo.ts#undoStep|undoStep()]], [[useCodingUi]], [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[outputRedo|useStore.outputRedo]], [[outputUndo|useStore.outputUndo]], [[outputs|useStore.outputs]], [[past|useStore.past]], [[useCodingUi/future|useCodingUi.future]], [[useCodingUi/history|useCodingUi.history]], [[useStore/coding|useStore.coding]], [[useStore/future|useStore.future]], [[useStore/tab|useStore.tab]]
- Used in: [[TopBar.tsx]], [[menus.ts]]
