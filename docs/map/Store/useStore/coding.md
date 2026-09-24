---
id: "store-key:useStore.coding"
type: store-key
file: src/core/store.ts
line: 86
area: core
---

# useStore.coding

*Store state key* · defined in [[store.ts]] (line 86) · area [[core]]

- **Store:** useStore

## Read by
- [[AiCodebookDialog|<AiCodebookDialog>]] · selector
- [[AiPrereqDialog|<AiPrereqDialog>]] · selector
- [[AiSuggestDialog|<AiSuggestDialog>]] · selector
- [[AnalyseView|<AnalyseView>]] · selector
- [[Components/App|<App>]] · subscribe
- [[AutoCodeDialog|<AutoCodeDialog>]] · selector
- [[ByAttribute|<ByAttribute>]] · selector
- [[CodebookPanel|<CodebookPanel>]] · selector
- [[CodeEditDialog|<CodeEditDialog>]] · selector
- [[CodersDialog|<CodersDialog>]] · selector
- [[CodingWorkspace|<CodingWorkspace>]] · selector
- [[CommandPalette|<CommandPalette>]] · selector
- [[Cooccurrence|<Cooccurrence>]] · selector
- [[DocEditDialog|<DocEditDialog>]] · selector
- [[Components/Empty|<Empty>]] · selector
- [[ExportDialog|<ExportDialog>]] · selector
- [[ExportToDatasetDialog|<ExportToDatasetDialog>]] · selector
- [[Components/Frequencies|<Frequencies>]] · selector
- [[MemosView|<MemosView>]] · selector
- [[MergeCodeDialog|<MergeCodeDialog>]] · selector
- [[QuickCode|<QuickCode>]] · selector
- [[Reader|<Reader>]] · selector
- [[ReliabilityView|<ReliabilityView>]] · selector
- [[ResponsesView|<ResponsesView>]] · selector
- [[RetrievalView|<RetrievalView>]] · selector
- [[SamplesTab|<SamplesTab>]] · getState, selector
- [[SourcesPanel|<SourcesPanel>]] · selector
- [[SurveyTab|<SurveyTab>]] · selector
- [[Words|<Words>]] · selector
- [[coding/actions.ts#addCoder|addCoder()]] · getState
- [[coding/actions.ts#applyCode|applyCode()]] · getState
- [[controller.ts#appSnapshot|appSnapshot()]] · alias
- [[codes_by_attribute]]
- [[coding/actions.ts#commit|commit()]] · getState
- [[coding/actions.ts#createCode|createCode()]] · getState
- [[features.ts#currentAiContext|currentAiContext()]] · alias
- [[fileActions.ts#currentProjectState|currentProjectState()]] · alias
- [[get_coded_segments]]
- [[list_codes]]
- [[coding/actions.ts#loadWorkedExample|loadWorkedExample()]] · alias
- [[coding/actions.ts#moveCode|moveCode()]] · getState
- [[coding/actions.ts#redoCoding|redoCoding()]] · getState
- [[coding/actions.ts#redoLabel|redoLabel()]] · getState
- [[coding/actions.ts#renameCoder|renameCoder()]] · getState
- [[features.ts#runAiFeature|runAiFeature()]] · alias
- [[search_text]]
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]] · getState
- [[coding/actions.ts]] · getState
- [[install.ts]] · alias
- [[navigation-audit.test.tsx]] · getState
- [[shell-fixes.test.ts]] · getState
- [[actions.test.ts]] · getState
- [[coding/actions.ts#undoCoding|undoCoding()]] · getState
- [[coding/actions.ts#undoLabel|undoLabel()]] · getState
- [[useAutosave|useAutosave()]] · subscribe
- [[useCodeMap|useCodeMap()]] · selector
- [[useEntries|useEntries()]] · selector
- [[useOrderedCodes|useOrderedCodes()]] · selector
- [[updateCoding()|useStore.updateCoding()]]
- [[useUndoRedo|useUndoRedo()]] · selector
- [[useVisibleSegments|useVisibleSegments()]] · selector

## Written by
- [[fileActions.ts#applyProject|applyProject()]] · setState
- [[features.test.ts]] · setState
- [[navigation-audit.test.tsx]] · setState
- [[palette.test.tsx]] · setState
- [[shell-fixes.test.ts]] · setState
- [[setCoding()|useStore.setCoding()]]
- [[updateCoding()|useStore.updateCoding()]]

## Store
- [[useStore]]
