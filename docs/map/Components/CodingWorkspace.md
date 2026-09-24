---
id: "src/features/coding/CodingWorkspace.tsx#CodingWorkspace"
type: component
file: src/features/coding/CodingWorkspace.tsx
line: 34
area: features/coding
---

# <CodingWorkspace>

*React component* · defined in [[CodingWorkspace.tsx]] (line 34) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[features.ts#aiFeature|aiFeature()]]
- [[example.ts#canBuildWorkedExample|canBuildWorkedExample()]]
- [[coding/actions.ts#canUndo|canUndo()]]
- [[shortcuts.ts#modKey|modKey()]]
- [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- [[uiStore.ts#openLocalDialog|openLocalDialog()]]
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]]
- [[coding/hooks.ts#toast|toast()]]
- [[coding/actions.ts#undoCoding|undoCoding()]]
- [[useAiStatus|useAiStatus()]]
- [[useCodingUi]]
- [[useStore]]

## Renders
- [[AiSetupButton|<AiSetupButton>]]
- [[AnalyseView|<AnalyseView>]]
- [[CodebookPanel|<CodebookPanel>]]
- [[CodingDialog|<CodingDialog>]]
- [[MemosView|<MemosView>]]
- [[MenuButton (features-coding-ui)|<MenuButton>]]
- [[Reader|<Reader>]]
- [[ReliabilityView|<ReliabilityView>]]
- [[ResponsesView|<ResponsesView>]]
- [[RetrievalView|<RetrievalView>]]
- [[SourcesPanel|<SourcesPanel>]]
- [[Welcome (features-coding-CodingWorkspace)|<Welcome>]]

## Uses
- [[AiBits.tsx#SET_UP_AI|SET_UP_AI]]

## Reads
- [[activeDocId|useCodingUi.activeDocId]] · hook (destructured)
- [[useCodingUi/dialog|useCodingUi.dialog]] · hook (destructured)
- [[useCodingUi/history|useCodingUi.history]] · hook (destructured)
- [[showAllCoders|useCodingUi.showAllCoders]] · hook (destructured)
- [[useCodingUi/view|useCodingUi.view]] · hook (destructured)
- [[useStore/coding|useStore.coding]] · selector
- [[dataset|useStore.dataset]] · selector

## Writes
- [[activeDocId|useCodingUi.activeDocId]] · set alias
- [[useCodingUi/dialog|useCodingUi.dialog]] · set alias
- [[showAllCoders|useCodingUi.showAllCoders]] · set alias
- [[useCodingUi/view|useCodingUi.view]] · set alias

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
