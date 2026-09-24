---
id: src/core/store.ts
type: module
file: src/core/store.ts
area: core
---

# src/core/store.ts

*Module* · area [[core]] · 379 lines

> Global app store (zustand). One active dataset, the output log, and the text-coding project. Dataset updates are immutable: every mutation produces a new Dataset object with version+1 and copies only the columns it changes, which makes undo cheap.

## Imports
- [[coding-types.ts]] · type-only, value
- [[output.ts]] · type-only
- [[core/types.ts]] · type-only, value
- [[zustand]] · value

## Tested by
- [[features.test.ts]] · import
- [[error-boundary.test.tsx]] · import
- [[navigation-audit.test.tsx]] · import
- [[palette.test.tsx]] · import
- [[search.test.ts]] · import
- [[shell-fixes.test.ts]] · import
- [[shortcut-precedence.test.tsx]] · import
- [[ui-overlays.test.tsx]] · import
- [[scenarios.test.ts]] · import
- [[actions.test.ts]] · import
- [[dataset.test.ts]] · import
- [[ui-fixes.test.tsx]] · import
- [[transforms-expr.fuzz.test.ts]] · import
- [[transforms-ops.fuzz.test.ts]] · import
- [[dialog-ui.test.tsx]] · import
- [[figures.test.tsx]] · import
- [[ai-latency.test.ts]] · import
- [[data-fixes.test.ts]] · import
- [[history.test.ts]] · import

## Imported by
- [[App.tsx]] · value
- [[CommandPalette.tsx]] · value
- [[DialogHost.tsx]] · value
- [[ErrorBoundary.tsx]] · value
- [[MenuBar.tsx]] · value
- [[menus.ts]] · value
- [[Overlays.tsx]] · value
- [[shortcuts.ts]] · value
- [[Sidebar.tsx]] · value
- [[TopBar.tsx]] · value
- [[undo.ts]] · value
- [[Welcome.tsx]] · value
- [[AiFeatureDialogs.tsx]] · value
- [[ExplainPanel.tsx]] · value
- [[explainStore.ts]] · value
- [[features.ts]] · value
- [[ProcedureDialog.tsx]] · value
- [[AssistantPanel.tsx]] · value
- [[controller.ts]] · value
- [[coding/actions.ts]] · value
- [[AnalyseView.tsx]] · value
- [[CodebookPanel.tsx]] · value
- [[CodingDialog.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[AiDialogs.tsx]] · value
- [[AutoCodeDialog.tsx]] · value
- [[ExportDialogs.tsx]] · value
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
- [[DataView.tsx]] · value
- [[DefineProperties.tsx]] · value
- [[VarDialogs.tsx]] · value
- [[VariableView.tsx]] · value
- [[errorlog/actions.ts]] · value
- [[install.ts]] · value
- [[output/actions.ts]] · value
- [[OutputViewer.tsx]] · value
- [[fileActions.ts]] · value
- [[projectFile.ts]] · type-only
- [[transform/common.tsx]] · value
- [[MergeDialogs.tsx]] · value
- [[TransformDialogs.tsx]] · value
- [[assistant/actions.ts]] · type-only
- [[assistant/types.ts]] · type-only
- [[features.test.ts]] · value
- [[error-boundary.test.tsx]] · value
- [[navigation-audit.test.tsx]] · value
- [[palette.test.tsx]] · value
- [[search.test.ts]] · value
- [[shell-fixes.test.ts]] · value
- [[shortcut-precedence.test.tsx]] · value
- [[ui-overlays.test.tsx]] · value
- [[scenarios.test.ts]] · value
- [[actions.test.ts]] · value
- [[dataset.test.ts]] · value
- [[ui-fixes.test.tsx]] · value
- [[transforms-expr.fuzz.test.ts]] · value
- [[transforms-ops.fuzz.test.ts]] · value
- [[dialog-ui.test.tsx]] · value
- [[figures.test.tsx]] · dynamic
- [[ai-latency.test.ts]] · dynamic
- [[data-fixes.test.ts]] · value
- [[history.test.ts]] · value

## Types
MainTab (line 12) · DialogRequest (line 15) · Toast (line 22) · OutputDeletion (line 58) · AppState (line 78)

## Private helpers
HISTORY_LIMIT (line 30) · HISTORY_BYTES (line 32) · columnBytes() (line 34) · OUTPUT_UNDO_LIMIT (line 64) · changeLabels (line 71) · toastSeq (line 143) · bump() (line 145)

## Symbols

### trimHistory
*function* · line 43 · exported
> Drop the oldest undo states once the columns they alone hold pass HISTORY_BYTES. Sorting or deleting cases in a 100,000 x 200 file copies every column (160 MB), so 40 steps would exhaust memory. Always keeps at least the most recent state.
- Calls: [[store.ts]]
- Uses: [[store.ts]]
- Used in: [[history.test.ts]]

### changeLabelOf
*function* · line 74 · exported
> The name given to the change that produced `ds` (see `mutateDataset`'s `label`), if any.
- Uses: [[store.ts]]
- Used in: [[undo.ts]]

### useStore
*store* · line 149 · exported · note: [[useStore]]
- Calls: [[coding-types.ts#emptyCodingProject|emptyCodingProject()]], [[core/types.ts#emptyColumn|emptyColumn()]], [[store.ts#trimHistory|trimHistory()]], [[store.ts]]
- Uses: [[store.ts]]
- Used in: [[App.tsx]], [[CommandPalette.tsx]], [[DialogHost.tsx]], [[ErrorBoundary.tsx]], [[MenuBar.tsx]], [[Overlays.tsx]], [[Sidebar.tsx]], [[TopBar.tsx]], [[Welcome.tsx]], [[menus.ts]], [[shortcuts.ts]], [[undo.ts]], [[AiFeatureDialogs.tsx]], [[ExplainPanel.tsx]], [[explainStore.ts]], [[features.ts]], [[ProcedureDialog.tsx]], [[AssistantPanel.tsx]], [[controller.ts]], [[AnalyseView.tsx]], [[CodebookPanel.tsx]], [[CodingDialog.tsx]], [[CodingWorkspace.tsx]], [[MemosView.tsx]], [[QuickCode.tsx]] … +41
