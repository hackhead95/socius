---
id: src/features/coding/uiStore.ts
type: module
file: src/features/coding/uiStore.ts
area: features/coding
---

# src/features/coding/uiStore.ts

*Module* · area [[features - coding|features/coding]] · 91 lines

> UI state for the Text coding workspace (not saved with the project).

## Imports
- [[coding-types.ts]] · type-only
- [[zustand]] · value

## Tested by
- [[navigation-audit.test.tsx]] · import
- [[palette.test.tsx]] · import
- [[shell-fixes.test.ts]] · import
- [[actions.test.ts]] · import

## Imported by
- [[CommandPalette.tsx]] · value
- [[undo.ts]] · value
- [[AiFeatureDialogs.tsx]] · value
- [[features.ts]] · value
- [[coding/actions.ts]] · value
- [[AnalyseView.tsx]] · value
- [[CodebookPanel.tsx]] · value
- [[CodingDialog.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[ImportDialog.tsx]] · value
- [[SmallDialogs.tsx]] · value
- [[coding/hooks.ts]] · value
- [[MemosView.tsx]] · value
- [[QuickCode.tsx]] · value
- [[Reader.tsx]] · value
- [[ReliabilityView.tsx]] · value
- [[ResponsesView.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[SourcesPanel.tsx]] · value
- [[navigation-audit.test.tsx]] · value
- [[palette.test.tsx]] · value
- [[shell-fixes.test.ts]] · value
- [[actions.test.ts]] · value

## Types
CodingView (line 6) · AnalyseTab (line 7) · HistoryEntry (line 9) · PendingSelection (line 16) · LocalDialog (line 22)

## Symbols

### useCodingUi
*store* · line 56 · exported · note: [[useCodingUi]]
- Used in: [[CommandPalette.tsx]], [[undo.ts]], [[AiFeatureDialogs.tsx]], [[features.ts]], [[AnalyseView.tsx]], [[CodebookPanel.tsx]], [[CodingDialog.tsx]], [[CodingWorkspace.tsx]], [[MemosView.tsx]], [[QuickCode.tsx]], [[Reader.tsx]], [[ResponsesView.tsx]], [[RetrievalView.tsx]], [[SourcesPanel.tsx]], [[coding/actions.ts]], [[ImportDialog.tsx]], [[SmallDialogs.tsx]], [[coding/hooks.ts]], [[navigation-audit.test.tsx]], [[palette.test.tsx]], [[shell-fixes.test.ts]], [[actions.test.ts]]

### openLocalDialog
*function* · line 78 · exported
- Uses: [[useCodingUi]]
- Writes: [[useCodingUi/dialog|useCodingUi.dialog]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Used in: [[CodebookPanel.tsx]], [[CodingWorkspace.tsx]], [[Reader.tsx]], [[ReliabilityView.tsx]], [[ResponsesView.tsx]], [[SourcesPanel.tsx]]

### jumpTo
*function* · line 83 · exported
> Open a document (or a single response) in the reading view, scrolled to a range.
- Uses: [[useCodingUi]]
- Writes: [[activeDocId|useCodingUi.activeDocId]], [[jump|useCodingUi.jump]], [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Used in: [[AnalyseView.tsx]], [[ReliabilityView.tsx]], [[ResponsesView.tsx]], [[RetrievalView.tsx]]
