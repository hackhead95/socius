---
id: src/features/coding/actions.ts
type: module
file: src/features/coding/actions.ts
area: features/coding
---

# src/features/coding/actions.ts

*Module* · area [[features - coding|features/coding]] · 373 lines

> Coding actions: every change to the coding project goes through `commit`, which records an undo entry (Text coding has its own undo, separate from the dataset's).

## Imports
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[exampleGuide.ts]] · value
- [[uiStore.ts]] · value
- [[example.ts]] · value
- [[palette.ts]] · value
- [[segments.ts]] · value
- [[tree.ts]] · value

## Uses
- [[useCodingUi]]
- [[useStore]]

## Reads
- [[recentCodeIds|useCodingUi.recentCodeIds]] · alias
- [[useStore/coding|useStore.coding]] · getState

## Writes
- [[recentCodeIds|useCodingUi.recentCodeIds]] · alias.set, set()

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · alias

## Tested by
- [[navigation-audit.test.tsx]] · import
- [[shell-fixes.test.ts]] · import
- [[actions.test.ts]] · import
- [[ui-fixes.test.tsx]] · import

## Imported by
- [[undo.ts]] · value
- [[CodebookPanel.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[AiDialogs.tsx]] · value
- [[AutoCodeDialog.tsx]] · value
- [[ExportDialogs.tsx]] · value
- [[ImportDialog.tsx]] · value
- [[SmallDialogs.tsx]] · value
- [[MemosView.tsx]] · value
- [[Reader.tsx]] · value
- [[ResponsesView.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[SourcesPanel.tsx]] · value
- [[navigation-audit.test.tsx]] · value
- [[shell-fixes.test.ts]] · value
- [[actions.test.ts]] · value
- [[ui-fixes.test.tsx]] · value

## Private helpers
HISTORY_LIMIT (line 14) · coder() (line 83) · touchRecent() (line 85)

## Symbols

### commit
*function* · line 20 · exported
> Apply a change to the coding project with an undo entry. Entries with the same `key` pushed back to back are coalesced (typing in a memo makes one undo step).
- Uses: [[coding/actions.ts]], [[useCodingUi]], [[useStore]]
- Reads: [[useCodingUi/history|useCodingUi.history]], [[useStore/coding|useStore.coding]]
- Writes: [[useCodingUi/future|useCodingUi.future]], [[useCodingUi/history|useCodingUi.history]]
- Store actions: [[setCoding()|useStore.setCoding()]], [[useCodingUi/set()|useCodingUi.set()]]
- Used in: [[SmallDialogs.tsx]]

### undoLabel
*function* · line 35 · exported
> The coding change Undo would take back (its label), or null.
- Uses: [[useCodingUi]], [[useStore]]
- Reads: [[useCodingUi/history|useCodingUi.history]], [[useStore/coding|useStore.coding]]
- Used in: [[undo.ts]]

### redoLabel
*function* · line 42 · exported
> The coding change Redo would apply again (its label), or null.
- Uses: [[useCodingUi]], [[useStore]]
- Reads: [[useCodingUi/future|useCodingUi.future]], [[useStore/coding|useStore.coding]]
- Used in: [[undo.ts]]

### canUndo
*function* · line 48 · exported
- Calls: [[coding/actions.ts#undoLabel|undoLabel()]]
- Used in: [[CodingWorkspace.tsx]], [[AutoCodeDialog.tsx]], [[shell-fixes.test.ts]], [[actions.test.ts]]

### canRedo
*function* · line 52 · exported
- Calls: [[coding/actions.ts#redoLabel|redoLabel()]]
- Used in: [[shell-fixes.test.ts]]

### undoCoding
*function* · line 57 · exported
> Undo the last coding change. Returns its label, or null when there is nothing to undo.
- Uses: [[coding/actions.ts]], [[useCodingUi]], [[useStore]]
- Reads: [[useCodingUi/future|useCodingUi.future]], [[useCodingUi/history|useCodingUi.history]], [[useStore/coding|useStore.coding]]
- Writes: [[useCodingUi/future|useCodingUi.future]], [[useCodingUi/history|useCodingUi.history]]
- Store actions: [[setCoding()|useStore.setCoding()]], [[useCodingUi/set()|useCodingUi.set()]]
- Used in: [[undo.ts]], [[CodingWorkspace.tsx]], [[AutoCodeDialog.tsx]], [[shell-fixes.test.ts]], [[actions.test.ts]]

### redoCoding
*function* · line 71 · exported
> Redo the last undone coding change. Returns its label, or null when there is nothing to redo.
- Uses: [[coding/actions.ts]], [[useCodingUi]], [[useStore]]
- Reads: [[useCodingUi/future|useCodingUi.future]], [[useCodingUi/history|useCodingUi.history]], [[useStore/coding|useStore.coding]]
- Writes: [[useCodingUi/future|useCodingUi.future]], [[useCodingUi/history|useCodingUi.history]]
- Store actions: [[setCoding()|useStore.setCoding()]], [[useCodingUi/set()|useCodingUi.set()]]
- Used in: [[undo.ts]], [[shell-fixes.test.ts]]

### addDocs
*function* · line 92 · exported
> ---------- Documents ----------
- Calls: [[coding/actions.ts#commit|commit()]]
- Used in: [[ImportDialog.tsx]], [[shell-fixes.test.ts]], [[actions.test.ts]], [[ui-fixes.test.tsx]]

### renameDoc
*function* · line 97 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Used in: [[SmallDialogs.tsx]]

### setDocAttributes
*function* · line 103 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Used in: [[SmallDialogs.tsx]]

### deleteDocs
*function* · line 107 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Uses: [[useCodingUi]]
- Reads: [[activeDocId|useCodingUi.activeDocId]]
- Writes: [[activeDocId|useCodingUi.activeDocId]], [[pending|useCodingUi.pending]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Used in: [[SourcesPanel.tsx]]

### loadWorkedExample
*function* · line 123 · exported
> Load the worked example for the bundled sample survey (answers, starter codebook, keyword auto-coding and an explanatory memo) as one undo step, and open the Responses view.
- Calls: [[coding/actions.ts#commit|commit()]], [[example.ts#buildWorkedExample|buildWorkedExample()]], [[example.ts#canBuildWorkedExample|canBuildWorkedExample()]], [[exampleGuide.ts#workedExampleGuide|workedExampleGuide()]]
- Uses: [[useCodingUi]], [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[useStore/coding|useStore.coding]]
- Writes: [[exampleNote|useCodingUi.exampleNote]], [[selectedCodeId|useCodingUi.selectedCodeId]], [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Used in: [[CodingWorkspace.tsx]]

### createCode
*function* · line 141 · exported
> ---------- Codes ----------
- Calls: [[coding/actions.ts#commit|commit()]], [[core/types.ts#newId|newId()]], [[palette.ts#nextCodeColor|nextCodeColor()]]
- Uses: [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Used in: [[CodebookPanel.tsx]], [[Reader.tsx]], [[ResponsesView.tsx]], [[SmallDialogs.tsx]], [[navigation-audit.test.tsx]], [[shell-fixes.test.ts]], [[actions.test.ts]], [[ui-fixes.test.tsx]]

### updateCode
*function* · line 156 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Used in: [[CodebookPanel.tsx]], [[AutoCodeDialog.tsx]]

### moveCode
*function* · line 160 · exported
- Calls: [[coding/actions.ts#commit|commit()]], [[tree.ts#canReparent|canReparent()]]
- Uses: [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Used in: [[CodebookPanel.tsx]]

### deleteCode
*function* · line 178 · exported
> Delete a code, its sub-codes (or lift them to the parent) and their segments.
- Calls: [[coding/actions.ts#commit|commit()]], [[tree.ts#descendantIds|descendantIds()]]
- Uses: [[useCodingUi]]
- Reads: [[recentCodeIds|useCodingUi.recentCodeIds]], [[selectedCodeId|useCodingUi.selectedCodeId]]
- Writes: [[recentCodeIds|useCodingUi.recentCodeIds]], [[selectedCodeId|useCodingUi.selectedCodeId]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Used in: [[CodebookPanel.tsx]], [[SmallDialogs.tsx]]

### mergeCode
*function* · line 195 · exported
> Merge code `fromId` into `intoId`: segments move (merging overlaps), sub-codes move, `fromId` is deleted.
- Calls: [[coding/actions.ts#commit|commit()]], [[segments.ts#addSegmentMerged|addSegmentMerged()]], [[tree.ts#descendantIds|descendantIds()]]
- Uses: [[useCodingUi]]
- Reads: [[selectedCodeId|useCodingUi.selectedCodeId]]
- Writes: [[selectedCodeId|useCodingUi.selectedCodeId]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Used in: [[SmallDialogs.tsx]]

### replaceCodebook
*function* · line 225 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Used in: [[AiDialogs.tsx]], [[ExportDialogs.tsx]]

### applyCode
*function* · line 232 · exported
> Code a passage (merges with overlapping segments of the same code by the same coder).
- Calls: [[coding/actions.ts#commit|commit()]], [[coding/actions.ts]], [[core/types.ts#newId|newId()]], [[segments.ts#addSegmentMerged|addSegmentMerged()]], [[segments.ts#trimRange|trimRange()]]
- Uses: [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Used in: [[CodebookPanel.tsx]], [[Reader.tsx]]

### uncodeRange
*function* · line 248 · exported
> Remove a code from part of a passage (active coder only).
- Calls: [[coding/actions.ts#commit|commit()]], [[core/types.ts#newId|newId()]], [[segments.ts#subtractRange|subtractRange()]]
- Used in: [[Reader.tsx]]

### removeSegment
*function* · line 252 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Used in: [[Reader.tsx]]

### setSegmentMemo
*function* · line 256 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Used in: [[Reader.tsx]]

### setWholeResponseCode
*function* · line 261 · exported
> Whole-response coding: toggle `codeId` on each doc for the active coder. `mode` forces on/off.
- Calls: [[coding/actions.ts#commit|commit()]], [[coding/actions.ts]], [[core/types.ts#newId|newId()]]
- Used in: [[ResponsesView.tsx]], [[actions.test.ts]], [[ui-fixes.test.tsx]]

### addSegmentsBulk
*function* · line 284 · exported
> Add many segments at once (auto-coding, accepted AI suggestions). Returns how many were added.
- Calls: [[coding/actions.ts#commit|commit()]], [[core/types.ts#newId|newId()]], [[segments.ts#addSegmentMerged|addSegmentMerged()]]
- Used in: [[AiDialogs.tsx]], [[AutoCodeDialog.tsx]]

### addCoder
*function* · line 301 · exported
> ---------- Coders ----------
- Calls: [[coding/actions.ts#commit|commit()]]
- Uses: [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Used in: [[SmallDialogs.tsx]], [[shell-fixes.test.ts]], [[actions.test.ts]], [[ui-fixes.test.tsx]]

### renameCoder
*function* · line 309 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Uses: [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Used in: [[SmallDialogs.tsx]]

### removeCoder
*function* · line 322 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Used in: [[SmallDialogs.tsx]]

### setActiveCoder
*function* · line 334 · exported
> Switch who is coding. Not an undo step of its own: the undo history is rebased onto the new coder so Ctrl+Z still works after switching (undoing restores the codes, not the previous coder).
- Uses: [[useCodingUi]], [[useStore]]
- Reads: [[useCodingUi/future|useCodingUi.future]], [[useCodingUi/history|useCodingUi.history]], [[useStore/coding|useStore.coding]]
- Writes: [[useCodingUi/future|useCodingUi.future]], [[useCodingUi/history|useCodingUi.history]]
- Store actions: [[setCoding()|useStore.setCoding()]], [[useCodingUi/set()|useCodingUi.set()]]
- Used in: [[CodingWorkspace.tsx]], [[SmallDialogs.tsx]], [[shell-fixes.test.ts]], [[actions.test.ts]]

### createMemo
*function* · line 359 · exported
> ---------- Memos ----------
- Calls: [[coding/actions.ts#commit|commit()]], [[core/types.ts#newId|newId()]]
- Used in: [[CodebookPanel.tsx]], [[MemosView.tsx]], [[Reader.tsx]], [[RetrievalView.tsx]]

### updateMemo
*function* · line 366 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Used in: [[MemosView.tsx]]

### deleteMemo
*function* · line 370 · exported
- Calls: [[coding/actions.ts#commit|commit()]]
- Used in: [[MemosView.tsx]]
