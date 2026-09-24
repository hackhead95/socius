---
id: "src/features/coding/uiStore.ts#useCodingUi"
type: store
file: src/features/coding/uiStore.ts
line: 61
area: features/coding
---

# useCodingUi

*Store* · defined in [[uiStore.ts]] (line 61) · area [[features - coding|features/coding]]

- **Exported:** yes

## Keys and who touches them
| key | written by | read by |
|---|---|---|
| [[activeDocId]] | 6 ([[ui-fixes.test.tsx]], [[coding/actions.ts#deleteDocs\|deleteDocs()]], [[CodingWorkspace\|<CodingWorkspace>]], [[ImportDialog.tsx]], …) | 3 |
| [[analyseSources]] | 0  | 1 |
| [[analyseTab]] | 4 ([[ui-fixes.test.tsx]], [[CommandPalette\|<CommandPalette>]], [[CodingDialog.tsx#ViewSwitch\|ViewSwitch()]], [[ResponsesView\|<ResponsesView>]]) | 1 |
| [[collapsed]] | 1 ([[CodebookPanel\|<CodebookPanel>]]) | 1 |
| [[useCodingUi/dialog\|dialog]] | 4 ([[ui-fixes.test.tsx]], [[CodingWorkspace\|<CodingWorkspace>]], [[CodeEditDialog\|<CodeEditDialog>]], [[uiStore.ts#openLocalDialog\|openLocalDialog()]]) | 1 |
| [[docAttr]] | 1 ([[SourcesPanel\|<SourcesPanel>]]) | 1 |
| [[docFilter]] | 1 ([[SourcesPanel\|<SourcesPanel>]]) | 1 |
| [[docSearch]] | 1 ([[SourcesPanel\|<SourcesPanel>]]) | 1 |
| [[exampleNote]] | 3 ([[ui-fixes.test.tsx]], [[coding/actions.ts#loadWorkedExample\|loadWorkedExample()]], [[ResponsesView\|<ResponsesView>]]) | 1 |
| [[useCodingUi/future\|future]] | 9 ([[Redo\|Edit > Redo]], [[Undo\|Edit > Undo]], [[navigation-audit.test.tsx]], [[shell-fixes.test.ts]], …) | 5 |
| [[useCodingUi/history\|history]] | 10 ([[Redo\|Edit > Redo]], [[Undo\|Edit > Undo]], [[navigation-audit.test.tsx]], [[shell-fixes.test.ts]], …) | 7 |
| [[jump]] | 1 ([[uiStore.ts#jumpTo\|jumpTo()]]) | 1 |
| [[kwicQuery]] | 1 ([[CommandPalette\|<CommandPalette>]]) | 1 |
| [[pending]] | 3 ([[coding/actions.ts#deleteDocs\|deleteDocs()]], [[CodebookPanel\|<CodebookPanel>]], [[Reader\|<Reader>]]) | 2 |
| [[recentCodeIds]] | 2 ([[coding/actions.ts#deleteCode\|deleteCode()]], [[coding/actions.ts]]) | 3 |
| [[selectedCodeId]] | 10 ([[summarise\|Summarise a code]], [[Summarise a code\|AI > Summarise a code...]], [[useEntries\|useEntries()]], [[features.ts#runAiFeature\|runAiFeature()]], …) | 6 |
| [[showAllCoders]] | 2 ([[ui-fixes.test.tsx]], [[CodingWorkspace\|<CodingWorkspace>]]) | 3 |
| [[useCodingUi/view\|view]] | 15 ([[summarise\|Summarise a code]], [[Summarise a code\|AI > Summarise a code...]], [[ui-fixes.test.tsx]], [[CommandPalette\|<CommandPalette>]], …) | 2 |
| [[viewPicked]] | 2 ([[ui-fixes.test.tsx]], [[CodingWorkspace\|<CodingWorkspace>]]) | 1 |

## Actions
| action | writes | callers |
|---|---|---|
| [[useCodingUi/set()\|set()]] |  | 34 |

## State keys
- [[activeDocId|useCodingUi.activeDocId]]
- [[analyseSources|useCodingUi.analyseSources]]
- [[analyseTab|useCodingUi.analyseTab]]
- [[collapsed|useCodingUi.collapsed]]
- [[useCodingUi/dialog|useCodingUi.dialog]]
- [[docAttr|useCodingUi.docAttr]]
- [[docFilter|useCodingUi.docFilter]]
- [[docSearch|useCodingUi.docSearch]]
- [[exampleNote|useCodingUi.exampleNote]]
- [[useCodingUi/future|useCodingUi.future]]
- [[useCodingUi/history|useCodingUi.history]]
- [[jump|useCodingUi.jump]]
- [[kwicQuery|useCodingUi.kwicQuery]]
- [[pending|useCodingUi.pending]]
- [[recentCodeIds|useCodingUi.recentCodeIds]]
- [[selectedCodeId|useCodingUi.selectedCodeId]]
- [[showAllCoders|useCodingUi.showAllCoders]]
- [[useCodingUi/view|useCodingUi.view]]
- [[viewPicked|useCodingUi.viewPicked]]

## Actions
- [[useCodingUi/set()|useCodingUi.set()]]

## Called by
- [[AnalyseView|<AnalyseView>]]
- [[CodebookPanel|<CodebookPanel>]]
- [[CodersDialog|<CodersDialog>]]
- [[CodingWorkspace|<CodingWorkspace>]]
- [[Kwic|<Kwic>]]
- [[MemosView|<MemosView>]]
- [[QuickCode|<QuickCode>]]
- [[Reader|<Reader>]]
- [[ResponsesView|<ResponsesView>]]
- [[RetrievalView|<RetrievalView>]]
- [[SourcesPanel|<SourcesPanel>]]
- [[Words|<Words>]]
- [[useUndoRedo|useUndoRedo()]]
- [[useVisibleSegments|useVisibleSegments()]]

## Used by
- [[CodeEditDialog|<CodeEditDialog>]]
- [[CommandPalette|<CommandPalette>]]
- [[Reader|<Reader>]]
- [[ResponsesView|<ResponsesView>]]
- [[coding/actions.ts#commit|commit()]]
- [[coding/actions.ts#deleteCode|deleteCode()]]
- [[coding/actions.ts#deleteDocs|deleteDocs()]]
- [[AiFeatureDialogs.tsx#doAction|doAction()]]
- [[uiStore.ts#jumpTo|jumpTo()]]
- [[coding/actions.ts#loadWorkedExample|loadWorkedExample()]]
- [[coding/actions.ts#mergeCode|mergeCode()]]
- [[uiStore.ts#openLocalDialog|openLocalDialog()]]
- [[coding/actions.ts#redoCoding|redoCoding()]]
- [[coding/actions.ts#redoLabel|redoLabel()]]
- [[features.ts#runAiFeature|runAiFeature()]]
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]]
- [[coding/actions.ts]]
- [[ImportDialog.tsx]]
- [[navigation-audit.test.tsx]]
- [[palette.test.tsx]] · whole-state
- [[shell-fixes.test.ts]]
- [[actions.test.ts]]
- [[ui-fixes.test.tsx]]
- [[coding/actions.ts#undoCoding|undoCoding()]]
- [[coding/actions.ts#undoLabel|undoLabel()]]
- [[useEntries|useEntries()]]
- [[CodingDialog.tsx#ViewSwitch|ViewSwitch()]]
