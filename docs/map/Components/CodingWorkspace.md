---
id: "src/features/coding/CodingWorkspace.tsx#CodingWorkspace"
type: component
file: src/features/coding/CodingWorkspace.tsx
line: 36
area: features/coding
---

# <CodingWorkspace>

*React component* · defined in [[CodingWorkspace.tsx]] (line 36) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[features.ts#aiFeature|aiFeature()]]
- [[example.ts#canBuildWorkedExample|canBuildWorkedExample()]]
- [[coding/actions.ts#canUndo|canUndo()]]
- [[menu.ts#codingMenuLabel|codingMenuLabel()]]
- [[shortcuts.ts#modKey|modKey()]]
- [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- [[uiStore.ts#openLocalDialog|openLocalDialog()]]
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]]
- [[coding/hooks.ts#toast|toast()]]
- [[coding/actions.ts#undoCoding|undoCoding()]]
- [[useAiStatus|useAiStatus()]]
- [[useCodingUi]]
- [[useScrollEdges (features-coding-ui)|useScrollEdges()]]
- [[useStore]]

## Renders
- [[AnalyseView|<AnalyseView>]]
- [[CodebookPanel|<CodebookPanel>]]
- [[CodingDialog|<CodingDialog>]]
- [[MemosView|<MemosView>]]
- [[MenuButton|<MenuButton>]]
- [[Reader|<Reader>]]
- [[ReliabilityView|<ReliabilityView>]]
- [[ResponsesView|<ResponsesView>]]
- [[RetrievalView|<RetrievalView>]]
- [[SourcesPanel|<SourcesPanel>]]
- [[Welcome (features-coding-CodingWorkspace)|<Welcome>]]

## Uses
- [[CodingWorkspace.tsx#CODING_VIEWS|CODING_VIEWS]]
- [[AiBits.tsx#SET_UP_AI|SET_UP_AI]]
- [[exampleGuide.ts#UNDO_CODING_LABEL|UNDO_CODING_LABEL]]

## Reads
- [[activeDocId|useCodingUi.activeDocId]] · hook (destructured)
- [[useCodingUi/dialog|useCodingUi.dialog]] · hook (destructured)
- [[useCodingUi/history|useCodingUi.history]] · hook (destructured)
- [[showAllCoders|useCodingUi.showAllCoders]] · hook (destructured)
- [[useCodingUi/view|useCodingUi.view]] · hook (destructured)
- [[viewPicked|useCodingUi.viewPicked]] · hook (destructured)
- [[useStore/coding|useStore.coding]] · selector
- [[dataset|useStore.dataset]] · selector

## Writes
- [[activeDocId|useCodingUi.activeDocId]] · set alias
- [[useCodingUi/dialog|useCodingUi.dialog]] · set alias
- [[showAllCoders|useCodingUi.showAllCoders]] · set alias
- [[useCodingUi/view|useCodingUi.view]] · set alias
- [[viewPicked|useCodingUi.viewPicked]] · set alias

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · hook (destructured)

## Opens
- [[ai-codebook|coding: ai-codebook]] · openLocalDialog
- [[ai-suggest|coding: ai-suggest]] · openLocalDialog
- [[auto-code|coding: auto-code]] · openLocalDialog
- [[coding/coders|coding: coders]] · openLocalDialog
- [[export|coding: export]] · openLocalDialog
- [[export-dataset|coding: export-dataset]] · openLocalDialog
- [[coding/import|coding: import]] · openLocalDialog
- [[load-samples|coding: load-samples]] · openLocalDialog

## Rendered by
- [[Components/App|<App>]]
- [[ui-fixes.test.tsx]]
